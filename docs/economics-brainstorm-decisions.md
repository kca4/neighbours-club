# Neighbours Club — Profitability Brainstorm (Working Notes)

Status: BRAINSTORM / provisional. Numbers marked [ASSUMED] need validation;
[DECIDED] items are locked; [NEEDS VERIFICATION] require external confirmation.
Not financial advice. Kanata pilot focus; Canada-wide expansion is a separate model.

---

## 1. Per-order unit economics (single "teal" order)

Decided inputs: delivery fee $4.99, service fee 10%, CP rate $0.01/CP (committed,
do not change), HST 13% (pass-through), Stripe ~2.9%+$0.30 on full charged amount.
[ASSUMED] avg order $35 food, tip $5 (pass-through), courier $8/delivery.

Margin ≈ (T × $35) + $8.49 − $9.87  =  **T × $35 − $1.38**

| Take-rate T | Margin/order (pre-CP) |
|---|---|
| 10% | ~$2.12 |
| 12% | ~$2.82 |
| 15% | ~$3.87 |
| 20% | ~$5.62 |

KEY FINDING: mechanical break-even take-rate is ~4% — delivery+service fees nearly
cover courier+Stripe, so commission is almost pure margin. The "cheaper than Uber
Eats and still profitable" thesis is arithmetically sound, not charity.

---

## 2. The three profit-killers (instrument all from day one)

- **Killer #1 — CP faucet decoupled from revenue.** Every CP emitted = $0.01
  liability. A maxed weekly-cap reader costs ~$26/wk generating maybe zero orders.
  Watch ratio: CP-emitted-per-order-completed. Red line ~300-400 CP/order.
- **Killer #2 — Waiver cliff.** Full fee waiver flips an order to ~−$1.12 at T=15%.
  Fine as loyalty spend if waivers <~20% of orders; dangerous above.
- **Killer #3 — Courier economics at low density.** $8/delivery [ASSUMED] is the
  softest number. Low volume = poor courier income = supply problem. Group-buy
  (batching one trip across N) is the density cheat-code and the profitable track
  at pilot scale.

Instrument these four ratios as the real live P&L: waiver rate, CP-per-order,
orders-per-courier-hour, escalation rate.

---

## 3. Uber Direct escalation (reliability valve, NOT fulfillment strategy)

[NEEDS VERIFICATION] Uber Direct Ottawa pricing — planning range $9-15/delivery,
model at $12. Real integration is UNBUILT (stub only) — a real Tier-1-adjacent
build item if escalation is core to launch.

Escalated order margin at T=15%, $12 Uber: ~−$0.13 (break-even to negative).
Waived + escalated: −$5 or worse.

Blended margin by escalation share E:
| E | Blended margin/order (T=15%) |
|---|---|
| 10% | $3.47 |
| 30% | $2.67 |
| 50% | $1.87 |
| 100% | −$0.13 |

RULE: escalation only works as the MINORITY path. Operational red line: keep E
under ~40% so the blend covers fixed costs. Value of converting escalation→internal:
~$4/order. Don't need a fleet — need coverage of PEAK windows (Fri-Sun dinner),
Uber mops up edges.

Open decisions:
- Variable (higher) delivery fee on escalated orders? Defensible ONLY if disclosed
  plainly at checkout before payment ("partner courier costs a bit more"). Product-
  values decision — route to Alex, don't default. Interacts with waiver.
- Escalation timeout (currently 3 min) is an economic parameter: longer when a
  courier is known on-shift, immediate when nobody is. Tune consciously.
