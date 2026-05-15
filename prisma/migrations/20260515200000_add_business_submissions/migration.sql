-- Add Business to NoteCategory enum
ALTER TYPE "NoteCategory" ADD VALUE 'Business';

-- Create SubmissionStatus enum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Create NoteSourceType enum
CREATE TYPE "NoteSourceType" AS ENUM ('EDITORIAL', 'BUSINESS_SUBMISSION');

-- Make rawIntelId optional on processed_notes
ALTER TABLE "processed_notes" ALTER COLUMN "rawIntelId" DROP NOT NULL;

-- Add sourceType column to processed_notes
ALTER TABLE "processed_notes" ADD COLUMN "sourceType" "NoteSourceType" NOT NULL DEFAULT 'EDITORIAL';

-- CreateTable BusinessSubmission
CREATE TABLE "business_submissions" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "offerDetails" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,

    CONSTRAINT "business_submissions_pkey" PRIMARY KEY ("id")
);
