import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real attention items derived from:
//   - Orders stuck in PENDING > 10 min
//   - Menu items marked isAvailable=true but out of stock (via manual flag)
//   - Payout issues (missing bank details, failed deposit)
//   - Negative reviews in last 24h

export interface AttentionItem {
  id: string;
  type: "STUCK_ORDER" | "OUT_OF_STOCK" | "PAYOUT" | "REVIEW";
  title: string;
  description: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  actionLabel?: string;
  actionHref?: string;
}

const MOCK_ATTENTION: AttentionItem[] = [
  // TODO: generate from real DB state
];

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ items: MOCK_ATTENTION });
}
