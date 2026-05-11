import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real offer matching:
//   Find READY delivery orders within driver's coverage area, not yet assigned to a driver,
//   ordered by proximity to driver's current location.
//   const offers = await prisma.deliveryOrder.findMany({
//     where: { status: "READY", driverId: null },
//     include: { restaurant: { select: { name: true, address: true } }, items: true },
//     take: 3,
//   });

export interface DeliveryOffer {
  orderId: string;
  orderNumber: string;
  restaurantName: string;
  restaurantAddress: string;
  customerAddress: string;
  estimatedDistanceKm: number;
  estimatedDriveMinutes: number;
  payout: number;   // driver's share in dollars
  itemCount: number;
  expiresAt: string; // ISO — offer expires if not accepted
}

const MOCK_OFFERS: DeliveryOffer[] = [
  {
    orderId: "ord_001",
    orderNumber: "NC-1042",
    restaurantName: "Maïko Ramen",
    restaurantAddress: "Unit 4, 300 Eagleson Rd",
    customerAddress: "142 Castlefrank Rd",
    estimatedDistanceKm: 1.4,
    estimatedDriveMinutes: 6,
    payout: 5.5,
    itemCount: 2,
    expiresAt: new Date(Date.now() + 45 * 1000).toISOString(),
  },
];

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  // TODO: only return offers if driver isOnline === true
  return NextResponse.json({ offers: MOCK_OFFERS });
}
