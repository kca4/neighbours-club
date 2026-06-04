"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DeliveryOrderStatus,
  DriverStatus,
  FulfillmentType,
} from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AvailableOrder {
  id: string;
  createdAt: string; // ISO string — Dates aren't serialisable across the boundary
  restaurantName: string;
  pickupAddress: string;
  dropoffAddress: string;
  itemCount: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireDriver() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const driver = await prisma.deliveryDriver.findUnique({
    where: { userId: session.user.id },
    select: { id: true, status: true, activeOrderId: true },
  });

  if (!driver) throw new Error("No driver record found for this user.");
  return driver;
}

// ─── toggleDriverStatus ───────────────────────────────────────────────────────

export async function toggleDriverStatus(
  newStatus: DriverStatus
): Promise<void> {
  const driver = await requireDriver();

  await prisma.deliveryDriver.update({
    where: { id: driver.id },
    data: { status: newStatus },
  });
}

// ─── getAvailableOrders ───────────────────────────────────────────────────────

export async function getAvailableOrders(): Promise<AvailableOrder[]> {
  // Auth check — any logged-in driver can poll
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const orders = await prisma.deliveryOrder.findMany({
    where: {
      status: DeliveryOrderStatus.PENDING,
      driverId: null,
      fulfillmentType: FulfillmentType.INTERNAL,
    },
    select: {
      id: true,
      createdAt: true,
      items: true,
      total: true,
      deliveryAddress: true,
      restaurant: {
        select: { name: true, address: true },
      },
    },
    orderBy: { createdAt: "asc" }, // oldest first — fair FIFO
  });

  return orders.map((o) => {
    const addr = o.deliveryAddress as {
      street: string;
      unit: string | null;
    };
    const dropoffAddress = [addr.street, addr.unit]
      .filter(Boolean)
      .join(", ");

    const items = o.items as Array<{ quantity: number }>;
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      id: o.id,
      createdAt: o.createdAt.toISOString(),
      restaurantName: o.restaurant.name,
      pickupAddress: o.restaurant.address,
      dropoffAddress,
      itemCount,
      total: Number(o.total),
    };
  });
}

// ─── acceptOrder ─────────────────────────────────────────────────────────────
//
// ATOMIC: uses updateMany with status=PENDING AND driverId=null so two
// simultaneous accepts cannot both win. The first to write gets count=1;
// the second gets count=0 and sees "Order already taken."

export async function acceptOrder(
  orderId: string
): Promise<{ success: boolean; error?: string }> {
  const driver = await requireDriver();

  // Guard: driver must not already have an active delivery
  if (driver.activeOrderId) {
    return { success: false, error: "You already have an active delivery." };
  }

  // Generate a 4-digit pickup PIN now (outside the transaction) so the kitchen
  // can display it and the driver must enter it to confirm pickup.
  const pickupPin = String(Math.floor(1000 + Math.random() * 9000));

  // Interactive transaction: conditional claim + driver state update atomically
  const result = await prisma.$transaction(async (tx) => {
    // Conditional update — only succeeds if the order is still PENDING with no driver
    const updated = await tx.deliveryOrder.updateMany({
      where: {
        id: orderId,
        status: DeliveryOrderStatus.PENDING,
        driverId: null,
      },
      data: {
        status: DeliveryOrderStatus.ACCEPTED,
        driverId: driver.id,
        acceptedAt: new Date(),
        pickupPin,
      },
    });

    if (updated.count === 0) {
      // Another driver grabbed it first (or status already changed)
      return { success: false, error: "Order already taken." };
    }

    // Claim succeeded — update the driver record
    await tx.deliveryDriver.update({
      where: { id: driver.id },
      data: {
        status: DriverStatus.ON_DELIVERY,
        activeOrderId: orderId,
      },
    });

    return { success: true };
  });

  return result;
}
