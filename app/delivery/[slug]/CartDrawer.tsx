"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "../CartProvider";

export default function CartDrawer() {
  const router = useRouter();
  const { state, itemCount, subtotal, isDrawerOpen, closeDrawer, updateQuantity } =
    useCart();
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Auto-close when the cart empties
  useEffect(() => {
    if (isDrawerOpen && itemCount === 0) {
      closeDrawer();
    }
  }, [itemCount, isDrawerOpen, closeDrawer]);

  // Focus management + focus trap + Escape key
  useEffect(() => {
    if (!isDrawerOpen) return;

    // Focus the close button when the drawer opens
    closeRef.current?.focus();

    const FOCUSABLE =
      'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDrawer();
        return;
      }
      if (e.key !== "Tab") return;

      const drawer = drawerRef.current;
      if (!drawer) return;

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      if (focusable.length < 2) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={closeDrawer}
        aria-hidden
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        className={[
          "fixed z-50 flex flex-col bg-white shadow-2xl",
          // Mobile: bottom sheet, full width
          "bottom-0 left-0 right-0 max-h-[85dvh] rounded-t-2xl",
          // Desktop: right panel full height
          "sm:bottom-0 sm:left-auto sm:right-0 sm:top-0 sm:max-h-full sm:w-[420px] sm:rounded-none sm:rounded-l-2xl",
        ].join(" ")}
      >
        {/* Drag handle — mobile only */}
        <div className="flex shrink-0 justify-center pt-3 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-foreground/15" />
        </div>

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-foreground/8 px-5 py-4">
          <div>
            <h2
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Your order
            </h2>
            {state.restaurantName && (
              <p className="text-xs text-foreground/50">{state.restaurantName}</p>
            )}
          </div>
          <button
            ref={closeRef}
            onClick={closeDrawer}
            aria-label="Close cart"
            className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Items list */}
        <ul className="flex flex-col gap-4 flex-1 overflow-y-auto px-5 py-4">
          {state.items.map((item) => (
            <li key={item.itemId} className="flex items-center gap-3">
              {/* Thumbnail — image or color swatch */}
              <div
                className="h-12 w-12 shrink-0 overflow-hidden rounded-lg"
                style={{ backgroundColor: item.colorHex ?? "#0F766E" }}
                aria-hidden
              >
                {item.imageUrl && (
                  <div className="relative h-full w-full">
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Name + line total */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {item.name}
                </p>
                <p className="text-xs text-foreground/50">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Quantity stepper */}
              <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`${item.name} quantity`}>
                <button
                  onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                  aria-label={
                    item.quantity === 1
                      ? `Remove ${item.name} from cart`
                      : `Decrease ${item.name} quantity`
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/15 text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <Minus size={12} strokeWidth={2.5} aria-hidden />
                </button>
                <span
                  className="w-6 text-center text-sm font-semibold tabular-nums"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                  aria-label={`Increase ${item.name} quantity`}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
                >
                  <Plus size={12} strokeWidth={2.5} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div
          className="shrink-0 border-t border-foreground/8 px-5 pt-4"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          {/* Subtotal row */}
          <div className="mb-4 flex items-center justify-between">
            <span
              className="text-sm font-semibold text-foreground/60"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Subtotal
            </span>
            <span className="text-base font-bold tabular-nums text-foreground">
              ${subtotal.toFixed(2)}
            </span>
          </div>

          {/* Checkout CTA */}
          <button
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => {
              closeDrawer();
              router.push("/delivery/checkout");
            }}
          >
            Go to checkout
          </button>
        </div>
      </div>
    </>
  );
}
