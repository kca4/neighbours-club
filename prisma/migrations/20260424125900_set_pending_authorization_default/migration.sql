-- AlterTable: update the default now that the enum value is committed
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_AUTHORIZATION';
