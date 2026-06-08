# Neighbours Club — Integration Strategy & Specification Set

**Status:** Draft for review
**Owner:** Product Strategy / Systems Architecture
**Contents:** Executive summary + five interlocking specifications

---

## Executive Summary

We commissioned three Octalysis-based research efforts (Tokenomics, Marketplace/Cold-Start,
Urban Sociology) and compared them against the platform blueprint. The headline finding:
the research is a strong taxonomy of motivation and a useful read on Kanata's sociology, but
a meaningful fraction of what it recommends is dark-pattern design — and in places, outright
deception (fabricated onboarding narratives, manufactured scarcity, engineered-anxiety
notifications, Skinner-box reward multipliers, and a civic-donation mechanic that as written
would be charity theater).

The strategic decision embodied in these specs is to **adopt the legitimate high-value
mechanics aggressively and exclude the manipulative ones.** This is not an ethics tax on
growth. The manipulative mechanics are simultaneously the legally riskiest, the most
mismatched to Kanata's skeptical/affluent/tech-literate audience, and the most corrosive to
the community trust the white-hat layer depends on. Repeatedly, the honest version of a
mechanic is also the more *solvent* version — solvency and honesty converge.

Five specifications operationalize this. They are designed to interlock:

1. **CP Tokenomics Spec v2** — the emission rules every other spec inherits. Core discipline:
   net CP minted never exceeds the real value the platform can back, and any redemption a
   user reads as "real" actually is. Replaces the insolvent flat-faucet placeholder with a
   diminishing content faucet, commerce-weighted + merchant-funded emission, a Φ inflation
   governor, and a hard real-backing ceiling.

2. **Engagement Pattern Standard** — the binding catalog ruling on every mechanic the
   research proposed: Prohibited (hard line), Restricted (conditional), Endorsed (build it).
   A four-part litmus test governs anything unlisted. Doubles as a documented regulatory
   shield.

3. **Group Buy Merchant Economics Spec** — the supply-side model the research never built.
   Reframes "protect margins" honestly (convert idle slow-day capacity into contribution),
   installs the merchant-set price floor that makes the promise true, and proves with worked
   numbers that both merchant and platform are net-positive.

4. **Notes Editorial Governance & AI-Liability Spec** — treats the AI-summarized-news loop
   as a defamation/copyright firewall first, engagement mechanic second. The human-review
   gate that supplies the legal defence is the same mechanism that creates genuine editorial
   empowerment. Editorial authority is gated on accuracy, never on points.

5. **Node Liquidity & Seeding Playbook** — the honest cold-start engine: geographic density
   plus institutional seeding through Kanata's real neighbourhood associations, with a
   liquidity model that says launch cluster-level deals before node-wide ones.

**What is deliberately left to human judgment:** the disclosed CP→$ rate, the Phase-1
editorial scope line, whether to ever republish allegation-type business news, the real
budgets behind the civic sink, and counsel review of the liability sections. These specs are
scaffolding for those decisions, not substitutes for them.

---
---
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
# Engagement Pattern Standard

**Project:** Neighbours Club — Delivery Vertical
**Status:** Draft for review
**Owner:** Product Strategy / Systems Architecture
**Companion to:** CP Tokenomics Spec v2 (§14 references this document)

---

## 0. Purpose

The three Octalysis research documents are a strong taxonomy of motivation, but a
meaningful fraction of what they recommend is dark-pattern design — and in a few places,
outright deception. This Standard is the binding ruling on every behavioral mechanic
those documents propose. It exists so that:

1. No mechanic gets shipped on the authority of "the research said so" without a verdict
   here.
2. Engineering and design have one honest alternative to reach for whenever a proposed
   pattern is prohibited.
3. We have a documented, dated record of what we chose **not** to build — which is both a
   values statement and a regulatory shield (see §8).

This is not a soft style guide. The PROHIBITED list (§4) is a hard line. Anything not
explicitly endorsed or restricted defaults to "needs a ruling before build" (§7).

---

## 1. Why this matters commercially, not just ethically

The manipulative mechanics are simultaneously the legally riskiest, the most
demographically mismatched, and the most corrosive to the trust our white-hat layer
depends on. Kanata's population — affluent, highly educated, tech-literate, already
civically organized — is the **worst possible audience for manipulation**: they detect it
and churn with prejudice, and they talk to each other in the same neighbourhood
associations we're trying to recruit through. The honest version of almost every mechanic
below is also the more durable and, per the Tokenomics Spec, the more solvent one. We are
not trading growth for ethics. We are declining a growth tactic that does not work on this
audience and breaks the thing that does.

---

## 2. The litmus test

Before building any engagement mechanic, it must pass all four:

1. **Truth.** Is every claim, number, price, count, deadline, and progress indicator
   literally true at the moment it is shown?
2. **Backing.** If it implies value (money, support, savings, scarcity), is that value
   real and delivered? (Cross-check Tokenomics Spec §8, §10.)
3. **Consent & control.** Can the user understand what's happening and easily opt out,
   cancel, or decline without penalty or dark-pattern friction?
4. **Net benefit.** Does it serve a genuine user or community goal — not merely extract a
   transaction the user would regret on reflection?

A mechanic that fails any one of these is PROHIBITED, regardless of how effective it is.

---

## 3. Coverage map

This Standard rules on every named mechanic across all three research documents. The
domains covered: Content/Notes loop, Commerce/Group-Buy loop, Incentives/Points loop, the
White-Black-White transition, notifications, social pressure & privacy, pricing &
scarcity truthfulness, vulnerable-user protection, and defaults/cancellation. If you find
a proposed mechanic not listed here, treat it as §7 (unruled).

---

## 4. PROHIBITED — never build these

Each entry names the source mechanic, the research framing, why it fails, and what to
build instead.

