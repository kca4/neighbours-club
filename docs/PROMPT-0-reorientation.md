# PROMPT-0 — Session Reorientation

**Use this at the start of any new Claude Code session on this project.**  
Copy-paste the block below as your opening message, with the current task filled in.

---

## Reorientation prompt (copy this)

```
We're continuing work on the Neighbours Club platform (Next.js App Router,
TypeScript strict, Prisma + PostgreSQL/Neon, Auth.js v5, Stripe, Tailwind,
serverless on Vercel). Read CLAUDE.md and prisma/schema.prisma to orient
yourself, plus the specs in docs/. Don't change anything yet — confirm
understanding by reporting back, then wait for my go-ahead.

CONVENTIONS (from CLAUDE.md — confirm you've read them):
- The Engagement Pattern Standard is a HARD gate: no fabricated narratives, no
  manufactured/false scarcity, no engineered anxiety, no variable-ratio/gambling
  rewards, no opaque CP value. "The research said so" is never a justification.
- Foundation-first, one logical task per session, commit before switching.
- Greenfield, no live users, single owner, NO second human reviewer — so commit
  hygiene, the engagement gate, and ledger/idempotency tests matter MORE, not
  less. Real foreign keys are fine (cross-vertical isolation rule was dropped).
- Money is Decimal(10,2) dollars everywhere (NOT integer cents).
- Some decisions are NOT yours to default — surface them, don't pick silently:
  the civic-sink real budgets, whether to publish allegations about named
  businesses, take-rate policy.

REPO-SPECIFIC FACTS (not inferable from the schema — hold these):
- MenuItem maps to the "items" table; ProcessedNote maps to "processed_notes";
  WalletLedger maps to "wallet_ledger". Look for the @@map names in Prisma Studio.
- Group Buy: the Order model IS the pledge — there is NO separate DealPledge.
- CP: lib/cp/core.ts holds DB logic (no server-only guard, for scripts);
  lib/cp/index.ts adds 'server-only' and re-exports. earnCP/burnCP each open
  their OWN $transaction and cannot accept an external tx. The diminishing
  verified-read faucet is a DEDICATED path (lib/cp/content-faucet.ts +
  faucet-math.ts), separate from generic earnCP, using SELECT ... FOR UPDATE on
  the wallet row for count+insert atomicity.
- Idempotency guard everywhere: @@unique([walletId, referenceId, reason]) on
  WalletLedger; deduped = success, never an error.
- Tunable economy values live in EconParam (flat key/value table, @@map
  "econ_params"), read via lib/cp/econ-params.ts (server-only accessor with a
  typed EconParamKey union + in-code fallbacks).
- The Stripe webhook is unreliable locally; settlement has a dev-only trigger at
  /api/dev/settle-delivery-payment. Windows: stop the dev server before
  `prisma generate` (EPERM DLL lock), and use Select-String not grep.

Before any code, REPORT what you find for the CURRENT TASK below, and wait for
my approval of your plan. Show me a before/after or exists/net-new table where
relevant. One logical task, one commit, plan-first.

CURRENT TASK:
[describe what you want to accomplish here]
```

---

## Key reference docs (read before planning)

| Doc | What it covers |
|---|---|
| `CLAUDE.md` | Project overview, tech stack, data models, architectural invariants, conventions |
| `docs/CP-economy-state.md` | Current state of the CP economy: ledger, faucets, sinks, config, Φ — generated from real code |
| `docs/remaining-work-plan.md` | Decisions still needed (Tier 0) + launch blockers + hardening + post-pilot tasks |
| `docs/verification-checklist.md` | End-to-end manual QA checklist by vertical |
| `docs/CP_Tokenomics_Spec_v2.md` | Full CP economy specification |
| `docs/engagement-pattern-standard.md` | The engagement gate — read before any feature that touches UX or CP incentives |
| `docs/Group_Buy_Merchant_Economics_Spec.md` | Group buy take-rate, floor pricing, merchant payout spec |
| `docs/Notes_Editorial_Governance_AI_Liability_Spec.md` | Notes editorial state machine, risk classifier, correction/right-of-reply |
| `docs/Code_Implementation_Plan.md` | Foundation-first build sequence |
| `docs/Node_Liquidity_Seeding_Playbook.md` | Participation rate measurement, clear-rate, merchant retention dashboards |

