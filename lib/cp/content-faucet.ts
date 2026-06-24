/**
 * lib/cp/content-faucet.ts — earnVerifiedReadCP: the content faucet earn path.
 *
 * Implements the diminishing-returns curve + daily/weekly caps from
 * CP Tokenomics Spec v2 §4–§5. All [TUNABLE] values are read from the
 * EconParam config table at call time.
 *
 * Why this is NOT in lib/cp/core.ts:
 *   earnCP/burnCP are generic and each open their own $transaction.
 *   The content faucet needs a COUNT + INSERT that are atomic in one
 *   transaction (to prevent two concurrent first-reads from both seeing n=0
 *   and both minting 300). It also needs EconParam reads, which would
 *   introduce a `server-only` dependency into core.ts and break the
 *   scripts/grant-test-cp.ts import path (that file imports core.ts
 *   without --conditions=react-server). Separating here preserves the
 *   invariant: core.ts has no `server-only` guard and remains safe for
 *   plain Node scripts.
 *
 * Atomicity guarantee:
 *   A `SELECT … FOR UPDATE` on the wallet row is taken at the start of
 *   the transaction. The second concurrent caller blocks at the lock until
 *   the first commits, then sees the updated COUNT. Race is eliminated.
 */
import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getOrCreateWallet } from './core'
import { getAllEconParams } from './econ-params'
import {
  contentFaucetAmount,
  getMidnightUTC,
  getWeekStartUTC,
  clampToCap,
} from './faucet-math'

// Local result type — extends the shared CPResult shapes with cpAwarded so
// callers can distinguish a 0-CP grant (curve/cap exhausted) from a positive
// grant, without modifying the shared CPResult in lib/cp/types.ts (which would
// affect earnCP/burnCP unnecessarily).
type FaucetResult =
  | { ok: true; deduped: false; newBalance: number; cpAwarded: number }
  | { ok: true; deduped: true }

// Prisma transaction client type (connection/lifecycle methods excluded)
type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export interface EarnVerifiedReadParams {
  userId: string
  noteId: string
}

/**
 * Award CP for verifying a note using the diminishing content-faucet curve
 * and daily/weekly caps from EconParam.
 *
 * Contract:
 *  • referenceId is built internally as `verified_read:{userId}:{noteId}`.
 *    Callers cannot inject a different namespace.
 *  • The 6th+ verified read in a rolling day still writes a 0-amount ledger
 *    row: the read counts for editorial quality and idempotency still applies.
 *  • Caps clamp the award to 0 — they NEVER throw. The verify action succeeds.
 *  • SELECT … FOR UPDATE on the wallet row prevents the concurrent-n=0 race.
 *
 * Returns:
 *  { ok: true, deduped: false, cpAwarded: number, newBalance: number } — grant recorded (cpAwarded ≥ 0)
 *  { ok: true, deduped: true }                                         — duplicate call, no change
 */
