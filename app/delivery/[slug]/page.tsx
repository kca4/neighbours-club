import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWalletBalance } from "@/lib/cp/wallet-view";
import type { OperatingHours } from "@/lib/types/delivery";
import RestaurantHero from "./RestaurantHero";
import InfoBar from "./InfoBar";
import MenuBrowser from "./MenuBrowser";
import SecretMenuSection from "./SecretMenuSection";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    select: { name: true, description: true },
  });
  if (!restaurant) return {};
  return {
    // Root layout template appends " | Neighbours Club"
    // → "Kanata Kitchen — Delivery | Neighbours Club"
    title: `${restaurant.name} — Delivery`,
    description:
      restaurant.description ??
      `Order from ${restaurant.name} for delivery in Kanata.`,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DeliveryRestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Auth — needed for the wallet balance passed to the secret menu section.
  const session = await auth();

  // Fetch restaurant with neighbourhood name
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      neighbourhood: { select: { name: true } },
    },
  });

  if (!restaurant || !restaurant.isActive) {
    notFound();
  }

  // Fetch menu items and wallet balance in parallel — both are fast reads.
  const [menuItems, walletBalance] = await Promise.all([
    prisma.menuItem.findMany({
      where: { restaurantId: restaurant.id, isAvailable: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    session?.user?.id ? getWalletBalance(session.user.id) : null,
  ]);

  // ── Serialise Prisma types for client components ─────────────────────────
  // Decimal fields → number, JsonValue hours → typed OperatingHours
  const r = {
    name: restaurant.name,
    slug: restaurant.slug,
    cuisine: restaurant.cuisine,
    description: restaurant.description,
    heroImageUrl: restaurant.heroImageUrl,
    logoUrl: restaurant.logoUrl,
    rating: restaurant.rating !== null ? Number(restaurant.rating) : null,
    reviewCount: restaurant.reviewCount,
    estimatedMinMin: restaurant.estimatedMinMin,
    estimatedMinMax: restaurant.estimatedMinMax,
    isPaused: restaurant.isPaused,
    ownerName: restaurant.ownerName,
    ownerQuote: restaurant.ownerQuote,
    neighbourhoodName: restaurant.neighbourhood?.name ?? null,
    hours: restaurant.hours as unknown as OperatingHours,
  };

  // ── Split secret vs regular items ───────────────────────────────────────
  // Secret items are hidden from the regular menu browser; they surface in the
  // dedicated Secret Menu section below. Items with isSecret=true but no valid
  // cpCost are treated as misconfigured and silently excluded.
  const regularMenuRaw = menuItems.filter((i) => !i.isSecret);
  const secretMenuRaw = menuItems.filter(
    (i) => i.isSecret && i.cpCost !== null && i.cpCost > 0
  );

  // Serialise regular items (Decimal → number, strip unused Date fields)
  const items = regularMenuRaw.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    category: item.category,
    tags: item.tags,
    imageUrl: item.imageUrl,
    colorHex: item.colorHex,
    sortOrder: item.sortOrder,
  }));

  // Serialise secret items (only the fields SecretMenuSection needs)
  const secretItems = secretMenuRaw.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.imageUrl,
    colorHex: item.colorHex,
    cpCost: item.cpCost as number, // non-null guaranteed by filter above
  }));

  // Derive "Most Ordered" — top 4 regular items by global sortOrder.
  // Secret items are intentionally excluded from this section.
  const mostOrderedItems = items
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    .slice(0, 4);

  const restaurantInfo = { id: restaurant.id, name: restaurant.name, slug: restaurant.slug };

  return (
    <main className="flex flex-1 flex-col bg-background">
      {/* ── Hero — full-width image with gradient + back button ─────────── */}
      <RestaurantHero
        name={r.name}
        cuisine={r.cuisine}
        neighbourhoodName={r.neighbourhoodName}
        heroImageUrl={r.heroImageUrl}
        logoUrl={r.logoUrl}
      />

      {/* ── Info bar — rating, time, free delivery, quote, hours ─────────── */}
      <InfoBar
        rating={r.rating}
        reviewCount={r.reviewCount}
        estimatedMinMin={r.estimatedMinMin}
        estimatedMinMax={r.estimatedMinMax}
        isPaused={r.isPaused}
        ownerName={r.ownerName}
        ownerQuote={r.ownerQuote}
        description={r.description}
        hours={r.hours}
      />

      {/* ── Menu browser — sticky tabs + scrollable sections ─────────── */}
      <MenuBrowser key={slug} items={items} mostOrderedItems={mostOrderedItems} restaurant={restaurantInfo} />

      {/* ── Secret Menu — hidden if restaurant has no secret items ──────── */}
      <SecretMenuSection items={secretItems} walletBalance={walletBalance} />
    </main>
  );
}
