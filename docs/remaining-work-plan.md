# Remaining Work Plan — Path to Operational Pilot

**Project:** Neighbours Club  
**Last updated:** 2026-06-13  
**Posture:** Greenfield, single owner, no live users. Foundation-first (CP ledger is the spine). One logical task per session, commit before switching.

---

## How to read this

Four tiers, ordered by urgency:

- **Tier 0 — Decisions (yours to make, not code):** these block specific build steps. Nothing should be coded until the relevant decision is made and recorded.
- **Tier 1 — Launch blockers:** must be complete before the first real deal or first real delivery order goes through real money.
- **Tier 2 — Hardening:** required before any public-facing promotion or non-trivial user volume.
- **Tier 3 — Post-pilot:** meaningful only after real usage data exists.

Within each tier, items are roughly sequenced. Dependencies are noted.

---

## Tier 0 — Decisions (block specific steps)

These are not code tasks. They are decisions that belong to you (and in some cases legal counsel or ops). Record each in a commit message or a doc update when made so future sessions have a clear record.

| # | Decision | Blocks |
|---|---|---|
| D-1 | **Φ epoch length** — how many days in the rolling window once you have real data? 7 is the pilot starting point. Promote to `EconParamKey` when you decide to tune it. | Φ throttle activation (Tier 3) |
| D-2 | **Φ throttle activation** — explicit sign-off on Spec §13 #4 to flip from observe-only to active. Requires real Φ history. | Φ throttle build |
| D-3 | **Civic sink budget** — how much real money backs CP donations? Who holds the match fund? Disclosed rate already committed ($0.01/CP). | Civic sink (`donation`) build |
| D-4 | **Whether to publish allegations** — for Notes: does a PUBLISHED note that names a business and is later found inaccurate ever get retracted publicly? Phase-1 scope: publish only low-risk types; HIGH-risk path ships closed. | Notes HIGH-risk publish path |
| D-5 | **Group-buy take-rate** — what percentage does Neighbours Club take on each captured group deal? Needed before `MerchantPayout` model and settlement cron Branch A are finalized. | Group Buy Merchant Economics build |
| D-6 | **Driver payout structure** — when Stripe Connect for drivers is built, how is the per-delivery payout calculated? | Driver payout (post-pilot) |
| D-7 | **Tier-bridge bonus amount** — currently `CPReason` declares `tier_bridge` but no amount is in `CP_REWARDS`. What CP amount? | `tier_bridge` wiring |
| D-8 | **Signup bonus amount** — `CPReason` declares `signup_bonus`, no amount defined. What CP? One-time per user. | `signup_bonus` wiring |

---

## Tier 1 — Launch blockers

### Group Buy

| # | Task | Notes |
|---|---|---|
| GB-1 | **Stripe live-mode verification** (IREN Technologies Inc.) | External — outside code |
| GB-2 | **Domain + email** — `neighboursclub.ca` registration; Resend custom domain verification | External |
| GB-3 | **Real legal pages** — Terms, Privacy, Refund Policy drafted by legal counsel; placeholders exist at `/terms`, `/privacy`, `/refund-policy` | External |
| GB-4 | **Seed audience** — 30–40 committed likely buyers in Kanata | Ops |
| GB-5 | **First three supplier deals signed** | Ops |
| GB-6 | **Pickup location secured in Kanata** | Ops |
| GB-7 | **Pre-launch dry run** — one manual deal cycle (WhatsApp/Google Form) before going live | Ops |

### Delivery

| # | Task | Notes |
|---|---|---|
| DV-1 | **`signup_bonus` wiring** — call `earnCP` with `reason: 'signup_bonus'` in the signup route once D-8 is decided | Code — depends on D-8 |
| DV-2 | **CP waiver reconciliation sweep** — `cpWaiverSettled=false` rows that have progressed past `PENDING_PAYMENT` need a periodic admin alert or cron sweep | Code |
| DV-3 | **Secret menu settlement audit** — `cpRedemptionSettled=false` rows that are in terminal states need a periodic sweep | Code |
| DV-4 | **Cart persistence** — currently `localStorage` (clears on sign-out); needs server-side cart or session persistence for production | Code |
| DV-5 | **Real Uber Direct API** — currently a stub simulating assignment after a delay | Code — deferred; stub is OK for pilot with internal drivers only |
| DV-6 | **Object storage for photo proof** — currently no upload endpoint for `pickupPhotoUrl` / `dropoffPhotoUrl` | Code — deferred |

### Notes

| # | Task | Notes |
|---|---|---|
| NT-1 | **Phase-1 scope enforcement** — HIGH-risk notes (`riskScore >= note_high_risk_threshold`) must not auto-publish; review gate enforced in admin before any real Notes go live | Code — mostly done; verify the gate is actually blocking |
| NT-2 | **`earnVerifiedReadCP` call site** — where in the Notes flow does `earnVerifiedReadCP` actually get called? The function exists but the call site in the note-reading route needs to be confirmed live, not just present in the code | Code — audit needed |
| NT-3 | **CASL compliance check** — subscriber confirmation and unsubscribe flows; `NEIGHBOURS_CLUB_ADDRESS` env var must be set in production | Ops + Code |

