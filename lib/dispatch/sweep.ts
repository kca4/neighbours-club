/**
 * lib/dispatch/sweep.ts
 *
 * ─── Delivery Dispatch State-Machine Sweep ────────────────────────────────────
 *
 * Core sweep logic, extracted from the route handler so it can be unit-tested
 * with mock Prisma / shippingAdapter without needing NextRequest/NextResponse.
 *
 * The route handler (app/api/dispatch/cron-sweep/route.ts) is a thin wrapper
 * that authenticates the request and calls runSweep() with the real singletons.
 *
 * ─── Sweep phases ─────────────────────────────────────────────────────────────
 *
 * Phase 1 — INTERNAL TIMEOUT → UBER FALLBACK  [gated: ENABLE_UBER_ESCALATION]
 *   Any PENDING order with no internal driver claimed and dispatchStartedAt
 *   older than UBER_ESCALATION_TIMEOUT_MINUTES (default 3) is escalated to
 *   Uber Direct. When escalation is disabled (pilot default), unclaimed orders
 *   remain PENDING/INTERNAL on the internal driver feed indefinitely.
 *
 * Phase 2 — SIMULATED UBER COURIER ASSIGNMENT  [gated: USE_SHIPPING_STUB=true]
 *   Advances AWAITING_COURIER orders whose courierRequestedAt is older than
 *   20 seconds to COURIER_ASSIGNED. In production this transition comes from
 *   a real Uber webhook instead.
 *
 * Phase 3 — UBER STUB AUTO-COMPLETION          [gated: USE_SHIPPING_STUB=true]
 *   Simulates the Uber driver completing the delivery so the full lifecycle
 *   can be exercised end-to-end in dev/staging without a real courier.
 */

import { DeliveryOrderStatus, FulfillmentType } from '@prisma/client'
import type { PrismaClient } from '@prisma/client'
import type { ShippingAdapter } from '../shipping/uberAdapter'
import { isUberEscalationEnabled, getEscalationTimeoutMs } from './escalation-config'

// ─── Phase 2 / 3 stub delays (not configurable — stub-only, dev/staging) ──────

const SIMULATED_ASSIGN_MS       = 20 * 1000        // 20 s simulated courier search
const UBER_STUB_PICKUP_DELAY_MS  = 2 * 60 * 1000   // 2 min after readyAt → PICKED_UP
const UBER_STUB_DELIVER_DELAY_MS = 3 * 60 * 1000   // 3 min after pickedUpAt → DELIVERED

// ─── Public types ─────────────────────────────────────────────────────────────

export interface SweepDeps {
  /** Only the deliveryOrder delegate is used. */
  prisma: Pick<PrismaClient, 'deliveryOrder'>
  shippingAdapter: ShippingAdapter
}

export interface SweepResult {
  sweptToFallback: number
  couriersAssigned: number
  stubPickedUp: number
  stubDelivered: number
}

// ─── Core sweep ───────────────────────────────────────────────────────────────

