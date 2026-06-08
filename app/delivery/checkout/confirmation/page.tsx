"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Clock,
  XCircle,
  UtensilsCrossed,
  Bike,
  MapPin,
  PartyPopper,
  Loader2,
} from "lucide-react";
import { useCart } from "../../CartProvider";
import {
  getDeliveryOrderStatus,
  type DeliveryOrderSummary,
} from "../../actions/getOrderStatus";

// ─── Status config ────────────────────────────────────────────────────────────

type DeliveryStatus = DeliveryOrderSummary["status"];

const TERMINAL: DeliveryStatus[] = ["DELIVERED", "CANCELLED"];

// Customer-facing message for each backend status
const STATUS_MESSAGE: Record<string, string> = {
  PENDING_PAYMENT: "Confirming your payment…",
  PENDING: "Order received — waiting for the kitchen to confirm.",
  ACCEPTED: "A courier is lined up. Waiting on the kitchen.",
  AWAITING_COURIER: "Finding a courier for your order…",
  COURIER_ASSIGNED: "A courier is assigned and heading to the restaurant.",
  COOKING: "The kitchen is preparing your food!",
  READY: "Your food is ready — courier is picking it up.",
  PICKED_UP: "Your food is on the way!",
  DELIVERED: "Delivered — enjoy your meal!",
  CANCELLED: "This order was cancelled.",
};

// ─── Progress stepper ─────────────────────────────────────────────────────────
// Five customer-visible stages. Each covers one or more backend statuses.

type StepKey = "received" | "finding_courier" | "cooking" | "on_the_way" | "delivered";

interface Step {
  key: StepKey;
  label: string;
  icon: React.ReactNode;
  /** Backend statuses that count as "this step is active/current" */
  activeStatuses: string[];
  /** Backend statuses at or beyond which this step is complete */
  doneStatuses: string[];
}

const STEPS: Step[] = [
  {
    key: "received",
    label: "Order received",
    icon: <CheckCircle size={18} strokeWidth={2} aria-hidden />,
    activeStatuses: ["PENDING_PAYMENT", "PENDING"],
    doneStatuses: [
      "ACCEPTED",
      "AWAITING_COURIER",
      "COURIER_ASSIGNED",
      "COOKING",
      "READY",
      "PICKED_UP",
      "DELIVERED",
    ],
  },
  {
    key: "finding_courier",
    label: "Finding a courier",
    icon: <MapPin size={18} strokeWidth={2} aria-hidden />,
    activeStatuses: ["ACCEPTED", "AWAITING_COURIER", "COURIER_ASSIGNED"],
    doneStatuses: ["COOKING", "READY", "PICKED_UP", "DELIVERED"],
  },
  {
    key: "cooking",
    label: "Preparing your food",
    icon: <UtensilsCrossed size={18} strokeWidth={2} aria-hidden />,
    activeStatuses: ["COOKING", "READY"],
    doneStatuses: ["PICKED_UP", "DELIVERED"],
  },
  {
    key: "on_the_way",
    label: "On the way",
    icon: <Bike size={18} strokeWidth={2} aria-hidden />,
    activeStatuses: ["PICKED_UP"],
    doneStatuses: ["DELIVERED"],
  },
  {
    key: "delivered",
    label: "Delivered!",
    icon: <PartyPopper size={18} strokeWidth={2} aria-hidden />,
    activeStatuses: ["DELIVERED"],
    doneStatuses: [],
  },
];

type StepState = "done" | "active" | "upcoming";

function getStepState(step: Step, status: string): StepState {
  if (step.doneStatuses.includes(status)) return "done";
  if (step.activeStatuses.includes(status)) return "active";
  return "upcoming";
}

// ─── ProgressStepper ──────────────────────────────────────────────────────────

