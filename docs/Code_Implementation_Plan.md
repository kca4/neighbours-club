# Code Implementation Plan — Foundation-First (greenfield)

**Project:** Neighbours Club
**Status:** Draft for review
**Supersedes:** the earlier vertical-isolated plan
**Why revised:** Group Buy and Notes are greenfield, single-owner, freely modifiable. We drop
the cross-vertical isolation rule and build the CP ledger as a real foundation first, with
direct changes to all verticals.

---

## 0. The new posture (and what we kept)

Greenfield + single owner means the containment rules cost more than they buy, so:

**Dropped:** "all work under `/app/delivery/`" and "don't modify Group Buy/Notes." You're
doing platform work now; build CP-first with real foreign keys and edit any vertical directly.

**Reordered:** "one vertical at a time" becomes **foundation-first** — the CP ledger is the
dependency spine, so it's built first; everything else plugs into the real thing.

**Kept, and leaned on harder:** commit-before-switching, hidden-until-ready, and the
Engagement Pattern Standard gate. With no second human reviewing PRs, **these are your
substitutes for code review.** Clean commits are your only undo and audit trail; the
engagement gate is the pattern check a reviewer would otherwise do; tests around the ledger
are what catch the bug nobody else will. An AI agent making cross-vertical edits with no
second pair of eyes has a *larger* blast radius — so these conventions matter more now, not
less.

---

## 1. Engagement Pattern Standard — adopt now (policy, zero build)

Cross-cutting, applies to every vertical immediately.
- Commit the full standard to `/docs/engagement-pattern-standard.md`; paste the gate into
  `CLAUDE.md`; add the checkbox to the PR template.
- This is your first reviewer-substitute — treat the checkbox as a real merge blocker, not
  decoration.
- **Commit checkpoint:** docs + gate landed before any feature work.

---

## 2. CP ledger foundation — build first (the spine)

Everything downstream needs it: note faucet, group-buy reward, delivery fee-waiver, civic
sink. (Migration 1 in the Prisma sketch.)

**Explore:** confirm where `lib/cp/` and the wallet live; design the epoch/window strategy.

**Implement, in order:**
1. `WalletLedger` (append-only, idempotency guard), `EconParam` config, `CivicCampaign`.
2. `earnCP` / `burnCP` in `lib/cp/index.ts` (`server-only`) — diminishing content faucet
   (Tokenomics §4), daily/weekly caps (§5).
3. Commerce emission rate `r` plumbed (§6), dormant until §3 calls it.
4. **Φ measurement-only** (§7 Rule 5): compute + dashboard, throttle disabled.
5. Real-backing accounting (§8); civic-sink disbursement plumbing (§10), shipped behind a
   disabled gate until a real funded campaign exists.

**Tests:** idempotency under retry; cap-clamp; faucet curve; Φ math. Commit per step.

---

## 3. Group Buy economics — build directly on the ledger

Now editing the Group Buy vertical directly (Migration 2). Depends on §2 for `r`.

- `Deal` economics fields; `MerchantPayout`; `DealTier` with **hard floor enforcement** at
  creation (no tier below `floorPriceCents`) — app-level validation, optionally a trigger.
- Slow-window restriction (anti-cannibalization, Group Buy Spec §5).
- Settlement cron Branch A (capture at final tier → vest `group_buy_reward` via §2 + bounty)
  / Branch B (void) — factual, **no grief UI** (Engagement Standard §4.6).

**Tests:** tier-floor rejection; Branch A/B; double-capture idempotency. Commit before/after.

---

## 4. Delivery vertical — build with real integration

The original project focus, now wired to real CP and Deal tables instead of stubs
(Migration 3). Core (browse → cart → checkout → standard order) doesn't need Group Buy and
can proceed in parallel with §3; the group-buy-origin path needs `Deal` to exist first.

- Menus / cart / checkout / restaurant dashboard / driver assignment per the original phases.
- Honest pricing throughout (itemized cents fields; Engagement Standard §1).
- Real `delivery_fee_waiver` at checkout via `lib/cp/delivery.ts` (real burn, idempotent),
  storing `feeWaiverLedgerId`.
- Group-buy-origin orders carry a real `sourceDealId` FK.
- Apply Explore→Plan→Implement→Commit per phase; commit at each phase boundary.

---

## 5. Notes vertical — editorial firewall (highest legal sensitivity)

Independent of §3/§4; touches the ledger only via the `verified_read` faucet (a plain ledger
write keyed by `noteId` — no schema coupling). **Gate on counsel review** before any
HIGH-risk publishing path goes live.

- Editorial state machine + risk classifier; review gates (Notes Spec §3–§4).
- **Phase-1 scope lock:** publish only low-risk types; HIGH-risk path built but shipped
  closed (§2).
- Quality-gated certification (§5) — accuracy, never CP.
- Correction / right-of-reply + provisional-unpublish (§6); transformative-summary +
  attribution (§7). Commit independently.

---

## 6. Ops & instrumentation (Node Liquidity Playbook)

- Instrument first deals to measure participation rate `c` and **clear-rate** (Playbook §1, §7).
- Dashboards: Φ, clear-rate, repeat participation, merchant retention, correction-request rate.
- Read-only analytics; build alongside the vertical that produces the data.

---

## 7. Sequencing

```
Engagement gate (policy)        ──▶ applies to everything, now (§1)
        │
CP ledger foundation            ──▶ the spine; Φ measurement-only (§2)
        │
   ┌────┴───────────────┐
Group Buy economics (§3)   Delivery vertical (§4)     ──▶ both sit on the ledger; Delivery
        │                        │                        core runs in parallel, group-buy
        └───────┬────────────────┘                        origin path waits on Deal
                │
Notes editorial (§5)            ──▶ independent; counsel-gated for HIGH-risk
                │
Integration + Φ throttle ON     ──▶ only after thresholds calibrated on real data
                │
Connect to main nav             ──▶ original Phase 5, once stable
```

Rationale: policy is free; the ledger must exist before any emission or the fee-waiver; Group
Buy and Delivery both depend on the ledger and can progress together; Notes is independent;
the Φ governor flips from measure to enforce only once real data exists; nav-connect is last.

---

## 8. Guardrails carried into code (your reviewer substitutes)

- **Commit per step, before switching context** — your only undo/audit trail with no second
  reviewer. Non-negotiable.
- **Measure before enforce** — Φ throttle and any threshold ship observe-only first.
- **Build risky paths closed** — HIGH-risk Notes publishing and the civic sink ship behind
  disabled-but-testable gates pending human/counsel sign-off.
- **Tests around the ledger are mandatory** — idempotency especially; the ledger is the one
  place a silent bug corrupts the whole economy.
- **Engagement gate checkbox blocks merge** — the pattern review you don't have a human for.

---

## 9. Decisions that block specific steps (route to the right owner)

| Blocks | Decision | Owner |
|---|---|---|
| §2.5, §6 civic sink | Disclosed CP→$ rate; real match budget | You + Finance |
| §2.4 throttle enable | Φ epoch length + history before automating | You |
| §5 HIGH-risk publish | Phase-1 scope line; ever republish allegations? | You + Counsel |
| §3 economics | Group-buy take-rate policy; real driver payout | You + Ops |
| §6 thresholds | Measured `c` and clear-rate from first deals | You |

None block §1 (engagement gate) or starting §2 (CP ledger foundation) — begin there.
