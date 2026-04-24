"use client";

import { useState, useCallback } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

// ─── Inner form (mounted inside <Elements>) ───────────────────────────────────

function CheckoutForm({
  slug,
  quantity,
  maxAmountDollars,
  closesAt,
  onSuccess,
}: {
  slug: string;
  quantity: number;
  maxAmountDollars: number;
  closesAt: Date;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suppress unused-variable warning for slug — it's used via closure in
  // the confirmPayment return_url fallback.
  void slug;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setSubmitting(true);
      setError(null);

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // Fallback redirect URL — Stripe may redirect here for some payment methods
          return_url: `${window.location.origin}/my-deals`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message ?? "Payment authorization failed.");
        setSubmitting(false);
        return;
      }

      // Authorization succeeded — call onSuccess to show confirmation screen.
      // The webhook will authoritatively move the order to AUTHORIZED in the DB.
      onSuccess();
    },
    [stripe, elements, onSuccess],
  );

  const fmt = (n: number) =>
    n.toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    });

  const closeDate = closesAt.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/70">
        <p>
          <strong className="text-foreground">
            We&apos;ll authorize up to {fmt(maxAmountDollars)} on your card.
          </strong>{" "}
          You&apos;ll only be charged the final price when the deal closes —
          likely less if more members join.
        </p>
      </div>

      <PaymentElement />

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Authorizing…" : `Authorize up to ${fmt(maxAmountDollars)}`}
      </button>

      <p className="text-center text-xs text-foreground/40">
        This is a hold only. Your card will not be charged until the deal closes
        on {closeDate}.
      </p>
    </form>
  );
}

// ─── Confirmation screen ───────────────────────────────────────────────────────

function ConfirmationScreen({
  maxAmountDollars,
  closesAt,
}: {
  maxAmountDollars: number;
  closesAt: Date;
}) {
  const fmt = (n: number) =>
    n.toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    });

  const closeDate = closesAt.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
        ✓
      </div>
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          You&apos;re in!
        </h2>
        <p className="text-foreground/70">
          We&apos;ve placed a hold of up to{" "}
          <strong>{fmt(maxAmountDollars)}</strong> on your card. The actual
          charge will happen when the deal closes on {closeDate}, at the final
          tier price — likely less than {fmt(maxAmountDollars)}.
        </p>
      </div>
      <p className="text-sm text-foreground/50">
        It may take a few seconds for this to appear in My Deals.
      </p>
      <a
        href="/my-deals"
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        View my deals
      </a>
    </div>
  );
}

// ─── Quantity selector + orchestration ────────────────────────────────────────

export default function JoinDealForm({
  slug,
  maxQuantityPerMember,
  tier1PriceDollars,
  closesAt,
}: {
  slug: string;
  maxQuantityPerMember: number;
  tier1PriceDollars: number;
  closesAt: Date;
}) {
  const [step, setStep] = useState<"quantity" | "payment" | "confirmed">(
    "quantity",
  );
  const [quantity, setQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxAmount = tier1PriceDollars * quantity;

  const fmt = (n: number) =>
    n.toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    });

  const handleQuantitySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/deals/${slug}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });

        const data: unknown = await res.json();

        if (!res.ok) {
          const errData = data as { error?: string };
          setError(errData?.error ?? "Something went wrong. Please try again.");
          return;
        }

        const okData = data as { clientSecret: string };
        setClientSecret(okData.clientSecret);
        setStep("payment");
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [slug, quantity],
  );

  if (step === "confirmed") {
    return <ConfirmationScreen maxAmountDollars={maxAmount} closesAt={closesAt} />;
  }

  if (step === "payment" && clientSecret) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 text-xl font-bold text-foreground">
            Enter your card
          </h2>
          <p className="text-sm text-foreground/60">
            {quantity} unit{quantity !== 1 ? "s" : ""} &middot; up to{" "}
            {fmt(maxAmount)} hold
          </p>
        </div>

        <Elements
          stripe={getStripe()}
          options={{ clientSecret, appearance: { theme: "stripe" } }}
        >
          <CheckoutForm
            slug={slug}
            quantity={quantity}
            maxAmountDollars={maxAmount}
            closesAt={closesAt}
            onSuccess={() => setStep("confirmed")}
          />
        </Elements>
      </div>
    );
  }

  // Step: quantity selection
  return (
    <form onSubmit={handleQuantitySubmit} className="space-y-6">
      <div>
        <label
          htmlFor="quantity"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          How many units?
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full rounded-xl border border-foreground/20 bg-white px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {Array.from({ length: maxQuantityPerMember }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n} unit{n !== 1 ? "s" : ""}
              </option>
            ),
          )}
        </select>
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground/70">
        <p>
          <strong className="text-foreground">
            Maximum hold: {fmt(maxAmount)}
          </strong>{" "}
          — We&apos;ll authorize up to this amount. You&apos;ll only be charged
          the final price when the deal closes — likely less if more members
          join.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          {error.includes("active order") && (
            <>
              {" "}
              <a href="/my-deals" className="font-semibold underline">
                View My Deals
              </a>
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Setting up payment…" : "Continue to payment"}
      </button>
    </form>
  );
}
