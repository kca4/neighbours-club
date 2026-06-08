
## Summary
<!-- What does this PR do, and why? One or two sentences. -->

## Scope
- **Vertical:** <!-- CP ledger / Group Buy / Delivery / Notes / cross-cutting -->
- [ ] This PR touches **one vertical / one logical change** (foundation-first; don't bundle).
- [ ] Verticals affected stay **hidden from main nav** (not ready to surface).

## ⛔ Engagement Pattern Standard (required — blocks merge)
Reference: `/docs/engagement-pattern-standard.md`
- [ ] Introduces **no PROHIBITED pattern** (fabricated narrative, false scarcity, fake price
      anchor, randomized/loot reward, sunk-cost trap, anxiety UI, coercive notification,
      civic-funding theater, pay-to-win governance, vulnerability exploitation).
- [ ] Any **RESTRICTED** pattern used meets its stated conditions — named here:
      <!-- e.g. "real countdown, true close time, not navigation-hijacking" — or "none" -->
- [ ] Every price, count, deadline, and progress indicator shown is **literally true**.

> If a requested feature seems to *require* a prohibited pattern: **stop and decide
> deliberately** — do not ship a softened version of it. Note the decision below.

## ✅ Safety self-review (you are the only reviewer)
- [ ] **Tests** added/updated and passing for this change.
- [ ] **Ledger idempotency** (if `WalletLedger` is touched): the
      `@@unique([walletId, referenceId, reason])` path is covered by a test; a retry/double-submit
      is a no-op. *(A silent ledger bug corrupts the whole economy — this one is non-negotiable.)*
- [ ] **Risky paths ship closed:** HIGH-risk Notes publishing, the civic sink, and the Φ
      throttle are **disabled-but-testable** unless the gating decision (human/counsel) is done.
- [ ] **Migration safety:** additive or reversible; down-migration considered; existing data
      (if any) backfilled. Foreign keys / `onDelete` behavior intentional.
- [ ] **Pricing honesty (Delivery):** all-in price itemized and shown early; no drip pricing.

## Commits
- [ ] History is clean and this is committed **before switching context** to anything else.
      *(Your only undo and audit trail.)*

## Decisions / flags routed to a human
<!-- CP→$ rate, editorial scope, take-rate, anything needing counsel/finance/ops.
     If none, write "none". Don't silently proceed past a decision that isn't yours. -->

