import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLATFORM_FEE_RATE, PAYOUT_DAY } from "@/lib/config";

// TODO: replace mock with real payout history from Stripe Connect transfers:
//   const transfers = await stripe.transfers.list({ destination: restaurant.stripeAccountId, limit: 8 });

export interface PayoutRecord {
  id: string;
  periodLabel: string; // e.g. "Apr 28 – May 4"
  gross: number;
  platformFee: number;
  net: number;
  status: "PAID" | "PENDING" | "PROCESSING";
  paidAt?: string; // ISO
}

export interface PayoutSummary {
  nextPayoutDay: string;
  nextPayoutEstimate: number;
  stripeConnected: boolean;
  history: PayoutRecord[];
}

const MOCK_PAYOUT: PayoutSummary = {
  nextPayoutDay: PAYOUT_DAY,
  nextPayoutEstimate: +(1284.5 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
  stripeConnected: true,
  history: [
    {
      id: "payout_004",
      periodLabel: "Apr 28 – May 4",
      gross: 1284.5,
      platformFee: +(1284.5 * PLATFORM_FEE_RATE).toFixed(2),
      net: +(1284.5 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
      status: "PENDING",
    },
    {
      id: "payout_003",
      periodLabel: "Apr 21 – Apr 27",
      gross: 1143.0,
      platformFee: +(1143.0 * PLATFORM_FEE_RATE).toFixed(2),
      net: +(1143.0 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
      status: "PAID",
      paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "payout_002",
      periodLabel: "Apr 14 – Apr 20",
      gross: 998.0,
      platformFee: +(998.0 * PLATFORM_FEE_RATE).toFixed(2),
      net: +(998.0 * (1 - PLATFORM_FEE_RATE)).toFixed(2),
      status: "PAID",
      paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ payout: MOCK_PAYOUT });
}
