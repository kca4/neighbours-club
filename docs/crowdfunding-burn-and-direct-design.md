# Crowdfunding — "Burn & Direct" Model (post-pilot backlog)

## Decision record

The "cash-out" crowdfunding model (users raise CP, convert to real money) was
REJECTED. Reasons: (1) creates a faucet-to-cash exploit that breaks the Φ solvency
governor and the §8 backing ceiling; (2) triggers FINTRAC / money-transmitter
regulatory exposure — the committed $0.01/CP rate means "it's just points" is not
a defense once they reliably convert to cash; (3) "don't fund your own campaign"
rules can't close a distributed farming exploit. Same reasoning that deferred the
civic donation sink, amplified.

## Approved model: Burn & Direct

CP is a collective signaling tool — users pool CP to unlock a pre-approved
platform action, NOT to send money to a person.

| Dimension | Cash-Out (abandoned) | CP Burn (approved) |
|---|---|---|
| Regulatory Risk | FINTRAC / money-transmitter exposure; $0.01/CP rate means "just points" fails as a defense | No cash transfer to individuals; platform executes the outcome directly |
| Economic Impact | Faucet-to-cash exploit breaks Φ governor and §8 backing ceiling | Burns CP liability off the books; outstanding liabilities shrink on success |
| Outcome | Personal cash in a creator's pocket | Tangible local community benefit verified and fulfilled by platform or merchant |

### Curated local campaigns

Campaigns tied to tangible local outcomes fulfilled by the platform or verified
merchants (block party, bulk merchant discount, youth sports sponsorship, garden
cleanup) — NOT open-ended personal campaigns. Platform-verified so the real-dollar
cost is known and fits the §8 backing budget.

### CP sink mechanic

Backed CP held in escrow. Success → CP BURNED (removed from circulation, reduces
outstanding liabilities); platform's real-dollar community budget executes the
outcome. Failure → CP refunded to wallets.

### Exploits neutralized

Outcome is local community benefit, not personal cash — removes the incentive to
farm CP. Worst case of farmed CP funding a campaign: a park gets cleaned and the
platform burns CP liability off its books.

---

## OPEN QUESTIONS for when this is built (do not lose these)

1. **Escrow/burn/refund must follow the proven GROUP-BUY settlement pattern:**
   idempotent burn-on-success (no double-burn on retry), idempotent
   refund-on-failure, atomic CP holds (can't pledge CP you don't have or pledge
   the same CP twice), via `@@unique` guards + a `closingProcessedAt`-style sentinel.

2. **§8 ceiling approval is bidirectional and the two money flows must stay
   SEPARATE:** the CP burn reduces already-backed liability; the platform's
   community budget pays for the outcome. The outcome is NOT funded BY the burned
   CP (that's the cash-out model sneaking back). Approval confirms the real-dollar
   outcome cost is separately budgeted.

3. **Refunds are ledger-neutral re-credits, NOT faucet emissions:** they must not
   count as `emitted` in Φ and must not count against per-period earning caps
   (same category as the `manual_grant`/Φ calibration).

4. **Outcome categories need COUNSEL review before launch** — "sponsor a youth team"
   vs "unlock a merchant discount" sit in different regulatory boxes
   (charitable-solicitation / promotional-contest), same as the civic sink.

---

## Status

POST-PILOT. Not on the critical path to first users. Strong community-retention
feature for after the pilot proves the core loop.
