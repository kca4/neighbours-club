/**
 * lib/groupbuy/qstash.ts
 *
 * QStash helpers for group-buy deadline triggers.
 *
 * Usage pattern:
 *   1. When a deal is published: enqueueCloseMessage(deal.id, deal.closesAt)
 *   2. QStash delivers the message at closesAt + 2 min to /api/webhooks/qstash/close-deal
 *   3. That endpoint calls closeOneDeal(dealId)
 *
 * If the deal is cancelled before the message arrives, the endpoint performs a
 * dead-letter check (deal.status !== OPEN) and returns 200 without processing.
 *
 * Env vars required:
 *   QSTASH_TOKEN              — Upstash API token (server-side only)
 *   QSTASH_CURRENT_SIGNING_KEY — for signature verification
 *   QSTASH_NEXT_SIGNING_KEY   — for signature verification during key rotation
 *   NEXT_PUBLIC_APP_URL       — base URL for the QStash callback endpoint
 */

import { Client } from '@upstash/qstash';

function getClient(): Client {
  const token = process.env.QSTASH_TOKEN;
  if (!token) throw new Error('[qstash] QSTASH_TOKEN env var is not set');
  return new Client({ token });
}

/**
 * Enqueues a one-time delayed message that will call /api/webhooks/qstash/close-deal
 * at deal.closesAt + CLOSE_DELAY_SECONDS.
 *
 * Returns the QStash message ID (store on deal for debugging/cancellation).
 * Returns null if QStash is not configured (dev/CI with QSTASH_TOKEN unset).
 */
const CLOSE_DELAY_SECONDS = parseInt(process.env.QSTASH_CLOSE_DELAY_SECONDS ?? '120', 10);

export async function enqueueCloseMessage(
  dealId: string,
  closesAt: Date,
): Promise<string | null> {
  if (!process.env.QSTASH_TOKEN) {
    console.warn('[qstash] QSTASH_TOKEN not set — skipping enqueue for deal', dealId);
    return null;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const callbackUrl = `${appUrl}/api/webhooks/qstash/close-deal`;
  const notBefore = Math.floor(closesAt.getTime() / 1000) + CLOSE_DELAY_SECONDS;

  const client = getClient();
  const response = await client.publishJSON({
    url: callbackUrl,
    body: { dealId },
    notBefore,
  });

  return response.messageId ?? null;
}

/**
 * Cancels a pending QStash message by message ID.
 * Safe to call if the message has already been delivered or never existed.
 * Returns true if cancelled, false if not found or already delivered.
 */
export async function cancelCloseMessage(messageId: string): Promise<boolean> {
  if (!process.env.QSTASH_TOKEN) return false;
  try {
    const client = getClient();
    await client.messages.delete(messageId);
    return true;
  } catch (err) {
    const e = err as { message?: string };
    // "Not found" is acceptable — message already delivered or never existed
    if ((e?.message ?? '').includes('not found') || (e?.message ?? '').includes('404')) {
      return false;
    }
    console.error('[qstash] cancelCloseMessage error:', e?.message);
    return false;
  }
}
