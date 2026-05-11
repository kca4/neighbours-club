-- Step 8: Add delivery, restaurant, notes, and onboarding models
-- Migration: 20260507000000_step8_delivery_restaurants_notes

-- Add new role values
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'RESTAURANT_OWNER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COURIER';

-- Add new columns to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliveryAddressLine1" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliveryAddressLine2" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliveryAddressCity" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "deliveryAddressPostal" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "neighbourhoodId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hasCompletedOnboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "restaurantId" TEXT;

-- DeliveryOrderStatus enum
DO $$ BEGIN
  CREATE TYPE "DeliveryOrderStatus" AS ENUM (
    'pending', 'accepted', 'cooking', 'ready',
    'picked_up', 'on_the_way', 'delivered', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- PartnerApplicationStatus enum
DO $$ BEGIN
  CREATE TYPE "PartnerApplicationStatus" AS ENUM (
    'in_progress', 'submitted', 'approved', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Neighbourhood
CREATE TABLE IF NOT EXISTS "Neighbourhood" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name"      TEXT NOT NULL,
  "slug"      TEXT NOT NULL,
  "city"      TEXT NOT NULL DEFAULT 'Ottawa',
  "isActive"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Neighbourhood_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Neighbourhood_name_key" ON "Neighbourhood"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Neighbourhood_slug_key" ON "Neighbourhood"("slug");
CREATE INDEX IF NOT EXISTS "Neighbourhood_slug_idx" ON "Neighbourhood"("slug");

-- Restaurant
CREATE TABLE IF NOT EXISTS "Restaurant" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid(),
  "slug"             TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "cuisine"          TEXT NOT NULL,
  "address"          TEXT NOT NULL,
  "phone"            TEXT,
  "hours"            JSONB NOT NULL DEFAULT '{}',
  "description"      TEXT,
  "ownerName"        TEXT,
  "ownerQuote"       TEXT,
  "heroImageUrl"     TEXT,
  "logoUrl"          TEXT,
  "isActive"         BOOLEAN NOT NULL DEFAULT false,
  "isPaused"         BOOLEAN NOT NULL DEFAULT false,
  "rating"           DECIMAL(3,2),
  "reviewCount"      INTEGER NOT NULL DEFAULT 0,
  "estimatedMinMin"  INTEGER NOT NULL DEFAULT 25,
  "estimatedMinMax"  INTEGER NOT NULL DEFAULT 35,
  "neighbourhoodId"  TEXT,
  "ownerId"          TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_slug_key" ON "Restaurant"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Restaurant_ownerId_key" ON "Restaurant"("ownerId");
CREATE INDEX IF NOT EXISTS "Restaurant_slug_idx" ON "Restaurant"("slug");
CREATE INDEX IF NOT EXISTS "Restaurant_neighbourhood_active_idx" ON "Restaurant"("neighbourhoodId", "isActive");

-- MenuItem
CREATE TABLE IF NOT EXISTS "MenuItem" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
  "restaurantId" TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "price"        DECIMAL(10,2) NOT NULL,
  "category"     TEXT NOT NULL,
  "tags"         TEXT[] NOT NULL DEFAULT '{}',
  "imageUrl"     TEXT,
  "colorHex"     TEXT,
  "isAvailable"  BOOLEAN NOT NULL DEFAULT true,
  "sortOrder"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MenuItem_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "MenuItem_restaurantId_category_idx" ON "MenuItem"("restaurantId", "category");

-- DeliveryOrder
CREATE TABLE IF NOT EXISTS "DeliveryOrder" (
  "id"                    TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"                TEXT NOT NULL,
  "restaurantId"          TEXT NOT NULL,
  "driverId"              TEXT,
  "items"                 JSONB NOT NULL,
  "subtotal"              DECIMAL(10,2) NOT NULL,
  "deliveryFee"           DECIMAL(10,2) NOT NULL,
  "serviceFee"            DECIMAL(10,2) NOT NULL,
  "tax"                   DECIMAL(10,2) NOT NULL,
  "tip"                   DECIMAL(10,2) NOT NULL,
  "tipPct"                INTEGER,
  "total"                 DECIMAL(10,2) NOT NULL,
  "status"                "DeliveryOrderStatus" NOT NULL DEFAULT 'pending',
  "stripePaymentIntentId" TEXT,
  "deliveryAddress"       JSONB NOT NULL,
  "driverNote"            TEXT,
  "estimatedDeliveryAt"   TIMESTAMP(3),
  "acceptedAt"            TIMESTAMP(3),
  "cookingStartedAt"      TIMESTAMP(3),
  "readyAt"               TIMESTAMP(3),
  "pickedUpAt"            TIMESTAMP(3),
  "deliveredAt"           TIMESTAMP(3),
  "pickupPhotoUrl"        TEXT,
  "dropoffPhotoUrl"       TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DeliveryOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id"),
  CONSTRAINT "DeliveryOrder_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id"),
  CONSTRAINT "DeliveryOrder_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DeliveryOrder_stripePaymentIntentId_key" ON "DeliveryOrder"("stripePaymentIntentId") WHERE "stripePaymentIntentId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "DeliveryOrder_userId_idx" ON "DeliveryOrder"("userId");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_restaurantId_status_idx" ON "DeliveryOrder"("restaurantId", "status");
CREATE INDEX IF NOT EXISTS "DeliveryOrder_driverId_status_idx" ON "DeliveryOrder"("driverId", "status");

-- NoteReaction
CREATE TABLE IF NOT EXISTS "NoteReaction" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "issueId"   TEXT NOT NULL,
  "reaction"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NoteReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NoteReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "NoteReaction_userId_issueId_key" UNIQUE ("userId", "issueId")
);
CREATE INDEX IF NOT EXISTS "NoteReaction_issueId_idx" ON "NoteReaction"("issueId");

-- NotesSubscriber
CREATE TABLE IF NOT EXISTS "NotesSubscriber" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotesSubscriber_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NotesSubscriber_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotesSubscriber_userId_key" ON "NotesSubscriber"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "NotesSubscriber_email_key" ON "NotesSubscriber"("email");

-- SavedNote
CREATE TABLE IF NOT EXISTS "SavedNote" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"    TEXT NOT NULL,
  "issueId"   TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedNote_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "SavedNote_userId_issueId_key" UNIQUE ("userId", "issueId")
);

