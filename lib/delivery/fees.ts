/**
 * lib/delivery/fees.ts — Delivery fee constants and computation.
 *
 * Single source of truth for all delivery fee rates and amounts.
 * Both the server action (createOrder.ts) and the checkout UI import from here,
 * guaranteeing the displayed breakdown always matches what Stripe charges.
 *
 * No server-only imports — safe to use on client and server.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const DELIVERY_FEE = 4.99
export const SERVICE_FEE_RATE = 0.10   // fraction of subtotal
export const HST_RATE = 0.13           // applied to subtotal + deliveryFee + serviceFee

/** CP units a user burns to waive the delivery fee on one order. */
export const WAIVER_COST_CP = 500

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FeeBreakdown {
  subtotal: number
  deliveryFee: number
  serviceFee: number
  tip: number
  tax: number
  total: number
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ─── computeFees ──────────────────────────────────────────────────────────────

/**
 * Derive the full fee breakdown from trusted inputs.
 *
 * Tax is levied on (subtotal + deliveryFee + serviceFee). Tip is not taxed.
 *
 * @param subtotal     Dollar total of ordered items, already validated against DB prices.
 * @param tip          Tip in dollars (user's choice, validated as non-negative).
 * @param applyWaiver  When true, deliveryFee is zeroed and tax is recomputed accordingly.
 */
export function computeFees(
  subtotal: number,
  tip: number,
  applyWaiver = false,
): FeeBreakdown {
  const deliveryFee = applyWaiver ? 0 : DELIVERY_FEE
  const serviceFee = round2(subtotal * SERVICE_FEE_RATE)
  const taxBase = subtotal + deliveryFee + serviceFee
  const tax = round2(taxBase * HST_RATE)
  const total = round2(taxBase + tip + tax)
  return { subtotal, deliveryFee, serviceFee, tip, tax, total }
}

// ─── computeWaiverSavings ─────────────────────────────────────────────────────

export interface WaiverSavings {
  unwaived: FeeBreakdown
  waived: FeeBreakdown
  /**
   * Dollar amount saved — unwaived.total − waived.total.
   * Stored as DeliveryOrder.cpWaivedAmount.
   *
   * = DELIVERY_FEE + round2(DELIVERY_FEE × HST_RATE)
   * At current rates (4.99, 13%): $4.99 + $0.65 = $5.64
   *
   * Savings depend only on DELIVERY_FEE and HST_RATE; tip and subtotal do not
   * affect them. Exposing both full breakdowns makes the math auditable.
   */
  cpWaivedAmount: number
}

/**
 * Compute both the standard and waived fee breakdowns for a given order.
 * Use this when the waiver is being applied to record the dollar savings.
 */
export function computeWaiverSavings(subtotal: number, tip: number): WaiverSavings {
  const unwaived = computeFees(subtotal, tip, false)
  const waived = computeFees(subtotal, tip, true)
  return {
    unwaived,
    waived,
    cpWaivedAmount: round2(unwaived.total - waived.total),
  }
}
