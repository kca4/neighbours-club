-- Add sentAt column to processed_notes
ALTER TABLE "processed_notes" ADD COLUMN "sentAt" TIMESTAMP(3);

-- Add unique index on DeliveryOrder.stripePaymentIntentId (may already exist)
CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryOrder_stripePaymentIntentId_key" ON "DeliveryOrder"("stripePaymentIntentId");
