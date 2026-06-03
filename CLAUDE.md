# CLAUDE.md — Neighbours Club Project Context

This file is read by Claude Code at the start of every session. It contains permanent context about the Neighbours Club project. Keep it concise and current.

---

## Project overview

**Neighbours Club** is a hyperlocal community platform launching in Kanata, Ottawa. It has multiple verticals under one platform:

- **Group buy** (Steps 1–7 complete, verified) — members pool orders for tiered-discount pricing with pickup
- **Delivery** (live, connected to main nav) — food/goods delivery with restaurant partners and driver app
- **Neighbours Notes** (intelligence pipeline built) — editorial neighbourhood feed with automated ingest, Gemini summarization, and subscriber delivery
- More verticals planned

The verticals share one codebase, one database, one auth system. They are separated by folder structure (e.g., `/app/deals/` for group buy, `/app/driver/` for delivery driver, `/app/notes/` for notes).

---

## Tech stack (locked — do not substitute)

- Next.js 16 with App Router and TypeScript strict mode
- Tailwind CSS
- Prisma ORM with PostgreSQL (Vercel Postgres in production)
- Auth.js v5 with Credentials provider, JWT session strategy
- bcryptjs for password hashing (cost factor 10)
- Stripe for payments (manual capture for group buy; Connect for driver payouts when delivery is built)
- Resend for transactional email
- Vercel Cron for scheduled jobs
- npm as package manager
- Stripe CLI for local webhook forwarding
- Google Gemini 2.5 Flash for Notes summarization, risk scoring, and category tagging

Route protection lives in `proxy.ts` (the Next.js 16 convention), not `middleware.ts`.

---

## Brand and design

- Name: **Neighbours Club** (British spelling; do not change)
- Tagline: *"your neighbourhood, working together"*
- Supporting copy: *"Save on everyday essentials by pooling orders with your neighbours. Starting with group buys in Kanata. More to come."*
- Colors:
  - Primary: teal `#0F766E`
  - Accent: amber `#F59E0B`
  - Background: warm off-white `#FAF8F3`
  - Text: near-black `#1A1A2E`
- Typography: `Fraunces` (display serif) + `Inter Tight` (body sans) via `next/font/google`
- Mobile-first: design for 375px width minimum, tap targets ≥ 44px, no horizontal scrolling

---

## Group-buy data model (built and locked)

Models that group buy depends on. Do NOT change these without explicit discussion.

- **User**: `id, email (unique), passwordHash, name, phone?, role (Role), stripeCustomerId? (unique), createdAt, updatedAt` — plus delivery-vertical additions
- **Supplier**: `id, name, contactName?, contactEmail?, contactPhone?, notes?`
- **Deal**: `id, title, slug (unique), description, imageUrl?, supplierId, createdById, tiers, minimumMembers, maximumMembers?, maxQuantityPerMember, opensAt, closesAt, pickupLocation, pickupAddress, pickupWindowStart, pickupWindowEnd, pickupInstructions?, status (DealStatus), finalPrice?, finalTierIndex?, midpointReminderSentAt?, closingProcessedAt?`
- **DealTier**: contiguous ranges starting at 1, monotonically decreasing prices, only last tier may have null maxMembers
- **Order**: `id, userId, dealId (unique together), quantity, maxAuthorizedAmount, finalAmount?, stripePaymentIntentId? (unique), recoveryToken? (unique), status (OrderStatus), pickedUpAt?, pickedUpBy?, pickupReminderSentAt?, notes?`
- **AuditLog**: `id, userId?, action, entityType, entityId, metadata?, createdAt`
- **PasswordResetToken**: `id, userId, token (unique), expiresAt, usedAt?, createdAt`

Enums:
- `Role`: MEMBER, ADMIN, COURIER, RESTAURANT_OWNER
- `DealStatus`: DRAFT, OPEN, CLOSING_SUCCESS, CLOSING_FAILED, FULFILLING, COMPLETED, CANCELLED
- `OrderStatus`: PENDING_AUTHORIZATION, AUTHORIZED, CAPTURED, CAPTURE_FAILED, VOIDED, PICKED_UP, REFUNDED, NO_SHOW

