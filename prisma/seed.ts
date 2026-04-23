import { PrismaClient, Role, DealStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function daysFromNow(days: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  }

  function daysFromNowAt(days: number, hour: number, minute = 0): Date {
    const d = daysFromNow(days);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  // ---------------------------------------------------------------------------
  // Users (upsert by email)
  // ---------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@neighboursclub.test" },
    update: {},
    create: {
      email: "admin@neighboursclub.test",
      passwordHash,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah@example.test" },
    update: {},
    create: {
      email: "sarah@example.test",
      passwordHash,
      name: "Sarah Tremblay",
      phone: "+16135550101",
      role: Role.MEMBER,
    },
  });

  const james = await prisma.user.upsert({
    where: { email: "james@example.test" },
    update: {},
    create: {
      email: "james@example.test",
      passwordHash,
      name: "James Chen",
      phone: "+16135550102",
      role: Role.MEMBER,
    },
  });

  const aisha = await prisma.user.upsert({
    where: { email: "aisha@example.test" },
    update: {},
    create: {
      email: "aisha@example.test",
      passwordHash,
      name: "Aisha Patel",
      role: Role.MEMBER,
    },
  });

  console.log("✓ Users seeded");

  // ---------------------------------------------------------------------------
  // Suppliers
  // Strategy: findFirst by name; create if not found.
  // ---------------------------------------------------------------------------
  const supplierDefs = [
    {
      name: "Olive Grove Imports",
      contactName: "Marco Rossi",
      contactEmail: "marco@olivegrove.test",
    },
    {
      name: "Kanata Coffee Roasters",
      contactName: "Lisa Park",
      contactEmail: "lisa@kanatacoffee.test",
    },
    {
      name: "Northern Paper Co.",
      contactName: "Tom Wright",
      contactEmail: "tom@northernpaper.test",
    },
  ];

  const suppliers: Record<string, { id: string }> = {};

  for (const def of supplierDefs) {
    let supplier = await prisma.supplier.findFirst({ where: { name: def.name } });
    if (!supplier) {
      supplier = await prisma.supplier.create({ data: def });
    }
    suppliers[def.name] = supplier;
  }

  console.log("✓ Suppliers seeded");

  const PICKUP_LOCATION = "Kanata Community Hub";
  const PICKUP_ADDRESS = "100 Charlemagne Blvd, Kanata, ON K2L 0E5";

  // ---------------------------------------------------------------------------
  // Deal 1 — OPEN, Olive Grove Imports
  // ---------------------------------------------------------------------------
  const deal1 = await prisma.deal.upsert({
    where: { slug: "olive-oil-1l-january" },
    update: {},
    create: {
      title: "Cold-Pressed Italian Olive Oil — 1L",
      slug: "olive-oil-1l-january",
      description:
        "Premium extra virgin olive oil from Puglia, harvested October 2025. Cold-pressed within 24 hours of picking.",
      supplierId: suppliers["Olive Grove Imports"].id,
      createdById: adminUser.id,
      minimumMembers: 20,
      maximumMembers: 200,
      maxQuantityPerMember: 3,
      opensAt: now,
      closesAt: daysFromNow(5),
      pickupLocation: PICKUP_LOCATION,
      pickupAddress: PICKUP_ADDRESS,
      pickupWindowStart: daysFromNowAt(7, 10),
      pickupWindowEnd: daysFromNowAt(7, 14),
      status: DealStatus.OPEN,
      tiers: {
        create: [
          { minMembers: 1, maxMembers: 19, pricePerUnit: 22.0, tierOrder: 0 },
          { minMembers: 20, maxMembers: 49, pricePerUnit: 18.0, tierOrder: 1 },
          { minMembers: 50, maxMembers: 99, pricePerUnit: 15.0, tierOrder: 2 },
          { minMembers: 100, maxMembers: null, pricePerUnit: 13.0, tierOrder: 3 },
        ],
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Deal 2 — DRAFT, Kanata Coffee Roasters
  // ---------------------------------------------------------------------------
  const deal2 = await prisma.deal.upsert({
    where: { slug: "ethiopian-coffee-500g-january" },
    update: {},
    create: {
      title: "Single-Origin Ethiopian Beans — 500g",
      slug: "ethiopian-coffee-500g-january",
      description:
        "Locally roasted single-origin Yirgacheffe beans, roasted weekly. Bright, citrusy, floral.",
      supplierId: suppliers["Kanata Coffee Roasters"].id,
      createdById: adminUser.id,
      minimumMembers: 15,
      maximumMembers: 80,
      maxQuantityPerMember: 2,
      opensAt: daysFromNow(1),
      closesAt: daysFromNow(4),
      pickupLocation: PICKUP_LOCATION,
      pickupAddress: PICKUP_ADDRESS,
      pickupWindowStart: daysFromNowAt(6, 10),
      pickupWindowEnd: daysFromNowAt(6, 14),
      status: DealStatus.DRAFT,
      tiers: {
        create: [
          { minMembers: 1, maxMembers: 14, pricePerUnit: 24.0, tierOrder: 0 },
          { minMembers: 15, maxMembers: 29, pricePerUnit: 20.0, tierOrder: 1 },
          { minMembers: 30, maxMembers: null, pricePerUnit: 17.0, tierOrder: 2 },
        ],
      },
    },
  });

  // ---------------------------------------------------------------------------
  // Deal 3 — COMPLETED, Northern Paper Co.
  // ---------------------------------------------------------------------------
  const deal3 = await prisma.deal.upsert({
    where: { slug: "paper-towels-12pack-december" },
    update: {},
    create: {
      title: "Recycled Paper Towels — 12 Pack",
      slug: "paper-towels-12pack-december",
      description: "100% recycled, lint-free paper towels. 12 large rolls.",
      supplierId: suppliers["Northern Paper Co."].id,
      createdById: adminUser.id,
      minimumMembers: 10,
      maximumMembers: 100,
      maxQuantityPerMember: 2,
      opensAt: daysFromNow(-30),
      closesAt: daysFromNow(-23),
      finalPrice: 22.0,
      finalTierIndex: 2,
      pickupLocation: PICKUP_LOCATION,
      pickupAddress: PICKUP_ADDRESS,
      pickupWindowStart: daysFromNowAt(-21, 10),
      pickupWindowEnd: daysFromNowAt(-21, 14),
      status: DealStatus.COMPLETED,
      tiers: {
        create: [
          { minMembers: 1, maxMembers: 9, pricePerUnit: 32.0, tierOrder: 0 },
          { minMembers: 10, maxMembers: 24, pricePerUnit: 26.0, tierOrder: 1 },
          { minMembers: 25, maxMembers: null, pricePerUnit: 22.0, tierOrder: 2 },
        ],
      },
    },
  });

  console.log("✓ Deals seeded");

  // ---------------------------------------------------------------------------
  // Orders (upsert by [userId, dealId] unique constraint)
  // ---------------------------------------------------------------------------

  // Sarah on Deal 1
  await prisma.order.upsert({
    where: { userId_dealId: { userId: sarah.id, dealId: deal1.id } },
    update: {},
    create: {
      userId: sarah.id,
      dealId: deal1.id,
      quantity: 2,
      maxAuthorizedAmount: 44.0,
      status: OrderStatus.AUTHORIZED,
    },
  });

  // James on Deal 1
  await prisma.order.upsert({
    where: { userId_dealId: { userId: james.id, dealId: deal1.id } },
    update: {},
    create: {
      userId: james.id,
      dealId: deal1.id,
      quantity: 1,
      maxAuthorizedAmount: 22.0,
      status: OrderStatus.AUTHORIZED,
    },
  });

  // Sarah on Deal 3
  await prisma.order.upsert({
    where: { userId_dealId: { userId: sarah.id, dealId: deal3.id } },
    update: {},
    create: {
      userId: sarah.id,
      dealId: deal3.id,
      quantity: 1,
      maxAuthorizedAmount: 22.0,
      finalAmount: 22.0,
      status: OrderStatus.PICKED_UP,
      pickedUpAt: daysFromNow(-20),
    },
  });

  // Aisha on Deal 3
  await prisma.order.upsert({
    where: { userId_dealId: { userId: aisha.id, dealId: deal3.id } },
    update: {},
    create: {
      userId: aisha.id,
      dealId: deal3.id,
      quantity: 2,
      maxAuthorizedAmount: 44.0,
      finalAmount: 44.0,
      status: OrderStatus.PICKED_UP,
      pickedUpAt: daysFromNow(-20),
    },
  });

  console.log("✓ Orders seeded");
  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
