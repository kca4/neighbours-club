"use client";

import { useState, useCallback } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";

function RecoveryCheckoutForm({
  amountDollars,
  onSuccess,
}: {
  amountDollars: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number) =>
    n.toLocaleString("en-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 2,
    });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setSubmitting(true);
      setError(null);

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/my-deals`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message ?? "Payment failed. Please try again.");
        setSubmitting(false);
        return;
      }

      onSuccess();
    },
    [stripe, elements, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p>
          <strong>Payment required: {fmt(amountDollars)}</strong> — Your
          previous payment authorization could not be captured. Please provide a
          payment method to complete your order.
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
        {submitting ? "Processing…" : `Pay ${fmt(amountDollars)} now`}
      </button>
    </form>
  );
}

function SuccessScreen() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
        ✓
      </div>
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Payment complete!
        </h2>
        <p className="text-foreground/70">
          Your payment was successful. Your order is now confirmed.
        </p>
      </div>
      <a
        href="/my-deals"
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        View my deals
      </a>
    </div>
  );
}

export default function RecoveryPaymentForm({
  recoveryToken,
  amountDollars,
}: {
  recoveryToken: string;
  amountDollars: number;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const initPayment = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/orders/recover/${recoveryToken}`, {
        method: "POST",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const err = data as { error?: string };
        setLoadError(err.error ?? "Failed to set up payment.");
        return;
      }
      const ok = data as { clientSecret: string };
      setClientSecret(ok.clientSecret);
    } catch {
      setLoadError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [recoveryToken]);

  if (success) {
    return <SuccessScreen />;
  }

  if (!clientSecret) {
    return (
      <div className="space-y-4 text-center">
        {loadError && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </p>
        )}
        <button
          onClick={initPayment}
          disabled={loading}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {loading ? "Setting up payment…" : "Pay now"}
        </button>
      </div>
    );
  }

  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance: { theme: "stripe" } }}
    >
      <RecoveryCheckoutForm
        amountDollars={amountDollars}
        onSuccess={() => setSuccess(true)}
      />
    </Elements>
  );
}
