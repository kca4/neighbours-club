-- AlterTable: MenuItem — add secret menu fields
ALTER TABLE "MenuItem"
  ADD COLUMN "isSecret" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "cpCost"   INTEGER;

-- AlterTable: DeliveryOrder — add CP redemption tracking + concurrency guard
ALTER TABLE "DeliveryOrder"
  ADD COLUMN "cpRedemptionSettled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "redemptionKey"       TEXT;

-- CreateIndex: unique constraint for redemptionKey (NULLs don't collide in Postgres)
CREATE UNIQUE INDEX "DeliveryOrder_redemptionKey_key" ON "DeliveryOrder"("redemptionKey");
