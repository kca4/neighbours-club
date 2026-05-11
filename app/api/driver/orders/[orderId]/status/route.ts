import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

// Valid driver-side status transitions:
//   DRIVER_ASSIGNED → EN_ROUTE_TO_RESTAURANT → AT_RESTAURANT → EN_ROUTE_TO_CUSTOMER → DELIVERED
const VALID_STATUSES = [
  "EN_ROUTE_TO_RESTAURANT",
  "AT_RESTAURANT",
  "EN_ROUTE_TO_CUSTOMER",
  "DELIVERED",
] as const;

const bodySchema = z.object({
  status: z.enum(VALID_STATUSES),
  photoUrl: z.string().url().optional(), // required when status === "DELIVERED"
});

// TODO: replace with real DB update + customer notification:
//   await prisma.deliveryOrder.update({
//     where: { id: orderId, driverId: session.user.id },
//     data: { status: body.status, deliveryPhotoUrl: body.photoUrl, deliveredAt: body.status === "DELIVERED" ? new Date() : undefined },
//   });
//   // TODO: capture Stripe PaymentIntent when status === "DELIVERED"
//   // TODO: push notification to customer with live status

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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.issues }, { status: 400 });
  }
  if (parsed.data.status === "DELIVERED" && !parsed.data.photoUrl) {
    return NextResponse.json({ error: "photoUrl is required when marking DELIVERED" }, { status: 400 });
  }
  return NextResponse.json({ ok: true, orderId, status: parsed.data.status });
}
