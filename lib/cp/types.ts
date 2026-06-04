/**
 * Community Points (CP) — shared types.
 * Importable on both server and client (no DB code here).
 */

// ─── Reason vocabulary ────────────────────────────────────────────────────────
// CLOSED set — add new reasons here and nowhere else.
// Every ledger row must carry one of these; typos cannot fragment the
// idempotency space.

export type CPReason =
  | 'verified_read'       // member read/engaged with a Note
  | 'tier_bridge'         // member's order pushed a group-buy to the next tier
  | 'delivery_waiver'     // delivery-fee waiver redeemed via CP
  | 'group_buy_reward'    // reward issued at group-buy settlement
  | 'signup_bonus'        // one-time welcome grant
  | 'secret_menu_redeem'  // CP burned to unlock a restaurant secret item
  | 'donation'            // member donated CP to a community fund

// ─── Result types ─────────────────────────────────────────────────────────────

/** Successful earn or burn that made a real balance change. */
export interface CPSuccess {
  ok: true
  deduped: false
  newBalance: number
}

/** Idempotent no-op: the (walletId, referenceId, reason) triple was already
 *  committed by a previous call. Balance is unchanged; the caller should treat
 *  this as success. */
export interface CPDeduped {
  ok: true
  deduped: true
}

export type CPResult = CPSuccess | CPDeduped

// ─── Input param types ────────────────────────────────────────────────────────

export interface EarnCPParams {
  userId: string
  /** Positive integer CP units to award. Zero and negative are rejected. */
  amount: number
  reason: CPReason
  /** Stable external key that makes this grant idempotent (e.g. orderId,
   *  noteSlug, "signup"). Required — there is no anonymous ledger write. */
  referenceId: string
}

export interface BurnCPParams {
  userId: string
  /** Positive integer CP units to spend. Zero and negative are rejected.
   *  The ledger row is written as -amount. */
  amount: number
  reason: CPReason
  referenceId: string
}

export interface ReconcileResult {
  /** Cached value from Wallet.balanceCP */
  cached: number
  /** True value computed as SUM(WalletLedger.amount) */
  computed: number
  /** cached − computed. Zero means no drift. */
  drift: number
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/**
 * Thrown by burnCP when the wallet balance is below the requested burn amount.
 * The transaction is rolled back; no ledger row is written; balanceCP is
 * unchanged.
 *
 * Callers MUST handle this explicitly — it is a normal business outcome, not a
 * programming error.
 */
export class InsufficientBalanceError extends Error {
  readonly name = 'InsufficientBalanceError' as const
  readonly requested: number

  constructor(requested: number) {
    super(`Insufficient CP balance: cannot burn ${requested} CP`)
    this.requested = requested
    // Maintain correct prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
