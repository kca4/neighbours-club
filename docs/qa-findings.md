# QA Verification Pass — Findings

## Fixed
- Dispatch auto-escalation to Uber stub after 3 min (launch blocker) — FIXED,
  commit 0abcb93, gated behind ENABLE_UBER_ESCALATION (default off).

## Open — to fix before launch
- Header CP badge does not auto-update after CP-changing actions (verified read,
  secret redemption, fee waiver) — requires manual page reload. Affects every CP
  action; risks users doubting their points registered. Likely missing
  router.refresh()/revalidation after the mutation. Priority: medium-high (trust).

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
