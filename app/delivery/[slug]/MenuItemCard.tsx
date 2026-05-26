"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface SerializedMenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  tags: string[];
  imageUrl: string | null;
  colorHex: string | null;
  sortOrder: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

// ─── Image variant — 2-col grid ───────────────────────────────────────────────

export function ImageMenuItemCard({
  item,
  badge,
}: {
  item: SerializedMenuItem;
  badge?: string | null;
}) {
  const [imgError, setImgError] = useState(false);
  // Fallback background: item's colorHex or brand teal
  const fallbackBg = item.colorHex ?? "#0F766E";

  return (
    <div className="flex flex-col gap-2">
      {/* Square image container */}
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-foreground/5">
        {!imgError ? (
          <Image
            src={item.imageUrl!}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          /* Error fallback — solid color with item name */
          <div
            className="flex h-full w-full items-center justify-center p-3"
            style={{ backgroundColor: fallbackBg }}
          >
            <span className="text-center text-xs font-semibold leading-snug text-white">
              {item.name}
            </span>
          </div>
        )}

        {/* Badge — top-left */}
        {badge && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold leading-tight text-white shadow">
            {badge}
          </span>
        )}

        {/* Add button — bottom-right */}
        <button
          onClick={() => console.log("Add to cart:", item.id)}
          aria-label={`Add ${item.name} to cart`}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform active:scale-95 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden />
        </button>
      </div>

      {/* Text */}
      <div>
        <p
          className="text-sm font-semibold leading-snug text-foreground"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {item.name}
        </p>
        <p className="mt-0.5 text-sm text-foreground/60">{formatPrice(item.price)}</p>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-medium capitalize text-foreground/55"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── List variant — no image, full-width ──────────────────────────────────────

export function ListMenuItemCard({ item }: { item: SerializedMenuItem }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-foreground/8 bg-white px-4 py-3">
      {/* Left — name, description, price */}
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-semibold text-foreground"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {item.name}
        </p>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-foreground/50">
            {item.description}
          </p>
        )}
        <p className="mt-1 text-sm font-medium text-foreground/70">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* Right — color accent square + add button */}
      <div className="flex shrink-0 items-center gap-2">
        {item.colorHex && (
          <div
            className="h-10 w-10 shrink-0 rounded-lg"
            style={{ backgroundColor: item.colorHex }}
            aria-hidden
          />
        )}
        <button
          onClick={() => console.log("Add to cart:", item.id)}
          aria-label={`Add ${item.name} to cart`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform active:scale-95 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden />
        </button>
      </div>
    </div>
  );
}
