/**
 * Deal-closure reconciliation cron — POST /api/cron/close-deals
 *
 * Auth: Accepts EITHER of:
 *   - x-cron-secret header matching CRON_SECRET env var  (local dev / manual invocation)
 *   - x-vercel-cron header set by Vercel Cron in production
 *
 * Schedule: daily at 04:00 UTC (see vercel.json) — RECONCILIATION only.
 * Primary deal-close triggers are one-shot QStash messages enqueued at publish time.
 *
 * This job repairs three classes of deals that QStash did not (or could not) handle:
 *   1. OPEN deals past their deadline (QStash message lost or not enqueued)
 *   2. CLOSING_SUCCESS deals with unfinished captures (process crashed mid-loop)
 *   3. CLOSING_FAILED deals with unfinished voids (process crashed mid-loop)
 *
 * All three cases delegate to closeOneDeal(), which is idempotent and resumable.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DealStatus, OrderStatus } from '@prisma/client';
import { closeOneDeal } from '@/lib/groupbuy/close-deal';
import { sendAdminAlert } from '@/lib/admin-alert';
import { sendAuthExpiryEmailForOrder } from '@/lib/groupbuy/auth-expiry';

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  const vercelCron = req.headers.get('x-vercel-cron');

  const authorized =
    vercelCron === '1' ||
    (cronSecret && cronSecret === process.env.CRON_SECRET);

  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // ── 1. OPEN deals past deadline ────────────────────────────────────────────
  const overdueOpen = await prisma.deal.findMany({
    where: {
      status: DealStatus.OPEN,
      closesAt: { lte: now },
    },
    select: { id: true },
  });

  // ── 2. CLOSING_SUCCESS with unfinished captures ────────────────────────────
  const stuckSuccess = await prisma.deal.findMany({
    where: {
      status: DealStatus.CLOSING_SUCCESS,
      orders: { some: { status: OrderStatus.AUTHORIZED } },
    },
    select: { id: true },
  });

  // ── 3. CLOSING_FAILED with unfinished voids ────────────────────────────────
  const stuckFailed = await prisma.deal.findMany({
    where: {
      status: DealStatus.CLOSING_FAILED,
      orders: {
        some: {
          status: { in: [OrderStatus.AUTHORIZED, OrderStatus.PENDING_AUTHORIZATION] },
        },
      },
    },
    select: { id: true },
  });

  const dealIds = [
    ...new Set([
      ...overdueOpen.map((d) => d.id),
      ...stuckSuccess.map((d) => d.id),
      ...stuckFailed.map((d) => d.id),
    ]),
  ];

  const results = [];

  for (const dealId of dealIds) {
    try {
      const result = await closeOneDeal(dealId, now);

      // Alert on email errors
      for (const emailErr of result.emailErrors) {
        const isMaxAttempts = emailErr.startsWith(
          'CAPTURE_FAILED_RECOVERY_EMAIL_MAX_ATTEMPTS:',
        );
        if (isMaxAttempts) {
          const orderId = emailErr.split(':')[1];
          await sendAdminAlert(
            'CAPTURE_FAILED_EMAIL_MAX_ATTEMPTS',
            `capture_failed_email:${orderId}`,
            `Capture-failed recovery email has exceeded max send attempts for order ${orderId}.`,
          );
        } else {
          console.error('[close-deals] Email error during close:', emailErr);
        }
      }

      // Alert on capture failures
      if (result.captureFailedCount > 0) {
        await sendAdminAlert(
          'CAPTURE_FAILED',
          `capture_failed:${dealId}`,
          `Reconciliation: deal ${dealId} has ${result.captureFailedCount} CAPTURE_FAILED order(s).`,
        );
      }

      // Alert if deal is stuck despite reconciliation attempt
      if (result.outcome === 'RESUMED' || result.outcome === 'CLOSED_SUCCESS') {
        // Check if deal is STILL in a non-terminal state after processing
        const dealAfter = await prisma.deal.findUnique({
          where: { id: dealId },
          select: { status: true },
        });
        if (
          dealAfter &&
          (dealAfter.status === DealStatus.CLOSING_SUCCESS ||
            dealAfter.status === DealStatus.CLOSING_FAILED)
        ) {
          await sendAdminAlert(
            'DEAL_STUCK',
            `deal_stuck:${dealId}`,
            `Deal ${dealId} remains in ${dealAfter.status} after reconciliation attempt. Manual review needed.`,
          );
        }
      }

      results.push(result);
    } catch (err) {
      const e = err as { message?: string };
      console.error('[close-deals] closeOneDeal threw for deal', dealId, e?.message);

      await sendAdminAlert(
        'DEAL_CLOSE_ERROR',
        `close_error:${dealId}`,
        `Reconciliation: closeOneDeal threw for deal ${dealId}: ${e?.message ?? String(err)}`,
      );

      results.push({ dealId, outcome: 'ERROR', error: e?.message });
    }
  }

  // ── 4. Auth-expiry email retry sweep ──────────────────────────────────────
  // Picks up any auth-expiry notification emails that failed to send (e.g.,
  // transient Resend outage during the webhook invocation). Looks back 7 days
  // to cover the maximum deal window. Each call to sendAuthExpiryEmailForOrder
  // is idempotent: it checks SENT state and skips if already delivered.
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const authExpiryVoids = await prisma.auditLog.findMany({
    where: {
      action: 'ORDER_VOIDED_AUTH_EXPIRY_RISK',
      createdAt: { gte: sevenDaysAgo },
    },
    select: { entityId: true },
    distinct: ['entityId'],
  });

  for (const { entityId: orderId } of authExpiryVoids) {
    const err = await sendAuthExpiryEmailForOrder(orderId);
    if (err) {
      if (err.startsWith('AUTH_EXPIRY_EMAIL_MAX_ATTEMPTS:')) {
        await sendAdminAlert(
          'CLOSE_EMAIL_FAILED',
          `auth_expiry_email:${orderId}`,
          `Auth-expiry notification email exceeded max attempts for order ${orderId}.`,
        );
      } else {
        console.error('[close-deals] Auth-expiry email error for order', orderId, err);
      }
    }
  }

  return NextResponse.json({
    processed: dealIds.length,
    overdue: overdueOpen.length,
    stuckSuccess: stuckSuccess.length,
    stuckFailed: stuckFailed.length,
    authExpiryEmailsSwept: authExpiryVoids.length,
    results,
  });
}
