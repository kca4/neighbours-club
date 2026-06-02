-- AlterTable: add courier job tracking fields to DeliveryOrder
ALTER TABLE "DeliveryOrder"
  ADD COLUMN "courierJobId" TEXT,
  ADD COLUMN "courierRequestedAt" TIMESTAMP(3);
