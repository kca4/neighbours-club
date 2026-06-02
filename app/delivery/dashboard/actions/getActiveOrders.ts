"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryOrderStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ActiveOrder {
  id: string;
  status: string;
  createdAt: string; // ISO — Dates aren't serialisable across the server-action boundary
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: {
    street: string;
    unit: string | null;
    instructions: string | null;
  };
  fulfillmentType: string;
  pickupPin: string | null;
  driverNote: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KITCHEN_STATUSES: DeliveryOrderStatus[] = [
  DeliveryOrderStatus.PENDING,
  DeliveryOrderStatus.ACCEPTED,
  DeliveryOrderStatus.AWAITING_COURIER,
  DeliveryOrderStatus.COURIER_ASSIGNED,
  DeliveryOrderStatus.COOKING,
  DeliveryOrderStatus.READY,
];

// ─── Action ───────────────────────────────────────────────────────────────────

export async function getActiveOrders(
  restaurantId: string
): Promise<ActiveOrder[]> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Ownership guard — ensures owners can only read their own restaurant's orders
  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, ownerId: session.user.id },
    select: { id: true },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found or not owned by you.");
  }

  const orders = await prisma.deliveryOrder.findMany({
    where: {
      restaurantId,
      status: { in: KITCHEN_STATUSES },
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      items: true,
      subtotal: true,
      deliveryFee: true,
      total: true,
      deliveryAddress: true,
      fulfillmentType: true,
      pickupPin: true,
      driverNote: true,
    },
    orderBy: { createdAt: "asc" }, // FIFO kitchen queue — oldest first
  });

  return orders.map((o) => ({
    id: o.id,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    items: o.items as unknown as OrderItem[],
    subtotal: Number(o.subtotal),
    deliveryFee: Number(o.deliveryFee),
    total: Number(o.total),
    deliveryAddress: o.deliveryAddress as ActiveOrder["deliveryAddress"],
    fulfillmentType: o.fulfillmentType,
    pickupPin: o.pickupPin,
    driverNote: o.driverNote,
  }));
}
