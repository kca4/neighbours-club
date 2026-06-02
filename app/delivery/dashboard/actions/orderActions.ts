"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryOrderStatus } from "@prisma/client";
import { refundAndCancelOrder } from "./refundAndCancelOrder";

// ─── Ownership helper ─────────────────────────────────────────────────────────

async function getOwnedOrder(orderId: string, userId: string) {
  const order = await prisma.deliveryOrder.findFirst({
    where: {
      id: orderId,
      restaurant: { ownerId: userId },
    },
    select: {
      id: true,
      status: true,
      stripePaymentIntentId: true,
    },
  });
  if (!order) throw new Error("Order not found or not accessible.");
  return order;
}

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ─── PENDING → ACCEPTED ───────────────────────────────────────────────────────

export async function acceptOrder(orderId: string): Promise<void> {
  const userId = await requireSession();
  const order = await getOwnedOrder(orderId, userId);

  // Idempotent — if already accepted (or further along) do nothing
  if (order.status !== DeliveryOrderStatus.PENDING) return;

  await prisma.deliveryOrder.update({
    where: { id: orderId },
    data: {
      status: DeliveryOrderStatus.ACCEPTED,
      acceptedAt: new Date(),
    },
  });
}

// ─── ACCEPTED / COURIER_ASSIGNED → COOKING ────────────────────────────────────

export async function startCooking(orderId: string): Promise<void> {
  const userId = await requireSession();
  const order = await getOwnedOrder(orderId, userId);

  const allowed = new Set<DeliveryOrderStatus>([
    DeliveryOrderStatus.ACCEPTED,
    DeliveryOrderStatus.COURIER_ASSIGNED,
  ]);
  if (!allowed.has(order.status as DeliveryOrderStatus)) return;

  await prisma.deliveryOrder.update({
    where: { id: orderId },
    data: {
      status: DeliveryOrderStatus.COOKING,
      cookingStartedAt: new Date(),
    },
  });
}

// ─── COOKING → READY ──────────────────────────────────────────────────────────

export async function markReady(orderId: string): Promise<void> {
  const userId = await requireSession();
  const order = await getOwnedOrder(orderId, userId);

  if (order.status !== DeliveryOrderStatus.COOKING) return;

  await prisma.deliveryOrder.update({
    where: { id: orderId },
    data: {
      status: DeliveryOrderStatus.READY,
      readyAt: new Date(),
    },
  });
}

// ─── PENDING → CANCELLED (reject, no food started) ───────────────────────────

export async function rejectOrder(orderId: string): Promise<void> {
  const userId = await requireSession();
  const order = await getOwnedOrder(orderId, userId);

  if (order.status !== DeliveryOrderStatus.PENDING) return;

  const result = await refundAndCancelOrder({
    orderId,
    reason: "Rejected by restaurant",
    isEmergencyCancel: false,
  });

  if (!result.success) throw new Error(result.error);
}

// ─── Post-PENDING → CANCELLED (emergency cancel, food may have started) ───────

export async function cancelOrder(
  orderId: string,
  cancellationReason: string
): Promise<void> {
  const userId = await requireSession();
  const order = await getOwnedOrder(orderId, userId);

  const cancellable = new Set<DeliveryOrderStatus>([
    DeliveryOrderStatus.ACCEPTED,
    DeliveryOrderStatus.AWAITING_COURIER,
    DeliveryOrderStatus.COURIER_ASSIGNED,
    DeliveryOrderStatus.COOKING,
    DeliveryOrderStatus.READY,
  ]);
  if (!cancellable.has(order.status as DeliveryOrderStatus)) return;

  const result = await refundAndCancelOrder({
    orderId,
    reason: cancellationReason,
    isEmergencyCancel: true,
  });

  if (!result.success) throw new Error(result.error);
}

// ─── Dev-only: force-set any status ──────────────────────────────────────────
// Lets developers exercise the gate logic without real Stripe/Uber events.
// MUST NOT be called in production — guarded at both call site and here.

export async function devSetOrderStatus(
  orderId: string,
  status: string
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("devSetOrderStatus is not available in production.");
  }

  const userId = await requireSession();
  await getOwnedOrder(orderId, userId); // ownership check still applies

  await prisma.deliveryOrder.update({
    where: { id: orderId },
    data: { status: status as DeliveryOrderStatus },
  });
}
