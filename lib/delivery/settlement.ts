/**
 * lib/delivery/settlement.ts — Post-payment settlement logic.
 *
 * THIS IS THE SINGLE IMPLEMENTATION of what happens after Stripe confirms
 * payment on a delivery order. Both the production webhook and the dev-only
 * test trigger call this function. They must never diverge.
 *
 * Operations (all idempotent — safe to re-run on webhook retries):
 *   1. Transition PENDING_PAYMENT → PENDING + set dispatchStartedAt.
 *      If the order is already past PENDING_PAYMENT this step is a no-op.
 *   2. Burn CP for the delivery-fee waiver if cpWaiverApplied && !cpWaiverSettled.
 *      InsufficientBalanceError is caught and logged — it does NOT fail the order.
 */
import 'server-only'

import { prisma } from '@/lib/prisma'
import { DeliveryOrderStatus } from '@prisma/client'
import { burnCP, InsufficientBalanceError } from '@/lib/cp'

export async function settleDeliveryPayment(orderId: string): Promise<void> {
  const order = await prisma.deliveryOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      userId: true,
      cpWaiverApplied: true,
      cpWaiverSettled: true,
      cpWaiverCost: true,
    },
  })

  if (!order) {
    console.warn(`[settlement] Order ${orderId} not found`)
    return
  }

  // ── 1. Status transition ──────────────────────────────────────────────────
  if (order.status === DeliveryOrderStatus.PENDING_PAYMENT) {
    await prisma.deliveryOrder.update({
      where: { id: order.id },
      data: {
        status: DeliveryOrderStatus.PENDING,
        dispatchStartedAt: new Date(),
      },
    })
    console.log(`[settlement] Order ${orderId} → PENDING`)
  } else {
    // Already transitioned — idempotent no-op.
    console.log(`[settlement] Order ${orderId} already at ${order.status} — skipping transition`)
  }

  // ── 2. CP waiver burn ─────────────────────────────────────────────────────
  // Short-circuit: nothing to do if no waiver was applied or it's already settled.
  if (!order.cpWaiverApplied || order.cpWaiverSettled || !order.cpWaiverCost) {
    return
  }

  try {
    const result = await burnCP({
      userId: order.userId,
      amount: order.cpWaiverCost,
      reason: 'delivery_fee_waiver',
      referenceId: `delivery_fee_waiver:${order.id}`,
    })

    // Mark settled — covers both a real burn and a deduped webhook retry.
    await prisma.deliveryOrder.update({
      where: { id: order.id },
      data: { cpWaiverSettled: true },
    })

    console.log(`[settlement] CP waiver settled for order ${orderId} (deduped: ${result.deduped})`)
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      // Rare race: user spent their CP elsewhere between the eligibility check
      // in createDeliveryOrder and now. Payment is already captured at the
      // discounted price — do NOT cancel or fail the order.
      //
      // cpWaiverSettled stays false, making this row queryable for manual
      // reconciliation. cpWaivedAmount on the order records the exact dollar gap.
      console.error(
        `[CP_WAIVER_UNSETTLED] orderId=${orderId} — payment captured at waived price ` +
        `but burnCP failed (insufficient balance). Flag for reconciliation.`
      )
    } else {
      // Unexpected DB or application error — re-throw so the webhook returns
      // a non-2xx and Stripe retries. burnCP's idempotency guard means a retry
      // is safe.
      throw e
    }
  }
}
