import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const restaurants = [
  {
    slug: "thai-orchid",
    name: "Thai Orchid",
    cuisine: "Thai",
    address: "3651 Hazeldean Rd, Kanata, ON",
    description: "Authentic Thai cuisine made from scratch with fresh herbs and spices.",
    estimatedMinMin: 25,
    estimatedMinMax: 40,
    isActive: true,
  },
  {
    slug: "march-road-pizza",
    name: "March Road Pizza",
    cuisine: "Pizza",
    address: "600 March Rd, Kanata, ON",
    description: "Stone-baked pizzas and Italian classics in the heart of Kanata North.",
    estimatedMinMin: 20,
    estimatedMinMax: 35,
    isActive: true,
  },
  {
    slug: "centrum-cafe",
    name: "Centrum Café",
    cuisine: "Café",
    address: "Kanata Centrum, Kanata, ON",
    description: "Specialty coffee, fresh pastries, and light bites in Kanata Centrum.",
    estimatedMinMin: 15,
    estimatedMinMax: 25,
    isActive: true,
  },
  {
    slug: "shawarma-palace",
    name: "Shawarma Palace",
    cuisine: "Shawarma",
    address: "Eagleson Rd, Kanata, ON",
    description: "Hand-carved shawarma wraps, platters, and sides. Fast, fresh, and filling.",
    estimatedMinMin: 20,
    estimatedMinMax: 30,
    isActive: true,
  },
];

async function main() {
  console.log("Seeding restaurants...");
  for (const restaurant of restaurants) {
    await prisma.restaurant.upsert({
      where: { slug: restaurant.slug },
      create: restaurant,
      update: restaurant,
    });
    console.log(`  ✓ ${restaurant.name}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
