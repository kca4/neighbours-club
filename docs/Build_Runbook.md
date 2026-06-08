# Build Runbook — driving Claude Code

**Goal:** turn the specs + code sketches into a running, clickable, testable app, one small
session at a time. Optimized for **observable results every session**, not backend-first purity.

---

## 1. How to operate Claude Code with this material

The whole point of the docs we wrote is that they become Claude Code's *context and guardrails*,
so the agent builds the way we decided rather than the way the research suggested.

- **Repo setup (do once):**
  - `CLAUDE.md` at repo root = the engagement gate + foundation-first plan + these conventions:
    *one task per session, commit before switching, definition-of-done is a passing test or a
    rendering page.* Claude Code reads `CLAUDE.md` every session — that's how the guardrails
    travel into every change.
  - Put the specs under `/docs/` so the agent can open them when it needs detail.
  - Add the PR template + the optional engagement-gate CI check.
- **Per session, run the loop you already chose — Explore → Plan → Implement → Commit:**
  1. Ask Claude Code to **explore + propose a plan first** and *review the plan before it writes
     code.* This is your main steering point, especially with no second human reviewer.
  2. Let it implement the approved plan.
  3. **It runs the tests / starts the dev server** — done means demonstrably working, not
     "looks right."
  4. Affirm the PR checklist, commit, stop. One task, one commit.
- **Keep sessions small.** A whole milestone below is usually 1–3 sessions, not one giant prompt.

> The exact Claude Code commands/flags may have changed since my knowledge cutoff — check
> docs.claude.com for current setup specifics. The *method* above is what matters and is stable.

---

## 2. Environment that makes things testable (set up once)

- **Test database** separate from dev: a local Postgres or a Neon branch, pointed at by a test
  `DATABASE_URL`. The ledger integration tests need this; the pure tests need nothing.
- **Stripe test-mode keys** for checkout (test cards, no real charges).
- **Vitest** wired up. Pure tests (`core.test.ts`, `pricing.test.ts`) run instantly; integration
  tests run against the test DB.

---

## 3. Milestone sequence — each ends in something you can see or run

**M0a — Setup (½ session).** Land `/docs` (specs + code sketches under `/docs/code-sketches/`),
the root `CLAUDE.md`, and the PR template.
*Test it:* ask Claude Code to summarize the project conventions — it should cite the engagement
gate and foundation-first. If it does, the guardrails are wired.

**M0b — Reconcile with the existing repo (½–1 session). Do this before writing any feature code.**
You said Group Buy and Notes were "built for me to test," so a `Deal` model, a pledge concept, a
`lib/cp`, or Notes tables may already exist. Have Claude Code **read the current `prisma/schema.prisma`
and `lib/`, then report a reconciliation map**: for CP (WalletLedger/EconParam), Deal/DealTier,
the pledge model, and Notes — what already exists, what our sketches would add, and every
**collision** (e.g. our assumed `DealPledge` shape vs. yours, our `Deal` fields vs. yours).
*Test it:* you get a written "exists / add / conflicts" table and you agree the mapping **before**
anything is pasted. This turns "did we account for prior work?" from a hope into a checked fact.

**M1 — Menu browsing — your first clickable win (original Phase 1).** Lowest dependency
(`Restaurant`/`MenuItem` already exist), most visible payoff. Seed 2–3 Kanata restaurants with
menu items; build the restaurant list, a restaurant menu page with categories, search, and
category filtering under `/app/delivery`.
*Test it:* open localhost, click into a restaurant, search, filter. **This is the tangible
result first** — it proves the stack and the workflow before any economy plumbing.

**M2 — Economy spine (tests prove it).** Apply Migration 1 (`WalletLedger`, `EconParam`,
`CivicCampaign`); drop in `lib/cp/`; run `prisma/seed-econ.ts`.
*Test it:* `vitest` goes green including the idempotency cases; optionally a tiny dev-only route
that earns/burns and prints a balance so you can watch it work in the browser.

**M3 — Cart + checkout — marries M1 and M2 end-to-end.** In-memory cart scoped to one
restaurant; itemized honest pricing (subtotal + $4.99 + 10% + 13% HST shown early); Stripe
test-mode payment; create a `DeliveryOrder`; wire the **real** CP fee-waiver (`applyFeeWaiver`)
at checkout.
*Test it:* place an order with a Stripe test card → order row created with itemized pricing;
fund a wallet and watch the fee-waiver burn apply. First true end-to-end flow.

**M4 — Group buy slice.** Apply Migration 2; build the pledge handler (authorize the ceiling
PaymentIntent on join); a deal page with live count + current tier; wire the settlement cron
(`/api/cron/close-deals`).
*Test it:* create a deal, pledge as two test users, hit the cron route → Branch A settles
(captures at final tier, rewards vest via the ledger, orders created). Under-fill a deal to
watch Branch B void cleanly.

**Later:** Notes editorial (counsel-gated for HIGH-risk), Φ dashboard, Green Route batching,
connect to main nav.

---

## 4. The first prompt to hand Claude Code (copy-paste, covers M0 + start of M1)

> Read `/docs` and `CLAUDE.md`. We're building the Delivery vertical foundation-first, honoring
> the Engagement Pattern Standard and committing before switching tasks.
>
> **Step 1 — reconcile, don't build yet.** Read the current `prisma/schema.prisma` and `lib/`,
> then give me a reconciliation map as a table — for the CP economy (WalletLedger/EconParam),
> Deal/DealTier, the pledge model, and Notes: what already exists, what the sketches in
> `/docs/code-sketches/` would add, and any collisions (especially our assumed `DealPledge`
> shape and our added `Deal` fields vs. what's there). Do not modify anything yet. Wait for my
> approval of the map.
>
> **Step 2 — after I approve the map:** under `/app/delivery`, build **menu browsing** — a
> restaurant list page and a restaurant menu page with category grouping, search, and category
> filtering, using the existing `Restaurant` and `MenuItem` models. Seed 2–3 Kanata restaurants
> with realistic menu items. Keep it hidden from main-site nav. Honest pricing only — no fake
> scarcity or countdowns.
>
> For Step 2: explore the relevant files, show me a short plan, and wait for approval before
> coding. Then implement, start the dev server, and tell me the URL to test. Commit at the end
> with a clear message.

---

## 5. Definition of done for every session (the gate)

- The test passes **or** the page/flow demonstrably works (you saw it).
- PR checklist affirmed (no prohibited pattern; any restricted pattern named).
- One logical change, committed before moving on.

With no second reviewer, that checklist + clean commits + tests are doing the job code review
would — so don't skip them on a fast day. That's exactly when they earn their keep.
