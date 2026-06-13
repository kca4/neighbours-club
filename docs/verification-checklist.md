# Neighbours Club — End-to-End Verification Checklist

> Manual QA pass against your DEV environment (real DB, Stripe test mode). The
> goal is to confirm the committed pieces COMPOSE correctly in one real flow —
> integration bugs live in the seams between unit-tested parts, invisible to the
> unit tests. This is YOU clicking through methodically, not a Claude Code task.
>
> Work top to bottom. For each step, the "✓ confirm" line is what must be true.
> If something fails, note it, finish the section if you can, and bring the
> failures back — don't push through a broken flow into the next section.

---

## 0. Pre-flight setup

- [ ] `npm run dev` running; note the local URL.
- [ ] Prisma Studio open (you'll verify DB rows directly — remember the @@map
      names: items, processed_notes, wallet_ledger, econ_params, note_corrections,
      note_versions).
- [ ] Stripe test mode keys active; test card 4242 4242 4242 4242 ready.
- [ ] Re-seed so DB matches committed code: run the econ seed and the main seed.
      ✓ confirm: econ_params has the rescaled values (read_1=100, daily_cap=185,
      cp_to_dollar_rate=1, etc.) and there's ONE secret item at cpCost=1000
      (the "Chef's Off-Menu Tasting Plate"), no stale 3000 item.
- [ ] Identify your test accounts and their roles (customer, RESTAURANT_OWNER,
      COURIER, ADMIN). Note the emails. You'll switch between them.
- [ ] Fund a customer wallet for the CP tests: grant ~3000 CP.
      ✓ confirm: header CP badge shows the balance after sign-in; /wallet shows a
      "Manual grant" row.

---

## 1. Delivery — normal order (no CP), full lifecycle

As the customer:
- [ ] Browse /delivery → open a restaurant → menu renders with categories.
- [ ] Add items → cart bar/drawer reflects them → go to checkout.
- [ ] ✓ confirm the summary shows ALL line items and they sum to the total:
      Subtotal, Delivery fee, Service fee (10%), Tax (HST 13%), Tip, Total.
- [ ] Place order, pay with 4242. 
      ✓ confirm: redirected to confirmation/tracking; the charged amount matches
      the displayed total (check the DeliveryOrder.total row, and the Stripe
      test-mode PaymentIntent amount = total × 100).
- [ ] ✓ confirm the order moved PENDING_PAYMENT → PENDING (via the webhook OR, if
      the local webhook doesn't fire, via the dev trigger
      /api/dev/settle-delivery-payment). NOTE which one you had to use — this is
      the webhook-reliability signal for launch-blocker 1.3.

As the RESTAURANT_OWNER:
- [ ] Open the kitchen dashboard → the new order appears in the feed.
- [ ] Accept → Cooking → Ready. ✓ confirm status transitions and the customer
      tracking page reflects each.

Dispatch / driver (as COURIER, and watch the dispatch behavior):
- [ ] ✓ confirm dispatch assigns (internal driver within the window, or the Uber
      stub fallback fires). Note which path.
- [ ] As the driver: see the active trip, validate the pickup PIN, mark picked up
      → delivered (photo proof is the local stub — fine).
- [ ] ✓ confirm the order reaches DELIVERED and the customer tracking shows it.

---

## 2. Delivery — fee-waiver order (CP burn via webhook path)

As the customer (balance ≥ 500):
- [ ] Build a cart → checkout → the "Use Community Points" waiver toggle is
      ENABLED (balance ≥ 500). Turn it on.
- [ ] ✓ confirm the summary updates: delivery fee → $0/Waived, tax drops, total
      drops by ~$5.64, and the "Place Order" amount reflects the reduced total.
- [ ] Place order, pay with 4242 at the reduced total.
      ✓ confirm the Stripe charge is the REDUCED amount.
