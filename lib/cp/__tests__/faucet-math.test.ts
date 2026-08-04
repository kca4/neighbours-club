/**
 * lib/cp/__tests__/faucet-math.test.ts
 *
 * Pure unit tests for content-faucet math. No DB, no Prisma mocks —
 * faucet-math.ts has no external dependencies.
 */

import { describe, it, expect } from 'vitest'
import {
  contentFaucetAmount,
  getMidnightUTC,
  getWeekStartUTC,
  clampToCap,
} from '../faucet-math'

// Pilot curve from EconParam seed (content_faucet_read_1/2/3to5)
// Halved from [100, 33, 8, 8, 8] — CP liability halved while $0.01/CP rate held constant.
// Curve sums to 78 CP/day max (50+16+4+4+4). Floor-rounding errs toward less emission.
const PILOT_CURVE = [50, 16, 4, 4, 4]

// ─── contentFaucetAmount ──────────────────────────────────────────────────────

describe('contentFaucetAmount — n→CP curve (Spec §4)', () => {
  it('n=0 (1st read today) → 50 CP', () => {
    expect(contentFaucetAmount(0, PILOT_CURVE)).toBe(50)
  })

  it('n=1 (2nd read today) → 16 CP', () => {
    expect(contentFaucetAmount(1, PILOT_CURVE)).toBe(16)
  })

  it('n=2 (3rd read today) → 4 CP', () => {
    expect(contentFaucetAmount(2, PILOT_CURVE)).toBe(4)
  })

  it('n=3 (4th read today) → 4 CP', () => {
    expect(contentFaucetAmount(3, PILOT_CURVE)).toBe(4)
  })

  // Paid boundary: the 5th read is the last that mints CP
  it('n=4 (5th read today) → 4 CP — last paid read', () => {
    expect(contentFaucetAmount(4, PILOT_CURVE)).toBe(4)
  })

  // Unpaid boundary: the 6th read mints 0 (but is still written to the ledger)
  it('n=5 (6th read today) → 0 CP — first unpaid read', () => {
    expect(contentFaucetAmount(5, PILOT_CURVE)).toBe(0)
  })

  it('n=99 → 0 CP', () => {
    expect(contentFaucetAmount(99, PILOT_CURVE)).toBe(0)
  })

  it('n=-1 → 0 CP (defensive; should not occur in production)', () => {
    expect(contentFaucetAmount(-1, PILOT_CURVE)).toBe(0)
  })
})

// ─── clampToCap ───────────────────────────────────────────────────────────────

describe('clampToCap (Spec §5)', () => {
  it('passes full amount when well under cap', () => {
    // 0 earned, proposing 50 (read_1), cap 92 — full award passes through
    expect(clampToCap(50, 0, 92)).toBe(50)
  })

  it('clamps to remaining budget when partially used', () => {
    // 67 already earned, 25 remaining of 92 → award is 25 not 50
    // Clamp visibly fires: proposed 50 > 25 remaining
    expect(clampToCap(50, 67, 92)).toBe(25)
  })

  it('returns 0 when cap is exactly reached', () => {
    expect(clampToCap(16, 92, 92)).toBe(0)
  })

  it('returns 0 when cap is exceeded (e.g. two concurrent grants)', () => {
    expect(clampToCap(50, 100, 92)).toBe(0)
  })

  it('returns 0 for a zero proposal', () => {
    expect(clampToCap(0, 0, 92)).toBe(0)
  })

  it('returns 0 for a negative proposal', () => {
    expect(clampToCap(-50, 0, 92)).toBe(0)
  })
})

// ─── getMidnightUTC — DST safety ─────────────────────────────────────────────

describe('getMidnightUTC — America/Toronto DST safety', () => {
  // ── Baseline: winter (EST = UTC-5), midnight Toronto = 05:00 UTC ──────────
  it('winter (UTC-5 EST): midnight Jan 15 2026 = 2026-01-15T05:00:00.000Z', () => {
    // 17:00 UTC = noon EST (UTC-5)
    const now = new Date('2026-01-15T17:00:00Z')
    expect(getMidnightUTC('America/Toronto', now).toISOString())
      .toBe('2026-01-15T05:00:00.000Z')
  })

  // ── Baseline: summer (EDT = UTC-4), midnight Toronto = 04:00 UTC ──────────
  it('summer (UTC-4 EDT): midnight Jul 1 2026 = 2026-07-01T04:00:00.000Z', () => {
    // 17:00 UTC = 1pm EDT (UTC-4)
    const now = new Date('2026-07-01T17:00:00Z')
    expect(getMidnightUTC('America/Toronto', now).toISOString())
      .toBe('2026-07-01T04:00:00.000Z')
  })

  // ── Spring-forward: 2026-03-08 ────────────────────────────────────────────
  // At 07:00 UTC (= 02:00 EST), clocks spring to 03:00 EDT.
  // Midnight March 8 is at 00:00 EST (before the 02:00 transition)
  // → midnight in EST (UTC-5) → 05:00 UTC.
  it('spring-forward (2026-03-08): midnight = 2026-03-08T05:00:00.000Z', () => {
    // 08:00 UTC = 04:00 EDT (after spring-forward)
    const now = new Date('2026-03-08T08:00:00Z')
    expect(getMidnightUTC('America/Toronto', now).toISOString())
      .toBe('2026-03-08T05:00:00.000Z')
  })

  // ── Fall-back: 2025-11-02 ─────────────────────────────────────────────────
  // At 06:00 UTC (= 02:00 EDT), clocks fall back to 01:00 EST.
  // Midnight November 2 is at 00:00 EDT (before the 02:00 transition)
  // → midnight in EDT (UTC-4) → 04:00 UTC.
  it('fall-back (2025-11-02): midnight = 2025-11-02T04:00:00.000Z', () => {
    // 10:00 UTC = 05:00 EST (after fall-back)
    const now = new Date('2025-11-02T10:00:00Z')
    expect(getMidnightUTC('America/Toronto', now).toISOString())
      .toBe('2025-11-02T04:00:00.000Z')
  })
})

// ─── getWeekStartUTC — Monday reset ──────────────────────────────────────────

describe('getWeekStartUTC — Monday 00:00 Toronto reset', () => {
  // 2026-06-01 is a Monday (Jan 1 2026 = Thursday; +151 days mod 7 = Monday).
  // All test instants are 16:00 UTC = noon EDT (UTC-4) in June.

  it('returns today midnight when today IS Monday', () => {
    const now = new Date('2026-06-01T16:00:00Z') // noon EDT, Monday June 1
    expect(getWeekStartUTC('America/Toronto', now).toISOString())
      .toBe('2026-06-01T04:00:00.000Z')
  })

  it('returns Monday midnight from a mid-week day (Thursday)', () => {
    const now = new Date('2026-06-04T16:00:00Z') // noon EDT, Thursday June 4
    expect(getWeekStartUTC('America/Toronto', now).toISOString())
      .toBe('2026-06-01T04:00:00.000Z')
  })

  it('returns Monday midnight from Sunday (6 days back)', () => {
    const now = new Date('2026-06-07T16:00:00Z') // noon EDT, Sunday June 7
    expect(getWeekStartUTC('America/Toronto', now).toISOString())
      .toBe('2026-06-01T04:00:00.000Z')
  })
})