### 4.1 Fabricated narratives (source: "Beginner's Luck," CD1)
**Research framing:** Tell a new user their "postal code has been selected for an
exclusive governance pilot," instantly elevating them to a special sub-tier.
**Why prohibited:** It is a lie. Fails Truth. Destroys trust irreparably with a skeptical
audience and is a deceptive-marketing exposure.
**Build instead:** Honest node assignment — "You're in the Morgan's Grant node" — and a
real, earnable first milestone. Genuine welcome, zero fabrication.

### 4.2 Manufactured / false scarcity (source: "Magnetic Caps," "Dangling," CD6)
**Research framing:** "Only X portions remaining" overlays and cryptic hints engineered to
create pressure.
**Why prohibited when fabricated:** A countdown or cap that does not reflect a real
kitchen limit or real close time fails Truth and Backing.
**Build instead:** Show real caps and real deadlines only. A true "12 of 50 portions left"
is allowed (§5.1); an invented or perpetually-low counter is not.

### 4.3 Fake price anchors (source: "Anchored Juxtaposition," CD6)
**Research framing:** Display a struck-through "retail" price beside the group price to
maximize perceived loss.
**Why prohibited when fake:** A struck-through price the item never actually sells at is a
deceptive pricing practice (the Competition Bureau pursues exactly this).
**Build instead:** Only strike through a price the item is genuinely, ordinarily sold at.
The honest savings are usually compelling on their own.

### 4.4 Variable-ratio / randomized rewards (source: "Sudden Rewards," "Easter Eggs," CD7)
**Research framing:** Inject randomized CP multipliers when a pledge tips a tier, to
generate "dopamine spikes" and "addict the user."
**Why prohibited:** This is a gambling mechanic (Skinner-box variable reward). Fails Net
Benefit; targets compulsion. Also banned in Tokenomics Spec §7 Rule 4.
**Build instead:** Predictable, disclosed rewards. If we want delight, use deterministic
milestone bonuses the user can see coming.

### 4.5 Sunk-cost exploitation (source: "Sunk Cost Prison," CD8)
**Research framing:** Use the psychological weight of an authorized payment to trap a user
into completing/recruiting.
**Why prohibited:** Deliberately exploiting sunk cost against the user's interest fails
Net Benefit and Consent & control.
**Build instead:** Make authorizations genuinely low-stakes and easy to withdraw before
capture, and say so plainly.

### 4.6 Engineered anxiety UI (source: "Visual Graves," "Progress Loss," CD8)
**Research framing:** Red pulsating bars and a UI shift to dread when a deal is at risk.
**Why prohibited:** Manufacturing distress to drive behavior fails Net Benefit; it is
hostile design.
**Build instead:** Calm, factual status. "This deal needs 3 more neighbours by 4 PM to
reach Tier 3" — informative, not threatening.

### 4.7 Coercive / anxiety push notifications (source: "Last Mile Drive," CD8)
**Research framing:** "Only 3 more neighbours needed, or your dinner plan will be
cancelled."
**Why prohibited:** Engineered fear + social coercion. Fails Net Benefit and Consent.
**Build instead:** Opt-in, factual, low-frequency updates (§5.2). "Your deal is close to
Tier 3 — share it if you'd like." No threat framing.

### 4.8 Civic-funding theater (source: "Multiplayer Sink" as zero-cost, CD1/CD5)
**Research framing:** Burn CP into a charity-themed pool while the platform's marginal
cost is "mathematically zero" — i.e. the money may not actually reach the named charity.
**Why prohibited:** Implying donations to a named real charity without real disbursement
is deceptive charitable solicitation — a serious legal and reputational exposure.
**Build instead:** Real dollars or it does not ship. Governed in full by Tokenomics Spec
§10 (disclosed CP→$ rate, pre-funded match, published disbursement proof).

### 4.9 Pay-to-win governance (source: tiers gated on lifetime CP donated/earned)
**Research framing:** Grant editorial/moderation rights based on CP donated or earned.
**Why prohibited:** Converts spending into authority over the community's information
supply. Fails Net Benefit; corrupts editorial trust.
**Build instead:** Gate governance on verified contribution **quality** (defined in the
Notes Editorial Spec). Status badges for top contributors are fine; editorial power for
purchase is not.

### 4.10 Exploiting the "moment of maximum vulnerability" (source: transition strategy)
**Research framing:** Time the post-capture reaffirmation to the user's moment of
"maximum psychological vulnerability" to suppress buyer's remorse.
**Why prohibited:** Designing around a user's vulnerability to suppress legitimate regret
fails Net Benefit and Consent.
**Build instead:** An honest confirmation and genuine thank-you are welcome (§5.4). If a
user regrets a purchase, the right response is a real refund/cancellation path, not
psychological suppression.

---

## 5. RESTRICTED — allowed only under stated conditions

### 5.1 Real countdowns, caps, and progress bars (CD6)
**Allowed if:** the deadline, cap, and counts are literally true and update honestly.
**Conditions:** No "override standard navigation" hijacking; the timer is informative, not
inescapable. No resetting/faking to renew urgency. User can always leave the screen.

### 5.2 Notifications (cross-cutting)
**Allowed if:** opt-in (or easily opt-out), factual, and frequency-capped.
**Conditions:** Hard cap **[TUNABLE: ≤2 deal-related pushes/day/user]**. No threat or
loss framing. A quiet-hours default. Every push has a one-tap mute.

### 5.3 Social proximity proof (source: "8 neighbours in your building," CD5)
**Allowed if:** counts are true, **aggregated and anonymized**, and never expose an
individual's participation without their explicit consent.
**Conditions:** No naming a specific neighbour ("Sarah L. ordered") without opt-in. No
guilt framing ("don't be the reason your building missed out"). Building-level granularity
only if the building is large enough to prevent re-identification **[TUNABLE: ≥N units]**.

### 5.4 Post-purchase reaffirmation / "Community Victory" screen (transition)
**Allowed if:** every figure is real (real savings, real merchant impact) and the screen
does not suppress the cancellation/refund path.
**Conditions:** Genuine thank-you and honest receipt: fine. No reframing designed to
override legitimate regret. The refund/cancel option remains visible.

