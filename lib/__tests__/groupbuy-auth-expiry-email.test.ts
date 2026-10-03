/**
 * lib/__tests__/groupbuy-auth-expiry-email.test.ts
 *
 * Tests for sendAuthExpiryEmailForOrder — the function that dispatches the
 * member-facing auth-expiry notification email.
 *
 * Key contract: the correct email VARIANT is selected based on deal state at
 * SEND TIME, not at detection time.
 *
 *   Case A — deal OPEN, canRejoin = true   → variant 'rejoin_available'
 *   Case B — deal OPEN, canRejoin = false  → variant 'no_rejoin'
 *   Case C — deal NOT OPEN                 → variant 'deal_closed'
 *
 * Idempotency:
 *   - Already SENT  → returns null (skip)
 *   - Max attempts  → returns MAX_ATTEMPTS error string
 *   - Order missing → returns skip string
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('server-only', () => ({}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn() },
    auditLog: { create: vi.fn(), findFirst: vi.fn(), count: vi.fn() },
  },
}))

vi.mock('@/lib/email', () => ({
  sendOrderAuthExpired: vi.fn().mockResolvedValue(true),
  fmtDateTime: vi.fn().mockImplementation((d: Date) => d.toISOString()),
}))

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: vi.fn().mockResolvedValue({ id: 'email-id' }) } }
  }),
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import { sendOrderAuthExpired } from '@/lib/email'
import { sendAuthExpiryEmailForOrder } from '@/lib/groupbuy/auth-expiry'
import { DealStatus } from '@prisma/client'

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2026-10-10T12:00:00Z')

function makeOrder(dealStatus: DealStatus = DealStatus.OPEN, captureBeforeAt?: Date | null) {
  const orderCreatedAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000)
  return {
    id: 'order-1',
    createdAt: orderCreatedAt,
    captureBeforeAt:
      captureBeforeAt !== undefined
        ? captureBeforeAt
        : new Date(orderCreatedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    user: { email: 'member@test.com', name: 'Alice Smith' },
    deal: {
      title: 'Test Deal',
      slug: 'test-deal',
      closesAt: new Date(NOW.getTime() + 5 * 24 * 60 * 60 * 1000),
      status: dealStatus,
    },
  }
}

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AUTH_EXPIRY_SAFETY_MINUTES = '30'
  process.env.AUTH_EXPIRY_MAX_EMAIL_ATTEMPTS = '3'

  // Default: not yet sent, zero attempts
  vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null)
  vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
})

// ── Case A: deal OPEN, rejoin window available ────────────────────────────────

describe('Case A: deal OPEN, canRejoin = true', () => {
  it('calls sendOrderAuthExpired with variant=rejoin_available and safeRejoinAt set', async () => {
    // 7-day auth, deal closes in 5 days → safeRejoinAt = 5d+30min−7d = in the past → canRejoin
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder(DealStatus.OPEN) as never)

    const result = await sendAuthExpiryEmailForOrder('order-1')

    expect(result).toBeNull()
    expect(sendOrderAuthExpired).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'rejoin_available',
        safeRejoinAt: expect.any(Date),
      }),
    )
  })
})

// ── Case B: deal OPEN, auth too short for any window ─────────────────────────

describe('Case B: deal OPEN, canRejoin = false', () => {
  it('calls sendOrderAuthExpired with variant=no_rejoin and safeRejoinAt=null', async () => {
    // Very short auth (20 min) — canRejoin will be false
    const orderCreatedAt = new Date(NOW.getTime() - 2 * 24 * 60 * 60 * 1000)
    const captureBeforeAt = new Date(orderCreatedAt.getTime() + 20 * 60 * 1000)
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder(DealStatus.OPEN, captureBeforeAt) as never,
    )

    const result = await sendAuthExpiryEmailForOrder('order-1')

    expect(result).toBeNull()
    expect(sendOrderAuthExpired).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'no_rejoin',
        safeRejoinAt: null,
      }),
    )
  })
})

// ── Case C: deal not OPEN at send time ───────────────────────────────────────

describe('Case C: deal no longer OPEN', () => {
  it('calls sendOrderAuthExpired with variant=deal_closed regardless of auth duration', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder(DealStatus.CLOSING_SUCCESS) as never,
    )

    const result = await sendAuthExpiryEmailForOrder('order-1')

    expect(result).toBeNull()
    expect(sendOrderAuthExpired).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'deal_closed',
        safeRejoinAt: null,
      }),
    )
  })

  it('also selects deal_closed for CANCELLED deals', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(
      makeOrder(DealStatus.CANCELLED) as never,
    )

    await sendAuthExpiryEmailForOrder('order-1')

    expect(sendOrderAuthExpired).toHaveBeenCalledWith(
      expect.objectContaining({ variant: 'deal_closed' }),
    )
  })
})

// ── Idempotency ───────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('returns null without sending if already SENT', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never)
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({ id: 'existing-sent' } as never)

    const result = await sendAuthExpiryEmailForOrder('order-1')

    expect(result).toBeNull()
    expect(sendOrderAuthExpired).not.toHaveBeenCalled()
  })

  it('returns MAX_ATTEMPTS error string when attempt count exhausted', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(makeOrder() as never)
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null) // not yet sent
    vi.mocked(prisma.auditLog.count).mockResolvedValue(3) // = MAX_ATTEMPTS

    const result = await sendAuthExpiryEmailForOrder('order-1')

    expect(result).toBe('AUTH_EXPIRY_EMAIL_MAX_ATTEMPTS:order-1')
    expect(sendOrderAuthExpired).not.toHaveBeenCalled()
  })

  it('returns skip string when order not found', async () => {
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null)

    const result = await sendAuthExpiryEmailForOrder('order-1')

    expect(result).toMatch(/not found/)
    expect(sendOrderAuthExpired).not.toHaveBeenCalled()
  })
})
