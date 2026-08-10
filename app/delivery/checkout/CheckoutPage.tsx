"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../CartProvider";
import { createDeliveryOrder } from "../actions/createOrder";
import { DELIVERY_FEE, WAIVER_COST_CP, WAIVER_DISCOUNT_AMOUNT, computeFees } from "@/lib/delivery/fees";

// ─── Stripe init ──────────────────────────────────────────────────────────────
// Singleton — loadStripe is called once outside the component tree.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Types ────────────────────────────────────────────────────────────────────

type TipMode = "none" | "15" | "18" | "20" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return `$${n.toFixed(2)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-foreground/8 bg-white p-5 shadow-sm">
      {children}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-4 text-lg font-bold italic text-foreground"
      style={{ fontFamily: "var(--font-fraunces)" }}
    >
      {children}
    </h2>
  );
}

function TotalRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt
        className={bold ? "text-base font-bold text-foreground" : "text-sm text-foreground/60"}
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        {label}
      </dt>
      <dd
        className={
          bold
            ? "text-base font-bold tabular-nums text-foreground"
            : "text-sm tabular-nums text-foreground/80"
        }
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        {fmt(value)}
      </dd>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-semibold text-foreground/70"
      style={{ fontFamily: "var(--font-inter-tight)" }}
    >
      {children}
      {optional && (
        <span className="ml-1 font-normal text-foreground/40">(optional)</span>
      )}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-foreground/15 bg-white px-4 py-3 text-sm text-foreground " +
  "placeholder:text-foreground/35 transition-colors " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

// ─── Payment form (mounted inside <Elements>) ─────────────────────────────────

function PaymentForm({
  orderId,
  total,
}: {
  orderId: string;
  total: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setErrorMessage(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/delivery/checkout/confirmation?orderId=${orderId}`,
      },
    });

    // confirmPayment only reaches here on error — on success, browser navigates.
    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handlePay}>
      <SectionCard>
        <SectionHeading>Payment</SectionHeading>
        <PaymentElement />
        {errorMessage && (
          <p
            className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {errorMessage}
          </p>
        )}
      </SectionCard>

      {/* ── Fixed Pay footer ──────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-foreground/8 bg-white px-4 pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="submit"
            disabled={!stripe || paying}
            aria-label={`Pay ${fmt(total)}`}
            className={[
              "w-full rounded-2xl py-4 text-base font-semibold text-white shadow-sm transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              stripe && !paying
                ? "bg-primary hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
                : "cursor-not-allowed bg-foreground/25",
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {paying ? "Processing…" : `Pay ${fmt(total)}`}
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CheckoutPage({
  initialWalletBalance,
}: {
  initialWalletBalance: number;
}) {
  const router = useRouter();
  const { state, subtotal } = useCart();

  const [address, setAddress] = useState("");
  const [unit, setUnit] = useState("");
  const [instructions, setInstructions] = useState("");
  const [tipMode, setTipMode] = useState<TipMode>("none");
  const [customTip, setCustomTip] = useState("");
  const [waiverEnabled, setWaiverEnabled] = useState(false);

  // Phase 2 state — set after createDeliveryOrder succeeds
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  // Redirect to delivery listing if cart is empty
  useEffect(() => {
    if (state.items.length === 0) {
      router.replace("/delivery");
    }
  }, [state.items.length, router]);

  if (state.items.length === 0) return null;

  // ── Totals ──────────────────────────────────────────────────────────────────
  // computeFees mirrors the server-side calculation in createOrder.ts so the
  // displayed breakdown always matches what Stripe will charge.
  const tipAmount =
    tipMode === "none"
      ? 0
      : tipMode === "custom"
      ? Math.max(0, parseFloat(customTip) || 0)
      : subtotal * (parseInt(tipMode, 10) / 100);

  const fees = computeFees(subtotal, tipAmount, waiverEnabled);
  const { serviceFee, tax, total } = fees;

  // Whether the user has enough CP to use the waiver.
  const canUseWaiver = initialWalletBalance >= WAIVER_COST_CP;

  const canPlace = address.trim().length > 0 && !placing;

  // ── Place Order (Phase 1 → Phase 2) ─────────────────────────────────────────
  async function handlePlaceOrder() {
    if (!canPlace) return;
    setPlacing(true);
    setPlaceError(null);

    try {
      const result = await createDeliveryOrder({
        restaurantId: state.restaurantId!,
        items: state.items.map((item) => ({
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        // Server re-derives subtotal, deliveryFee, serviceFee, tax, total from
        // validated DB prices — only tip and waiver intent come from the client.
        tip: parseFloat(tipAmount.toFixed(2)),
        applyCpWaiver: waiverEnabled,
        deliveryAddress: {
          street: address.trim(),
          unit: unit.trim() || null,
          instructions: instructions.trim() || null,
        },
      });

      setClientSecret(result.clientSecret);
      setOrderId(result.orderId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      // If the user isn't signed in, redirect to login with a return URL
      if (msg.toLowerCase().includes("signed in")) {
        router.push("/signin?callbackUrl=/delivery/checkout");
        return;
      }
      setPlaceError(msg);
      setPlacing(false);
    }
  }

  // ── Phase 2: Stripe Elements ─────────────────────────────────────────────────
  if (clientSecret && orderId) {
    return (
      <div className="min-h-screen bg-background">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-foreground/8 bg-white">
          <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
            <button
              type="button"
              onClick={() => {
                setClientSecret(null);
                setOrderId(null);
                setPlacing(false);
              }}
              aria-label="Back to order details"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ArrowLeft size={20} aria-hidden />
            </button>
            <h1
              className="text-xl font-bold italic text-foreground"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Payment
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-4 px-4 pb-36 pt-6">
          {/* Order summary (compact) */}
          <SectionCard>
            <div className="mb-3 flex items-center justify-between">
              <span
                className="font-semibold text-foreground"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {state.restaurantName}
              </span>
              <span
                className="text-sm tabular-nums text-foreground/60"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {fmt(total)}
              </span>
            </div>
            <p
              className="text-xs text-foreground/40"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Order #{orderId.slice(-8).toUpperCase()} · {address}
            </p>
          </SectionCard>

          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#0F766E",
                  borderRadius: "12px",
                  fontFamily: "Inter Tight, Inter, sans-serif",
                },
              },
            }}
          >
            <PaymentForm orderId={orderId} total={total} />
          </Elements>
        </div>
      </div>
    );
  }

  // ── Phase 1: Address + tip + totals ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-foreground/8 bg-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <Link
            href={`/delivery/${state.restaurantSlug}`}
            aria-label="Back to menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ArrowLeft size={20} aria-hidden />
          </Link>
          <h1
            className="text-xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Checkout
          </h1>
        </div>
      </div>

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-lg space-y-4 px-4 pb-36 pt-6">

        {/* ── Order summary ─────────────────────────────────────────────────── */}
        <SectionCard>
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2
              className="text-lg font-bold italic text-foreground"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              {state.restaurantName}
            </h2>
            <Link
              href={`/delivery/${state.restaurantSlug}`}
              className="shrink-0 rounded text-sm font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Edit order
            </Link>
          </div>

          <ul className="divide-y divide-foreground/6">
            {state.items.map((item) => (
              <li
                key={item.itemId}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                <div className="flex min-w-0 items-baseline gap-2">
                  <span
                    className="inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold tabular-nums text-primary"
                    aria-label={`${item.quantity}×`}
                  >
                    {item.quantity}
                  </span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.name}
                  </span>
                </div>
                <span className="ml-3 shrink-0 text-sm tabular-nums text-foreground/65">
                  {fmt(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {/* ── Delivery address ───────────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeading>Delivery address</SectionHeading>

          <div className="space-y-3">
            <div>
              <FieldLabel htmlFor="street">
                Street address{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </FieldLabel>
              <input
                id="street"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Kanata Ave"
                autoComplete="street-address"
                className={inputClass}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              />
            </div>

            <div>
              <FieldLabel htmlFor="unit" optional>
                Unit / Apt
              </FieldLabel>
              <input
                id="unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Apt 4B"
                autoComplete="address-line2"
                className={inputClass}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              />
            </div>

            <div>
              <FieldLabel htmlFor="instructions" optional>
                Delivery instructions
              </FieldLabel>
              <input
                id="instructions"
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ring doorbell, leave at door…"
                className={inputClass}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Tip ────────────────────────────────────────────────────────────── */}
        <SectionCard>
          <h2
            className="text-lg font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Tip
          </h2>
          <p
            className="mb-4 mt-0.5 text-xs text-foreground/45"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            100% goes to your driver
          </p>

          <div className="flex gap-2">
            {(["none", "15", "18", "20", "custom"] as TipMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTipMode(mode)}
                className={[
                  "flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                  tipMode === mode
                    ? "border-primary bg-primary text-white"
                    : "border-foreground/15 bg-white text-foreground/65 hover:border-foreground/30 hover:text-foreground",
                ].join(" ")}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {mode === "none" ? "No tip" : mode === "custom" ? "Custom" : `${mode}%`}
              </button>
            ))}
          </div>

          {tipMode === "custom" && (
            <div className="relative mt-3">
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-foreground/50"
                aria-hidden
              >
                $
              </span>
              <input
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                type="number"
                min="0"
                step="0.50"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                placeholder="0.00"
                aria-label="Custom tip amount in dollars"
                className={inputClass + " pl-8"}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              />
            </div>
          )}
        </SectionCard>

        {/* ── Community Points waiver ─────────────────────────────────────────── */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p
                className="text-base font-semibold text-foreground"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Use Community Points
              </p>
              {canUseWaiver ? (
                <p
                  className="mt-0.5 text-xs text-foreground/55"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  {initialWalletBalance.toLocaleString()} CP available ·{" "}
                  {fmt(WAIVER_DISCOUNT_AMOUNT)} off your delivery fee
                </p>
              ) : (
                <p
                  className="mt-0.5 text-xs text-foreground/45"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  Earn {WAIVER_COST_CP.toLocaleString()} CP to get {fmt(WAIVER_DISCOUNT_AMOUNT)} off delivery
                </p>
              )}
            </div>

            {/* Pill toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={waiverEnabled}
              aria-label="Get $2.50 off delivery with Community Points"
              disabled={!canUseWaiver}
              onClick={() => setWaiverEnabled((v) => !v)}
              className={[
                "relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                "transition-colors duration-200 ease-in-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                !canUseWaiver
                  ? "cursor-not-allowed opacity-40"
                  : waiverEnabled
                    ? "bg-primary"
                    : "bg-foreground/20",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
                  "transform transition duration-200 ease-in-out",
                  waiverEnabled ? "translate-x-5" : "translate-x-0",
                ].join(" ")}
              />
            </button>
          </div>
        </SectionCard>

        {/* ── Order total ────────────────────────────────────────────────────── */}
        <SectionCard>
          <SectionHeading>Order total</SectionHeading>

          <dl className="space-y-2.5">
            <TotalRow label="Subtotal" value={subtotal} />

            {/* Delivery fee — show partial discount when waiver is active */}
            {waiverEnabled ? (
              <div className="flex items-center justify-between">
                <dt
                  className="text-sm text-foreground/60"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  Delivery fee
                </dt>
                <dd
                  className="flex items-center gap-2"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <span className="text-sm tabular-nums line-through text-foreground/30">
                    {fmt(DELIVERY_FEE)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {fmt(fees.deliveryFee)}
                  </span>
                </dd>
              </div>
            ) : (
              <TotalRow label="Delivery fee" value={fees.deliveryFee} />
            )}

            <TotalRow label="Service fee (10%)" value={serviceFee} />
            <TotalRow
              label={tipMode === "none" ? "Tip" : `Tip (${tipMode === "custom" ? "custom" : `${tipMode}%`})`}
              value={tipAmount}
            />
            <TotalRow label="HST (13%)" value={tax} />
            <div className="border-t border-foreground/10 pt-3">
              <TotalRow label="Total" value={total} bold />
            </div>
          </dl>

          {/* CP cost note when waiver is active */}
          {waiverEnabled && (
            <p
              className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary/80"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              {WAIVER_COST_CP.toLocaleString()} CP will be deducted once payment is confirmed · {fmt(WAIVER_DISCOUNT_AMOUNT)} off your delivery fee.
            </p>
          )}
        </SectionCard>

        {placeError && (
          <div
            className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {placeError}
          </div>
        )}
      </div>

      {/* ── Fixed Place Order footer ──────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 border-t border-foreground/8 bg-white px-4 pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={!canPlace}
            aria-label={`Place order, total ${fmt(total)}`}
            className={[
              "w-full rounded-2xl py-4 text-base font-semibold text-white shadow-sm transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              canPlace
                ? "bg-primary hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
                : "cursor-not-allowed bg-foreground/25",
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {placing ? "Preparing your order…" : `Place Order · ${fmt(total)}`}
          </button>
          {!canPlace && !placing && (
            <p
              className="mt-2 text-center text-xs text-foreground/45"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Enter a delivery address to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
