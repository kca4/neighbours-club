-- AlterTable
ALTER TABLE "processed_notes" ADD COLUMN "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "processed_notes_slug_key" ON "processed_notes"("slug");