-- PartnerApplication
CREATE TABLE IF NOT EXISTS "PartnerApplication" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"          TEXT NOT NULL,
  "currentStep"     INTEGER NOT NULL DEFAULT 1,
  "isSubmitted"     BOOLEAN NOT NULL DEFAULT false,
  "overallStatus"   "PartnerApplicationStatus" NOT NULL DEFAULT 'in_progress',
  "restaurantName"  TEXT,
  "cuisine"         TEXT,
  "address"         TEXT,
  "phone"           TEXT,
  "email"           TEXT,
  "ownerName"       TEXT,
  "businessNumber"  TEXT,
  "hours"           JSONB,
  "menuMethod"      TEXT,
  "menuItems"       JSONB,
  "menuBulkUrl"     TEXT,
  "menuBulkText"    TEXT,
  "photosSkipped"   BOOLEAN NOT NULL DEFAULT false,
  "logoUrl"         TEXT,
  "heroPhotoUrl"    TEXT,
  "stripeConnectId" TEXT,
  "callSlot"        TEXT,
  "neighbourhoodId" TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PartnerApplication_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PartnerApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PartnerApplication_userId_key" ON "PartnerApplication"("userId");
CREATE INDEX IF NOT EXISTS "PartnerApplication_status_idx" ON "PartnerApplication"("overallStatus");

-- NeighbourhoodWaitlist
CREATE TABLE IF NOT EXISTS "NeighbourhoodWaitlist" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId"          TEXT,
  "email"           TEXT NOT NULL,
  "neighbourhoodId" TEXT NOT NULL,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NeighbourhoodWaitlist_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NeighbourhoodWaitlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL,
  CONSTRAINT "NeighbourhoodWaitlist_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id"),
  CONSTRAINT "NeighbourhoodWaitlist_email_neighbourhood_key" UNIQUE ("email", "neighbourhoodId")
);
CREATE INDEX IF NOT EXISTS "NeighbourhoodWaitlist_neighbourhoodId_idx" ON "NeighbourhoodWaitlist"("neighbourhoodId");