### 5.5 Neighbourhood leaderboards / Elitism (source: "Elitism," CD1)
**Allowed if:** framed as celebration and friendly participation, not shaming.
**Conditions:** "Beaverbrook verified 40 stories this week 🎉" is fine. "Morgan's Grant is
LAGGING behind Katimavik" is not — no negative singling-out of a neighbourhood or person.
Opt-out of public ranking available.

### 5.6 Secret / rotating menu items (source: "secret_redemption," CD7)
**Allowed if:** the item genuinely exists, is genuinely available, and is delivered as
described when redeemed.
**Conditions:** Curiosity/teasing is fine; manufacturing obsessive impatience is not. CP
cost honest and backed (Tokenomics Spec §9). No cryptic hints implying scarcity that
isn't real.

### 5.7 Curiosity-driven daily content (source: "mystery previews," CD7)
**Allowed if:** the daily content has real value and the "surprise" isn't a hollow
habit-trap.
**Conditions:** Don't withhold genuinely useful information purely to force app-opens. A
real daily local note people want to read is the goal, not engineered uncertainty.

### 5.8 Oracle Effect / dynamic pricing uncertainty (source: CD7)
**Allowed if:** the user is told plainly that the final price depends on participation and
is bounded by the authorized ceiling they see.
**Conditions:** No "betting" framing that obscures the real mechanic. The ceiling is the
max they can be charged, stated up front.

### 5.9 Organic deal sharing (source: "Last Mile Drive," reframed)
**Allowed if:** sharing is user-initiated and motivated by a genuinely good deal, not by
manufactured fear.
**Conditions:** No coercion, no "your dinner dies" framing, no turning users into anxiety-
driven recruiters. A simple "share this deal" button is fine.

---

## 6. ENDORSED — build these (the honest high-value mechanics)

These passed the litmus test cleanly and are the engagement core we actively want.

- **Humanity Hero / Narrative (CD1):** verification framed as genuine civic stewardship —
  true, because human review genuinely improves accuracy and protects named businesses.
- **Real merchant linkage (CD1):** stories that drive real traffic to real local
  merchants via `restaurantId`.
- **Evolved UI / progressive disclosure (CD3):** unlocking real editorial tools as users
  earn verified-quality standing.
- **Plant Picker (CD3):** letting users link notes to merchant menus and see real
  resulting traffic/conversion metrics.
- **Localization Heatmap & Neighbourhood Impact Statement (CD2):** honest, aggregated
  community-impact visualizations using real data.
- **Commerce-weighted + merchant-funded vesting (CD2/CD4):** the solvent engine
  (Tokenomics Spec §6).
- **Real civic donation sink (CD1/CD5):** the strongest retention mechanic available, when
  built per Tokenomics Spec §10.
- **Green Route batched delivery (CD1):** a real unit-economics and environmental win —
  compelling with zero manipulation; offer it as an honest choice with a real CP reward.
- **Genuine status badges / trophy shelf (CD2/CD5):** recognition for real contribution,
  with no purchased governance attached.

---

## 7. The default rule for anything unlisted

If a proposed mechanic is not explicitly ENDORSED or RESTRICTED above, it is **not
approved by default**. It must be run through the §2 litmus test and added to this
Standard with a dated ruling before it ships. "It's in the research" is not an approval.

---

## 8. Regulatory context (why this is also a shield)

Canada's Competition Bureau has been actively pursuing deceptive-marketing and dark-pattern
cases, including drip pricing, fake urgency, and fake scarcity. Several PROHIBITED items
above (4.2, 4.3, 4.7, 4.8) map directly onto conduct the Bureau has targeted. Maintaining
this Standard — a dated, documented record that we identified and declined these patterns —
is a meaningful part of demonstrating good faith if our practices are ever reviewed. This
is not legal advice; have counsel review §4 before launch. The point is that the honest
choice and the defensible choice are the same choice.

---

## 9. Governance

- **Ownership:** Product Strategy maintains this Standard; Engineering and Design treat it
  as binding.
- **Change control:** any addition or exception requires a dated entry, the §2 litmus
  reasoning, and sign-off. No silent edits.
- **Review cadence:** revisit each phase boundary (per the Phased Integration Roadmap) and
  whenever a new engagement mechanic is proposed.
- **Escalation:** disputed rulings go to the spec owner; when a pattern is "effective but
  uncomfortable," default to the more conservative reading.

---

## 10. Change log

| Date | Change | Reason |
|---|---|---|
| (draft) | Initial issue covering all three Octalysis research documents | Establish binding ruling on every proposed mechanic |
# Group Buy — Merchant Economics Specification

**Project:** Neighbours Club — Delivery Vertical
**Status:** Draft for review
**Owner:** Product Strategy / Systems Architecture
**Depends on:** CP Tokenomics Spec v2 (§6 commerce-weighted vesting, §13 merchant-bounty
funding); Engagement Pattern Standard (§5.1 real caps, §5.8 dynamic pricing honesty)

---

## 0. The gap this spec closes

All three research documents repeat that group buys "protect merchant margins" and give
merchants "predictable volume." Neither claim is ever modeled. This matters because the
claim is **only conditionally true**: a discount-driven group buy whose lowest tier prices
below a merchant's variable cost *destroys* contribution on every unit sold, and group
buys run in peak hours *cannibalize* full-price demand. None of the research models the
supply side at all — it is the single largest blind spot across the three documents.

This spec defines the merchant-side economics precisely, sets the guardrail that makes the
"protect margins" claim true (a merchant-set price floor), and proves with worked numbers
that both the merchant and the platform are net-positive on slow-day volume.

---

## 1. The honest reframing of "protect margins"

Group buys do **not** preserve per-unit margin — per-unit margin is deliberately *lower*
at every discount tier. What they do, correctly applied, is convert **idle capacity on
slow days into positive contribution**.

