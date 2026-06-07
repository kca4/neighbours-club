/**
 * lib/cp/phi.ts — Φ (phi) inflation measurement.
 *
 * Implements the Φ INSTRUMENT from CP Tokenomics Spec v2 §7.
 * MEASUREMENT ONLY — the throttle is explicitly NOT built here (§7 Rule 5,
 * §13 #4). This file contains a single DB-facing function (measurePhi) that
 * reads the ledger and returns Φ. It never writes to the ledger, never changes
 * any balance, and is never called from any faucet or earn path.
 *
 * Pure computation is in lib/cp/faucet-math.ts (computePhi, PHI_DEFAULT_WINDOW_DAYS)
 * so unit tests can import it without hitting `server-only`.
 *
 * READ-ONLY INVARIANT — every Prisma call in this file is listed here.
 * If a future edit adds a write operation, update this list and get explicit
 * approval before merging:
 *   1. prisma.walletLedger.aggregate (amount > 0)  — sum emitted
 *   2. prisma.walletLedger.aggregate (amount < 0)  — sum burned
 *   3. prisma.econParam.findUnique                 — via getEconParam()
 * None of: create, update, updateMany, delete, upsert, $executeRaw.
 */
import 'server-only'

import { prisma } from '@/lib/prisma'
import { getEconParam } from './econ-params'
import { getMidnightUTC, computePhi, PHI_DEFAULT_WINDOW_DAYS } from './faucet-math'

// Re-export the pure helpers so callers can import them from one place.
// (Tests import directly from faucet-math to avoid the server-only guard.)
export { computePhi, PHI_DEFAULT_WINDOW_DAYS }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhiMeasurement {
  /** Σ positive ledger amounts in the window (all wallets, all faucets). */
  emitted:     number
  /** |Σ negative ledger amounts| in the window (all wallets, all sinks). */
  burned:      number
  /** emitted / burned. null when burned === 0 (no burns yet — Φ undefined). */
  phi:         number | null
  windowStart: Date
  windowEnd:   Date
  windowDays:  number
}

// ─── measurePhi ───────────────────────────────────────────────────────────────

/**
 * Measures Φ across all wallets over a rolling window aligned to midnight in
 * the project timezone (cap_reset_timezone from EconParam — same midnight
 * math as the daily/weekly cap windows; no second windowing convention).
 *
 * Window: [getMidnightUTC(tz, now − windowDays×24h), now)
 *
 * This function is PURE READ. It aggregates the ledger and returns a snapshot.
 * It does not write anything, does not change any balance, and is safe to call
 * as often as needed for monitoring without side effects.
 */
export async function measurePhi(options?: {
  /** Rolling window in days. Defaults to PHI_DEFAULT_WINDOW_DAYS (7).
   *  Pass a custom value to measure shorter/longer windows ad hoc. */
  windowDays?: number
}): Promise<PhiMeasurement> {
  const windowDays = options?.windowDays ?? PHI_DEFAULT_WINDOW_DAYS

  // Use the same timezone as daily/weekly caps — one windowing convention.
  const tz = (await getEconParam('cap_reset_timezone')) as string

  const now         = new Date()
  // Midnight-aligned start: midnight Toronto of the day that is windowDays days
  // before now. Consistent with cap-window math; no hour-precision needed.
  const windowStart = getMidnightUTC(tz, new Date(now.getTime() - windowDays * 86_400_000))
  const windowEnd   = now

  // ── Aggregate emitted (positive ledger amounts) ───────────────────────────
  // Covers all wallets, all faucet reasons (verified_read, group_buy_reward,
  // signup_bonus, manual_grant, …). Platform-wide, not per-user.
  const emittedAgg = await prisma.walletLedger.aggregate({
    where: {
      amount:    { gt: 0 },
      createdAt: { gte: windowStart, lt: windowEnd },
    },
    _sum: { amount: true },
  })
  const emitted = emittedAgg._sum.amount ?? 0

  // ── Aggregate burned (negative ledger amounts, return as positive) ─────────
  // Covers all wallets, all sink reasons (delivery_fee_waiver, secret_menu_redeem,
  // donation, …).
  const burnedAgg = await prisma.walletLedger.aggregate({
    where: {
      amount:    { lt: 0 },
      createdAt: { gte: windowStart, lt: windowEnd },
    },
    _sum: { amount: true },
  })
  const burned = Math.abs(burnedAgg._sum.amount ?? 0)

  return {
    emitted,
    burned,
    phi:         computePhi(emitted, burned),
    windowStart,
    windowEnd,
    windowDays,
  }
}
