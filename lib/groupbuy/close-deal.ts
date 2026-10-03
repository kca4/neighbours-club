/**
 * lib/groupbuy/close-deal.ts
 *
 * Idempotent, resumable deal-closing service.
 *
 * Called by:
 *   - /api/cron/close-deals (daily reconciliation sweep)
 *   - /api/webhooks/qstash/close-deal (one-shot deadline trigger)
 *
 * State machine:
 *   OPEN + past deadline
 *     threshold met  → CLOSING_SUCCESS → (capture each AUTHORIZED order) → FULFILLING
 *     threshold miss → CLOSING_FAILED  → (void all active orders)         → CANCELLED
 *   CLOSING_SUCCESS (interrupted) → resume only unfinished captures → FULFILLING when done
 *   CLOSING_FAILED  (interrupted) → resume only unfinished voids    → CANCELLED when done
 *   FULFILLING / COMPLETED / CANCELLED / DRAFT → NO_OP
 *
 * Idempotency guarantees:
 *   - Branch determination only runs once (OPEN→CLOSING_* transition).
 *   - Captures use Stripe idempotency keys (groupbuy_capture_<dealId>_<orderId>).
 *   - Already-terminal orders (CAPTURED, VOIDED, CAPTURE_FAILED) are skipped.
 *   - CP grants deduplicated by earnCP's @@unique([walletId, referenceId, reason]) constraint.
 *   - Member emails tracked in AuditLog; Resend idempotency keys prevent provider-level dups.
 *
 * Email state machine (per order per event):
 *   No AuditLog entry                   → attempt send; on success write SENT
 *   ATTEMPTED entry exists, no SENT     → retry with same Resend idempotency key
 *   SENT entry exists                   → skip
 *   ATTEMPTED count > CAPTURE_FAILED_MAX_ATTEMPTS (no SENT) → alert admin
 */

import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { DealStatus, OrderStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import {
  sendDealClosedSuccess,
  sendDealClosedFailed,
  sendOrderCaptureFailed,
} from '@/lib/email';
import { sendRecoveryExpiredEmailForOrder } from './recovery-expiry';
import { earnCP } from '@/lib/cp';
import { CP_REWARDS } from '@/lib/cp/rewards';
import { captureIdempotencyKey } from './capture-key';
import {
  type CloseEmailEvent,
  emailIdempotencyKey,
  EMAIL_AUDIT_ATTEMPTED,
  EMAIL_AUDIT_SENT,
} from './email-events';

const CAPTURE_FAILED_MAX_ATTEMPTS = 3;
// Safety margin: reject a capture if auth expires within this many minutes
const AUTH_EXPIRY_SAFETY_MINUTES = parseInt(
  process.env.AUTH_EXPIRY_SAFETY_MINUTES ?? '30',
  10,
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type CloseOneDealResult = {
  dealId: string;
  outcome:
    | 'NO_OP'           // deal is terminal, draft, or deadline not yet reached
    | 'NOT_YET'         // deadline not reached
    | 'CLOSED_SUCCESS'  // newly branched as success
    | 'CLOSED_FAILED'   // newly branched as failure
    | 'RESUMED';        // continued from prior interrupted close
  capturedCount: number;
  captureFailedCount: number;
  voidedCount: number;
  emailErrors: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isAlreadyCaptured(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === 'charge_already_captured' ||
    (e?.message ?? '').toLowerCase().includes('already been captured') ||
    (e?.message ?? '').toLowerCase().includes('already captured')
  );
}

function isAlreadyCanceled(err: unknown): boolean {
  const e = err as { message?: string };
  return (
    (e?.message ?? '').toLowerCase().includes('already canceled') ||
    (e?.message ?? '').toLowerCase().includes('already cancelled') ||
    (e?.message ?? '').toLowerCase().includes('cannot be canceled') ||
    (e?.message ?? '').toLowerCase().includes('cannot be cancelled')
  );
}

async function vestGroupBuyReward(userId: string, orderId: string): Promise<void> {
  try {
    await earnCP({
      userId,
      amount: CP_REWARDS.group_buy_reward,
      reason: 'group_buy_reward',
      referenceId: `group_buy_reward:${orderId}`,
    });
  } catch (err) {
    console.error(
      '[close-deal] vestGroupBuyReward unexpected error for order',
      orderId,
      err,
    );
  }
}

/** Returns true if `capture_before` is expired or will expire within the safety margin. */
function isAuthExpiredOrExpiring(captureBeforeAt: Date | null, now: Date): boolean {
  if (!captureBeforeAt) return false; // no data — fail open (let Stripe reject)
  const safetyMs = AUTH_EXPIRY_SAFETY_MINUTES * 60 * 1000;
  return captureBeforeAt.getTime() - now.getTime() < safetyMs;
}

// ─── Email idempotency helpers ─────────────────────────────────────────────────

type EmailStateResult = 'already_sent' | 'retrying' | 'fresh';

async function getEmailState(
  orderId: string,
  event: CloseEmailEvent,
): Promise<{ state: EmailStateResult; attemptCount: number }> {
  const [sentEntry, attemptCount] = await Promise.all([
    prisma.auditLog.findFirst({
      where: { action: EMAIL_AUDIT_SENT(event), entityId: orderId },
      select: { id: true },
    }),
    prisma.auditLog.count({
      where: { action: EMAIL_AUDIT_ATTEMPTED(event), entityId: orderId },
    }),
  ]);

  if (sentEntry) return { state: 'already_sent', attemptCount };
  if (attemptCount > 0) return { state: 'retrying', attemptCount };
  return { state: 'fresh', attemptCount };
}

async function markEmailAttempted(orderId: string, event: CloseEmailEvent): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: EMAIL_AUDIT_ATTEMPTED(event),
      entityType: 'Order',
      entityId: orderId,
      metadata: { idempotencyKey: emailIdempotencyKey(event, orderId) },
    },
  });
}