---

## Neighbours Notes data models

- **RawIntel**: `id, source, externalId (unique per source), title, url, publishedAt, rawContent, fetchedAt`
- **ProcessedNote**: `id, rawIntelId?, title, summary, category, impactScore, status (PENDING/APPROVED/REJECTED), sourceUrl?, isBusinessSubmission, createdAt`
- **Subscriber**: `id, email (unique), confirmedAt?, token (unique), createdAt`
- **BusinessSubmission**: `id, businessName, contactEmail, noteTitle, noteBody, status (PENDING/APPROVED/REJECTED), createdAt`

---

## Critical architectural invariants

These rules must NEVER be violated without explicit discussion:

1. **Stripe webhook is the source of truth for order state transitions.** Server code does NOT mark orders as AUTHORIZED, CAPTURED, or VOIDED based on client-reported state — only based on Stripe webhook events. The join endpoint creates orders as `PENDING_AUTHORIZATION` and only the webhook handler promotes them.

2. **Money fields use `Decimal(10,2)`, never Float.** All amounts in dollars (not cents) in the database; cents only at the Stripe API boundary.

3. **Manual capture for group buy.** PaymentIntents are created with `capture_method: "manual"`. Capture happens at deal closure, not at join.

4. **Idempotent state transitions everywhere.** Every webhook event handler must be safe to receive the same event twice without doubling its effect.

5. **The `(userId, dealId)` unique constraint on Order** means a user can have at most one row per deal. When a user re-joins a deal they previously left (VOIDED), the join endpoint reuses the existing row by updating it, not by inserting a new one.

6. **Role-based access is enforced at TWO layers** — middleware (page-level redirects) AND inside each `/api/admin/*` route handler (returns 403 if not admin). Defense in depth. Never rely on middleware alone.

7. **Cron endpoints are protected by `x-cron-secret` header** matching the `CRON_SECRET` env var. Never expose cron endpoints unauthenticated.

8. **Vercel Cron schedules live in `vercel.json`.** Three jobs: `close-deals` (every 5 min), `cleanup-pending-orders` (hourly), `send-pickup-reminders` (hourly).

---

## Build history (commits)

Each step is a clean git commit:

- `d093e09` — Step 1: Next.js scaffold, Prisma schema, seed data
- `00222d9` — Step 4: Stripe integration, join/leave flows, PENDING_AUTHORIZATION, cleanup cron
- `b9d92cf` — Step 5: Admin UI - dashboard, deal CRUD, supplier CRUD, editability rules, role-based API access
- `fed0910` — Step 6: Deal closure automation, payment capture, pickup marking, Vercel Cron, recovery flow
- `0841a8c` — Step 7: Email (Resend), password reset, FAQ, legal pages, mobile polish, validation fixes, tagline update
- `a4180de` — Delivery vertical: schema (Neighbourhood, Restaurant, DeliveryOrder, Driver models), route scaffolding, UI screens, notes architecture
- `68a58b9`–`43ba822` — Notes intelligence: Gemini summarizer, RSS ingest (CBC Ottawa, Ottawa Citizen), admin review page
- `9d9e163`–`f94f33a` — Notes public feed, subscriber system (double opt-in, CASL), urgent email alerts
- `5026f66`–`aa98b81` — Daily digest cron (7am ET), Open Ottawa road events + dev applications sources
- `2e332fe`–`1e495e7` — Business submission form + admin review, Local Business badge, Read more links
- `a55f551` — Fix: migration checksum mismatch on DeliveryOrder index
- `3f69904` — Delivery Phase 4: driver dispatch, Uber fallback stub, order tracking
- `630e91b` — Fix: remove duplicate delivery webhook handler from group-buy route
- `75e0bd2` — Delivery Phase 5: connect delivery vertical to main navigation (role-aware nav links)

Steps 2 and 3 were folded into earlier commits.

---

## Verticals status

