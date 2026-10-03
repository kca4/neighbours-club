/**
 * lib/groupbuy/auth-expiry.ts
 *
 * Utilities for the authorization-expiry risk flow:
 *   1. calculateSafeRejoinAt — pure formula; also used by the join route to
 *      gate premature rejoins.
 *   2. sendAuthExpiryEmailForOrder — fetches order data, applies ATTEMPTED/SENT
 *      idempotency, calls sendOrderAuthExpired. Called from the webhook (first
 *      attempt) and from the close-deals cron (retry sweep).
 *
 * Email reliability contract (same as CAPTURE_FAILED_RECOVERY):
 *   - ATTEMPTED written before send attempt
 *   - SENT written only after provider accepts
 *   - Bounded retries: AUTH_EXPIRY_MAX_EMAIL_ATTEMPTS (default 3)
 *   - Returns a non-null error string if undeliverable; caller alerts admin
 */

import 'server-only';
import { prisma } from '@/lib/prisma';
import { sendOrderAuthExpired } from '@/lib/email';
import { DealStatus } from '@prisma/client';
import {
  emailIdempotencyKey,
  EMAIL_AUDIT_ATTEMPTED,
  EMAIL_AUDIT_SENT,
} from './email-events';

const AUTH_EXPIRY_MAX_EMAIL_ATTEMPTS = parseInt(
  process.env.AUTH_EXPIRY_MAX_EMAIL_ATTEMPTS ?? '3',
  10,
);

// ─── Safe-rejoin window calculation ──────────────────────────────────────────

/**
 * Calculates the earliest time at which a new card authorization would be
 * expected to survive until deal.closesAt + safetyMinutes.
 *
 * Formula:
 *   authDuration  = captureBeforeAt − orderCreatedAt   (observed from first auth)
 *   safeRejoinAt  = deal.closesAt + safetyMs − authDuration
 *
 * Reasoning: a new auth created at time T will expire at approximately
 *   T + authDuration. For capture to succeed:
 *   T + authDuration ≥ deal.closesAt + safetyMs
 *   → T ≥ deal.closesAt + safetyMs − authDuration = safeRejoinAt
 *
 * canRejoin = safeRejoinAt < deal.closesAt
 *   If false, the auth duration is shorter than the safety margin, meaning
 *   even a last-second rejoin would not produce a surviving authorization.
 *   (Pathological in practice — real cards authorize for 5–7 days.)
 *
 * Uses the actual observed auth duration rather than assuming a universal
 * 7-day window; different card networks and issuers have different policies.
 */
export function calculateSafeRejoinAt(
  captureBeforeAt: Date,
  orderCreatedAt: Date,
  dealClosesAt: Date,
  safetyMinutes: number,
): { safeRejoinAt: Date; canRejoin: boolean } {
  // Defensive floor at 0 in case of clock skew on the stored timestamps
  const authDuration = Math.max(
    0,
    captureBeforeAt.getTime() - orderCreatedAt.getTime(),
  );
  const safetyMs = safetyMinutes * 60 * 1000;
  const safeRejoinAt = new Date(dealClosesAt.getTime() + safetyMs - authDuration);
  const canRejoin = safeRejoinAt < dealClosesAt;
  return { safeRejoinAt, canRejoin };
}

// ─── Email state helpers (scoped to AUTH_EXPIRY event) ───────────────────────

const EVENT = 'AUTH_EXPIRY' as const;

async function getEmailState(
  orderId: string,
): Promise<{ alreadySent: boolean; attemptCount: number }> {
  const [sentEntry, attemptCount] = await Promise.all([
    prisma.auditLog.findFirst({
      where: { action: EMAIL_AUDIT_SENT(EVENT), entityId: orderId },
      select: { id: true },
    }),
    prisma.auditLog.count({
      where: { action: EMAIL_AUDIT_ATTEMPTED(EVENT), entityId: orderId },
    }),
  ]);
  return { alreadySent: !!sentEntry, attemptCount };
}

