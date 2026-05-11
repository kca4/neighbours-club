import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLATFORM_FEE_RATE } from "@/lib/config";

// TODO: replace mock with real aggregation:
//   const restaurant = await prisma.restaurant.findUnique({ where: { userId: session.user.id } });
//   const today = startOfDay(new Date());
//   const [ordersToday, revenueToday] = await prisma.$transaction([
//     prisma.deliveryOrder.count({ where: { restaurantId: restaurant.id, createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
//     prisma.deliveryOrder.aggregate({ where: { restaurantId: restaurant.id, createdAt: { gte: today }, status: { not: "CANCELLED" } }, _sum: { subtotal: true } }),
//   ]);

export interface KitchenStats {
  ordersToday: number;
  revenueToday: number;
  netToday: number;          // after platform fee
  avgPrepMinutes: number;
  activeOrders: number;
  isAccepting: boolean;
}

const MOCK_STATS: KitchenStats = {
  ordersToday: 14,
  revenueToday: 243.5,
  netToday: +(243.5 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
  avgPrepMinutes: 18,
  activeOrders: 3,
  isAccepting: true,
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ stats: MOCK_STATS });
}
