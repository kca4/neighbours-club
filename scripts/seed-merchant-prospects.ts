/**
 * Idempotent seed for Kanata Central BIA food prospects.
 * Upsert key: (source, externalId) — BIA slug is stable; name is mutable.
 *
 * Run: npx tsx scripts/seed-merchant-prospects.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCE = "kanata-central-bia";
const SOURCE_URL_BASE = "https://kanatacentral.com/stores/";
const CLUSTER = "centrum";

const prospects = [
  { name: "Kanzan Japanese Grill",      externalId: "kanzan-japanese-grill" },
  { name: "Hokkaido Cake",              externalId: "hokkaido-cake" },
  { name: "Equator Coffee Centrum",     externalId: "equator-coffee-centrum" },
  { name: "Crab Boil Kanata Centrum",   externalId: "crab-boil-kanata-centrum" },
  { name: "Chez Lionel Kanata",         externalId: "chez-lionel-kanata" },
  { name: "Chawlas2 Ottawa",            externalId: "chawlas2-ottawa" },
  { name: "All Out Burger Kanata",      externalId: "all-out-burger-kanata" },
  { name: "Turkish Kebab House Kanata", externalId: "turkish-kebab-house-kanata" },
  { name: "Wok & Chop",                 externalId: "wok-chop" },
  { name: "Pho K Fusion",               externalId: "pho-k-fusion" },
  { name: "Zak's Diner Kanata",         externalId: "zaks-diner-kanata" },
  { name: "Z3 Specialty Coffee",        externalId: "z3-specialty-coffee" },
  { name: "Wolf Down",                  externalId: "wolf-down" },
  { name: "Wings Up",                   externalId: "wings-up" },
  { name: "Windbell Sushi",             externalId: "windbell-sushi" },
  { name: "Via Cibo",                   externalId: "via-cibo" },
  { name: "Tommy's Dining Lounge",      externalId: "tommys-dining-lounge" },
  { name: "Tomaso Grilled Pizza",       externalId: "tomaso-grilled-pizza-panini" },
  { name: "3 Brasseurs Kanata",         externalId: "the-3-brewers-restaurant" },
  { name: "Thai Express",               externalId: "thai-express" },
  { name: "Sushi Kanata",               externalId: "sushi-kanata" },
  { name: "Strawberry Blonde Bakery",   externalId: "strawberry-blonde-bakery-kanata" },
  { name: "Stacked Pancake House",      externalId: "stacked-pancake-house" },
  { name: "SFR Distillery & Lounge",    externalId: "sfr-distillery-lounge-statford-fox-run-company" },
  { name: "Sansotei Ramen",             externalId: "sansotei-ramen" },
  { name: "Red Swan Pizza",             externalId: "red-swan-pizza" },
];

async function main() {
  console.log(`Seeding ${prospects.length} Kanata Central BIA prospects…`);

  let created = 0;
  let skipped = 0;

  for (const p of prospects) {
    const existing = await prisma.merchantProspect.findUnique({
      where: { source_externalId: { source: SOURCE, externalId: p.externalId } },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      console.log(`  ~ ${p.name} (already exists)`);
      continue;
    }

    await prisma.merchantProspect.create({
      data: {
        name: p.name,
        source: SOURCE,
        externalId: p.externalId,
        sourceUrl: `${SOURCE_URL_BASE}${p.externalId}/`,
        cluster: CLUSTER,
      },
    });

    created++;
    console.log(`  + ${p.name}`);
  }

  console.log(`\nDone. Created: ${created}, skipped: ${skipped}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