The mechanism is contribution-margin accounting. On a slow Tuesday, a restaurant's fixed
costs (rent, salaried/scheduled staff, equipment) are already sunk — they are paid whether
or not an order comes in. So the only number that matters for an incremental slow-day order
is **contribution = unit price received − variable cost** (food, packaging, marginal
labor). As long as contribution is positive, each group-buy unit is pure upside against an
hour that would otherwise produce roughly zero.

This is why the model **only works in genuine slack windows** (§5). Run the same deal at a
Friday dinner rush and the cheap units cannibalize sales the merchant would have made at
full price — turning upside into loss. The reframing we put in front of merchants is
honest: *"Fill your dead Tuesday at a profit," not "discount without cost."*

---

## 2. Variables

| Symbol | Meaning | Who sets it |
|---|---|---|
| `P` | Normal menu price per unit | Merchant |
| `C_var` | Merchant's variable cost per unit (private) | Merchant (never disclosed to us) |
| `F` | **Floor price** — lowest unit price the merchant will accept | Merchant |
| `t` | Platform merchant take rate (% of unit price) | Platform **[TUNABLE: 10%]** |
| `G_i` | Group-buy unit price at tier _i_ | Tier engine, constrained `G_i ≥ F` |
| `T_min` | Minimum participants for the deal to succeed | Merchant |
| `T_cap` | Maximum capacity (real kitchen limit) | Merchant |
| `b` | Optional merchant-funded CP bounty per unit | Merchant (Tokenomics §6) |

Merchant contribution per unit at tier _i_:

```
contribution_i = G_i × (1 − t) − C_var − (b × cpToDollarRate)
```

The merchant only ever tells us `F` (and optionally `b`). They never disclose `C_var`,
because the floor already encodes whatever minimum contribution they require. This respects
their private cost information and keeps us out of their books.

---

## 3. The guardrail: merchant-set price floor

**Rule: no tier may price below `F`.** The tier engine validates this at deal creation and
rejects any `DealTier` where `G_i < F`. This is the single mechanism that converts the
research's unsupported "protects margins" assertion into a true one.

`F` is the merchant's decision and encodes everything they care about: it must cover their
variable cost, their minimum acceptable contribution, and any CP bounty they choose to
fund. We surface a helper at deal setup — "Your lowest tier will be $X; you'll receive
$X × (1 − t) = $Y per unit before your own food cost" — so the merchant sets `F` with eyes
open, without us ever asking for `C_var`.

---

## 4. Worked model (continuity with the research's lasagna example)

Illustrative inputs: `P = $18.50`, merchant's private `C_var = $6.00`, merchant floor
`F = $9.50`, platform take `t = 10%`. Tiers as proposed in the research:

| Tier | Participants | Unit price `G` | Merchant receives `G×(1−t)` | Contribution `−C_var` | ≥ Floor? |
|---|---|---|---|---|---|
| 1 | 0–14 | $18.50 | $16.65 | **+$10.65** | ✓ |
| 2 | 15–34 | $15.00 | $13.50 | **+$7.50** | ✓ |
| 3 | 35–49 | $12.50 | $11.25 | **+$5.25** | ✓ |
| 4 | ≥50 | $10.00 | $9.00 | **+$3.00** | ✓ |

Every tier is net-positive contribution. At the deepest discount (Tier 4, 50 units):
`50 × $3.00 = $150` of contribution on a Tuesday that would otherwise generate ~$0
incremental — and the merchant got 50 guaranteed orders to plan staff and prep around.

**With an optional 50 CP/unit bounty** at the disclosed rate `cpToDollarRate = $0.01`
(= $0.50/unit): Tier 4 contribution falls to `$3.00 − $0.50 = $2.50`, or `$125` total. The
merchant decides whether 50 units of local engagement is worth $0.50/unit. It's their call,
funded from their own margin — off the platform balance sheet (Tokenomics §6).

**The guardrail in action:** had anyone proposed a Tier 5 at $8.00, then
`$8.00 × 0.9 = $7.20 < C_var $6.00`? No — $7.20 > $6.00, still positive, but it's below the
merchant's `F = $9.50`, so the engine **rejects the tier at creation.** The floor protects
the merchant's stated minimum even when raw contribution would still be positive.

---

## 5. Cannibalization control (the unmodeled risk)

Because the economics depend entirely on idle capacity, group buys must be confined to
genuine slack:

- **Slow-window restriction:** deals run only in merchant-designated windows
  (`slowWindowStart/End`), defaulting to the research's Tue/Wed slow days. No peak-hour
  group buys.
- **Capacity cap as real scarcity:** `T_cap` reflects the real kitchen ceiling. This is the
  honest scarcity permitted by Engagement Standard §5.1 — a true limit, not a manufactured
  one.
- **No stacking with full-price rush:** a deal's fulfillment window cannot overlap a
  merchant's flagged peak window.

---

## 6. Platform economics (so we're solvent too)

Per the blueprint, the customer pays: subtotal + `$4.99` delivery fee + 10% service fee +
13% HST. HST is remitted to government — **not platform revenue**. Platform revenue per
group-buy order (Tier 4 example, $10 subtotal):

| Source | Amount |
|---|---|
| Merchant take (`t` × $10.00) | $1.00 |
| Service fee (10% of subtotal, customer-paid) | $1.00 |
| Delivery margin ($4.99 fee − ~$4.00 driver payout) | $0.99 |
| **Gross platform revenue** | **$2.99** |
| Less CP emission liability (50 CP × $0.01) | −$0.50 |
| **Net platform contribution / order** | **+$2.49** |

