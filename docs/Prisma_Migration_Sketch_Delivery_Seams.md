# Prisma Migration Sketch — Foundation-First (greenfield)

**Project:** Neighbours Club
**Status:** Draft for review
**Supersedes:** the earlier "Delivery Vertical Seams" sketch (stub/soft-ref approach)
**Why revised:** Group Buy and Notes are greenfield (no users/data), single-owner, freely
modifiable. The stubbed-seams approach existed only to avoid touching other verticals — that
constraint is dropped, so we build the CP ledger as a real foundation and use real foreign
keys.

---

## 0. What changed from the seams version, and the one thing that didn't

**Changed:** no no-op `CpPort` stub; no soft string references where a real relation belongs.
`DeliveryOrder` now points at `Deal` and at the waiving `WalletLedger` entry via real FKs,
because both ends are concrete tables we own.

**Didn't change — and shouldn't:** `WalletLedger.referenceId` stays a plain `String`. It is
**polymorphic** — it points at a note id, a deal id, or an order id depending on why the
entry exists — so it cannot be a single FK. That was never convention-avoidance; it's the
correct design for a cross-vertical ledger, and it's what makes the
`@@unique([walletId, referenceId, reason])` idempotency guard work across every vertical.

**Build order (foundation-first):** Migration 1 (CP ledger) → Migration 2 (Group Buy
economics) → Migration 3 (Delivery integration). Each lands as its own commit.

---

## 1. Migration 1 — CP ledger foundation (the spine)

Everything downstream (note faucet, group-buy reward, delivery fee-waiver, civic sink) writes
here. The ledger is **append-only**: no updates, no deletes — it's the audit record.

```prisma
enum LedgerReason {
  VERIFIED_READ
  GROUP_BUY_REWARD
  MERCHANT_BOUNTY
  REFERRAL_VERIFIED
  DELIVERY_FEE_WAIVER
  SECRET_REDEMPTION
  MERCHANT_BOOST
  CIVIC_PLEDGE
}

enum CivicCampaignStatus {
  DRAFT
  ACTIVE
  FUNDED
  DISBURSED
  CANCELLED
}

model WalletLedger {
  id          String       @id @default(cuid())
  walletId    String                              // → user's wallet
  amountCp    Int                                 // signed: + mint, − burn
  reason      LedgerReason
  referenceId String                              // POLYMORPHIC soft ref (noteId/dealId/orderId)
  epochId     String?                             // for Φ + cap windows (Tokenomics §7)
  createdAt   DateTime     @default(now())

  @@unique([walletId, referenceId, reason])       // idempotency guard (Tokenomics §2)
  @@index([walletId])
  @@index([epochId])
}

model EconParam {                                 // all [TUNABLE] values as config, not redeploys
  key       String  @id
  valueJson Json
  updatedAt DateTime @updatedAt
}

model CivicCampaign {                             // real-dollar civic sink (Tokenomics §10)
  id                   String              @id @default(cuid())
  name                 String
  recipientOrg         String
  targetDollarsCents   Int
  matchBudgetCents     Int
  cpToDollarRateCents  Int                          // disclosed CP→$ rate
  cpRaised             Int                 @default(0)
  status               CivicCampaignStatus @default(DRAFT)
  disbursedAt          DateTime?
  disbursementProofUrl String?
}
```

Representative SQL for the ledger table + guard:

```sql
CREATE TYPE "LedgerReason" AS ENUM
  ('VERIFIED_READ','GROUP_BUY_REWARD','MERCHANT_BOUNTY','REFERRAL_VERIFIED',
   'DELIVERY_FEE_WAIVER','SECRET_REDEMPTION','MERCHANT_BOOST','CIVIC_PLEDGE');

CREATE TABLE "WalletLedger" (
  "id"          TEXT PRIMARY KEY,
  "walletId"    TEXT NOT NULL,
  "amountCp"    INTEGER NOT NULL,
  "reason"      "LedgerReason" NOT NULL,
  "referenceId" TEXT NOT NULL,
  "epochId"     TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "WalletLedger_wallet_ref_reason_key"
  ON "WalletLedger"("walletId","referenceId","reason");
CREATE INDEX "WalletLedger_walletId_idx" ON "WalletLedger"("walletId");
CREATE INDEX "WalletLedger_epochId_idx"  ON "WalletLedger"("epochId");
```

