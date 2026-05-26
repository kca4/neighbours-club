import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import type { OperatingHours } from "@/lib/types/delivery";
import RestaurantHero from "./RestaurantHero";
import InfoBar from "./InfoBar";

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
    title: restaurant.name,
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

  // Serialise menu items (price Decimal → number) for upcoming menu section
  const _items = menuItems.map((item) => ({
    ...item,
    price: Number(item.price),
  }));
  void _items; // referenced by the menu section in the next build step

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

      {/* ── Menu sections ─────────────────────────────────────────────────
          Built in the next step. Items are fetched above in `_items`.
      ─────────────────────────────────────────────────────────────────── */}
    </main>
  );
}
