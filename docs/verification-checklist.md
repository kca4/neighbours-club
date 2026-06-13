# Verification Checklist — End-to-End Manual QA

**Project:** Neighbours Club  
**Last updated:** 2026-06-13  
**Purpose:** Manual smoke-test before committing or deploying. Run the relevant section(s) for whatever vertical was touched. Not every section needs to run for every commit.

**Test accounts (seed data):**
- `admin@neighboursclub.test` / `password123` — ADMIN
- `sarah@example.test` / `password123` — MEMBER (has orders in deals 1 and 3)
- `james@example.test` / `password123` — MEMBER
- `aisha@example.test` / `password123` — MEMBER
- `restaurant_owner@neighboursclub.test` / `password123` — RESTAURANT_OWNER
- `courier@neighboursclub.test` / `password123` — COURIER

**Prerequisites:**
- `npm run dev` running on http://localhost:3000
- `stripe listen --forward-to localhost:3000/api/webhooks/stripe` running (delivery webhook)
- For group-buy webhook: switch forward URL to `localhost:3000/api/stripe/webhook`
- `.env` complete (see CLAUDE.md Local development section)

---

## Section 1 — Auth

- [ ] Sign up with a new email → lands on home or onboarding
- [ ] Sign in with a wrong password → clear error, no leak
- [ ] Sign in as MEMBER → cannot reach `/admin/*`; redirected
- [ ] Sign in as ADMIN → can reach `/admin`
- [ ] Forgot password → reset email arrives (Resend), link works, password changes, old link is expired
- [ ] Sign out → session cleared, protected pages redirect to `/signin`

---

## Section 2 — Group Buy (Member flow)

- [ ] `/deals` shows the open olive oil deal
- [ ] Click through to deal detail — tiers display correctly; progress bar accurate
- [ ] Join deal (Stripe test card `4242 4242 4242 4242`) → Order created as `PENDING_AUTHORIZATION` → webhook fires → becomes `AUTHORIZED`
- [ ] `/my-deals` shows the order with correct quantity and amount
- [ ] Leave deal → PaymentIntent voided → order `VOIDED`
- [ ] Re-join the same deal → existing order row reused (no duplicate)
- [ ] Decline card `4000 0000 0000 9995` → authorization fails → order stays `PENDING_AUTHORIZATION` → cleanup cron voids it

---

## Section 3 — Group Buy (Admin flow)

- [ ] `/admin` dashboard loads — orders/deals summary visible
- [ ] `/admin/suppliers` → create, edit, delete a supplier
- [ ] `/admin/deals` → create a new deal with tiers; DRAFT status; can edit
- [ ] Publish deal → status `OPEN`; no longer editable
- [ ] `/admin/deals/[id]` → view orders on the deal
- [ ] Mark an order picked up → `PICKED_UP` status
- [ ] Mark an order no-show → `NO_SHOW` status
- [ ] Cancel a deal → status `CANCELLED`; authorized orders voided (check Stripe dashboard)

---

## Section 4 — Group Buy (Closure pipeline)

- [ ] Create a deal that closes in the past (set `closesAt` to a past time) and has enough members to meet `minimumMembers`
- [ ] Trigger `/api/cron/close-deals` (or wait for 5-min Vercel cron) → deal becomes `CLOSING_SUCCESS` → orders captured → `CAPTURED`
- [ ] Check Stripe dashboard: PaymentIntents captured at `finalPrice`
- [ ] Verify CP: each captured member should have a `group_buy_reward` ledger entry (330 CP) — check via Prisma Studio or `/wallet` page
- [ ] Capture failure path: simulate by using a deal where `finalPrice` × qty > `maxAuthorizedAmount`; deal should become `CLOSING_FAILED`; orders voided

---

## Section 5 — Delivery (Customer flow)

- [ ] `/delivery` → Kanata Kitchen visible, restaurant card shows cuisine, rating, time estimate
- [ ] Click through to `/delivery/kanata-kitchen` → menu sections load; image items and list-card items both render
- [ ] Add items to cart; cart badge updates
- [ ] Proceed to checkout → delivery address form; tip selector; delivery fee; service fee; tax; total all visible and itemized
- [ ] Complete checkout (Stripe test card `4242 4242 4242 4242`) → redirect to confirmation page
- [ ] Dev settle: `POST /api/dev/settle-delivery-payment { "orderId": "<id>" }` → order transitions from `PENDING_PAYMENT` to `PENDING`
- [ ] Confirmation page shows order status; polling updates as status changes

---

## Section 6 — Delivery (CP waiver)

- [ ] Ensure test user has sufficient CP (use `scripts/grant-test-cp.ts` or Prisma Studio to top up)
- [ ] At checkout: CP waiver option appears if user has enough CP
- [ ] Elect to waive delivery fee → order created with `cpWaiverApplied=true`, `cpWaiverCost>0`, `cpWaiverSettled=false`
- [ ] Settle payment → `cpWaiverSettled=true`; user's CP balance reduced by `cpWaiverCost`
- [ ] Check `WalletLedger` → one row: `reason='delivery_fee_waiver'`, `amount=-{cpWaiverCost}`
- [ ] Re-trigger settlement (webhook replay simulation) → `deduped: true`; balance not decremented twice

---

## Section 7 — Delivery (Secret menu)

