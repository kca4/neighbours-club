import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().min(1).max(200).optional(),
});

// TODO: replace with real DB update + refund trigger:
//   await prisma.deliveryOrder.update({
//     where: { id: orderId, restaurant: { userId: session.user.id } },
//     data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
//   });
//   // TODO: void Stripe payment intent and notify customer

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { orderId } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const reason = parsed.success ? (parsed.data.reason ?? "Rejected by kitchen") : "Rejected by kitchen";
  // TODO: validate orderId belongs to this restaurant owner
  return NextResponse.json({ ok: true, orderId, status: "CANCELLED", reason });
}
