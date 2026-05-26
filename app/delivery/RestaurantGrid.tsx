"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Star, Clock, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RestaurantSummary {
  id: string;
  slug: string;
  name: string;
  cuisine: string;
  description: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
  rating: number | null;
  reviewCount: number;
  estimatedMinMin: number;
  estimatedMinMax: number;
}

// ─── RestaurantCard ───────────────────────────────────────────────────────────

function RestaurantCard({ r }: { r: RestaurantSummary }) {
  return (
    <Link
      href={`/delivery/${r.slug}`}
      className="group flex flex-col rounded-2xl bg-white border border-foreground/5 shadow-sm hover:shadow-md transition-all duration-200 overflow-visible"
    >
      {/* Hero image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-foreground/5 shrink-0">
        {r.heroImageUrl ? (
          <Image
            src={r.heroImageUrl}
            alt={r.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
            <span
              className="text-5xl font-bold italic text-primary/20 select-none"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {r.name[0]}
            </span>
          </div>
        )}

        {/* Logo — overlaps bottom of hero */}
        {r.logoUrl && (
          <div className="absolute bottom-0 left-4 translate-y-1/2 h-12 w-12 rounded-full border-2 border-white bg-white shadow overflow-hidden shrink-0">
            <Image
              src={r.logoUrl}
              alt={`${r.name} logo`}
              fill
              sizes="48px"
              className="object-cover"
            />
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
        {/* Name */}
        <h3
          className="text-lg font-bold leading-tight text-foreground group-hover:text-primary transition-colors"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {r.name}
        </h3>

        {/* Cuisine + rating */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <span className="text-foreground/50">{r.cuisine}</span>

          {r.rating !== null && (
            <>
              <span className="text-foreground/20" aria-hidden>·</span>
              <span className="flex items-center gap-1 font-semibold text-accent">
                <Star size={12} fill="currentColor" strokeWidth={0} aria-hidden />
                {r.rating.toFixed(1)}
              </span>
              <span className="text-foreground/35 text-xs">
                ({r.reviewCount.toLocaleString()})
              </span>
            </>
          )}
        </div>

        {/* Description — 2-line clamp */}
        {r.description && (
          <p className="mt-2 text-xs text-foreground/50 leading-relaxed line-clamp-2">
            {r.description}
          </p>
        )}

        {/* Delivery time */}
        <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-foreground/45">
          <Clock size={12} strokeWidth={2} aria-hidden />
          <span>{r.estimatedMinMin}–{r.estimatedMinMax} min</span>
        </div>
      </div>
    </Link>
  );
}

// ─── RestaurantGrid ───────────────────────────────────────────────────────────

export default function RestaurantGrid({
  restaurants,
}: {
  restaurants: RestaurantSummary[];
}) {
  const [search, setSearch] = useState("");
  const [activeCuisine, setActiveCuisine] = useState("All");

  // Derive distinct cuisines from data (stable order: All first, then sorted)
  const cuisines = useMemo(() => {
    const unique = Array.from(new Set(restaurants.map((r) => r.cuisine))).sort();
    return ["All", ...unique];
  }, [restaurants]);

  // Filter by cuisine pill, then by search query
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const cuisineMatch =
        activeCuisine === "All" || r.cuisine === activeCuisine;
      const searchMatch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.cuisine.toLowerCase().includes(q);
      return cuisineMatch && searchMatch;
    });
  }, [restaurants, search, activeCuisine]);

  const hasFilters = search.trim() !== "" || activeCuisine !== "All";

  function clearFilters() {
    setSearch("");
    setActiveCuisine("All");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
      {/* Search + filters */}
      <div className="mb-6 space-y-4">
        {/* Search bar */}
        <div className="relative max-w-md">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35 pointer-events-none"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or cuisine…"
            className="w-full rounded-xl border border-foreground/10 bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/35 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Cuisine filter pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {cuisines.map((cuisine) => {
            const active = activeCuisine === cuisine;
            return (
              <button
                key={cuisine}
                onClick={() => setActiveCuisine(cuisine)}
                className={[
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white border border-foreground/10 text-foreground/60 hover:border-primary/40 hover:text-primary",
                ].join(" ")}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count + clear */}
      {hasFilters && (
        <div className="mb-4 flex items-center justify-between text-xs text-foreground/45">
          <span>
            {filtered.length === 0
              ? "No restaurants found"
              : `${filtered.length} restaurant${filtered.length === 1 ? "" : "s"}`}
          </span>
          <button
            onClick={clearFilters}
            className="text-primary font-medium hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <RestaurantCard r={r} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-foreground/5 bg-white py-20 text-center">
          <p
            className="text-2xl font-bold italic text-foreground/20"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Nothing here
          </p>
          <p className="mt-2 text-sm text-foreground/40">
            Try a different search or browse all restaurants.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Show all
          </button>
        </div>
      )}
    </div>
  );
}
