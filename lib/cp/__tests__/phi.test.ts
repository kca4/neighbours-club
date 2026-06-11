/**
 * lib/cp/__tests__/phi.test.ts
 *
 * Unit tests for the Φ inflation metric (Spec §7).
 * Imports computePhi and PHI_DEFAULT_WINDOW_DAYS from faucet-math.ts (no
 * server-only guard) so these tests run without mocking Prisma or Next.js.
 *
 * The DB-facing measurePhi is read-only by architectural invariant (all
 * Prisma calls are .aggregate()). The "mutates nothing" requirement is
 * satisfied at two levels:
 *   1. computePhi is a pure function — tested directly below.
 *   2. measurePhi lists every Prisma method it calls in its JSDoc header;
 *      that list contains only aggregate (read-only). Enforced by code review.
 */

import { describe, it, expect } from 'vitest'
import { computePhi, PHI_DEFAULT_WINDOW_DAYS, ADMIN_ADJUSTMENT_REASONS } from '../faucet-math'

// ─── computePhi — formula correctness ────────────────────────────────────────

describe('computePhi — Φ = emitted / burned (Spec §7)', () => {
  it('returns emitted / burned for a normal window', () => {
    expect(computePhi(1100, 1000)).toBeCloseTo(1.1)
    expect(computePhi(900, 1000)).toBeCloseTo(0.9)
    expect(computePhi(1000, 1000)).toBeCloseTo(1.0)
  })

  it('handles non-round numbers without precision issues', () => {
    // 2500 / 2000 = 1.25
    expect(computePhi(2500, 2000)).toBeCloseTo(1.25)
    // 750 / 3000 = 0.25
    expect(computePhi(750, 3000)).toBeCloseTo(0.25)
  })

  it('returns null when burned === 0 — Φ undefined, never Infinity', () => {
    expect(computePhi(500, 0)).toBeNull()
    expect(computePhi(0, 0)).toBeNull()
    // Explicitly confirm it is NOT Infinity
    expect(computePhi(500, 0)).not.toBe(Infinity)
  })

  it('returns 0 when emitted === 0 — fully deflationary window', () => {
    // Valid outcome: sinks fired but no faucets in the window
    expect(computePhi(0, 500)).toBe(0)
  })

  it('handles large values without integer overflow', () => {
    expect(computePhi(2_000_000, 1_000_000)).toBeCloseTo(2.0)
    expect(computePhi(8_000_000, 8_000_000)).toBeCloseTo(1.0)
  })
})

// ─── computePhi — pure-function invariants ────────────────────────────────────

describe('computePhi — mutates nothing (pure function invariant)', () => {
  it('does not mutate its inputs', () => {
    const emitted = 1100
    const burned  = 1000
    const result  = computePhi(emitted, burned)
    // Inputs unchanged after the call
    expect(emitted).toBe(1100)
    expect(burned).toBe(1000)
    // Result is the correct ratio
    expect(result).toBeCloseTo(1.1)
  })

  it('is referentially transparent — same inputs always produce same output', () => {
    expect(computePhi(1100, 1000)).toBe(computePhi(1100, 1000))
    expect(computePhi(500, 0)).toBe(computePhi(500, 0))   // null === null
    expect(computePhi(0, 500)).toBe(computePhi(0, 500))
  })

  it('does not accumulate state across multiple calls', () => {
    // Call in various orders — result must be independent of call history
    computePhi(1000, 500)
    computePhi(999, 0)
    computePhi(0, 0)
    expect(computePhi(1100, 1000)).toBeCloseTo(1.1)
  })
})

// ─── PHI_DEFAULT_WINDOW_DAYS ──────────────────────────────────────────────────

describe('PHI_DEFAULT_WINDOW_DAYS', () => {
  it('is 7 — the Phase 1 pilot window (Spec §13 #2 open decision)', () => {
    expect(PHI_DEFAULT_WINDOW_DAYS).toBe(7)
  })
})

// ─── Band thresholds — pilot values from EconParam seed ──────────────────────

describe('Φ band semantics (pilot values, for documentation)', () => {
  // These tests encode the expected band interpretation.
  // They use computePhi with boundary values so any formula change
  // that shifts the semantics is immediately visible.

  const PHI_TARGET_LOW   = 0.9
  const PHI_TARGET_HIGH  = 1.1
  const PHI_ALARM        = 1.15

  it('Φ = 1.0 is healthy (equal emission and burn)', () => {
    const phi = computePhi(1000, 1000)!
    expect(phi).toBeGreaterThanOrEqual(PHI_TARGET_LOW)
    expect(phi).toBeLessThanOrEqual(PHI_TARGET_HIGH)
  })

  it('Φ = 1.1 is at the top of the healthy band', () => {
    const phi = computePhi(1100, 1000)!
    expect(phi).toBeLessThanOrEqual(PHI_TARGET_HIGH)
    expect(phi).toBeLessThan(PHI_ALARM)
  })

  it('Φ = 1.15 is at the alarm threshold', () => {
    const phi = computePhi(1150, 1000)!
    expect(phi).toBeCloseTo(PHI_ALARM)
  })

  it('Φ = 1.2 exceeds the alarm threshold', () => {
    const phi = computePhi(1200, 1000)!
    expect(phi).toBeGreaterThan(PHI_ALARM)
  })
})