async function markEmailSent(orderId: string, event: CloseEmailEvent): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: EMAIL_AUDIT_SENT(event),
      entityType: 'Order',
      entityId: orderId,
      metadata: { idempotencyKey: emailIdempotencyKey(event, orderId) },
    },
  });
}

// ─── Per-order email senders with idempotency ─────────────────────────────────

interface OrderEmailContext {
  orderId: string;
  to: string;
  memberName: string | null;
  dealTitle: string;
}

interface DealSuccessEmailContext extends OrderEmailContext {
  finalPricePerUnit: number;
  quantity: number;
  totalCharged: number;
  pickupLocation: string;
  pickupAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  pickupInstructions?: string | null;
}

/**
 * Sends the "deal succeeded" email to a captured member.
 * Idempotent: writes ATTEMPTED before calling Resend, SENT on success.
 * Returns an error string if the send ultimately fails, null on success/skip.
 */
async function sendSuccessEmail(ctx: DealSuccessEmailContext): Promise<string | null> {
  const event: CloseEmailEvent = 'DEAL_SUCCESS';
  const { state } = await getEmailState(ctx.orderId, event);
  if (state === 'already_sent') return null;

  await markEmailAttempted(ctx.orderId, event);
  const key = emailIdempotencyKey(event, ctx.orderId);

  const sent = await sendDealClosedSuccess({
    to: ctx.to,
    memberName: ctx.memberName ?? '',
    dealTitle: ctx.dealTitle,
    finalPricePerUnit: ctx.finalPricePerUnit,
    quantity: ctx.quantity,
    totalCharged: ctx.totalCharged,
    pickupLocation: ctx.pickupLocation,
    pickupAddress: ctx.pickupAddress,
    pickupWindowStart: ctx.pickupWindowStart,
    pickupWindowEnd: ctx.pickupWindowEnd,
    pickupInstructions: ctx.pickupInstructions,
    idempotencyKey: key,
  });

  if (sent) {
    await markEmailSent(ctx.orderId, event);
    return null;
  }
  return `DEAL_SUCCESS email failed for order ${ctx.orderId}`;
}

/**
 * Sends the "deal failed / void" email to a voided member.
 * Idempotent: same state machine as sendSuccessEmail.
 */
