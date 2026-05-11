/**
 * Deal-closure cron — POST /api/cron/close-deals
 *
 * Auth: Accepts EITHER of:
 *   - x-cron-secret header matching CRON_SECRET env var  (local dev / manual invocation)
 *   - x-vercel-cron header set by Vercel Cron in production (Vercel does not forward our secret)
 *
 * Schedule: every 5 minutes (see vercel.json)
 *
 * For each OPEN deal whose closesAt has passed and closingProcessedAt is null:
 *   Branch A (threshold met)  → CLOSING_SUCCESS → capture payments → FULFILLING
 *   Branch B (threshold miss) → CLOSING_FAILED  → void all orders  → CANCELLED
 *
 * The closingProcessedAt field is set inside the first transaction that also
 * moves the deal status, ensuring the cron is idempotent even if the process
 * dies mid-way through the Stripe calls.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { DealStatus, OrderStatus } from "@prisma/client";
import {
  sendDealClosedSuccess,
  sendDealClosedFailed,
  sendOrderCaptureFailed,
} from "@/lib/email";

// Stripe error codes/messages that indicate the operation already happened.
function isAlreadyCaptured(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "charge_already_captured" ||
    (e?.message ?? "").toLowerCase().includes("already been captured") ||
    (e?.message ?? "").toLowerCase().includes("already captured")
  );
}

function isAlreadyCanceled(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    (e?.message ?? "").toLowerCase().includes("already canceled") ||
    (e?.message ?? "").toLowerCase().includes("already cancelled") ||
    (e?.message ?? "").toLowerCase().includes("cannot be canceled") ||
    (e?.message ?? "").toLowerCase().includes("cannot be cancelled")
  );
}

type CronResult =
  | {
      dealId: string;
      outcome: "CLOSED_SUCCESS";
      confirmedCount: number;
      finalTier: number;
      captured: number;
      captureFailed: number;
    }
  | {
      dealId: string;
      outcome: "CLOSED_FAILED";
      confirmedCount: number;
      threshold: number;
      voided: number;
    };

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");

  const authorized =
    vercelCron === "1" || // Vercel Cron sets this header
    (cronSecret && cronSecret === process.env.CRON_SECRET);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dealsToClose = await prisma.deal.findMany({
    where: {
      status: DealStatus.OPEN,
      closesAt: { lte: now },
      closingProcessedAt: null,
    },
    include: {
      tiers: { orderBy: { tierOrder: "asc" } },
      orders: {
        where: {
          status: {
            in: [OrderStatus.AUTHORIZED, OrderStatus.PENDING_AUTHORIZATION],
          },
        },
        select: {
          id: true,
          status: true,
          quantity: true,
          stripePaymentIntentId: true,
          user: { select: { email: true, name: true } },
        },
      },
    },
  });

  const results: CronResult[] = [];

  for (const deal of dealsToClose) {
    const authorizedOrders = deal.orders.filter(
      (o) => o.status === OrderStatus.AUTHORIZED,
    );
    const pendingOrders = deal.orders.filter(
      (o) => o.status === OrderStatus.PENDING_AUTHORIZATION,
    );
    const confirmedCount = authorizedOrders.length;

    // Determine final tier: find the highest tier whose minMembers <= confirmedCount
    const sortedTiers = [...deal.tiers].sort(
      (a, b) => a.tierOrder - b.tierOrder,
    );
    const finalTier =
      [...sortedTiers].reverse().find((t) => confirmedCount >= t.minMembers) ??
      null;
    const tierIndex = finalTier
      ? sortedTiers.findIndex((t) => t.id === finalTier.id)
      : -1;
    const tierPrice = finalTier ? Number(finalTier.pricePerUnit) : 0;

    if (confirmedCount >= deal.minimumMembers && finalTier) {
      // ─── Branch A: threshold met ──────────────────────────────────────────────

      // Atomically mark deal as CLOSING_SUCCESS + set closingProcessedAt.
      // This prevents the cron from re-processing even if later steps fail.
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: DealStatus.CLOSING_SUCCESS,
          finalPrice: tierPrice,
          finalTierIndex: tierIndex,
          closingProcessedAt: now,
        },
      });

      let capturedCount = 0;
      let captureFailedCount = 0;

      // Capture each AUTHORIZED order
      for (const order of authorizedOrders) {
        const captureAmountCents = Math.round(tierPrice * order.quantity * 100);
        const finalAmountDollars = tierPrice * order.quantity;

        try {
          if (order.stripePaymentIntentId) {
            await stripe.paymentIntents.capture(
              order.stripePaymentIntentId,
              { amount_to_capture: captureAmountCents },
            );
          }

          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CAPTURED,
                finalAmount: finalAmountDollars,
              },
            }),
            prisma.auditLog.create({
              data: {
                action: "ORDER_CAPTURED",
                entityType: "Order",
                entityId: order.id,
                metadata: {
                  dealId: deal.id,
                  captureAmountCents,
                  finalAmountDollars,
                  stripePaymentIntentId: order.stripePaymentIntentId,
                },
              },
            }),
          ]);
          capturedCount++;
        } catch (err: unknown) {
          if (isAlreadyCaptured(err)) {
            // Idempotent — treat as success
            await prisma.$transaction([
              prisma.order.update({
                where: { id: order.id },
                data: {
                  status: OrderStatus.CAPTURED,
                  finalAmount: finalAmountDollars,
                },
              }),
              prisma.auditLog.create({
                data: {
                  action: "ORDER_CAPTURED",
                  entityType: "Order",
                  entityId: order.id,
                  metadata: {
                    dealId: deal.id,
                    idempotent: true,
                    stripePaymentIntentId: order.stripePaymentIntentId,
                  },
                },
              }),
            ]);
            capturedCount++;
            continue;
          }

          const e = err as { message?: string };
          console.error(
            "[close-deals] Capture failed for order",
            order.id,
            e?.message,
          );

          // Generate a recovery token so the member can pay via the recovery page
          const recoveryToken = crypto.randomUUID();
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.CAPTURE_FAILED, recoveryToken },
            }),
            prisma.auditLog.create({
              data: {
                action: "ORDER_CAPTURE_FAILED",
                entityType: "Order",
                entityId: order.id,
                metadata: {
                  dealId: deal.id,
                  stripeError: e?.message ?? null,
                  stripePaymentIntentId: order.stripePaymentIntentId,
                  recoveryToken,
                },
              },
            }),
          ]);

          // Notify member their payment failed and provide recovery link
          await sendOrderCaptureFailed({
            to: order.user.email,
            memberName: order.user.name,
            dealTitle: deal.title,
            amountOwed: tierPrice * order.quantity,
            recoveryToken,
          });

          captureFailedCount++;
        }
      }

      // Void any PENDING_AUTHORIZATION orders (stragglers the abandonment cron missed)
      for (const order of pendingOrders) {
        if (order.stripePaymentIntentId) {
          try {
            await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
          } catch (err: unknown) {
            if (!isAlreadyCanceled(err)) {
              const e = err as { message?: string };
              console.warn(
                "[close-deals] Could not cancel pending PI:",
                order.stripePaymentIntentId,
                e?.message,
              );
            }
          }
        }

        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: OrderStatus.VOIDED },
          }),
          prisma.auditLog.create({
            data: {
              action: "ORDER_VOIDED_BY_DEAL_CLOSURE_PENDING",
              entityType: "Order",
              entityId: order.id,
              metadata: {
                dealId: deal.id,
                stripePaymentIntentId: order.stripePaymentIntentId,
              },
            },
          }),
        ]);
      }

      // Transition deal to FULFILLING
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: deal.id },
          data: { status: DealStatus.FULFILLING },
        }),
        prisma.auditLog.create({
          data: {
            action: "DEAL_CLOSED_SUCCESS",
            entityType: "Deal",
            entityId: deal.id,
            metadata: {
              confirmedCount,
              finalTierIndex: tierIndex,
              capturedCount,
              captureFailedCount,
            },
          },
        }),
      ]);

      // Notify all successfully captured members
      for (const order of authorizedOrders) {
        const totalCharged = tierPrice * order.quantity;
        await sendDealClosedSuccess({
          to: order.user.email,
          memberName: order.user.name,
          dealTitle: deal.title,
          finalPricePerUnit: tierPrice,
          quantity: order.quantity,
          totalCharged,
          pickupLocation: deal.pickupLocation,
          pickupAddress: deal.pickupAddress,
          pickupWindowStart: deal.pickupWindowStart,
          pickupWindowEnd: deal.pickupWindowEnd,
          pickupInstructions: deal.pickupInstructions,
        });
      }

      results.push({
        dealId: deal.id,
        outcome: "CLOSED_SUCCESS",
        confirmedCount,
        finalTier: tierIndex,
        captured: capturedCount,
        captureFailed: captureFailedCount,
      });
    } else {
      // ─── Branch B: threshold not met ─────────────────────────────────────────

      // Atomically mark deal as CLOSING_FAILED + set closingProcessedAt.
      await prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: DealStatus.CLOSING_FAILED,
          closingProcessedAt: now,
        },
      });

      let voidedCount = 0;
      const allOrders = [...authorizedOrders, ...pendingOrders];

      for (const order of allOrders) {
        if (!order.stripePaymentIntentId) {
          // No PI — skip Stripe, void locally
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: { status: OrderStatus.VOIDED },
            }),
            prisma.auditLog.create({
              data: {
                action: "ORDER_VOID_STRIPE_SKIPPED_NO_INTENT",
                entityType: "Order",
                entityId: order.id,
                metadata: {
                  dealId: deal.id,
                  confirmedCount,
                  threshold: deal.minimumMembers,
                },
              },
            }),
          ]);
          voidedCount++;
          continue;
        }

        try {
          await stripe.paymentIntents.cancel(order.stripePaymentIntentId);
        } catch (err: unknown) {
          if (!isAlreadyCanceled(err)) {
            const e = err as { message?: string };
            console.warn(
              "[close-deals] Could not cancel PI for failed deal:",
              order.stripePaymentIntentId,
              e?.message,
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
              action: "ORDER_VOIDED_BY_THRESHOLD_NOT_MET",
              entityType: "Order",
              entityId: order.id,
              metadata: {
                dealId: deal.id,
                confirmedCount,
                threshold: deal.minimumMembers,
                stripePaymentIntentId: order.stripePaymentIntentId,
              },
            },
          }),
        ]);
        voidedCount++;
      }

      // Transition deal to CANCELLED
      await prisma.$transaction([
        prisma.deal.update({
          where: { id: deal.id },
          data: { status: DealStatus.CANCELLED },
        }),
        prisma.auditLog.create({
          data: {
            action: "DEAL_CLOSED_FAILED",
            entityType: "Deal",
            entityId: deal.id,
            metadata: { confirmedCount, threshold: deal.minimumMembers },
          },
        }),
      ]);

      // Notify all voided members
      for (const order of allOrders) {
        await sendDealClosedFailed({
          to: order.user.email,
          memberName: order.user.name,
          dealTitle: deal.title,
        });
      }

      results.push({
        dealId: deal.id,
        outcome: "CLOSED_FAILED",
        confirmedCount,
        threshold: deal.minimumMembers,
        voided: voidedCount,
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
