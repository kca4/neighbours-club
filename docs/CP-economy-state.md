# CP Economy — Current State

**Generated from:** `lib/cp/`, `prisma/schema.prisma`, `lib/delivery/settlement.ts`, `app/api/cron/close-deals/`  
**Last updated:** 2026-06-13  
**Status:** Pilot-ready foundation. Measurement-only Φ governor. Three sinks live; two faucets live.

---

## 1. Schema layer

### Wallet (`wallets`)
```
id        String   @id @default(cuid())
userId    String   @unique
balanceCP Int      @default(0)    ← cached; ledger is the authority
createdAt DateTime
updatedAt DateTime
```
- Created lazily via `getOrCreateWallet()` — concurrent-safe upsert.
- `balanceCP` is a denormalized cache. `reconcileWallet()` can recompute it from the ledger at any time.

### WalletLedger (`wallet_ledger`)
```
id          String   @id @default(cuid())
walletId    String
amount      Int      ← positive = earn, negative = burn
reason      String   ← CPReason enum value
referenceId String
createdAt   DateTime

@@unique([walletId, referenceId, reason])   ← idempotency gate
@@index([walletId])
@@index([walletId, createdAt])
```
- Append-only. No rows are ever updated or deleted.
- The `@@unique` is the idempotency gate for every earn/burn call. A duplicate call returns `{ deduped: true }`; the balance is not changed twice.
- `0-amount` rows ARE written by the content faucet when caps are exhausted — they anchor the idempotency constraint and count toward the daily `n` cursor.

### EconParam (`econ_params`)
Flat key/value table. All `[TUNABLE]` economy values live here so they can be changed without a redeploy. Read via `lib/cp/econ-params.ts` (server-only, typed `EconParamKey` union, in-code fallbacks).

---

## 2. Code module map

| File | Guard | Purpose |
|---|---|---|
| `lib/cp/core.ts` | none | `earnCP`, `burnCP`, `reconcileWallet`, `getOrCreateWallet` — usable from Node scripts |
| `lib/cp/index.ts` | `server-only` | Re-exports core + content-faucet + phi — the ONLY sanctioned app import path |
| `lib/cp/content-faucet.ts` | `server-only` | `earnVerifiedReadCP` — diminishing curve + caps, SELECT…FOR UPDATE atomicity |
| `lib/cp/faucet-math.ts` | none | Pure math: `contentFaucetAmount`, `getMidnightUTC`, `getWeekStartUTC`, `clampToCap`, `computePhi`, `PHI_DEFAULT_WINDOW_DAYS`, `ADMIN_ADJUSTMENT_REASONS` |
| `lib/cp/phi.ts` | `server-only` | `measurePhi` — rolling-window Φ aggregation, read-only |
| `lib/cp/econ-params.ts` | `server-only` | `getEconParam`, `getAllEconParams` — typed EconParam reader with fallbacks |
| `lib/cp/wallet-view.ts` | `server-only` | `getMyWalletView`, `getWalletBalance` — auth-gated wallet reads for UI |
| `lib/cp/rewards.ts` | none | `CP_REWARDS` constant map — single source of truth for reward amounts |
| `lib/cp/types.ts` | none | `CPReason`, `CPResult`, `EarnCPParams`, `BurnCPParams`, `ReconcileResult`, `InsufficientBalanceError` |
| `lib/cp/labels.ts` | none | `CP_REASON_LABELS`, `formatReason` — human-readable ledger labels for UI |

---

## 3. Reason vocabulary (CPReason — closed union)

| Reason | Direction | Status | Description |
|---|---|---|---|
| `verified_read` | earn | **LIVE** — content faucet | Member verified a published Note; diminishing curve |
| `group_buy_reward` | earn | **LIVE** — wired in close-deals cron | Capture successful; 330 CP per order |
| `delivery_fee_waiver` | burn | **LIVE** — wired in settlement | Waive delivery fee at checkout; cost stored on DeliveryOrder |
| `secret_menu_redeem` | burn | **LIVE** — schema + order fields; settlement path exists | Unlock a secret menu item at checkout |
| `tier_bridge` | earn | **NOT YET WIRED** — reason declared, no call site | Member's order pushed a group-buy to the next tier |
| `signup_bonus` | earn | **NOT YET WIRED** — reason declared, no call site | One-time welcome grant on first sign-in |
| `donation` | burn | **NOT YET WIRED** — reason declared, no call site | Member donates CP to a community fund (civic sink) |
| `manual_grant` | earn | **Dev/admin only** — excluded from structural Φ | Scripts and admin one-offs; `ADMIN_ADJUSTMENT_REASONS` set |

