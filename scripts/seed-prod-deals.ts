/**
 * One-off script: seed 3 Kanata group-buy deals into production.
 * Run with: DATABASE_URL=<prod-url> npx ts-node --skip-project scripts/seed-prod-deals.ts
 */
import { PrismaClient, DealStatus } from "@prisma/client";

const db = new PrismaClient();

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  // Find admin user
  const admin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) throw new Error("No admin user found in production database.");
  console.log(`Using admin: ${admin.email} (${admin.id})`);

  const now = new Date();

  // ── Deal 1: Kanata Coffee Roasters ──────────────────────────────────────────
  const supplier1 = await db.supplier.create({
    data: {
      name: "Kanata Coffee Roasters",
      contactName: "Alex Patel",
      contactEmail: "alex@kanatacoffee.ca",
      contactPhone: "613-555-0181",
    },
  });

  const closesAt1 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const pickup1Start = new Date(closesAt1.getTime() + 3 * 24 * 60 * 60 * 1000);
  pickup1Start.setHours(10, 0, 0, 0);
  const pickup1End = new Date(pickup1Start);
  pickup1End.setHours(14, 0, 0, 0);

  const deal1 = await db.deal.create({
    data: {
      title: "Fresh Roasted Coffee Beans — Kanata Coffee Roasters",
      slug: slugify("Fresh Roasted Coffee Beans Kanata Coffee Roasters"),
      description:
        "Locally roasted single-origin coffee beans. Choose from Ethiopian Yirgacheffe or Colombian Supremo. 1lb bags.",
      imageUrl:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80",
      supplierId: supplier1.id,
      createdById: admin.id,
      minimumMembers: 8,
      maximumMembers: 25,
      maxQuantityPerMember: 4,
      opensAt: now,
      closesAt: closesAt1,
      pickupLocation: "Hazeldean Mall",
      pickupAddress: "485 Hazeldean Rd, Kanata",
      pickupWindowStart: pickup1Start,
      pickupWindowEnd: pickup1End,
      status: DealStatus.OPEN,
      tiers: {
        create: [
          { tierOrder: 1, minMembers: 1, maxMembers: 7, pricePerUnit: 18.99 },
          { tierOrder: 2, minMembers: 8, maxMembers: 14, pricePerUnit: 14.99 },
          { tierOrder: 3, minMembers: 15, maxMembers: null, pricePerUnit: 11.99 },
        ],
      },
    },
    include: { tiers: true, supplier: true },
  });

  // ── Deal 2: Ottawa Valley Meats ─────────────────────────────────────────────
  const supplier2 = await db.supplier.create({
    data: {
      name: "Ottawa Valley Meats",
      contactName: "Marie Bouchard",
      contactEmail: "marie@ottawavalleymeats.ca",
      contactPhone: "613-555-0247",
    },
  });

  const closesAt2 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const pickup2Start = new Date(closesAt2.getTime() + 3 * 24 * 60 * 60 * 1000);
  pickup2Start.setHours(11, 0, 0, 0);
  const pickup2End = new Date(pickup2Start);
  pickup2End.setHours(15, 0, 0, 0);

  const deal2 = await db.deal.create({
    data: {
      title: "Grass-Fed Beef Bundle — Ottawa Valley Meats",
      slug: slugify("Grass-Fed Beef Bundle Ottawa Valley Meats"),
      description:
        "Family-sized ground beef bundle from local Ottawa Valley farms. 5kg packs, individually wrapped in 500g portions.",
      imageUrl:
        "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&q=80",
      supplierId: supplier2.id,
      createdById: admin.id,
      minimumMembers: 12,
      maximumMembers: 40,
      maxQuantityPerMember: 3,
      opensAt: now,
      closesAt: closesAt2,
      pickupLocation: "Kanata Centrum",
      pickupAddress: "101 Kanata Ave, Kanata",
      pickupWindowStart: pickup2Start,
      pickupWindowEnd: pickup2End,
      status: DealStatus.OPEN,
      tiers: {
        create: [
          { tierOrder: 1, minMembers: 1, maxMembers: 11, pricePerUnit: 54.99 },
          { tierOrder: 2, minMembers: 12, maxMembers: 24, pricePerUnit: 44.99 },
          { tierOrder: 3, minMembers: 25, maxMembers: null, pricePerUnit: 37.99 },
        ],
      },
    },
    include: { tiers: true, supplier: true },
  });

  // ── Deal 3: Bee Clean Ottawa ────────────────────────────────────────────────
  const supplier3 = await db.supplier.create({
    data: {
      name: "Bee Clean Ottawa",
      contactName: "Jordan Kim",
      contactEmail: "jordan@beecleanottawa.ca",
      contactPhone: "613-555-0319",
    },
  });

  const closesAt3 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const pickup3Start = new Date(closesAt3.getTime() + 3 * 24 * 60 * 60 * 1000);
  pickup3Start.setHours(10, 0, 0, 0);
  const pickup3End = new Date(pickup3Start);
  pickup3End.setHours(13, 0, 0, 0);

  const deal3 = await db.deal.create({
    data: {
      title: "Eco Cleaning Supply Kit — Bee Clean Ottawa",
      slug: slugify("Eco Cleaning Supply Kit Bee Clean Ottawa"),
      description:
        "All-natural household cleaning kit: dish soap, surface cleaner, laundry detergent, and hand soap. Refillable glass bottles.",
      imageUrl:
        "https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=800&q=80",
      supplierId: supplier3.id,
      createdById: admin.id,
      minimumMembers: 15,
      maximumMembers: 50,
      maxQuantityPerMember: 2,
      opensAt: now,
      closesAt: closesAt3,
      pickupLocation: "Morgan's Grant Community Centre",
      pickupAddress: "Kanata, ON",
      pickupWindowStart: pickup3Start,
      pickupWindowEnd: pickup3End,
      status: DealStatus.OPEN,
      tiers: {
        create: [
          { tierOrder: 1, minMembers: 1, maxMembers: 14, pricePerUnit: 42.99 },
          { tierOrder: 2, minMembers: 15, maxMembers: 29, pricePerUnit: 34.99 },
          { tierOrder: 3, minMembers: 30, maxMembers: null, pricePerUnit: 28.99 },
        ],
      },
    },
    include: { tiers: true, supplier: true },
  });

  console.log("\n✅ Created 3 deals:\n");
  for (const deal of [deal1, deal2, deal3]) {
    console.log(`  [${deal.id}] ${deal.title}`);
    console.log(`    Supplier : ${deal.supplier.name}`);
    console.log(`    Slug     : ${deal.slug}`);
    console.log(`    Status   : ${deal.status}`);
    console.log(`    Closes   : ${deal.closesAt.toISOString()}`);
    console.log(`    Tiers    :`);
    for (const t of deal.tiers.sort((a, b) => a.tierOrder - b.tierOrder)) {
      const range = t.maxMembers ? `${t.minMembers}–${t.maxMembers}` : `${t.minMembers}+`;
      console.log(`      Tier ${t.tierOrder}: ${range} members → $${t.pricePerUnit}`);
    }
    console.log();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
