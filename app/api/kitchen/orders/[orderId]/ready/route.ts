import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace with real DB update + driver dispatch:
//   await prisma.deliveryOrder.update({
//     where: { id: orderId, restaurant: { userId: session.user.id } },
//     data: { status: "READY", readyAt: new Date() },
//   });
//   // TODO: notify assigned driver that order is ready for pickup

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await params;
  return NextResponse.json({ ok: true, orderId, status: "READY" });
}
