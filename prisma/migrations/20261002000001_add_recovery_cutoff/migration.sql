-- AlterTable: add supplierCutoffAt to Deal
ALTER TABLE "Deal" ADD COLUMN "supplierCutoffAt" TIMESTAMP(3);

-- AlterTable: add recoveryExpiresAt to Order
ALTER TABLE "Order" ADD COLUMN "recoveryExpiresAt" TIMESTAMP(3);
