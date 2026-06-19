# Remaining Work Plan — Path to Operational Pilot

**Project:** Neighbours Club  
**Last updated:** 2026-06-13  
**Posture:** Greenfield, single owner, no live users. Foundation-first (CP ledger is the spine). One logical task per session, commit before switching.

---

## How to read this

Four tiers, ordered by dependency:

- **Tier 0 — Decisions (yours / counsel's):** not code tasks. Must be recorded before the blocked build step starts.
- **Tier 1 — Launch blockers:** the platform cannot go live until these are done.
- **Tier 2 — Hardening:** required before any public promotion or non-trivial volume.
- **Tier 3 — Post-pilot:** meaningful only after real usage data and at least one live deal cycle.

Within each tier items are roughly sequenced. "DONE" = committed to main.

---

## Tier 0 — Decisions (yours / counsel's)

| # | Decision | Blocks |
|---|---|---|
| D-1 | **Feed licensing** — CBC Ottawa RSS / Ottawa Citizen: is consuming these for commercial summarization covered by fair-dealing + transformative summary, or does it require a licence? Counsel review before Notes goes live to a real audience. | Notes public launch |
| D-2 | **Civic sink design** — charitable-solicitation exposure if CP donations flow to a real fund. How is the match fund held and disclosed? Charitable solicitation rules (Canada). | Civic sink (`donation`) build |
| D-3 | **Group-buy take-rate** — what % does Neighbours Club take on each captured deal? Needed before `MerchantPayout` and settlement cron Branch A are finalized. | Group Buy Merchant Economics |
| D-4 | **§8 real-backing ceiling** — now that `cp_to_dollar_rate` = $0.01/CP is committed, define the enforcement rule: net CP emitted per epoch must not exceed platform's provable redemption capacity. When does this get built? | §8 enforcement (Tier 3) |
| D-5 | **Whether to publish allegations** — HIGH-risk Notes naming businesses: ships closed; when (if ever) does this path open? Phase-1: publish only low-risk types. | Notes HIGH-risk path |
| D-6 | **Φ epoch length** — 7 days is the pilot starting point. Promote to EconParam when real data justifies tuning. | Φ throttle activation |
| D-7 | **Φ throttle activation** — explicit sign-off on Spec §13 #4 to flip from measure-only to active. Requires calibrated Φ history. | Φ throttle |
| D-8 | **Driver payout structure** — per-delivery payout calculation when Stripe Connect is built. | Driver payout |

---

## Tier 1 — Launch blockers

Items are numbered for reference. DONE items are kept so the list is a complete record.

| # | Item | Status |
|---|---|---|
| 1.1 | **Φ admin route** — Φ readout behind the ADMIN role check (not a dev-only 404 in production). Solvency control must be accessible on the deployed env. | **DONE** (commit 140d887) |
| 1.2 | **End-to-end verification pass** — work through docs/verification-checklist.md in DEV, section by section. Bring back failures for triage. | **NOT DONE** |
| 1.3 | **Stripe webhook verified on deployed env** — confirm `payment_intent.succeeded` fires and settles delivery orders without the dev trigger on the real Vercel deployment. The webhook is unreliable locally (expected); this must work in production. | NOT DONE |
| 1.4 | **Cart persistence** — currently `localStorage` (clears on sign-out / hard reload). Needs server-side or session-backed cart before production. | NOT DONE |
| 1.5 | **Auth shakeout** — role-gating works in code; confirm it holds end-to-end on the deployed env: proxy.ts redirects, per-route 403s, nav link visibility, sign-out callbackUrl. Section 8 of the verification checklist feeds this. | NOT DONE |
| 1.6 | **Stripe live-mode verification** (IREN Technologies Inc.) | External — ops |
| 1.7 | **Domain + email** — `neighboursclub.ca` registration; Resend custom domain verification | External — ops |
| 1.8 | **Real legal pages** — Terms, Privacy, Refund Policy; placeholders exist at `/terms`, `/privacy`, `/refund-policy` | External — counsel |
| 1.9 | **Seed audience** — 30–40 committed likely buyers in Kanata | Ops |
| 1.10 | **First three supplier deals signed** | Ops |
| 1.11 | **Pickup location secured in Kanata** | Ops |
| 1.12 | **Feed licensing decision** (D-1 above) resolved before Notes goes live | Blocks Notes public launch |

---

## Tier 2 — Hardening (before public promotion or volume)

| # | Item | Notes |
|---|---|---|
| 2.1 | **Real Uber Direct API** — replace the stub (simulated assignment after delay) with real `createJob` / `getJob` calls + webhook. Internal-driver-only is fine for a soft launch. | Code + ops agreement |
| 2.2 | **Object storage for delivery photos** — `pickupPhotoUrl` / `dropoffPhotoUrl` fields exist; no upload endpoint. | Code + infra |
| 2.3 | **Production deploy config** — `vercel.json` cron headers, env vars, webhook endpoint registration in Stripe Dashboard. | Ops |
| 2.4 | **Delete old prototype routes** — `app/restaurants/`, `app/menu/`, `app/driver/`, `app/partner/`, `app/checkout/` predate the delivery vertical, not linked from live nav. Confirm nothing depends on them, then delete. | Code |
| 2.5 | **CP waiver + redemption reconciliation sweeps** — `cpWaiverSettled=false` and `cpRedemptionSettled=false` rows that have passed `PENDING_PAYMENT` need a periodic cron or admin alert. | Code |
| 2.6 | **`reconcileWallet` admin endpoint** — no UI to trigger wallet reconciliation. Add a protected admin action for drift detection + repair. | Code |
| 2.7 | **Wire the integration tests** — `docs/code-sketches/lib/cp/__tests__/` covers idempotency under retry, cap-clamp, burnCP overdraft. Wire into `npm test`. | Code |
| 2.8 | **Pre-launch legal check** — confirm Terms, Privacy, Refund Policy are in place; CASL subscriber confirmation flow verified; `NEIGHBOURS_CLUB_ADDRESS` env var set. | Ops + counsel |
| 2.9 | **GPS / live driver tracking** — customer tracker page polls status; no coordinate tracking. | Code — deferred |
| 2.10 | **Stripe Connect for driver payouts** | Code — depends on D-8 |
| 2.11 | **Partner onboarding CTA** — `/delivery/dashboard` empty-state links back to `/delivery` as placeholder | Code |
| 2.12 | **Dispatch auto-escalation (RESOLVED, commit 0abcb93)**: the dispatch cron previously auto-escalated unclaimed internal orders to the Uber Direct stub after a hardcoded 3 minutes — a hazard for the internal-courier pilot, since unclaimed orders would strand in a fake fallback and leave the driver feed. Now gated behind ENABLE_UBER_ESCALATION (default OFF); when off, unclaimed PENDING/INTERNAL orders stay on the internal driver feed indefinitely. Timeout configurable via UBER_ESCALATION_TIMEOUT_MINUTES (default 3 min) for when real Uber Direct is integrated. TODO before enabling Uber: real shippingAdapter implementation + sensible timeout, then set ENABLE_UBER_ESCALATION=true. | Code |

---

## Tier 3 — Post-pilot (requires real usage data or counsel sign-off)

| # | Item | Depends on |
|---|---|---|
| 3.1 | **Commerce-weighted `group_buy_reward`** — stays flat (330 CP) for the pilot; switch to % of captured fiat after watching real Φ for 2–4 weeks. | Real Φ data |
| 3.2 | **§8 real-backing ceiling enforcement** — emit ceiling computed from provable redemption capacity. | D-4 |
| 3.3 | **Civic sink (`donation` burn path)** — `CivicCampaign` model, disbursement cron, disclosed real-dollar UI. Ships behind a disabled gate until sign-off. | D-2 (counsel) |
| 3.4 | **Φ throttle activation** — flip from measure-only to active once window length is calibrated and D-7 is signed off. | D-6, D-7, real Φ history |
| 3.5 | **Φ window promotion** — `PHI_DEFAULT_WINDOW_DAYS` → `EconParamKey`; tune based on real data. | 3.4 |
| 3.6 | **Green Route** — logistics optimization for delivery; reduces emissions, potential CP incentive. | Post-pilot ops |
| 3.7 | **Merchant bounties** — `merchant_bounty` CPReason, merchant-funded slow-day inventory CP attach. | D-3, real merchant relationships |
| 3.8 | **Citizen-journalist certification** (Notes) — quality-gated CP multiplier for verified contributors. | Real Notes contributor data |
| 3.9 | **Notes HIGH-risk publish path** | D-5 + counsel |
| 3.10 | **`tier_bridge` + `signup_bonus` wiring** | Amounts to be decided; low-priority |
| 3.11 | **Multi-neighbourhood expansion** — `NeighbourhoodWaitlist` built, `isActive` flags exist. | Ops: second neighbourhood signed |
| 3.12 | **Dashboards: Φ, clear-rate, repeat participation, merchant retention** | Real data flowing |

---

## Critical-path sequence

```
Tier 0 decisions
   ↓ (D-1 feed licensing, D-2 civic design unblock parallel tracks)
Tier 1 launch blockers
   1.2 verification pass → 1.3 webhook on deployed env → 1.4 cart persistence
   → 1.5 auth shakeout → (1.6–1.12 ops/external in parallel)
   ↓
SOFT LAUNCH (Kanata pilot: first real deal + first real delivery order)
   ↓
Tier 2 hardening (can start before soft launch for 2.1–2.8)
   ↓
Observe real Φ for 2–4 weeks
   ↓
Tier 3: commerce-weighting → §8 ceiling → civic sink → Φ throttle
```

Nothing in Tier 3 should be built speculatively. The Φ governor, civic sink, and §8 ceiling are explicitly designed to remain in observe-only / disabled state until real data and sign-offs justify activating them.
