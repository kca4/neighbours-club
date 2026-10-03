/**
 * lib/__tests__/groupbuy-webhook-auth-expiry.test.ts
 *
 * Tests for the auth-expiry detection added in Issue 2:
 * when payment_intent.amount_capturable_updated fires, the webhook must immediately
 * check whether the Stripe authorization can survive until deal.closesAt + safetyMargin.
 * If not, it voids the order proactively (VOIDED, not CAPTURE_FAILED) and alerts admin.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Module mocks (hoisted before imports) ────────────────────────────────────

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: { constructEvent: vi.fn() },
    paymentIntents: {
      retrieve: vi.fn(),
      cancel: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/email', () => ({
  sendOrderAuthorized: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/admin-alert', () => ({
  sendAdminAlert: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/groupbuy/auth-expiry', () => ({
  calculateSafeRejoinAt: vi.fn(),
  sendAuthExpiryEmailForOrder: vi.fn().mockResolvedValue(null),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { sendOrderAuthorized } from '@/lib/email'
import { sendAdminAlert } from '@/lib/admin-alert'
import { sendAuthExpiryEmailForOrder } from '@/lib/groupbuy/auth-expiry'
import { POST } from '@/app/api/stripe/webhook/route'
import { OrderStatus } from '@prisma/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2026-10-10T12:00:00Z')

/** Builds the order shape returned by prisma.order.findFirst */
function makeOrder(overrides: Partial<{
  dealClosesAt: Date
  status: OrderStatus
}> = {}) {
  return {
    id: 'order-1',
    status: overrides.status ?? OrderStatus.PENDING_AUTHORIZATION,
    quantity: 2,
    maxAuthorizedAmount: 50,
    user: { email: 'member@test.com', name: 'Alice' },
    deal: {
      id: 'deal-1',
      title: 'Test Deal',
      closesAt: overrides.dealClosesAt ?? new Date('2026-10-17T12:00:00Z'), // 7 days from NOW
      pickupLocation: 'Kanata',
      pickupAddress: '1 Test St',
      pickupWindowStart: new Date('2026-10-18T10:00:00Z'),
      pickupWindowEnd: new Date('2026-10-18T12:00:00Z'),
      supplier: { name: 'Acme Supplier' },
    },
  }
}

/** Builds an expanded PaymentIntent with charge.payment_method_details.card.capture_before */
function makeExpandedPi(captureBeforeDate: Date | null) {
  return {
    id: 'pi_test',
    latest_charge: captureBeforeDate
      ? {
          payment_method_details: {
            card: { capture_before: Math.floor(captureBeforeDate.getTime() / 1000) },
          },
        }
      : { payment_method_details: { card: {} } },
  }
}

/** Builds the Stripe event that the mock constructEvent will return */
function makeAmountCapturableEvent() {
  return {
    id: 'evt_test',
    type: 'payment_intent.amount_capturable_updated',
    data: { object: { id: 'pi_test', amount_capturable: 5000 } },
  }
}

