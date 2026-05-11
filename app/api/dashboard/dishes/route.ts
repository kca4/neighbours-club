import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real top-selling items query:
//   SELECT mi.name, SUM(doi.quantity) as total_ordered, SUM(doi.unit_price * doi.quantity) as revenue
//   FROM delivery_order_items doi
//   JOIN menu_items mi ON doi.menu_item_id = mi.id
//   JOIN delivery_orders do ON doi.order_id = do.id
//   WHERE do.restaurant_id = $1 AND do.created_at >= now() - interval '7 days'
//   GROUP BY mi.id ORDER BY total_ordered DESC LIMIT 6

export interface TopDish {
  name: string;
  ordersThisWeek: number;
  revenue: number;
  changeVsLastWeek: number; // signed %
  colorHex: string;
}

const MOCK_DISHES: TopDish[] = [
  { name: "Tonkotsu Classic", ordersThisWeek: 28, revenue: 476, changeVsLastWeek: 15.2, colorHex: "#C9954A" },
  { name: "Spicy Miso",       ordersThisWeek: 22, revenue: 396, changeVsLastWeek: 4.8,  colorHex: "#F59E0B" },
  { name: "Chicken Karaage",  ordersThisWeek: 18, revenue: 198, changeVsLastWeek: 22.1, colorHex: "#B8860B" },
  { name: "Pork Gyoza (5)",   ordersThisWeek: 16, revenue: 144, changeVsLastWeek: -3.2, colorHex: "#A8754D" },
  { name: "Vegetable Shoyu",  ordersThisWeek: 12, revenue: 192, changeVsLastWeek: 8.9,  colorHex: "#166534" },
  { name: "Shoyu Ramen",      ordersThisWeek: 10, revenue: 160, changeVsLastWeek: -1.0, colorHex: "#8B6508" },
];

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ dishes: MOCK_DISHES });
}
