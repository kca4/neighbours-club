import { OrderStatus } from "@prisma/client";

/**
 * Calculates the total number of units to prepare for the supplier.
 *
 * Counts: CAPTURED (including recovered), PICKED_UP
 * Does not count: AUTHORIZED, CAPTURE_FAILED, VOIDED, PENDING_AUTHORIZATION
 */
export function calcFinalPaidUnits(
  orders: Array<{ status: OrderStatus; quantity: number }>,
): number {
  return orders
    .filter(
      (o) => o.status === OrderStatus.CAPTURED || o.status === OrderStatus.PICKED_UP,
    )
    .reduce((sum, o) => sum + o.quantity, 0);
}
