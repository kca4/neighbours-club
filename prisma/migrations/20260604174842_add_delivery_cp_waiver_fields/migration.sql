-- AlterTable
ALTER TABLE "DeliveryOrder" ADD COLUMN     "cpWaivedAmount" DECIMAL(10,2),
ADD COLUMN     "cpWaiverApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cpWaiverCost" INTEGER,
ADD COLUMN     "cpWaiverSettled" BOOLEAN NOT NULL DEFAULT false;
