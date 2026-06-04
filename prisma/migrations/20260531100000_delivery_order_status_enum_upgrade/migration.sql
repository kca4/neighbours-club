-- Migration: delivery-order-status-enum-upgrade
--
-- Replaces the lowercase DeliveryOrderStatus enum with UPPERCASE values,
-- adds FulfillmentType enum, and adds fulfillment/cancellation fields.
--
-- Dev data only: existing DeliveryOrder rows are test orders and are cleared
-- before the enum change so the USING cast never encounters old values.

-- 1. Clear dev-only test orders
DELETE FROM "DeliveryOrder";

-- 2. Drop the column default (which holds a reference to the old enum type)
ALTER TABLE "DeliveryOrder" ALTER COLUMN "status" DROP DEFAULT;

-- 3. Temporarily convert status column to TEXT so we can swap the enum type
ALTER TABLE "DeliveryOrder" ALTER COLUMN "status" TYPE TEXT;

-- 4. Drop the old enum (now safe — no column or default references it)
DROP TYPE "DeliveryOrderStatus";

-- 5. Create the new UPPERCASE enum
CREATE TYPE "DeliveryOrderStatus" AS ENUM (
  'PENDING_PAYMENT',
  'PENDING',
  'ACCEPTED',
  'AWAITING_COURIER',
  'COURIER_ASSIGNED',
  'COOKING',
  'READY',
  'PICKED_UP',
  'DELIVERED',
  'CANCELLED'
);

-- 6. Create FulfillmentType enum
DO $$ BEGIN
  CREATE TYPE "FulfillmentType" AS ENUM ('INTERNAL', 'UBER_DIRECT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 7. Re-apply the enum type to the status column (table is empty — no USING cast needed)
ALTER TABLE "DeliveryOrder"
  ALTER COLUMN "status" TYPE "DeliveryOrderStatus"
    USING "status"::"DeliveryOrderStatus",
  ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT'::"DeliveryOrderStatus";

-- 8. Add new fields
ALTER TABLE "DeliveryOrder"
  ADD COLUMN IF NOT EXISTS "fulfillmentType"     "FulfillmentType" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN IF NOT EXISTS "pickupPin"            TEXT,
  ADD COLUMN IF NOT EXISTS "cancellationReason"   TEXT,
  ADD COLUMN IF NOT EXISTS "needsAdminReview"     BOOLEAN NOT NULL DEFAULT false;
