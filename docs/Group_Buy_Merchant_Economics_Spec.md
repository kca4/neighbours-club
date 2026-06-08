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
