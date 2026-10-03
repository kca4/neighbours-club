/**
 * lib/groupbuy/recovery-expiry.ts
 *
 * Utilities for the payment-recovery expiry flow:
 *   sendRecoveryExpiredEmailForOrder — fetches order context, applies ATTEMPTED/SENT
 *   idempotency, calls sendOrderRecoveryExpired.
 *
 * Called from:
 *   - app/api/orders/recover/[recoveryToken]/route.ts (when member hits an expired link)
 *   - app/api/cron/cleanup-pending-orders/route.ts   (sweep of expired CAPTURE_FAILED orders)
 *   - lib/groupbuy/close-deal.ts                     (send-time deadline check)
 *
 * Email reliability contract:
 *   - ATTEMPTED written before send attempt
 *   - SENT written only after provider accepts
 *   - Max RECOVERY_EXPIRED_MAX_ATTEMPTS attempts; admin alert on exhaustion
 *   - Failed attempts remain retryable until exhaustion
 */

import 'server-only';
import { prisma } from '@/lib/prisma';
import { sendOrderRecoveryExpired } from '@/lib/email';
import { sendAdminAlert } from '@/lib/admin-alert';
import {
  emailIdempotencyKey,
  EMAIL_AUDIT_ATTEMPTED,
  EMAIL_AUDIT_SENT,
} from './email-events';

const EVENT = 'RECOVERY_EXPIRED' as const;

const RECOVERY_EXPIRED_MAX_ATTEMPTS = parseInt(
  process.env.RECOVERY_EXPIRED_MAX_ATTEMPTS ?? '5',
  10,
);

// ─── Email state helpers ──────────────────────────────────────────────────────

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

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Sends the recovery-expired cancellation email for an order.
 *
 * Returns null on success or skip (already sent).
 * Returns a non-null error string if sending failed or max attempts reached
 * (caller should log and trigger admin alert if appropriate).
 */
export async function sendRecoveryExpiredEmailForOrder(
  orderId: string,
): Promise<string | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      recoveryExpiresAt: true,
      user: { select: { email: true, name: true } },
      deal: { select: { title: true } },
    },
  });

  if (!order) {
    return `RECOVERY_EXPIRED email skipped: order ${orderId} not found`;
  }

  if (!order.recoveryExpiresAt) {
    return `RECOVERY_EXPIRED email skipped: no recoveryExpiresAt on order ${orderId}`;
  }

  const { alreadySent, attemptCount } = await getEmailState(orderId);
  if (alreadySent) return null;

  if (attemptCount >= RECOVERY_EXPIRED_MAX_ATTEMPTS) {
    return `RECOVERY_EXPIRED_EMAIL_MAX_ATTEMPTS:${orderId}`;
  }

  await markAttempted(orderId);

  const sent = await sendOrderRecoveryExpired({
    to: order.user.email,
    memberName: order.user.name,
    dealTitle: order.deal.title,
    recoveryExpiresAt: order.recoveryExpiresAt,
    idempotencyKey: emailIdempotencyKey(EVENT, orderId),
  });

  if (sent) {
    await markSent(orderId);
    return null;
  }

  return `RECOVERY_EXPIRED email failed for order ${orderId}`;
}

/**
 * Handles the error string returned by sendRecoveryExpiredEmailForOrder.
 * Triggers an admin alert if max attempts have been exhausted.
 * Call this whenever you receive a non-null error from sendRecoveryExpiredEmailForOrder.
 */
export async function handleRecoveryExpiredEmailError(
  orderId: string,
  errorStr: string,
): Promise<void> {
  console.error('[recovery-expiry]', errorStr);
  if (errorStr.startsWith('RECOVERY_EXPIRED_EMAIL_MAX_ATTEMPTS:')) {
    await sendAdminAlert(
      'RECOVERY_EXPIRED_EMAIL_MAX_ATTEMPTS',
      `recovery_expired_email_${orderId}`,
      `Recovery-expired cancellation email exhausted ${RECOVERY_EXPIRED_MAX_ATTEMPTS} attempts for order ${orderId}. Member has not been notified of cancellation.`,
    ).catch((e) => console.error('[recovery-expiry] sendAdminAlert failed:', e));
  }
}
