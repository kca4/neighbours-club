import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      status: true,
      quantity: true,
      maxAuthorizedAmount: true,
      finalAmount: true,
      createdAt: true,
      pickedUpAt: true,
      stripePaymentIntentId: true,
      deal: {
        select: {
          id: true,
          slug: true,
          title: true,
          imageUrl: true,
          status: true,
          closesAt: true,
          pickupLocation: true,
          pickupWindowStart: true,
          pickupWindowEnd: true,
          tiers: { orderBy: { tierOrder: "asc" }, take: 1 },
          supplier: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Sort: active (AUTHORIZED + deal OPEN) first, then captured, then history
  const active = orders.filter(
    (o) => o.status === "AUTHORIZED" && o.deal.status === "OPEN",
  );
  const captured = orders.filter((o) => o.status === "CAPTURED");
  const history = orders.filter(
    (o) => !active.includes(o) && !captured.includes(o),
  );

  return NextResponse.json({ orders: [...active, ...captured, ...history] });
}