- [ ] Settle the payment (webhook or dev trigger).
      ✓ confirm: order → PENDING; balance dropped by 500 (header + /wallet);
      a "Delivery fee waiver" −500 row in wallet_ledger; the DeliveryOrder has
      cpWaiverApplied=true, cpWaiverSettled=true.
- [ ] Fire the settle trigger a SECOND time (simulating webhook retry).
      ✓ confirm: balance stays down 500 (no double-burn), still ONE waiver ledger
      row. This is the idempotency proof.

Edge — disabled toggle:
- [ ] As a customer with < 500 CP, go to checkout.
      ✓ confirm the waiver toggle is DISABLED with a balance-aware hint, not
      hidden, and you can't waive.

---

## 3. Delivery — secret menu redemption (pure CP burn, no Stripe)

As the customer (balance ≥ 1000):
- [ ] Open the restaurant that has the secret item → the Secret Menu section
      shows it priced in CP, with an enabled "Redeem for 1,000 CP" button.
- [ ] Redeem.
      ✓ confirm: routed to tracking; balance dropped 1000 (header + /wallet);
      a "Secret menu redemption" −1000 ledger row; a DeliveryOrder with total 0,
      null payment intent, status PENDING, cpRedemptionSettled=true.
- [ ] As RESTAURANT_OWNER, open the kitchen dashboard.
      ✓ confirm the redemption order shows "Secret Menu · 1,000 CP" and a "Paid
      with CP" badge — NOT "$0.00" — and is actionable (Accept → cook → etc.).

Edge — crash recovery (the critical robustness proof):
- [ ] Redeem once (top up if needed). Then in Prisma Studio set that order back
      to status PENDING_PAYMENT + cpRedemptionSettled=false, LEAVING the
      wallet_ledger burn row in place. Re-run the redeem for the same item.
      ✓ confirm: it REUSES the draft, the burn DEDUPES (balance does NOT drop a
      second time), order flips to PENDING. No double-charge.

Edge — repeat purchase:
- [ ] After a completed redemption, redeem the SAME item again (top up first).
      ✓ confirm: a NEW order is created and CP burns again — proving the
      redemptionKey was cleared on the prior flip and completed redemptions don't
      block new ones.

