# Stripe Live Webhook Setup Checklist

Execute this checklist once Stripe live-mode verification for IREN Technologies Inc. is approved and before taking any real customer orders.

---

## Prerequisites

- [ ] Stripe live-mode account verified and active
- [ ] `neighborsclub.ca` domain live and serving the production Next.js app
- [ ] Vercel project connected to the production deployment

---

## Step 1 — Swap Stripe keys to live mode

In the Vercel dashboard → Project → Settings → Environment Variables, update all three keys for the **Production** environment:

| Variable | Old value | New value |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | `pk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` (same value as above) |

Get the live keys from: **Stripe Dashboard → Developers → API keys**.

---

## Step 2 — Register the two production webhook endpoints

Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**.

### Webhook 1 — Group Buy

| Field | Value |
|---|---|
| Endpoint URL | `https://neighborsclub.ca/api/stripe/webhook` |
| API version | (leave as account default) |

**Subscribe to these events (exactly):**
- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.canceled`
- `payment_intent.payment_failed`
- `charge.captured`
- `charge.refunded`

After saving, click **Reveal** to copy the **Signing secret** (`whsec_live_...`).

### Webhook 2 — Delivery

| Field | Value |
|---|---|
| Endpoint URL | `https://neighborsclub.ca/api/webhooks/stripe` |
| API version | (leave as account default) |

**Subscribe to these events (exactly):**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

After saving, click **Reveal** to copy the **Signing secret** (`whsec_live_...`).

> **Note:** The two endpoints produce two separate signing secrets. Each must go into the same `STRIPE_WEBHOOK_SECRET` env var — but there is only one variable. Both routes currently read the same `STRIPE_WEBHOOK_SECRET`. If Stripe issues different secrets per endpoint you must pick one and re-key the other, or split into `STRIPE_WEBHOOK_SECRET_GROUPBUY` / `STRIPE_WEBHOOK_SECRET_DELIVERY` and update the route handlers accordingly before going live.

---

## Step 3 — Copy the signing secret into Vercel

In Vercel → Settings → Environment Variables, set for **Production**:

| Variable | Value |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | `whsec_live_...` (from Step 2) |

Trigger a redeployment after saving (Vercel does not auto-redeploy on env var changes alone).

---

## Step 4 — Verification test (spend a few real dollars)

This is the only end-to-end proof that the live money path works. Do not skip it.

### Delivery verification

1. Sign in to `neighborsclub.ca` as a regular member account.
2. Place a small delivery order (cheapest available item).
3. Pay with a real card.
4. Confirm in **Prisma Studio** or the Stripe Dashboard that:
   - The `DeliveryOrder` row flipped from `PENDING_PAYMENT` → `PENDING`.
   - `dispatchStartedAt` is set.
5. Open the Kitchen Dashboard (`/delivery/dashboard`) and confirm the order appears in the queue.
6. Refund the charge from **Stripe Dashboard → Payments → [the charge] → Refund**.

### Group Buy verification

1. As an admin, publish a test deal (can be a draft deal with a very low minimum).
2. Join the deal as a member and complete payment.
3. Confirm the `Order` row is `AUTHORIZED` (webhook `payment_intent.amount_capturable_updated` fired).
4. Trigger deal closure (either wait for the cron or hit the close-deals endpoint manually with the `x-cron-secret` header).
5. Confirm the order transitions to `CAPTURED` and the member receives the deal-closed email.
6. Refund from the Stripe Dashboard.

---

## This is the last unproven money path

All other flows (auth, group-buy order creation, delivery cart, admin CRUD) have been exercised in test mode. **The Stripe live webhook is the one path that has never run against real money.** Do not open the platform to real customer orders until Step 4 passes cleanly for both verticals.

If the delivery webhook test fails (order stays `PENDING_PAYMENT`), check:
- `STRIPE_WEBHOOK_SECRET` matches the signing secret for `/api/webhooks/stripe`.
- The Vercel deployment picked up the new env var (force-redeploy if needed).
- Stripe Dashboard → Webhooks → the endpoint → recent deliveries, for the error detail.

If the group-buy webhook test fails (order stays `PENDING_AUTHORIZATION`), check the same list against `/api/stripe/webhook`.