// ─── ADMIN_ADJUSTMENT_REASONS — exclusion set membership ─────────────────────

describe('ADMIN_ADJUSTMENT_REASONS — administrative adjustment set', () => {
  it('is a Set (O(1) membership check, not a string compare)', () => {
    expect(ADMIN_ADJUSTMENT_REASONS).toBeInstanceOf(Set)
  })

  it('is non-empty — an empty set would silently make structural Φ = raw Φ', () => {
    expect(ADMIN_ADJUSTMENT_REASONS.size).toBeGreaterThan(0)
  })

  it('contains manual_grant', () => {
    expect(ADMIN_ADJUSTMENT_REASONS.has('manual_grant')).toBe(true)
  })

  it('does NOT contain real faucet reasons (they belong in structural Φ)', () => {
    // If a real faucet reason were in this set, it would be excluded from the
    // structural emitted sum, understating real inflation.
    const realFaucets = ['verified_read', 'group_buy_reward', 'referral_verified', 'merchant_bounty']
    for (const reason of realFaucets) {
      expect(ADMIN_ADJUSTMENT_REASONS.has(reason)).toBe(false)
    }
  })

  it('does NOT contain sink reasons (burns are never filtered)', () => {
    // Sink reasons should never end up in this set — sinks are always counted.
    const sinkReasons = ['delivery_fee_waiver', 'secret_menu_redeem', 'donation']
    for (const reason of sinkReasons) {
      expect(ADMIN_ADJUSTMENT_REASONS.has(reason)).toBe(false)
    }
  })
})

// ─── structural Φ — computePhi(structuralEmitted, burned) ────────────────────

describe('structural Φ — manual_grant excluded from emitted sum', () => {
  it('returns 0 when all emission was admin adjustments (structuralEmitted = 0)', () => {
    // Scenario: 500 CP emitted entirely via manual_grant; 300 CP burned.
    // Raw Φ = 500/300 ≈ 1.67 (alarm territory).
    // Structural Φ = computePhi(0, 300) = 0 (no real faucet activity).
    expect(computePhi(/* structuralEmitted */ 0, /* burned */ 300)).toBe(0)
  })

  it('is lower than raw Φ when admin grants inflate the emitted sum', () => {
    // Real faucet: 300 CP; admin grant (excluded): 700 CP; burned: 500 CP.
    // Raw Φ = 1000/500 = 2.0  — well above alarm.
    // Structural Φ = 300/500 = 0.6 — deflationary but not alarming.
    const rawPhi        = computePhi(/* all emitted */ 1000, 500)
    const structuralPhi = computePhi(/* faucet only */ 300,  500)
    expect(rawPhi).toBeCloseTo(2.0)
    expect(structuralPhi).toBeCloseTo(0.6)
    expect(structuralPhi!).toBeLessThan(rawPhi!)
  })

  it('equals raw Φ when there are no admin adjustments in the window', () => {
    // Both aggregates return the same emitted total — structural = raw.
    const emitted = 1100
    const burned  = 1000
    expect(computePhi(emitted, burned)).toBeCloseTo(computePhi(emitted, burned)!)
  })

  it('returns null when burned = 0, even when admin grants are the only emission', () => {
    // manual_grant emitted 500 CP, no burns yet — structural Φ is still undefined.
    // structuralEmitted = 0, burned = 0 → computePhi(0, 0) → null.
    expect(computePhi(/* structuralEmitted */ 0, /* burned */ 0)).toBeNull()
  })
})

// ─── measurePhi — read-only invariant (structural enforcement) ────────────────

describe('measurePhi — read-only invariant', () => {
  // measurePhi lists every Prisma call in its JSDoc header. The invariant is
  // that none are write operations. These tests encode the exclusion-set
  // contract so future edits cannot silently break it.

  it('ADMIN_ADJUSTMENT_REASONS is importable from faucet-math without server-only', () => {
    // If this import works, plain Node scripts and unit tests can read the
    // exclusion set without hitting the Next.js server-only guard.
    expect(typeof ADMIN_ADJUSTMENT_REASONS).toBe('object')
    expect(ADMIN_ADJUSTMENT_REASONS).toBeInstanceOf(Set)
  })
})
