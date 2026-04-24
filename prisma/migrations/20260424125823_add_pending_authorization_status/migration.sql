-- AlterEnum: add the new value (must commit before the default change can reference it)
ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_AUTHORIZATION';
