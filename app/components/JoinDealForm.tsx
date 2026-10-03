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
  supportEmail,
  onSuccess,
}: {
  slug: string;
  quantity: number;
  maxAmountDollars: number;
  closesAt: Date;
  supportEmail?: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ en: string; fr: string } | null>(null);

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
        setError({
          en: "We couldn't authorize your payment. Please check your payment details and try again.",
          fr: "Nous n'avons pas pu autoriser votre paiement. Vérifiez vos renseignements de paiement et réessayez.",
        });
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
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 space-y-1">
          <p>{error.en}</p>
          <p className="opacity-80">{error.fr}</p>
          {supportEmail && (
            <p className="pt-1 text-xs opacity-70">
              Still having trouble? Reach us at{" "}
              <a href={`mailto:${supportEmail}`} className="underline">
                {supportEmail}
              </a>
              {" — "}Le problème persiste? Écrivez-nous à{" "}
              <a href={`mailto:${supportEmail}`} className="underline">
                {supportEmail}
              </a>
            </p>
          )}
        </div>
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
  supportEmail,
}: {
  slug: string;
  maxQuantityPerMember: number;
  tier1PriceDollars: number;
  closesAt: Date;
  supportEmail?: string;
}) {
  const [step, setStep] = useState<"quantity" | "payment" | "confirmed">(
    "quantity",
  );
  const [quantity, setQuantity] = useState(1);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ en: string; fr: string; showMyDealsLink?: boolean } | null>(null);
  const [richError, setRichError] = useState<{ en: string; fr: string } | null>(null);

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
      setRichError(null);

      try {
        const res = await fetch(`/api/deals/${slug}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });

        const data: unknown = await res.json();

        if (!res.ok) {
          const errData = data as { error?: string; messageEN?: string; messageFR?: string };
          const code = errData?.error ?? "";

          if (
            (code === "REJOIN_TOO_EARLY" || code === "REJOIN_NOT_POSSIBLE") &&
            errData.messageEN
          ) {
            setRichError({ en: errData.messageEN, fr: errData.messageFR ?? "" });
          } else {
            const maxMatch = code.match(/^Maximum (\d+)/);
            if (maxMatch) {
              const n = parseInt(maxMatch[1], 10);
              setError({
                en: `You can order up to ${n} ${n === 1 ? "unit" : "units"} per member for this group buy.`,
                fr: `Vous pouvez commander jusqu'à ${n} ${n === 1 ? "unité" : "unités"} par membre pour cet achat groupé.`,
              });
            } else if (code === "This deal is not currently open") {
              setError({
                en: "This group buy isn't open right now.",
                fr: "Cet achat groupé n'est pas ouvert pour le moment.",
              });
            } else if (code === "This deal has already closed") {
              setError({
                en: "This group buy has already closed.",
                fr: "Cet achat groupé est déjà terminé.",
              });
            } else if (code === "This deal is full") {
              setError({
                en: "This group buy has reached its available quantity and is now full.",
                fr: "Cet achat groupé a atteint la quantité disponible et est maintenant complet.",
              });
            } else if (code.includes("active order")) {
              setError({
                en: "You already have an active order for this group buy. Go to My Deals to view or manage it.",
                fr: "Vous avez déjà une commande active pour cet achat groupé. Consultez Mes achats groupés pour la voir ou la gérer.",
                showMyDealsLink: true,
              });
            } else if (code === "Deal has no pricing tiers") {
              setError({
                en: "This group buy isn't available to join right now. Please try again later.",
                fr: "Il n'est pas possible de participer à cet achat groupé pour le moment. Veuillez réessayer plus tard.",
              });
            } else if (code.includes("create order")) {
              setError({
                en: "We couldn't create your order. Please try again.",
                fr: "Nous n'avons pas pu créer votre commande. Veuillez réessayer.",
              });
            } else if (code.includes("Payment setup")) {
              setError({
                en: "We couldn't start the payment authorization. Please try again.",
                fr: "Nous n'avons pas pu démarrer l'autorisation de paiement. Veuillez réessayer.",
              });
            } else {
              setError({
                en: "We couldn't create your order. Please try again.",
                fr: "Nous n'avons pas pu créer votre commande. Veuillez réessayer.",
              });
            }
          }
          return;
        }

        const okData = data as { clientSecret: string };
        setClientSecret(okData.clientSecret);
        setStep("payment");
      } catch {
        setError({
          en: "We couldn't connect. Check your internet connection and try again.",
          fr: "Nous n'avons pas pu nous connecter. Vérifiez votre connexion Internet et réessayez.",
        });
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
            supportEmail={supportEmail}
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

      {richError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-3">
          <p>{richError.en}</p>
          {richError.fr && (
            <>
              <hr className="border-amber-200" />
              <p>{richError.fr}</p>
            </>
          )}
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 space-y-1">
          <p>{error.en}</p>
          <p className="opacity-80">{error.fr}</p>
          {error.showMyDealsLink && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
              <a href="/my-deals" className="font-semibold underline">
                Go to My Deals
              </a>
              <span className="opacity-40" aria-hidden="true">·</span>
              <a href="/my-deals" className="font-semibold underline opacity-80">
                Voir mes achats groupés
              </a>
            </div>
          )}
        </div>
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
