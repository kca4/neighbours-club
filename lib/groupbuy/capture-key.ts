/**
 * Generates the deterministic Stripe idempotency key for a group-buy capture.
 *
 * Stable across retries: same (dealId, orderId) always produces the same string.
 * The "groupbuy_capture_" prefix makes the key's origin identifiable in Stripe logs.
 */
export function captureIdempotencyKey(dealId: string, orderId: string): string {
  return `groupbuy_capture_${dealId}_${orderId}`;
}
