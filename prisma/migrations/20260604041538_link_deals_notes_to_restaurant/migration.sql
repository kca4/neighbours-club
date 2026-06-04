-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "restaurantId" TEXT;

-- AlterTable
ALTER TABLE "processed_notes" ADD COLUMN     "restaurantId" TEXT;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processed_notes" ADD CONSTRAINT "processed_notes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