/** Calls POST with a dummy request — signature check is bypassed via mock */
function callWebhook() {
  const req = new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': 'test-sig', 'content-type': 'text/plain' },
    body: '{}',
  })
  return POST(req)
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
  process.env.AUTH_EXPIRY_SAFETY_MINUTES = '30'

  // Default: constructEvent returns our test event
  vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(makeAmountCapturableEvent() as never)

  // Default: $transaction executes callbacks passed to it
  vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown) => {
    if (Array.isArray(ops)) {
      for (const op of ops) await op
    }
    return []
  })

  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  vi.mocked(prisma.order.update).mockResolvedValue({} as never)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('payment_intent.amount_capturable_updated — auth expiry detection', () => {
  it('Test A: auth expires well after closesAt+margin — stays AUTHORIZED, sends confirmation email', async () => {
    // Deal closes in 7 days; auth valid for 8 days — survives by 1 day minus 30min margin
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)
    const captureBeforeAt = new Date(NOW.getTime() + 8 * 24 * 60 * 60 * 1000) // 8 days from now

    vi.mocked(prisma.order.findFirst).mockResolvedValue(makeOrder({ dealClosesAt }) as never)
    vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue(
      makeExpandedPi(captureBeforeAt) as never,
    )

    const res = await callWebhook()
    expect(res.status).toBe(200)

    // Order should NOT be voided
    const voidCalls = vi.mocked(prisma.$transaction).mock.calls.filter(call => {
      // Look for a transaction that includes an order.update to VOIDED
      return String(call).includes('VOIDED')
    })
    expect(voidCalls.length).toBe(0)

    // PI should NOT be cancelled
    expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled()

    // Admin should NOT be alerted
    expect(sendAdminAlert).not.toHaveBeenCalled()

    // Confirmation email should be sent
    expect(sendOrderAuthorized).toHaveBeenCalledOnce()
  })

  it('Test B: auth expires before closesAt+margin — order voided, PI cancelled, admin alerted, no confirmation email', async () => {
    // Deal closes in 5 days; auth only valid for 3 days — will expire before close
    const dealClosesAt = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000)
    const captureBeforeAt = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000) // expires too soon

    vi.mocked(prisma.order.findFirst).mockResolvedValue(makeOrder({ dealClosesAt }) as never)
    vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue(
      makeExpandedPi(captureBeforeAt) as never,
    )

    const res = await callWebhook()
    expect(res.status).toBe(200)

    // Order must be transitioned to VOIDED
    const updateCalls = vi.mocked(prisma.order.update).mock.calls
    const voidCall = updateCalls.find(
      c => (c[0] as { data: { status?: string } }).data?.status === OrderStatus.VOIDED,
    )
    expect(voidCall).toBeDefined()

    // AuditLog entry with ORDER_VOIDED_AUTH_EXPIRY_RISK
    const auditCalls = vi.mocked(prisma.auditLog.create).mock.calls
    const expiryAudit = auditCalls.find(
      c => (c[0] as { data: { action: string } }).data?.action === 'ORDER_VOIDED_AUTH_EXPIRY_RISK',
    )
    expect(expiryAudit).toBeDefined()

    // PI must be cancelled
    expect(stripe.paymentIntents.cancel).toHaveBeenCalledWith('pi_test')

    // Admin must be alerted with AUTH_EXPIRY_RISK
    expect(sendAdminAlert).toHaveBeenCalledWith(
      'AUTH_EXPIRY_RISK',
      'auth_expiry:order-1',
      expect.stringContaining('voided'),
    )

    // Auth-expiry member email must be dispatched (awaited first attempt)
    expect(sendAuthExpiryEmailForOrder).toHaveBeenCalledWith('order-1')

    // Confirmation email must NOT be sent
    expect(sendOrderAuthorized).not.toHaveBeenCalled()
  })

  it('Test C: charge has no capture_before — no intervention, order stays AUTHORIZED, confirmation email sent', async () => {
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)

    vi.mocked(prisma.order.findFirst).mockResolvedValue(makeOrder({ dealClosesAt }) as never)
    // Expanded PI has no capture_before on the card
    vi.mocked(stripe.paymentIntents.retrieve).mockResolvedValue(
      makeExpandedPi(null) as never,
    )

    const res = await callWebhook()
    expect(res.status).toBe(200)

    // No void
    expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled()
    expect(sendAdminAlert).not.toHaveBeenCalled()

    // Confirmation email sent normally
    expect(sendOrderAuthorized).toHaveBeenCalledOnce()
  })

  it('Test D: Stripe retrieve throws — error caught, no intervention, confirmation email still sent', async () => {
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)

    vi.mocked(prisma.order.findFirst).mockResolvedValue(makeOrder({ dealClosesAt }) as never)
    vi.mocked(stripe.paymentIntents.retrieve).mockRejectedValue(new Error('Stripe network error'))

    const res = await callWebhook()
    expect(res.status).toBe(200)

    // No void or cancel — the catch block handles the error non-fatally
    expect(stripe.paymentIntents.cancel).not.toHaveBeenCalled()
    expect(sendAdminAlert).not.toHaveBeenCalled()

    // Confirmation email is still sent (voidedDueToExpiry defaults to false)
    expect(sendOrderAuthorized).toHaveBeenCalledOnce()
  })
})
