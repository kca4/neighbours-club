import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { OrderStatus } from "@prisma/client";
import { sendRecoveryExpiredEmailForOrder } from "@/lib/groupbuy/recovery-expiry";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");
  const authorized =
    vercelCron === "1" ||
    (cronSecret && cronSecret === process.env.CRON_SECRET);
  if (!authorized) {
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

  // ── Sweep: CAPTURE_FAILED orders whose recovery window has expired ──────────
  const now = new Date();
  const expiredRecoveries = await prisma.order.findMany({
    where: {
      status: OrderStatus.CAPTURE_FAILED,
      recoveryExpiresAt: { lt: now },
    },
    select: { id: true, recoveryExpiresAt: true },
  });

  const expiredResults: { orderId: string; voided: boolean; emailError?: string }[] = [];

  for (const order of expiredRecoveries) {
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
            recoveryExpiresAt: order.recoveryExpiresAt?.toISOString() ?? null,
            source: 'cleanup_cron',
          },
        },
      }),
    ]);

    const emailErr = await sendRecoveryExpiredEmailForOrder(order.id);
    if (emailErr) {
      console.error('[cleanup] sendRecoveryExpiredEmailForOrder failed:', emailErr);
    }
    expiredResults.push({ orderId: order.id, voided: true, emailError: emailErr ?? undefined });
  }

  return NextResponse.json({
    voided: results.length,
    results,
    recoveryExpired: expiredResults.length,
    expiredResults,
  });
}
