# Phase 4 — Delivery Lifecycle Testing Guide

This document is the smoke-test script for the full delivery lifecycle.
Work through each path top-to-bottom before committing or deploying.

---

## Prerequisites

| What | Command / setting |
|---|---|
| Dev server | `npm run dev` |
| Stripe webhook forwarder | `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| Cron manual trigger | `curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/dispatch/cron-sweep` or open `http://localhost:3000/api/dispatch/cron-sweep?secret=<CRON_SECRET>` |
| Stub mode on | `USE_SHIPPING_STUB=true` in `.env` |
| Prisma Studio (optional) | `npx prisma studio` |

Seed accounts needed:
- **Customer** — any `MEMBER` user
- **Restaurant owner** — a `RESTAURANT_OWNER` user linked to a `Restaurant` row via `ownerId`
- **Driver** — a `COURIER` user who has a `DeliveryDriver` row (create via Prisma Studio if no seed exists)

---

## Path A — Internal Driver (happy path)

### A1. Customer places order

1. Sign in as the **customer** and browse to `/delivery`.
2. Pick a restaurant → add items to cart.
3. Proceed to `/delivery/checkout`. Fill in a delivery address.
4. Pay with Stripe test card `4242 4242 4242 4242`.
5. You are redirected to `/delivery/checkout/confirmation?orderId=<id>`.

**Expected:**
- Confirmation page shows spinner briefly, then transitions to "Order received — waiting for the kitchen to confirm."
- The progress stepper shows **Order received** as active.
- In the database: `DeliveryOrder.status = PENDING`, `dispatchStartedAt` is set (within a second of payment).
- `dispatchStartedAt` is the timestamp Stripe's `payment_intent.succeeded` webhook fires — **not** `createdAt`. Verify via Prisma Studio.

### A2. Driver goes online and accepts

1. Sign in (different browser / incognito) as the **driver**.
2. Browse to `/delivery/driver`.
3. Toggle status to **AVAILABLE**.
4. The order from A1 appears in the feed within 10 s (auto-refresh interval).
5. Tap **Accept delivery**.

**Expected:**
- Order disappears from the feed.
- Driver is redirected to `/delivery/driver/orders/<id>`.
- `DeliveryOrder.status = ACCEPTED`, `driverId` set, `acceptedAt` set.
- `DeliveryDriver.status = ON_DELIVERY`, `activeOrderId` set.
- `DeliveryDriver.vehicleType` is unchanged.

### A3. Kitchen starts cooking

1. Sign in as the **restaurant owner** and browse to `/delivery/dashboard`.
2. The order card appears with status badge **Accepted**.
3. Click **Start Cooking**.

**Expected:**
- Status badge changes to **Cooking**.
- `DeliveryOrder.status = COOKING`, `cookingStartedAt` set.
- Customer tracking page updates to "The kitchen is preparing your food!"

### A4. Kitchen marks ready

1. On the dashboard, click **Mark Ready**.

**Expected:**
- Status badge changes to **Ready**.
- `DeliveryOrder.status = READY`, `readyAt` set.
- Kitchen card shows **Awaiting pickup** + the 4-digit `pickupPin`.
- Customer tracking page updates to "Your food is ready — courier is picking it up."

### A5. Driver confirms pickup with PIN

1. On the driver's `/delivery/driver/orders/<id>` page, the phase badge shows
   **"Order ready — confirm pickup"**.
2. Enter the 4-digit PIN shown on the kitchen card.
3. Tap **Confirm pickup**.

**Expected:**
- Phase advances to **"En route to customer"**.
- `DeliveryOrder.status = PICKED_UP`, `pickedUpAt` set.
- Customer tracking page advances to "Your food is on the way!"

**Edge case — wrong PIN:**
- Enter a wrong PIN → server returns "Incorrect PIN. Ask the kitchen to verify."
- Order stays in READY. No state change.

### A6. Driver completes delivery with photo

1. Tap the photo capture area and choose/take a photo.
2. Tap **Confirm delivery**.

**Expected:**
- Driver is redirected to `/delivery/driver` (dashboard).
- `DeliveryOrder.status = DELIVERED`, `deliveredAt` set, `dropoffPhotoUrl` set.
- `DeliveryDriver.status = AVAILABLE`, `activeOrderId = null` (driver freed).
- Customer tracking page shows "Delivered — enjoy your meal!" + delivery photo.

---

## Path B — Uber Direct Fallback (stub)

### B1. Customer places order

Same as A1. Note the `dispatchStartedAt` timestamp.

### B2. No driver accepts — cron escalates to Uber

Wait 3 minutes from `dispatchStartedAt` (or just trigger the cron manually).

```sh
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/dispatch/cron-sweep
```

**Expected (Phase 1):**
- Response: `{"sweptToFallback":1,"couriersAssigned":0,...}`
- `DeliveryOrder.status = AWAITING_COURIER`
- `DeliveryOrder.fulfillmentType = UBER_DIRECT`
- `DeliveryOrder.courierJobId` set (e.g. `uber_sim_...`)
- `DeliveryOrder.pickupPin` set (4 digits)
- `DeliveryOrder.courierRequestedAt` set
- Customer tracking page: "Finding a courier for your order…"
- Kitchen dashboard: shows amber pulsing dot **"Searching for Uber courier — do not start cooking yet"**

**Edge case — 3-minute timer measures from `dispatchStartedAt`, not `createdAt`:**
If you paid but the webhook was slow (PENDING_PAYMENT for 5 min then resolved),
the 3-min clock only starts from `dispatchStartedAt`. Verify by checking the
cron query (`dispatchStartedAt: { lte: cutoff }`, not `createdAt`).

