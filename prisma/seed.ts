import { PrismaClient, Role, DealStatus, OrderStatus, DriverStatus, VehicleType } from "@prisma/client";
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

  // ---------------------------------------------------------------------------
  // Delivery — Neighbourhood + Restaurant + MenuItems
  // ---------------------------------------------------------------------------

  const kanata = await prisma.neighbourhood.upsert({
    where: { slug: "kanata" },
    update: {},
    create: {
      name: "Kanata",
      slug: "kanata",
      city: "Ottawa",
      isActive: true,
    },
  });

  const kitchenHours = {
    monday:    { open: "11:00", close: "21:00", isClosed: false },
    tuesday:   { open: "11:00", close: "21:00", isClosed: false },
    wednesday: { open: "11:00", close: "21:00", isClosed: false },
    thursday:  { open: "11:00", close: "21:00", isClosed: false },
    friday:    { open: "11:00", close: "22:00", isClosed: false },
    saturday:  { open: "12:00", close: "22:00", isClosed: false },
    sunday:    { open: "12:00", close: "20:00", isClosed: false },
  };

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "kanata-kitchen" },
    update: {},
    create: {
      neighbourhoodId: kanata.id,
      name: "Kanata Kitchen",
      slug: "kanata-kitchen",
      description:
        "Fresh, homestyle cooking made with locally sourced ingredients. Serving Kanata families since 2018.",
      cuisine: "Canadian Comfort",
      address: "100 Kanata Ave, Kanata, ON K2T 1E2",
      heroImageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
      logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&q=80",
      rating: 4.7,
      reviewCount: 312,
      estimatedMinMin: 25,
      estimatedMinMax: 40,
      isActive: true,
      isPaused: false,
      ownerName: "Marie Fontaine",
      ownerQuote: "We cook the way we'd want our family to eat.",
      hours: kitchenHours,
    },
  });

  // ── RESTAURANT_OWNER — linked to kanata-kitchen ──────────────────────────
  const restaurantOwner = await prisma.user.upsert({
    where: { email: "restaurant_owner@neighboursclub.test" },
    update: { role: Role.RESTAURANT_OWNER, restaurantId: restaurant.id },
    create: {
      email: "restaurant_owner@neighboursclub.test",
      passwordHash,
      name: "Marie Fontaine",
      role: Role.RESTAURANT_OWNER,
      restaurantId: restaurant.id,
    },
  });
  // Keep the restaurant's ownerId in sync (idempotent — same value on re-run)
  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { ownerId: restaurantOwner.id },
  });

  // ── COURIER — user + DeliveryDriver row ───────────────────────────────────
  const courierUser = await prisma.user.upsert({
    where: { email: "courier@neighboursclub.test" },
    update: { role: Role.COURIER },
    create: {
      email: "courier@neighboursclub.test",
      passwordHash,
      name: "Alex Dubois",
      role: Role.COURIER,
    },
  });
  await prisma.deliveryDriver.upsert({
    where: { userId: courierUser.id },
    update: {},
    create: {
      userId: courierUser.id,
      status: DriverStatus.OFFLINE,
      vehicleType: VehicleType.CAR,
    },
  });

  console.log("✓ Restaurant owner and courier seeded");

  // Helper — upsert menu items (idempotent re-seeds)
  async function upsertItem(data: {
    name: string;
    description?: string;
    price: number;
    category: string;
    tags?: string[];
    imageUrl?: string;
    colorHex?: string;
    sortOrder: number;
  }) {
    // Use name+restaurantId as logical key (no unique constraint, so deleteMany + create)
    await prisma.menuItem.deleteMany({
      where: { restaurantId: restaurant.id, name: data.name },
    });
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        name: data.name,
        description: data.description ?? null,
        price: data.price,
        category: data.category,
        tags: data.tags ?? [],
        imageUrl: data.imageUrl ?? null,
        colorHex: data.colorHex ?? null,
        sortOrder: data.sortOrder,
        isAvailable: true,
      },
    });
  }

  // Most Ordered — mix of image + list items
  await upsertItem({
    name: "Butter Chicken",
    description: "Tender chicken thighs in a rich tomato-cream sauce. Served with basmati rice.",
    price: 16.99,
    category: "Most Ordered",
    tags: ["popular", "gluten-free"],
    imageUrl: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&q=80",
    sortOrder: 1,
  });
  await upsertItem({
    name: "The Classic Burger",
    description: "Double smash patty, aged cheddar, house sauce, brioche bun.",
    price: 14.5,
    category: "Most Ordered",
    tags: ["popular"],
    imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    sortOrder: 2,
  });
  await upsertItem({
    name: "Caesar Salad",
    description: "Romaine, house-made dressing, parmesan crisp, croutons.",
    price: 11.0,
    category: "Most Ordered",
    tags: ["vegetarian"],
    imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=600&q=80",
    sortOrder: 3,
  });
  await upsertItem({
    name: "Poutine",
    description: "Hand-cut fries, squeaky cheese curds, brown gravy.",
    price: 9.5,
    category: "Most Ordered",
    tags: ["popular"],
    imageUrl: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=600&q=80",
    sortOrder: 4,
  });

  // Mains
  await upsertItem({
    name: "Grilled Salmon",
    description: "Atlantic salmon, lemon dill butter, seasonal vegetables, wild rice.",
    price: 22.0,
    category: "Mains",
    tags: ["gluten-free"],
    imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
    sortOrder: 1,
  });
  await upsertItem({
    name: "Mushroom Risotto",
    description: "Arborio rice, cremini & shiitake mushrooms, truffle oil, parmesan.",
    price: 18.0,
    category: "Mains",
    tags: ["vegetarian"],
    imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&q=80",
    sortOrder: 2,
  });
  await upsertItem({
    name: "Half Rack of Ribs",
    description: "Slow-smoked baby back ribs, house BBQ sauce, coleslaw, cornbread.",
    price: 26.5,
    category: "Mains",
    tags: [],
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    sortOrder: 3,
  });
  await upsertItem({
    name: "Chicken Shawarma Wrap",
    description: "Marinated chicken, garlic sauce, pickles, tomato, in a toasted flour wrap.",
    price: 13.5,
    category: "Mains",
    tags: [],
    imageUrl: "https://images.unsplash.com/photo-1561050501-3bc8ed5a7e5b?w=600&q=80",
    sortOrder: 4,
  });

  // Sides — list cards (no images, use colorHex)
  await upsertItem({
    name: "Garlic Bread",
    description: "Toasted sourdough, herb butter, roasted garlic.",
    price: 4.5,
    category: "Sides",
    tags: ["vegetarian"],
    colorHex: "#F5E6C8",
    sortOrder: 1,
  });
  await upsertItem({
    name: "Sweet Potato Fries",
    description: "Lightly seasoned, served with chipotle mayo.",
    price: 6.0,
    category: "Sides",
    tags: ["vegan", "gluten-free"],
    colorHex: "#F4A460",
    sortOrder: 2,
  });
  await upsertItem({
    name: "Garden Side Salad",
    description: "Mixed greens, cucumber, cherry tomatoes, balsamic vinaigrette.",
    price: 5.5,
    category: "Sides",
    tags: ["vegan", "gluten-free"],
    colorHex: "#90EE90",
    sortOrder: 3,
  });
  await upsertItem({
    name: "Soup of the Day",
    description: "Ask your driver — changes daily. Served with a dinner roll.",
    price: 6.5,
    category: "Sides",
    tags: [],
    colorHex: "#DEB887",
    sortOrder: 4,
  });

  // Drinks — list cards
  await upsertItem({
    name: "Fountain Soft Drink",
    description: "Pepsi, Diet Pepsi, 7UP, or Ginger Ale. 500 mL.",
    price: 2.5,
    category: "Drinks",
    tags: [],
    colorHex: "#87CEEB",
    sortOrder: 1,
  });
  await upsertItem({
    name: "Sparkling Water",
    description: "San Pellegrino 500 mL.",
    price: 3.0,
    category: "Drinks",
    tags: [],
    colorHex: "#E0F7FA",
    sortOrder: 2,
  });
  await upsertItem({
    name: "Craft Lemonade",
    description: "House-made with fresh lemons and mint. 16 oz.",
    price: 4.5,
    category: "Drinks",
    tags: ["vegan"],
    colorHex: "#FFF9C4",
    sortOrder: 3,
  });
  await upsertItem({
    name: "Coffee or Tea",
    description: "Freshly brewed drip coffee or steeped orange pekoe.",
    price: 3.0,
    category: "Drinks",
    tags: [],
    colorHex: "#8B4513",
    sortOrder: 4,
  });

  // ── Secret menu items ────────────────────────────────────────────────────
  // Delete ALL existing secret items for this restaurant before creating the
  // canonical one. This catches any stale rows (e.g. set via Prisma Studio
  // with the old cpCost=3000) regardless of their name.
  await prisma.menuItem.deleteMany({
    where: { restaurantId: restaurant.id, isSecret: true },
  });
  await prisma.menuItem.create({
    data: {
      restaurantId: restaurant.id,
      name: "Chef's Off-Menu Tasting Plate",
      description:
        "A rotating selection of the kitchen's favourite dishes — not on the regular menu. Unlock with CP.",
      price: 0,   // CP-only redemption; no fiat charge
      category: "Secret Menu",
      tags: ["secret"],
      colorHex: "#2D3748",
      sortOrder: 1,
      isAvailable: true,
      isSecret: true,
      cpCost: 500,
    },
  });

  console.log("✓ Delivery neighbourhood, restaurant, and menu items seeded");
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
