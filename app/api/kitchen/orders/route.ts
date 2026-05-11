import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock data with real DB query:
//   const restaurant = await prisma.restaurant.findUnique({ where: { userId: session.user.id } });
//   const orders = await prisma.deliveryOrder.findMany({
//     where: { restaurantId: restaurant.id, status: { in: ["PENDING", "PREPARING", "READY"] } },
//     include: { items: true, customer: { select: { firstName: true } } },
//     orderBy: { createdAt: "asc" },
//   });

export type KitchenOrderStatus = "PENDING" | "PREPARING" | "READY" | "HANDED_OVER";

export interface KitchenOrderItem {
  name: string;
  qty: number;
  note?: string;
}

export interface KitchenOrder {
  id: string;
  orderNumber: string;
  customerFirstName: string;
  status: KitchenOrderStatus;
  items: KitchenOrderItem[];
  subtotal: number;
  receivedAt: string; // ISO
  estimatedReadyAt: string; // ISO
  isGroupOrder: boolean;
}

const MOCK_ORDERS: KitchenOrder[] = [
  {
    id: "ord_001",
    orderNumber: "NC-1042",
    customerFirstName: "James",
    status: "PENDING",
    items: [
      { name: "Tonkotsu Classic", qty: 1 },
      { name: "Pork Gyoza (5)", qty: 1 },
    ],
    subtotal: 26,
    receivedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    estimatedReadyAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
    isGroupOrder: false,
  },
  {
    id: "ord_002",
    orderNumber: "NC-1043",
    customerFirstName: "Sarah",
    status: "PREPARING",
    items: [
      { name: "Spicy Miso", qty: 2 },
      { name: "Edamame", qty: 1 },
    ],
    subtotal: 42,
    receivedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    estimatedReadyAt: new Date(Date.now() + 7 * 60 * 1000).toISOString(),
    isGroupOrder: true,
  },
  {
    id: "ord_003",
    orderNumber: "NC-1041",
    customerFirstName: "Priya",
    status: "READY",
    items: [{ name: "Vegetable Shoyu", qty: 1 }],
    subtotal: 16,
    receivedAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    estimatedReadyAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    isGroupOrder: false,
  },
];

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  // TODO: restrict to RESTAURANT_OWNER or ADMIN role
  return NextResponse.json({ orders: MOCK_ORDERS });
}
