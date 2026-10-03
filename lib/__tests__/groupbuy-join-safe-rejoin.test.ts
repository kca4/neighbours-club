/**
 * lib/__tests__/groupbuy-join-safe-rejoin.test.ts
 *
 * Tests for the safe-rejoin window enforcement and related invariants.
 *
 * A. Immediate rejoin before safeRejoinAt → blocked with REJOIN_TOO_EARLY + safeRejoinAt
 * B. Rejoin at/after safeRejoinAt → proceeds to revival (not 409)
 * C. VOIDED order not counted toward confirmed-member threshold
 * D. New AUTHORIZED order counted toward confirmed-member threshold
 * E. Revived order gets captureBeforeAt cleared (stale expiry not carried forward)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ── Module mocks (hoisted before imports) ────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    deal: { findUnique: vi.fn() },
    order: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    auditLog: { create: vi.fn() },
    user: { findUniqueOrThrow: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn().mockResolvedValue({ id: 'pi_new', client_secret: 'secret_new' }),
      retrieve: vi.fn(),
    },
  },
  getOrCreateStripeCustomer: vi.fn().mockResolvedValue('cus_test'),
}))

vi.mock('server-only', () => ({}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: vi.fn().mockResolvedValue({ id: 'email-id' }) } }
  }),
}))

vi.mock('@/lib/email', () => ({
  sendOrderAuthExpired: vi.fn().mockResolvedValue(true),
  sendOrderAuthorized: vi.fn().mockResolvedValue(true),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/deals/[slug]/join/route'
import { OrderStatus, DealStatus } from '@prisma/client'
import { calculateSafeRejoinAt } from '@/lib/groupbuy/auth-expiry'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2026-10-10T12:00:00Z')

function makeDeal(overrides: { closesAt?: Date; confirmedCount?: number; maximumMembers?: number | null } = {}) {
  return {
    id: 'deal-1',
    slug: 'test-deal',
    status: DealStatus.OPEN,
    opensAt: new Date('2026-10-01T00:00:00Z'),
    closesAt: overrides.closesAt ?? new Date('2026-10-17T12:00:00Z'),
    maximumMembers: overrides.maximumMembers !== undefined ? overrides.maximumMembers : null,
    maxQuantityPerMember: 5,
    minimumMembers: 3,
    tiers: [
      {
        id: 'tier-1',
        tierOrder: 1,
        minMembers: 3,
        maxMembers: null,
        pricePerUnit: { toString: () => '10.00' },
      },
    ],
    _count: { orders: overrides.confirmedCount ?? 0 },
  }
}

function makeExistingOrder(overrides: {
  status?: OrderStatus
  captureBeforeAt?: Date | null
  createdAt?: Date
} = {}) {
  return {
    id: 'order-1',
    status: overrides.status ?? OrderStatus.VOIDED,
    quantity: 2,
    stripePaymentIntentId: 'pi_old',
    createdAt: overrides.createdAt ?? new Date('2026-10-03T12:00:00Z'),
    captureBeforeAt: overrides.captureBeforeAt !== undefined ? overrides.captureBeforeAt : null,
  }
}

function callJoin(slug = 'test-deal', quantity = 1) {
  const req = new NextRequest(`http://localhost/api/deals/${slug}/join`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ quantity }),
  })
  return POST(req, { params: Promise.resolve({ slug }) })
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AUTH_EXPIRY_SAFETY_MINUTES = '30'

  vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
    id: 'user-1',
    email: 'member@test.com',
    name: 'Alice Smith',
    stripeCustomerId: null,
  } as never)

  vi.mocked(prisma.$transaction).mockImplementation(async (fn: unknown) => {
    if (typeof fn === 'function') return fn(prisma)
    if (Array.isArray(fn)) {
      for (const op of fn) await op
      return []
    }
    return []
  })

  vi.mocked(prisma.order.update).mockResolvedValue({ id: 'order-1' } as never)
  vi.mocked(prisma.order.create).mockResolvedValue({ id: 'order-1' } as never)
  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
})

// ── calculateSafeRejoinAt unit tests ─────────────────────────────────────────

describe('calculateSafeRejoinAt — pure formula', () => {
  it('correct window: 5-day auth, 7-day deal, 30-min safety', () => {
    const orderCreatedAt = NOW
    const captureBeforeAt = new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000)
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { safeRejoinAt, canRejoin } = calculateSafeRejoinAt(captureBeforeAt, orderCreatedAt, dealClosesAt, 30)

    expect(canRejoin).toBe(true)
    const expected = dealClosesAt.getTime() + 30 * 60 * 1000 - 5 * 24 * 60 * 60 * 1000
    expect(safeRejoinAt.getTime()).toBe(expected)
  })

  it('canRejoin = false when authDuration <= safetyMs (pathologically short auth)', () => {
    const orderCreatedAt = NOW
    const captureBeforeAt = new Date(NOW.getTime() + 20 * 60 * 1000) // 20-min auth
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)

    const { canRejoin } = calculateSafeRejoinAt(captureBeforeAt, orderCreatedAt, dealClosesAt, 30)
    expect(canRejoin).toBe(false)
  })

  it('safeRejoinAt is in the past when the deal closes sooner than the auth duration', () => {
    // Deal closes in 3 days, auth lasts 7 days → can rejoin immediately
    const orderCreatedAt = NOW
    const captureBeforeAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)
    const dealClosesAt = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000)

    const { safeRejoinAt, canRejoin } = calculateSafeRejoinAt(captureBeforeAt, orderCreatedAt, dealClosesAt, 30)
    expect(canRejoin).toBe(true)
    expect(safeRejoinAt.getTime()).toBeLessThanOrEqual(NOW.getTime())
  })
})

// ── Join route integration tests ──────────────────────────────────────────────

describe('Test A: rejoin before safeRejoinAt is blocked', () => {
  it('returns 409 REJOIN_TOO_EARLY with safeRejoinAt when window has not opened', async () => {
    // All times relative to real Date.now() so the join route's Date.now() comparison is correct.
    // Deal closes in 30 days; member joined 1 day ago with a 5-day auth.
    // safeRejoinAt = 30d+30min - 5d = ~25d from now → future → blocked.
    const realNow = Date.now()
    const dealClosesAt = new Date(realNow + 30 * 24 * 60 * 60 * 1000)
    const orderCreatedAt = new Date(realNow - 1 * 24 * 60 * 60 * 1000)
    const captureBeforeAt = new Date(orderCreatedAt.getTime() + 5 * 24 * 60 * 60 * 1000)

    vi.mocked(prisma.deal.findUnique).mockResolvedValue(makeDeal({ closesAt: dealClosesAt }) as never)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeExistingOrder({ status: OrderStatus.VOIDED, captureBeforeAt, createdAt: orderCreatedAt }) as never,
    )

    const res = await callJoin()
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBe('REJOIN_TOO_EARLY')
    expect(body.safeRejoinAt).toBeDefined()
    expect(new Date(body.safeRejoinAt).getTime()).toBeGreaterThan(realNow)
    // No DB write should have happened
    expect(prisma.order.update).not.toHaveBeenCalled()
  })
})

describe('Test B: rejoin at/after safeRejoinAt is accepted', () => {
  it('proceeds to order revival when safeRejoinAt is in the past', async () => {
    // Deal closes in 3 days; member joined 2 days ago with a 30-day auth.
    // safeRejoinAt = 3d+30min - 30d = ~27d ago → past → allowed.
    const realNow = Date.now()
    const dealClosesAt = new Date(realNow + 3 * 24 * 60 * 60 * 1000)
    const orderCreatedAt = new Date(realNow - 2 * 24 * 60 * 60 * 1000)
    const captureBeforeAt = new Date(orderCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

    vi.mocked(prisma.deal.findUnique).mockResolvedValue(makeDeal({ closesAt: dealClosesAt }) as never)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeExistingOrder({ status: OrderStatus.VOIDED, captureBeforeAt, createdAt: orderCreatedAt }) as never,
    )

    const res = await callJoin()

    // Must not be blocked
    expect(res.status).not.toBe(409)
    // Revival update must have been called
    expect(prisma.order.update).toHaveBeenCalled()
  })
})

describe('Test C: VOIDED order does not count toward confirmed threshold', () => {
  it('deal with maximumMembers=3 and 2 confirmed + 1 VOIDED still allows a new join', async () => {
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)

    // _count.orders counts only CONFIRMED_STATUSES (AUTHORIZED/CAPTURED/PICKED_UP)
    // The VOIDED order is not counted here — this matches the join route's query
    vi.mocked(prisma.deal.findUnique).mockResolvedValue(
      makeDeal({ closesAt: dealClosesAt, confirmedCount: 2, maximumMembers: 3 }) as never,
    )
    // Existing VOIDED order with no captureBeforeAt (e.g. member left voluntarily)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeExistingOrder({ status: OrderStatus.VOIDED, captureBeforeAt: null }) as never,
    )

    const res = await callJoin()
    const body = await res.json()

    // Should not be "deal is full"
    expect(body.error).not.toBe('This deal is full')
    // confirmedCount=2 < maximumMembers=3 → join allowed
    expect(res.status).not.toBe(409)
  })
})

describe('Test D: new AUTHORIZED order counts toward confirmed threshold', () => {
  it('deal at maximumMembers with all AUTHORIZED slots blocks a new join', async () => {
    const dealClosesAt = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000)

    vi.mocked(prisma.deal.findUnique).mockResolvedValue(
      makeDeal({ closesAt: dealClosesAt, confirmedCount: 3, maximumMembers: 3 }) as never,
    )
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    const res = await callJoin()
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error).toBe('This deal is full')
  })
})

describe('Test E: revived order has captureBeforeAt cleared', () => {
  it('revival update sets captureBeforeAt to null so new auth gets a fresh timestamp', async () => {
    // Same scenario as Test B: safeRejoinAt in the past
    const realNow = Date.now()
    const dealClosesAt = new Date(realNow + 3 * 24 * 60 * 60 * 1000)
    const orderCreatedAt = new Date(realNow - 2 * 24 * 60 * 60 * 1000)
    const captureBeforeAt = new Date(orderCreatedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

    vi.mocked(prisma.deal.findUnique).mockResolvedValue(makeDeal({ closesAt: dealClosesAt }) as never)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeExistingOrder({ status: OrderStatus.VOIDED, captureBeforeAt, createdAt: orderCreatedAt }) as never,
    )

    await callJoin()

    const updateCalls = vi.mocked(prisma.order.update).mock.calls
    // Find the revival call (the one that sets PENDING_AUTHORIZATION)
    const revivalCall = updateCalls.find(
      c => (c[0] as { data: { status?: string } }).data?.status === OrderStatus.PENDING_AUTHORIZATION,
    )
    expect(revivalCall).toBeDefined()
    expect((revivalCall![0] as { data: { captureBeforeAt: unknown } }).data?.captureBeforeAt).toBeNull()
  })
})
