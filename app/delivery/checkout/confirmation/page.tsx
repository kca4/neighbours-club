"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Clock, ShoppingBag, XCircle } from "lucide-react";
import { useCart } from "../../CartProvider";
import {
  getDeliveryOrderStatus,
  type DeliveryOrderSummary,
} from "../../actions/getOrderStatus";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

type CartItemSnapshot = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<DeliveryOrderSummary | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [loading, setLoading] = useState(true);

  const cartCleared = useRef(false);

  useEffect(() => {
    if (!orderId) {
      router.replace("/delivery");
      return;
    }

    let stopped = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 15; // 15 × 2s = 30s

    async function poll() {
      if (stopped) return;

      const result = await getDeliveryOrderStatus(orderId!);
      attempts++;

      if (stopped) return;

      if (!result) {
        router.replace("/delivery");
        return;
      }

      setOrder(result);
      setLoading(false);

      if (result.status === "cancelled") {
        // Payment failed — webhook fired and cancelled the order.
        // Cart is NOT cleared (user may want to retry).
        return;
      }

      if (result.status !== "pending_payment") {
        // Webhook confirmed the order — clear cart and stop polling.
        if (!cartCleared.current) {
          cartCleared.current = true;
          clearCart();
        }
        return;
      }

      // Status is still pending_payment — webhook hasn't fired yet, keep polling.
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(poll, 2000);
      } else {
        // Polling timed out — webhook is slow but payment went through.
        setTimedOut(true);
        if (!cartCleared.current) {
          cartCleared.current = true;
          clearCart();
        }
      }
    }

    // First call is immediate — webhook is often faster than the browser redirect,
    // so we may already have a confirmed status on the very first fetch.
    poll();

    return () => {
      stopped = true;
    };
  }, [orderId, router, clearCart]);

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p
          className="text-sm text-foreground/50"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Confirming your order…
        </p>
      </div>
    );
  }

  const items = order?.items as CartItemSnapshot[] | undefined;

  // ── Payment failed (webhook set status to cancelled) ─────────────────────────
  if (order?.status === "cancelled") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <XCircle className="h-8 w-8 text-red-500" aria-hidden />
        </div>
        <div className="max-w-sm text-center">
          <h1
            className="text-2xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Payment declined
          </h1>
          <p
            className="mt-2 text-sm leading-relaxed text-foreground/60"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Your card was declined. Please check your payment details and try again.
          </p>
        </div>
        <Link
          href="/delivery/checkout"
          className="mt-2 rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Try again
        </Link>
      </div>
    );
  }

  // ── Timed out (webhook slow) ─────────────────────────────────────────────────
  if (timedOut || (order && order.status === "pending_payment")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
          <Clock className="h-8 w-8 text-amber-500" aria-hidden />
        </div>
        <div className="max-w-sm text-center">
          <h1
            className="text-2xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Payment is being processed
          </h1>
          <p
            className="mt-2 text-sm leading-relaxed text-foreground/60"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Your payment went through. You&apos;ll receive a confirmation
            shortly — there&apos;s a short delay on our end.
          </p>
        </div>
        <Link
          href="/delivery"
          className="mt-2 rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Back to restaurants
        </Link>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-12">
        {/* Icon + heading */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
            <CheckCircle className="h-10 w-10 text-primary" aria-hidden />
          </div>
          <h1
            className="text-3xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Order placed!
          </h1>
          <p
            className="mt-2 text-sm text-foreground/55"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {order?.restaurantName} is getting your food ready.
          </p>
        </div>

        {/* Order card */}
        <div className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <ShoppingBag className="h-5 w-5 shrink-0 text-primary/70" aria-hidden />
            <div>
              <p
                className="text-sm font-semibold text-foreground"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {order?.restaurantName}
              </p>
              <p
                className="text-xs text-foreground/40"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Order #{order?.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <span
              className="ml-auto text-sm font-semibold tabular-nums text-foreground"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              {fmt(order?.total ?? 0)}
            </span>
          </div>

          {items && items.length > 0 && (
            <ul className="divide-y divide-foreground/6">
              {items.map((item) => (
                <li
                  key={item.itemId}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span
                      className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold tabular-nums text-primary"
                      aria-label={`${item.quantity}×`}
                    >
                      {item.quantity}
                    </span>
                    <span className="truncate text-sm text-foreground">
                      {item.name}
                    </span>
                  </div>
                  <span className="ml-3 shrink-0 text-sm tabular-nums text-foreground/60">
                    {fmt(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 rounded-xl bg-teal-50 px-4 py-3">
            <p
              className="text-sm font-semibold text-primary"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Estimated delivery: 35–50 min
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/delivery"
            className="block rounded-2xl bg-primary py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Order more food
          </Link>
          <Link
            href={`/delivery/${order?.restaurantSlug}`}
            className="block rounded-2xl border border-foreground/15 py-3.5 text-center text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground/25"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Back to {order?.restaurantName}
          </Link>
        </div>
      </div>
    </div>
  );
}
