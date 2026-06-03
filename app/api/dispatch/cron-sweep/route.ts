/**
 * app/api/dispatch/cron-sweep/route.ts
 *
 * ─── Delivery Dispatch State-Machine Sweep ────────────────────────────────────
 *
 * Runs every minute via Vercel Cron (see vercel.json).
 *
 * Vercel Cron minimum frequency is 1 minute — it cannot fire more often than
 * that. In development Vercel Cron does NOT run locally; trigger manually with
 * the npm script `dispatch:sweep` (see package.json / README below).
 *
 * LOCAL TESTING
 * ─────────────
 * 1. Start the dev server:  npm run dev
 * 2. Run a sweep:           npm run dispatch:sweep
 *    (sends: curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *                 http://localhost:3000/api/dispatch/cron-sweep)
 *
 *    Or hit it in the browser with a query param:
 *    http://localhost:3000/api/dispatch/cron-sweep?secret=<your-CRON_SECRET>
 *
 * ─── Sweep phases ─────────────────────────────────────────────────────────────
 *
 * Phase 1 — INTERNAL TIMEOUT → UBER FALLBACK
 *   Any PENDING order with no internal driver claimed and dispatchStartedAt
 *   older than 3 minutes is escalated to Uber Direct (stub in dev).
 *
 * Phase 2 — SIMULATED UBER COURIER ASSIGNMENT  (stub / dev only)
 *   Only runs when USE_SHIPPING_STUB=true. Advances AWAITING_COURIER orders
 *   whose courierRequestedAt is older than 20 seconds to COURIER_ASSIGNED.
 *   In production this transition comes from a real Uber webhook instead.
 *
 * Phase 3 — (reserved for future: stale order cleanup, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { shippingAdapter } from "@/lib/shipping/uberAdapter";
import {
  DeliveryOrderStatus,
  FulfillmentType,
} from "@prisma/client";

export const dynamic = "force-dynamic";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[dispatch-sweep] CRON_SECRET is not set — rejecting all requests");
    return false;
  }

  // Vercel Cron sends:  Authorization: Bearer <secret>
  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  // Manual browser testing convenience:  ?secret=<secret>
  const querySecret = new URL(req.url).searchParams.get("secret");
  if (querySecret === secret) return true;

  return false;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const INTERNAL_TIMEOUT_MS  = 3 * 60 * 1000;  // 3 min before Uber fallback
const SIMULATED_ASSIGN_MS  = 20 * 1000;       // 20 s simulated courier search

// Phase 3 thresholds — only active when USE_SHIPPING_STUB=true.
// These simulate the Uber driver arriving and completing the delivery so the
// full lifecycle can be exercised end-to-end in a dev/staging environment.
// In production the real Uber Direct webhook fires these transitions instead.
const UBER_STUB_PICKUP_DELAY_MS  = 2 * 60 * 1000; // 2 min after readyAt → PICKED_UP
const UBER_STUB_DELIVER_DELAY_MS = 3 * 60 * 1000; // 3 min after pickedUpAt → DELIVERED

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return await runSweep();
  } catch (err) {
    console.error("[dispatch-sweep] Unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}

async function runSweep() {
  let sweptToFallback = 0;
  let couriersAssigned = 0;
  let stubPickedUp = 0;
  let stubDelivered = 0;

  // ── Phase 1: PENDING → AWAITING_COURIER (internal timeout) ─────────────────

  const fallbackCutoff = new Date(Date.now() - INTERNAL_TIMEOUT_MS);

  const timedOutOrders = await prisma.deliveryOrder.findMany({
    where: {
      status: DeliveryOrderStatus.PENDING,
      driverId: null,
      dispatchStartedAt: { lte: fallbackCutoff },
    },
    select: {
      id: true,
      items: true,
      deliveryAddress: true,
      restaurant: {
        select: { name: true, address: true },
      },
      user: {
        select: { name: true },
      },
    },
  });

  for (const order of timedOutOrders) {
    const addr = order.deliveryAddress as {
      street: string;
      unit: string | null;
      instructions: string | null;
    };
    const dropoffAddress = [addr.street, addr.unit].filter(Boolean).join(", ");

    const items = (
      order.items as Array<{ name: string; quantity: number }>
    ).map((i) => ({ name: i.name, quantity: i.quantity }));

    console.log(
      `[dispatch-sweep] Phase 1: order ${order.id} timed out — escalating to Uber`
    );

    let jobId: string;
    let pickupPin: string;

    try {
      const job = await shippingAdapter.createJob({
        orderId: order.id,
        pickupAddress: order.restaurant.address,
        pickupName: order.restaurant.name,
        dropoffAddress,
        dropoffName: order.user.name,
        items,
      });
      jobId = job.jobId;
      pickupPin = job.pickupPin;
    } catch (err) {
      console.error(
        `[dispatch-sweep] Phase 1: createJob failed for order ${order.id}:`,
        err
      );
      // Leave the order as PENDING so the next sweep can retry.
      continue;
    }

    await prisma.deliveryOrder.update({
      where: { id: order.id },
      data: {
        status: DeliveryOrderStatus.AWAITING_COURIER,
        fulfillmentType: FulfillmentType.UBER_DIRECT,
        courierJobId: jobId,
        pickupPin,
        courierRequestedAt: new Date(),
      },
    });

    console.log(
      `[dispatch-sweep] Phase 1: order ${order.id} → AWAITING_COURIER (jobId: ${jobId}, pin: ${pickupPin})`
    );
    sweptToFallback++;
  }

  // ── Phase 2: AWAITING_COURIER → COURIER_ASSIGNED (stub simulation only) ────
  //
  // In production the real Uber webhook fires this transition; we don't poll.
  // Guard behind USE_SHIPPING_STUB so it never runs in a live environment.

  if (process.env.USE_SHIPPING_STUB === "true") {
    const assignCutoff = new Date(Date.now() - SIMULATED_ASSIGN_MS);

    const readyToAssign = await prisma.deliveryOrder.findMany({
      where: {
        status: DeliveryOrderStatus.AWAITING_COURIER,
        courierRequestedAt: { lte: assignCutoff },
      },
      select: { id: true, courierJobId: true },
    });

    for (const order of readyToAssign) {
      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data: { status: DeliveryOrderStatus.COURIER_ASSIGNED },
      });

      console.log(
        `[dispatch-sweep] Phase 2 (stub): order ${order.id} → COURIER_ASSIGNED ` +
          `(jobId: ${order.courierJobId ?? "unknown"})`
      );
      couriersAssigned++;
    }
  }

  // ── Phase 3: UBER stub auto-completion (stub / dev only) ────────────────────
  //
  // In production, the real Uber Direct webhook fires PICKED_UP and DELIVERED
  // transitions — this phase is NEVER reached in a live environment.
  //
  // For demo/testing purposes, when USE_SHIPPING_STUB=true we simulate the
  // Uber driver:
  //   3a. UBER_DIRECT READY → PICKED_UP  (after UBER_STUB_PICKUP_DELAY_MS from readyAt)
  //   3b. UBER_DIRECT PICKED_UP → DELIVERED (after UBER_STUB_DELIVER_DELAY_MS from pickedUpAt)
  //
  // This lets you exercise the full customer-facing tracking page end-to-end
  // without a real courier.

  if (process.env.USE_SHIPPING_STUB === "true") {
    // 3a — READY → PICKED_UP
    const pickupCutoff = new Date(Date.now() - UBER_STUB_PICKUP_DELAY_MS);

    const readyUberOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: DeliveryOrderStatus.READY,
        fulfillmentType: FulfillmentType.UBER_DIRECT,
        readyAt: { lte: pickupCutoff },
      },
      select: { id: true },
    });

    for (const order of readyUberOrders) {
      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data: {
          status: DeliveryOrderStatus.PICKED_UP,
          pickedUpAt: new Date(),
        },
      });
      console.log(
        `[dispatch-sweep] Phase 3a (stub): order ${order.id} → PICKED_UP (Uber simulated pickup)`
      );
      stubPickedUp++;
    }

    // 3b — PICKED_UP → DELIVERED
    const deliverCutoff = new Date(Date.now() - UBER_STUB_DELIVER_DELAY_MS);

    const inTransitUberOrders = await prisma.deliveryOrder.findMany({
      where: {
        status: DeliveryOrderStatus.PICKED_UP,
        fulfillmentType: FulfillmentType.UBER_DIRECT,
        pickedUpAt: { lte: deliverCutoff },
      },
      select: { id: true },
    });

    for (const order of inTransitUberOrders) {
      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data: {
          status: DeliveryOrderStatus.DELIVERED,
          deliveredAt: new Date(),
          // No real photo for the stub — set a sentinel value so the tracking
          // page doesn't show a broken image.
          dropoffPhotoUrl: null,
        },
      });
      console.log(
        `[dispatch-sweep] Phase 3b (stub): order ${order.id} → DELIVERED (Uber simulated delivery)`
      );
      stubDelivered++;
    }
  }

  console.log(
    `[dispatch-sweep] Done — sweptToFallback=${sweptToFallback}, couriersAssigned=${couriersAssigned}, stubPickedUp=${stubPickedUp}, stubDelivered=${stubDelivered}`
  );

  return NextResponse.json({ sweptToFallback, couriersAssigned, stubPickedUp, stubDelivered });
}

