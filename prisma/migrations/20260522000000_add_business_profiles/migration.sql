-- CreateTable BusinessProfile
CREATE TABLE "business_profiles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "phone" TEXT,
    "description" TEXT NOT NULL,
    "offerDetails" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_profiles_slug_key" ON "business_profiles"("slug");

-- CreateIndex
CREATE INDEX "business_profiles_slug_idx" ON "business_profiles"("slug");

-- Add businessProfileId FK to business_submissions
ALTER TABLE "business_submissions" ADD COLUMN "businessProfileId" TEXT;

-- CreateIndex
CREATE INDEX "business_submissions_businessProfileId_idx" ON "business_submissions"("businessProfileId");

-- AddForeignKey
ALTER TABLE "business_submissions" ADD CONSTRAINT "business_submissions_businessProfileId_fkey"
    FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add businessProfileId FK to processed_notes
ALTER TABLE "processed_notes" ADD COLUMN "businessProfileId" TEXT;

-- CreateIndex
CREATE INDEX "processed_notes_businessProfileId_idx" ON "processed_notes"("businessProfileId");

-- AddForeignKey
ALTER TABLE "processed_notes" ADD CONSTRAINT "processed_notes_businessProfileId_fkey"
    FOREIGN KEY ("businessProfileId") REFERENCES "business_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
