// lib/groupbuy/pricing.ts
//
// Pure group-buy pricing logic — no DB. (Group Buy Merchant Economics Spec §3, §4.)

export interface TierLike {
  tierOrder: number;
  thresholdParticipants: number;
  unitPriceCents: number;
}

/**
 * Final unit price = the lowest-priced tier whose participant threshold is met by `count`.
 * Tier 1 (the ceiling, threshold 0) should always be eligible, so this returns null only on
 * a misconfigured deal with no threshold-0 tier — callers must guard for that.
 */
export function finalTier(count: number, tiers: TierLike[]): TierLike | null {
  const eligible = tiers
    .filter((t) => count >= t.thresholdParticipants)
    .sort((a, b) => a.unitPriceCents - b.unitPriceCents);
  return eligible[0] ?? null;
}

/**
 * Returns the tiers priced below the merchant floor. Empty array = valid deal.
 * This is the guardrail that makes "protect margins" true (Spec §3): enforce at deal creation.
 */
export function tiersBelowFloor(tiers: TierLike[], floorCents: number): TierLike[] {
  return tiers.filter((t) => t.unitPriceCents < floorCents);
}
