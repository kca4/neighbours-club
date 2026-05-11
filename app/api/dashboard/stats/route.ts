import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLATFORM_FEE_RATE, PAYOUT_DAY } from "@/lib/config";

// TODO: replace mock with real DB aggregation across current week + previous week
// for trend calculation.

export interface DashboardStats {
  weekRevenue: number;
  weekOrders: number;
  weekNetPayout: number;
  avgOrderValue: number;
  revenueChange: number;   // % vs previous week, signed
  ordersChange: number;    // % vs previous week, signed
  nextPayoutDay: string;
  nextPayoutEstimate: number;
  rating: number;
  reviewCount: number;
}

const MOCK_STATS: DashboardStats = {
  weekRevenue: 1284.5,
  weekOrders: 76,
  weekNetPayout: +(1284.5 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
  avgOrderValue: +(1284.5 / 76).toFixed(2),
  revenueChange: 12.4,
  ordersChange: 8.2,
  nextPayoutDay: PAYOUT_DAY,
  nextPayoutEstimate: +(1284.5 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
  rating: 4.8,
  reviewCount: 212,
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ stats: MOCK_STATS });
}
