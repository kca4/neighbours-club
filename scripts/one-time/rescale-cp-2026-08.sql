-- scripts/one-time/rescale-cp-2026-08.sql
--
-- ONE-TIME production migration: CP economy ÷2 rescale + partial delivery-fee waiver
-- Date: 2026-08-04
-- Deployed with: feat(economy): halve CP scale + partial delivery-fee waiver
--
-- SAFE TO RUN: all statements are idempotent (UPDATE by PK / known name).
-- Run manually against the Neon prod DB after deploying the above commit.
-- Do NOT re-run the seed-prod-econ.ts script — its `update` block intentionally
-- skips overwriting `value`, so these rows would not be updated by it.
--
-- group_buy_reward (165) is a code constant in lib/cp/rewards.ts — no DB row,
-- ships automatically with the deploy. No SQL needed for it.
--
-- Prerequisite balance check (run first, expect 0 rows):
--   SELECT u.email, w.balance_cp
--   FROM "Wallet" w
--   JOIN "User" u ON u.id = w.user_id
--   WHERE w.balance_cp > 0;
--
-- ─── EconParam rows ───────────────────────────────────────────────────────────

UPDATE econ_params SET value = '50',   updated_at = NOW() WHERE key = 'content_faucet_read_1';
UPDATE econ_params SET value = '16',   updated_at = NOW() WHERE key = 'content_faucet_read_2';
UPDATE econ_params SET value = '4',    updated_at = NOW() WHERE key = 'content_faucet_read_3to5';
UPDATE econ_params SET value = '92',   updated_at = NOW() WHERE key = 'content_faucet_daily_cap';
UPDATE econ_params SET value = '325',  updated_at = NOW() WHERE key = 'daily_total_earn_cap';
UPDATE econ_params SET value = '1300', updated_at = NOW() WHERE key = 'weekly_total_earn_cap';

-- ─── Chef's Off-Menu Tasting Plate (MenuItem → "items" table) ─────────────────

UPDATE items
   SET cp_cost    = 500,
       updated_at = NOW()
 WHERE is_secret = true
   AND name = 'Chef''s Off-Menu Tasting Plate';

-- ─── Verification queries (run after to confirm) ──────────────────────────────

SELECT key, value
  FROM econ_params
 WHERE key IN (
   'content_faucet_read_1',
   'content_faucet_read_2',
   'content_faucet_read_3to5',
   'content_faucet_daily_cap',
   'daily_total_earn_cap',
   'weekly_total_earn_cap'
 )
 ORDER BY key;

-- Expected:
--   content_faucet_daily_cap  | 92
--   content_faucet_read_1     | 50
--   content_faucet_read_2     | 16
--   content_faucet_read_3to5  | 4
--   daily_total_earn_cap      | 325
--   weekly_total_earn_cap     | 1300

SELECT name, cp_cost
  FROM items
 WHERE is_secret = true;

-- Expected:
--   Chef's Off-Menu Tasting Plate | 500
