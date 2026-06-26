# Decision Record — Notes Feed Licensing (2026-06-26)

## Decision

Neighbours Notes ingest uses **only open-licensed (Open Government Licence) civic
data**. Commercial news RSS feeds (CBC Ottawa, Ottawa Citizen/Postmedia) were
removed in commit `b052d69`.

Notes is a hyperlocal **civic-information** aggregator, not a local-news
aggregator. That distinction is now load-bearing, not cosmetic.

---

## Source triage

| Source | Licence | Status |
|---|---|---|
| `open-ottawa-road-events` | OGL (City of Ottawa) | **KEPT** |
| `open-ottawa-dev-apps` | OGL (City of Ottawa) | **KEPT** |
| `cbc-ottawa` | Commercial — ToS prohibits automated ingestion | **REMOVED** |
| `ottawa-citizen` (Postmedia) | Commercial — ToS prohibits automated ingestion | **REMOVED** |

---

## Key reasoning — record this so it is not re-litigated

The binding constraint was **contract**, not copyright.

It is tempting to reason: "facts aren't copyrightable and our summaries are
transformative, so we're fine." That analysis only addresses copyright. Commercial
publishers' Terms of Service contain explicit anti-scraping and
anti-automated-ingestion clauses. Breaching those clauses is breach of **contract**
regardless of the copyright outcome.

Canadian fair dealing (narrower than US fair use) does **not** override a site's
ToS — the two legal frameworks operate independently.

Verbatim snippet copying (headline + key sentences) makes the position worse: it
adds a clear copyright violation on top of the ToS breach and forfeits the
transformation defence.

**The copyright analysis was never the way out. The contract was the blocker.**

---

## Why it is also a better product choice

1. **More hyperlocally useful.** Open-data content — road closures, development
   applications, transit alerts, civic notices — is directly actionable for
   Kanata residents. General Ottawa news was only occasionally local enough to
   pass the Kanata-keyword filter.

2. **Lightens the editorial firewall.** Commercial news was the primary source of
   HIGH-risk `BLOCKED_NEEDS_FRAMEWORK` classifications: articles about named
   parties trigger the defamation gate. Civic data (road events, planning
   applications) rarely names individuals in an adversarial context, so the
   admin review queue will be shorter and cleaner.

3. **Explicit licence answers the question up front.** OGL sources answer "can
   we use this content?" with a documented YES before any item is ingested. No
   per-item copyright calculus, no ongoing ToS monitoring.

---

## Code impact (commit b052d69)

**Removed:**
- `SOURCES` array (the two RSS entries) from `app/api/cron/ingest-notes/route.ts`
- The `for (const source of SOURCES)` ingestion loop
- `ingestRSSFeed` import from `route.ts`
- `cbc-ottawa` and `ottawa-citizen` entries from `lib/notes-sources.ts`

**Kept intact (intentionally):**
- `ingestRSSFeed` function in `lib/notes-ingest.ts`
- `rss-parser` package dependency
- Test fixtures referencing `'CBC Ottawa'` as a string — those tests cover the
  publish gate logic, not the RSS ingest path

The RSS plumbing was never the problem; the commercial sources were. An
OGL-licensed RSS feed (e.g. an OC Transpo advisory feed) could reuse the
existing function without any new risk.

---

## Deferred enrichment (not pilot-blocking)

Notes is legally clean and functionally sufficient on the two civic feeds for
pilot. Enrichment candidates:

- **OC Transpo service/detour alerts** — OGL-licensed, free API-key registration
  required, needs a dedicated adapter function (per-route polling doesn't map to
  a single endpoint call). Medium effort. High value for Kanata commuters.

- **Ontario Hwy 417 / provincial road events (511on.ca or MTO feed)** — needs a
  feasibility spike to confirm endpoint shape and access requirements. Lower
  confidence than OC Transpo; investigate before committing.

Neither is needed before launch.

---

## Optional outreach (non-blocking, ranked by realistic yield)

**Local community sources** (ward councillors, community associations, BIAs) —
these parties *want* amplification. A short introductory email is likely to yield
written permission quickly. Content from granted sources feeds the existing admin
review pipeline and is never auto-published. High-value outreach; low effort.

**Commercial publishers** (CBC, Postmedia) — unlikely to grant a fast, free
commercial licence. Treat as a future bonus if the platform reaches meaningful
scale. Never a dependency.

---

## Caveat

This document reflects a product-planning orientation, **not legal advice**.
Confirm any new source's actual licence terms before relying on them in
production. Do not reverse the commercial-news exclusion without written publisher
permission and counsel review.