All mint/burn flows through `lib/cp/index.ts` (`server-only`). Φ ships **measurement-only**
(Tokenomics §7 Rule 5) — computed and dashboarded, throttle disabled.

---

## 2. Migration 2 — Group Buy economics (modify `Deal` directly)

Now permitted to edit the Group Buy vertical. Adds the merchant-floor guardrail and the
bounty fields from the Group Buy Merchant Economics Spec.

```prisma
model Deal {
  // ─── existing fields unchanged ───
  id                  String     @id @default(cuid())
  // ... status, close time, restaurant relation, etc. ...

  // ─── economics (Group Buy Spec §3, §8) ───
  floorPriceCents     Int                          // merchant's hard floor F; no tier below this
  minParticipants     Int                          // T_min
  maxCapacity         Int                          // T_cap (real kitchen limit)
  slowWindowStart     DateTime
  slowWindowEnd       DateTime
  merchantTakeRateBps Int        @default(1000)     // 10% default, per-deal override
  merchantBountyCp    Int?                          // optional, merchant-funded
  merchantBountyFunded Boolean   @default(false)

  tiers               DealTier[]
  payouts             MerchantPayout[]
}

model DealTier {
  id                    String @id @default(cuid())
  dealId                String
  deal                  Deal   @relation(fields: [dealId], references: [id], onDelete: Cascade)
  tierOrder             Int
  thresholdParticipants Int
  unitPriceCents        Int                          // MUST be ≥ deal.floorPriceCents
}

model MerchantPayout {
  id                String   @id @default(cuid())
  dealId            String
  deal              Deal     @relation(fields: [dealId], references: [id])
  unitsSold         Int
  grossCents        Int
  takeCents         Int
  bountyCostCents   Int
  netToMerchantCents Int
  status            String
  paidAt            DateTime?
}
```

**Floor enforcement — a DB honesty note.** Postgres `CHECK` constraints can't reference
another table's column, so `unitPriceCents ≥ Deal.floorPriceCents` **cannot** be a simple
column check. Enforce it in the deal-creation service (reject the whole deal if any tier
violates the floor), and optionally back it with a trigger for defense-in-depth. Treat it as
a hard validation, not a warning (Group Buy Spec §3).

`onDelete: Cascade` on tiers is fine (tiers are owned by the deal). Payouts are an audit
record — don't cascade-delete those.

---

## 3. Migration 3 — Delivery integration (real FKs)

Now the Delivery vertical references real tables instead of stubs.

```prisma
enum DeliveryOrderOrigin {
  STANDARD
  GROUP_BUY
}

model DeliveryOrder {
  // ─── existing fields ───
  id                    String   @id @default(cuid())
  userId                String
  restaurantId          String
  status                String
  items                 Json
  stripePaymentIntentId String?

  // ─── origin (REAL FK to Deal now) ───
  origin                DeliveryOrderOrigin @default(STANDARD)
  sourceDealId          String?
  sourceDeal            Deal?    @relation(fields: [sourceDealId], references: [id], onDelete: SetNull)

  // ─── itemized pricing (honest pricing + waiver math) ───
  subtotalCents         Int
  deliveryFeeCents      Int
  serviceFeeCents       Int
  taxCents              Int
  totalCents            Int                          // replaces opaque `total`

  // ─── CP fee-waiver (REAL FK to the burning ledger entry) ───
  feeWaiverApplied      Boolean  @default(false)
  feeWaiverLedgerId     String?  @unique
  feeWaiverLedger       WalletLedger? @relation(fields: [feeWaiverLedgerId], references: [id], onDelete: Restrict)

  @@index([sourceDealId])
  @@index([origin])
}
```

