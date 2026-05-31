"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

export default function FloatingCartBar() {
  const pathname = usePathname();
  const { itemCount, subtotal, openDrawer, state } = useCart();
  const [bounce, setBounce] = useState(false);
  const prevCount = useRef(itemCount);

  // Trigger bounce animation when item count increases
  useEffect(() => {
    if (itemCount > prevCount.current) {
      setBounce(true);
      const t = setTimeout(() => setBounce(false), 400);
      prevCount.current = itemCount;
      return () => clearTimeout(t);
    }
    prevCount.current = itemCount;
  }, [itemCount]);

  // Don't render on checkout routes — the page has its own fixed footer
  if (pathname.startsWith("/delivery/checkout")) return null;

  // Don't render on a different restaurant's page than what's in the cart —
  // the bar would misleadingly suggest the cart belongs to the current restaurant.
  const slugMatch = pathname.match(/^\/delivery\/([^/]+)/);
  const pageSlug = slugMatch?.[1];
  if (pageSlug && state.restaurantSlug && pageSlug !== state.restaurantSlug) return null;

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-40 px-4 pt-4 transition-transform duration-300 ease-in-out",
        itemCount > 0 ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
      // Safe area bottom padding for devices with home indicators
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      aria-hidden={itemCount === 0}
    >
      <button
        onClick={openDrawer}
        disabled={itemCount === 0}
        aria-label={`View order — ${itemCount} item${itemCount !== 1 ? "s" : ""}, $${subtotal.toFixed(2)}`}
        className="mx-auto flex w-full max-w-lg items-center justify-between rounded-2xl bg-primary px-5 py-4 text-white shadow-lg transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {/* Item count badge */}
        <span
          className={[
            "flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold tabular-nums",
            bounce ? "animate-bounce" : "",
          ].join(" ")}
          aria-hidden
        >
          {itemCount}
        </span>

        {/* Label */}
        <span
          className="text-base font-semibold"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          View order
        </span>

        {/* Subtotal */}
        <span className="text-base font-semibold tabular-nums">
          ${subtotal.toFixed(2)}
        </span>
      </button>
    </div>
  );
}
