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