---

## 4. Faucets

### 4a. Content faucet (`verified_read`) — LIVE
**Entry point:** `earnVerifiedReadCP({ userId, noteId })`

**Curve (pilot EconParam values):**

| Read # in window | EconParam key | Pilot value (CP) |
|---|---|---|
| 1st | `content_faucet_read_1` | 100 |
| 2nd | `content_faucet_read_2` | 33 |
| 3rd–5th | `content_faucet_read_3to5` | 8 each |
| 6th+ | — | 0 (row still written) |

**Daily cap:** `content_faucet_daily_cap` = 185 CP  
**Daily total earn backstop:** `daily_total_earn_cap` = 650 CP  
**Weekly total earn backstop:** `weekly_total_earn_cap` = 2600 CP  
**Cap reset timezone:** `cap_reset_timezone` = `America/Toronto`

**Atomicity:** `SELECT … FOR UPDATE` on the wallet row serialises concurrent calls — the second caller blocks until the first commits, then reads the true post-commit COUNT. Prevents two simultaneous first-reads both seeing `n=0` and double-minting.

**ReferenceId namespace:** `verified_read:{userId}:{noteId}` — per-user, per-note.

### 4b. Group buy reward (`group_buy_reward`) — LIVE
**Entry point:** `vestGroupBuyReward()` in `app/api/cron/close-deals/route.ts`

**Amount:** `CP_REWARDS.group_buy_reward` = 330 CP per captured order

**Triggered:** Branch A (threshold met + capture succeeded), including the self-healing path where the cron enters via `isAlreadyCaptured`.

**ReferenceId:** `group_buy_reward:{orderId}`

**Error handling:** An `earnCP` error on vesting logs clearly but does NOT abort the cron or affect the already-committed capture. The vest self-heals on the next cron run.

### 4c. Not yet wired
- `tier_bridge` — reason declared in `CPReason`, no call site built
- `signup_bonus` — reason declared, no call site
- `referral_verified` — mentioned in Tokenomics Spec §3, not yet in `CPReason`
- `merchant_bounty` — mentioned in Tokenomics Spec §3, not yet in `CPReason`

---

## 5. Sinks

### 5a. Delivery fee waiver (`delivery_fee_waiver`) — LIVE
**Entry point:** `settleDeliveryPayment()` in `lib/delivery/settlement.ts`

**Trigger:** Stripe `payment_intent.succeeded` webhook → settlement function.

**Flow:**
1. At checkout, user elects to waive the delivery fee.
2. `DeliveryOrder` is created with `cpWaiverApplied=true`, `cpWaiverCost={CP units}`, `cpWaivedAmount={$ amount}`, `cpWaiverSettled=false`.
3. After Stripe confirms payment, `settleDeliveryPayment` calls `burnCP({ reason: 'delivery_fee_waiver', referenceId: 'delivery_fee_waiver:{orderId}' })`.
4. On success: `cpWaiverSettled=true`.
5. On `InsufficientBalanceError` (rare race): order proceeds at discounted price; `cpWaiverSettled` stays false for manual reconciliation; NOT a fatal error.

**Rate:** `$0.01/CP` (`cp_to_dollar_rate` = 1). Fee dollar amount divided by rate = CP cost.

### 5b. Secret menu redemption (`secret_menu_redeem`) — SCHEMA LIVE, settlement path exists
**Schema fields on DeliveryOrder:** `cpRedemptionSettled`, `redemptionKey` (unique, cleared on terminal state)

