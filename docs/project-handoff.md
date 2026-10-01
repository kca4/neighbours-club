# Neighbours Club — Project Handoff Document

Sep 30, 2026 · @Alex

## How to read this document

This is the source of truth for continuing Neighbours Club: it reconstructs the current state and the reasoning behind it, not a chronology.

**Status labels used throughout:**

| Label | Meaning |
| --- | --- |
| LIVE | Built and deployed at neighborsclub.ca |
| BUILT / HIDDEN | Built and deployed but not promoted, or gated off |
| COMMITTED / NOT DEPLOYED | Code committed in the repo, awaiting the next production deploy |
| PLANNED | Decided, not yet built |
| DEFERRED | Deliberately postponed (usually post-pilot) |
| EXPERIMENTAL | Being explored; not a commitment |
| ABANDONED | Considered and rejected |

**Decision strength:** *Final* (settled, don't reopen casually) · *Provisional* (working assumption pending real data) · *Unresolved* (open).

**Uncertainty:** anything not confirmed in the discussions is marked *(unconfirmed)*. Numbers marked *(assumption)* are modelling inputs, not measured facts. Where a later decision replaced an earlier one, the earlier one appears in the decision history or in section 18.

**Sources:** the founder's working conversations with Claude (build, economics, outreach, strategy), the project's saved notes, and the repo's `docs/` folder referenced below. The repo docs are the canonical technical record; this document summarizes them.

## 1. Neighbours Club overview

Neighbours Club (neighborsclub.ca) is a hyperlocal, bilingual (EN/FR) community-commerce platform piloting in Kanata, Ottawa, that lets neighbours buy together from local businesses, stay informed about their ward, and keep money circulating locally. It is the top-priority venture in the founder's Scitoxe portfolio (a solo, pre-revenue venture studio).

**What it is.** Four services under one membership: group-buy (launch focus), local delivery (built, deliberately on hold), Community Points (CP, a loyalty layer), and Ward Notes (hyperlocal civic information).

**Problem it addresses.**

- Local spending leaks out of the neighbourhood through distant platforms whose model depends on high merchant fees.
- Small local businesses struggle to reach nearby customers affordably.
- Residents lack one trustworthy place for what's happening in their ward.
- Neighbours have no easy way to coordinate purchases together for better prices.

**Target users.** Kanata residents (the founder characterizes them as tech-literate and skeptical of big platforms); independent local merchants and regional producers (farms, roasters, bakeries, meat producers); later, charities and local sponsors.

**Initial market.** Kanata, Ottawa — Ward 4 (Kanata North) and Ward 23 (Kanata South). The plan is to concentrate on one small area first (one or two postal-code prefixes such as K2K), then open other Ottawa wards one at a time.

**Core value proposition.**

- Members: buy together with neighbours, save as a group, know what's happening locally.
- Merchants: a low-effort extra channel with batched, pre-committed orders and a fair, low fee.
- Community: more of what's spent stays local.

**Long-term vision.** Ward-by-ward expansion across Ottawa, then Canada, possibly other countries; delivery added once a warm member base and operations exist; CP-based community impact once legally validated. The founder has also considered long-term acquirers (delivery incumbents, grocers, Shopify, loyalty/fintech) as a directional thought only — the stated principle is to build a business valuable on its own, not for a buyer.

**What makes it different.**

- **Honesty as the product.** The Engagement Pattern Standard bans fabricated scarcity, variable-ratio rewards, engineered anxiety and opaque CP value. It is a hard merge blocker in code.
- **Local economics by design.** Low merchant fees; batching makes low-volume orders viable.
- **Group coordination** that the big delivery apps don't offer.
- **Community information** (Ward Notes) as a reason to visit beyond transactions.

## 2. Product strategy and rationale

The defining decision is **group-buy first, delivery second**; most other decisions follow from it or from the honesty principle.

### 2.1 Group-buy first, delivery second — *Final (strategic direction)*

- **Decided:** Launch leading with group-buy; defer on-demand instant delivery until group-buy has built a warm, trusting member base.
- **Why:** An honest failure analysis found the biggest risks were operational overload for a solo founder, thin courier supply, and a cold start. Group-buy runs on a schedule (no dinner-rush chaos), needs far fewer courier hours per order, is profitable at lower volume, and recruits neighbours by design ("we need five more people for this deal"). Delivery then launches to existing members instead of cold against Uber Eats.
- **Alternatives considered:** launch instant delivery first (the original build plan); launch internal-courier-only delivery with limited hours; launch with Uber Direct escalation.
- **Trade-offs:** group-buy has its own (smaller) cold start; many suppliers already run their own CSA or subscription channels, so Neighbours Club must be additive; group-buy revenue is thinner and depends on density.
- **Earlier thinking:** the platform was first built as a delivery vertical; the pivot came after the delivery stack was built and verified.

### 2.2 Honesty as a hard constraint — *Final*

- **Decided:** The Engagement Pattern Standard is a merge blocker; all public claims must be literally true.
- **Why:** Ethical, and commercial: skeptical Kanata users would detect and leave over dark patterns; Competition Bureau enforcement creates legal exposure.
- **Examples in practice:** no pre-selected tip, no "Points earned!" when 0 CP was earned, "Members only" instead of "VIP", third-party ratings never shown (`REVIEWS_ENABLED = false`), "Reject" not "Delete" for a soft delete.

### 2.3 Lean MVP, extensible-but-not-elaborated backend — *Final*

- **Decided:** Keep doors open cheaply (nullable lat/lng, region tags, abstracted dispatch, extensible roles) but don't build multi-region partitioning, regional-manager RBAC or geofencing until there is a second region.
- **Alternative rejected:** "enterprise-ready backend from day one" — speculative abstractions cost runway and usually need rebuilding once real requirements appear.

### 2.4 Notes built only on openly licensed data — *Final*

- **Decided:** Drop commercial news RSS (CBC Ottawa, Ottawa Citizen); keep two OGL-licensed Open Ottawa feeds.
- **Why:** The binding constraint was contract (terms of service forbid automated ingestion), not copyright. Verbatim snippets would be worse. Open data is also more hyperlocal and produced fewer high-risk notes.

### 2.5 CP economy denominated at $0.01 per CP, then halved — *Final (values provisional)*

- **Decided:** 1 CP = $0.01, a disclosed rate. Later all faucets and sinks were halved together (÷2) so days-to-reward stayed the same while liability halved.
- **Why:** Legible value; less liability at no cost to user experience. Done before any real balances existed, so no migration was needed.

### 2.6 Partial delivery-fee waiver instead of full waiver — *Final*

- **Decided:** 250 CP = $2.50 off the $4.99 fee (customer pays $2.49).
- **Why:** A full waiver turned each order margin-negative (about −$1.12 at a 15% take rate); a partial waiver keeps it positive (about +$1.37) and is a sustainable promise.

### 2.7 Group-buy merchant fee — *Provisional*

- **Decided:** Percentage commission charged to the merchant; internal working rate \~10% standard, 7–8% founding partner; never stated publicly.
- **Why:** Scales fairly with batch size; lower than the single-order rate because batching lowers cost and suppliers need a reason beyond their existing channels.
- **Pending:** supplier calls may move the number.

### 2.8 Optional paid home delivery for group-buy — *Decided, not built*

- Pickup stays the default and cheapest; home delivery is a scheduled, clustered, flat-fee add-on for route-safe products. Full rules in section 4.

### 2.9 Organic-first marketing, awareness before asking — *Provisional strategy*

- **Decided:** Organic channels only for now (paid ads later, lightly). Phase 1 builds awareness with a soft "keep me posted" door; phase 2 asks people to vote on what to buy; vote results guide which suppliers to contact.
- **Pushback recorded:** awareness with nowhere to land leaks; YouTube is a weak local discovery channel — local Facebook groups, boards and newsletters reach Kanata better.

### 2.10 Operating structure and spending — *Unresolved*

- Sole proprietorship first vs. operating under a corporation from the start: undecided.
- Budget-constrained: free tools preferred; Vercel Pro upgrade postponed; Google Workspace reused under Scitoxe with `neighborsclub.ca` as an alias domain.

## 3. Current product architecture

The platform is live with all four verticals built; what differs is whether each is promoted, gated or deferred. Details for the big features follow in sections 4–8.

| Feature | Purpose | Target user | Status | Key rules / relationships |
| --- | --- | --- | --- | --- |
| Group-buy (deals, tiers, pledges) | Neighbours pool orders for tiered group prices | Members, suppliers | LIVE (no real deals yet) | Launch focus; Stripe manual capture; see §4 |
| Group-buy pickup point | Batched fulfilment to one local spot | Members | LIVE | Default and cheapest option; reminders, picked-up and no-show handling exist |
| Group-buy home delivery add-on | Deliver batch to members' doors | Members | PLANNED (decided, not built) | Paid, flat per-drop fee, limited radius, route-safe products only; see §4 |
| Group-buy vote | Members vote on what the first group buys should be | Residents | PLANNED (build prompt drafted) | Bilingual form, unticked consent boxes; results guide supplier outreach |
| Delivery (restaurant ordering) | Order from local restaurants, delivered | Members, restaurants | BUILT / HIDDEN | Deliberately on hold; preview-token gate; not to be advertised; see §8 |
| Kitchen dashboard | Restaurants receive and manage delivery orders | Restaurant owners | BUILT / HIDDEN | Part of delivery vertical |
| Courier app and dispatch | Internal couriers claim and deliver orders | Couriers | BUILT / HIDDEN | Internal-courier pilot; Uber escalation gated off |
| Community Points (CP) | Reward genuine participation; fund perks | Members | LIVE (rescale committed, not deployed) | Background feature in marketing; see §6 |
| Wallet and CP history | Show balance and ledger | Members | LIVE | Header badge refreshes after CP actions |
| Secret menu redemption | Spend CP on a members-only item | Members | BUILT (tied to delivery) | Label "Members only", not "VIP"; price 500 CP after rescale |
| Partial delivery-fee waiver | Spend 250 CP for $2.50 off delivery | Members | COMMITTED / NOT DEPLOYED | Replaced the full waiver |
| Ward Notes feed | Hyperlocal civic information | Residents | LIVE (2 licensed feeds) | Editorial firewall; verified-read CP; see §5 |
| Notes editorial firewall | Block risky AI summaries from publishing | Admin | LIVE | High-risk notes cannot be published; corrections and right of reply |
| Corrections / right of reply | Let named parties request corrections | Public, businesses | LIVE | Admin queue; retraction never claws back CP |
| Admin: economy (Φ) readout | Monitor CP inflation/solvency | Founder | LIVE | Measurement only; no automatic throttle |
| Member accounts and roles | Sign-up, sign-in, role gating | All | LIVE | Roles: member, restaurant owner, courier, admin |
| Merchant/supplier roster | Enrolled-but-inactive suppliers | Founder | LIVE (26 BIA records, `isActive:false`) | Never shown to members until a real deal exists |
| Delivery photos (proof of delivery) | Courier photo at drop-off | Couriers, members | COMMITTED / DEPLOYED CODE | Vercel Blob; public random-hash URLs for pilot |
| Referrals | Members bring neighbours | Members | EXPERIMENTAL (idea only) | Built-in loop via "bring your street in"; no reward programme decided |
| Gamification | Motivation to participate | Members | CONSTRAINED | Allowed only within the Engagement Pattern Standard; no streak anxiety, leaderboards discouraged |
| Sponsored Unlock (CP → charity) | Members donate CP; sponsor cash unlocks | Members, sponsors, charities | EXPERIMENTAL | Blocked on counsel; see §7 |
| Burn & Direct civic sink | CP burned to direct a pre-budgeted community outcome | Members | DEFERRED (post-pilot) | Needs counsel; see §7 |
| CP discount across local merchants | CP as a discount at partner shops | Members, merchants | DEFERRED (post-pilot) | CP stays a discount layer, never a full currency |
| Sponsored notes | Paid local-business notes in the feed | Businesses | PLANNED (design only) | Clearly labelled; never earn CP; needs ad-law review |
| Paid visibility for merchants | Featured placement | Merchants | DEFERRED | Only if clearly labelled; never secret rank-boosting |
| Cash-out CP crowdfunding | Convert CP to money for causes | — | ABANDONED | See §18 |

The verticals connect through CP: reading Notes and joining group-buys earn CP; waivers and redemptions spend it; the future community-impact sinks would burn it.

## 4. Group-buy model

Group-buy is built and working end to end in code, but no real deal has run yet: the first one waits on a supplier agreeing and enough member demand.

### 4.1 How it works today (built)

- **Deal creation:** the founder creates and publishes deals in the admin area (`/admin/deals`, with publish and cancel actions) and manages suppliers (`/admin/suppliers`). There is no supplier self-serve portal.
- **Pricing tiers:** each deal has `DealTier` rows — price tiers keyed by member-count thresholds, sorted by tier order. More participants → lower unit price. The final tier is chosen when the deal closes.
- **Member journey:** member joins a deal → a Stripe PaymentIntent authorizes the tier-1 (highest) price → the deal closes at its deadline → if the threshold is met, the card is captured at the final (lower) tier price → member collects at the pickup point.
- **Payment:** Stripe manual capture (authorize now, capture at close). Group-buy has its own webhook, `/api/stripe/webhook`, separate from delivery's `/api/webhooks/stripe`, each with its own signing secret.

### 4.2 Deal and order lifecycle

- **Deal:** DRAFT → OPEN → CLOSING\_SUCCESS or CLOSING\_FAILED → FULFILLING → COMPLETED, or CANCELLED.
- **Order:** PENDING\_AUTHORIZATION → AUTHORIZED → CAPTURED → PICKED\_UP, plus CAPTURE\_FAILED (with a recovery link), VOIDED, REFUNDED, NO\_SHOW.
- **Close-deals job** (daily cron): past-deadline OPEN deals are evaluated. Threshold met → capture each order and grant each participant the group-buy CP reward (165 CP after the rescale; 330 before). Threshold missed → void all authorizations; nobody is charged.
- **Idempotency:** a `closingProcessedAt` sentinel stops a deal being processed twice; each capture uses the order id as its Stripe idempotency key; CP grants are keyed on a reference id. Verified live: a failed deal (2 of 20 needed) voided correctly and a re-run processed nothing.
- **Other jobs:** stale PENDING\_AUTHORIZATION orders (>15 min) are voided daily; pickup reminders are emailed; admin can mark orders picked up or no-show.
- **Failed payments:** a failed capture sets CAPTURE\_FAILED and sends a recovery link (`/recover-payment/[token]`).

### 4.3 Revenue model (provisional)

- Merchant pays a percentage commission: working rate **\~10% standard, 7–8% founding partner**, never stated publicly. A minimum-fee floor for tiny batches may be added later.
- Members pay the product price with minimal or no extra fees at pickup.
- The platform absorbs Stripe processing (\~2.9% + $0.30 per charge) out of its commission.
- Profit comes from batching: one trip serves many households, so delivery cost per order falls sharply.

**Minimum profitable batch (working estimate, assumptions):** with a \~$40 delivery run and \~3% payment cost, 10% commission clears costs at a batch value of about **$500–600** (roughly 10–30 participants). Recompute with real costs.

```latex
\text{profit per batch} \approx (c \times V) - D - (s \times V) - O
```

Where c = commission rate, V = batch value, D = delivery cost, s = payment-processing rate, O = coordination overhead.

### 4.4 Optional home delivery (decided, not built)

- Pickup stays the default and cheapest option; home delivery is a paid upgrade, shown before payment, with neither option pre-selected.
- Flat per-drop fee known at checkout — no fee that changes with how many others choose delivery.
- Limited radius; route-safe categories only (coffee, bread, produce, chilled or frozen goods). **No hot food** — a 15-stop route takes 60–90 minutes.
- Fulfilled manually during the pilot (founder or one courier, scheduled window). No route software yet.
- Stays in the group-buy track; the fee must cover its own cost and doesn't change the merchant commission.
- Illustrative economics *(assumptions)*: \~$25–30/hour courier cost gives \~$2–2.50 per drop in a tight cluster (\~12 drops/hour) and \~$4–5 in a spread-out route (\~6/hour).

### 4.5 Launch trigger (provisional)

Run the first group buy when one product reaches the demand target in the first area (25 households suggested) **and** a supplier agrees. Open the next ward only after that first buy is delivered well.

### 4.6 Edge cases discussed

- Threshold missed → void, no charge (verified).
- Duplicate processing on retry → prevented by sentinel and idempotency keys (verified).
- Success branch (capture + CP vesting) is covered by unit tests; not run live locally because manual capture is hard to test locally.
- Member doesn't collect → NO\_SHOW (no-show policy for refunds not documented).
- Card declined at capture → CAPTURE\_FAILED + recovery link.

### 4.7 Outstanding questions

- Real merchant commission (supplier calls).
- Whether the CP waiver can reduce the home-delivery fee.
- Who hosts and staffs the pickup point; pickup windows.
- How long a deal can stay open relative to how long a card authorization remains valid *(not discussed — check Stripe's limits)*.
- No-show refund policy.
- Which product categories actually batch well in Kanata (validation).

## 5. Ward Notes strategy

Ward Notes gives residents a daily reason to visit — what's happening in their ward — and is the main way members earn CP; it runs today on two openly licensed City of Ottawa feeds behind an editorial firewall.

### 5.1 Purpose

- **Acquisition:** useful local information draws people before they have anything to buy.
- **Retention:** a reason to return between group buys.
- **Economy:** the verified-read CP faucet.
- **Trust:** accurate, attributed, correctable civic information reinforces the honest brand.

### 5.2 Content and sources

- **Live sources (OGL-licensed):** Open Ottawa road events and development applications. Items are filtered for Kanata relevance by keywords.
- **Dropped:** CBC Ottawa and Ottawa Citizen RSS — their terms prohibit automated ingestion (see §18).
- **Deferred enrichment:** OC Transpo alerts (needs API key and a new adapter; Kanata routes), Ontario Hwy 417 events (needs a feasibility check).
- **Planned direct sources:** ward councillors, community associations, the BIA — asked by email for information and permission; they generally want their news amplified.
- **Content types (design):** Civic, Traffic, Community, Local Business, Sponsored — each marked by icon, text label, colour and fixed position so none depends on colour alone.

### 5.3 AI pipeline and editorial firewall (built)

- Raw items are summarized by an AI model (Gemini) into notes, written transformatively with source attribution.
- Each note gets a risk score from 0 to 10. At or above the threshold (5), it is blocked and routed to a visible admin queue; it cannot be published during the pilot.
- **Pilot scope:** publish only neutral or positive content and content about businesses that consented. No allegations about named businesses until a full framework and legal review exist.
- Admin approval is the single publishing gate; a sourced note without an attributed publisher cannot be approved.
- **Corrections:** a public request form, an admin corrections queue, a public right-of-reply field, manual provisional unpublishing, and retraction with a version snapshot. Rejection is a soft delete.
- **No clawback:** retracting a note never takes back CP a reader earned in good faith (structurally enforced; verified live).

### 5.4 Progressive disclosure: Bite / Snack / Meal (design, not confirmed built)

- **Bite** (card in feed): headline up to 70 characters, takeaway up to 120.
- **Snack** (expands in place): up to 600 characters.
- **Meal** (separate page with its own URL): full summary, the official source link above the fold, map, timeline (announced → effective → ended), update history, related notes, ward councillor contact.
- The design limited the feed to two levels (Bite and Snack) and moved Meal to its own page, citing usability research on two-level disclosure.
- A per-note metadata schema was proposed (type, ward, language, effective dates, status upcoming/active/ended, location, source, sponsor, CP eligibility, word counts, update log).

### 5.5 CP for reading

- **Built:** a "verify you read this" action on each published note earns CP on a daily diminishing curve, currently **50 / 16 / 4 / 4 / 4 / 0** (after the halving), capped at 92 CP per day of reading, resetting at midnight Toronto time. Re-verifying the same note pays nothing.
- **Design recommendations (not confirmed built):** CP earned once per note at the Snack level, none extra for the Meal; each card shows the next slot's value, not a per-note price; a five-step header meter in absolute CP values; no "0 CP" badge; multi-signal reading checks (Snack opened, visible on screen, an engaged-time threshold based on reading speed, scroll depth, server-signed claim tickets, rate limits, anomaly flags).
- **Contradiction to resolve:** the Ward Notes design work used a curve of 100/80/60/10/10 (260 CP/day) as an input. The implemented and committed curve is 50/16/4/4/4 (78 CP/day). The committed curve is the current one unless deliberately changed.

### 5.6 Sponsored and local-business content

- Sponsored notes are clearly labelled ("Sponsored · \[Business\]" / "Commandité · \[Entreprise\]"), in the note's language, and never earn CP.
- Editorial coverage of local commerce is kept separate from paid content.
- The sponsored-note template needs review by a Canadian advertising lawyer, especially around the October 2026 municipal election.
- Status: planned, not built.

### 5.7 Distribution and freshness

- Notes are ingested daily; a daily email digest goes to confirmed subscribers (double opt-in, CASL-compliant).
- Ended or expired notes are not CP-eligible (design).
- Marketing plans a weekly "This week in \[area\]" social post from Notes — first confirm the data licences allow reposting on social media.

## 6. Community Points (CP)

CP is a loyalty currency worth a disclosed $0.01 per point, earned by genuine participation and spent on small perks; every CP issued is a real-dollar liability, so the economy is capped, measured and deliberately kept in the background of marketing.

### 6.1 Why CP exists

- Reward real participation (reading local news, joining group buys) rather than engineered engagement.
- Give members a reason to return and a sense of shared benefit.
- It is customer-acquisition and retention spending, not free: it must stay coupled to commerce.

### 6.2 Agreed values (committed; production values updated at next deploy)

| Parameter | Current (after ÷2) | Before halving | Where set |
| --- | --- | --- | --- |
| CP → dollar rate | 1 CP = $0.01 | same | EconParam `cp_to_dollar_rate` = 1 |
| Verified read: 1st / 2nd / 3rd–5th / 6th+ | 50 / 16 / 4 / 0 | 100 / 33 / 8 / 0 | EconParam |
| Daily reading cap | 92 | 185 | EconParam |
| Daily total earn cap | 325 | 650 | EconParam |
| Weekly total earn cap | 1,300 | 2,600 | EconParam |
| Group-buy reward per participant | 165 | 330 | Code constant (`lib/cp/rewards.ts`) |
| Partial delivery-fee waiver | 250 CP = $2.50 off | 500 CP = full $4.99 | Code (`lib/delivery/fees.ts`) |
| Secret menu item | 500 | 1,000 | Menu item data |

All caps reset on America/Toronto calendar days and weeks. An earlier rescale (to the $0.01 rate) divided the original values by three; the later halving kept the earn-to-reward ratio identical so members notice nothing.

### 6.3 How the economy works (built)

- **Ledger:** a single-entry signed ledger. A uniqueness rule on (wallet, reference, reason) makes every grant and burn idempotent — proven live on the fee waiver, secret menu, reading reward and group-buy close.
- **Spending order:** a fee-waiver burn happens only after payment settles.
- **Configuration:** tunable values live in an EconParam table with in-code fallbacks; a production seed script refuses to overwrite hand-tuned values.
- **Monitoring:** Φ = CP issued ÷ CP burned over a window. The admin economy page shows a structural Φ (excluding admin test grants) and a raw Φ. Target band 0.9–1.1; alarm at 1.15. **Measurement only — no automatic throttle.**
- **Reserved, unused reasons:** signup bonus, tier bridge, donation — defined but nothing issues them.

### 6.4 Spending CP today

- Partial delivery-fee waiver (delivery vertical, on hold).
- Secret menu item (delivery vertical, on hold).
- So during a group-buy-only launch, CP currently has **no live sink** for members *(implication of current state — worth deciding)*.

### 6.5 Anti-abuse and honesty rules

- Daily and weekly caps; one reward per note; no reward for re-verifying.
- Retraction of a note never claws back earned CP.
- Honest feedback: the header badge refreshes after every CP action; the reading toast distinguishes "You earned X CP", "You've reached today's reading limit", and "Already credited".
- CP is a discount layer, never a currency that buys goods outright or converts to cash.
- No streaks, countdowns, loss-aversion mechanics or opaque values (Engagement Pattern Standard).

### 6.6 Economic considerations

- CP issued without matching orders is the top pilot profit risk. Suggested red line: roughly 300–400 CP issued per completed order (\~$3–4 acquisition cost per order).
- Account for CP liability when it is issued; treat a waiver as foregone revenue, not a second cost.
- The waiver must not stack freely onto costly orders (e.g., Uber-escalated delivery) — instrument it.

### 6.7 Explored, not agreed

- Paying CP for group-buy home delivery fees.
- CP donations to charity campaigns (Sponsored Unlock) and Burn & Direct (see §7).
- CP discounts at partner merchants (post-pilot).
- An automatic Φ throttle and weighting rewards by commerce (deferred post-pilot).

### 6.8 Unresolved

- A live CP sink for the group-buy-only launch.
- The reading-curve contradiction with the Ward Notes design (§5.5).
- Whether the group-buy reward should move from a code constant into EconParam.
- Run the one-time production SQL for the halving on the next deploy, and update prisma/seed-econ.ts, which still holds the pre-halving values.

## 7. Community Impact

Community impact is central to the mission but nothing is live: two designs exist, both built so CP *directs* real money the platform or a sponsor provides and never *converts* into cash, and both need legal review before launch.

### 7.1 Principle (agreed)

- CP may be **burned** to trigger a community outcome; CP never turns into money flowing to a person or third party.
- Burning CP removes liability from the books, so community sinks strengthen the economy rather than drain it.
- The platform or sponsor pays the outcome from its own budget, separately from the burned CP.

### 7.2 Burn & Direct — *Deferred, post-pilot (design documented)*

- Curated local campaigns with a known real-dollar cost (examples discussed: block party, bulk merchant discount, youth sports sponsorship, garden clean-up).
- Members pledge CP into escrow. Goal reached → CP burned, platform budget funds the outcome. Goal missed → CP refunded.
- Four open questions recorded: escrow must follow the group-buy settlement pattern (idempotent, atomic holds); the real-dollar budget must stay separate from the CP burn; refunds must not count as new CP issued or against earn caps; outcome categories need counsel review.
- Design record: `docs/crowdfunding-burn-and-direct-design.md`.

### 7.3 Sponsored Unlock — *Experimental*

- **Mechanic:** charities post specific micro-needs (e.g., "$500 for a food bank refrigerator"); a local business pledges the cash; members donate CP; when the CP target is reached (example: 50,000 CP), the sponsor's cash goes to the charity.
- **Concerns raised:**
  - *Honesty:* if the sponsor pays anyway, "your CP unlocked this" may not be truthful — a real goal-miss policy is needed (rollover, return to sponsor, partial release, sponsor top-up).
  - *Economics:* 50,000 CP × $0.01 = $500, i.e. a 1:1 peg — whether to peg is a design decision; donations compete with the fee-waiver sink; target sizing depends on member count and the reading curve.
  - *Rules:* no variable-ratio rewards, fake urgency or status anxiety; collective milestones preferred over individual leaderboards.
  - *Sponsor value:* only metrics verifiable from platform data; no ROI promises.
- A research prompt with these constraints was drafted and accepted; results are not captured here *(unconfirmed)*.

### 7.4 Requires validation before any launch

- **Legal:** charitable solicitation; charitable receipting vs. sponsorship advantage; Competition Bureau (truthfulness of "unlock" claims); advertising rules.
- **Tax/accounting:** how sponsor funds and CP burns are recorded.
- **Product:** goal-miss policy, target sizing, charity vetting pipeline.
- **Marketing rule:** never claim present-tense charity or giving until a model is operating.

## 8. Delivery

Delivery is built, tested end to end and deployed, but deliberately on hold: it is part of the long-term vision and returns after group-buy has established members, merchants and operations. Do not advertise it.

### 8.1 What exists (built)

- Restaurant pages with categorized menus, search and filters; three demo restaurants (Windbell Sushi, Tomaso Grilled Pizza, Pho K Fusion) behind a preview token (`?preview=DELIVERY_PREVIEW_TOKEN`). The Windbell menu conversion (187 items, 15 categories) was in progress *(status unconfirmed)*.
- Cart (survives page reloads; asks before switching restaurants), checkout with Stripe (automatic capture), order confirmation and status tracking (polling, no map).
- Kitchen dashboard for restaurant owners; courier app with an open feed (first to claim), pickup, drop-off photo (Vercel Blob) and delivered states.
- Fees: $4.99 delivery fee, 10% service fee, HST, optional tip. Tip has no pre-selected default and a visible "No tip" option.
- Dispatch job every minute (requires Vercel Pro — currently unscheduled on Hobby).

### 8.2 Uber Direct / Trexity fallback

- Unclaimed orders can escalate to a third-party courier. This is a stub, gated behind `ENABLE_UBER_ESCALATION` (default off).
- Researched: Uber Direct available in Canada (CA$6.99 floor, no monthly fees); Trexity (Ottawa-based) as a second fallback.
- **Economics:** at \~$12 per Uber delivery an escalated order is roughly break-even (−$0.13) versus \~+$3.87 internally (15% take rate, $35 order). Escalation is a reliability valve, not a fulfilment strategy; keep it well under \~40% of orders.

### 8.3 Why deferred

- Solo operational load (dinner rush, cold food, courier no-shows, complaints).
- Thin courier supply drives escalation, which turns orders loss-making.
- Needs density that the pilot doesn't yet have.

### 8.4 Ideas kept for later

- Scheduled delivery windows rather than instant delivery (the model the economics favour).
- Group-buy home delivery (§4.4) as the bridge into delivery.
- Internal-courier-only launch with advertised hours (e.g., Thu–Sun 5–9 pm) as an alternative to building Uber integration.
- Schedule-aware escalation timeout.
- Honest, disclosed higher fee when a partner courier is used (a values decision, not agreed).
- Courier coverage of peak windows rather than a full fleet.

### 8.5 Open questions

- Courier classification (employee vs. contractor) and pay under Ontario's Digital Platform Workers' Rights Act — a compliance obligation, not a marketing point.
- Single-order take rate (provisional 15% standard / 10–12% founding) — separate track from group-buy.

## 9. Merchant/supplier strategy

No merchant or supplier is signed yet; the outreach kit is complete and email outreach is about to start, with the supplier phone call — especially whether suppliers will share margin — as the real validation step.

### 9.1 Two prospect pools

- **Kanata Central BIA:** 26 food and beverage businesses loaded as inactive records (`isActive: false`); a verification worksheet narrowed them to \~13 viable independents after removing chains. Google Places data was used only for that worksheet, not stored or displayed (Google terms).
- **Regional producers (\~18 leads, found by web search — verify before contacting):**
  - *Produce/CSA (seasonal):* Heartbeet Farm (already runs a CSA pickup in Kanata North), BeetBox Co-op Farm, Ottawa Farm Fresh, Mike's Garden Harvest, Agricola Farm.
  - *Coffee roasters:* Happy Goat Coffee (has a wholesale programme), North Brew Coffee, Little Victories, Good Oswald, September Coffee.
  - *Bakeries:* Your Bread Box (wholesale), Nat's Bread Company (wholesale), SuzyQ Doughnuts, Atome Bakery.
  - *Meat:* Ottawa Valley Meats, Bearbrook Game Meats (already groups orders by location), Wiser Meats, Totally Natural Beef, Farm 2 Fork.
- Full list and emails: `docs/supplier-outreach-list-and-email.md` *(drafted, not yet committed to the repo)*.

### 9.2 Who fits (agreed criteria)

- Product batches well; supplier wants guaranteed volume; can fulfil on a schedule; desirable enough for neighbours to coordinate; can deliver one batch to a Kanata pickup point.
- Strongest signal: already selling direct-to-consumer or by subscription.
- Tier 1: farms, meat producers, coffee roasters, bakeries. Roasters, wholesale bakeries and meat aggregators look the best fit (year-round, already seeking channels); farms with their own Kanata CSA may see Neighbours Club as redundant — their reaction is useful data.
- **Supply can be regional; demand stays Kanata-local.**

### 9.3 Value proposition

- Additive, not a replacement: "bring you more Kanata customers, delivered as one batch to one pickup point, without you doing the coordination."
- For restaurants: "not another delivery app to compete with" — pre-ordered batches on slow nights.
- A low-effort extra channel they switch on when timing suits them (a slow week, surplus, a new product).

### 9.4 Enrolment programme (agreed, run as a process)

- Stages: Emailed → Enrolled (on the internal roster) → Active (running a real deal).
- Enrolled suppliers are **never shown to members** until they have a real deal.
- Light nurture check-ins keep enrolled suppliers warm.
- Tracked in a Google Sheet (business, type, location, contact, status, dates, next action, interest, what they'd offer, price/margin signal, notes). A CRM or supplier portal only when the sheet stops coping.

### 9.5 Outreach method

- Email to earn the phone call; the call is where validation happens.
- Four templates: enrolment (neutral), enrolment (restaurant), deal/additive-value, nurture check-in. Company framing ("Alex, from Neighbours Club"), "we" not "I", one personalized line per business.
- Call questions: which apps they use and what those take (directional only), whether that works for them, whether a lower fee matters, yes/no conditions, busy and slow times, weekly volume, and — the key revenue question — whether they would share margin for new batch volume and how much.
- Planned cadence: about five supplier emails a week, with phone follow-ups.
- In-person visits with a printed leave-behind for local businesses.

### 9.6 Sending setup

- Google Workspace under the Scitoxe domain, with `neighborsclub.ca` as an alias domain (cost-saving; a separate workspace later).
- MX and SPF on the root are set; Resend's records on the `send` subdomain were left untouched (no conflict). DKIM was pending propagation at last check.
- `alex@neighborsclub.ca` could not be created as an alias; existing aliases (`info@`, `sales@`) are used with display name "Alex". Parked as good enough.

### 9.7 Rules

- Never quote a fee or a launch date; never compare with competitors' commissions.
- Never promote Neighbours Club during the founder's Uber delivery shifts (terms of service, trust, brand).

### 9.8 Merchant tools

- Kitchen dashboard exists for delivery restaurants. No supplier dashboard or self-serve portal; build only once manual handling hurts.

## 10. Member acquisition and launch strategy

Acquisition is organic-only and phased: get known in one small Kanata area, collect votes on what to buy, then run the first group buy there before opening the next ward.

### 10.1 Phases (provisional)

1. **Awareness** — be known, with a soft "keep me posted" option on everything so curious people don't leak away.
2. **Vote** — residents choose what the first group buys should be (email, area, top three products, "just keep me posted" box). Vote results guide supplier outreach.
3. **First group buy** — when one product hits the target (25 households suggested) in the first area and a supplier agrees.
4. **Next ward** — only after the first buy is delivered well; that delivery becomes the first true proof story.

### 10.2 Geography

- Concentrate on one or two postal-code prefixes in Kanata (e.g., K2K) for flyers and group posts; content can reach all of Ottawa.
- Expansion is ward by ward across Ottawa.

### 10.3 Channels

- Local Facebook groups, Nextdoor, r/ottawa — posting as a neighbour asking a real question, after reading each group's rules.
- Physical boards: libraries, community centres, cafés, grocery stores, school areas.
- Community associations, ward councillors, the BIA; local news ("resident builds something for the neighbourhood").
- Same handle on YouTube, Instagram, Facebook and TikTok. YouTube is the video library, not the discovery channel.

### 10.4 Assets

- **Flyers:** resident version ("Buy together. Save together.") with a QR code to the vote; business version ("Guaranteed orders. No app to compete with."). Print 30–50, place at about 10 spots. Design with an image generator, add text separately (Canva).
- **Videos:** first piece "Room to Breathe" — about 50 seconds, vertical, AI-animated, founder's own voiceover, EN and FR. Rotating series: How it works, Meet local shops (written permission only), The Vote. Fictional characters unless a real shop agrees in writing.
- **Weekly rhythm (\~4 hours):** Monday Notes post, Wednesday video, Friday vote share and replies, weekly supplier emails, Sunday numbers review.

### 10.5 Referrals and trust

- Referral is built into group-buy: more neighbours means a better price. Confirmation messages: "Bring your street in." No referral rewards programme has been decided.
- Trust comes from literal honesty, local presence and a well-delivered first buy — not from claimed scale.

### 10.6 Tracking

Three weekly numbers: followers, vote sign-ups by area, supplier replies.

### 10.7 Messaging rules

- Core message: "Buy together with your neighbours — keep the money in our community."
- The villain is the fee model, never drivers or named companies.
- Lead with group-buy; don't promote delivery; keep CP in the background.
- No launch date, no scale claims, no present-tense charity claims.

### 10.8 Cold start

Merchants act as distribution; saturate one small area before spreading; group-buy's "we need more neighbours" mechanic recruits by design. Awareness should stay slightly behind supplier readiness so ads don't send people to a platform with no live deals.

## 11. Business model

The current model is a merchant commission on group-buy batches plus a cost-covering home-delivery fee; everything else is future. Single orders and group-buy are separate economic tracks and must never be blended in analysis.

### 11.1 Current planned revenue

| Stream | Who pays | Level | Status |
| --- | --- | --- | --- |
| Group-buy commission | Merchant | \~10% standard, 7–8% founding partner | Provisional (validate on calls) |
| Group-buy home-delivery fee | Member (optional) | Flat per drop, priced to cover its cost | Decided, not built |

### 11.2 Future revenue (not current)

| Stream | Level discussed | Status |
| --- | --- | --- |
| Single-order delivery commission | 15% standard, 10–12% founding partner | Provisional; vertical on hold |
| Delivery fee + service fee (single orders) | $4.99 + 10% | Built; on hold |
| Labelled sponsored notes | — | Planned; needs ad-law review |
| Labelled paid visibility for merchants | — | Deferred; honest labelling required |
| Merchant fee to join a CP-discount programme | — | Deferred post-pilot |

Sponsor pledges in Sponsored Unlock are charity funds, not platform revenue.

### 11.3 Single-order unit economics (delivery track, assumptions)

Assumptions: $35 food order, $8 courier pay, $5 tip passed through, $4.99 delivery fee, 10% service fee, Stripe \~2.9% + $0.30 on the full charge.

```latex
\text{margin per order} \approx T \times 35 - 1.38
```

Where T is the take rate. Mechanical break-even is about **4%**; at 15% the margin is about $3.87. Three pilot profit risks: CP issued without orders, full fee waivers, and courier cost at low density (plus Uber escalation). A 100-orders/month simulation came out near break-even to about −$100/month; 300–400 orders/month with low escalation gave roughly $800–1,100/month. All figures are modelling, not results.

### 11.4 Group-buy economics

See §4.3: profit comes from batching; working minimum batch \~$500–600 at 10%.

### 11.5 Fixed costs (approximate)

Vercel Pro about $20/month (needed for the dispatch job and six crons), a Neon paid tier (about $19–69/month, only if cold starts become a problem), plus email, AI and domain costs. Vercel Pro is postponed for budget reasons.

### 11.6 Excluded models

Advertising unrelated to local commerce, selling user data, CP cash-out, and operating our own store — see §18.

## 12. UX/UI and brand

The brand is "the honest local option": warm, calm, community-minded, and literally truthful in every interface message.

### 12.1 Positioning and messaging

- Tagline in use: "Your neighbourhood, working together."
- Core message: "Buy together with your neighbours — keep the money in our community."
- Contrast with big platforms only by implication, through our own design claims (see §18 and the claim rules in §21).

### 12.2 Visual identity

| Element | Value |
| --- | --- |
| Primary colour | Teal #0F766E |
| Accent | Amber #F59E0B |
| Background | Off-white #FAF8F3 |
| Fonts | Fraunces (headings) + Inter Tight (body) |

- Teal/amber carries meaning: teal = single orders, amber = group-buy. Changing colours must keep that distinction.
- A blue primary was previewed and reverted: teal reads as calmer and less like generic startup branding.
- Domain `neighborsclub.ca` (no "u") vs. brand "Neighbours Club" — accepted consciously. Buying the other spelling as a redirect was suggested as cheap insurance.

### 12.3 Language

- Bilingual EN/FR. "Neighbours Club" stays untranslated. French terms for "Community Points" and "Group Buy" still need to be locked.
- Disclosures (e.g., "Sponsored") appear in the language of the content.

### 12.4 Established UX rules (Engagement Pattern Standard checklist)

- No pre-selected tip; a visible "No tip" option; total shows zero tip until chosen.
- Third-party ratings never displayed as ours (`REVIEWS_ENABLED = false`).
- "Members only", not "VIP"; neutral styling instead of status gradients.
- "Most ordered" style signals only from real data *(the exact current state of this item is unconfirmed)*.
- Honest CP messages (earned / limit reached / already credited); header CP badge refreshes after every CP action.
- Partial waiver shown honestly: $4.99 struck through → $2.49 with "−$2.50 CP".
- Button labels match behaviour ("Reject" for a soft delete).
- Cart survives reloads and asks before switching restaurants.
- Sponsored content always labelled; no hidden paid ranking.
- Social proof only from real numbers; collective milestones preferred over individual leaderboards; no fake counters or countdowns.

### 12.5 Mobile and accessibility

- Mobile-first; Ward Notes cards designed for WCAG contrast, meaning never carried by colour alone, and reduced-motion alternatives.

### 12.6 Open UX items (low priority)

- Secret-menu placement (currently below the full menu).
- A persistent header cart indicator.
- *"Order Food" is visible in production navigation (desktop and mobile) while delivery is on hold; the restaurants themselves stay behind the preview token. Decide whether to hide the link*.

## 13. Technical architecture

A Next.js app on Vercel with a Neon Postgres database, deployed and current as of the July CLI deploy; the canonical technical record is the repo's `docs/` folder (especially `architecture-baseline.md` and `deploy-notes.md`).

### 13.1 Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript strict | Tailwind CSS v4, lucide-react icons |
| Data fetching | TanStack Query (polling) | WebSockets possible later; none now |
| Database | Neon PostgreSQL 17 via Prisma 5.22 | Project `neighbours-club`, us-east-2, endpoint `ep-muddy-salad` |
| Auth | Auth.js v5 | Roles: member, restaurant owner, courier, admin |
| Payments | Stripe | Manual capture (group-buy), automatic capture (delivery) |
| Email | Resend (transactional, `send` subdomain); Google Workspace (founder mail) | Domain `neighborsclub.ca` |
| AI | Gemini | Notes summarization |
| Files | Vercel Blob | Delivery photos |
| Hosting | Vercel, project `neighbours-club-gxes` (Hobby plan) | Owns `neighborsclub.ca` |
| Repo | GitHub `kca4/neighbours-club` | Local dev on native Windows PostgreSQL |

### 13.2 Deliberately absent

No PostGIS, GPS tracking, WebSockets/SSE or map rendering (couriers deep-link to their own maps app); no Docker; no Stripe Connect (merchants settled manually during the pilot); Uber Direct is a stub. Door-open principle: nullable lat/lng and region tags are acceptable; region partitioning and regional-manager roles are not built.

### 13.3 Key data models

`User`, `DeliveryDriver`, `Restaurant`, `MenuItem`, `DeliveryOrder`; `Deal`, `DealTier`, `Order`, `Supplier`; `RawIntel`, `ProcessedNote`, `NoteCorrection`, `NoteVersion`, `Subscriber`, `SavedNote`, `NoteReaction`; `BusinessProfile`, `BusinessSubmission`, `PartnerApplication`; `Wallet`, `WalletLedger`, `EconParam`; `Neighbourhood`, `NeighbourhoodWaitlist`, `AuditLog`, `PasswordResetToken`. Money is stored as Decimal(10,2) dollars.

### 13.4 Payments

- Two webhook routes: `/api/stripe/webhook` (group-buy) and `/api/webhooks/stripe` (delivery). Each reads its own signing secret (`STRIPE_WEBHOOK_SECRET_GROUPBUY`, `STRIPE_WEBHOOK_SECRET_DELIVERY`), falling back to the shared one for local development.
- **Never tested with a real live payment.** Stripe live mode is not activated. Checklist: `docs/stripe-webhook-setup.md`.

### 13.5 Scheduled jobs

| Job | Schedule (UTC) | Running now? |
| --- | --- | --- |
| Dispatch sweep | every minute | No (Hobby limit) |
| Close deals | 04:00 daily | Yes |
| Clean up pending orders | 05:00 daily | Yes |
| Pickup reminders | 13:00 daily | No |
| Ingest notes | 10:00 daily | No |
| Daily digest | 11:00 daily | No |

Vercel Hobby allows only two daily jobs. The full set is saved as `vercel.json.pro-full` and returns with the Pro upgrade.

### 13.6 Deployment

- GitHub push-to-deploy does **not** trigger builds (root cause not fully diagnosed; the Hobby cron rejection may have been masking it). Deploys run from the CLI with `vercel --prod`; a deploy hook also exists.
- Production was stuck on a May 31 build for about six weeks until the July CLI deploy.
- Migrations use the **direct** (non-pooled) Neon URL; runtime should switch to the pooled URL with `connect_timeout=15` at the Pro deploy.
- Neon's free tier suspends after about 5 minutes idle, so a first visitor can see a 500; the per-minute job on Pro keeps it warm.
- Pending on next deploy: run `scripts/one-time/rescale-cp-2026-08.sql` against production.

### 13.7 Security and privacy

- Admin routes gated by role (non-admins redirected); dev-only routes return 403/404 in production; cron routes require `CRON_SECRET`.
- Secrets go only into Vercel's environment settings, never into chats.
- Delivery photos use public random-hash URLs for the pilot; access hardening and a retention policy are post-pilot tasks.
- Image domains allow any host (`remotePatterns: **`) — tighten before promotion.
- Newsletter consent follows CASL (double opt-in, unsubscribe tokens).

### 13.8 Important technical decisions

- A single-entry signed CP ledger with idempotency keys, not double-entry.
- Dispatch logic abstracted behind injected dependencies, so internal dispatch can be swapped for smarter dispatch without UI changes.
- Uber escalation gated off by default (it was auto-escalating after 3 minutes — a launch blocker, fixed).
- Delivery photos moved from base64 in the database to Vercel Blob.
- Engagement Pattern Standard enforced as a checklist in `CLAUDE.md`.
- Considered for later: QStash or Inngest for durable jobs.

### 13.9 Problems encountered (lessons)

- A package added without updating the lock file broke production builds (June 2).
- Uncommitted work once left the repo's HEAD broken; lesson: check `git status` and the log after every session.
- Local Windows PostgreSQL stops after sleep (P1001 errors); local Stripe webhooks unreliable, so a dev settle endpoint is used locally.
- Two duplicate projects (Vercel and Neon) caused near-mistakes; both deleted.

### 13.10 Working method

The founder works with Claude Code in a separate session: Explore → Plan (approved before coding) → Implement → Commit, one logical task per commit, consequential decisions routed to the founder.

## 14. Current status snapshot

The platform is live and technically ready for a small pilot, but it has no signed supplier, no real group buy yet, Stripe is not in live mode, and four of six scheduled jobs are off until Vercel Pro.

| Area | State |
| --- | --- |
| **Built / live** | Site on neighborsclub.ca; group-buy engine (deals, tiers, manual capture, close job, CP reward); Ward Notes on two licensed feeds with editorial firewall and corrections; CP wallet and reading rewards; admin (deals, suppliers, notes, corrections, submissions, economy Φ); accounts and roles; newsletter sign-up with CASL consent; production database migrated and seeded |
| **Built / hidden or deferred** | Restaurant ordering, kitchen dashboard, courier app, dispatch (job not scheduled), secret menu, fee waiver, Uber escalation stub; three demo restaurants behind a preview token |
| **Committed, needs a production step** | CP halving and partial waiver (commit b552798): its code was very likely included in the later CLI deploy, but the production EconParam rows keep the old values until `rescale-cp-2026-08.sql` runs — **verify and run** |
| **In progress** | Group-buy vote page (Claude Code prompt drafted); "Room to Breathe" video; founder email setup (DKIM pending); supplier outreach about to start |
| **Planned** | Vercel Pro + six jobs + pooled DB URL; Stripe live mode + real-payment webhook test; group-buy home delivery add-on; flyers; sponsored notes |
| **Not started** | Stripe Connect payouts; supplier portal; referral rewards; OC Transpo feed; French terms for CP and Group Buy; marketing-engine knowledge base |
| **Needs validation** | Kanata demand for group-buy; which products batch well; supplier willingness to share margin; the fee level; minimum batch size; pickup-point practicality; whether CP motivates |

## 15. Decisions register

Most important decisions, newest-relevant first within each theme.

| Decision | Rationale | Status | Stage / date | Revisit when |
| --- | --- | --- | --- | --- |
| Launch group-buy first; defer instant delivery | Lower solo ops load, viable at low density, recruits neighbours by design | Final | Aug 2026 | First group buys delivered; transition trigger met |
| Group-buy merchant fee: % commission, \~10% / 7–8% founding, internal only | Scales with batch size; batching lowers cost; suppliers need an additive reason | Provisional | Sep 2026 | After supplier calls |
| Optional paid home delivery for group-buy (pickup default) | Removes pickup friction; clustered scheduled routes are efficient | Decided, not built | Sep 2026 | When building; after first pickup buys |
| Platform absorbs Stripe fees on group-buy | Simpler, more honest-feeling pricing | Provisional | Sep 2026 | With real margin data |
| CP halved (faucets and sinks ÷2), rate stays $0.01 | Halves liability, same experience; no real balances yet | Final (values tunable) | Aug 2026 | Φ or engagement data |
| Partial fee waiver: 250 CP = $2.50 off | Full waiver made orders loss-making | Final | Aug 2026 | When delivery resumes |
| 1 CP = $0.01 disclosed rate | Legible value | Final | Jun 2026 | Do not change without member disclosure |
| Φ measured, no automatic throttle | Premature to automate on test data | Final for pilot | Jun 2026 | Post-pilot with real data |
| Notes on OGL civic data only; commercial news dropped | Terms of service forbid ingestion | Final | Jun 2026 | Only with written publisher permission + counsel |
| High-risk notes cannot publish; no allegations about named businesses | Defamation risk; no framework yet | Final for pilot | Jun 2026 | Full editorial framework + counsel |
| Retraction never claws back CP | Readers acted in good faith | Final | Jun 2026 | — |
| Engagement Pattern Standard as merge blocker | Ethics + skeptical users + Competition Bureau | Final | Early 2026 | — |
| No pre-selected tip; "Members only" not "VIP"; no third-party ratings | Instances of the standard | Final | Aug 2026 | — |
| Uber escalation gated off by default | Auto-escalation to a stub stranded orders | Final | Jun 2026 | Real Uber Direct integration |
| Lean backend, doors open (no multi-region build) | Avoid speculative scale engineering | Final | Aug 2026 | Second region |
| Deploy via CLI while git auto-deploy is broken | Unblocked production | Temporary | Jul 2026 | After Pro upgrade test |
| Two crons only (Hobby); full config saved | Budget | Temporary | Jul 2026 | Vercel Pro |
| Separate Stripe webhook secrets per endpoint | Shared secret would fail one route | Final | Aug 2026 | — |
| Delivery photos in Vercel Blob, public random-hash URLs | Base64 in Postgres bloated rows | Final for pilot | Aug 2026 | Harden access + retention post-pilot |
| Organic-only marketing; awareness then vote | Budget; vote guides supplier choice | Provisional | Sep 2026 | After first ward |
| Fee never public; Tier A claims only | Zero evidence; Competition Bureau risk | Final | Sep 2026 | When real results exist |
| Founder email on Scitoxe Workspace via alias domain | Cost | Temporary | Sep 2026 | Separate workspace later |
| Cash-out crowdfunding rejected; Burn & Direct deferred | Faucet-to-cash exploit, money-transmitter risk | Final (rejection) | Jun 2026 | Counsel review for Burn & Direct |
| Spreadsheet as CRM | Right-sized | Temporary | Sep 2026 | When the sheet stops coping |

## 16. Open questions

The questions that block the first real group buy are about money flows and suppliers, not code.

### Critical before launch

- [ ] **Stripe live mode:** finish activation, register both webhook endpoints, and settle one real small payment on each route (then refund). No real customer payments before this passes. *(technical / financial)*
- [ ] **Vercel Pro:** upgrade, restore the six jobs, switch runtime to the pooled DB URL, confirm no cold-start errors. *(technical / budget)*
- [ ] **CP production values:** run the halving SQL, update prisma/seed-econ.ts (still holds the old 100/33/8 values), and confirm production values match the code. *(technical)*
- [ ] **First supplier and real commission:** will suppliers share margin for batch volume, and how much? *(business)*
- [ ] **Legal structure:** sole proprietorship first or a corporation from the start; tax registration for fees *(raised, not resolved)*. *(legal / financial)*
- [ ] **Pickup point:** where, who hosts or staffs it, pickup windows. *(operational)*
- [ ] **No-show and refund policy** for group-buy. *(operational / legal)*
- [ ] **Deal length vs. card authorization validity** under manual capture — not discussed; check Stripe's limits. *(technical)*
- [ ] **Merchant settlement:** how and when merchants are paid manually without Stripe Connect. *(financial / operational)*
- [ ] **Vote page:** build it and set how vote data and consent are handled. *(product / privacy)*
- [ ] **Founder email:** confirm DKIM verified; test inbox-not-spam before cold outreach. *(technical)*

### Important soon

- [ ] A live CP sink during the group-buy-only launch (current sinks are in the paused delivery vertical). *(product / economics)*
- [ ] Reading-curve contradiction: implemented 50/16/4/4/4 vs. Ward Notes design input 100/80/60/10/10. *(product)*
- [ ] Can CP reduce the group-buy home-delivery fee? *(economics)*
- [ ] Home-delivery fee amount and radius. *(economics / operational)*
- [ ] Courier classification and pay under Ontario's Digital Platform Workers' Rights Act — needed before anyone else delivers. *(legal)*
- [ ] French terms for "Community Points" and "Group Buy". *(UX)*
- [ ] Do the Open Ottawa licences allow reposting Notes on social media? *(legal)*
- [ ] Hide the "Order Food" link while delivery is on hold? It is currently visible on desktop and mobile. *(UX)*
- [ ] Minimum-fee floor for small batches. *(economics)*
- [ ] Ad-law review of the sponsored-note template before the October 2026 municipal election. *(legal)*

### Can wait

- [ ] Counsel review of Sponsored Unlock and Burn & Direct (charitable solicitation, receipting, Competition Bureau). *(legal)*
- [ ] Honest design for paid merchant visibility. *(product)*
- [ ] Stripe Connect payouts. *(technical / financial)*
- [ ] Move the group-buy CP reward into EconParam. *(technical)*
- [ ] Delivery-photo access hardening and retention. *(privacy)*
- [ ] Secret-menu placement; persistent cart indicator. *(UX)*
- [ ] Real Uber Direct / Trexity integration. *(technical)*
- [ ] Separate Google Workspace for Neighbours Club. *(operational)*
- [ ] Diagnose the broken GitHub → Vercel auto-deploy if it doesn't recover after Pro. *(technical)*

## 17. Ideas backlog

Promising ideas discussed but not adopted; none is a current requirement.

| Idea | Why it's interesting | Condition before pursuing |
| --- | --- | --- |
| CP discounts at partner merchants | Deflationary sink; keeps spending local; merchant acquisition pitch | Post-pilot; CP stays a discount layer |
| Burn & Direct community campaigns | Best liability sink; gives small balances meaning | Counsel review; see §7 |
| Sponsored Unlock (CP → sponsor cash → charity) | Three-sided community engine | Counsel; goal-miss policy; see §7 |
| Labelled sponsored notes | Revenue from local businesses | Ad-law review; never earn CP |
| Labelled paid visibility / featured deals | Large marketplace revenue line | Must be visibly labelled; no hidden rank boosts |
| Fee for merchants joining a CP-deals programme | Revenue without inventory | After merchant network exists |
| OC Transpo alerts; Hwy 417 events in Notes | Richer hyperlocal content | API key / feasibility check |
| Scheduled delivery windows for single orders | Better economics than instant delivery | When delivery resumes |
| Internal-courier-only delivery with advertised hours | Avoids building Uber integration | When delivery resumes |
| Schedule-aware escalation timeout | Fewer paid escalations | Real Uber integration |
| Honest, disclosed higher fee for partner-courier orders | Covers escalation cost | Values decision by founder |
| Weekly "Neighbour Vote" post; "Meet local shops" video series | Repeatable organic content | Written permission from shops |
| Ward SEO pages; dynamic share cards | Discovery | Enough content; truthful numbers only |
| Claude Code subagents (explorer, engagement reviewer, copy reviewer, test writer, schema guard) | Cleaner sessions, automatic reviews | Deferred by founder |
| Marketing engine knowledge base (YAML in repo) and separate project | Reusable across Scitoxe ventures | Scoped, not written |
| Buy `neighboursclub.ca` as a redirect | Catches brand-spelling traffic | If available and cheap |
| Supplier portal / proper CRM (e.g., HubSpot free) | Scale beyond a spreadsheet | When manual tracking hurts |
| Tip pass-through claim | Honest differentiator | Only once courier pay and classification are settled |

## 18. Things we deliberately decided NOT to do

Do not re-propose these without new information; each was considered and rejected or postponed for a stated reason.

| Rejected / postponed | Why |
| --- | --- |
| CP cash-out crowdfunding (raise CP, convert to money) | Earned CP could be farmed into cash; breaks CP solvency; money-transmitter / FINTRAC exposure — the $0.01 rate makes "just points" untrue |
| CP as a full currency or convertible to cash | Same regulatory and solvency problem; CP stays a discount layer |
| Running our own storefront where members buy goods with CP | A second (retail) business; focus dilution; replaced by CP discounts at partner merchants (post-pilot) |
| Ingesting commercial news (CBC, Ottawa Citizen), including verbatim snippets | Terms of service forbid automated ingestion; verbatim adds copyright infringement |
| Community curation that auto-publishes notes | Bypasses the editorial firewall |
| Expiring CP / demurrage with countdowns | Engineered loss aversion — a dark pattern |
| Dynamic, dollar-pegged sink pricing | Destroys the legible $0.01 value |
| Automatic Φ throttle during the pilot | Premature; data is noise; measurement only |
| Pre-selected tips (even the lowest preset) | Platform choosing for the customer |
| Showing Google or other third-party ratings as ours | Misleading; breaches Google terms |
| "VIP" status framing | Manufactured status |
| Fake scarcity, variable rewards, streak anxiety, fake countdowns, fabricated "most ordered" signals | Engagement Pattern Standard |
| Individual leaderboards for charity/CP | Status anxiety; collective milestones preferred |
| Enterprise-grade backend now: region partitioning, regional-manager roles, geofencing, PostGIS, live GPS, WebSockets, in-app route maps | Speculative scale engineering; revisit with a second region |
| Building a custom CRM | Spreadsheet first; adopt a tool when needed |
| Launching instant delivery first | Solo ops load, courier supply, density |
| Relying on Uber Direct for most deliveries | Each escalated order roughly break-even or loss-making |
| Hot food on group-buy delivery routes | Arrives cold on a 60–90 minute route |
| Home-delivery fee that varies with how many choose it | Unknown until close; unpredictable pricing |
| Showing enrolled-but-inactive suppliers to members | Fake-marketplace pattern |
| Promoting Neighbours Club during the founder's Uber shifts | Uber terms, trust, brand integrity |
| Paid advertising now | Budget; organic first, light paid later |
| Advertising delivery or home delivery before they're live | False promise |
| Naming fee percentages or comparing with competitors' commissions | Claim framework (Tier C) and outreach rule |
| Present-tense charity claims | Nothing is operating yet |
| Blue primary brand colour | Teal is calmer and more distinctive |
| Separate paid Google Workspace for Neighbours Club (for now) | Cost; alias domain under Scitoxe works |
| Wallet top-ups / stored cash balance | Leaning reject: may trigger Retail Payment Activities Act duties; confuses CP value |

## 19. Assumptions that need validation

None of the following has been tested with real users, merchants or money; the pilot exists to test them.

**Members / demand**

- Kanata residents will group-buy, commit money days ahead, and accept pickup.
- Local, honest positioning outweighs the convenience of apps they already use.
- About 25 households can be reached for one product in one or two postal prefixes.
- People who vote will buy.

**Merchants / supply**

- Suppliers will share roughly 10% margin for incremental batch volume.
- Suppliers with existing CSA or subscription channels see Neighbours Club as additive.
- Suppliers can fulfil on a schedule; regional producers will deliver one batch to Kanata.
- Restaurants would offer scheduled batch meals.

**Economics** *(all modelling inputs)*

- 10% commission is both acceptable and profitable; minimum batch of $500–600.
- Delivery run cost about $40; courier cost about $25–30/hour; payment processing about 3%.
- Single-order inputs: $35 average order, $8 courier pay, about $12 per Uber Direct delivery.
- CP issued stays under roughly 300–400 CP per completed order.

**Engagement**

- CP motivates reading without becoming an uncontrolled liability; the 50/16/4 curve is about right.
- The current reading check is enough to deter farming.
- The two civic feeds produce enough useful content.

**Acquisition**

- Local groups, boards and flyers reach enough residents; AI-animated videos with the founder's voice resonate; local groups allow such posts.

**Operations**

- The founder can run pickups and small delivery routes alone; manual merchant settlement is workable.
- The per-minute job on Pro keeps Neon warm.

**Technology**

- Webhooks settle real payments in production; the success branch of the close-deals job works live; auto-deploy recovers after Pro.

## 20. Recommended immediate priorities

The next stage is validation and the two money gates, not more building: the platform works; what's unproven is whether Kanata wants group-buy and whether suppliers will share margin.

1. **Supplier validation outreach.** Send the first emails (about five a week, one personalized line each), follow up by phone, and log everything. The key answer is whether suppliers will share margin for batch volume, and how much — that sets the real fee.
2. **Demand signal.** Build the bilingual vote page, then flyers and neighbour-style posts in one or two Kanata postal prefixes.
3. **Stripe live mode.** Finish activation, register both webhooks, and settle one real small payment per route before any customer pays.
4. **Vercel Pro when budget allows.** Restore the six jobs, switch to the pooled database URL, run the CP halving SQL, and retest auto-deploy — one deploy session.
5. **First-buy operations.** Decide the pickup point and window, no-show/refund policy, manual merchant settlement, and deal length vs. card-authorization validity.
6. **First video.** Finish "Room to Breathe" (EN and FR) to support awareness.
7. **Honesty guardrails for the pilot.** Set the transition trigger (when to add delivery) and a kill criterion (what "not igniting" looks like after N months).
8. **Legal structure.** Decide sole proprietorship vs. corporation before taking real money.

Keep supplier readiness slightly ahead of member promotion so awareness doesn't send people to a platform with no live deals.

## 21. Instructions for the AI continuing this project

Treat this document and the repo's `docs/` as the source of truth; respect the settled decisions below, and push back honestly when a proposal conflicts with them.

### Working with the founder

- Alex is a solo founder (Scitoxe), bilingual EN/FR, with a business- and data-analysis background. Prefers honest, direct pushback over agreement; decisive once reasoning is clear; wants strategic framing before tactics.
- Consequential product, business and legal choices go to Alex; never default them silently in code or copy.
- Budget-constrained: prefer free tools and right-sized solutions.
- Alex runs Claude Code in a separate session. You write prompts that follow Explore → Plan (wait for approval) → Implement → Commit, one logical task per commit; Alex reports results back. Durable conclusions get committed to `docs/`, not left in chat.
- Separate chats exist for communications/marketing, economics and build work; Alex carries decisions between them.

### Non-negotiable principles

- **Honesty is the product.** Every claim must be literally true. The Engagement Pattern Standard is a merge blocker: no fabricated scarcity, variable-ratio rewards, engineered anxiety, opaque CP value, pre-selected tips, fake ratings or status theatre.
- **Claim framework:** Tier A (self-verifying design claims) only by default; Tier B (public filings) only with strict attribution; Tier C prohibited (named-competitor factual claims, commission comparisons, courier-pay characterizations).
- **Outreach hard rules:** never name a launch date; never name a fee percentage.
- **Approved lines:** "Built to keep money in the local community"; "A fair, low fee designed to keep more value with local businesses"; "Local businesses, local delivery, local dollars"; "Buy together with your neighbours — save together, keep it local"; "No fees or tricks designed to manipulate you".
- **Banned:** fee percentages (ours or theirs); big-app number comparisons; facts about named competitors; comparative "merchants keep more of their margin"; present-tense charity; scale claims; advertising delivery or home delivery before they're live.
- **Two economic tracks** (single orders vs. group-buy) are never blended in analysis.
- **CP never becomes cash** or a full currency; community uses burn CP and direct money the platform or a sponsor provides.

### Do not casually reverse

Group-buy first; notes only from licensed data; the editorial firewall and no-clawback rule; the $0.01 CP rate; the partial waiver; the lean backend; organic-first marketing; the fee staying internal; rejection of cash-out crowdfunding and of our own storefront (see §18).

### Still being explored

The real group-buy fee; home-delivery details (fee, radius, CP use); a CP sink for the group-buy-only launch; the reading-reward curve (§5.5 contradiction); Sponsored Unlock; marketing phasing and channels; legal structure; when delivery returns.

### Habits that help

- Diagnose before fixing; read the repo before assuming its state.
- Recommend validation and the two money gates over new features until the first group buy runs.
- Right-size: a spreadsheet before a CRM, a process before a portal, one strong asset before a content library.
- Verify third-party facts (supplier details, service pricing, legal rules) before relying on them; label assumptions.
- Keep production secrets out of chats; production database changes run by Alex in her own terminal on the direct connection.

### Key repo documents *(names as referenced in discussions)*

`product-thesis.md`, `go-to-market-thesis.md`, `architecture-baseline.md`, `remaining-work-plan.md`, `qa-findings.md`, `deploy-notes.md`, `stripe-webhook-setup.md`, `notes-feed-licensing-decision.md`, `crowdfunding-burn-and-direct-design.md`, `strategy-groupbuy-first.md`, plus the CP tokenomics, engagement-pattern and Notes governance specs. *Also in docs/: outreach-emails-final-set.md, economics-brainstorm-decisions.md, project-handoff.md. Drafted but not yet committed: supplier-outreach-list-and-email.md, merchant-outreach-research.md. Verified against the repo on 2026-09-30: no technical errors in sections 13–14*.
