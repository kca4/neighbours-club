# Production Deployment Runbook

## Infrastructure (as of 2026-07-20)
- Vercel project (PRODUCTION): "neighbours-club-gxes" — owns domain neighborsclub.ca. This is the one to use.
- Vercel project (DUPLICATE, delete): "neighbours-club" — only has a .vercel.app URL, redundant second import of the same repo.
- Neon project (PRODUCTION): "neighbours-club" — region us-east-2 (Ohio), Postgres 17, host ep-muddy-salad-ajq8swf3. Contains real schema + data + EconParam values. THIS is the production database.
- Neon project (DUPLICATE, delete): "neighbours-club-prod" — region us-east-1, empty, created by mistake. Delete once confirmed unused.
- Domain: neighborsclub.ca (American spelling — no "u"). Product name is "Neighbours Club" (Canadian spelling). This mismatch is intentional/accepted.
- Email: Resend, domain neighborsclub.ca verified.

## Deploy method (IMPORTANT)
- Git auto-deploy (push-to-deploy) is currently BROKEN — the GitHub->Vercel webhook does not fire. Root cause not fully diagnosed; pushes do not trigger builds.
- Deploys are done manually via Vercel CLI from the repo directory: `vercel --prod`
- A Deploy Hook URL also exists (stored in [password manager]) but the CLI is the proven path.
- TODO: re-test git auto-deploy after the Pro upgrade (Hobby cron-limit rejections may have been the real cause of failed deploys — see below).

## Vercel plan: Hobby vs Pro
- Hobby plan REJECTS the app's full cron config: it allows max 2 cron jobs, daily-only schedules. The app has 6 crons including a per-minute dispatch sweep (`* * * * *`). This caused deploys to fail with: "Hobby accounts are limited to daily cron jobs."
- This is likely why NO deploy succeeded from ~June 2 onward: builds passed but deploy validation failed on the cron limit.
- PILOT REQUIRES PRO: the per-minute dispatch sweep assigns orders to couriers; daily cadence makes delivery non-functional. Pro is a hard requirement for a functional pilot, not optional.

## TEMPORARY state (revert on Pro upgrade)
- vercel.json currently has only 2 daily crons (`close-deals 0 4 * * *`, `cleanup-pending-orders 0 5 * * *`) to fit Hobby.
- The other 4 crons (`dispatch/cron-sweep`, `send-pickup-reminders`, `ingest-notes`, `send-daily-digest`) are UNSCHEDULED (routes intact, just not in vercel.json).
- Full original config saved as `vercel.json.pro-full` in the repo.
- TO RESTORE after Pro upgrade:
  ```bash
  cp vercel.json.pro-full vercel.json && rm vercel.json.pro-full
  git add -A && git commit -m "chore: restore full 6-cron schedule on Pro plan"
  git push   # then `vercel --prod` since auto-deploy may still be broken
  ```

## Database operations
- Migrations: use the DIRECT (non-pooled) Neon connection string (host WITHOUT "-pooler"), pooling toggled OFF. Pooled string breaks migrations.
  ```powershell
  $env:DATABASE_URL="<direct-url>"; npx prisma migrate deploy
  ```
- EconParam seeding: `npx tsx scripts/seed-prod-econ.ts` (idempotent, refuses localhost, won't overwrite tuned values).
- ALWAYS close the terminal after prod DB work so the prod DATABASE_URL doesn't linger.

## Known issues / pre-launch TODO
- Neon free tier SUSPENDS compute when idle → first request after idle can 500 with "Can't reach database server." **DECIDED — see "Neon cold-start strategy" section below.** Do not apply the env-var changes until the Pro upgrade redeploy.
- Stripe: still in TEST mode / live-mode verification pending. The production webhook has NEVER been tested with a real order. Both webhook endpoints (`/api/stripe/webhook` for group-buy, `/api/webhooks/stripe` for delivery) must be registered in the Stripe Dashboard once live. Each endpoint has its own signing secret — set `STRIPE_WEBHOOK_SECRET_GROUPBUY` and `STRIPE_WEBHOOK_SECRET_DELIVERY` as separate Vercel env vars (see docs/stripe-webhook-setup.md). This is the last unverified money path — do NOT take real orders until a real order settles via the real webhook.
- Env var `NEXT_PUBLIC_APP_URL` and `EMAIL_FROM` must point at neighborsclub.ca (real domain, American spelling).

## Neon cold-start strategy (decided)

**Problem:** Neon free tier suspends compute after 5 minutes idle. A suspended compute causes the first request to 500 with "Can't reach database server" (Prisma P1001).

**Decision (2026-07-20):** Apply Options A + B as free env-var changes, bundled with the Pro upgrade redeploy — not before. Primary mitigation is Option D (free, comes with Pro). C and E are reserved.

| Option | Description | Status |
|---|---|---|
| A | `&connect_timeout=15` appended to prod `DATABASE_URL` | Apply at Pro upgrade redeploy |
| B | Switch prod `DATABASE_URL` to the **pooled** endpoint hostname | Apply at Pro upgrade redeploy |
| C | Application-level retry wrapper in `lib/prisma.ts` (catches P1001, retries 2–3×) | Reserved — add only if A+B are insufficient after going live |
| D | Per-minute dispatch cron (restored on Pro) hits DB every minute; Neon's 5-min suspend threshold means the compute stays warm during any active period | **Primary mitigation — free with Pro upgrade** |
| E | Neon Launch (~$19/mo) or Scale (~$69/mo) to configure or disable suspend-on-idle | Deferred post-pilot, data-driven |

**Pro-upgrade checklist addition** — after restoring the full cron schedule, also do these steps in the same sitting:

1. In Vercel → Settings → Environment Variables → Production, update `DATABASE_URL`:
   - Change the hostname from `ep-muddy-salad-ajq8swf3.c-3.us-east-2.aws.neon.tech` to `ep-muddy-salad-ajq8swf3-pooler.c-3.us-east-2.aws.neon.tech` (add `-pooler` before the region segment).
   - Append `&connect_timeout=15` to the connection string (after the existing `?sslmode=require`).
   - Result: `postgresql://...@ep-muddy-salad-ajq8swf3-pooler.c-3.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=15`
2. Run `vercel --prod` to deploy with the new env var.
3. Verify neighborsclub.ca loads and reaches the DB (sign in, check the CP badge, load a deal).

> **MIGRATIONS STILL USE THE DIRECT URL.** The pooled hostname change above is for app runtime only. When running `prisma migrate deploy`, always supply the direct (non-pooled) connection string as shown in the "Database operations" section above.

## Pending post-deploy tasks

- **CP ÷2 rescale + partial waiver (commit b552798):** after next `vercel --prod`, run `scripts/one-time/rescale-cp-2026-08.sql` against prod DB (direct connection) to update EconParam rows + secret item cp_cost to the new scale. `group_buy_reward` ships with code. Verify with the SELECT statements in the SQL file.

## Deploy checklist (for reference)
1. Ensure migrations applied to prod DB (`prisma migrate deploy`, direct URL)
2. Ensure EconParam seeded
3. `vercel --prod` (from repo dir; answer "no" to pulling env vars into .env.local)
4. Verify neighborsclub.ca loads and shows current build (CP badge present)