-- Foreign keys on User (added after tables exist)
ALTER TABLE "User" ADD CONSTRAINT "User_neighbourhoodId_fkey"
  FOREIGN KEY ("neighbourhoodId") REFERENCES "Neighbourhood"("id") ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;

-- Seed Kanata neighbourhood
INSERT INTO "Neighbourhood" ("id", "name", "slug", "city", "isActive")
VALUES ('clkanata0000000000000000001', 'Kanata', 'kanata', 'Ottawa', true)
ON CONFLICT ("slug") DO NOTHING;

-- Seed Maïko Ramen restaurant (matches spec mock data)
INSERT INTO "Restaurant" (
  "id", "slug", "name", "cuisine", "address", "phone", "hours",
  "description", "ownerName", "ownerQuote",
  "isActive", "rating", "reviewCount", "estimatedMinMin", "estimatedMinMax",
  "neighbourhoodId"
) VALUES (
  'clmaiko00000000000000000001',
  'maiko-ramen',
  'Maïko Ramen',
  'Japanese · Ramen',
  'Unit 4, 300 Eagleson Rd, Kanata',
  '(613) 555-0142',
  '{"tue":{"open":true,"from":"11:30","to":"21:00"},"wed":{"open":true,"from":"11:30","to":"21:00"},"thu":{"open":true,"from":"11:30","to":"21:00"},"fri":{"open":true,"from":"11:30","to":"22:00"},"sat":{"open":true,"from":"11:30","to":"22:00"},"sun":{"open":true,"from":"12:00","to":"20:00"},"mon":{"open":false,"from":"11:30","to":"21:00"}}',
  'Eighteen-hour broth, hidden behind a strip mall, run by one woman who really knows what she''s doing.',
  'Yuki Tanaka',
  'I don''t want my food to arrive cold to people who waited for it. That''s the whole point of ramen.',
  true,
  4.80,
  212,
  25,
  35,
  'clkanata0000000000000000001'
) ON CONFLICT ("slug") DO NOTHING;

-- Seed menu items for Maïko Ramen
INSERT INTO "MenuItem" ("id","restaurantId","name","description","price","category","tags","colorHex","isAvailable","sortOrder") VALUES
  ('cltonk00000000000000000001','clmaiko00000000000000000001','Tonkotsu Classic','18-hour pork bone broth, chashu, soft egg, scallion, nori.',17.00,'Ramen','{"Signature"}','#C9954A',true,1),
  ('clspicy0000000000000000001','clmaiko00000000000000000001','Spicy Miso','Three-miso blend, fermented chili, ground pork, soft egg.',18.00,'Ramen','{"Spicy"}','#D4622E',true,2),
  ('clshoyu0000000000000000001','clmaiko00000000000000000001','Shoyu Ramen','Clear chicken broth, house soy tare, bamboo, chashu.',16.00,'Ramen','{}','#8B6508',true,3),
  ('clvegsh0000000000000000001','clmaiko00000000000000000001','Vegetable Shoyu','Mushroom dashi, tofu, seasonal vegetables, scallion oil.',16.00,'Ramen','{"Veg"}','#4A7C59',true,4),
  ('clgyo000000000000000000001','clmaiko00000000000000000001','Pork Gyoza (5)','Hand-folded, pan-fried. House ponzu on the side.',9.00,'Sides','{}','#A8754D',true,5),
  ('cledama0000000000000000001','clmaiko00000000000000000001','Edamame','Steamed, sea salt. Simple, exactly right.',6.00,'Sides','{}','#5A8C4A',true,6),
  ('clkara00000000000000000001','clmaiko00000000000000000001','Chicken Karaage','Marinated, double-fried. Lemon and kewpie.',11.00,'Sides','{}','#B8860B',true,7),
  ('clramun0000000000000000001','clmaiko00000000000000000001','Ramune','Original or strawberry. Glass marble bottle.',4.00,'Drinks','{}','#7AAFC8',true,8),
  ('cltea000000000000000000001','clmaiko00000000000000000001','Cold Genmaicha','Roasted brown rice green tea. Brewed daily.',4.00,'Drinks','{}','#8B9D6F',true,9)
ON CONFLICT DO NOTHING;
