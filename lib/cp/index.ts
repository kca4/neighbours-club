/**
 * lib/cp — Community Points mutation helpers.
 *
 * THIS IS THE ONLY SANCTIONED WAY TO MOVE CP IN THE CODEBASE.
 *
 * Rules enforced here:
 *  • WalletLedger is the source of truth. Wallet.balanceCP is updated ONLY
 *    inside the same $transaction as the ledger insert that justifies it.
 *  • earnCP and burnCP are the only exported mutation functions. A generic
 *    signed-amount writer is intentionally absent.
 *  • Every ledger write carries a non-null referenceId. No anonymous writes.
 *  • Idempotency is enforced via the @@unique([walletId, referenceId, reason])
 *    constraint; duplicate calls return { ok: true, deduped: true } and leave
 *    the balance unchanged.
 */
import 'server-only'

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

import type {
  BurnCPParams,
  CPResult,
  EarnCPParams,
  ReconcileResult,
} from './types'
import { InsufficientBalanceError } from './types'

// Prisma transaction client type — the subset of PrismaClient available inside
// a $transaction callback (connection/lifecycle methods are excluded).
type TxClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

export type { CPReason, CPResult, EarnCPParams, BurnCPParams, ReconcileResult } from './types'
export { InsufficientBalanceError } from './types'

// ─── Internal helpers ─────────────────────────────────────────────────────────

function isPrismaUniqueViolation(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
  )
}

function assertPositiveInteger(amount: number, label: string): void {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new RangeError(
      `${label}: amount must be a positive integer, received ${amount}`,
    )
  }
}

// ─── getOrCreateWallet ────────────────────────────────────────────────────────

/**
 * Idempotent wallet bootstrap — safe to call concurrently.
 *
 * Uses upsert on the unique userId column; two simultaneous calls cannot
 * create duplicate wallets. Returns the wallet in either case.
 *
 * Pass a Prisma transaction client (tx) when calling from inside a
 * $transaction callback so the wallet creation is part of the same atomic unit.
 */
export async function getOrCreateWallet(
  userId: string,
  tx?: TxClient,
): Promise<{ id: string; userId: string; balanceCP: number }> {
  const client = tx ?? prisma
  return client.wallet.upsert({
    where: { userId },
    create: { userId, balanceCP: 0 },
    update: {},
  })
}

// ─── earnCP ───────────────────────────────────────────────────────────────────

/**
 * Award CP to a user.
 *
 * Contract:
 *  • amount must be a positive integer. Validated before any DB work.
 *  • referenceId is required; there are no anonymous ledger rows.
 *  • The ledger insert is the idempotency gate — it comes BEFORE the balance
 *    increment. If the row already exists (P2002), the transaction rolls back
 *    and { ok: true, deduped: true } is returned. The balance is NOT
 *    incremented twice.
 *  • On any other error, the exception propagates to the caller.
 *
 * Returns:
 *  { ok: true, deduped: false, newBalance: number }  — real grant
 *  { ok: true, deduped: true }                       — idempotent no-op
 */
export async function earnCP(params: EarnCPParams): Promise<CPResult> {
  const { userId, amount, reason, referenceId } = params

  assertPositiveInteger(amount, 'earnCP')

  try {
    return await prisma.$transaction(async (tx: TxClient) => {
      // Step 1: ensure wallet exists (atomic upsert — concurrent-safe)
      const wallet = await getOrCreateWallet(userId, tx)

      // Step 2: insert ledger row FIRST — this is the idempotency gate.
      //         If this unique-constraint is violated, the transaction rolls
      //         back before the balance ever changes.
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amount,      // positive
          reason,
          referenceId,
        },
      })

      // Step 3: increment balance — only reached if the ledger insert succeeded
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceCP: { increment: amount } },
        select: { balanceCP: true },
      })

      return {
        ok: true,
        deduped: false,
        newBalance: updated.balanceCP,
      } satisfies CPResult
    })
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      // Duplicate (walletId, referenceId, reason) — idempotent retry.
      // The transaction has already rolled back; balanceCP is unchanged.
      return { ok: true, deduped: true } satisfies CPResult
    }
    throw e
  }
}

// ─── burnCP ───────────────────────────────────────────────────────────────────

