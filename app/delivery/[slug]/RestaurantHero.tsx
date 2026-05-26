"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

interface RestaurantHeroProps {
  name: string;
  cuisine: string;
  neighbourhoodName: string | null;
  heroImageUrl: string | null;
  logoUrl: string | null;
}

export default function RestaurantHero({
  name,
  cuisine,
  neighbourhoodName,
  heroImageUrl,
  logoUrl,
}: RestaurantHeroProps) {
  const [heroError, setHeroError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const showHeroImage = !!heroImageUrl && !heroError;
  const showLogoImage = !!logoUrl && !logoError;

  return (
    // Taller on mobile (4:3) so food images read well at 375px.
    // Widens to 2:1 at sm, and 3:1 on large screens.
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-foreground/10 sm:aspect-[2/1] lg:aspect-[3/1]">
      {/* Hero image — falls back to branded gradient + initial on error */}
      {showHeroImage ? (
        <Image
          src={heroImageUrl}
          alt={`${name} restaurant hero`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          onError={() => setHeroError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-teal-800">
          <span
            className="select-none text-9xl font-bold italic text-white/15"
            style={{ fontFamily: "var(--font-fraunces)" }}
            aria-hidden
          >
            {name[0]}
          </span>
        </div>
      )}

      {/* Gradient overlay — heavier at bottom for legible text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      {/* Back button */}
      <Link
        href="/delivery"
        aria-label="Back to restaurants"
        className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1"
      >
        <ChevronLeft size={20} strokeWidth={2.5} aria-hidden />
      </Link>

      {/* Bottom content — logo + name + sub-line */}
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-6">
        {/* Logo — circular, with initial fallback */}
        {logoUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-lg">
            {showLogoImage ? (
              <Image
                src={logoUrl}
                alt={`${name} logo`}
                fill
                sizes="64px"
                className="object-cover"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary">
                <span
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {name[0]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Restaurant name + cuisine · neighbourhood */}
        <div className="min-w-0 pb-0.5">
          {/* h1 — top of the heading hierarchy on this page */}
          <h1
            className="text-2xl font-bold italic leading-tight text-white drop-shadow sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {name}
          </h1>
          <p className="mt-1 text-sm text-white/75">
            {cuisine}
            {neighbourhoodName && (
              <span className="text-white/50"> · {neighbourhoodName}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
