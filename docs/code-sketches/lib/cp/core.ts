// lib/cp/core.ts
//
// Pure CP economy logic — NO database, NO `server-only` guard. Safe to import from scripts,
// admin tasks, and unit tests. The server-only entry point (index.ts) wraps these with Prisma.
//
// All amounts are integer Community Points (CP). Every [TUNABLE] economic value lives in
// EconParam and is passed in as `EconConfig` — nothing economic is hard-coded here.
// (CP Tokenomics Spec v2 §4, §5, §6, §7.)

export interface EconConfig {
  /**
   * Diminishing content faucet (Spec §4). CP awarded for the n-th verified read in the
   * rolling 24h window, 0-indexed (index 0 = 1st read). Reads past the array award 0 CP.
   */
  verifiedReadCurve: number[]; // e.g. [300, 100, 25, 25, 25]

  // Caps (Spec §5)
  dailyContentCapCp: number; // e.g. 550
  dailyTotalEarnCapCp: number; // e.g. 2000
  weeklyTotalEarnCapCp: number; // e.g. 8000

  /** Commerce emission (Spec §6): CP minted per cent of captured fiat. 0.05 = 5 CP per $1. */
  commerceCpPerCent: number;

  /** Disclosed CP→$ rate in cents per CP (Spec §8, §10). PLACEHOLDER until set by you. */
  cpToDollarCents: number;
}

/** CP awarded for the n-th verified read (0-indexed) in the current 24h window. */
export function verifiedReadAmount(priorCountInWindow: number, cfg: EconConfig): number {
  if (priorCountInWindow < 0) return 0;
  const curve = cfg.verifiedReadCurve;
  return priorCountInWindow < curve.length ? curve[priorCountInWindow] : 0;
}

/**
 * Clamp a proposed earn so it cannot breach a cap. Returns the grantable amount (>= 0).
 * `alreadyEarnedInWindow` is the sum of positive earns already in the relevant window.
 */
export function clampToCap(
  proposed: number,
  alreadyEarnedInWindow: number,
  capCp: number,
): number {
  if (proposed <= 0) return 0;
  const remaining = Math.max(0, capCp - alreadyEarnedInWindow);
  return Math.min(proposed, remaining);
}

/** Group-buy reward = floor(capturedCents * commerceCpPerCent) (Spec §6). */
export function groupBuyRewardCp(capturedCents: number, cfg: EconConfig): number {
  if (capturedCents <= 0) return 0;
  return Math.floor(capturedCents * cfg.commerceCpPerCent);
}

/**
 * Structural inflation Φ = emitted / burned over an epoch (Spec §7).
 * Returns null when nothing was burned (Φ undefined) so the caller decides how to display it.
 * MEASUREMENT ONLY — this value never auto-throttles anything in Phase 1 (Spec §7 Rule 5).
 */
export function computeChi(emittedCp: number, burnedCp: number): number | null {
  if (burnedCp <= 0) return null;
  return emittedCp / burnedCp;
}