export async function earnVerifiedReadCP(
  params: EarnVerifiedReadParams,
): Promise<FaucetResult> {
  const { userId, noteId } = params
  const referenceId = `verified_read:${userId}:${noteId}`

  // ── 1. Ensure wallet exists (idempotent upsert, safe to run outside tx) ──
  const wallet = await getOrCreateWallet(userId)

  // ── 2. Read EconParam config (outside tx — tiny table, no caching) ────────
  const cfg = await getAllEconParams()
  // Expand the 3to5 param into three explicit curve slots
  const curve: number[] = [
    cfg.content_faucet_read_1    as number,
    cfg.content_faucet_read_2    as number,
    cfg.content_faucet_read_3to5 as number,
    cfg.content_faucet_read_3to5 as number,
    cfg.content_faucet_read_3to5 as number,
  ]
  const contentDailyCap = cfg.content_faucet_daily_cap as number
  const dailyTotalCap   = cfg.daily_total_earn_cap      as number
  const weeklyTotalCap  = cfg.weekly_total_earn_cap      as number
  const tz              = cfg.cap_reset_timezone         as string

  // ── 3. Time windows (outside tx — deterministic, no DB) ───────────────────
  const now              = new Date()
  const todayMidnightUTC = getMidnightUTC(tz, now)
  const weekStartUTC     = getWeekStartUTC(tz, now)

  // ── 4. Atomic transaction ─────────────────────────────────────────────────
  try {
    return await prisma.$transaction(async (tx: TxClient) => {
      // Row lock: serialises concurrent earnVerifiedReadCP calls for the same
      // wallet. The second caller blocks here until the first commits, then
      // reads the true post-commit COUNT rather than the stale pre-commit 0.
      await tx.$queryRaw`SELECT id FROM "Wallet" WHERE id = ${wallet.id} FOR UPDATE`

      // n = count of verified_read ledger rows already committed today.
      // This is the 0-based curve index for THIS read:
      //   n=0 → 1st read → curve[0] (300)
      //   n=4 → 5th read → curve[4] (25)  ← last paid
      //   n=5 → 6th read → out-of-bounds  → 0
      const n = await tx.walletLedger.count({
        where: {
          walletId: wallet.id,
          reason: 'verified_read',
          createdAt: { gte: todayMidnightUTC },
        },
      })

      // Content-faucet CP earned today (positive rows only; 0-amount rows excluded)
      const contentAgg = await tx.walletLedger.aggregate({
        where: {
          walletId: wallet.id,
          reason:   'verified_read',
          amount:   { gt: 0 },
          createdAt: { gte: todayMidnightUTC },
        },
        _sum: { amount: true },
      })
      const contentEarnedToday = contentAgg._sum.amount ?? 0

      // All CP earned today across all faucets (daily total backstop)
      const dailyAgg = await tx.walletLedger.aggregate({
        where: {
          walletId: wallet.id,
          amount:   { gt: 0 },
          createdAt: { gte: todayMidnightUTC },
        },
        _sum: { amount: true },
      })
      const dailyEarnedSoFar = dailyAgg._sum.amount ?? 0

      // All CP earned this week across all faucets (weekly total backstop)
      const weeklyAgg = await tx.walletLedger.aggregate({
        where: {
          walletId: wallet.id,
          amount:   { gt: 0 },
          createdAt: { gte: weekStartUTC },
        },
        _sum: { amount: true },
      })
      const weeklyEarnedSoFar = weeklyAgg._sum.amount ?? 0

      // ── Curve + cap computation ──────────────────────────────────────────
      let amount = contentFaucetAmount(n, curve)

      // Caps are applied sequentially. Each clamp-and-log call is a no-op if
      // amount is already 0 — never throws.
      if (amount > 0) {
        const clamped = clampToCap(amount, contentEarnedToday, contentDailyCap)
        if (clamped < amount) {
          console.warn(
            '[earnVerifiedReadCP] content daily cap reached userId=%s (cap=%d alreadyEarned=%d)',
            userId, contentDailyCap, contentEarnedToday,
          )
        }
        amount = clamped
      }

      if (amount > 0) {
        const clamped = clampToCap(amount, dailyEarnedSoFar, dailyTotalCap)
        if (clamped < amount) {
          console.warn(
            '[earnVerifiedReadCP] daily total cap reached userId=%s (cap=%d alreadyEarned=%d)',
            userId, dailyTotalCap, dailyEarnedSoFar,
          )
        }
        amount = clamped
      }

      if (amount > 0) {
        const clamped = clampToCap(amount, weeklyEarnedSoFar, weeklyTotalCap)
        if (clamped < amount) {
          console.warn(
            '[earnVerifiedReadCP] weekly total cap reached userId=%s (cap=%d alreadyEarned=%d)',
            userId, weeklyTotalCap, weeklyEarnedSoFar,
          )
        }
        amount = clamped
      }

      // ── Write ledger row (amount may be 0) ──────────────────────────────
      // A 0-amount row anchors the idempotency constraint and is included in
      // the COUNT query above, so future reads on the same day see the correct n.
      await tx.walletLedger.create({
        data: {
          walletId:    wallet.id,
          amount,                        // 0 or positive integer
          reason:      'verified_read',
          referenceId,
        },
      })

      // ── Update balance only when amount > 0 ─────────────────────────────
      if (amount > 0) {
        const updated = await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceCP: { increment: amount } },
          select: { balanceCP: true },
        })
        return { ok: true, deduped: false, newBalance: updated.balanceCP, cpAwarded: amount } satisfies FaucetResult
      }

      // 0-CP grant: balance is unchanged; return the current cached value.
      const unchanged = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
        select: { balanceCP: true },
      })
      return { ok: true, deduped: false, newBalance: unchanged.balanceCP, cpAwarded: 0 } satisfies FaucetResult
    })
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      // Duplicate (walletId, referenceId, reason) — already recorded.
      // The previous call's amount (whatever it was) stands.
      return { ok: true, deduped: true } satisfies FaucetResult
    }
    throw e
  }
}