---

## Current build state (as of 2026-06-13)

### What's built and live

**Group Buy (Steps 1–7 complete, verified)**
- Deal CRUD (DRAFT → OPEN → CLOSING_SUCCESS/FAILED → FULFILLING → COMPLETED/CANCELLED)
- Member join/leave with Stripe manual-capture
- Admin dashboard, supplier CRUD, deal CRUD, order management, pickup marking
- Deal closure cron: threshold check → capture → CP vest (`group_buy_reward` 330 CP per order) → email
- Email flows: order authorized, deal closed success/failed, pickup reminder
- Recovery flow for capture-failed orders
- Password reset

**Delivery (live, connected to main nav)**
- Customer: restaurant listing → menu browser → cart → checkout (Stripe immediate capture) → confirmation/tracker
- Kitchen: real-time order feed, accept/reject/cook/ready/cancel, driver PIN, dev controls
- Driver: online/offline toggle, claim order, trip flow
- Dispatch cron: PENDING → internal driver or Uber stub after 3-min timeout
- CP delivery-fee waiver: burn at settlement (`delivery_fee_waiver`)
- CP secret-menu redemption: `redemptionKey` uniqueness guard; burn at settlement (`secret_menu_redeem`)
- Dev settle trigger: `POST /api/dev/settle-delivery-payment`

**Neighbours Notes (intelligence pipeline built)**
- Sources: CBC Ottawa RSS, Ottawa Citizen RSS, Open Ottawa road events + dev applications
- Pipeline: hourly ingest → Gemini 2.5 Flash summarization + risk scoring + category tagging → admin review
- Admin: `/admin/notes` review queue, `/admin/corrections`, `/admin/submissions`
- Public: `/notes` feed with severity indicators
- Subscribers: double opt-in (CASL), daily digest 7am ET, urgent alerts
- Business submissions: `/notes/submit` → admin review → "Local Business" badge
- Correction/right-of-reply: `NoteCorrection` model, admin review page

**CP Economy (foundation built)**
- `Wallet` + `WalletLedger` schema, `EconParam` config table
- `earnCP` / `burnCP` — idempotent, overdraft-guarded
- Content faucet: `earnVerifiedReadCP` — diminishing curve + daily/weekly caps + SELECT…FOR UPDATE atomicity
- Φ governor: `measurePhi` — structural vs raw, 7-day rolling window, measurement-only
- Admin Φ monitor: `app/admin/economy/page.tsx`
- Wallet UI: `app/wallet/page.tsx`, header badge

### What's NOT yet built / wired

- `tier_bridge`, `signup_bonus` earn paths (reason declared, no call site)
- Civic sink (`donation`) — disabled gate, no funded campaign
- Φ throttle — observe-only (D-2 required)
- Real Uber Direct API (stub in place)
- Object storage for photo proof
- GPS driver tracking
- Stripe Connect for driver payouts
- `MerchantPayout` model and Group Buy Merchant Economics
- `merchant_bounty` + `referral_verified` reasons

### Uncommitted baseline

Check `git status` at session start. The last known uncommitted change was an update to `prisma/seed.ts` adding `restaurantOwner` + `courierUser` seeding — verify it was committed or is still pending.

---

## Conventions checklist (confirm before any code)

- [ ] Read the Engagement Pattern Standard (`docs/engagement-pattern-standard.md`) if the task touches UX or CP incentives
- [ ] One logical task, one commit
- [ ] Run `npx tsc --noEmit` before committing
- [ ] After Prisma schema changes: `npx prisma migrate dev --name <description>`, then restart the dev server
- [ ] Do NOT substitute packages, OAuth providers, or image upload services without discussion
- [ ] Do NOT add Twilio, Cloudinary, or bulk pickup actions
- [ ] Surface policy decisions (civic sink budget, take-rate, HIGH-risk publish) rather than defaulting
