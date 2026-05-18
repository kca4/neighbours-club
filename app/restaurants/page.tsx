import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Restaurants",
  description:
    "Order from local Kanata restaurants and get food delivered to your door.",
};

export default async function RestaurantsPage() {
  const restaurants = await prisma.restaurant.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      cuisine: true,
      address: true,
      description: true,
      heroImageUrl: true,
      rating: true,
      reviewCount: true,
      estimatedMinMin: true,
      estimatedMinMax: true,
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Restaurants
        </h1>
        <p className="mt-2 text-lg text-foreground/60">
          Order from local Kanata restaurants and support your neighbourhood.
        </p>
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-white p-12 text-center">
          <p className="text-foreground/50">
            No restaurants available right now — check back soon!
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link
                href={`/restaurants/${restaurant.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden"
              >
                {restaurant.heroImageUrl && (
                  <div className="h-40 w-full overflow-hidden">
                    <img
                      src={restaurant.heroImageUrl}
                      alt={restaurant.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex flex-col flex-1 p-6">
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
                  {restaurant.cuisine}
                </div>
                <h2 className="mb-2 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                  {restaurant.name}
                </h2>
                {restaurant.description && (
                  <p className="mb-4 text-sm text-foreground/60 line-clamp-2">
                    {restaurant.description}
                  </p>
                )}
                <div className="mt-auto flex items-end justify-between gap-4">
                  <div className="text-sm text-foreground/50">
                    {restaurant.address}
                  </div>
                  <div className="shrink-0 text-right">
                    {restaurant.rating !== null && (
                      <div className="text-sm font-semibold text-foreground">
                        ★ {Number(restaurant.rating).toFixed(1)}
                        {restaurant.reviewCount > 0 && (
                          <span className="ml-1 font-normal text-foreground/40">
                            ({restaurant.reviewCount})
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-foreground/40">
                      {restaurant.estimatedMinMin}–{restaurant.estimatedMinMax} min
                    </div>
                  </div>
                </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
