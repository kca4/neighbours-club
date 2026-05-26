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
  return (
    <div className="relative w-full aspect-[2/1] lg:aspect-[3/1] overflow-hidden bg-foreground/10">
      {/* Hero image */}
      {heroImageUrl ? (
        <Image
          src={heroImageUrl}
          alt={name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary-dark" />
      )}

      {/* Gradient overlay — lighter at top, heavier at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      {/* Back button — teal pill, top-left */}
      <Link
        href="/delivery"
        aria-label="Back to restaurants"
        className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <ChevronLeft size={20} strokeWidth={2.5} />
      </Link>

      {/* Bottom content — logo + name + sub-line */}
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-6">
        {/* Logo */}
        {logoUrl && (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white shadow-lg">
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
        )}

        {/* Name + cuisine · neighbourhood */}
        <div className="min-w-0 pb-0.5">
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
