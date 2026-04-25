import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { DealStatus, OrderStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id: dealId } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { id: true, status: true },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== DealStatus.OPEN) {
    return NextResponse.json(
      { error: `Only OPEN deals can be cancelled. Current status: ${deal.status}` },
      { status: 400 },
    );
  }

  // Fetch all active orders on this deal
  const activeOrders = await prisma.order.findMany({
    where: {
      dealId,
      status: { in: [OrderStatus.PENDING_AUTHORIZATION, OrderStatus.AUTHORIZED] },
    },
    select: { id: true, stripePaymentIntentId: true },
  });

  // Cancel Stripe PaymentIntents outside the DB transaction
  for (const order of activeOrders) {
    if (order.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
      } catch (err: unknown) {
        // Ignore errors for already-terminal intents; log and continue
        console.error(
          "[cancel-deal] Stripe cancel failed for order",
          order.id,
          err,
        );
      }
    }
  }

  // DB transaction: void orders, log audit entries, update deal status
  await prisma.$transaction(async (tx) => {
    for (const order of activeOrders) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.VOIDED },
      });
      await tx.auditLog.create({
        data: {
          action: "ORDER_VOIDED_BY_DEAL_CANCELLATION",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            dealId,
            stripePaymentIntentId: order.stripePaymentIntentId,
          },
        },
      });
    }

    await tx.deal.update({
      where: { id: dealId },
      data: { status: DealStatus.CANCELLED },
    });

    await tx.auditLog.create({
      data: {
        userId: session!.user.id,
        action: "DEAL_CANCELLED",
        entityType: "Deal",
        entityId: dealId,
        metadata: { voidedOrderCount: activeOrders.length },
      },
    });
  });

  return NextResponse.json({ ok: true, voidedOrderCount: activeOrders.length });
}
