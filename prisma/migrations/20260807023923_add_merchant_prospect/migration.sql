-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('PROSPECT', 'CONTACTED', 'IN_DISCUSSION', 'CONFIRMED', 'DECLINED', 'PROMOTED');

-- CreateTable
CREATE TABLE "MerchantProspect" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuisine" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "source" TEXT NOT NULL,
    "externalId" TEXT,
    "sourceUrl" TEXT,
    "cluster" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'PROSPECT',
    "contactName" TEXT,
    "contactEmail" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "notes" TEXT,
    "restaurantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProspect_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProspect_restaurantId_key" ON "MerchantProspect"("restaurantId");

-- CreateIndex
CREATE INDEX "MerchantProspect_status_idx" ON "MerchantProspect"("status");

-- CreateIndex
CREATE INDEX "MerchantProspect_source_idx" ON "MerchantProspect"("source");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProspect_source_externalId_key" ON "MerchantProspect"("source", "externalId");

-- AddForeignKey
ALTER TABLE "MerchantProspect" ADD CONSTRAINT "MerchantProspect_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
