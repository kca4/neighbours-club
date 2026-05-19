import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { DealStatus, OrderStatus } from "@prisma/client";

const CONFIRMED_STATUSES: OrderStatus[] = [
  OrderStatus.AUTHORIZED,
  OrderStatus.CAPTURED,
  OrderStatus.PICKED_UP,
];

export const metadata: Metadata = {
  title: "Browse Deals",
  description:
    "Pool your buying power with neighbours and unlock lower prices on food, household goods, and more.",
};

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatPrice(price: { toString(): string } | number): string {
  return Number(price.toString()).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

export default async function DealsPage() {
  const deals = await prisma.deal.findMany({
    where: { status: DealStatus.OPEN },
    include: {
      supplier: true,
      tiers: { orderBy: { tierOrder: "asc" } },
      _count: {
        select: {
          orders: { where: { status: { in: CONFIRMED_STATUSES } } },
        },
      },
    },
    orderBy: { closesAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          Open deals
        </h1>
        <p className="mt-2 text-lg text-foreground/60">
          Join a group buy and unlock lower prices the more neighbours
          participate.
        </p>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-2xl border border-foreground/10 bg-white p-12 text-center">
          <p className="text-foreground/50">
            No open deals right now — check back soon!
          </p>
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {deals.map((deal) => {
            const orderCount = deal._count.orders;
            const daysLeft = daysUntil(deal.closesAt);
            const sortedTiers = deal.tiers; // already ordered by tierOrder asc
            const lowestPrice = sortedTiers[sortedTiers.length - 1].pricePerUnit;
            const currentTier =
              [...sortedTiers]
                .reverse()
                .find((t) => orderCount >= t.minMembers) ?? sortedTiers[0];
            const currentPrice = Number(currentTier.pricePerUnit);
            const progress = Math.min(
              100,
              Math.round((orderCount / deal.minimumMembers) * 100),
            );

            return (
              <li key={deal.id}>
                <Link
                  href={`/deals/${deal.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-foreground/10 bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden"
                >
                  {deal.imageUrl && (
                    <div className="h-40 w-full overflow-hidden">
                      <img
                        src={deal.imageUrl}
                        alt={deal.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 p-6">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/70">
                    {deal.supplier.name}
                  </div>
                  <h2 className="mb-4 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    {deal.title}
                  </h2>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-foreground/60">
                        {orderCount} of {deal.minimumMembers} members needed
                      </span>
                      <span className="font-semibold text-primary">
                        {progress}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Price + deadline */}
                  <div className="mt-auto flex items-end justify-between gap-4">
                    <div>
                      <div className="text-2xl font-bold text-foreground">
                        {formatPrice(currentPrice)}
                        <span className="ml-1 text-sm font-normal text-foreground/50">
                          / unit
                        </span>
                      </div>
                      {Number(lowestPrice) < currentPrice && (
                        <div className="text-xs text-primary/80">
                          Down to {formatPrice(Number(lowestPrice))} at max
                          tier
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`text-sm font-semibold ${daysLeft <= 2 ? "text-red-600" : "text-foreground/60"}`}
                      >
                        {daysLeft <= 0
                          ? "Closing soon"
                          : daysLeft === 1
                            ? "1 day left"
                            : `${daysLeft} days left`}
                      </div>
                      <div className="text-xs text-foreground/40">
                        up to {deal.maxQuantityPerMember} per member
                      </div>
                    </div>
                  </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
