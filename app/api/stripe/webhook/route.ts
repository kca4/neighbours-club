import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import type Stripe from "stripe";
import { sendOrderAuthorized } from "@/lib/email";
import { sendAdminAlert } from "@/lib/admin-alert";
import { sendAuthExpiryEmailForOrder } from "@/lib/groupbuy/auth-expiry";

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
      (process.env.STRIPE_WEBHOOK_SECRET_GROUPBUY ?? process.env.STRIPE_WEBHOOK_SECRET)!,
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
        select: {
          id: true,
          status: true,
          quantity: true,
          maxAuthorizedAmount: true,
          createdAt: true,
          user: { select: { email: true, name: true } },
          deal: {
            select: {
              title: true,
              slug: true,
              closesAt: true,
              pickupLocation: true,
              pickupAddress: true,
              pickupWindowStart: true,
              pickupWindowEnd: true,
              supplier: { select: { name: true } },
            },
          },
        },
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

        // Retrieve capture_before from the charge attached to this PaymentIntent.
        // Stored for the close-time pre-check (defense-in-depth), but also checked
        // immediately here: if the auth cannot survive until deal.closesAt + safety margin,
        // void the order now rather than silently leaving it AUTHORIZED until close time.
        //
        // State chosen for early void: VOIDED (not CAPTURE_FAILED — Stripe has not failed
        // a capture; we are cancelling the authorization proactively).
        //
        // Member notification wording is pending review (Issue 2). A TODO stub is left
        // below; the admin alert fires in the meantime.
        let voidedDueToExpiry = false;
        try {
          const piExpanded = await stripe.paymentIntents.retrieve(pi.id, {
            expand: ['latest_charge'],
          });
          const charge = piExpanded.latest_charge as import('stripe').default.Charge | null;
          const captureBeforeUnix =
            (charge?.payment_method_details as { card?: { capture_before?: number } } | null)
              ?.card?.capture_before ?? null;

          if (captureBeforeUnix) {
            const captureBeforeAt = new Date(captureBeforeUnix * 1000);

            // Store the expiry timestamp for close-time defense-in-depth check
            await prisma.order.update({
              where: { id: order.id },
              data: { captureBeforeAt },
            });

            // Immediate expiry check: will the auth survive until closesAt + margin?
            const safetyMinutes = parseInt(
              process.env.AUTH_EXPIRY_SAFETY_MINUTES ?? '30',
              10,
            );
            const closesAtWithMargin = new Date(
              order.deal.closesAt.getTime() + safetyMinutes * 60 * 1000,
            );

            if (captureBeforeAt < closesAtWithMargin) {
              // Auth will expire before the deal can be captured — void proactively.
              await prisma.$transaction([
                prisma.order.update({
                  where: { id: order.id },
                  data: { status: OrderStatus.VOIDED },
                }),
                prisma.auditLog.create({
                  data: {
                    action: 'ORDER_VOIDED_AUTH_EXPIRY_RISK',
                    entityType: 'Order',
                    entityId: order.id,
                    metadata: {
                      captureBeforeAt: captureBeforeAt.toISOString(),
                      dealClosesAt: order.deal.closesAt.toISOString(),
                      safetyMinutes,
                      stripePaymentIntentId: pi.id,
                      eventId: event.id,
                    },
                  },
                }),
              ]);

              // Cancel the PI (non-blocking — payment_intent.canceled webhook will confirm)
              stripe.paymentIntents.cancel(pi.id).catch(err => {
                console.error(
                  '[webhook] Failed to cancel PI after auth expiry detection:',
                  pi.id,
                  err,
                );
              });

              // Alert admin (non-blocking)
              sendAdminAlert(
                'AUTH_EXPIRY_RISK',
                `auth_expiry:${order.id}`,
                `Order ${order.id} voided: auth expires ${captureBeforeAt.toISOString()} ` +
                  `before deal closes ${order.deal.closesAt.toISOString()} + ${safetyMinutes}min margin. ` +
                  `PI ${pi.id} cancellation requested.`,
              ).catch(e => console.error('[webhook] sendAdminAlert failed:', e));

              // Notify member (first attempt — cron retries on failure).
              // Awaited so that transient failures are visible in webhook logs.
              // A non-null return is not fatal; cron will retry and alert at MAX_ATTEMPTS.
              const authExpiryEmailErr = await sendAuthExpiryEmailForOrder(order.id);
              if (authExpiryEmailErr) {
                console.error('[webhook] sendAuthExpiryEmailForOrder failed:', authExpiryEmailErr);
              }

              voidedDueToExpiry = true;
            }
          }
        } catch (err) {
          // Non-blocking — close-time pre-check is defense-in-depth if this fails
          console.error('[webhook] Failed to retrieve captureBeforeAt for order', order.id, err);
        }

        // Send confirmation email only if the order was not immediately voided
        if (!voidedDueToExpiry) await sendOrderAuthorized({
          to: order.user.email,
          memberName: order.user.name,
          dealTitle: order.deal.title,
          supplierName: order.deal.supplier.name,
          quantity: order.quantity,
          maxAuthorizedAmount: Number(order.maxAuthorizedAmount),
          closesAt: order.deal.closesAt,
          pickupLocation: order.deal.pickupLocation,
          pickupAddress: order.deal.pickupAddress,
          pickupWindowStart: order.deal.pickupWindowStart,
          pickupWindowEnd: order.deal.pickupWindowEnd,
        });
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

    case "payment_intent.succeeded": {
      // Fired when a PaymentIntent is captured (from the closure cron)
      // OR when a recovery payment completes (immediate capture).

      // First look up by the original stripePaymentIntentId on the order
      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: pi.id },
        select: {
          id: true,
          status: true,
          quantity: true,
          recoveryToken: true,
          deal: { select: { finalPrice: true, id: true } },
        },
      });

      if (order) {
        if (order.status === OrderStatus.CAPTURED) {
          // Closure cron already updated the order — idempotent, do nothing
          break;
        }

        if (order.status === OrderStatus.AUTHORIZED) {
          // Webhook arrived before the cron DB update — transition now as a safety net
          const finalPrice = order.deal.finalPrice
            ? Number(order.deal.finalPrice)
            : null;
          const finalAmount =
            finalPrice !== null ? finalPrice * order.quantity : null;

          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CAPTURED,
                ...(finalAmount !== null ? { finalAmount } : {}),
              },
            }),
            prisma.auditLog.create({
              data: {
                action: "ORDER_CAPTURED",
                entityType: "Order",
                entityId: order.id,
                metadata: {
                  stripePaymentIntentId: pi.id,
                  eventId: event.id,
                  source: "webhook_safety_net",
                },
              },
            }),
          ]);
          break;
        }

        if (order.status === OrderStatus.CAPTURE_FAILED) {
          // Unexpected: a manual retry via Stripe Dashboard succeeded.
          // Log a warning and transition to CAPTURED + clear recoveryToken.
          console.warn(
            "[webhook] payment_intent.succeeded but order was CAPTURE_FAILED — transitioning to CAPTURED",
            order.id,
          );
          const amountDollars = pi.amount_received / 100;
          await prisma.$transaction([
            prisma.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.CAPTURED,
                finalAmount: amountDollars,
                recoveryToken: null,
              },
            }),
            prisma.auditLog.create({
              data: {
                action: "ORDER_CAPTURED",
                entityType: "Order",
                entityId: order.id,
                metadata: {
                  stripePaymentIntentId: pi.id,
                  eventId: event.id,
                  source: "unexpected_capture_after_failed",
                  amountDollars,
                },
              },
            }),
          ]);
          break;
        }

        console.warn(
          "[webhook] payment_intent.succeeded for order in unexpected status",
          order.status,
          order.id,
        );
        break;
      }

      // Not found by stripePaymentIntentId — check if this is a recovery payment
      const recoveryToken = pi.metadata?.recoveryToken as string | undefined;
      if (recoveryToken) {
        const recoveryOrder = await prisma.order.findFirst({
          where: { recoveryToken },
          select: { id: true, status: true },
        });

        if (!recoveryOrder) {
          console.warn("[webhook] Recovery PI succeeded but no order with token:", recoveryToken);
          break;
        }

        if (recoveryOrder.status === OrderStatus.CAPTURE_FAILED) {
          const amountDollars = pi.amount_received / 100;
          await prisma.$transaction([
            prisma.order.update({
              where: { id: recoveryOrder.id },
              data: {
                status: OrderStatus.CAPTURED,
                finalAmount: amountDollars,
                recoveryToken: null,
              },
            }),
            prisma.auditLog.create({
              data: {
                action: "ORDER_CAPTURED_VIA_RECOVERY",
                entityType: "Order",
                entityId: recoveryOrder.id,
                metadata: {
                  recoveryPaymentIntentId: pi.id,
                  eventId: event.id,
                  amountDollars,
                },
              },
            }),
          ]);
        } else if (recoveryOrder.status === OrderStatus.CAPTURED) {
          // Already captured — idempotent
        } else {
          console.warn(
            "[webhook] Recovery PI succeeded but order is in unexpected status",
            recoveryOrder.status,
            recoveryOrder.id,
          );
        }
        break;
      }

      console.log(
        "[webhook] payment_intent.succeeded: no matching order found for PI",
        pi.id,
      );
      break;
    }

    case "charge.captured": {
      // State change is handled via payment_intent.succeeded — log only.
      console.log("[webhook] charge.captured received, no state change needed:", event.id);
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

      if (!piId) {
        console.warn("[webhook] charge.refunded with no payment_intent:", charge.id);
        break;
      }

      const order = await prisma.order.findFirst({
        where: { stripePaymentIntentId: piId },
        select: { id: true, status: true },
      });

      if (!order) {
        console.warn("[webhook] charge.refunded — no order found for PI:", piId);
        break;
      }

      if (order.status === OrderStatus.REFUNDED) {
        break; // Already refunded — idempotent
      }

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.REFUNDED },
        }),
        prisma.auditLog.create({
          data: {
            action: "ORDER_REFUNDED_VIA_STRIPE_WEBHOOK",
            entityType: "Order",
            entityId: order.id,
            metadata: {
              stripePaymentIntentId: piId,
              chargeId: charge.id,
              eventId: event.id,
            },
          },
        }),
      ]);
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
