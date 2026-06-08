/**
 * DEV-ONLY — POST /api/dev/settle-delivery-payment
 *
 * Invokes the exact same post-payment settlement path that the Stripe
 * payment_intent.succeeded webhook runs: PENDING_PAYMENT → PENDING +
 * dispatchStartedAt + CP waiver burn (if applicable).
 *
 * Use this when stripe listen is unavailable and you need to exercise the
 * settlement logic for a given order — e.g. after flipping an order to
 * PENDING_PAYMENT manually in Prisma Studio.
 *
 * Refuses to run in any environment where NODE_ENV !== 'development'.
 *
 * Usage:
 *   curl -X POST http://localhost:3000/api/dev/settle-delivery-payment \
 *     -H "Content-Type: application/json" \
 *     -d '{"orderId":"<cuid>"}'
 */
import { NextRequest, NextResponse } from 'next/server'
import { settleDeliveryPayment } from '@/lib/delivery/settlement'

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev-only endpoint — not available in production.' },
      { status: 403 },
    )
  }

  let orderId: unknown
  try {
    const body = await req.json()
    orderId = body.orderId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!orderId || typeof orderId !== 'string') {
    return NextResponse.json({ error: 'orderId (string) is required.' }, { status: 400 })
  }

  await settleDeliveryPayment(orderId)
  return NextResponse.json({ ok: true, orderId })
}
