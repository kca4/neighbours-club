"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface DeliveryOrderSummary {
  id: string;
  status: string;
  total: number;
  items: unknown;
  restaurantName: string;
  restaurantSlug: string;
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
      items: true,
      createdAt: true,
      restaurant: {
        select: { name: true, slug: true },
      },
    },
  });

  if (!order) return null;

  return {
    id: order.id,
    status: order.status,
    total: Number(order.total),
    items: order.items,
    restaurantName: order.restaurant.name,
    restaurantSlug: order.restaurant.slug,
    createdAt: order.createdAt,
  };
}
