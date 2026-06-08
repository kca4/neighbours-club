# Community Points (CP) — Tokenomics Specification v2

**Project:** Neighbours Club — Delivery Vertical
**Status:** Draft for review
**Owner:** Product Strategy / Systems Architecture
**Supersedes:** Blueprint placeholder economics (static 500 / 1000 faucets, 1500 / 3000 sinks)

---

## 0. Why this spec exists

The blueprint's placeholder economics are insolvent and, in places, the supporting
research recommends mechanics that are deceptive. This spec resolves both problems with
a single discipline: **CP may only be minted to the extent the platform can honestly
back it with real value, and every redemption a user can plausibly read as "real" must
actually be real.** Solvency and honesty are not two goals here — they are the same
constraint viewed from the finance side and the ethics side.

Two non-negotiable principles govern everything below.

**Principle 1 — Real backing.** Net CP emitted over any epoch must not exceed the real
economic value the platform can deliver against that CP (merchant-funded bounties +
budgeted delivery subsidy + budgeted civic match). CP is a closed loyalty currency, not
fiat, and is never represented to users as cash or as cash-equivalent.

**Principle 2 — No deception.** No fabricated narratives, no manufactured scarcity, no
engineered anxiety, no opaque CP→value mapping. Where the UI implies money reaches a
real party (e.g. a charity), real money reaches that party in the disclosed amount.

These principles are restated as enforceable rules in §7 and §8.

---

## 1. Scope

In scope: definition of CP, the full faucet/sink table, the diminishing-returns content
faucet, daily/weekly caps, commerce-weighted and merchant-funded emission, the Φ
inflation governor, the civic-sink real-dollar mapping, and the Prisma/ledger changes
required to implement all of it.

Out of scope (covered by sibling specs): group-buy tier pricing and merchant margin
floors (Group Buy Merchant Economics Spec); editorial governance and AI liability (Notes
Editorial Spec); node seeding (Node Liquidity Playbook). This spec references those
boundaries but does not define them.

All proposed numeric values are marked **[TUNABLE]** and are starting points for the
pilot, to be calibrated against live Φ once a node is running.

---

## 2. Currency definition

CP is a non-transferable, non-cash, server-authoritative loyalty point. It cannot be
purchased with fiat, cannot be cashed out, and cannot be moved between users. It exists
only as entries in `WalletLedger`. The cached `balanceCP` on the wallet is a denormalized
convenience value; the ledger is the source of truth, and `balanceCP` is recomputable
from it at any time.

Every mutation flows through centralized `earnCP` / `burnCP` functions in `lib/cp/`. No
other code path may write to the ledger. `lib/cp/index.ts` carries `import 'server-only'`
so mint/burn logic is never bundled client-side; `lib/cp/core.ts` holds the raw
admin/script logic that bypasses client guards and is never imported by client code.

---

## 3. Faucets (CP earning events)

| Faucet | Trigger | Emission (v2) | Cap | Backing source |
|---|---|---|---|---|
| `verified_read` | Verify a PUBLISHED note | Diminishing curve, see §4 | Daily cap §5 | Marketing budget (top-of-funnel) |
| `group_buy_reward` | Successful capture on a closed deal | % of captured fiat, see §6 | Per-deal | Merchant bounty + budgeted subsidy |
| `merchant_bounty` | Merchant-attached CP on slow-day inventory | Merchant-funded, see §6 | Per-deal | **Merchant** (off platform balance sheet) |
| `referral_verified` | Referred neighbour completes first order | Flat **[TUNABLE: 250 CP]** | Lifetime per referee | Marketing budget |

Removed from v1: any "sudden reward" / randomized multiplier faucet. Variable-ratio
reward schedules are gambling mechanics and are explicitly disallowed (§7, Rule 4).

---

## 4. The content faucet: diminishing returns

A flat 500 CP per verified read against an effectively infinite supply of AI-summarized
articles is the single largest inflation vector in the blueprint. Replace it with a
per-user, per-day diminishing curve so genuine daily engagement is rewarded but farming
is not.

Proposed curve **[TUNABLE]**, where _n_ is the n-th verification by this user in the
rolling 24h window:

- 1st verified read: **300 CP**
- 2nd: **100 CP**
- 3rd–5th: **25 CP** each
- 6th and beyond: **0 CP** (the verify action still succeeds and still counts for
  editorial/quality purposes; it simply mints nothing)

Daily content-faucet hard cap: **550 CP** **[TUNABLE]** (= 300 + 100 + 3×25 + buffer).

Implementation: the curve is derived from a `COUNT` of `verified_read` ledger entries for
this `walletId` within the window, computed inside the same transaction that writes the
new entry. Idempotency is already guaranteed by `@@unique([walletId, referenceId,
reason])` keyed on `noteId` — a user cannot earn twice for the same note regardless of
the curve.

---

## 5. Caps

