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

/** CP units a user burns to get a partial delivery-fee discount on one order.
 *  At $0.01/CP: 250 CP = $2.50 off. */
export const WAIVER_COST_CP = 250

/** Dollar amount deducted from the delivery fee when a CP waiver is applied.
 *  250 CP × $0.01/CP = $2.50. Customer pays the remaining $2.49.
 *
 *  MARGIN NOTE: the waiver can currently stack on Uber-escalated orders
 *  (AWAITING_COURIER / COURIER_ASSIGNED fulfillment), where the Uber Direct
 *  cost is borne by the platform. That makes a waivered Uber order margin-
 *  negative on the delivery fee. For the internal-courier pilot this is
 *  acceptable and low-frequency. INSTRUMENT this path (log cpWaiverApplied +
 *  fulfillmentType at settlement) before enabling real Uber escalation;
 *  restrict or reprice at that point as a margin-control lever. */
export const WAIVER_DISCOUNT_AMOUNT = 2.50

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
 * @param applyWaiver  When true, WAIVER_DISCOUNT_AMOUNT ($2.50) is deducted from the
 *                     delivery fee and tax is recomputed on the lower base.
 *                     Customer pays $2.49 delivery (= $4.99 − $2.50).
 */
export function computeFees(
  subtotal: number,
  tip: number,
  applyWaiver = false,
): FeeBreakdown {
  const deliveryFee = applyWaiver
    ? round2(DELIVERY_FEE - WAIVER_DISCOUNT_AMOUNT)
    : DELIVERY_FEE
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
   * = WAIVER_DISCOUNT_AMOUNT + round2(WAIVER_DISCOUNT_AMOUNT × HST_RATE)
   * At current rates ($2.50 discount, 13%): $2.50 + $0.33 = $2.83
   *
   * Note: the UI displays "$2.50 off delivery" (the CP-backed discount) rather
   * than this total-savings figure, to keep the $0.01/CP rate transparent.
   * Savings depend only on WAIVER_DISCOUNT_AMOUNT and HST_RATE; tip and
   * subtotal do not affect them. Exposing both full breakdowns makes the
   * math auditable.
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
