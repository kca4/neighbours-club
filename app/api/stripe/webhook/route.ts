import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import type Stripe from "stripe";

// Next.js App Router: disable body parsing so we can read the raw bytes
// for Stripe signature verification.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("[webhook] Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const pi = event.data.object as Stripe.PaymentIntent;

  switch (event.type) {
    case "payment_intent.amount_capturable_updated": {
      // Primary signal: card hold confirmed. Promote PENDING_AUTHORIZATION → AUTHORIZED.
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: pi.id },
        select: { id: true, status: true },
      });

      if (!order) {
        console.warn("[webhook] No order found for PI", pi.id);
        break;
      }

      if (order.status === OrderStatus.PENDING_AUTHORIZATION) {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.AUTHORIZED },
          }),
          prisma.auditLog.create({
            data: {
              action: "ORDER_AUTHORIZED",
              entityType: "Order",
              entityId: order.id,
              metadata: { stripePaymentIntentId: pi.id, eventId: event.id },
            },
          }),
        ]);
      } else if (order.status === OrderStatus.AUTHORIZED) {
        // Already authorized — idempotent, do nothing
      } else {
        console.warn(
          "[webhook] amount_capturable_updated received but order is in status",
          order.status,
          order.id,
        );
      }
      break;
    }

    case "payment_intent.canceled": {
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: pi.id },
        select: { id: true, status: true },
      });

      if (!order) {
        console.warn("[webhook] No order found for PI", pi.id);
        break;
      }

      if (order.status === OrderStatus.VOIDED) {
        // Already voided — idempotent
        break;
      }

      if (order.status === OrderStatus.PENDING_AUTHORIZATION) {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.VOIDED },
          }),
          prisma.auditLog.create({
            data: {
              action: "ORDER_VOIDED_STRIPE_CANCELED",
              entityType: "Order",
              entityId: order.id,
              metadata: { stripePaymentIntentId: pi.id, eventId: event.id },
            },
          }),
        ]);
      } else {
        console.warn(
          "[webhook] payment_intent.canceled but order in unexpected status",
          order.status,
          order.id,
        );
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: pi.id },
        select: { id: true, status: true },
      });

      if (!order) {
        console.warn("[webhook] No order found for PI", pi.id);
        break;
      }

      if (order.status === OrderStatus.VOIDED) {
        // Already voided — idempotent
        break;
      }

      if (
        order.status === OrderStatus.PENDING_AUTHORIZATION ||
        order.status === OrderStatus.AUTHORIZED
      ) {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.VOIDED },
          }),
          prisma.auditLog.create({
            data: {
              action: "ORDER_VOIDED_PAYMENT_FAILED",
              entityType: "Order",
              entityId: order.id,
              metadata: { stripePaymentIntentId: pi.id, eventId: event.id },
            },
          }),
        ]);
      } else {
        console.warn(
          "[webhook] payment_intent.payment_failed but order in unexpected status",
          order.status,
          order.id,
        );
      }
      break;
    }

    default:
      console.log("[webhook] Unhandled event type, ignored:", event.type);
  }

  return NextResponse.json({ received: true });
}
