# Strategic Decision: Group-Buy First, Delivery Second

Status: DECIDED (strategic direction). Date: 2026-08.
Supersedes the implicit "launch instant-delivery first" assumption.

## The decision
Launch the platform LEADING with the GROUP-BUY vertical. Defer the Uber-style
on-demand instant-delivery vertical to a SECOND phase, launched once group-buy has
built a warm, trusting local user base.

## Why (this directly defuses the platform's biggest risks)

The prior plan (launch instant delivery, compete with Uber Eats) exposed the
project to its worst failure mode: slow stall in a thin-margin, operationally
brutal business run by a solo founder. Group-buy-first attacks that failure mode on
multiple fronts:

1. OPERATIONAL LOAD (was the #1 solo-founder risk): group-buy runs on a SCHEDULE
   (orders pool over a window, fulfil in a batch) — no dinner-rush chaos, no cold
   food, no on-demand courier scramble, no late-order fury. Solo-survivable.

2. COURIER-SUPPLY / UBER-ESCALATION DEATH SPIRAL: batched delivery needs far fewer
   courier-hours per order and is SCHEDULED (line up a courier in advance vs.
   scramble for on-demand). Group-buy is the vertical where courier economics work
   at LOW volume. Defers the hardest recruitment problem.

3. THIN MARGINS / DENSITY: group-buy's break-even take-rate FALLS as pool size
   grows (batching divides one trip cost across N participants). Profitable at
   LOWER order counts than instant delivery.

4. COLD-START / IGNITION (the existential risk): group-buy is INHERENTLY a
   density-builder. Its mechanic — "enough neighbours must join for the deal to
   close" — gives people a reason to RECRUIT their neighbours. It manufactures the
   local density the platform needs, virally. Instant delivery has no such loop.

5. WARM SECOND LAUNCH: by the time instant delivery launches, users already have
   accounts, trust, and CP balances. The hard vertical launches WARM, not cold
   against Uber Eats.

## The strategic reframe
NOT "a delivery startup competing with Uber Eats."
INSTEAD "a local group-buying community that will LATER add delivery."
- Incumbents don't directly compete with group-buy.
- Profitable at low density; builds density virally; solo-survivable.
- Earns the trust + user base that makes the delivery vertical launch from strength.

## What this changes on the path to launch (SHORTER + CHEAPER)
DEFERRED off the launch-blocker list:
- Real Uber Direct integration (not needed for group-buy) — one less build.
- On-demand courier supply (group-buy uses scheduled fulfilment) — hardest
  recruitment problem, postponed.
- Instant-delivery operational load — the most overwhelming part, postponed.

NEEDED for group-buy launch:
- Group-buy vertical working (largely built + verified).
- A few SUPPLIERS with desirable batch deals (schema already has Suppliers/Deals).
- Scheduled fulfilment (founder + a courier for batch runs).
- Stripe live + webhook verified.
- Initial users.

## Merchant pitch shifts (and improves)
FROM "join our delivery app" (competes with Uber, asks behaviour change)
TO "we'll bring you a BATCH of guaranteed orders on a schedule" (additive,
low-risk, no competition with their Uber Eats presence). A much easier merchant
yes. UPDATE merchant outreach to lead with the group-buy value prop.

## THE OPEN VALIDATION (must confirm before fully committing)
The pivot rests on one assumption: there is genuine DEMAND and SUPPLY for group-buy
in Kanata.
- DEMAND: will Kanata residents group-buy desirable things?
- SUPPLY: what is the actual group-buy PRODUCT? (bulk restaurant orders? local
  producer goods? group grocery deals?) Which suppliers will offer batch deals?
- Test cheaply (talk to a few potential suppliers; gauge resident interest) BEFORE
  reorganising the whole launch around it.
- If demand/supply exists -> pivot is clearly right. If group-buy has no natural
  Kanata product -> reconsider.

## Transition trigger (define before launch)
Set a threshold for when group-buy is working well enough to add instant delivery:
e.g. X successful group-buys closed, Y active users, Z repeat participants. Prevents
launching delivery too early (before the warm base exists) or never (perpetually
"not ready").

## Kill-criterion (honest founder discipline)
Decide NOW what "not igniting" looks like so grinding isn't mistaken for progress:
e.g. "if after N months of real group-buy operation we're under X closed
deals/month with no growth trend, stop or pivot." Prevents a slow, expensive,
exhausting non-death consuming a year.
