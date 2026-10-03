/**
 * POST /api/webhooks/qstash/close-deal
 *
 * Receives a one-time delayed QStash message enqueued when a deal is published.
 * Verifies the QStash signature, then calls closeOneDeal(dealId).
 *
 * Security: QStash signature verification uses @upstash/qstash Receiver.
 * Env vars:
 *   QSTASH_CURRENT_SIGNING_KEY
 *   QSTASH_NEXT_SIGNING_KEY
 *
 * Idempotency: closeOneDeal is idempotent, so duplicate deliveries are safe.
 * If the deal has already been closed/cancelled before this message arrives,
 * closeOneDeal returns NO_OP immediately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Receiver } from '@upstash/qstash';
import { closeOneDeal } from '@/lib/groupbuy/close-deal';
import { sendAdminAlert } from '@/lib/admin-alert';

export const dynamic = 'force-dynamic';

function getReceiver(): Receiver {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentKey || !nextKey) {
    throw new Error(
      '[qstash-endpoint] QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY must be set',
    );
  }
  return new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey });
}

export async function POST(req: NextRequest) {
  // ── Signature verification ─────────────────────────────────────────────────
  const rawBody = await req.text();
  const signature = req.headers.get('upstash-signature') ?? '';

  let verified = false;
  try {
    const receiver = getReceiver();
    verified = await receiver.verify({
      signature,
      body: rawBody,
    });
  } catch (err) {
    console.error('[qstash-endpoint] Signature verification error:', err);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  if (!verified) {
    return NextResponse.json({ error: 'Invalid QStash signature' }, { status: 401 });
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: { dealId?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { dealId } = body;
  if (!dealId || typeof dealId !== 'string') {
    return NextResponse.json({ error: 'Missing dealId' }, { status: 400 });
  }

  // ── Execute close ──────────────────────────────────────────────────────────
  try {
    const result = await closeOneDeal(dealId);

    // Alert on email errors
    for (const emailErr of result.emailErrors) {
      const isMaxAttempts = emailErr.startsWith('CAPTURE_FAILED_RECOVERY_EMAIL_MAX_ATTEMPTS:');
      if (isMaxAttempts) {
        const orderId = emailErr.split(':')[1];
        await sendAdminAlert(
          'CAPTURE_FAILED_EMAIL_MAX_ATTEMPTS',
          `capture_failed_email:${orderId}`,
          `Capture-failed recovery email has exceeded max send attempts for order ${orderId}. Member has NOT been notified.`,
        );
      } else {
        console.error('[qstash-endpoint] Email error during close:', emailErr);
      }
    }

    // Alert if close produced capture failures
    if (result.captureFailedCount > 0) {
      await sendAdminAlert(
        'CAPTURE_FAILED',
        `capture_failed:${dealId}`,
        `Deal ${dealId} close produced ${result.captureFailedCount} CAPTURE_FAILED order(s). Recovery tokens generated.`,
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const e = err as { message?: string };
    console.error('[qstash-endpoint] closeOneDeal threw:', e?.message, err);

    await sendAdminAlert(
      'DEAL_CLOSE_ERROR',
      `close_error:${dealId}`,
      `closeOneDeal threw an unexpected error for deal ${dealId}: ${e?.message ?? String(err)}`,
    );

    // Return 500 so QStash retries the delivery
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
