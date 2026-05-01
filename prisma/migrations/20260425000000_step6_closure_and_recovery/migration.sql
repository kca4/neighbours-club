-- AlterTable: add closingProcessedAt to Deal
ALTER TABLE "Deal" ADD COLUMN "closingProcessedAt" TIMESTAMP(3);

-- AlterTable: add recoveryToken to Order
ALTER TABLE "Order" ADD COLUMN "recoveryToken" TEXT;

-- CreateIndex: unique constraint on recoveryToken
CREATE UNIQUE INDEX "Order_recoveryToken_key" ON "Order"("recoveryToken");
