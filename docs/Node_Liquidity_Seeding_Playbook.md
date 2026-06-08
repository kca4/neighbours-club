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