Positive per order, before the Green Route batching efficiencies that further cut the
driver payout (deferred to the roadmap's Phase 3).

**Decision flag:** taking *both* a merchant cut and a customer service fee is standard for
aggregators but cuts against our low-fee hyperlocal positioning. Confirm whether we take
the full `t` on group buys or a reduced cut, given we already collect the customer service
fee (§9, open decision 1).

---

## 7. Payment & settlement flow (Stripe manual capture)

Continuity with the existing architecture and Engagement Standard §5.8 (honest dynamic
pricing):

1. **Pledge:** authorize the Tier-1 *ceiling* `G_1` on the customer's card
   (`PaymentIntent`, `maxAuthorizedAmount`). Customer is told plainly: *"This is the most
   you'll pay; the price drops as neighbours join."* The ceiling is the cap, never exceeded.
2. **Open window:** participants accrue. Current tier and live count shown truthfully.
3. **Close (idempotent `close-deals` cron, every 5 min):**
   - **Branch A — success (`participants ≥ T_min`):** compute final tier from final count,
     **capture each card at the final tier price** (`finalAmount ≤ maxAuthorizedAmount`),
     vest `group_buy_reward` CP per Tokenomics §6, vest any merchant bounty, mark
     `CLOSING_SUCCESS`.
   - **Branch B — failure (`participants < T_min`):** **void all authorizations**, capture
     nothing, mark `CLOSING_FAILED`. The customer is never charged.
4. **Idempotency:** the `closingProcessedAt` sentinel and `@@unique([walletId, referenceId,
   reason])` guard against double-capture/double-mint on cron retries.

Note the deliberate contrast with the research: Branch B is presented to users factually
("the deal didn't reach its minimum, you were not charged"), **not** as the engineered
loss/grief experience the research proposed (Engagement Standard §4.6, §4.7).

---

## 8. Schema changes (Prisma)

Additions to the existing `Deal` / `DealTier` models (final migration reviewed separately):

- `Deal.floorPriceCents` — integer; the merchant floor `F`. Required.
- `Deal.minParticipants` — integer; `T_min`. Required.
- `Deal.maxCapacity` — integer; `T_cap`, the real kitchen limit.
- `Deal.slowWindowStart` / `Deal.slowWindowEnd` — datetime; permitted fulfillment window.
- `Deal.merchantTakeRateBps` — integer (basis points); per-deal override of default `t`.
- `Deal.merchantBountyCp` — integer, nullable; per-unit bounty `b`.
- `Deal.merchantBountyFunded` — boolean; whether the merchant commitment is captured.
- `DealTier.unitPriceCents` — integer; **validated `≥ Deal.floorPriceCents` at creation.**
- `DealTier.thresholdParticipants`, `DealTier.tierOrder` — as in blueprint.
- `MerchantPayout` — new model: `dealId`, `unitsSold`, `grossCents`, `takeCents`,
  `bountyCostCents`, `netToMerchantCents`, `status`, `paidAt` — the auditable record the
  merchant sees.

Validation logic lives server-side; tier-floor enforcement is a hard constraint, not a
warning.

---

## 9. Open decisions needed before build

1. **Take-rate policy on group buys.** Full `t` plus customer service fee, or a reduced
   merchant cut given the service fee already collected? Affects merchant willingness and
   our positioning (§6).
2. **Driver payout assumption.** The $4.00/order figure is a placeholder; real payout
   drives whether delivery margin is positive pre-Green-Route. Confirm against the Node
   Liquidity Playbook.
3. **Bounty funding flow.** Pre-funded hold (like the group-buy auth) vs. post-capture
   invoice — sets `merchantBountyFunded` semantics. (Mirrors Tokenomics §13 decision 3 —
   resolve once, consistently.)
4. **Floor-setting UX.** Do we show merchants the contribution helper (§3) using a
   merchant-entered `C_var` they keep private locally, or only the post-take receive
   amount? Affects how confidently merchants set `F`.
5. **`T_min` defaults.** Minimum viable participant count is partly a merchant kitchen
   decision and partly a node-liquidity question — coordinate the default with the Node
   Liquidity & Seeding Playbook.

---

## 10. What this spec deliberately does not do

It does not implement any pricing display that strikes through a price the item isn't
genuinely sold at (Engagement Standard §4.3), any sub-floor "loss-leader" tier, any
peak-hour deal, or any failure-state grief UI. The merchant floor and slow-window
restriction are non-negotiable guardrails: without them, the "protect margins" promise we
make to merchants is false.
# Notes — Editorial Governance & AI-Liability Specification

**Project:** Neighbours Club — Delivery Vertical
**Status:** Draft for review
**Owner:** Product Strategy / Systems Architecture
**Depends on:** Engagement Pattern Standard (§4.9 no pay-to-win governance, §6 endorsed
white-hat mechanics); CP Tokenomics Spec v2 (§4 verified-read faucet)
**Legal note:** The liability characterizations below are for product-planning orientation,
not legal advice. Counsel must review §1, §6, and §7 before launch.

---

## 0. What this spec protects against

The Notes loop ingests local news (CBC Ottawa, Ottawa Citizen, etc.) via the `RawIntel`
model, runs it through AI summarization, and publishes `ProcessedNote` records — many of
them **naming real local businesses** via the `restaurantId` linkage. The research treats
the only open problem here as "editorial trust." It is not. Publishing AI-generated claims
about named, real businesses and real local matters creates concrete **legal exposure** —
primarily defamation and copyright — that no amount of gamification addresses. An AI
hallucination that attributes a false claim to a real Kanata restaurant is a liability, not
a UX issue.

This spec defines the editorial pipeline as a **liability firewall first** and an
engagement mechanic second. The elegant part: the human-review layer that supplies our
legal defence is the *same* mechanism that creates the genuine CD3 empowerment the research
wants. We get the engagement by doing the risk mitigation properly.

---

## 1. The exposure (orientation for counsel review)

Three categories, in rough order of severity:

**Defamation.** In Canada, a statement is defamatory if it tends to lower a person's or
business's reputation before a reasonable person. Businesses can sue. Truth (justification)
is a defence; "an AI wrote it" is **not** a defence, and republication is itself
publication — so the platform is exposed as publisher the moment it pushes a false negative
claim about a named merchant (e.g. a hallucinated health-inspection failure). There is,
however, a recognized defence of **responsible communication on matters of public
interest**, which turns on whether the publisher exercised genuine diligence. Our editorial
process (§4–§6) is precisely what supplies that diligence — which is why the human-in-the-
loop is load-bearing legally, not just reputationally.

**Copyright / IP.** Facts are not copyrightable, but a source article's *expression* is.
AI summaries that closely paraphrase the original, or reproduce substantial portions, risk
infringement. Summaries must be genuinely transformative — facts restated in original
wording — with source attribution and a link back. (See the IP constraints in our general
content rules.) This exposure is entirely unaddressed in the research.

**Privacy / accuracy.** Notes about identifiable individuals (as opposed to businesses or
public-interest matters) raise privacy concerns and should be out of scope for the pilot.
Inaccurate local reporting also directly erodes the civic-trust thesis the whole white-hat
layer depends on.

---

## 2. MVP risk posture (the conservative default)

For the pilot, the cheapest risk reduction is scope restriction. **Phase 1 publishes only
low-risk note types** and defers republishing hard-news allegations about businesses until
the full framework (§4–§7) and legal review are in place:

- **Allowed at launch:** neutral/positive local-interest items ("new bakery opened on
  Hazeldean"), merchant profiles published **with merchant consent**, community events,
  factual civic notices restated transformatively with attribution.
- **Deferred until full framework + counsel sign-off:** any note containing a negative or
  allegation-type claim about a named business or person (health, safety, legal, financial,
  quality).

This single decision removes most of the §1 defamation surface during the riskiest early
period at near-zero engineering cost.

---

## 3. Note risk classification

Every `ProcessedNote` is auto-classified at draft time:

**HIGH risk** if any of: names a business *and* carries a negative/allegation claim;
concerns an identifiable individual; touches a sensitive public matter (health, safety,
legal, financial). **LOW risk** otherwise.

The AI summarizer emits a risk tier plus a confidence score; the classifier errs toward
HIGH on ambiguity. Risk tier drives the review gate (§4). During Phase 1, HIGH-risk notes
are simply not published (§2).

---

## 4. The editorial state machine

```
RawIntel ─▶ AI summarize ─▶ DRAFT ─▶ IN_REVIEW ─▶ APPROVED ─▶ PUBLISHED
                                         │                         │
                                         ▼                         ▼
                                     REJECTED                CORRECTED / RETRACTED
```

Review gate by risk tier:

| Risk tier | Gate to publish |
|---|---|
| LOW | **N independent certified-moderator approvals** **[TUNABLE: N=2]**, no rejections |
| HIGH | All of the LOW requirement **plus mandatory staff Managing Editor sign-off** |

Certified citizen moderators are *necessary but not sufficient* for HIGH-risk notes — a
staff editor must personally clear anything in the defamation-sensitive set. This is the
diligence record that underpins the responsible-communication defence (§1).

**Pre-publication review is the legal firewall. Post-publication verification (§8) is a
separate, secondary signal.** The research conflates them; they are not the same and the
liability gate must sit *before* publish.

---

## 5. Citizen-journalist certification — gated on quality, never on CP

This is where Engagement Standard §4.9 (no pay-to-win governance) gets its mechanism.
Editorial rights attach to **demonstrated accuracy**, decoupled entirely from CP earned or
donated. CP buys status badges; it never buys authority over the information supply.

Certification path:

1. **Probation:** a candidate moderator's review decisions are recorded but
   non-binding (shadow mode) for a probation window **[TUNABLE: 30 days / 25 decisions]**.
2. **Accuracy score:** their shadow decisions are scored against outcomes — did their
   approvals correlate with notes that were *not* later corrected/retracted? Did their flags
   catch real errors? Score = agreement with verified outcomes, not volume.
3. **Certification:** granted only above an accuracy threshold **[TUNABLE: ≥90%]**. Revoked
   if accuracy degrades below a floor.
4. **Status tiers stay cosmetic for editorial purposes.** `NEIGHBORHOOD_CHAMPION` /
   `COMMUNITY_PILLAR` may *unlock the opportunity* to enter the probation path, but never
   confer editorial power directly, and CP donation never shortcuts certification.

This makes the moderation queue the genuine CD3 empowerment mechanic the research wants —
users earn real editorial agency — without letting generosity or spending corrupt it.

---

## 6. Correction & right-of-reply workflow (for named parties)

Mandatory for any published note naming a business or person:

- **Reporting channel:** a clearly linked "Request a correction" path on every such note,
  reaching a monitored queue.
- **SLA:** acknowledge within **[TUNABLE: 2 business days]**; for HIGH-risk claims, the note
  is **provisionally unpublished pending review** on credible dispute, not left live while
  contested.
- **Right of reply:** named merchants may submit a short response published alongside the
  note.
- **Versioning & audit trail:** every note is versioned with who approved it, when, and
  under which risk tier — the diligence record counsel will want if a claim is ever made.
- **Retraction:** retracted notes are marked, not silently deleted (audit integrity). User
  CP already earned on a since-retracted note is **not clawed back** — readers acted in good
  faith, and clawback would punish the behavior we want and create its own UX/ledger mess.

---

## 7. Source attribution & copyright handling

- Every published note **attributes its source and links to the original.**
- Summaries must be **transformative** — facts in original wording, never close paraphrase
  or substantial reproduction of the source's expression. The summarization prompt enforces
  this and the review gate checks it.
- `RawIntel` retains the source URL, publisher, and ingestion timestamp for every record.
- Confirm with counsel whether each upstream feed's terms permit derivative summarization
  and linking (§9, decision 4).

---

## 8. The "Verify" mechanic (post-publication, honest framing)

A reader of a PUBLISHED note may click "Verify," earning CP per Tokenomics §4 (now the
diminishing curve, not a flat 500). Honest framing per Engagement Standard §6: human
verification *genuinely* improves the corpus and surfaces errors the pre-publication gate
missed. But it is explicitly a **secondary** accuracy signal and engagement loop — it does
**not** substitute for the §4 pre-publication review, and a high verify count never
auto-publishes or auto-clears a disputed note. Verification data also feeds moderator
accuracy scoring (§5).

---

## 9. Schema changes (Prisma)

- `ProcessedNote`: add `riskTier` (LOW|HIGH), `aiModel`, `aiConfidence`, `sourceUrl`,
  `sourcePublisher`, `sourceIngestedAt`, `version`, `publishedAt`; extend status enum to
  `DRAFT|IN_REVIEW|APPROVED|PUBLISHED|REJECTED|CORRECTED|RETRACTED`. Keep `restaurantId`
  nullable.
- `NoteReview` — new: `noteId`, `reviewerId`, `decision` (APPROVE|REJECT|FLAG), `comment`,
  `isShadow` (probation), `createdAt`.
- `Reviewer` — new: `userId`, `certificationStatus`, `accuracyScore`, `probationUntil`,
  `certifiedAt`, `revokedAt`.
- `NoteCorrection` — new: `noteId`, `requesterContact`, `claim`, `status`, `resolution`,
  `acknowledgedAt`, `resolvedAt`.
- `NoteVerification` — new: `userId`, `noteId`, `createdAt`; `@@unique([userId, noteId])`.
- `NoteVersion` — new (or JSON history on the note): immutable snapshot per edit for the
  audit trail.

---

## 10. Open decisions needed before build

1. **Phase-1 scope line.** Confirm the exact boundary of "low-risk" note types eligible for
   launch (§2) — get counsel to bless the list.
2. **HIGH-risk republishing.** Decide whether we *ever* republish allegation-type business
   news, or only ever link out to the original without restating the claim. The
   link-out-only option nearly eliminates defamation exposure.
3. **Moderator legal status.** Are certified citizen moderators volunteers, and does their
   role create any liability/insurance consideration for them or us? Counsel question.
4. **Feed licensing.** Verify each source feed's terms permit AI summarization + linking
   (§7).
5. **Provisional-unpublish trigger.** Define "credible dispute" precisely enough to
   automate the §6 provisional-unpublish without it becoming a censorship/abuse vector.

---

## 11. What this spec deliberately does not do

It does not let CP purchase editorial authority (Engagement Standard §4.9); does not publish
HIGH-risk claims about named parties during the pilot (§2); does not treat post-publication
"Verify" as a substitute for pre-publication review (§8); does not silently delete retracted
content or claw back good-faith user CP (§6); and does not republish source expression
non-transformatively (§7). The pre-publication human gate on HIGH-risk notes is the single
non-negotiable control — it is both the engagement mechanic and the legal defence, and the
two are the same thing.
# Node Liquidity & Seeding Playbook

**Project:** Neighbours Club — Delivery Vertical
**Status:** Draft for review
**Owner:** Product Strategy / Operations
**Depends on:** Group Buy Merchant Economics Spec (§9 `T_min` & driver-payout decisions);
CP Tokenomics Spec v2 (§10 civic sink); Engagement Pattern Standard (§4.7 no coercive
recruiting, §5.9 organic sharing only)
**Verification note:** Specific Kanata demographics and business names that appear in the
source research are marked **[VERIFY]** — treat them as leads to confirm on the ground, not
as established facts. The structural recommendations here do not depend on the precise
figures.

---

## 0. The problem this solves

A group-buy marketplace has a cold-start / liquidity problem: a deal needs a minimum number
of participants (`T_min`) to clear, but early nodes have few users, so deals fail, users
get frustrated, merchants see no volume, and everyone churns. The research correctly
identified cold-start as a core theme but proposed solving it largely through **anxiety-
driven virality** ("share or your dinner dies"). That mechanism is prohibited (Engagement
Standard §4.7) and, worse, it builds bonding-under-stress, which is the opposite of the
bridging social capital we want.

The good news, established in the cross-framework synthesis: **Kanata hands us a better
growth engine for free.** It is a dense, garden-city suburb with established neighbourhood
associations and clustered housing. We solve liquidity through *geographic density plus
institutional seeding* — honest, durable, and aligned with the white-hat layer.

---

## 1. The liquidity model (so thresholds aren't guesses)

Let:
- `A` = active users in a node (or sub-cluster)
- `c` = participation rate for an attractive slow-day deal (fraction who pledge)
- `E = A × c` = expected participants for that deal

To clear `T_min` *reliably* (with buffer for variance), target `E ≥ 2 × T_min`, i.e.:

```
A ≥ (2 × T_min) / c
```

Early estimate `c ≈ 10%` **[TUNABLE — measure on the first real deals]**.

Worked: for `T_min = 10` and `c = 0.10`, you need **`A ≥ 200` active users node-wide**
before node-wide deals clear reliably. That's a lot for a young node — which is exactly why
the next section matters.

**The density shortcut.** Within a single large condo building or tight cluster, local
relevance is far higher, so `c` rises sharply (20–30%+). A 150-unit building at `c = 0.25`
yields `E ≈ 37` from one building alone. So we **launch cluster-level deals long before
node-wide liquidity exists**, choosing buildings/clusters dense enough that a single one
clears `T_min`. This is the operational core of the playbook and it maps directly onto
Kanata's built form (condo clusters in Kanata Lakes and along the tech-park corridor)
**[VERIFY the specific clusters]**.

---

## 2. Minimum viable thresholds (the loose threads from other specs)

| Threshold | Early-node value | Mature-node value | Notes |
|---|---|---|---|
| `T_min` per deal | **[TUNABLE: 8–12]** | raise as density grows | Group Buy Spec §9.5 |
| Pre-launch active users (cluster-level deals) | one cluster with `E ≥ 2·T_min` | — | §1 density shortcut |
| Pre-launch active users (node-wide deals) | **~200 [TUNABLE]** | — | §1 model |
| Merchants live per node before first deal | **[TUNABLE: 3–5]** | grow steadily | §3 |
| Deal clear-rate to advance a node | **≥70% [TUNABLE]** | — | §6 success gate |

Start `T_min` low so early deals actually clear (a cleared small deal builds trust; a failed
ambitious one burns it), then raise it as `A` grows and the merchant wants bigger batches.

---

## 3. Restaurant recruitment (supply first)

Marketplaces seed supply before demand — users won't return to an empty shelf. Recruit
**3–5 independent restaurants** in the launch corridor (the research points to March Road /
Kanata North **[VERIFY]**).

**Selection criteria** (not a fixed list — confirm real, willing partners on the ground):
- Independent (the platform's whole pitch is helping independents vs. high-fee aggregators).
- Has genuine **slow-day slack** (Tue/Wed lunch or early week) — the economics only work on
  idle capacity (Group Buy Spec §1, §5).
- Family-style / batchable menu items suit group buys (the research's "Tuesday lasagna" /
  family-bundle pattern **[VERIFY menu fit]**).
- Willing to set an honest price floor `F` and a real capacity cap `T_cap` (Group Buy Spec
  §3) — i.e. a partner who understands the contribution-margin logic, not one expecting
  free discounting.

Do **not** seed the playbook with specific business names carried over from the source
research — several may be inaccurate. The names there are starting leads to verify, nothing
more.

---

## 4. User seeding through real civic institutions (the honest engine)

Kanata's neighbourhood associations — Beaverbrook, Glen Cairn, Bridlewood, Morgan's Grant,
Katimavik **[VERIFY current associations]** — are dense, real, trusted local networks. We
seed users through genuine partnership with them.

**The honest framing matters.** The research proposed handing community leaders "Managing
Editor status" as a recruitment lever — that's instrumentalizing them. Instead: offer the
associations a **real local tool** their members actually want (a hyperlocal feed + group
buys that support the independents their members already patronize), and let editorial roles
be *earned* through the quality-gated certification path (Notes Editorial Spec §5), not
handed out as a growth bribe.

Seeding tactics, all within Engagement Standard §5.9 (organic, non-coercive):
- Partner with one association first; run a launch event tied to a real cleared deal.
- Building-/cluster-level focus (§1) so early adopters experience deals that *clear*.
- Let satisfied users share genuinely good deals — a plain "share" button, never the
  "your dinner dies" coercion.

---

## 5. Driver liquidity

Early nodes can't support a standing driver fleet, so dispatch follows the blueprint's
existing design: a **3-minute internal-driver dispatch window, then Uber Direct fallback.**

- Early node: rely heavily on the Uber Direct fallback; volume is low and sporadic.
- Payout assumption: the **~$4.00/order** figure in the Group Buy Spec is a placeholder —
  confirm real local Uber Direct / internal payout before relying on the delivery-margin
  math (Group Buy Spec §6, §9.2) **[VERIFY]**.
- Maturity unlock: **Green Route batched delivery** (Roadmap Phase 3) is what makes internal
  driver economics work — one driver, many orders to one cluster. Group buys naturally
  produce the geographic density batching needs, so the cluster-first strategy (§1) and
  Green Route reinforce each other.

---

## 6. Node activation sequence

A clean, honest version of the research's phased plan, gated by real metrics rather than
calendar dates:

**Stage A — Supply.** Recruit 3–5 qualifying independents in the launch corridor (§3).
Confirm each has set an honest floor and real slow-window capacity.

**Stage B — Civic seeding.** Partner with one neighbourhood association (§4); onboard early
users; populate the Notes feed with Phase-1-safe content only (Notes Editorial Spec §2).

**Stage C — First cluster deals.** Run building-/cluster-level group buys where density
clears `T_min` reliably (§1). Goal: early deals that *succeed*, building trust on both sides.

**Stage D — First civic sink.** Launch a real, dollar-backed civic campaign with a genuine
local partner (Tokenomics Spec §10) — completes the white-hat retention loop with real money,
no theater.

**Advance to node-wide deals only when** clear-rate ≥70%, merchant retention is holding, and
active users clear the §1 node-wide threshold.

---

## 7. Success metrics (what tells us a node is healthy)

- **Deal clear-rate** (share of deals reaching `T_min`) — the primary liquidity signal.
- **Repeat participation** (users joining a 2nd+ deal) — retention without coercion.
- **Merchant retention** (merchants running a 2nd+ deal) — proof the economics actually work
  for supply.
- **Organic share rate** — healthy if it's voluntary; we never juice it with anxiety.
- **Φ in band** (Tokenomics Spec §7) — the node isn't inflating CP.
- **Correction-request rate on Notes** (Editorial Spec §6) — content trust holding.

A node failing clear-rate or merchant retention gets *more density / lower `T_min`*, not
more pressure tactics.

---

## 8. Open decisions needed before build

1. **`c` measurement plan.** We're guessing 10% node-wide / 25% cluster — instrument the
   first deals to get the real number; every threshold here recalibrates off it.
2. **Launch cluster selection.** Identify the specific dense building(s)/cluster(s) to seed
   first **[VERIFY on the ground]**.
3. **Association partnership terms.** What does the association get, concretely, and what
   (if anything) do we ask of them — kept clear of the editorial-bribe anti-pattern (§4)?
4. **Driver payout reality.** Confirm real local dispatch economics (§5) before trusting the
   delivery-margin math.
5. **First civic partner.** Which real, local organization for the Stage-D sink, and what
   real match budget (coordinate with Tokenomics Spec §13 decision 1, the CP→$ rate)?

---

## 9. What this playbook deliberately does not do

It does not grow via manufactured urgency, coercive recruiting, or "share-or-lose" framing
(Engagement Standard §4.7); does not instrumentalize community leaders with editorial bribes
(§4); does not launch node-wide deals before density supports them (the #1 cause of
cold-start death); and does not treat the source research's specific business names or
demographics as verified (§0, §3). Liquidity comes from real local density and real civic
partnership — the two things Kanata already has.
