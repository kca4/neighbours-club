/**
 * lib/__tests__/dispatch-escalation.test.ts
 *
 * Tests for the Uber escalation gate in the dispatch cron sweep.
 *
 * Two sections:
 *   1. Unit tests for the pure config helpers (isUberEscalationEnabled,
 *      getEscalationTimeoutMs) — no DB, no mocks.
 *   2. Behavioral test for runSweep() — injects mock Prisma + shippingAdapter
 *      to prove the cron body is actually skipped, not just that the flag
 *      function returns false.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isUberEscalationEnabled, getEscalationTimeoutMs } from '../dispatch/escalation-config'
import { runSweep } from '../dispatch/sweep'
import { DeliveryOrderStatus, FulfillmentType } from '@prisma/client'

// ─── 1. Config helper unit tests ──────────────────────────────────────────────

describe('isUberEscalationEnabled', () => {
  const origEnv = process.env

  beforeEach(() => { process.env = { ...origEnv } })
  afterEach(()  => { process.env = origEnv })

  it('returns false when ENABLE_UBER_ESCALATION is unset (pilot default)', () => {
    delete process.env.ENABLE_UBER_ESCALATION
    expect(isUberEscalationEnabled()).toBe(false)
  })

  it('returns false when ENABLE_UBER_ESCALATION=false', () => {
    process.env.ENABLE_UBER_ESCALATION = 'false'
    expect(isUberEscalationEnabled()).toBe(false)
  })

  it('returns true when ENABLE_UBER_ESCALATION=true', () => {
    process.env.ENABLE_UBER_ESCALATION = 'true'
    expect(isUberEscalationEnabled()).toBe(true)
  })
})

describe('getEscalationTimeoutMs', () => {
  const origEnv = process.env

  beforeEach(() => { process.env = { ...origEnv } })
  afterEach(()  => { process.env = origEnv })

  it('defaults to 3 minutes when UBER_ESCALATION_TIMEOUT_MINUTES is unset', () => {
    delete process.env.UBER_ESCALATION_TIMEOUT_MINUTES
    expect(getEscalationTimeoutMs()).toBe(3 * 60 * 1000)
  })

  it('uses the configured value when UBER_ESCALATION_TIMEOUT_MINUTES=10', () => {
    process.env.UBER_ESCALATION_TIMEOUT_MINUTES = '10'
    expect(getEscalationTimeoutMs()).toBe(10 * 60 * 1000)
  })

  it('falls back to 3 minutes when the value is non-numeric', () => {
    process.env.UBER_ESCALATION_TIMEOUT_MINUTES = 'bogus'
    expect(getEscalationTimeoutMs()).toBe(3 * 60 * 1000)
  })

  it('falls back to 3 minutes when the value is 0 (< 1 minute minimum)', () => {
    process.env.UBER_ESCALATION_TIMEOUT_MINUTES = '0'
    expect(getEscalationTimeoutMs()).toBe(3 * 60 * 1000)
  })
})

// ─── 2. Behavioral: runSweep() escalation gate ───────────────────────────────
//
// We inject mock Prisma and shippingAdapter so the test exercises the real
// runSweep() code path — not just the flag helper — without hitting the DB.
//
// The eligible order below satisfies every Phase 1 filter that a real PENDING
// order would (PENDING status, driverId null, dispatchStartedAt in the past).
// When ENABLE_UBER_ESCALATION is off the entire Phase 1 block must be skipped:
// neither findMany nor createJob nor update should be called.

describe('runSweep() — Uber escalation gate', () => {
  const origEnv = process.env

  // An order that is fully eligible for escalation if Phase 1 were to run.
  const eligibleOrder = {
    id:              'order-behavioral-test',
    items:           [{ name: 'Shawarma', quantity: 1 }],
    deliveryAddress: { street: '99 Palladium Dr', unit: null, instructions: null },
    restaurant:      { name: 'Lebanese Palace', address: '1 Terry Fox Dr' },
    user:            { name: 'Test Member' },
  }

  const mockFindMany  = vi.fn()
  const mockUpdate    = vi.fn()
  const mockCreateJob = vi.fn()

  // Minimal stub that satisfies SweepDeps.prisma (Pick<PrismaClient, 'deliveryOrder'>)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockPrisma = { deliveryOrder: { findMany: mockFindMany, update: mockUpdate } } as any

  const mockShippingAdapter = {
    createJob:    mockCreateJob,
    cancelJob:    vi.fn(),
    getJobStatus: vi.fn(),
  }

  beforeEach(() => {
    process.env = { ...origEnv }
    delete process.env.ENABLE_UBER_ESCALATION
    delete process.env.USE_SHIPPING_STUB
    vi.clearAllMocks()
    // If Phase 1 were to fire, findMany would return this eligible order.
    mockFindMany.mockResolvedValue([eligibleOrder])
    mockUpdate.mockResolvedValue({})
  })

  afterEach(() => { process.env = origEnv })

  it('does NOT escalate an eligible order and does NOT call createJob or update when ENABLE_UBER_ESCALATION is off', async () => {
    // ENABLE_UBER_ESCALATION is unset (deleted in beforeEach) — pilot default.
    const result = await runSweep({ prisma: mockPrisma, shippingAdapter: mockShippingAdapter })

    // Counter confirms no escalation happened
    expect(result.sweptToFallback).toBe(0)

    // The order status and fulfillmentType must be untouched:
    // no createJob call (so no Uber job was created)
    expect(mockCreateJob).not.toHaveBeenCalled()
    // no update call (so the DB row was never mutated toward AWAITING_COURIER)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('DOES escalate the eligible order when ENABLE_UBER_ESCALATION=true (positive control)', async () => {
    process.env.ENABLE_UBER_ESCALATION = 'true'
    mockCreateJob.mockResolvedValue({ jobId: 'uber_sim_abc', pickupPin: '1234' })

    const result = await runSweep({ prisma: mockPrisma, shippingAdapter: mockShippingAdapter })

    expect(result.sweptToFallback).toBe(1)
    expect(mockCreateJob).toHaveBeenCalledOnce()
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-behavioral-test' },
        data: expect.objectContaining({
          status:          DeliveryOrderStatus.AWAITING_COURIER,
          fulfillmentType: FulfillmentType.UBER_DIRECT,
        }),
      })
    )
  })
})
