/**
 * Server-side wallet data readers.
 *
 * SECURITY: userId is always derived from auth() — never accepted as a
 * parameter from client code. getWalletBalance() accepts a userId only
 * because its caller (Header.tsx) has already resolved auth() and passes
 * the trusted session id.
 */
import 'server-only'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WalletHistoryRow {
  id: string
  amount: number        // integer CP; positive = earn, negative = burn
  reason: string
  referenceId: string
  createdAt: string     // ISO 8601 — serialized so it can safely cross any
                        // server→client boundary without Date marshalling issues
}

export type WalletView =
  | { signedIn: false }
  | { signedIn: true; balanceCP: number; history: WalletHistoryRow[] }

// ─── getMyWalletView ──────────────────────────────────────────────────────────

/**
 * Full wallet view for the /wallet page.
 *
 * Calls auth() internally — the returned userId is server-derived and trusted.
 *
 * Balance: read from the cached Wallet.balanceCP column. NOT computed by
 * summing ledger rows (that's what reconcileWallet() is for).
 *
 * History: most recent 50 ledger rows only (take: 50, desc). The full
 * unbounded ledger is never fetched here.
 */
export async function getMyWalletView(): Promise<WalletView> {
  const session = await auth()
  if (!session?.user?.id) return { signedIn: false }

  const userId = session.user.id

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: {
      balanceCP: true,
      ledger: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          amount: true,
          reason: true,
          referenceId: true,
          createdAt: true,
        },
      },
    },
  })

  return {
    signedIn: true,
    // Cached column read — fast single-column lookup. The ledger is the
    // authority but balanceCP is kept in sync by earnCP/burnCP transactions.
    balanceCP: wallet?.balanceCP ?? 0,
    history: (wallet?.ledger ?? []).map((row) => ({
      id: row.id,
      amount: row.amount,
      reason: row.reason,
      referenceId: row.referenceId,
      createdAt: row.createdAt.toISOString(),
    })),
  }
}

// ─── getWalletBalance ─────────────────────────────────────────────────────────

/**
 * Lightweight balance-only read for the header badge.
 *
 * Called from Header.tsx with the userId already resolved from auth() in
 * that server component — no second auth() call needed.
 *
 * Returns 0 if the user has no wallet yet (never earned or spent CP).
 */
export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    select: { balanceCP: true },
  })
  return wallet?.balanceCP ?? 0
}