async function markAttempted(orderId: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: EMAIL_AUDIT_ATTEMPTED(EVENT),
      entityType: 'Order',
      entityId: orderId,
      metadata: { idempotencyKey: emailIdempotencyKey(EVENT, orderId) },
    },
  });
}

async function markSent(orderId: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: EMAIL_AUDIT_SENT(EVENT),
      entityType: 'Order',
      entityId: orderId,
      metadata: { idempotencyKey: emailIdempotencyKey(EVENT, orderId) },
    },
  });
}

// ─── Email send with retry tracking ──────────────────────────────────────────

/**
 * Fetches the order's user + deal context, then sends the auth-expiry
 * notification email with full ATTEMPTED/SENT idempotency.
 *
 * Returns null on success or skip (already sent).
 * Returns a non-null error string if sending failed or max attempts exceeded.
 * Callers should convert MAX_ATTEMPTS errors into admin alerts.
 */
export async function sendAuthExpiryEmailForOrder(
  orderId: string,
): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      createdAt: true,
      captureBeforeAt: true,
      user: { select: { email: true, name: true } },
      deal: {
        select: {
          title: true,
          slug: true,
          closesAt: true,
          status: true,
        },
      },
    },
  });

  if (!order) {
    return `AUTH_EXPIRY email skipped: order ${orderId} not found`;
  }

  const { alreadySent, attemptCount } = await getEmailState(orderId);

  if (alreadySent) return null;

  if (attemptCount >= AUTH_EXPIRY_MAX_EMAIL_ATTEMPTS) {
    return `AUTH_EXPIRY_EMAIL_MAX_ATTEMPTS:${orderId}`;
  }

  // Determine which email variant to send based on state AT SEND TIME.
  //
  // Case A — deal still OPEN + rejoin window computable:
  //   Show safeRejoinAt CTA. Member can re-join once that window opens.
  //
  // Case B — deal still OPEN + auth duration too short for any window:
  //   No rejoin possible (pathological card). Different copy, no CTA.
  //
  // Case C — deal no longer OPEN (closed, cancelled, etc.):
  //   Deal is done. Don't mention rejoin. Copy PENDING COMMUNICATIONS REVIEW.
  //
  // Using deal.status at fetch time (current DB value), not at the moment the
  // expiry was detected. This is intentional: a short send delay (< 1 min in
  // the webhook path, up to cron interval in the retry path) should not cause
  // the member to receive misleading "you can rejoin" copy if the deal closed
  // in the interim.

  const dealIsOpen = order.deal.status === DealStatus.OPEN;

  let safeRejoinAt: Date | null = null;
  let canRejoin = false;

  if (dealIsOpen && order.captureBeforeAt) {
    const safetyMinutes = parseInt(
      process.env.AUTH_EXPIRY_SAFETY_MINUTES ?? '30',
      10,
    );
    const result = calculateSafeRejoinAt(
      order.captureBeforeAt,
      order.createdAt,
      order.deal.closesAt,
      safetyMinutes,
    );
    safeRejoinAt = result.canRejoin ? result.safeRejoinAt : null;
    canRejoin = result.canRejoin;
  }

  const variant: 'rejoin_available' | 'no_rejoin' | 'deal_closed' = !dealIsOpen
    ? 'deal_closed'
    : canRejoin
    ? 'rejoin_available'
    : 'no_rejoin';

  await markAttempted(orderId);

  const sent = await sendOrderAuthExpired({
    to: order.user.email,
    memberName: order.user.name,
    dealTitle: order.deal.title,
    dealSlug: order.deal.slug,
    closesAt: order.deal.closesAt,
    safeRejoinAt,
    variant,
    idempotencyKey: emailIdempotencyKey(EVENT, orderId),
  });

  if (sent) {
    await markSent(orderId);
    return null;
  }

  return `AUTH_EXPIRY email failed for order ${orderId}`;
}
