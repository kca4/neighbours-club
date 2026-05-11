import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: record decline to avoid re-offering the same order to the same driver.
//   await prisma.offerDecline.create({ data: { orderId, driverId: session.user.id } });
//   Offer matching query should exclude orders with a matching OfferDecline for this driver.

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await params;
  return NextResponse.json({ ok: true, orderId });
}
