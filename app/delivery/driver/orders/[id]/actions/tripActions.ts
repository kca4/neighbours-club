"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeliveryOrderStatus, DriverStatus } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TripOrder {
  id: string;
  status: DeliveryOrderStatus;
  restaurantName: string;
  pickupAddress: string;
  dropoffAddress: string;
  dropoffInstructions: string | null;
  customerName: string;
  driverNote: string | null;
  /** Whether this order has a pickupPin set (so the UI knows to show the PIN input) */
  hasPinRequired: boolean;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  total: number;
  acceptedAt: string | null;
  pickedUpAt: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireDriverForOrder(orderId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const driver = await prisma.deliveryDriver.findUnique({
    where: { userId: session.user.id },
    select: { id: true, activeOrderId: true },
  });
  if (!driver) throw new Error("No driver record found.");

  return driver;
}

// ─── getActiveTrip ────────────────────────────────────────────────────────────

export async function getActiveTrip(
  orderId: string
): Promise<TripOrder | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const driver = await prisma.deliveryDriver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!driver) return null;

  const order = await prisma.deliveryOrder.findFirst({
    where: {
      id: orderId,
      driverId: driver.id,
    },
    select: {
      id: true,
      status: true,
      items: true,
      subtotal: true,
      deliveryFee: true,
      tip: true,
      total: true,
      deliveryAddress: true,
      driverNote: true,
      pickupPin: true,
      acceptedAt: true,
      pickedUpAt: true,
      restaurant: {
        select: { name: true, address: true },
      },
      user: {
        select: { name: true },
      },
    },
  });

  if (!order) return null;

  const addr = order.deliveryAddress as {
    street: string;
    unit: string | null;
    instructions: string | null;
  };

  const items = (
    order.items as Array<{ name: string; quantity: number; price: number }>
  ).map((i) => ({ name: i.name, quantity: i.quantity, price: Number(i.price) }));

  return {
    id: order.id,
    status: order.status,
    restaurantName: order.restaurant.name,
    pickupAddress: order.restaurant.address,
    dropoffAddress: [addr.street, addr.unit].filter(Boolean).join(", "),
    dropoffInstructions: addr.instructions ?? null,
    customerName: order.user.name,
    driverNote: order.driverNote,
    // Do NOT send the PIN value to the client — only whether one is required.
    hasPinRequired: order.pickupPin !== null,
    items,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    tip: Number(order.tip),
    total: Number(order.total),
    acceptedAt: order.acceptedAt?.toISOString() ?? null,
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
  };
}

// ─── markPickedUp ─────────────────────────────────────────────────────────────
//
// Valid from: READY only (driver cannot skip the kitchen finish step).
// If the order has a pickupPin the supplied pin must match — validated
// server-side so the raw PIN never travels to the client.

export async function markPickedUp(
  orderId: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  const driver = await requireDriverForOrder(orderId);

  // Fetch the order to validate PIN and status
  const order = await prisma.deliveryOrder.findFirst({
    where: { id: orderId, driverId: driver.id },
    select: { status: true, pickupPin: true },
  });

  if (!order) {
    return { success: false, error: "Order not found." };
  }

  if (order.status !== DeliveryOrderStatus.READY) {
    return {
      success: false,
      error: "Order must be READY before pickup can be confirmed.",
    };
  }

  // PIN validation — only enforced when a PIN is set
  if (order.pickupPin !== null) {
    if (pin.trim() !== order.pickupPin) {
      return { success: false, error: "Incorrect PIN. Ask the kitchen to verify." };
    }
  }

  const updated = await prisma.deliveryOrder.updateMany({
    where: {
      id: orderId,
      driverId: driver.id,
      status: DeliveryOrderStatus.READY,
    },
    data: {
      status: DeliveryOrderStatus.PICKED_UP,
      pickedUpAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { success: false, error: "Order state changed — please refresh." };
  }

  return { success: true };
}

// ─── markDelivered ────────────────────────────────────────────────────────────
//
// Valid from: PICKED_UP
// Requires a photo proof data-URI (captured from driver's camera).
//
// TODO: Replace base64 data-URI storage with Vercel Blob or S3 before
// production. Storing large base64 strings directly in Postgres is only
// acceptable for a development stub — in production upload the file to
// object storage and store only the resulting URL here.

export async function markDelivered(
  orderId: string,
  photoDataUri: string
): Promise<{ success: boolean; error?: string }> {
  if (!photoDataUri || !photoDataUri.startsWith("data:image/")) {
    return { success: false, error: "A delivery photo is required." };
  }

  const driver = await requireDriverForOrder(orderId);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.deliveryOrder.updateMany({
      where: {
        id: orderId,
        driverId: driver.id,
        status: DeliveryOrderStatus.PICKED_UP,
      },
      data: {
        status: DeliveryOrderStatus.DELIVERED,
        deliveredAt: new Date(),
        // TODO: swap for object-storage URL (Vercel Blob / S3) before production
        dropoffPhotoUrl: photoDataUri,
      },
    });

    if (updated.count === 0) {
      return {
        success: false,
        error: "Order must be in PICKED_UP state to confirm delivery.",
      };
    }

    // Free the driver — only clear activeOrderId if it still points to this order
    await tx.deliveryDriver.update({
      where: { id: driver.id, activeOrderId: orderId },
      data: {
        status: DriverStatus.AVAILABLE,
        activeOrderId: null,
      },
    });

    return { success: true };
  });

  return result;
}
