# PROMPT 0 — Claude Code Re-orientation (Neighbours Club)

> Paste this at the start of any fresh Claude Code session to re-establish context.
> It ends in REPORT-ONLY mode so the session re-orients before touching anything.
>
> **How this file works:** the section between the ``` fences below is the prompt
> to paste. The "CURRENT STATE" and "NEXT TASK" sections are what change over time.
> When you finish a task, update those two sections (or ask Claude to) so this file
> always reflects where you actually are. Everything above the fence is stable.

---

## THE PROMPT TO PASTE

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
```

---

## CURRENT STATE (update as you go)

**Last completed:** Project reference docs added (commit 0a63724):
docs/CP-economy-state.md, docs/remaining-work-plan.md,
docs/verification-checklist.md, docs/PROMPT-0-reorientation.md — generated from
real repo state and version-controlled for future session re-orientation.

**Previously completed (still current):**
- CP $0.01/CP rate rescale done (commit 9a14e11): all faucet/sink values rescaled
  (delivery_fee_waiver 1500→500, secret_redemption 3000→1000, verified_read
  300/100/25→100/33/8, group_buy_reward 1000→330, caps rescaled, cp_to_dollar_rate=1
  added to EconParam).
- Φ admin route promoted (commit 140d887): /admin/economy live behind ADMIN role
  check, structural/raw Φ split with admin-adjustment gap panel. No longer a
  launch blocker.
- Notes editorial firewall complete: risk-aware summarizer + hard publish gate
  (riskScore ≥ note_high_risk_threshold → BLOCKED_NEEDS_FRAMEWORK, fail-closed),
  correction/right-of-reply workflow, soft-delete reject, retract/unpublish with
  immutable NoteVersion snapshots, no-CP-clawback on retraction.
- CP economy foundation: EconParam config, diminishing content faucet + caps,
  Φ measurement instrument (throttle-off). Faucets live: verified_read,
  group_buy_reward. Sinks live: delivery_fee_waiver, secret_menu_redeem.
  Wallet UI: header badge + /wallet history.
- seed.ts updated: restaurant_owner + courier seeding added (uncommitted as of
  last session — check git status).

**Deferred / decided-but-not-built:**
- Civic sink (donation reason): deferred past pilot — charitable-solicitation
  exposure; needs counsel.
- Commerce-weighted group_buy_reward: stays flat; watch real Φ first.
- §8 real-backing ceiling: now that cp_to_dollar_rate exists, enforcement of
  the emission ceiling is unbuilt — deferred to post-pilot.
- Φ throttle automation: measurement only until real Φ history.
- tier_bridge, signup_bonus: CPReason declared, no call sites.

---

## NEXT TASK

**End-to-end verification pass** — work through docs/verification-checklist.md
top to bottom in the DEV environment. This is a manual QA task (you clicking,
not Claude coding). Bring back failures with: which step, what you saw vs.
expected, and the relevant DB row state. The two signals to watch are webhook
reliability (feeds launch-blocker 1.3) and cart persistence on hard reload
(feeds launch-blocker 1.4).

---

## ROADMAP AFTER THE VERIFICATION PASS (rough order)

1. Triage verification failures — fix real bugs, note env quirks.
2. Cart persistence — server-side or session-backed cart (currently localStorage,
   clears on sign-out).
3. Auth shakeout — confirm all role-gating paths work end-to-end on the deployed
   env (proxy.ts + per-route checks).
4. Stripe webhook verified on deployed env — confirm payment_intent.succeeded
   fires and settles delivery orders without the dev trigger.
5. Commerce-weighted group_buy_reward (after watching real Φ) + §8 real-backing
   ceiling enforcement.
6. Civic sink (with counsel on solicitation framing).
7. Remaining pre-launch hardening: real Uber Direct API, object storage for
   delivery photos, production deploy config, delete old prototype routes
   (app/restaurants/, app/menu/, app/driver/, app/partner/, app/checkout/).
8. Φ throttle activation (after calibration on real data).
