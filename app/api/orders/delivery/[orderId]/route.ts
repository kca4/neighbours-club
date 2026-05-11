import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real DB query:
//   const order = await prisma.deliveryOrder.findUnique({
//     where: { id: orderId, customerId: session.user.id },
//     include: {
//       restaurant: { select: { name: true, address: true } },
//       driver: { select: { firstName: true } },
//       items: { include: { menuItem: { select: { name: true } } } },
//     },
//   });

export type DeliveryOrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "DRIVER_ASSIGNED"
  | "EN_ROUTE_TO_RESTAURANT"
  | "AT_RESTAURANT"
  | "EN_ROUTE_TO_CUSTOMER"
  | "DELIVERED"
  | "CANCELLED";

export interface DeliveryOrderDetail {
  id: string;
  orderNumber: string;
  status: DeliveryOrderStatus;
  restaurantName: string;
  restaurantAddress: string;
  driverFirstName?: string;
  estimatedDeliveryAt?: string; // ISO
  deliveryPhotoUrl?: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  tax: number;
  total: number;
  createdAt: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await params;

  // TODO: fetch real order from DB; return 404 if not found or not owned by session user
  const mock: DeliveryOrderDetail = {
    id: orderId,
    orderNumber: "NC-1042",
    status: "PREPARING",
    restaurantName: "Maïko Ramen",
    restaurantAddress: "Unit 4, 300 Eagleson Rd",
    subtotal: 26,
    deliveryFee: 2.99,
    serviceFee: 1.49,
    tip: 4.68,
    tax: 3.38,
    total: 38.54,
    createdAt: new Date().toISOString(),
  };

  return NextResponse.json({ order: mock });
}
