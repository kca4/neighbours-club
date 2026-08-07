/**
 * Seed 3 demo restaurants for the delivery merchant pitch.
 * Reads scripts/data/demo-menus.json — replace the placeholder file with
 * real data before running.
 *
 * All restaurants are seeded with isActive: false so they are invisible on
 * /delivery but accessible via /delivery/[slug]?preview=<DELIVERY_PREVIEW_TOKEN>.
 *
 * Idempotency:
 *   - Restaurants: upsert on slug
 *   - Menu items: findFirst by (restaurantId, name); create if missing, skip if present
 *
 * Run: npx tsx scripts/seed-delivery-demo.ts
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// ─── JSON shape ───────────────────────────────────────────────────────────────

interface DemoMenuItem {
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
}

interface DemoRestaurant {
  slug: string;
  name: string;
  cuisine: string;
  address: string;
  phone?: string;
  hours: Record<string, string>;
  description?: string;
  menuItems: DemoMenuItem[];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dataPath = join(__dirname, "data", "demo-menus.json");

  if (!existsSync(dataPath)) {
    console.error(`Missing: ${dataPath}`);
    console.error("Create scripts/data/demo-menus.json with the demo restaurant data.");
    process.exit(1);
  }

  const menus: DemoRestaurant[] = JSON.parse(readFileSync(dataPath, "utf-8"));
  console.log(`Seeding ${menus.length} demo restaurant(s)…\n`);

  for (const r of menus) {
    // ── Upsert restaurant ────────────────────────────────────────────────────
    const restaurant = await prisma.restaurant.upsert({
      where: { slug: r.slug },
      create: {
        slug: r.slug,
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        phone: r.phone ?? null,
        hours: r.hours,
        description: r.description ?? null,
        isActive: false, // demo only — never show on /delivery listing
        isPaused: false,
        heroImageUrl: null,
        logoUrl: null,
      },
      update: {
        name: r.name,
        cuisine: r.cuisine,
        address: r.address,
        phone: r.phone ?? null,
        hours: r.hours,
        description: r.description ?? null,
        // Do NOT flip isActive here — an admin may have changed it intentionally.
      },
      select: { id: true, name: true, slug: true },
    });

    console.log(`  ✓ Restaurant: ${restaurant.name} (${restaurant.slug})`);

    // ── Upsert menu items ────────────────────────────────────────────────────
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < r.menuItems.length; i++) {
      const item = r.menuItems[i];

      const existing = await prisma.menuItem.findFirst({
        where: { restaurantId: restaurant.id, name: item.name },
        select: { id: true },
      });

      if (existing) {
        skipped++;
      } else {
        await prisma.menuItem.create({
          data: {
            restaurantId: restaurant.id,
            name: item.name,
            price: item.price,
            category: item.category,
            isAvailable: item.isAvailable,
            sortOrder: i,
            tags: [],
          },
        });
        created++;
      }
    }

    console.log(
      `    Items: ${created} created, ${skipped} already exist` +
        ` (${r.menuItems.length} total)\n`
    );
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