async function sendFailedEmail(ctx: OrderEmailContext): Promise<string | null> {
  const event: CloseEmailEvent = 'DEAL_FAILED';
  const { state } = await getEmailState(ctx.orderId, event);
  if (state === 'already_sent') return null;

  await markEmailAttempted(ctx.orderId, event);
  const key = emailIdempotencyKey(event, ctx.orderId);

  const sent = await sendDealClosedFailed({
    to: ctx.to,
    memberName: ctx.memberName ?? '',
    dealTitle: ctx.dealTitle,
    idempotencyKey: key,
  });

  if (sent) {
    await markEmailSent(ctx.orderId, event);
    return null;
  }
  return `DEAL_FAILED email failed for order ${ctx.orderId}`;
}

/**
 * Sends the capture-failed recovery email.
 *
 * Stricter rule (per spec):
 * - NEVER marks SENT before provider accepts.
 * - If send fails, state remains ATTEMPTED → retryable with same key.
 * - Returns error string (not null) so caller can decide to alert admin.
 * - If ATTEMPTED count >= CAPTURE_FAILED_MAX_ATTEMPTS, returns special marker
 *   so the caller sends an admin alert instead of another member email.
 * - If recoveryExpiresAt is in the past at send time, routes to cancellation
 *   email instead (the recovery window has already closed).
 */
async function sendCaptureFailedEmail(
  ctx: OrderEmailContext & { amountOwed: number; recoveryToken: string; recoveryExpiresAt: Date | null },
): Promise<string | null> {
  const event: CloseEmailEvent = 'CAPTURE_FAILED_RECOVERY';
  const { state, attemptCount } = await getEmailState(ctx.orderId, event);

  if (state === 'already_sent') return null;

  // Send-time deadline check: if the recovery window has already closed,
  // send the cancellation notification instead of the recovery link.
  if (ctx.recoveryExpiresAt && ctx.recoveryExpiresAt <= new Date()) {
    return sendRecoveryExpiredEmailForOrder(ctx.orderId);
  }

  if (attemptCount >= CAPTURE_FAILED_MAX_ATTEMPTS) {
    return `CAPTURE_FAILED_RECOVERY_EMAIL_MAX_ATTEMPTS:${ctx.orderId}`;
  }

  await markEmailAttempted(ctx.orderId, event);
  const key = emailIdempotencyKey(event, ctx.orderId);

  const sent = await sendOrderCaptureFailed({
    to: ctx.to,
    memberName: ctx.memberName ?? '',
    dealTitle: ctx.dealTitle,
    amountOwed: ctx.amountOwed,
    recoveryToken: ctx.recoveryToken,
    recoveryExpiresAt: ctx.recoveryExpiresAt,
    idempotencyKey: key,
  });

  if (sent) {
    await markEmailSent(ctx.orderId, event);
    return null;
  }
  // Send failed — state remains ATTEMPTED → next call will retry with same key
  return `CAPTURE_FAILED_RECOVERY email failed for order ${ctx.orderId}`;
}

// ─── Branch helpers ───────────────────────────────────────────────────────────

type DealWithOrdersAndTiers = Prisma.DealGetPayload<{
  include: {
    tiers: true;
    orders: { include: { user: { select: { id: true; email: true; name: true } } } };
  };
}>;

function determineBranch(deal: DealWithOrdersAndTiers): {
  meetsThreshold: boolean;
  finalTier: DealWithOrdersAndTiers['tiers'][number] | null;
  tierIndex: number;
} {
  const authorizedCount = deal.orders.filter(
    (o) => o.status === OrderStatus.AUTHORIZED,
  ).length;

  const sortedTiers = [...deal.tiers].sort((a, b) => a.tierOrder - b.tierOrder);
  const finalTier =
    [...sortedTiers].reverse().find((t) => authorizedCount >= t.minMembers) ?? null;
  const tierIndex = finalTier
    ? sortedTiers.findIndex((t) => t.id === finalTier.id)
    : -1;
  const meetsThreshold = authorizedCount >= deal.minimumMembers && finalTier !== null;

  return { meetsThreshold, finalTier, tierIndex };
}

