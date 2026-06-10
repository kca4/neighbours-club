/**
 * CP economy faucet rates — the single source of truth for all reward amounts.
 *
 * Every CP-minting action must import from here rather than embedding a magic
 * number. Keeping rates in one place means the entire reward economy is
 * auditable and adjustable without grepping across action files.
 *
 * Values are in CP units (integers).
 */
export const CP_REWARDS = {
  /** Awarded once per order when a group-buy deal closes successfully and
   *  the member's payment is captured. Self-heals on cron retry via the
   *  @@unique([walletId, referenceId, reason]) idempotency constraint. */
  group_buy_reward: 330,
} as const satisfies Record<string, number>

// verified_read is intentionally absent: the amount is now derived from the
// diminishing content-faucet curve in EconParam (content_faucet_read_1/2/3to5)
// and enforced atomically inside earnVerifiedReadCP in lib/cp/content-faucet.ts.
