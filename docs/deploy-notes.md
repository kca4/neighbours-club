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
- Neon free tier SUSPENDS compute when idle → first request after idle can 500 with "Can't reach database server." Fix before launch: Neon always-on setting (paid) or connection-retry handling. A cold-start 500 is a bad first impression for a pilot visitor.
- Stripe: still in TEST mode / live-mode verification pending. The production webhook has NEVER been tested with a real order. Both webhook endpoints (`/api/stripe/webhook` for group-buy, `/api/webhooks/stripe` for delivery) must be registered in the Stripe Dashboard once live. This is the last unverified money path — do NOT take real orders until a real order settles via the real webhook.
- Env var `NEXT_PUBLIC_APP_URL` and `EMAIL_FROM` must point at neighborsclub.ca (real domain, American spelling).

## Deploy checklist (for reference)
1. Ensure migrations applied to prod DB (`prisma migrate deploy`, direct URL)
2. Ensure EconParam seeded
3. `vercel --prod` (from repo dir; answer "no" to pulling env vars into .env.local)
4. Verify neighborsclub.ca loads and shows current build (CP badge present)
