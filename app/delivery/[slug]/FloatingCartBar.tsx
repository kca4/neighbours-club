"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "../CartProvider";

export default function FloatingCartBar() {
  const { itemCount, subtotal, openDrawer } = useCart();
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

  return (
    <div
      className={[
        "fixed bottom-0 left-0 right-0 z-40 p-4 transition-transform duration-300 ease-in-out",
        itemCount > 0 ? "translate-y-0" : "translate-y-full",
      ].join(" ")}
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