Edge — can't afford:
- [ ] As a customer with < 1000 CP, view the secret item.
      ✓ confirm: button disabled with a balance-aware hint ("Need 1,000 CP — you
      have X"), redemption refused.

---

## 4. Group buy — settlement + CP vesting

Setup (Prisma Studio or seed): a Deal in OPEN status with closesAt in the past,
DealTiers, and enough AUTHORIZED Orders (pledges) to cross minimumMembers. (Real
pledges need the manual-capture PI authorized — if the local webhook makes this
hard, stage the Order rows directly in a believable AUTHORIZED state.)
- [ ] Trigger the close-deals cron (POST /api/cron/close-deals with the cron
      secret).
      ✓ confirm: deal → CLOSING_SUCCESS/FULFILLING; AUTHORIZED orders → CAPTURED
      at the final tier price (finalAmount set); each participant's wallet gained
      330 CP; a "group_buy_reward" +330 ledger row per participant
      (referenceId group_buy_reward:{orderId}).
- [ ] Re-run the cron.
      ✓ confirm: closingProcessedAt sentinel prevents reprocessing; NO additional
      CP vested (the @@unique guard); no double-capture. Idempotency proof.
- [ ] (If you can stage it) threshold-NOT-met deal: cron cancels authorizations,
      voids orders, deal → CANCELLED, NO CP vested.

---

## 5. Notes — the editorial firewall

As ADMIN (and using the ingest if it runs, or staged ProcessedNote rows):
- [ ] HIGH-risk note (riskScore ≥ 5): ✓ confirm it lands in
      BLOCKED_NEEDS_FRAMEWORK (visible in the admin notes queue) and the Approve
      action REFUSES / is shown blocked — you cannot publish it.
- [ ] LOW-risk note with a source: ✓ confirm it can be approved ONLY if
      sourcePublisher is populated (attribution), and on approval gets
      publishedAt set and appears in the public /notes feed.
- [ ] ✓ confirm the public feed (/notes) shows only APPROVED/PUBLISHED — never
      BLOCKED, DRAFT, REJECTED, or RETRACTED notes.

Correction / right-of-reply / retraction:
- [ ] On a published note naming a business, use the public "Request a
      correction" form. ✓ confirm a NoteCorrection row (status OPEN) is created.
- [ ] As ADMIN in /admin/corrections: acknowledge → resolve, and attach a
      right-of-reply. ✓ confirm the reply renders alongside the note.
- [ ] Provisionally unpublish the note (manual admin action). ✓ confirm it's
      removed from the public feed.
- [ ] Retract a note (standalone from /admin/notes AND/or from a correction).
      ✓ confirm: status RETRACTED (row still exists, not deleted), a NoteVersion
      snapshot written, version bumped.
- [ ] THE NO-CLAWBACK PROOF: before retracting, note the CP balance of a user who
      did verified_read on that note. After retraction, ✓ confirm their balance
      and their verified_read ledger row are UNCHANGED. CP is not clawed back.
- [ ] rejectNote: ✓ confirm it soft-deletes (status REJECTED, row preserved), not
      a hard delete.

---

## 6. Verified-read faucet — the diminishing curve

As a customer, with several published notes available:
- [ ] Verify note #1 → ✓ +100 CP (header + a verified_read +100 ledger row).
- [ ] Verify note #2 → ✓ +33.
- [ ] Verify note #3 → ✓ +8.
- [ ] Re-click an already-verified note → ✓ "Already earned", no double-mint
      (one ledger row for that note).
- [ ] (If you have 6 notes) the 6th verify → ✓ mints 0 but STILL writes a
      verified_read row (read counts, stays idempotent).
- [ ] ✓ confirm the daily content cap (185) clamps if you somehow exceed it
      (hard to hit naturally; the unit tests cover it — skip if impractical).

---

## 7. Wallet + Φ — observability cross-check

- [ ] /wallet history: ✓ confirm every earn/burn from the above appears with
      human-readable labels, correct signs/colors, and dates.
- [ ] Header badge: ✓ confirm it matches the /wallet balance and updated after
      earns/burns (router.refresh path).
- [ ] /admin/economy (as ADMIN): ✓ confirm the Φ page renders, shows structural
      Φ (primary) and raw Φ (secondary, labeled), the band/alarm from EconParam,
      and the "Throttle NOT active" banner. Sanity-check the numbers against what
      you just did (you generated real burns and a few real verified_read earns,
      so structural Φ should be a more meaningful number than the all-grants dev
      reading).
- [ ] ✓ confirm /admin/economy is ADMIN-gated: as a non-admin, you're redirected
      (not shown the page).

---

## 8. Role gating (auth shakeout — feeds launch-blocker 1.5)

- [ ] ✓ As a plain customer: no Restaurant Dashboard / Driver / Admin nav links;
      direct-navigating to /admin redirects.
- [ ] ✓ As RESTAURANT_OWNER: kitchen dashboard accessible; admin is not.
- [ ] ✓ As COURIER: driver surfaces accessible.
- [ ] ✓ As ADMIN: /admin/* (notes, corrections, economy) accessible.
- [ ] ✓ Sign out: protected surfaces redirect to signin with a sane callbackUrl.

---

## What to bring back

For anything that fails a ✓: note WHICH step, WHAT you saw vs. expected, and the
relevant DB row state. Group them — we'll triage which are real bugs vs.
local-environment quirks (e.g. the Stripe webhook not firing locally is a known
local issue, NOT a code bug; note it but it's expected).

Two signals to watch specifically, because they feed launch blockers:
- Did the Stripe WEBHOOK fire on its own, or did you need the dev trigger every
  time? (Feeds 1.3 — must work on the deployed env.)
- Did any flow lose state on a hard browser reload, especially the cart? (Feeds
  1.4 — cart persistence.)