- [ ] Ensure test user has ≥ 1000 CP
- [ ] Navigate to Kanata Kitchen menu → "Secret Menu" section should only be visible to users with sufficient CP (or after unlock)
- [ ] Attempt to add secret item → CP eligibility check passes → item in cart
- [ ] Complete checkout → order created with `redemptionKey` set, `cpRedemptionSettled=false`
- [ ] Settle payment → `cpRedemptionSettled=true`; CP balance reduced by 1000
- [ ] Check `WalletLedger` → row with `reason='secret_menu_redeem'`
- [ ] Attempt same secret item in a second concurrent draft → blocked by `redemptionKey` unique constraint

---

## Section 8 — Delivery (Kitchen dashboard)

- [ ] Sign in as `restaurant_owner@neighboursclub.test`
- [ ] `/delivery/dashboard` → kitchen feed loads; shows pending orders
- [ ] Accept an order → status `ACCEPTED`
- [ ] Mark cooking → status `COOKING`
- [ ] Mark ready → status `READY`
- [ ] Driver PIN visible for Uber orders; not shown for internal assignments
- [ ] Pause kitchen → new orders blocked (`isPaused=true`)
- [ ] Unpause kitchen → normal again

---

## Section 9 — Delivery (Driver app)

- [ ] Sign in as `courier@neighboursclub.test`
- [ ] `/delivery/driver` → go online; status `AVAILABLE`
- [ ] Accept a delivery offer → order transitions to `ACCEPTED`; driver sees trip details
- [ ] Complete trip flow through `/delivery/driver/orders/[id]`
- [ ] Go offline → status `OFFLINE`

---

## Section 10 — Neighbours Notes

- [ ] `/notes` → published notes visible with category badges and severity indicators
- [ ] Click a note → source link present; "Read more" works
- [ ] Subscribe form → confirmation email arrives (double opt-in); confirm link activates subscription
- [ ] Unsubscribe → `unsubscribedAt` set; no further emails
- [ ] Business submission at `/notes/submit` → creates a `BusinessSubmission` row in PENDING

---

## Section 11 — Notes Admin

- [ ] `/admin/notes` → pending notes in review queue
- [ ] Approve a note → status `APPROVED`; visible on `/notes`
- [ ] Reject a note → status `REJECTED`; not visible on `/notes`
- [ ] High-risk note (`riskScore >= 5`) → flagged visually; requires manual review; does NOT auto-publish
- [ ] `/admin/submissions` → pending business submissions
- [ ] Approve a submission → note gets "Local Business" badge
- [ ] `/admin/corrections` → open correction requests visible

---

## Section 12 — CP Wallet

- [ ] `/wallet` → balance and ledger history visible after signing in as a user with CP
- [ ] Ledger shows human-readable labels (e.g. "Read a local note", "Group buy reward")
- [ ] Header badge shows correct CP balance
- [ ] Balance matches `SUM(WalletLedger.amount)` for the user (reconciliation check via Prisma Studio)

---

## Section 13 — Economy Admin

- [ ] Sign in as ADMIN
- [ ] `/admin/economy` loads without error
- [ ] Φ monitor shows structural Φ, raw Φ, window dates, target band
- [ ] Throttle banner prominently says "NOT active — measurement only"
- [ ] With no burns in the window: Φ shows "No burns yet — Φ undefined" (expected)

---

## Section 14 — Cron endpoints

All cron endpoints require the `x-cron-secret` header (value from `CRON_SECRET` env var).

- [ ] `GET /api/cron/close-deals` with correct header → 200
- [ ] `GET /api/cron/close-deals` without header → 401
- [ ] `GET /api/cron/cleanup-pending-orders` → 200
- [ ] `GET /api/cron/send-pickup-reminders` → 200
- [ ] `GET /api/cron/ingest-notes` → 200 (ingests from configured RSS/API sources)
- [ ] `GET /api/cron/send-daily-digest` → 200

---

## Section 15 — Edge cases and invariants

- [ ] **Decimal money fields:** inspect a `DeliveryOrder` or `Order` via Prisma Studio — confirm all money columns are `Decimal`, not float
- [ ] **Idempotency — earnCP:** call the group-buy close cron twice for the same deal; confirm each user gets exactly one `group_buy_reward` ledger row
- [ ] **Idempotency — burnCP:** simulate a webhook replay on a settled delivery order; `cpWaiverSettled=true` and balance unchanged
- [ ] **Overdraft guard:** attempt to burn more CP than a user's balance; `InsufficientBalanceError` is caught; order flow continues (delivery fee case); balance unchanged
- [ ] **Role isolation:** MEMBER cannot reach `/admin/*`, `/delivery/dashboard`, `/delivery/driver`. RESTAURANT_OWNER can only reach their own dashboard. COURIER can only reach driver routes.
- [ ] **Order unique constraint:** `(userId, dealId)` — join, leave, re-join. Confirm only one `Order` row exists per (user, deal).

---

## Notes

- Stripe capture-failure test card `4000 0000 0000 0259` behaves as success in API version `v2026-03-25.dahlia`. The recovery flow can be tested by manually setting an order to `CAPTURE_FAILED` in Prisma Studio and visiting the recovery link.
- The dev settle trigger (`/api/dev/settle-delivery-payment`) is only available in `NODE_ENV !== 'production'`.
- The Stripe webhook and the group-buy webhook are separate routes (`/api/webhooks/stripe` vs `/api/stripe/webhook`). `stripe listen` can only forward to one at a time — switch based on which vertical you're testing.
