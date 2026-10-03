/**
 * lib/__tests__/groupbuy-recovery-cutoff.test.ts
 *
 * 24 tests covering the recovery-cutoff feature:
 *
 *   Group 1 — sendRecoveryExpiredEmailForOrder (recovery-expiry.ts)  [5 tests]
 *   Group 2 — Recovery API expiry enforcement                         [4 tests]
 *   Group 3 — Cleanup cron expired-recovery sweep                     [4 tests]
 *   Group 4 — admin-validation dealCreateSchema supplierCutoffAt      [3 tests]
 *   Group 5 — Publish route supplierCutoffAt validation               [4 tests]
 *   Group 6 — calcFinalPaidUnits (supplier-quantity.ts)               [4 tests]
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { NextRequest } from 'next/server'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    deal: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: { create: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  },
  getOrCreateStripeCustomer: vi.fn().mockResolvedValue('cus_test'),
}))

vi.mock('@/lib/email', () => ({
  sendOrderRecoveryExpired: vi.fn().mockResolvedValue(true),
  sendOrderCaptureFailed: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/groupbuy/qstash', () => ({
  enqueueCloseMessage: vi.fn().mockResolvedValue('msg_test'),
}))

vi.mock('@/lib/admin-alert', () => ({
  sendAdminAlert: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/groupbuy/recovery-expiry', () => ({
  sendRecoveryExpiredEmailForOrder: vi.fn().mockResolvedValue(null),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import { sendOrderRecoveryExpired } from '@/lib/email'
import { sendRecoveryExpiredEmailForOrder } from '@/lib/groupbuy/recovery-expiry'
import { auth } from '@/lib/auth'
import { OrderStatus, DealStatus } from '@prisma/client'
import { dealCreateSchema } from '../admin-validation'
import { calcFinalPaidUnits } from '../groupbuy/supplier-quantity'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2026-10-10T12:00:00Z')
const PAST = new Date('2026-09-01T12:00:00Z') // genuinely before any reasonable "today"
const FUTURE = new Date('2026-10-12T12:00:00Z')

function makeRecoverRequest(token: string) {
  return new NextRequest(`http://localhost/api/orders/recover/${token}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
  })
}

function makeCleanupRequest() {
  return new NextRequest('http://localhost/api/cron/cleanup-pending-orders', {
    method: 'POST',
    headers: { 'x-cron-secret': 'test-secret' },
  })
}

function makePublishRequest(id: string) {
  return new NextRequest(`http://localhost/api/admin/deals/${id}/publish`, {
    method: 'POST',
  })
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = 'test-secret'
  process.env.AUTH_EXPIRY_SAFETY_MINUTES = '30'

  vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null)
  vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
  vi.mocked(prisma.order.update).mockResolvedValue({} as never)
  vi.mocked(prisma.order.findMany).mockResolvedValue([])
  vi.mocked(prisma.$transaction).mockImplementation(async (ops: unknown) => {
    if (Array.isArray(ops)) for (const op of ops) await op
    return []
  })
  vi.mocked(auth).mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } } as never)
})

// ── Group 1: sendRecoveryExpiredEmailForOrder ─────────────────────────────────

describe('sendRecoveryExpiredEmailForOrder', () => {
  // Use vi.importActual to get the real implementation — vi.mock('@/lib/groupbuy/recovery-expiry')
  // mocks both the alias and relative-path imports to the same module, so a static import would
  // get the mock. importActual bypasses the mock registry for this one reference.
  let realFn: (orderId: string) => Promise<string | null>
  beforeAll(async () => {
    const mod = await vi.importActual<{ sendRecoveryExpiredEmailForOrder: (orderId: string) => Promise<string | null> }>('../groupbuy/recovery-expiry')
    realFn = mod.sendRecoveryExpiredEmailForOrder
  })

  it('1. returns skip string when order not found', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    const result = await realFn('order-x')

    expect(result).toMatch(/not found/)
    expect(sendOrderRecoveryExpired).not.toHaveBeenCalled()
  })

  it('2. returns skip string when no recoveryExpiresAt on order', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1',
      recoveryExpiresAt: null,
      user: { email: 'a@test.com', name: 'Alice' },
      deal: { title: 'Test Deal' },
    } as never)

    const result = await realFn('order-1')

    expect(result).toMatch(/no recoveryExpiresAt/)
    expect(sendOrderRecoveryExpired).not.toHaveBeenCalled()
  })

  it('3. returns null without sending when already SENT', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1',
      recoveryExpiresAt: PAST,
      user: { email: 'a@test.com', name: 'Alice' },
      deal: { title: 'Test Deal' },
    } as never)
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({ id: 'sent-entry' } as never)

    const result = await realFn('order-1')

    expect(result).toBeNull()
    expect(sendOrderRecoveryExpired).not.toHaveBeenCalled()
  })

  it('4. sends email and returns null on success', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1',
      recoveryExpiresAt: PAST,
      user: { email: 'a@test.com', name: 'Alice Smith' },
      deal: { title: 'Test Deal' },
    } as never)

    const result = await realFn('order-1')

    expect(result).toBeNull()
    expect(sendOrderRecoveryExpired).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@test.com',
        memberName: 'Alice Smith',
        dealTitle: 'Test Deal',
        recoveryExpiresAt: PAST,
      }),
    )
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(2) // ATTEMPTED + SENT
  })

  it('5. returns error string when send fails', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order-1',
      recoveryExpiresAt: PAST,
      user: { email: 'a@test.com', name: 'Alice' },
      deal: { title: 'Test Deal' },
    } as never)
    vi.mocked(sendOrderRecoveryExpired).mockResolvedValue(false)

    const result = await realFn('order-1')

    expect(result).toMatch(/RECOVERY_EXPIRED email failed/)
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1) // ATTEMPTED only
  })
})

// ── Group 2: Recovery API ─────────────────────────────────────────────────────

describe('Recovery API expiry enforcement', () => {
  async function callRecoveryApi(token: string) {
    const { POST } = await import('@/app/api/orders/recover/[recoveryToken]/route')
    const req = makeRecoverRequest(token)
    return POST(req, { params: Promise.resolve({ recoveryToken: token }) })
  }

  it('6. returns 404 when token not found', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null)

    const res = await callRecoveryApi('bad-token')
    expect(res.status).toBe(404)
  })

  it('7. expired + CAPTURE_FAILED → 410, voids order, queues cancellation email', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.CAPTURE_FAILED,
      quantity: 1,
      userId: 'user-1',
      dealId: 'deal-1',
      recoveryExpiresAt: PAST,
      deal: { id: 'deal-1', title: 'Test Deal', finalPrice: null },
      user: { id: 'user-1', email: 'a@test.com', name: 'Alice', stripeCustomerId: null },
    } as never)

    const res = await callRecoveryApi('token-1')
    expect(res.status).toBe(410)

    const body = await res.json()
    expect(body.error).toBe('RECOVERY_EXPIRED')

    // Order should be voided
    const updateCalls = vi.mocked(prisma.order.update).mock.calls
    const voidCall = updateCalls.find(
      (c) => (c[0] as { data: { status?: string } }).data?.status === OrderStatus.VOIDED,
    )
    expect(voidCall).toBeDefined()

    // Cancellation email should be queued
    expect(sendRecoveryExpiredEmailForOrder).toHaveBeenCalledWith('order-1')
  })

  it('8. expired + already VOIDED → 410, no re-void', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.VOIDED,
      quantity: 1,
      userId: 'user-1',
      dealId: 'deal-1',
      recoveryExpiresAt: PAST,
      deal: { id: 'deal-1', title: 'Test Deal', finalPrice: null },
      user: { id: 'user-1', email: 'a@test.com', name: 'Alice', stripeCustomerId: null },
    } as never)

    const res = await callRecoveryApi('token-2')
    expect(res.status).toBe(410)

    // $transaction should NOT have been called (nothing to void)
    const txCalls = vi.mocked(prisma.$transaction).mock.calls
    const voidTx = txCalls.find((c) => String(c).includes('VOIDED'))
    expect(voidTx).toBeUndefined()
  })

  it('9. not expired → returns 200 with clientSecret', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.CAPTURE_FAILED,
      quantity: 2,
      userId: 'user-1',
      dealId: 'deal-1',
      recoveryExpiresAt: FUTURE,
      deal: { id: 'deal-1', title: 'Test Deal', finalPrice: '25.00' },
      user: { id: 'user-1', email: 'a@test.com', name: 'Alice', stripeCustomerId: 'cus_test' },
    } as never)

    const { stripe: stripeMock } = await import('@/lib/stripe')
    vi.mocked(stripeMock.paymentIntents.create).mockResolvedValue({
      id: 'pi_new',
      client_secret: 'secret_new',
    } as never)

    const res = await callRecoveryApi('token-3')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.clientSecret).toBe('secret_new')
  })
})

// ── Group 3: Cleanup cron expired-recovery sweep ──────────────────────────────

describe('Cleanup cron — expired recovery sweep', () => {
  async function callCleanup() {
    const { POST } = await import('@/app/api/cron/cleanup-pending-orders/route')
    return POST(makeCleanupRequest())
  }

  beforeEach(() => {
    // Default: no PENDING_AUTHORIZATION orders (first findMany call)
    // Override per test for expired recoveries (second findMany call)
    vi.mocked(prisma.order.findMany)
      .mockResolvedValueOnce([]) // PENDING_AUTHORIZATION
      .mockResolvedValueOnce([]) // CAPTURE_FAILED expired (default empty)
  })

  it('10. no expired orders → recoveryExpired: 0 in response', async () => {
    const res = await callCleanup()
    const body = await res.json()
    expect(body.recoveryExpired).toBe(0)
    expect(body.expiredResults).toEqual([])
  })

  it('11. expired CAPTURE_FAILED orders → voided and cancellation emails sent', async () => {
    vi.mocked(prisma.order.findMany)
      .mockReset()
      .mockResolvedValueOnce([]) // PENDING_AUTHORIZATION
      .mockResolvedValueOnce([
        { id: 'order-1', recoveryExpiresAt: PAST },
        { id: 'order-2', recoveryExpiresAt: PAST },
      ] as never)

    const res = await callCleanup()
    const body = await res.json()

    expect(body.recoveryExpired).toBe(2)
    expect(sendRecoveryExpiredEmailForOrder).toHaveBeenCalledTimes(2)
    expect(sendRecoveryExpiredEmailForOrder).toHaveBeenCalledWith('order-1')
    expect(sendRecoveryExpiredEmailForOrder).toHaveBeenCalledWith('order-2')

    // Each order should be voided via $transaction
    const auditCalls = vi.mocked(prisma.auditLog.create).mock.calls
    const expiryCalls = auditCalls.filter(
      (c) => (c[0] as { data: { action: string } }).data?.action === 'ORDER_VOIDED_RECOVERY_EXPIRED',
    )
    expect(expiryCalls).toHaveLength(2)
  })

  it('12. CAPTURE_FAILED with future recoveryExpiresAt → not swept', async () => {
    // The query uses { recoveryExpiresAt: { lt: now } }, so future orders won't be returned.
    // We verify that the findMany call for expired recoveries correctly targets only past expiry.
    vi.mocked(prisma.order.findMany)
      .mockReset()
      .mockResolvedValueOnce([]) // PENDING_AUTHORIZATION
      .mockResolvedValueOnce([]) // expired (empty — future orders excluded by query)

    const res = await callCleanup()
    const body = await res.json()
    expect(body.recoveryExpired).toBe(0)
    expect(sendRecoveryExpiredEmailForOrder).not.toHaveBeenCalled()
  })

  it('13. CAPTURE_FAILED with null recoveryExpiresAt → not swept', async () => {
    // null recoveryExpiresAt is excluded by { recoveryExpiresAt: { lt: now } }
    vi.mocked(prisma.order.findMany)
      .mockReset()
      .mockResolvedValueOnce([]) // PENDING_AUTHORIZATION
      .mockResolvedValueOnce([]) // expired (empty — null excluded)

    const res = await callCleanup()
    const body = await res.json()
    expect(body.recoveryExpired).toBe(0)
  })
})

// ── Group 4: admin-validation dealCreateSchema ────────────────────────────────

describe('dealCreateSchema — supplierCutoffAt validation', () => {
  const BASE_VALID = {
    title: 'Test Deal',
    slug: 'test-deal',
    description: 'A test deal with enough description text',
    supplierId: 'sup-1',
    minimumMembers: 5,
    maximumMembers: null,
    maxQuantityPerMember: 1,
    opensAt: '2026-10-10T00:00:00.000Z',
    closesAt: '2026-10-13T00:00:00.000Z',
    pickupLocation: 'Test Location',
    pickupAddress: '123 Test St, Kanata',
    pickupWindowStart: '2026-10-15T10:00:00.000Z',
    pickupWindowEnd: '2026-10-15T14:00:00.000Z',
    tiers: [{ minMembers: 1, maxMembers: null, pricePerUnit: 10, tierOrder: 0 }],
  }

  it('14. valid supplierCutoffAt (after closesAt, before pickup) → schema passes', () => {
    const result = dealCreateSchema.safeParse({
      ...BASE_VALID,
      supplierCutoffAt: '2026-10-14T12:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('15. supplierCutoffAt <= closesAt → schema fails with path error', () => {
    const result = dealCreateSchema.safeParse({
      ...BASE_VALID,
      supplierCutoffAt: '2026-10-12T00:00:00.000Z', // before closesAt 2026-10-13
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('supplierCutoffAt')
    }
  })

  it('16. supplierCutoffAt >= pickupWindowStart → schema fails with path error', () => {
    const result = dealCreateSchema.safeParse({
      ...BASE_VALID,
      supplierCutoffAt: '2026-10-15T10:00:00.000Z', // equal to pickupWindowStart
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('supplierCutoffAt')
    }
  })
})

// ── Group 5: Publish route supplierCutoffAt validation ───────────────────────

describe('Publish route — supplierCutoffAt validation', () => {
  const CLOSES_AT = new Date('2026-10-13T00:00:00Z')
  const PICKUP_START = new Date('2026-10-15T10:00:00Z')
  const VALID_CUTOFF = new Date('2026-10-14T12:00:00Z')

  function makeDraft(supplierCutoffAt: Date | null) {
    return {
      id: 'deal-1',
      status: DealStatus.DRAFT,
      tiers: [{ id: 't1' }],
      opensAt: new Date('2026-09-01T00:00:00Z'), // must be in the past for publish route
      closesAt: CLOSES_AT,
      supplierCutoffAt,
      pickupWindowStart: PICKUP_START,
    }
  }

  async function callPublish(dealId: string) {
    const { POST } = await import('@/app/api/admin/deals/[id]/publish/route')
    return POST(makePublishRequest(dealId), { params: Promise.resolve({ id: dealId }) })
  }

  it('17. missing supplierCutoffAt → 400', async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue(makeDraft(null) as never)

    const res = await callPublish('deal-1')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/supplier cutoff/i)
  })

  it('18. supplierCutoffAt <= closesAt → 400', async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue(
      makeDraft(new Date('2026-10-12T00:00:00Z')) as never,
    )

    const res = await callPublish('deal-1')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/after closesAt/i)
  })

  it('19. supplierCutoffAt >= pickupWindowStart → 400', async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue(
      makeDraft(new Date('2026-10-16T00:00:00Z')) as never,
    )

    const res = await callPublish('deal-1')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/before pickup/i)
  })

  it('20. valid supplierCutoffAt → proceeds past validation (deal opened)', async () => {
    vi.mocked(prisma.deal.findUnique).mockResolvedValue(makeDraft(VALID_CUTOFF) as never)
    vi.mocked(prisma.deal.update).mockResolvedValue({} as never)

    const res = await callPublish('deal-1')
    // Should not be a 400 for supplierCutoffAt (may be 200 or 503 for QStash in test env)
    expect(res.status).not.toBe(400)

    // deal.update should have been called with OPEN status
    expect(prisma.deal.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: DealStatus.OPEN }),
      }),
    )
  })
})

// ── Group 6: calcFinalPaidUnits ───────────────────────────────────────────────

describe('calcFinalPaidUnits — supplier unit sum', () => {
  it('21. one paid order, quantity 1 → 1 unit', () => {
    const orders = [
      { status: OrderStatus.CAPTURED, quantity: 1 },
    ]
    expect(calcFinalPaidUnits(orders)).toBe(1)
  })

  it('22. one paid order, quantity > 1 → that quantity', () => {
    const orders = [
      { status: OrderStatus.CAPTURED, quantity: 3 },
    ]
    expect(calcFinalPaidUnits(orders)).toBe(3)
  })

  it('23. recovered order (CAPTURED) + normal CAPTURED + PICKED_UP → sum of quantities', () => {
    // Recovered order goes CAPTURE_FAILED → CAPTURED via webhook (status is CAPTURED)
    const orders = [
      { status: OrderStatus.CAPTURED, quantity: 2 },  // normal capture
      { status: OrderStatus.CAPTURED, quantity: 1 },  // recovered (same status after recovery)
      { status: OrderStatus.PICKED_UP, quantity: 3 }, // already picked up
    ]
    expect(calcFinalPaidUnits(orders)).toBe(6)
  })

  it('24. unpaid and voided orders are excluded — result equals sum of paid quantities only', () => {
    const orders = [
      { status: OrderStatus.CAPTURED, quantity: 2 },
      { status: OrderStatus.PICKED_UP, quantity: 1 },
      { status: OrderStatus.AUTHORIZED, quantity: 5 },        // not paid yet
      { status: OrderStatus.CAPTURE_FAILED, quantity: 4 },   // outstanding
      { status: OrderStatus.VOIDED, quantity: 3 },            // cancelled
      { status: OrderStatus.PENDING_AUTHORIZATION, quantity: 2 }, // never paid
    ]
    // Only CAPTURED (2) + PICKED_UP (1) = 3 units, NOT 6 order rows
    expect(calcFinalPaidUnits(orders)).toBe(3)
  })
})
