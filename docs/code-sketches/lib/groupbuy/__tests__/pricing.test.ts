// lib/groupbuy/__tests__/pricing.test.ts
//
// Pure tests for tier resolution and floor validation. No DB. (Vitest.)

import { describe, it, expect } from 'vitest';
import { finalTier, tiersBelowFloor, TierLike } from '../pricing';

// The research's lasagna example: ceiling $18.50 down to $10.00.
const tiers: TierLike[] = [
  { tierOrder: 1, thresholdParticipants: 0, unitPriceCents: 1850 },
  { tierOrder: 2, thresholdParticipants: 15, unitPriceCents: 1500 },
  { tierOrder: 3, thresholdParticipants: 35, unitPriceCents: 1250 },
  { tierOrder: 4, thresholdParticipants: 50, unitPriceCents: 1000 },
];

describe('finalTier', () => {
  it('returns the ceiling when few have joined', () => {
    expect(finalTier(5, tiers)?.unitPriceCents).toBe(1850);
  });
  it('unlocks the lower price as thresholds are crossed', () => {
    expect(finalTier(20, tiers)?.unitPriceCents).toBe(1500);
    expect(finalTier(40, tiers)?.unitPriceCents).toBe(1250);
    expect(finalTier(50, tiers)?.unitPriceCents).toBe(1000);
    expect(finalTier(80, tiers)?.unitPriceCents).toBe(1000); // capped at best tier
  });
  it('returns null if no tier has a met threshold (misconfigured: no ceiling)', () => {
    const noCeiling: TierLike[] = [{ tierOrder: 1, thresholdParticipants: 10, unitPriceCents: 1500 }];
    expect(finalTier(3, noCeiling)).toBeNull();
  });
});

describe('tiersBelowFloor (the guardrail)', () => {
  it('passes when every tier is at or above the floor', () => {
    expect(tiersBelowFloor(tiers, 950)).toHaveLength(0); // floor $9.50, lowest tier $10.00
  });
  it('flags any tier priced below the floor', () => {
    const offenders = tiersBelowFloor(tiers, 1100); // floor $11.00
    // Only $10.00 (tier 4) is below $11.00; $12.50/$15.00/$18.50 are all above.
    expect(offenders.map((t) => t.tierOrder)).toEqual([4]);
  });
  it('flags multiple tiers when the floor is higher', () => {
    const offenders = tiersBelowFloor(tiers, 1300); // floor $13.00 → $12.50 and $10.00 below
    expect(offenders.map((t) => t.tierOrder)).toEqual([3, 4]);
  });
});
