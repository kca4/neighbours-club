-- AlterTable: add captureBeforeAt to Order
ALTER TABLE "Order" ADD COLUMN "captureBeforeAt" TIMESTAMP(3);

-- AlterTable: add qstashMessageId to Deal
ALTER TABLE "Deal" ADD COLUMN "qstashMessageId" TEXT;