### B3. Stub assigns courier (~20 s later)

Trigger the cron again after 20 s, or wait for the next scheduled run.

**Expected (Phase 2):**
- Response: `{"..., "couriersAssigned":1,...}`
- `DeliveryOrder.status = COURIER_ASSIGNED`
- Customer tracking page: "A courier is assigned and heading to the restaurant."
- Kitchen card: shows teal "Uber driver assigned · PIN: XXXX". **Start Cooking** is now enabled.

### B4. Kitchen cooks (same as A3–A4)

Start Cooking → Mark Ready as before.

### B5. Stub pickup and delivery (Phase 3)

With `USE_SHIPPING_STUB=true`, trigger the cron 2+ minutes after `readyAt`.

**Expected (Phase 3a):**
- `DeliveryOrder.status = PICKED_UP`

Trigger again 3+ minutes after `pickedUpAt`.

**Expected (Phase 3b):**
- `DeliveryOrder.status = DELIVERED`
- Customer tracking page shows "Delivered — enjoy your meal!"
- No delivery photo (stub sets `dropoffPhotoUrl = null`). Photo section is hidden correctly.

> **Note:** In production, Phase 3 never runs. The real Uber Direct webhook fires
> the `PICKED_UP` and `DELIVERED` transitions instead. The stub exists purely to
> allow full end-to-end testing without Uber API credentials.

---

## Edge Cases

### EC1. Two drivers race to accept the same order

1. Open two browser tabs / incognito windows, both signed in as **different** driver accounts (both `AVAILABLE`, no active order).
2. Both see the same order in the feed.
3. Click **Accept delivery** in both tabs simultaneously.

**Expected:**
- One driver gets the order (redirected to trip page).
- The other sees "Order already taken." immediately — the feed refreshes and the order disappears.
- DB: only one `driverId` is set, only one `DeliveryDriver.activeOrderId` is set.

**How it works:** `driverActions.ts → acceptOrder` uses `prisma.$transaction` with
`updateMany` filtered on `status: PENDING AND driverId: null`. PostgreSQL's row lock
ensures only one write succeeds; the loser gets `count = 0`.

### EC2. Driver goes OFFLINE with an active order

1. Driver accepts an order → status `ACCEPTED`.
2. Driver toggles status to **OFFLINE** on the dashboard.

**Expected:**
- `DeliveryDriver.status = OFFLINE`
- Driver's active trip page (`/delivery/driver/orders/<id>`) still loads and all
  actions (Start Cooking signal, confirm pickup, confirm delivery) still work.
- OFFLINE only hides the available-orders feed. It does NOT cancel the active trip.
- Once the driver completes the delivery, `activeOrderId` is cleared and they return
  to the dashboard in OFFLINE state (they must re-toggle to AVAILABLE).

### EC3. Kitchen cancels a PENDING order (reject)

1. Order is PENDING (kitchen has not accepted yet).
2. On the kitchen dashboard, click **Reject**.

**Expected:**
- Stripe refund is issued immediately.
- `DeliveryOrder.status = CANCELLED`.
- Order **does not** appear in the driver feed (feed only shows `PENDING` + `driverId: null`).
- Order **is not** swept to Uber by the cron (cron filters `status: PENDING` — cancelled orders are excluded).

### EC4. Kitchen cancels an ACCEPTED order (emergency cancel)

1. Order is ACCEPTED (driver has claimed it).
2. On the kitchen dashboard, click **Cancel** → choose a reason → confirm.

**Expected:**
- Stripe refund issued.
- `DeliveryOrder.status = CANCELLED`, `needsAdminReview = true`.
- `DeliveryDriver.status = AVAILABLE`, `DeliveryDriver.activeOrderId = null` — driver is freed atomically in the same transaction.
- Driver's trip page (`/delivery/driver/orders/<id>`) still loads (read-only historical view), but no actions are available.

### EC5. Payment slow / PENDING_PAYMENT for >30 s

1. Pay with a slow card (simulate by pausing Stripe webhook forwarder briefly).
2. Wait on the confirmation page.

**Expected:**
- Page fast-polls every 2 s for 30 s.
- After 30 s still in PENDING_PAYMENT: amber banner "Payment is being processed…" appears.
- Polling falls back to 10 s intervals (webhook still awaited).
- `dispatchStartedAt` is NOT set until the webhook fires → the 3-min Uber fallback clock has not started.
- Once the webhook fires, `dispatchStartedAt` is set and the page advances to "Order received."

---

## Environment Variables Checklist

| Variable | Required for | Value in dev |
|---|---|---|
| `DATABASE_URL` | All DB ops | Vercel Postgres connection string |
| `STRIPE_SECRET_KEY` | Payments | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | Checkout UI | `pk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe | same as above |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature | from `stripe listen` output |
| `CRON_SECRET` | Cron auth | any random string |
| `USE_SHIPPING_STUB` | Phase 2 + 3 of cron | `true` |

---

## What is NOT covered by the stub

- Real Uber Direct API calls (credentials: `UBER_CLIENT_ID`, `UBER_CLIENT_SECRET`, `UBER_CUSTOMER_ID`)
- Real Uber webhook for `PICKED_UP` / `DELIVERED` transitions
- Stripe Connect for driver payouts
- Photo upload to object storage (currently stores base64 in DB — see TODO in `tripActions.ts`)
- Push notifications to the customer when status changes
