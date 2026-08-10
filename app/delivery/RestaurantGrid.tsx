"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Star, Clock, X } from "lucide-react";
import { REVIEWS_ENABLED } from "@/lib/delivery/reviews";

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
  const [heroError, setHeroError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const showHero = !!r.heroImageUrl && !heroError;
  const showLogo = !!r.logoUrl && !logoError;

  return (
    <Link
      href={`/delivery/${r.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-white shadow-sm transition-all duration-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {/* Hero image */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-2xl bg-foreground/5">
        {showHero ? (
          <Image
            src={r.heroImageUrl!}
            alt={`${r.name} restaurant`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setHeroError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span
              className="select-none text-5xl font-bold italic text-primary/25"
              style={{ fontFamily: "var(--font-fraunces)" }}
              aria-hidden
            >
              {r.name[0]}
            </span>
          </div>
        )}

        {/* Logo — overlaps bottom of hero */}
        {r.logoUrl && (
          <div className="absolute bottom-0 left-4 h-12 w-12 translate-y-1/2 overflow-hidden rounded-full border-2 border-white bg-white shadow">
            {showLogo ? (
              <Image
                src={r.logoUrl}
                alt={`${r.name} logo`}
                fill
                sizes="48px"
                className="object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary">
                <span
                  className="text-base font-bold text-white"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {r.name[0]}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-8">
        {/* h3 — below the page h1 "Delivery" */}
        <h3
          className="text-lg font-bold leading-tight text-foreground transition-colors group-hover:text-primary"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          {r.name}
        </h3>

        {/* Cuisine + rating */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          <span className="text-foreground/50">{r.cuisine}</span>
          {REVIEWS_ENABLED && r.rating !== null && (
            <>
              <span className="text-foreground/20" aria-hidden>·</span>
              <span className="flex items-center gap-1 font-semibold text-accent">
                <Star size={12} fill="currentColor" strokeWidth={0} aria-hidden />
                <span>{r.rating.toFixed(1)}</span>
              </span>
              <span className="text-xs text-foreground/35">
                ({r.reviewCount.toLocaleString()})
              </span>
            </>
          )}
        </div>

        {/* Description — 2-line clamp */}
        {r.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/50">
            {r.description}
          </p>
        )}

        {/* Delivery time */}
        <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-foreground/45">
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

  const cuisines = useMemo(() => {
    const unique = Array.from(new Set(restaurants.map((r) => r.cuisine))).sort();
    return ["All", ...unique];
  }, [restaurants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return restaurants.filter((r) => {
      const cuisineMatch = activeCuisine === "All" || r.cuisine === activeCuisine;
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
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      {/* Search + filter controls */}
      <div className="mb-6 space-y-4">
        {/* Search input */}
        <div className="relative max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or cuisine…"
            aria-label="Search restaurants"
            className="[&::-webkit-search-cancel-button]:appearance-none w-full rounded-xl border border-foreground/10 bg-white py-2.5 pl-10 pr-9 text-sm text-foreground placeholder:text-foreground/35 shadow-sm transition-colors focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 transition-colors hover:text-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>

        {/* Cuisine filter pills */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
          role="group"
          aria-label="Filter by cuisine"
        >
          {cuisines.map((cuisine) => {
            const active = activeCuisine === cuisine;
            return (
              <button
                key={cuisine}
                onClick={() => setActiveCuisine(cuisine)}
                aria-pressed={active}
                className={[
                  "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "border border-foreground/10 bg-white text-foreground/60 hover:border-primary/40 hover:text-primary",
                ].join(" ")}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count + clear — only when filters are active */}
      {hasFilters && (
        <div className="mb-4 flex items-center justify-between text-xs text-foreground/45">
          <span>
            {filtered.length === 0
              ? "No restaurants found"
              : `${filtered.length} restaurant${filtered.length === 1 ? "" : "s"}`}
          </span>
          <button
            onClick={clearFilters}
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid or empty state */}
      {filtered.length > 0 ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <RestaurantCard r={r} />
            </li>
          ))}
        </ul>
      ) : hasFilters ? (
        /* Filters active, nothing matched */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-foreground/5 bg-white py-20 text-center">
          <p
            className="text-2xl font-bold italic text-foreground/20"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            No restaurants found
          </p>
          <p className="mt-2 text-sm text-foreground/40">
            Try a different search or browse all cuisines.
          </p>
          <button
            onClick={clearFilters}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Show all
          </button>
        </div>
      ) : (
        /* No restaurants in the database yet */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-foreground/5 bg-white py-20 text-center">
          <p
            className="text-2xl font-bold italic text-foreground/20"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Coming soon
          </p>
          <p className="mt-2 text-sm text-foreground/40">
            We&apos;re signing up Kanata&apos;s best restaurants. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}