/**
 * Spend CP from a user's wallet.
 *
 * Contract:
 *  • amount must be a positive integer. The ledger row is written as -amount.
 *    Validated before any DB work.
 *  • referenceId is required.
 *  • The ledger insert is the idempotency gate — comes BEFORE the balance
 *    decrement.
 *  • OVERDRAFT GUARD: balance is decremented via a conditional updateMany
 *    (WHERE balanceCP >= amount). If no rows are updated, the wallet had
 *    insufficient funds; InsufficientBalanceError is thrown, rolling back the
 *    entire transaction — including the ledger insert. The balance and ledger
 *    are both left unchanged.
 *  • IDEMPOTENCY vs OVERDRAFT are different outcomes:
 *      P2002 on ledger insert     → idempotent retry  → return deduped: true
 *      count === 0 on updateMany  → insufficient funds → throw InsufficientBalanceError
 *
 * Returns:
 *  { ok: true, deduped: false, newBalance: number }  — real burn
 *  { ok: true, deduped: true }                       — idempotent no-op
 *
 * Throws:
 *  InsufficientBalanceError  — insufficient balance (expected, handle explicitly)
 *  anything else             — unexpected DB error (let it propagate)
 */
export async function burnCP(params: BurnCPParams): Promise<CPResult> {
  const { userId, amount, reason, referenceId } = params

  assertPositiveInteger(amount, 'burnCP')

  try {
    return await prisma.$transaction(async (tx: TxClient) => {
      // Step 1: ensure wallet exists
      const wallet = await getOrCreateWallet(userId, tx)

      // Step 2: insert ledger row FIRST — idempotency gate.
      //         Written as negative amount to record the spend.
      await tx.walletLedger.create({
        data: {
          walletId: wallet.id,
          amount: -amount,   // negative
          reason,
          referenceId,
        },
      })

      // Step 3: conditional decrement — overdraft guard.
      //         WHERE balanceCP >= amount ensures we never go below zero,
      //         even under concurrent burns (Postgres evaluates the WHERE
      //         clause atomically relative to the update).
      const res = await tx.wallet.updateMany({
        where: { userId, balanceCP: { gte: amount } },
        data: { balanceCP: { decrement: amount } },
      })

      if (res.count === 0) {
        // Insufficient balance. Throwing inside the callback causes Prisma to
        // roll back the entire transaction — the ledger row is NOT committed.
        throw new InsufficientBalanceError(amount)
      }

      // Step 4: read the new balance (updateMany doesn't return the updated row)
      const updated = await tx.wallet.findUniqueOrThrow({
        where: { userId },
        select: { balanceCP: true },
      })

      return {
        ok: true,
        deduped: false,
        newBalance: updated.balanceCP,
      } satisfies CPResult
    })
  } catch (e) {
    if (isPrismaUniqueViolation(e)) {
      // Duplicate (walletId, referenceId, reason) — idempotent retry.
      // The original burn was already committed; do NOT decrement again.
      return { ok: true, deduped: true } satisfies CPResult
    }
    // InsufficientBalanceError propagates here — caller must handle it.
    throw e
  }
}

// ─── reconcileWallet ──────────────────────────────────────────────────────────

/**
 * Audit / repair helper.  NOT called automatically.
 *
 * Computes the true CP balance as SUM(WalletLedger.amount) and compares it
 * against the cached Wallet.balanceCP.
 *
 * When repair=true, if drift is non-zero, sets Wallet.balanceCP = computed
 * inside a $transaction, bringing the cache back in line with the ledger.
 *
 * This function is the proof that the ledger is the authority: if anything
 * ever increments or decrements Wallet.balanceCP without a corresponding
 * ledger row, drift will be non-zero and this function will detect it.
 *
 * Use this from an admin/debug endpoint only — never call it in hot paths.
 */
export async function reconcileWallet(
  userId: string,
  repair = false,
): Promise<ReconcileResult> {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })

  if (!wallet) {
    // No wallet exists — the user has never earned or burned CP.
    return { cached: 0, computed: 0, drift: 0 }
  }

  const agg = await prisma.walletLedger.aggregate({
    where: { walletId: wallet.id },
    _sum: { amount: true },
  })

  const computed = agg._sum.amount ?? 0
  const cached = wallet.balanceCP
  const drift = cached - computed

  if (repair && drift !== 0) {
    await prisma.$transaction(async (tx: TxClient) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balanceCP: computed },
      })
    })
  }

  return { cached, computed, drift }
}
