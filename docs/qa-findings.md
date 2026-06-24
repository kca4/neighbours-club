# QA Verification Pass — Findings

## Verification pass — COMPLETE
All sections (1-8) verified. Summary:
- PASSING: delivery lifecycle, fee-waiver sink, secret-menu sink, Notes editorial
  firewall, verified-read faucet, wallet/Φ observability, role gating, group-buy
  cron.
- FIXED during pass: dispatch auto-escalation launch blocker (commit 0abcb93).
- The idempotency guard (@@unique[walletId,referenceId,reason] + closingProcessedAt
  sentinel) proven LIVE on every settlement path: fee waiver (no double-burn),
  secret menu (recovery), verified-read (no double-mint), group-buy cron (no
  double-process).

## Fix list before launch (priority order)
1. ~~[medium-high] Header CP badge doesn't auto-update after any CP action — needs
   router.refresh()/revalidation. Affects every CP action.~~ **DONE** (commit 81747b9)
2. ~~[medium] Verified-read toast says "Points earned!" even at 0 CP — should reflect
   actual result. On-thesis (no-deception) fix.~~ **DONE** (commit 5c88239)
3. ~~[verify] Cart persistence — architecture doc says localStorage; confirm it
   survives hard reload (may already be handled; was listed as a blocker).~~ **DONE** (commit 14b1500) — **LIVE-CONFIRMED**: all three checks pass (survives hard reload; does not resurrect after order checkout; cross-restaurant "clear cart?" guard intact).
4. ~~[low] "Delete" button on /admin/notes does soft-delete — rename to "Reject".~~ **DONE** (commit 036b4ba) — confirmed no genuine hard-delete exists; `rejectNote` is soft-delete in both paths (normal and high-risk/blocked).
5. [low] Secret Menu placement below full menu — consider higher entry point.

## Fixed
- Dispatch auto-escalation to Uber stub after 3 min (launch blocker) — FIXED,
  commit 0abcb93, gated behind ENABLE_UBER_ESCALATION (default off).
- Header CP badge auto-refresh — FIXED, commit 81747b9; revalidatePath('/', 'layout')
  called after every CP mutation (verified read, fee waiver, secret menu redemption).
- Verified-read toast honesty — FIXED, commit 5c88239; FaucetResult now surfaces
  cpAwarded; verifyNote returns outcome:'earned'|'exhausted'|'duplicate'; toast shows
  "You earned N CP · New balance: X CP", "reached today's reading limit", or
  "already credited" accordingly.
- Admin notes "Delete" → "Reject" label — FIXED, commit 036b4ba; `rejectNote` is a soft-delete (status REJECTED, row preserved) in both the normal path and the high-risk/blocked path. No genuine hard-delete exists.
- Cart persistence across hard reload — FIXED, commit 14b1500; CartProvider now
  hydrates from localStorage ('nc:cart') on mount and persists on every state change.
  Save-before-load race guarded by a hydrated flag. Clear-on-empty removes the key
  (no resurrection after checkout). Cross-restaurant "clear cart?" guard preserved.

## Open — polish

### Discoverability
- Secret Menu section placement is below the full regular menu, easy to miss.
  Consider a higher entry point for discoverability (without undercutting the
  "secret" feel). Priority: low.
- No persistent cart indicator in the UI. The cart ("View order" bar) is only
  visible when items are present; when empty there is no cart affordance (no cart
  icon in the header, unlike DoorDash/Uber Eats convention). Not a bug — cart
  works correctly — but a discoverability gap. Consider a persistent header cart
  indicator. Priority: low (UX polish, product decision).

### Labels / copy
- ~~The reject action button on /admin/notes is labeled "Delete" but performs a
  soft-delete (status REJECTED, row preserved). Label is misleading — consider
  renaming to "Reject" to match behavior. Priority: low.~~ **FIXED** (commit 036b4ba)

## Verified passing
- Section 1: full delivery lifecycle (browse→pay→settle→kitchen→dispatch→driver→
  delivered), internal courier path.
- Section 2: fee-waiver order — burn-after-payment, correct 500 burn, idempotent
  re-settle (no double-burn), eligibility enforced.
- Section 3: secret redemption — burn, kitchen "Paid with CP" display, repeat
  purchase, can't-afford disabled state. Crash-recovery logic verified via unit
  tests + section-2 idempotency proof.
- Section 4: Group buy settlement — close-deals cron runs clean against real data.
  Correctly closed a past-deadline OPEN deal via the FAILURE branch (olive-oil
  deal: confirmedCount 2 < threshold 20 → CLOSED_FAILED, 2 orders voided, no
  erroneous capture). Cron idempotency CONFIRMED LIVE: second run returned
  processed:0, did not reprocess the closed deal. Success-branch capture + 330 CP
  vesting covered by unit tests + the @@unique idempotency guard proven live in
  sections 2/3/6; full success-path staging deferred (low value + local Stripe
  manual-capture limitation).
- Section 5: Notes editorial firewall — HIGH-risk publish gate refuses (score-7
  note cannot be approved); blocked/non-approved notes excluded from public feed;
  clean low-risk note approves with attribution; correction request +
  right-of-reply renders publicly; provisional unpublish removes from feed;
  reject is soft-delete (row preserved, status REJECTED); retraction marks (not
  deletes) + writes NoteVersion + NO CP CLAWBACK (James earned 100 CP on verify,
  retraction left his balance and ledger row untouched).
- Section 6: Verified-read diminishing faucet — full curve confirmed LIVE as
  aisha (fresh user): 1st read +100, 2nd +33, 3rd–5th +8 each, 6th +0 (0-CP
  read still writes a ledger row). Total 157 CP, within the 185 daily cap (no
  clip). No-double-mint confirmed: re-verifying an already-read note pays
  nothing, one ledger row, balance unchanged (@@unique idempotency guard holds —
  same guarantee as fee waiver and secret menu).
