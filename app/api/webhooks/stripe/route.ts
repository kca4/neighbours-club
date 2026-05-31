/**
 * Stripe webhook handler for the delivery vertical.
 *
 * Local development setup:
 *   1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
 *   2. Run: stripe login
 *   3. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe
 *   4. Copy the webhook signing secret printed by the CLI (whsec_...)
 *      into your .env file as STRIPE_WEBHOOK_SECRET
 *   5. The CLI will forward all Stripe events to this endpoint.
 *
 * In production, register https://yoursite.com/api/webhooks/stripe as a
 * webhook endpoint in the Stripe Dashboard and copy the signing secret there.
 */

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { DeliveryOrderStatus } from "@prisma/client";
import type Stripe from "stripe";

// Disable Next.js body parsing — Stripe signature verification requires the
// raw request body bytes, not a parsed object.
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[delivery-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const pi = event.data.object as Stripe.PaymentIntent;

  switch (event.type) {
    case "payment_intent.succeeded": {
      const orderId = pi.metadata?.orderId;

      if (!orderId || pi.metadata?.vertical !== "delivery") {
        // Not a delivery order — ignore
        break;
      }

      const order = await prisma.deliveryOrder.findFirst({
        where: { id: orderId, stripePaymentIntentId: pi.id },
        select: { id: true, status: true },
      });

      if (!order) {
        console.warn("[delivery-webhook] payment_intent.succeeded: no delivery order found", orderId);
        break;
      }

      if (order.status === DeliveryOrderStatus.pending_payment) {
        await prisma.deliveryOrder.update({
          where: { id: order.id },
          data: { status: DeliveryOrderStatus.pending },
        });
        console.log(`[delivery-webhook] Order ${orderId} payment confirmed`);
      } else {
        // Already transitioned — idempotent, do nothing
        console.log(`[delivery-webhook] Order ${orderId} already in status: ${order.status}`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const orderId = pi.metadata?.orderId;

      if (!orderId || pi.metadata?.vertical !== "delivery") {
        break;
      }

      const order = await prisma.deliveryOrder.findFirst({
        where: { id: orderId, stripePaymentIntentId: pi.id },
        select: { id: true, status: true },
      });

      if (!order) {
        console.warn("[delivery-webhook] payment_intent.payment_failed: no delivery order found", orderId);
        break;
      }

      if (order.status === DeliveryOrderStatus.pending_payment) {
        await prisma.deliveryOrder.update({
          where: { id: order.id },
          data: { status: DeliveryOrderStatus.cancelled },
        });
        console.log(`[delivery-webhook] Order ${orderId} payment failed`);
      }
      break;
    }

    default:
      // Return 200 for unhandled events — Stripe retries on non-2xx responses.
      break;
  }

  return NextResponse.json({ received: true });
}
