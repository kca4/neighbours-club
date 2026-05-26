import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RestaurantGrid from "./RestaurantGrid";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Order from Kanata's best local restaurants, delivered to your door.",
};

export default async function DeliveryPage() {
  const raw = await prisma.restaurant.findMany({
    where: { isActive: true, isPaused: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      cuisine: true,
      description: true,
      heroImageUrl: true,
      logoUrl: true,
      rating: true,
      reviewCount: true,
      estimatedMinMin: true,
      estimatedMinMax: true,
    },
  });

  // Serialise Prisma Decimal → number so the client component can receive it
  const restaurants = raw.map((r) => ({
    ...r,
    rating: r.rating !== null ? Number(r.rating) : null,
  }));

  return (
    <main className="flex flex-1 flex-col bg-background">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-foreground/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Kanata · Ottawa
          </p>
          <h1
            className="text-4xl font-bold italic leading-none text-foreground sm:text-5xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Delivery
          </h1>
          <p className="mt-2 text-base text-foreground/55">
            Order from Kanata&apos;s best, delivered to your door.
          </p>
        </div>
      </div>

      {/* ── Restaurant grid (client — handles search + filter) ───────────── */}
      <RestaurantGrid restaurants={restaurants} />
    </main>
  );
}
