# Notes — Editorial Governance & AI-Liability Specification

**Project:** Neighbours Club — Delivery Vertical
**Status:** Draft for review
**Owner:** Product Strategy / Systems Architecture
**Depends on:** Engagement Pattern Standard (§4.9 no pay-to-win governance, §6 endorsed
white-hat mechanics); CP Tokenomics Spec v2 (§4 verified-read faucet)
**Legal note:** The liability characterizations below are for product-planning orientation,
not legal advice. Counsel must review §1, §6, and §7 before launch.

---

## 0. What this spec protects against

The Notes loop ingests local news (CBC Ottawa, Ottawa Citizen, etc.) via the `RawIntel`
model, runs it through AI summarization, and publishes `ProcessedNote` records — many of
them **naming real local businesses** via the `restaurantId` linkage. The research treats
the only open problem here as "editorial trust." It is not. Publishing AI-generated claims
about named, real businesses and real local matters creates concrete **legal exposure** —
primarily defamation and copyright — that no amount of gamification addresses. An AI
hallucination that attributes a false claim to a real Kanata restaurant is a liability, not
a UX issue.

This spec defines the editorial pipeline as a **liability firewall first** and an
engagement mechanic second. The elegant part: the human-review layer that supplies our
legal defence is the *same* mechanism that creates the genuine CD3 empowerment the research
wants. We get the engagement by doing the risk mitigation properly.

---

## 1. The exposure (orientation for counsel review)

Three categories, in rough order of severity:

**Defamation.** In Canada, a statement is defamatory if it tends to lower a person's or
business's reputation before a reasonable person. Businesses can sue. Truth (justification)
is a defence; "an AI wrote it" is **not** a defence, and republication is itself
publication — so the platform is exposed as publisher the moment it pushes a false negative
claim about a named merchant (e.g. a hallucinated health-inspection failure). There is,
however, a recognized defence of **responsible communication on matters of public
interest**, which turns on whether the publisher exercised genuine diligence. Our editorial
process (§4–§6) is precisely what supplies that diligence — which is why the human-in-the-
loop is load-bearing legally, not just reputationally.

**Copyright / IP.** Facts are not copyrightable, but a source article's *expression* is.
AI summaries that closely paraphrase the original, or reproduce substantial portions, risk
infringement. Summaries must be genuinely transformative — facts restated in original
wording — with source attribution and a link back. (See the IP constraints in our general
content rules.) This exposure is entirely unaddressed in the research.

**Privacy / accuracy.** Notes about identifiable individuals (as opposed to businesses or
public-interest matters) raise privacy concerns and should be out of scope for the pilot.
Inaccurate local reporting also directly erodes the civic-trust thesis the whole white-hat
layer depends on.

---

## 2. MVP risk posture (the conservative default)

For the pilot, the cheapest risk reduction is scope restriction. **Phase 1 publishes only
low-risk note types** and defers republishing hard-news allegations about businesses until
the full framework (§4–§7) and legal review are in place:

- **Allowed at launch:** neutral/positive local-interest items ("new bakery opened on
  Hazeldean"), merchant profiles published **with merchant consent**, community events,
  factual civic notices restated transformatively with attribution.
- **Deferred until full framework + counsel sign-off:** any note containing a negative or
  allegation-type claim about a named business or person (health, safety, legal, financial,
  quality).

This single decision removes most of the §1 defamation surface during the riskiest early
period at near-zero engineering cost.

---

## 3. Note risk classification

Every `ProcessedNote` is auto-classified at draft time:

**HIGH risk** if any of: names a business *and* carries a negative/allegation claim;
concerns an identifiable individual; touches a sensitive public matter (health, safety,
legal, financial). **LOW risk** otherwise.

The AI summarizer emits a risk tier plus a confidence score; the classifier errs toward
HIGH on ambiguity. Risk tier drives the review gate (§4). During Phase 1, HIGH-risk notes
are simply not published (§2).

---

## 4. The editorial state machine

```
RawIntel ─▶ AI summarize ─▶ DRAFT ─▶ IN_REVIEW ─▶ APPROVED ─▶ PUBLISHED
                                         │                         │
                                         ▼                         ▼
                                     REJECTED                CORRECTED / RETRACTED
```

Review gate by risk tier:

| Risk tier | Gate to publish |
|---|---|
| LOW | **N independent certified-moderator approvals** **[TUNABLE: N=2]**, no rejections |
| HIGH | All of the LOW requirement **plus mandatory staff Managing Editor sign-off** |

Certified citizen moderators are *necessary but not sufficient* for HIGH-risk notes — a
staff editor must personally clear anything in the defamation-sensitive set. This is the
diligence record that underpins the responsible-communication defence (§1).

**Pre-publication review is the legal firewall. Post-publication verification (§8) is a
separate, secondary signal.** The research conflates them; they are not the same and the
liability gate must sit *before* publish.

---

## 5. Citizen-journalist certification — gated on quality, never on CP

This is where Engagement Standard §4.9 (no pay-to-win governance) gets its mechanism.
Editorial rights attach to **demonstrated accuracy**, decoupled entirely from CP earned or
donated. CP buys status badges; it never buys authority over the information supply.

Certification path:

1. **Probation:** a candidate moderator's review decisions are recorded but
   non-binding (shadow mode) for a probation window **[TUNABLE: 30 days / 25 decisions]**.
2. **Accuracy score:** their shadow decisions are scored against outcomes — did their
   approvals correlate with notes that were *not* later corrected/retracted? Did their flags
   catch real errors? Score = agreement with verified outcomes, not volume.
3. **Certification:** granted only above an accuracy threshold **[TUNABLE: ≥90%]**. Revoked
   if accuracy degrades below a floor.
4. **Status tiers stay cosmetic for editorial purposes.** `NEIGHBORHOOD_CHAMPION` /
   `COMMUNITY_PILLAR` may *unlock the opportunity* to enter the probation path, but never
   confer editorial power directly, and CP donation never shortcuts certification.

This makes the moderation queue the genuine CD3 empowerment mechanic the research wants —
users earn real editorial agency — without letting generosity or spending corrupt it.

---

## 6. Correction & right-of-reply workflow (for named parties)

Mandatory for any published note naming a business or person:

- **Reporting channel:** a clearly linked "Request a correction" path on every such note,
  reaching a monitored queue.
- **SLA:** acknowledge within **[TUNABLE: 2 business days]**; for HIGH-risk claims, the note
  is **provisionally unpublished pending review** on credible dispute, not left live while
  contested.
- **Right of reply:** named merchants may submit a short response published alongside the
  note.
- **Versioning & audit trail:** every note is versioned with who approved it, when, and
  under which risk tier — the diligence record counsel will want if a claim is ever made.
- **Retraction:** retracted notes are marked, not silently deleted (audit integrity). User
  CP already earned on a since-retracted note is **not clawed back** — readers acted in good
  faith, and clawback would punish the behavior we want and create its own UX/ledger mess.

---

## 7. Source attribution & copyright handling

- Every published note **attributes its source and links to the original.**
- Summaries must be **transformative** — facts in original wording, never close paraphrase
  or substantial reproduction of the source's expression. The summarization prompt enforces
  this and the review gate checks it.
- `RawIntel` retains the source URL, publisher, and ingestion timestamp for every record.
- Confirm with counsel whether each upstream feed's terms permit derivative summarization
  and linking (§9, decision 4).

---

## 8. The "Verify" mechanic (post-publication, honest framing)

A reader of a PUBLISHED note may click "Verify," earning CP per Tokenomics §4 (now the
diminishing curve, not a flat 500). Honest framing per Engagement Standard §6: human
verification *genuinely* improves the corpus and surfaces errors the pre-publication gate
missed. But it is explicitly a **secondary** accuracy signal and engagement loop — it does
**not** substitute for the §4 pre-publication review, and a high verify count never
auto-publishes or auto-clears a disputed note. Verification data also feeds moderator
accuracy scoring (§5).

---

## 9. Schema changes (Prisma)

- `ProcessedNote`: add `riskTier` (LOW|HIGH), `aiModel`, `aiConfidence`, `sourceUrl`,
  `sourcePublisher`, `sourceIngestedAt`, `version`, `publishedAt`; extend status enum to
  `DRAFT|IN_REVIEW|APPROVED|PUBLISHED|REJECTED|CORRECTED|RETRACTED`. Keep `restaurantId`
  nullable.
- `NoteReview` — new: `noteId`, `reviewerId`, `decision` (APPROVE|REJECT|FLAG), `comment`,
  `isShadow` (probation), `createdAt`.
- `Reviewer` — new: `userId`, `certificationStatus`, `accuracyScore`, `probationUntil`,
  `certifiedAt`, `revokedAt`.
- `NoteCorrection` — new: `noteId`, `requesterContact`, `claim`, `status`, `resolution`,
  `acknowledgedAt`, `resolvedAt`.
- `NoteVerification` — new: `userId`, `noteId`, `createdAt`; `@@unique([userId, noteId])`.
- `NoteVersion` — new (or JSON history on the note): immutable snapshot per edit for the
  audit trail.

---

## 10. Open decisions needed before build

1. **Phase-1 scope line.** Confirm the exact boundary of "low-risk" note types eligible for
   launch (§2) — get counsel to bless the list.
2. **HIGH-risk republishing.** Decide whether we *ever* republish allegation-type business
   news, or only ever link out to the original without restating the claim. The
   link-out-only option nearly eliminates defamation exposure.
3. **Moderator legal status.** Are certified citizen moderators volunteers, and does their
   role create any liability/insurance consideration for them or us? Counsel question.
4. **Feed licensing.** Verify each source feed's terms permit AI summarization + linking
   (§7).
5. **Provisional-unpublish trigger.** Define "credible dispute" precisely enough to
   automate the §6 provisional-unpublish without it becoming a censorship/abuse vector.

---

## 11. What this spec deliberately does not do

It does not let CP purchase editorial authority (Engagement Standard §4.9); does not publish
HIGH-risk claims about named parties during the pilot (§2); does not treat post-publication
"Verify" as a substitute for pre-publication review (§8); does not silently delete retracted
content or claw back good-faith user CP (§6); and does not republish source expression
non-transformatively (§7). The pre-publication human gate on HIGH-risk notes is the single
non-negotiable control — it is both the engagement mechanic and the legal defence, and the
two are the same thing.
