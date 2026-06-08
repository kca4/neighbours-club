"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { DeliveryOrderStatus, DriverStatus } from "@prisma/client";

// ─── Input ────────────────────────────────────────────────────────────────────

interface RefundAndCancelInput {
  orderId: string;
  reason?: string;
  isEmergencyCancel: boolean;
}

// ─── Result ───────────────────────────────────────────────────────────────────

type RefundResult =
  | { success: true }
  | { success: false; error: string };

// ─── Action ───────────────────────────────────────────────────────────────────

export async function refundAndCancelOrder(
  input: RefundAndCancelInput
): Promise<RefundResult> {
  const { orderId, reason, isEmergencyCancel } = input;

  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized." };
  }
  const userId = session.user.id;

  // ── 2. Ownership guard + fresh order read ──────────────────────────────────
  const order = await prisma.deliveryOrder.findFirst({
    where: {
      id: orderId,
      restaurant: { ownerId: userId },
    },
    select: {
      id: true,
      status: true,
      stripePaymentIntentId: true,
      cancellationReason: true,
      driverId: true,
    },
  });

  if (!order) {
    return { success: false, error: "Order not found or not accessible." };
  }

  // ── 3. Idempotency — already cancelled ────────────────────────────────────
  // Safe to return success: Stripe refund already issued on a previous attempt,
  // and the DB is already in the terminal state.
  if (order.status === DeliveryOrderStatus.CANCELLED) {
    return { success: true };
  }

  // ── 4. Stripe refund ───────────────────────────────────────────────────────
  // Refund FIRST — if this throws, we do NOT touch the DB.
  // The idempotency key `refund_<orderId>` is stable across retries, so even
  // if the network drops after Stripe accepts the call, a retry is a no-op.
  if (order.stripePaymentIntentId) {
    try {
      await stripe.refunds.create(
        {
          payment_intent: order.stripePaymentIntentId,
          reason: "requested_by_customer",
        },
        { idempotencyKey: `refund_${order.id}` }
      );
    } catch (err) {
      // Refund failed — surface it so staff can retry. DB is untouched.
      const message = err instanceof Error ? err.message : "Stripe refund failed.";
      console.error(`[refundAndCancelOrder] Stripe refund error for order ${orderId}:`, err);
      return { success: false, error: `Refund failed: ${message}` };
    }
  } else {
    // No Stripe PI: either (a) an abandoned PENDING_PAYMENT order that never
    // completed payment, or (b) a CP-only secret-menu redemption order that was
    // legitimately paid with Community Points and never had a PI. Both cases
    // correctly skip the Stripe refund — no fiat was collected.
    console.warn(
      `[refundAndCancelOrder] Order ${orderId} has no stripePaymentIntentId — cancelling without Stripe refund (CP-only or abandoned draft).`
    );
  }

  // ── 5. DB update (atomic) ──────────────────────────────────────────────────
  // Refund succeeded. If this write fails, the idempotency key ensures the
  // retry refund is a no-op while we complete the DB update.
  try {
    await prisma.$transaction(async (tx) => {
      await tx.deliveryOrder.update({
        where: { id: orderId },
        data: {
          status: DeliveryOrderStatus.CANCELLED,
          ...(reason !== undefined ? { cancellationReason: reason } : {}),
          needsAdminReview: isEmergencyCancel,
        },
      });

      // Release the driver if one was assigned to this order.
      // updateMany with the activeOrderId guard is idempotent — if the driver
      // already moved on (rare race), the where clause simply matches 0 rows.
      if (order.driverId) {
        await tx.deliveryDriver.updateMany({
          where: { id: order.driverId, activeOrderId: orderId },
          data: { status: DriverStatus.AVAILABLE, activeOrderId: null },
        });
      }
    });
  } catch (err) {
    // Refund already issued — log clearly so ops can reconcile.
    console.error(
      `[refundAndCancelOrder] CRITICAL: Stripe refund issued for order ${orderId} but DB update failed. Manual reconciliation required.`,
      err
    );
    return {
      success: false,
      error:
        "Refund was issued but we failed to update the order status. Please contact support.",
    };
  }

  return { success: true };
}
