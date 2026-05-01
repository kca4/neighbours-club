import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DealStatus, OrderStatus } from "@prisma/client";

const DONE_STATUSES: OrderStatus[] = [
  OrderStatus.PICKED_UP,
  OrderStatus.NO_SHOW,
  OrderStatus.REFUNDED,
  OrderStatus.CAPTURE_FAILED,
];

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, dealId: true, deal: { select: { status: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== OrderStatus.CAPTURED) {
    return NextResponse.json(
      { error: "Only CAPTURED orders can be marked as no-show" },
      { status: 409 },
    );
  }

  if (order.deal.status !== DealStatus.FULFILLING) {
    return NextResponse.json(
      { error: "Deal must be in FULFILLING status" },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.NO_SHOW },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_NO_SHOW",
        entityType: "Order",
        entityId: orderId,
        metadata: { dealId: order.dealId, markedBy: session.user.id },
      },
    }),
  ]);

  // Same deal-completion check as mark-picked-up
  const remainingCaptured = await prisma.order.count({
    where: { dealId: order.dealId, status: OrderStatus.CAPTURED },
  });

  if (remainingCaptured === 0) {
    const doneCount = await prisma.order.count({
      where: { dealId: order.dealId, status: { in: DONE_STATUSES } },
    });

    if (doneCount > 0) {
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: order.dealId },
          data: { status: DealStatus.COMPLETED },
        }),
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "DEAL_COMPLETED",
            entityType: "Deal",
            entityId: order.dealId,
            metadata: { triggeredBy: "ORDER_NO_SHOW", lastOrderId: orderId },
          },
        }),
      ]);
    }
  }

  return NextResponse.json({ success: true });
}
