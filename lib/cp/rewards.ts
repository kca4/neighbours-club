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
  /** Awarded once per user per published note when they click "Verify". */
  verified_read: 500,
  /** Awarded once per order when a group-buy deal closes successfully and
   *  the member's payment is captured. Self-heals on cron retry via the
   *  @@unique([walletId, referenceId, reason]) idempotency constraint. */
  group_buy_reward: 1000,
} as const satisfies Record<string, number>