- FORK: launch WITH real Uber escalation built (more pre-launch work, true
  resilience) vs. launch internal-only with tight advertised hours ("Thu-Sun
  5-9pm") and add Uber later (humbler, safer, ships sooner). Alex's call.

---

## 4. Kanata pilot simulation (honest)

[ASSUMED] 5-8 restaurants, 100 orders/mo, T=15%, 15% waiver, ~20 active CP earners
@ ~$8/mo emission, fixed ~$75/mo (Vercel Pro $20, Neon ~$19, Resend/Gemini/domain).

- Internal-only (E=0): net ~+$75/mo — roughly break-even (pays infra, not Alex).
- Realistic early (E=40%): net ~−$100/mo — small survivable loss.

Curve is what matters: 300-400 orders/mo with E~20% → ~$800-1,100/mo net.
1,000 orders/mo w/ 20% group-buy → ~$3,500-4,500/mo. DENSITY IS EVERYTHING.
Pilot success = loop proven + ratio health, NOT income.

---

## 5. Take-rate recommendation (PROVISIONAL — validate w/ merchant research)

- Floor ~12% (below = underwater with no buffer once waivers/CP/courier hit).
- Ceiling ~15-18% (above = still cheaper than Uber Eats 25-30% but pitch weakens).
- PROVISIONAL: 15% standard, 10-12% founding-partner rate locked for first cohort
  (honest acquisition spend: "early partners get our best rate, permanently").
- VALIDATE against what Kanata merchants actually pay now (marketing chat research).

---

## 6. TODAY'S BRAINSTORM DECISIONS

### 6a. Reduce CP faucet rate — LEANING YES
Reduce emission BUT rescale faucet AND sink prices together, proportionally, so the
earn-to-reward ratio (days-to-a-reward) is unchanged — user feels nothing, liability
halves. E.g. faucet 100/33/8 → 50/16/4 AND secret item 1000 → 500 CP.
- Keep CP→$ rate fixed at $0.01 (rescale quantities, not the rate).
- Directly shrinks Killer #1. Precedent: prior $0.01-basis rescale.
- Constraint: keep days-to-reward under ~3 weeks or earning feels hopeless.

### 6b. Partial (not full) delivery-fee waiver — LEANING YES (strong)
Switch from full-cancel to fixed CP-for-dollars discount (e.g. 250 CP = $2.50 off
the $4.99 fee). Half-waiver margin ~+$1.37 vs full-waiver ~−$1.12 at T=15%.
- Keeps the emotional reward, never sells an order at a loss.
- More honest/sustainable than "free delivery forever."
- Directly defuses Killer #2. Cheapest single margin improvement available.

### 6c. Partner paid visibility — YES IF HONEST (post-first-merchants)
Legitimate revenue line (it's most of how DoorDash/UberEats earn). LANDMINE: pay-to-
rank secretly = the extractive dark pattern the whole thesis opposes; skeptical
Kanata users would detect + resent.
- ALLOWED: clearly-LABELLED "Sponsored/Featured"; non-ranking placements (sponsor a
  Notes issue, profile spotlight, fund a group-buy). Test: "would a user feel
  deceived if they learned how it worked?"
- REFUSE: secret rank-boosting in default sort; paid dressed as organic.
- Thesis-POSITIVE framing possible: "even our ads are honest — you always know
  what's sponsored" becomes a differentiator.
- Timing: post-first-merchants (can't sell promotion to an empty platform).

### 6d. Civic sink ("Burn & Direct") for social actions — HIGH VALUE, POST-PILOT (counsel-gated)
BEST structural CP sink: burning CP is DEFLATIONARY — it removes liability from the
books. Turns the worst case (non-ordering reader accumulating liability) into a
neutral/positive outcome. Gives small CP balances meaning → keeps low-engagement
users reading. Attacks Killer #1 more directly than anything else.
- SAFE structure: user burns CP → platform's OWN real-dollar budget funds the
  outcome → CP destroyed. CP DIRECTS, never CONVERTS to money flowing to recipient.
- DANGEROUS: CP→dollars flowing to a third party = charitable-solicitation /
  money-transmission exposure (same reason cash-out crowdfunding was killed).
- Outcome categories (youth team vs. community garden vs. registered charity) sit in
  DIFFERENT regulatory boxes — needs counsel review.
- Correctly filed POST-PILOT: high value, but gated on legal groundwork, not
  engineering. Safe architecture already in docs/crowdfunding-burn-and-direct-design.md.

---

## 7. Net effect on pilot profitability

CP rescale (6a) shrinks Killer #1; partial waiver (6b) defuses Killer #2 — together
they attack two of three killers at ~zero cost to user experience, moving the
realistic −$100/mo pilot back toward break-even. Paid visibility (6c) is longer-term
upside. Civic sink (6d) is the permanent Killer-#1 fix, post-pilot + counsel.

## 8. Still to brainstorm
- Courier pay structure (per-delivery vs hourly vs peak-guarantee) — pure economics.
- Group-buy margin (the structurally-profitable track) — pure economics.
- [Alex has additional ideas to raise next.]

---

## 9. CP-for-goods / discount storefront — GOOD INSTINCT, wrong form; POST-PILOT

Idea (as raised): a storefront operated by us where members spend CP to buy items
at a discount, as a membership incentive.

CFO read: as described (WE operate the store) this is NOT an income source — it's a
second business. A CP discount funded by burning CP liability only profits if we're
earning a RETAIL margin big enough to cover the discount. That makes us a retailer
(sourcing, inventory, fulfilment, returns, unsold stock) on top of being a
marketplace — serious focus-dilution for a solo founder pre-launch. Advise against
the "operated by us" form.

BETTER FORM (same instinct, flipped): let our EXISTING local merchants offer
CP-discounts on THEIR goods. Member spends CP → discount at a real Kanata merchant →
merchant fronts or splits the discount in exchange for the traffic we drive.
- No new business for us (asset-light; merchants hold the goods).
- CP burn stays deflationary (attacks Killer #1, like the civic sink).
- REINFORCES the "keep money local" thesis instead of competing with it.
- Doubles as a merchant-acquisition pitch ("our members bring you traffic via CP
  deals").
- Can generate real income if merchants pay a small fee/commission to join the
  CP-deals program (a labelled, honest version of paid visibility) — no inventory
  required.

GUARDRAIL: keep CP a DISCOUNT layer (member pays the rest in real money), NOT a
full currency that buys goods outright at a published $ value. Discount = safe;
full-currency-for-goods edges back toward CP-is-money / regulatory territory (same
line as cash-out).

Timing: POST-PILOT — needs a merchant network to exist first (which the pilot
builds). File alongside civic sink as a post-pilot retention + revenue mechanic.