- **Daily content-faucet cap:** 550 CP/user/day **[TUNABLE]** (§4).
- **Daily total earn cap:** 2,000 CP/user/day **[TUNABLE]**, across all faucets, as a
  backstop against any single-faucet bug or abuse.
- **Weekly total earn cap:** 8,000 CP/user/week **[TUNABLE]**.

Caps are enforced in `earnCP` by summing the user's earn entries over the window before
committing. If a mint would breach a cap, the excess is clamped to zero and the event is
logged (not errored) so the user-facing action still succeeds.

---

## 6. Commerce-weighted vesting + merchant-funded bounties

This is the engine that makes the economy solvent. It moves the primary locus of emission
from passive content (infinite supply, platform-funded) to active commerce (bounded by
real transactions, increasingly merchant-funded).

**Group buy reward = `floor(capturedFiatCents × r)`** where _r_ is the emission rate
**[TUNABLE: r = 0.05, i.e. 5 CP per $1 captured]**. This ties emission directly to real
fiat input rather than a flat 1000 CP.

**Merchant bounties.** A merchant may optionally attach a CP bounty to a deal (an opt-in
field on the deal config). This bounty is **funded by the merchant**, not minted by the
platform — economically it is the merchant buying local engagement with their own slow-day
margin. The platform records the merchant's commitment and only vests the bounty CP to
participants on successful capture. Merchant-funded CP does **not** count against the
platform's net-emission ceiling (§8) because the platform incurs no liability for it —
but it **does** count toward circulating supply for Φ (§7), so it is still governed.

Sequencing note: emission vests inside the existing idempotent `close-deals` cron
transaction, using the deal/transaction signature as the `referenceId`.

---

## 7. The Φ inflation governor

Define structural inflation over an epoch:

```
Φ = (Σ all CP emitted in epoch) / (Σ all CP burned in epoch)
```

- **Φ < 1.0** — deflationary; CP supply shrinking. Acceptable, watch for faucet being
  too stingy (engagement risk).
- **Φ ≈ 1.0** — target band **[TUNABLE: 0.9–1.1]**; healthy equilibrium.
- **Φ > 1.15** — **[TUNABLE]** inflation alarm; the throttle (below) engages.

**The throttle.** When trailing-window Φ exceeds the threshold, the system automatically
reduces faucet output until Φ returns to band, in this order:

1. Tighten content-faucet caps first (lowest-value emission).
2. Reduce referral emission next.
3. Reduce the commerce emission rate _r_ **last** (it is the most economically backed and
   the most valuable to retain).

Sinks are never made more expensive as a throttle mechanism if doing so would mislead
users about value — pricing changes to sinks must remain honest (§9).

**Rules enforced by this section:**

- **Rule 4 (no gambling):** no variable-ratio or randomized CP rewards anywhere.
- **Rule 5 (measure before enforce):** Φ is computed and dashboarded in Phase 1 with the
  throttle disabled, so we calibrate thresholds on real data before automating them.

---

## 8. The hard ceiling: net emission ≤ real backing

This is Principle 1 made enforceable. Over any epoch:

```
NetPlatformEmission  =  (CP emitted by platform-funded faucets)
                      −  (CP burned into sinks the platform must honor with real cost)

Constraint:  NetPlatformEmission  ≤  RealBackingBudget(epoch)
```

where `RealBackingBudget` = budgeted delivery-subsidy dollars (converted at the disclosed
internal CP→$ rate) + budgeted civic-match dollars. Merchant-funded bounty CP is excluded
from `NetPlatformEmission` (the merchant carries it) but is tracked separately.

In practice this means: **the platform never mints more redeemable CP than it has
budgeted real dollars to honor.** If the budget is exhausted, faucets throttle (§7) rather
than the platform quietly issuing currency it cannot back. This single inequality is what
prevents the "mint infinitely, subsidize real driver payouts with funny money" failure the
research walked toward.

---

## 9. Sinks (CP burning events) — with honesty constraints

| Sink | Cost (v2) | Real cost to platform | Honesty requirement |
|---|---|---|---|
| `delivery_fee_waiver` | **[TUNABLE: 1,500 CP]** | ~$4.99 (real) | Counts against §8 ceiling |
| `secret_redemption` | **[TUNABLE: 3,000 CP]** | Merchant-sponsored or budgeted | Item must actually exist & be delivered |
| `merchant_boost` | **[TUNABLE: 500 CP]** | ~$0 (visibility only) | Boost must be real & visible; no fake "support" badge |
| `civic_pledge` | Variable | **Real $ to the named cause** | See §10 — strictly enforced |

The "intrinsic sink" framing from the research (burn CP for social/visibility reward at
near-zero platform cost) is fine **only** where the reward is genuinely non-monetary
(e.g. a real visibility boost, a real badge). It is **not** fine to dress up a zero-cost
reward as monetary support. That distinction is the whole of §10.

---

## 10. The civic sink — real dollars or it does not ship

