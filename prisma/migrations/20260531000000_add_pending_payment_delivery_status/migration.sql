-- AlterEnum
ALTER TYPE "DeliveryOrderStatus" ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'pending';