---

## Tier 2 — Hardening (before any promotion or volume)

### Security & access control

| # | Task | Notes |
|---|---|---|
| H-1 | **Remove prototype routes** — `app/restaurants/`, `app/menu/`, `app/driver/`, `app/partner/`, `app/checkout/` predate the delivery vertical and are not linked from live nav. Confirm nothing depends on them, then delete. | Code |
| H-2 | **Rate-limit `earnVerifiedReadCP`** — the daily/weekly caps are the economic guard; but a coordinated burst of requests within a day could still cause DB contention. Add request-level rate limiting on the notes verify endpoint. | Code |
| H-3 | **Stripe webhook idempotency audit** — delivery webhook calls `settleDeliveryPayment`; group-buy webhook lives at `/api/stripe/webhook`. Verify both are idempotent under replay. The delivery settlement is already idempotent; group-buy should be verified. | Code — audit |
| H-4 | **`CRON_SECRET` header enforcement** — all five cron routes use the `x-cron-secret` guard; verify the `vercel.json` jobs all include the header in production config. | Config |
| H-5 | **`proxy.ts` audit** — every protected page is guarded here, not just in middleware. Spot-check: `/admin/*`, `/delivery/dashboard`, `/delivery/driver`, `/wallet`. | Code — audit |

### CP economy

| # | Task | Notes |
|---|---|---|
| H-6 | **`reconcileWallet` admin endpoint** — there is no admin UI to trigger a wallet reconciliation. Add a protected admin action so drift can be detected and repaired without a hotfix deploy. | Code |
| H-7 | **Ledger integrity test** — wire the integration tests from `docs/code-sketches/lib/cp/__tests__/` into the actual test runner (`npm test`). These cover: idempotency under retry, cap-clamp, burnCP overdraft guard. | Code |
| H-8 | **`tier_bridge` wiring** — once D-7 is decided, add the earnCP call at order-join time when the order pushes the deal to a higher tier. | Code — depends on D-7 |
| H-9 | **`signup_bonus` wiring** — one earnCP call in the signup route. | Code — depends on D-8 |

### Delivery

| # | Task | Notes |
|---|---|---|
| H-10 | **GPS / live driver tracking** — customer tracker page currently polls status; no real coordinate tracking | Code — deferred post-pilot |
| H-11 | **Stripe Connect for driver payouts** — no payout integration currently | Code — depends on D-6 |
| H-12 | **Partner onboarding CTA** — `/delivery/dashboard` empty-state links back to `/delivery` as placeholder; needs a real partner onboarding URL or form | Code |

### Notes

| # | Task | Notes |
|---|---|---|
| H-13 | **Correction flow UI** — `NoteCorrection` model exists; correction-request admin page exists (`/admin/corrections`); verify the public-facing correction-submission form is live and accessible from published notes | Code — audit |
| H-14 | **NoteVersion snapshots** — version history model exists; verify admin edits are creating `NoteVersion` rows on each correction | Code — audit |

---

## Tier 3 — Post-pilot (requires real usage data)

| # | Task | Notes |
|---|---|---|
| P-1 | **Φ throttle activation** — once 2–4 weeks of real Φ data exists, calibrate window length (D-1), set thresholds, sign off D-2, flip throttle ON | Depends on D-1, D-2 |
| P-2 | **Civic sink build** — `donation` burn path, `CivicCampaign` model, disbursement cron, disclosed real-dollar mapping in UI | Depends on D-3 |
| P-3 | **Group Buy Merchant Economics** — `MerchantPayout`, `Deal` economics fields, hard floor enforcement, take-rate logic in settlement cron Branch A | Depends on D-5 |
| P-4 | **`tier_bridge` bonus** — wired once D-7 is decided and first real deal produces data | Depends on H-8 |
| P-5 | **`merchant_bounty` + `referral_verified`** — add to `CPReason` + backing mechanism only when the business model supports them | Depends on P-3 |
| P-6 | **Φ window promotion** — `PHI_DEFAULT_WINDOW_DAYS` → `EconParamKey`; tune based on real data | Depends on P-1 |
| P-7 | **Real Uber Direct API** — replace stub with real `createJob` / `getJob` calls + webhook | Depends on operator agreement |
| P-8 | **Stripe Connect driver payouts** | Depends on D-6 |
| P-9 | **Real object storage (photo proof)** | Code + infra |
| P-10 | **Notes HIGH-risk publish path** | Depends on D-4 + counsel review |
| P-11 | **Dashboards: Φ, clear-rate, repeat participation, merchant retention** | Build alongside verticals once real data flows |
| P-12 | **Multi-neighbourhood expansion** — `Neighbourhood.isActive=false` rows exist for non-Kanata areas; `NeighbourhoodWaitlist` is built. Activate when ready. | Ops + Code |

---

## Sequencing summary

```
Tier 0 decisions → Tier 1 blockers → Tier 2 hardening → Launch → Tier 3 post-pilot
        ↑                                                              ↑
   Make before                                                   Requires real
   writing code                                                  usage data
```

No Tier 3 item should be built speculatively. The economy governor, civic sink, and Φ throttle are explicitly designed to remain in observe-only mode until real data justifies activating them.