### Group buy — built and verified
- All seven build steps complete
- Verification scenarios passed: dashboard, supplier CRUD, deal CRUD, publish, member join with Stripe, leave flow, abandonment cleanup, deal closure (success and failed paths), capture, pickup marking, deal completion, access control, email flows (order authorized, deal closed success, deal closed failed, pickup reminder), capture failure recovery, password reset
- Two scenarios deferred: Stripe test card capture-failure (test card behavior issue in Stripe API v2026-03-25.dahlia; recovery flow simulated manually instead)

### Delivery — live, connected to main navigation

**What's built and working:**
- Customer flow: `/delivery` restaurant listing → `/delivery/[slug]` menu browser → cart (CartProvider) → `/delivery/checkout` (Stripe, immediate capture) → `/delivery/checkout/confirmation` (live order tracker, polling)
- Stripe webhook: `POST /api/webhooks/stripe` — `payment_intent.succeeded` → `PENDING_PAYMENT → PENDING` + sets `dispatchStartedAt`; `payment_intent.payment_failed` → `CANCELLED`
- Kitchen dashboard: `/delivery/dashboard` — real-time order feed (react-query, 10s poll), accept/reject/cook/ready/cancel actions, Uber vs. internal fulfillment display, driver PIN display, dev controls in dev mode
- Driver app: `/delivery/driver` — online/offline toggle, claim order, trip flow (`/delivery/driver/orders/[id]`)
- Dispatch cron: sweeps `PENDING` orders, assigns internal drivers or escalates to Uber stub after 3-minute timeout
- Route protection: dashboard and driver layouts call `auth()` and redirect unauthenticated users to `/signin`
- Nav: "Order Food" (all users, active-highlighted under `/delivery`), "Restaurant Dashboard" (RESTAURANT_OWNER), "Driver" (COURIER)

**Deferred — required before delivery goes live:**
- Real Uber Direct API (currently a stub that simulates assignment after a delay)
- Real object storage for pickup/dropoff photo proof (currently no upload endpoint)
- GPS/live driver tracking on the customer tracker page
- Cart persistence (currently localStorage via CartProvider — clears on sign-out)
- Stripe Connect for driver payouts (currently no payout integration)
- Partner onboarding flow (`/delivery/dashboard` empty-state CTA currently links back to `/delivery` as placeholder)

**Prototype routes — candidates for future removal:**
The following directories predate the delivery vertical and contain early mock UI. They are **not linked from any live navigation** and can be deleted once confirmed no longer needed:
- `app/restaurants/` — early restaurant listing/detail prototype
- `app/menu/` — early menu view prototype
- `app/driver/` — early driver page prototype
- `app/partner/` — early partner/kitchen/management dashboard prototypes
- `app/checkout/` — early checkout prototype

### Neighbours Notes — intelligence pipeline built
- **Data sources**: CBC Ottawa RSS, Ottawa Citizen RSS, Open Ottawa road events API, Open Ottawa dev applications API
- **Pipeline**: Hourly ingest cron → Gemini 2.5 Flash summarization with risk scoring + category tagging → admin review queue
- **Admin**: `/admin/notes` review page — approve/reject with risk color coding
- **Public feed**: `/notes` with severity indicators and "Read more" source links
- **Subscriber system**: double opt-in, CASL-compliant, rate-limited; daily digest at 7am ET; urgent alerts for high-impact Safety/Weather notes
- **Business submissions**: `/notes/submit` form → admin review → "Local Business" badge on approved notes
- **Key files**: `lib/notes-intelligence.ts` (Gemini summarizer), `lib/notes-ingest.ts` (pipeline orchestration)

---

## Working conventions

When working on this project, follow these conventions:

1. **One vertical at a time.** Do not modify group-buy code while building delivery features unless explicitly required by a shared dependency (e.g., a User model change).

2. **Always commit before starting a new task.** Each meaningful chunk of work should produce a commit. This prevents the situation where multiple unrelated changes get mixed together.

3. **Verify before committing.** Run `npx tsc --noEmit` to check for type errors. Run the dev server and exercise the relevant flow.

4. **When changing the Prisma schema, generate a migration.** Use `npx prisma migrate dev --name <description>`. Never edit a deployed migration's SQL.

5. **After any schema change, restart the dev server.** Turbopack's cache can hold stale Prisma client references.