The multiplayer civic donation pool is the strongest retention mechanic available and the
single easiest place to accidentally commit deceptive charitable solicitation. The rule
is absolute:

> If the UI tells a user their CP is funding the Kanata Food Cupboard (or any named
> party), real money reaches that party, in an amount that maps to the CP burned, at a
> publicly disclosed CP→$ conversion, capped by a pre-committed real budget.

Mechanics:

- A civic campaign has a **real dollar target** and a **real, pre-funded platform match
  budget**. The CP progress bar is a representation of progress toward that real target at
  the disclosed conversion rate — not a free-floating number.
- When the campaign completes, the platform **actually disburses** the matched funds and
  publishes confirmation (receipt / acknowledgment from the recipient org).
- The CP→$ conversion rate is shown to users at pledge time. No hidden rate, no
  "perceived value" inflation.
- If the platform cannot fund a given campaign for real, that campaign does not launch.
  There is no "theater" version.

This sink is also the primary deflationary mechanism (§7): it burns large CP volumes
against a *capped* real cost, which is exactly why it is both solvent and ethical when
built honestly.

**Governance caution:** do **not** gate editorial/moderation rights on lifetime CP
*donated*. That converts civic generosity into purchased authority over the community's
information supply (pay-to-win moderation). Tie governance to verified contribution
*quality* instead (defined in the Notes Editorial Spec). Status badges for top civic
contributors are fine; editorial power for them is not.

---

## 11. Ledger / schema changes (Prisma)

Additions to support v2 (illustrative — final migration reviewed separately):

- `WalletLedger.amount` — keep as signed integer CP (positive = mint, negative = burn).
  Retain `@@unique([walletId, referenceId, reason])`.
- `WalletLedger.epochId` — index for Φ and cap windows (or derive from `createdAt`; a
  materialized epoch id makes the governor query cheaper at scale).
- `Deal.merchantBountyCp` — integer, nullable; merchant-committed bounty for the deal.
- `Deal.merchantBountyFunded` — boolean; whether the merchant's commitment is captured.
- `CivicCampaign` — new model: `id`, `name`, `recipientOrg`, `targetDollars`,
  `matchBudgetDollars`, `cpToDollarRate`, `cpRaised`, `status`, `disbursedAt`,
  `disbursementProofUrl`.
- `EconParam` — new key/value model for **all [TUNABLE] values** so emission rates, caps,
  and Φ thresholds are config, not redeploys. Read server-side only.

`earnCP` signature gains the cap/curve checks; `burnCP` gains the civic-disbursement
linkage. Both remain the sole write path.

---

## 12. Worked example (sanity check)

Assume a node with 200 active users in a week, pilot params above.

- Content faucet: heavy users hit ~550 CP/day cap, but the curve means most earn far less;
  assume avg 300 CP/user/day × 200 × 7 ≈ **420,000 CP** emitted (platform-funded).
- Commerce: 4 group buys close, total captured fiat $6,000 → at r=0.05 → 5 CP/$ →
  **30,000 CP** platform-funded + merchant bounties (say 20,000 CP merchant-funded).
- Sinks: 80 delivery waivers (120,000 CP) + civic pledges (say 250,000 CP) +
  boosts/secret (60,000 CP) → **430,000 CP** burned.

Φ = (420,000 + 30,000 + 20,000) / 430,000 ≈ **1.09** → in/near band, throttle idle. The
content faucet is still doing most of the emission, which is exactly why the curve + cap
matters; if engagement spikes and Φ pushes past 1.15, the governor tightens content caps
first and commerce emission is untouched. This is the desired behavior: protect the
economically-backed faucet, throttle the free one.

(Numbers are illustrative to validate the mechanism, not a forecast.)

---

## 13. Open decisions needed before build

1. **CP→$ disclosed rate.** What is the single public conversion used for civic campaigns
   and for the §8 ceiling math? This number anchors everything; pick it deliberately.
2. **Epoch length for Φ.** Rolling 7-day vs calendar-week vs daily-trailing. Affects how
   twitchy the governor is.
3. **Merchant bounty funding flow.** Does the merchant pre-fund (held like the group-buy
   auth) or get invoiced post-capture? Determines `merchantBountyFunded` semantics.
4. **Throttle automation gate.** Confirm Phase 1 ships Φ measurement only, throttle off,
   and define the Φ-history duration required before we let it act automatically.
5. **Cap reset boundary.** Midnight in which timezone (America/Toronto, presumably) for
   daily caps — must be explicit for the window queries.

---

## 14. What this spec deliberately does **not** do

For the record and as a regulatory shield: this spec does not implement fabricated
onboarding narratives, manufactured/false scarcity, engineered-anxiety notifications,
variable-ratio reward gambling, or any civic-funding representation not backed by real
disbursement. Those mechanics appear in the source research and are intentionally
excluded. (Captured in full in the Engagement Pattern Standard.)
