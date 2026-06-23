# QA Verification Pass — Findings

## Fixed
- Dispatch auto-escalation to Uber stub after 3 min (launch blocker) — FIXED,
  commit 0abcb93, gated behind ENABLE_UBER_ESCALATION (default off).

## Open — to fix before launch
- Header CP badge does not auto-update after ANY CP-changing action (verified
  read, redemption, fee waiver) — confirmed across all three. Requires manual
  reload. Likely missing router.refresh()/revalidation after the mutation.
  Priority: medium-high (affects every CP action; risks users doubting points
  registered).
- Verified-read success toast shows "Points earned!" even when 0 CP are minted
  (e.g. daily curve exhausted, or already-read note). Misleading — should reflect
  the actual result ("You've reached today's reading limit" / "already counted").
  On-thesis fix: the no-deception platform shouldn't show a false reward
  confirmation. Priority: medium (small but trust-relevant).

## Open — polish
- Secret Menu section placement is below the full regular menu, easy to miss.
  Consider a higher entry point for discoverability (without undercutting the
  "secret" feel). Priority: low.
- The reject action button on /admin/notes is labeled "Delete" but performs a
  soft-delete (status REJECTED, row preserved). Label is misleading — consider
  renaming to "Reject" to match behavior. Priority: low.

## Verified passing
- Section 1: full delivery lifecycle (browse→pay→settle→kitchen→dispatch→driver→
  delivered), internal courier path.
- Section 2: fee-waiver order — burn-after-payment, correct 500 burn, idempotent
  re-settle (no double-burn), eligibility enforced.
- Section 3: secret redemption — burn, kitchen "Paid with CP" display, repeat
  purchase, can't-afford disabled state. Crash-recovery logic verified via unit
  tests + section-2 idempotency proof.
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
