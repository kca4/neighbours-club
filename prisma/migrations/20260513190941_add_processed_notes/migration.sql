/*
  Warnings:

  - A unique constraint covering the columns `[stripePaymentIntentId]` on the table `DeliveryOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "NoteCategory" AS ENUM ('Transit', 'DevApp', 'Safety', 'Social', 'Cost', 'Weather', 'Other');

-- DropForeignKey
ALTER TABLE "DeliveryOrder" DROP CONSTRAINT "DeliveryOrder_driverId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryOrder" DROP CONSTRAINT "DeliveryOrder_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "DeliveryOrder" DROP CONSTRAINT "DeliveryOrder_userId_fkey";

-- DropForeignKey
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_restaurantId_fkey";

-- DropForeignKey
ALTER TABLE "NeighbourhoodWaitlist" DROP CONSTRAINT "NeighbourhoodWaitlist_neighbourhoodId_fkey";

-- DropForeignKey
ALTER TABLE "NeighbourhoodWaitlist" DROP CONSTRAINT "NeighbourhoodWaitlist_userId_fkey";

-- DropForeignKey
ALTER TABLE "NoteReaction" DROP CONSTRAINT "NoteReaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "NotesSubscriber" DROP CONSTRAINT "NotesSubscriber_userId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerApplication" DROP CONSTRAINT "PartnerApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "SavedNote" DROP CONSTRAINT "SavedNote_userId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_neighbourhoodId_fkey";

-- AlterTable
ALTER TABLE "DeliveryOrder" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MenuItem" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "tags" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Neighbourhood" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NeighbourhoodWaitlist" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NoteReaction" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NotesSubscriber" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PartnerApplication" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Restaurant" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SavedNote" ALTER COLUMN "id" DROP DEFAULT;

-- CreateTable
CREATE TABLE "processed_notes" (
    "id" TEXT NOT NULL,
    "rawIntelId" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "streetOrArea" TEXT NOT NULL,
    "category" "NoteCategory" NOT NULL,
    "impactSafety" INTEGER NOT NULL,
    "impactCost" INTEGER NOT NULL,
    "impactTime" INTEGER NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "autoPublishEligible" BOOLEAN NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processed_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "processed_notes_rawIntelId_key" ON "processed_notes"("rawIntelId");

-- CreateIndex
CREATE INDEX "User_neighbourhoodId_idx" ON "User"("neighbourhoodId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteReaction" ADD CONSTRAINT "NoteReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotesSubscriber" ADD CONSTRAINT "NotesSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedNote" ADD CONSTRAINT "SavedNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerApplication" ADD CONSTRAINT "PartnerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeighbourhoodWaitlist" ADD CONSTRAINT "NeighbourhoodWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeighbourhoodWaitlist" ADD CONSTRAINT "NeighbourhoodWaitlist_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_notes" ADD CONSTRAINT "processed_notes_rawIntelId_fkey" FOREIGN KEY ("rawIntelId") REFERENCES "raw_intel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "NeighbourhoodWaitlist_email_neighbourhood_key" RENAME TO "NeighbourhoodWaitlist_email_neighbourhoodId_key";

-- RenameIndex
ALTER INDEX "PartnerApplication_status_idx" RENAME TO "PartnerApplication_overallStatus_idx";

-- RenameIndex
ALTER INDEX "Restaurant_neighbourhood_active_idx" RENAME TO "Restaurant_neighbourhoodId_isActive_idx";
