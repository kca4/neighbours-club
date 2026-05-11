import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace with real atomic DB update (use transaction to prevent double-accept):
//   await prisma.$transaction(async (tx) => {
//     const order = await tx.deliveryOrder.findUnique({ where: { id: orderId } });
//     if (order.driverId) throw new Error("Already claimed");
//     await tx.deliveryOrder.update({ where: { id: orderId }, data: { driverId: session.user.id, status: "DRIVER_ASSIGNED", assignedAt: new Date() } });
//   });
//   // TODO: notify restaurant that a driver accepted

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await params;
  return NextResponse.json({ ok: true, orderId, status: "DRIVER_ASSIGNED" });
}