// ─── Main service function ────────────────────────────────────────────────────

export async function closeOneDeal(
  dealId: string,
  now: Date = new Date(),
): Promise<CloseOneDealResult> {
  const result: CloseOneDealResult = {
    dealId,
    outcome: 'NO_OP',
    capturedCount: 0,
    captureFailedCount: 0,
    voidedCount: 0,
    emailErrors: [],
  };

  // ── Fetch deal with ALL orders (not just active ones) ──────────────────────
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      tiers: { orderBy: { tierOrder: 'asc' } },
      orders: {
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });

  if (!deal) return result;

  // ── Gate: already terminal ─────────────────────────────────────────────────
  const TERMINAL: DealStatus[] = [
    DealStatus.FULFILLING,
    DealStatus.COMPLETED,
    DealStatus.CANCELLED,
    DealStatus.DRAFT,
  ];
  if (TERMINAL.includes(deal.status)) return result;

  // ── Gate: deadline not yet reached ────────────────────────────────────────
  if (deal.status === DealStatus.OPEN && deal.closesAt > now) {
    return { ...result, outcome: 'NOT_YET' };
  }

  // ── Determine / confirm branch ─────────────────────────────────────────────
  let isSuccess: boolean;
  let tierPrice: number;

  if (deal.status === DealStatus.OPEN) {
    // First time: determine which branch
    const { meetsThreshold, finalTier, tierIndex } = determineBranch(deal);
    isSuccess = meetsThreshold;

    if (isSuccess && finalTier) {
      tierPrice = Number(finalTier.pricePerUnit);
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: DealStatus.CLOSING_SUCCESS,
          finalPrice: tierPrice,
          finalTierIndex: tierIndex,
          closingProcessedAt: now,
        },
      });
      deal.status = DealStatus.CLOSING_SUCCESS;
      result.outcome = 'CLOSED_SUCCESS';
    } else {
      tierPrice = 0;
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: DealStatus.CLOSING_FAILED,
          closingProcessedAt: now,
        },
      });
      deal.status = DealStatus.CLOSING_FAILED;
      result.outcome = 'CLOSED_FAILED';
    }
  } else if (deal.status === DealStatus.CLOSING_SUCCESS) {
    // Resuming a success branch — final price already stored
    tierPrice = deal.finalPrice ? Number(deal.finalPrice) : 0;
    isSuccess = true;
    result.outcome = 'RESUMED';
  } else {
    // CLOSING_FAILED — resuming void branch
    tierPrice = 0;
    isSuccess = false;
    result.outcome = 'RESUMED';
  }

  // ── Branch A: capture AUTHORIZED orders ───────────────────────────────────
  if (isSuccess) {
    const authorizedOrders = deal.orders.filter(
      (o) => o.status === OrderStatus.AUTHORIZED,
    );

    for (const order of authorizedOrders) {
      const captureAmountCents = Math.round(tierPrice * order.quantity * 100);
      const finalAmountDollars = tierPrice * order.quantity;

      // ── Pre-capture auth expiry check ──────────────────────────────────────
      // NOTE: order.captureBeforeAt is new in this migration. If null (old orders),
      // we skip the check and let Stripe reject if truly expired.
      const captureBeforeAt = (order as { captureBeforeAt?: Date | null }).captureBeforeAt ?? null;
      if (isAuthExpiredOrExpiring(captureBeforeAt, now)) {
        console.warn(
          '[close-deal] Skipping capture — auth expiry too close or expired for order',
          order.id,
          'captureBeforeAt:',
          captureBeforeAt,
        );
        // Treat as capture failure to generate recovery path for the member
        const recoveryToken = crypto.randomUUID();
        const recoveryExpiresAt = deal.supplierCutoffAt ?? null;
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CAPTURE_FAILED, recoveryToken, recoveryExpiresAt },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ORDER_CAPTURE_FAILED_AUTH_EXPIRED',
              entityType: 'Order',
              entityId: order.id,
              metadata: {
                dealId: deal.id,
                captureBeforeAt: captureBeforeAt?.toISOString() ?? null,
                safetyMinutes: AUTH_EXPIRY_SAFETY_MINUTES,
                recoveryExpiresAt: recoveryExpiresAt?.toISOString() ?? null,
              },
            },
          }),
        ]);
        const emailErr = await sendCaptureFailedEmail({
          orderId: order.id,
          to: order.user.email,
          memberName: order.user.name,
          dealTitle: deal.title,
          amountOwed: finalAmountDollars,
          recoveryToken,
          recoveryExpiresAt,
        });
        if (emailErr) result.emailErrors.push(emailErr);
        result.captureFailedCount++;
        continue;
      }

      // ── Normal capture path ────────────────────────────────────────────────
      try {
        if (order.stripePaymentIntentId) {
          await stripe.paymentIntents.capture(
            order.stripePaymentIntentId,
            { amount_to_capture: captureAmountCents },
            { idempotencyKey: captureIdempotencyKey(deal.id, order.id) },
          );
        }

        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: {
              status: OrderStatus.CAPTURED,
              finalAmount: finalAmountDollars,
            },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ORDER_CAPTURED',
              entityType: 'Order',
              entityId: order.id,
              metadata: {
                dealId: deal.id,
                captureAmountCents,
                finalAmountDollars,
                stripePaymentIntentId: order.stripePaymentIntentId,
              },
            },
          }),
        ]);

        await vestGroupBuyReward(order.user.id, order.id);
        result.capturedCount++;
      } catch (err: unknown) {
        if (isAlreadyCaptured(err)) {
          // Idempotent path: Stripe already processed this capture.
          // Repair the DB state if the previous cron crashed after Stripe but
          // before the DB write.
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CAPTURED,
                finalAmount: finalAmountDollars,
              },
            }),
            prisma.auditLog.create({
              data: {
                action: 'ORDER_CAPTURED',
                entityType: 'Order',
                entityId: order.id,
                metadata: {
                  dealId: deal.id,
                  idempotent: true,
                  stripePaymentIntentId: order.stripePaymentIntentId,
                },
              },
            }),
          ]);
          await vestGroupBuyReward(order.user.id, order.id);
          result.capturedCount++;
          continue;
        }

        const e = err as { message?: string };
        console.error('[close-deal] Capture failed for order', order.id, e?.message);

        const recoveryToken = crypto.randomUUID();
        const recoveryExpiresAt = deal.supplierCutoffAt ?? null;
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.CAPTURE_FAILED, recoveryToken, recoveryExpiresAt },
          }),
          prisma.auditLog.create({
            data: {
              action: 'ORDER_CAPTURE_FAILED',
              entityType: 'Order',
              entityId: order.id,
              metadata: {
                dealId: deal.id,
                stripeError: e?.message ?? null,
                stripePaymentIntentId: order.stripePaymentIntentId,
                recoveryToken,
                recoveryExpiresAt: recoveryExpiresAt?.toISOString() ?? null,
              },
            },
          }),
        ]);

        const emailErr = await sendCaptureFailedEmail({
          orderId: order.id,
          to: order.user.email,
          memberName: order.user.name,
          dealTitle: deal.title,
          amountOwed: finalAmountDollars,
          recoveryToken,
          recoveryExpiresAt,
        });
        if (emailErr) result.emailErrors.push(emailErr);
        result.captureFailedCount++;
      }
    }

    // ── Void PENDING_AUTHORIZATION stragglers ─────────────────────────────────
    for (const order of deal.orders.filter(
      (o) => o.status === OrderStatus.PENDING_AUTHORIZATION,
    )) {
      if (order.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
        } catch (err: unknown) {
          if (!isAlreadyCanceled(err)) {
            const e = err as { message?: string };
            console.warn(
              '[close-deal] Could not cancel pending PI:',
              order.stripePaymentIntentId,
              e?.message,
            );
          }
        }
      }
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.VOIDED },
        }),
        prisma.auditLog.create({
          data: {
            action: 'ORDER_VOIDED_BY_DEAL_CLOSURE_PENDING',
            entityType: 'Order',
            entityId: order.id,
            metadata: { dealId: deal.id, stripePaymentIntentId: order.stripePaymentIntentId },
          },
        }),
      ]);
      result.voidedCount++;
    }

    // ── Check if all orders are now terminal → transition to FULFILLING ───────
    const remainingAuthorized = await prisma.order.count({
      where: { dealId: deal.id, status: OrderStatus.AUTHORIZED },
    });

    if (remainingAuthorized === 0) {
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: deal.id },
          data: { status: DealStatus.FULFILLING },
        }),
        prisma.auditLog.create({
          data: {
            action: 'DEAL_CLOSED_SUCCESS',
            entityType: 'Deal',
            entityId: deal.id,
            metadata: {
              capturedCount: result.capturedCount,
              captureFailedCount: result.captureFailedCount,
              voidedPendingCount: result.voidedCount,
            },
          },
        }),
      ]);

      // ── Send success emails to captured members ────────────────────────────
      // Re-query for current captured orders to build email context correctly.
      const capturedOrders = await prisma.order.findMany({
        where: { dealId: deal.id, status: OrderStatus.CAPTURED },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      for (const o of capturedOrders) {
        const emailErr = await sendSuccessEmail({
          orderId: o.id,
          to: o.user.email,
          memberName: o.user.name,
          dealTitle: deal.title,
          finalPricePerUnit: tierPrice,
          quantity: o.quantity,
          totalCharged: tierPrice * o.quantity,
          pickupLocation: deal.pickupLocation,
          pickupAddress: deal.pickupAddress,
          pickupWindowStart: deal.pickupWindowStart,
          pickupWindowEnd: deal.pickupWindowEnd,
          pickupInstructions: deal.pickupInstructions,
        });
        if (emailErr) result.emailErrors.push(emailErr);
      }
    }
  }

  // ── Branch B: void active orders (threshold not met) ──────────────────────
  if (!isSuccess) {
    const activeOrders = deal.orders.filter(
      (o) =>
        o.status === OrderStatus.AUTHORIZED ||
        o.status === OrderStatus.PENDING_AUTHORIZATION,
    );

    for (const order of activeOrders) {
      if (order.stripePaymentIntentId) {
        try {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
        } catch (err: unknown) {
          if (!isAlreadyCanceled(err)) {
            const e = err as { message?: string };
            console.warn(
              '[close-deal] Could not cancel PI for failed deal:',
              order.stripePaymentIntentId,
              e?.message,
            );
          }
        }
      }
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.VOIDED },
        }),
        prisma.auditLog.create({
          data: {
            action: 'ORDER_VOIDED_BY_THRESHOLD_NOT_MET',
            entityType: 'Order',
            entityId: order.id,
            metadata: {
              dealId: deal.id,
              threshold: deal.minimumMembers,
              stripePaymentIntentId: order.stripePaymentIntentId,
            },
          },
        }),
      ]);
      result.voidedCount++;
    }

    // ── Check if all orders are terminal → transition to CANCELLED ─────────
    const remainingActive = await prisma.order.count({
      where: {
        dealId: deal.id,
        status: { in: [OrderStatus.AUTHORIZED, OrderStatus.PENDING_AUTHORIZATION] },
      },
    });

    if (remainingActive === 0) {
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: deal.id },
          data: { status: DealStatus.CANCELLED },
        }),
        prisma.auditLog.create({
          data: {
            action: 'DEAL_CLOSED_FAILED',
            entityType: 'Deal',
            entityId: deal.id,
            metadata: {
              threshold: deal.minimumMembers,
              voidedCount: result.voidedCount,
            },
          },
        }),
      ]);

      // ── Send void emails ───────────────────────────────────────────────────
      // Re-query for voided orders in this deal
      const voidedOrders = await prisma.order.findMany({
        where: { dealId: deal.id, status: OrderStatus.VOIDED },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      for (const o of voidedOrders) {
        const emailErr = await sendFailedEmail({
          orderId: o.id,
          to: o.user.email,
          memberName: o.user.name,
          dealTitle: deal.title,
        });
        if (emailErr) result.emailErrors.push(emailErr);
      }
    }
  }

  return result;
}
