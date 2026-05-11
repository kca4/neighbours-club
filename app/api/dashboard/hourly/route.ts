import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real hourly order aggregation:
//   SELECT date_trunc('hour', created_at) as hour, count(*), sum(subtotal)
//   FROM delivery_orders
//   WHERE restaurant_id = $1 AND created_at >= now() - interval '7 days'
//   GROUP BY hour ORDER BY hour

export interface HourlyBucket {
  hour: number;   // 0–23
  label: string;  // e.g. "11 AM"
  orders: number;
  revenue: number;
}

const MOCK_HOURLY: HourlyBucket[] = [
  { hour: 11, label: "11 AM", orders: 4, revenue: 68 },
  { hour: 12, label: "12 PM", orders: 12, revenue: 198 },
  { hour: 13, label: "1 PM", orders: 9, revenue: 153 },
  { hour: 14, label: "2 PM", orders: 5, revenue: 82 },
  { hour: 17, label: "5 PM", orders: 8, revenue: 136 },
  { hour: 18, label: "6 PM", orders: 16, revenue: 272 },
  { hour: 19, label: "7 PM", orders: 14, revenue: 238 },
  { hour: 20, label: "8 PM", orders: 8, revenue: 137.5 },
];

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ hourly: MOCK_HOURLY });
}
