-- DropForeignKey
ALTER TABLE "processed_notes" DROP CONSTRAINT "processed_notes_rawIntelId_fkey";

-- AlterTable
ALTER TABLE "processed_notes" ADD COLUMN     "sourceUrl" TEXT;

-- AddForeignKey
ALTER TABLE "processed_notes" ADD CONSTRAINT "processed_notes_rawIntelId_fkey" FOREIGN KEY ("rawIntelId") REFERENCES "raw_intel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
