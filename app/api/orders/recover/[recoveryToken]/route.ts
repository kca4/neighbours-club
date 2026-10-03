/**
 * POST /api/orders/recover/[recoveryToken]
 *
 * Creates a fresh Stripe PaymentIntent (immediate capture, NOT manual) for a
 * CAPTURE_FAILED order. Returns a clientSecret for the client to use with
 * Stripe Elements.
 *
 * No auth required — the recoveryToken acts as the credential.
 * The token is single-use: once payment_intent.succeeded fires in the webhook,
 * the recoveryToken is cleared and the order moves to CAPTURED.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { OrderStatus } from "@prisma/client";
import { sendRecoveryExpiredEmailForOrder } from "@/lib/groupbuy/recovery-expiry";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ recoveryToken: string }> },
) {
  const { recoveryToken } = await params;

  const order = await prisma.order.findFirst({
    where: { recoveryToken },
    select: {
      id: true,
      status: true,
      quantity: true,
      userId: true,
      dealId: true,
      recoveryExpiresAt: true,
      deal: {
        select: {
          id: true,
          title: true,
          finalPrice: true,
        },
      },
      user: {
        select: { id: true, email: true, name: true, stripeCustomerId: true },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: "Recovery link not valid or expired" },
      { status: 404 },
    );
  }

  // Recovery window expired — void the order if still CAPTURE_FAILED and return 410
  if (order.recoveryExpiresAt && order.recoveryExpiresAt <= new Date()) {
    const supportEmail =
      process.env.MEMBER_SUPPORT_EMAIL ??
      (process.env.EMAIL_FROM?.match(/<(.+?)>/)?.[1] ?? 'hello@neighborsclub.ca');

    if (order.status === OrderStatus.CAPTURE_FAILED) {
      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.VOIDED },
        }),
        prisma.auditLog.create({
          data: {
            action: 'ORDER_VOIDED_RECOVERY_EXPIRED',
            entityType: 'Order',
            entityId: order.id,
            metadata: {
              recoveryToken,
              recoveryExpiresAt: order.recoveryExpiresAt.toISOString(),
              source: 'recovery_api',
            },
          },
        }),
      ]);
      // Non-blocking cancellation email (idempotency-checked)
      sendRecoveryExpiredEmailForOrder(order.id).catch((err) => {
        console.error('[recover] sendRecoveryExpiredEmailForOrder failed:', err);
      });
    }

    return NextResponse.json(
      {
        error: 'RECOVERY_EXPIRED',
        messageEN:
          "The payment deadline has passed, so this order can no longer be paid. You haven't been charged.",
        messageFR:
          "La date limite de paiement est passée; cette commande ne peut donc plus être payée. Aucun montant n'a été débité.",
      },
      { status: 410 },
    );
  }

  if (order.status !== OrderStatus.CAPTURE_FAILED) {
    return NextResponse.json(
      { error: "This payment is no longer outstanding" },
      { status: 409 },
    );
  }

  const finalPrice = order.deal.finalPrice
    ? Number(order.deal.finalPrice)
    : null;

  if (finalPrice === null) {
    return NextResponse.json(
      { error: "Deal price is not set. Please contact support." },
      { status: 500 },
    );
  }

  const amountDollars = finalPrice * order.quantity;
  const amountCents = Math.round(amountDollars * 100);

  const stripeCustomerId = await getOrCreateStripeCustomer(order.user);

  let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "cad",
      customer: stripeCustomerId,
      // Immediate capture (not manual) — this charges the card right away
      capture_method: "automatic",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId: order.id,
        dealId: order.dealId,
        recoveryToken,
        source: "recovery_payment",
      },
    });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error("[recover] Stripe PI creation failed:", e?.message);
    return NextResponse.json(
      { error: "Payment setup failed. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