export async function runSweep({ prisma, shippingAdapter }: SweepDeps): Promise<SweepResult> {
  let sweptToFallback  = 0
  let couriersAssigned = 0
  let stubPickedUp     = 0
  let stubDelivered    = 0

  // ── Phase 1: PENDING → AWAITING_COURIER (internal timeout → Uber escalation) ─

  if (isUberEscalationEnabled()) {
    const fallbackCutoff = new Date(Date.now() - getEscalationTimeoutMs())

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
        restaurant: { select: { name: true, address: true } },
        user: { select: { name: true } },
      },
    })

    for (const order of timedOutOrders) {
      const addr = order.deliveryAddress as {
        street: string
        unit: string | null
        instructions: string | null
      }
      const dropoffAddress = [addr.street, addr.unit].filter(Boolean).join(', ')

      const items = (order.items as Array<{ name: string; quantity: number }>).map(
        (i) => ({ name: i.name, quantity: i.quantity })
      )

      console.log(`[dispatch-sweep] Phase 1: order ${order.id} timed out — escalating to Uber`)

      let jobId: string
      let pickupPin: string

      try {
        const job = await shippingAdapter.createJob({
          orderId: order.id,
          pickupAddress: order.restaurant.address,
          pickupName: order.restaurant.name,
          dropoffAddress,
          dropoffName: order.user.name,
          items,
        })
        jobId   = job.jobId
        pickupPin = job.pickupPin
      } catch (err) {
        console.error(
          `[dispatch-sweep] Phase 1: createJob failed for order ${order.id}:`, err
        )
        // Leave the order as PENDING so the next sweep can retry.
        continue
      }

      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data: {
          status:             DeliveryOrderStatus.AWAITING_COURIER,
          fulfillmentType:    FulfillmentType.UBER_DIRECT,
          courierJobId:       jobId,
          pickupPin,
          courierRequestedAt: new Date(),
        },
      })

      console.log(
        `[dispatch-sweep] Phase 1: order ${order.id} → AWAITING_COURIER ` +
        `(jobId: ${jobId}, pin: ${pickupPin})`
      )
      sweptToFallback++
    }
  } else {
    console.log(
      '[dispatch-sweep] Phase 1: Uber escalation disabled ' +
      '(ENABLE_UBER_ESCALATION != true) — unclaimed PENDING orders remain on ' +
      'internal driver feed'
    )
  }

  // ── Phase 2: AWAITING_COURIER → COURIER_ASSIGNED (stub simulation only) ──────
  //
  // In production the real Uber webhook fires this transition; we don't poll.
  // Guard behind USE_SHIPPING_STUB so it never runs in a live environment.

  if (process.env.USE_SHIPPING_STUB === 'true') {
    const assignCutoff = new Date(Date.now() - SIMULATED_ASSIGN_MS)

    const readyToAssign = await prisma.deliveryOrder.findMany({
      where: {
        status: DeliveryOrderStatus.AWAITING_COURIER,
        courierRequestedAt: { lte: assignCutoff },
      },
      select: { id: true, courierJobId: true },
    })

    for (const order of readyToAssign) {
      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data: { status: DeliveryOrderStatus.COURIER_ASSIGNED },
      })
      console.log(
        `[dispatch-sweep] Phase 2 (stub): order ${order.id} → COURIER_ASSIGNED ` +
        `(jobId: ${order.courierJobId ?? 'unknown'})`
      )
      couriersAssigned++
    }
  }

  // ── Phase 3: UBER stub auto-completion (stub / dev only) ─────────────────────
  //
  // In production the real Uber Direct webhook fires PICKED_UP and DELIVERED
  // transitions — this phase is NEVER reached in a live environment.

  if (process.env.USE_SHIPPING_STUB === 'true') {
    // 3a — READY → PICKED_UP
    const pickupCutoff = new Date(Date.now() - UBER_STUB_PICKUP_DELAY_MS)

    const readyUberOrders = await prisma.deliveryOrder.findMany({
      where: {
        status:          DeliveryOrderStatus.READY,
        fulfillmentType: FulfillmentType.UBER_DIRECT,
        readyAt:         { lte: pickupCutoff },
      },
      select: { id: true },
    })

    for (const order of readyUberOrders) {
      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data:  { status: DeliveryOrderStatus.PICKED_UP, pickedUpAt: new Date() },
      })
      console.log(
        `[dispatch-sweep] Phase 3a (stub): order ${order.id} → PICKED_UP (Uber simulated pickup)`
      )
      stubPickedUp++
    }

    // 3b — PICKED_UP → DELIVERED
    const deliverCutoff = new Date(Date.now() - UBER_STUB_DELIVER_DELAY_MS)

    const inTransitUberOrders = await prisma.deliveryOrder.findMany({
      where: {
        status:          DeliveryOrderStatus.PICKED_UP,
        fulfillmentType: FulfillmentType.UBER_DIRECT,
        pickedUpAt:      { lte: deliverCutoff },
      },
      select: { id: true },
    })

    for (const order of inTransitUberOrders) {
      await prisma.deliveryOrder.update({
        where: { id: order.id },
        data: {
          status:         DeliveryOrderStatus.DELIVERED,
          deliveredAt:    new Date(),
          // No real photo for the stub — set a sentinel value so the tracking
          // page doesn't show a broken image.
          dropoffPhotoUrl: null,
        },
      })
      console.log(
        `[dispatch-sweep] Phase 3b (stub): order ${order.id} → DELIVERED (Uber simulated delivery)`
      )
      stubDelivered++
    }
  }

  console.log(
    `[dispatch-sweep] Done — sweptToFallback=${sweptToFallback}, ` +
    `couriersAssigned=${couriersAssigned}, stubPickedUp=${stubPickedUp}, ` +
    `stubDelivered=${stubDelivered}`
  )

  return { sweptToFallback, couriersAssigned, stubPickedUp, stubDelivered }
}