`redemptionKey` is set to `{orderId}:{itemId}` when a draft order with a secret item is in `PENDING_PAYMENT`. The Postgres unique index on `redemptionKey` (NULLs don't collide) enforces one live draft per (user × secret item).

**Settlement:** The webhook / settlement path checks `cpRedemptionSettled` and calls `burnCP` with `reason: 'secret_menu_redeem'`. Implementation is in the delivery checkout and settlement layer.

**CP cost:** Defined per `MenuItem.cpCost` (seed: 1000 CP for Chef's Off-Menu Tasting Plate). `MenuItem.price = 0` for CP-only items (no fiat charge).

### 5c. Not yet wired
- `donation` — civic sink; requires a funded `CivicCampaign` model and disbursement plumbing. Ships behind a disabled gate pending real budget sign-off.

---

## 6. Φ inflation governor

**Status: MEASUREMENT ONLY. Throttle NOT active (Spec §13 #4).**

**Definition:** Φ = Σ emitted / Σ burned, rolling window, all wallets.

**Two signals:**
- **`structuralPhi`** (primary): `positive ledger entries EXCLUDING ADMIN_ADJUSTMENT_REASONS / |negative ledger entries|`. Admin grants (`manual_grant`) do not inflate this signal.
- **`phi`** (raw / secondary): all positive entries / |all negative entries|. For reconciliation only.

**Window:** `PHI_DEFAULT_WINDOW_DAYS` = 7 days, midnight-aligned in `America/Toronto`. One windowing convention shared with daily/weekly caps.

**Thresholds (EconParam):**

| Key | Pilot value | Meaning |
|---|---|---|
| `phi_target_low` | 0.9 | Lower healthy bound |
| `phi_target_high` | 1.1 | Upper healthy bound |
| `phi_alarm_threshold` | 1.15 | Alarm — throttle would engage here if active |

**Admin page:** `app/admin/economy/page.tsx` — live Φ dashboard showing structural + raw Φ, window bounds, target band. Prominent banner: "Throttle is NOT active — measurement only."

**Throttle enable:** Requires explicit sign-off on Spec §13 #4. Do not enable speculatively. Promote `PHI_DEFAULT_WINDOW_DAYS` to an `EconParamKey` first (one commit, once calibrated on real data).

**`ADMIN_ADJUSTMENT_REASONS` set:** `{ 'manual_grant' }` — maintained in `lib/cp/faucet-math.ts`. Add any new admin-adjustment reasons here deliberately to keep structural Φ clean.

---

## 7. EconParam keys (full table)

| Key | Pilot value | In-code fallback |
|---|---|---|
| `content_faucet_read_1` | 100 | 100 |
| `content_faucet_read_2` | 33 | 33 |
| `content_faucet_read_3to5` | 8 | 8 |
| `content_faucet_daily_cap` | 185 | 185 |
| `daily_total_earn_cap` | 650 | 650 |
| `weekly_total_earn_cap` | 2600 | 2600 |
| `phi_target_low` | 0.9 | 0.9 |
| `phi_target_high` | 1.1 | 1.1 |
| `phi_alarm_threshold` | 1.15 | 1.15 |
| `cap_reset_timezone` | America/Toronto | America/Toronto |
| `note_high_risk_threshold` | 5 | 5 |
| `cp_to_dollar_rate` | 1 | 1 |

Note: `cp_to_dollar_rate = 1` means 1 CP = $0.01. The rate is a committed decision, not a placeholder.

---

## 8. UI surface

| Route | What it shows |
|---|---|
| `app/wallet/page.tsx` | Member wallet view: balance + last 50 ledger rows |
| `app/admin/economy/page.tsx` | Admin Φ monitor: structural + raw Φ, target band, admin adjustment gap |
| Header badge | `getWalletBalance(userId)` — lightweight single-column read |

---

## 9. Tests

| File | Coverage |
|---|---|
| `lib/cp/__tests__/faucet-math.test.ts` | `contentFaucetAmount`, `getMidnightUTC`, `getWeekStartUTC`, `clampToCap`, `computePhi` — pure math, no mocks |
| `lib/cp/__tests__/phi.test.ts` | Φ computation, `ADMIN_ADJUSTMENT_REASONS`, structural vs raw split |

Integration tests (idempotency under retry, cap-clamp end-to-end, burnCP overdraft guard) are in `docs/code-sketches/lib/cp/__tests__/` as reference implementations but not yet wired into the test runner.

---

## 10. Known gaps / open decisions

| Gap | Notes |
|---|---|
| `tier_bridge` not wired | Requires deal-tier logic change to detect tier-crossing at join time |
| `signup_bonus` not wired | One call site in signup route; straightforward add |
| Civic sink (`donation`) disabled | Requires real funded campaign and match budget sign-off |
| Φ throttle not active | Intentional — observe first, enforce later |
| `PHI_DEFAULT_WINDOW_DAYS` hardcoded | Promote to EconParam after first calibration run |
| `merchant_bounty` + `referral_verified` | Not yet in `CPReason` — add only when the backing mechanism exists |
| Secret menu settlement audit | `cpRedemptionSettled=false` rows need a periodic sweep or admin alert |