Key SQL (the FK constraints are the substantive part):

```sql
CREATE TYPE "DeliveryOrderOrigin" AS ENUM ('STANDARD','GROUP_BUY');

ALTER TABLE "DeliveryOrder"
  ADD COLUMN "origin" "DeliveryOrderOrigin" NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "sourceDealId" TEXT,
  ADD COLUMN "subtotalCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "serviceFeeCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "taxCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "totalCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "feeWaiverApplied" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "feeWaiverLedgerId" TEXT;

ALTER TABLE "DeliveryOrder"
  ADD CONSTRAINT "DeliveryOrder_sourceDealId_fkey"
    FOREIGN KEY ("sourceDealId") REFERENCES "Deal"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "DeliveryOrder_feeWaiverLedgerId_fkey"
    FOREIGN KEY ("feeWaiverLedgerId") REFERENCES "WalletLedger"("id") ON DELETE RESTRICT;

CREATE UNIQUE INDEX "DeliveryOrder_feeWaiverLedgerId_key" ON "DeliveryOrder"("feeWaiverLedgerId");
CREATE INDEX "DeliveryOrder_sourceDealId_idx" ON "DeliveryOrder"("sourceDealId");
```

`onDelete: SetNull` for the deal (an order survives if a deal record is removed);
`onDelete: Restrict` for the ledger entry (the ledger is append-only audit — you should never
be deleting the entry a real order references). If you migrated existing rows, backfill
`totalCents` from the old `total` before dropping it.

---

## 4. The CP service boundary (replaces the no-op port)

Keep an interface between Delivery and CP — that separation is good architecture regardless
of greenfield — but it's now backed by **real** logic in `lib/cp`, not a stub.

```typescript
// lib/cp/delivery.ts  (server-only; thin wrapper over burnCP)
export async function quoteFeeWaiver(walletId: string, orderId: string): Promise<{
  available: boolean; cpCost: number | null; reason?: string;
}> { /* reads EconParam cost + wallet balance; real logic */ }

export async function applyFeeWaiver(walletId: string, orderId: string): Promise<{
  ledgerId: string;
} | null> {
  // burnCP(reason=DELIVERY_FEE_WAIVER, referenceId=orderId) → returns the new ledger entry id,
  // which the caller stores in DeliveryOrder.feeWaiverLedgerId. Idempotent via the unique guard.
}
```

Checkout calls `quoteFeeWaiver` to show/hide the option, and `applyFeeWaiver` on confirm,
storing the returned `ledgerId`. Because burn is idempotent on
`(walletId, orderId, DELIVERY_FEE_WAIVER)`, a double-submit can't double-spend.

---

## 5. Tests to land with each migration

- **Ledger:** idempotent mint/burn under retry; the unique guard rejects a duplicate
  `(walletId, referenceId, reason)`; balance recomputes from entries.
- **Deal:** creation rejects any deal whose tier prices below `floorPriceCents`; Branch A/B
  settlement; payout record matches captured fiat.
- **Delivery:** standard order populates all itemized cents + `totalCents`; group-buy order
  with a real `sourceDealId` FK resolves; `applyFeeWaiver` writes a ledger entry and links it;
  double fee-waiver submit is a no-op (idempotency holds end-to-end).

---

## 6. Commit sequence

1. `feat(cp): add WalletLedger, EconParam, CivicCampaign foundation + Φ measurement`
2. `feat(groupbuy): add deal economics, merchant floor enforcement, payouts`
3. `feat(delivery): integrate CP fee-waiver and group-buy origin via FKs`

One migration per commit, in this order (dependencies flow downward). Verticals stay hidden
from main nav until the integration is stable.
