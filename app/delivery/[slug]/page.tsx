import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { OperatingHours } from "@/lib/types/delivery";
import RestaurantHero from "./RestaurantHero";
import InfoBar from "./InfoBar";
import MenuBrowser from "./MenuBrowser";

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

  // Fetch menu items — used by the menu sections (next prompt)
  const menuItems = await prisma.menuItem.findMany({
    where: { restaurantId: restaurant.id, isAvailable: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

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

  // Serialise menu items (Decimal → number, strip unused Date fields)
  const items = menuItems.map((item) => ({
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
      <MenuBrowser items={items} />
    </main>
  );
}
