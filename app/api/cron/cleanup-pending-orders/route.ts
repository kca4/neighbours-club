import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

  const staleOrders = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING_AUTHORIZATION,
      createdAt: { lt: cutoff },
    },
    select: { id: true, stripePaymentIntentId: true },
  });

  const results: { orderId: string; voided: boolean; stripeError?: string }[] =
    [];

  for (const order of staleOrders) {
    let stripeError: string | undefined;

    if (order.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
      } catch (err: unknown) {
        const e = err as { message?: string };
        stripeError = e?.message;
        // Non-fatal: the PI may already be in a terminal state. Continue to void.
        console.warn(
          "[cleanup] Could not cancel PI (may already be terminal):",
          order.stripePaymentIntentId,
          stripeError,
        );
      }
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.VOIDED },
      }),
      prisma.auditLog.create({
        data: {
          action: "ORDER_VOIDED_PENDING_TIMEOUT",
          entityType: "Order",
          entityId: order.id,
          metadata: {
            stripePaymentIntentId: order.stripePaymentIntentId,
            stripeError: stripeError ?? null,
          },
        },
      }),
    ]);

    results.push({ orderId: order.id, voided: true, stripeError });
  }

  return NextResponse.json({ voided: results.length, results });
}