6. **Use upsert or terminal-state-revival patterns** for Order. The unique constraint `(userId, dealId)` means a fresh insert will fail if the user previously joined and left that deal.

7. **Soft-fail email sends.** Email failures (Resend errors) must never break the primary user flow. Log them and continue.

8. **No new external services without discussion.** Adding a new package or service (Cloudinary, Twilio, Mapbox, etc.) is a deliberate decision, not a default.

9. **After fixing migration issues, always verify with `npx prisma migrate status`** before committing.

---

## What NOT to do

- Do not add Cloudinary or any image upload service to group buy (locked decision: external URL paste only for MVP)
- Do not add Twilio SMS (deferred post-launch)
- Do not add OAuth providers (deferred)
- Do not add bulk pickup actions (single-action per order is the locked MVP behavior)
- Do not allow quantity editing after a member joins (they leave and rejoin)
- Do not change the locked design tokens
- Do not break the role-based access control invariants
- Do not modify shared infrastructure (Header, Footer, layout, auth config, Stripe webhook, /api/me) without checking what else depends on it
- Do not jump ahead to multiple steps in one prompt — work in defined increments and stop at the boundary
- Do not modify the Notes intelligence pipeline (`lib/notes-intelligence.ts`, `lib/notes-ingest.ts`) without testing with real Kanata inputs — prompt changes affect all four data sources simultaneously

---

## Local development

Required terminals when actively developing:

- **Window 1**: `npm run dev` (Next.js dev server on http://localhost:3000)
- **Window 2**: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (delivery webhook — handles `payment_intent.succeeded/failed` for `DeliveryOrder`; the signing secret it prints must match `STRIPE_WEBHOOK_SECRET` in `.env`)
  - For group-buy webhook testing, change the forward URL to `localhost:3000/api/stripe/webhook` instead
  - Two webhook routes exist: `/api/webhooks/stripe` (delivery) and `/api/stripe/webhook` (group buy). `stripe listen` can only forward to one at a time.
- **Window 3** (optional): `npx prisma studio` (database admin at http://localhost:5555)

Required `.env` variables:
- `DATABASE_URL`
- `AUTH_SECRET`
- `STRIPE_SECRET_KEY` (test mode `sk_test_...` for dev)
- `STRIPE_PUBLISHABLE_KEY` (test mode `pk_test_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (same value as above)
- `STRIPE_WEBHOOK_SECRET` (from `stripe listen` output, refreshed each session)
- `RESEND_API_KEY`
- `EMAIL_FROM` (for testing: `Neighbours Club <onboarding@resend.dev>`; production: verified domain)
- `CRON_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `GEMINI_API_KEY` (Google AI Studio key for Notes summarization)
- `NEIGHBOURS_CLUB_ADDRESS` (used in CASL-compliant subscriber confirmation emails)

Stripe test cards in use:
- `4242 4242 4242 4242` — universal success
- `4000 0000 0000 9995` — declines at authorization
- `4000 0000 0000 0259` — was intended for capture failure but behaves as success in the current API version

---

## Pending operational tasks (outside code)

These block public launch but not code progress:

- Stripe live-mode verification for IREN Technologies Inc.
- `neighboursclub.ca` domain registration
- Resend custom domain verification (currently using `onboarding@resend.dev`)
- Real legal pages (Terms, Privacy, Refund Policy) drafted by legal counsel — placeholders exist
- Pickup location secured in Kanata
- First three deals signed with suppliers
- Seed audience of 30–40 likely buyers committed
- Pre-launch dry run (one manual deal cycle via WhatsApp/Google Form)

---

## Working with Claude Code on this project

When starting a new Claude Code session:

1. Claude Code reads this file automatically. No need to re-explain the project basics.
2. State the specific task clearly. Reference which vertical, which step.
3. For complex work, use the Explore → Plan → Implement → Verify → Commit pattern.
4. Stop at clean checkpoints. Commit before switching tasks.
5. If correcting Claude Code more than twice on the same issue, run `/clear` and start with a sharper prompt.
6. After schema changes, always run `npx prisma generate` and restart the dev server.

---

**End of CLAUDE.md.**