function ProgressStepper({ status }: { status: string }) {
  return (
    <ol className="relative" aria-label="Delivery progress">
      {STEPS.map((step, i) => {
        const state = getStepState(step, status);
        const isLast = i === STEPS.length - 1;

        return (
          <li key={step.key} className="flex gap-4">
            {/* Left column: icon + connector line */}
            <div className="flex flex-col items-center">
              <div
                className={[
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                  state === "done"
                    ? "border-primary bg-primary text-white"
                    : state === "active"
                    ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_4px] shadow-primary/15"
                    : "border-foreground/15 bg-white text-foreground/25",
                ].join(" ")}
              >
                {state === "done" ? (
                  <CheckCircle size={18} strokeWidth={2.5} aria-hidden />
                ) : state === "active" ? (
                  <div className="animate-pulse">{step.icon}</div>
                ) : (
                  step.icon
                )}
              </div>
              {!isLast && (
                <div
                  className={[
                    "my-1 w-0.5 flex-1 min-h-[1.5rem] rounded-full transition-colors duration-500",
                    state === "done" ? "bg-primary" : "bg-foreground/10",
                  ].join(" ")}
                  aria-hidden
                />
              )}
            </div>

            {/* Right column: label */}
            <div className="pb-6 pt-1.5">
              <p
                className={[
                  "text-sm font-semibold transition-colors",
                  state === "active"
                    ? "text-primary"
                    : state === "done"
                    ? "text-foreground/60"
                    : "text-foreground/25",
                ].join(" ")}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {step.label}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
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
    let pendingPaymentAttempts = 0;
    const MAX_PAYMENT_ATTEMPTS = 15; // 15 × 2s = 30s fast-poll window

    async function poll() {
      if (stopped) return;

      const result = await getDeliveryOrderStatus(orderId!);

      if (stopped) return;

      if (!result) {
        router.replace("/delivery");
        return;
      }

      setOrder(result);
      setLoading(false);

      // Terminal states — stop polling
      if (TERMINAL.includes(result.status)) {
        if (result.status !== "CANCELLED" && !cartCleared.current) {
          cartCleared.current = true;
          clearCart();
        }
        return;
      }

      // Payment confirmed — clear cart if not done yet
      if (result.status !== "PENDING_PAYMENT" && !cartCleared.current) {
        cartCleared.current = true;
        clearCart();
      }

      // Poll interval:
      // - PENDING_PAYMENT: fast (2s) for up to 30s, then fall back to 10s
      // - All other active statuses: 10s
      if (result.status === "PENDING_PAYMENT") {
        pendingPaymentAttempts++;
        if (pendingPaymentAttempts >= MAX_PAYMENT_ATTEMPTS) {
          setTimedOut(true);
          if (!cartCleared.current) {
            cartCleared.current = true;
            clearCart();
          }
          // Switch to slow polling — webhook may still arrive
          setTimeout(poll, 10_000);
        } else {
          setTimeout(poll, 2_000);
        }
      } else {
        setTimeout(poll, 10_000);
      }
    }

    poll();

    return () => {
      stopped = true;
    };
  }, [orderId, router, clearCart]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" aria-hidden />
        <p
          className="text-sm text-foreground/50"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Confirming your order…
        </p>
      </div>
    );
  }

  // ── Cancelled ────────────────────────────────────────────────────────────────
  if (order?.status === "CANCELLED") {
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
            Your card was declined. Please check your payment details and try
            again.
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

  // ── Payment slow / timed out — reassurance banner ────────────────────────────
  const showPaymentSlowBanner =
    timedOut && order?.status === "PENDING_PAYMENT";

  const items = order?.items as CartItemSnapshot[] | undefined;
  const status = order?.status ?? "PENDING_PAYMENT";
  const message = STATUS_MESSAGE[status] ?? "Processing your order…";
  const isDelivered = status === "DELIVERED";

  // ── Main tracker view ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-10">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="mb-8 text-center">
          {isDelivered ? (
            <>
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
                <PartyPopper className="h-10 w-10 text-primary" aria-hidden />
              </div>
              <h1
                className="text-3xl font-bold italic text-foreground"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Enjoy your meal!
              </h1>
              <p
                className="mt-2 text-sm text-foreground/55"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Your order from {order?.restaurantName} has arrived.
              </p>
            </>
          ) : (
            <>
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
                <UtensilsCrossed className="h-10 w-10 text-primary" aria-hidden />
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
                Order #{order?.id.slice(-8).toUpperCase()} ·{" "}
                {order?.restaurantName}
              </p>
            </>
          )}
        </div>

        {/* ── Payment slow banner ──────────────────────────────────────────── */}
        {showPaymentSlowBanner && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p
              className="text-sm text-amber-800"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Payment is being processed. Your order is confirmed — there&apos;s
              a short delay on our end.
            </p>
          </div>
        )}

        {/* ── Live status message ──────────────────────────────────────────── */}
        {!isDelivered && (
          <div
            className="mb-6 rounded-2xl border border-primary/15 bg-primary/5 px-5 py-4"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center gap-3">
              {status !== "PENDING_PAYMENT" && (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-primary/60"
                  aria-hidden
                />
              )}
              <p
                className="text-sm font-semibold text-primary"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {message}
              </p>
            </div>
            {status === "PICKED_UP" && order?.pickedUpAt && (
              <p
                className="mt-1 pl-7 text-xs text-primary/60"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Picked up at {formatTime(order.pickedUpAt)}
              </p>
            )}
          </div>
        )}

        {/* ── Progress stepper ─────────────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-foreground/8 bg-white px-6 py-5">
          <ProgressStepper status={status} />
        </div>

        {/* ── Delivery photo proof (DELIVERED + photo exists) ──────────────── */}
        {isDelivered && order?.dropoffPhotoUrl && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-foreground/8 bg-white">
            <div className="border-b border-foreground/6 px-4 py-3">
              <p
                className="text-xs font-semibold uppercase tracking-widest text-foreground/40"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Delivery photo
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={order.dropoffPhotoUrl}
              alt="Proof of delivery"
              className="h-56 w-full object-cover"
            />
          </div>
        )}

        {/* ── Order summary ─────────────────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-foreground/8 bg-white p-5 shadow-sm">
          {/* Estimated time */}
          {!isDelivered &&
            order?.estimatedMinMin != null &&
            order.estimatedMinMax != null && (
              <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-teal-50 px-4 py-3">
                <Clock
                  className="h-4 w-4 shrink-0 text-primary"
                  aria-hidden
                />
                <p
                  className="text-sm font-semibold text-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  Estimated delivery: {order.estimatedMinMin}–
                  {order.estimatedMinMax} min
                </p>
              </div>
            )}

          {/* Items */}
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

          {/* Totals */}
          <div
            className="mt-4 space-y-1.5 border-t border-foreground/6 pt-4"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {[
              { label: "Subtotal", value: order?.subtotal ?? 0 },
              { label: "Delivery fee", value: order?.deliveryFee ?? 0 },
              { label: "Service fee (10%)", value: order?.serviceFee ?? 0 },
              { label: "Tax", value: order?.tax ?? 0 },
              { label: "Tip", value: order?.tip ?? 0 },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-sm text-foreground/50">{label}</span>
                <span className="text-sm tabular-nums text-foreground/50">
                  {fmt(value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between border-t border-foreground/8 pt-1.5">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {fmt(order?.total ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Footer links ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <Link
            href="/delivery"
            className="block rounded-2xl bg-primary py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {isDelivered ? "Order again" : "Order more food"}
          </Link>
          {order?.restaurantSlug && (
            <Link
              href={`/delivery/${order.restaurantSlug}`}
              className="block rounded-2xl border border-foreground/15 py-3.5 text-center text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground/25"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Back to {order.restaurantName}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
