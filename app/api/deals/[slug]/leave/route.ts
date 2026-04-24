import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { DealStatus, OrderStatus } from "@prisma/client";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  const deal = await prisma.deal.findUnique({
    where: { slug },
    select: { id: true, status: true },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== DealStatus.OPEN) {
    return NextResponse.json(
      { error: "You can only leave a deal while it is open" },
      { status: 409 },
    );
  }

  const order = await prisma.order.findUnique({
    where: { userId_dealId: { userId: session.user.id, dealId: deal.id } },
    select: { id: true, status: true, stripePaymentIntentId: true },
  });

  if (!order) {
    return NextResponse.json(
      { error: "You do not have an order on this deal" },
      { status: 404 },
    );
  }

  if (order.status !== OrderStatus.AUTHORIZED) {
    return NextResponse.json(
      {
        error:
          order.status === OrderStatus.CAPTURED
            ? "Your order has already been charged and cannot be cancelled here"
            : "Your order cannot be cancelled in its current state",
      },
      { status: 409 },
    );
  }

  // Cancel the PaymentIntent via Stripe (skip gracefully if no PI id — seed data edge case)
  if (order.stripePaymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
    } catch (err: unknown) {
      const stripeErr = err as { code?: string };
      // Already cancelled / already captured — log and surface
      if (stripeErr?.code === "payment_intent_unexpected_state") {
        console.warn(
          "[leave] PaymentIntent already in terminal state",
          order.stripePaymentIntentId,
          err,
        );
        return NextResponse.json(
          {
            error:
              "Unable to cancel — the payment is in an unexpected state. Please contact support.",
          },
          { status: 409 },
        );
      }
      console.error("[leave] Stripe cancel failed", err);
      return NextResponse.json(
        { error: "Payment cancellation failed. Please try again." },
        { status: 500 },
      );
    }
  } else {
    // Seed-data / legacy order with no PaymentIntent — log the skip
    console.info(
      "[leave] Order has no stripePaymentIntentId; skipping Stripe cancel",
      order.id,
    );
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_VOID_STRIPE_SKIPPED_NO_INTENT",
        entityType: "Order",
        entityId: order.id,
        metadata: { reason: "stripePaymentIntentId was null (legacy/seed order)" },
      },
    });
  }

  // Void the order and write audit log
  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.VOIDED },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_VOIDED_BY_MEMBER",
        entityType: "Order",
        entityId: order.id,
        metadata: { stripePaymentIntentId: order.stripePaymentIntentId },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
