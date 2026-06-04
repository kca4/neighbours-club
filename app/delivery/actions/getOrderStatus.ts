"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface DeliveryOrderSummary {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  tip: number;
  tax: number;
  items: unknown;
  restaurantName: string;
  restaurantSlug: string;
  estimatedMinMin: number | null;
  estimatedMinMax: number | null;
  pickedUpAt: string | null;   // ISO string
  dropoffPhotoUrl: string | null;
  createdAt: Date;
}

export async function getDeliveryOrderStatus(
  orderId: string
): Promise<DeliveryOrderSummary | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const order = await prisma.deliveryOrder.findFirst({
    where: {
      id: orderId,
      userId: session.user.id, // users can only see their own orders
    },
    select: {
      id: true,
      status: true,
      total: true,
      subtotal: true,
      deliveryFee: true,
      tip: true,
      tax: true,
      items: true,
      pickedUpAt: true,
      dropoffPhotoUrl: true,
      createdAt: true,
      restaurant: {
        select: {
          name: true,
          slug: true,
          estimatedMinMin: true,
          estimatedMinMax: true,
        },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    tip: Number(order.tip),
    tax: Number(order.tax),
    items: order.items,
    restaurantName: order.restaurant.name,
    restaurantSlug: order.restaurant.slug,
    estimatedMinMin: order.restaurant.estimatedMinMin,
    estimatedMinMax: order.restaurant.estimatedMinMax,
    pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
    dropoffPhotoUrl: order.dropoffPhotoUrl,
    createdAt: order.createdAt,
  };
}
