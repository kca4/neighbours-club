-- CreateEnum
CREATE TYPE "CorrectionStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NoteStatus" ADD VALUE 'REJECTED';
ALTER TYPE "NoteStatus" ADD VALUE 'CORRECTED';
ALTER TYPE "NoteStatus" ADD VALUE 'RETRACTED';
ALTER TYPE "NoteStatus" ADD VALUE 'BLOCKED_NEEDS_FRAMEWORK';

-- AlterTable
ALTER TABLE "processed_notes" ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "sourceIngestedAt" TIMESTAMP(3),
ADD COLUMN     "sourcePublisher" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "note_corrections" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "requesterContact" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "status" "CorrectionStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "reply" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "note_versions" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedBy" TEXT,
    "changeReason" TEXT,
    "riskScoreAtVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_corrections_noteId_idx" ON "note_corrections"("noteId");

-- CreateIndex
CREATE INDEX "note_corrections_status_idx" ON "note_corrections"("status");

-- CreateIndex
CREATE INDEX "note_versions_noteId_idx" ON "note_versions"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "note_versions_noteId_versionNumber_key" ON "note_versions"("noteId", "versionNumber");

-- AddForeignKey
ALTER TABLE "note_corrections" ADD CONSTRAINT "note_corrections_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "processed_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_versions" ADD CONSTRAINT "note_versions_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "processed_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
