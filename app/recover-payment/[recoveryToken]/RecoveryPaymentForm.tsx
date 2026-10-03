"use client";

import { useState, useCallback } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe-client";
import Link from "next/link";

type BilingualMsg = {
  en: string;
  fr: string;
  showMyDealsLink?: boolean;
  terminal?: boolean;
};

const fmtEN = (n: number) =>
  n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });

const fmtFR = (n: number) =>
  n.toLocaleString("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });

// ── Inner checkout form (mounted inside <Elements>) ──────────────────────────

function RecoveryCheckoutForm({
  amountDollars,
  supportEmail,
  onSuccess,
}: {
  amountDollars: number;
  supportEmail: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<BilingualMsg | null>(null);

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
        setError({
          en: "Your payment couldn't be completed. Please check your payment details and try again.",
          fr: "Votre paiement n'a pas pu être effectué. Vérifiez vos renseignements de paiement et réessayez.",
        });
        setSubmitting(false);
        return;
      }

      onSuccess();
    },
    [stripe, elements, onSuccess],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        className="inline-flex min-h-[48px] w-full flex-col items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <span>Processing your payment…</span>
            <span className="text-xs font-normal opacity-80">
              Traitement de votre paiement…
            </span>
          </>
        ) : (
          <>
            <span>Pay {fmtEN(amountDollars)}</span>
            <span className="text-xs font-normal opacity-80">
              Payer {fmtFR(amountDollars)}
            </span>
          </>
        )}
      </button>
    </form>
  );
}

// ── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen() {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-3xl">
        ✓
      </div>

      {/* English */}
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Payment completed
        </h2>
        <p className="text-foreground/70">
          Your payment was successful and your order is confirmed. You can view
          the order in My Deals.
        </p>
      </div>
      <Link
        href="/my-deals"
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Go to My Deals
      </Link>

      <hr className="border-foreground/10" />

      {/* Français */}
      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">
          Paiement effectué
        </h2>
        <p className="text-foreground/70">
          Votre paiement a été effectué avec succès et votre commande est
          confirmée. Vous pouvez consulter la commande dans Mes achats groupés.
        </p>
      </div>
      <Link
        href="/my-deals"
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        Voir mes achats groupés
      </Link>
    </div>
  );
}

// ── Outer orchestration ──────────────────────────────────────────────────────

export default function RecoveryPaymentForm({
  recoveryToken,
  amountDollars,
  supportEmail,
}: {
  recoveryToken: string;
  amountDollars: number;
  supportEmail: string;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<BilingualMsg | null>(null);
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
        const code = err.error ?? "";

        if (code === "RECOVERY_EXPIRED") {
          setLoadError({
            en: "The payment deadline has passed, so this order can no longer be paid. You haven't been charged.",
            fr: "La date limite de paiement est passée; cette commande ne peut donc plus être payée. Aucun montant n'a été débité.",
            showMyDealsLink: true,
            terminal: true,
          });
        } else if (res.status === 409) {
          setLoadError({
            en: "No payment is needed for this order anymore. You can check its current status in My Deals.",
            fr: "Aucun paiement n'est désormais requis pour cette commande. Vous pouvez consulter son statut dans Mes achats groupés.",
            showMyDealsLink: true,
            terminal: true,
          });
        } else if (code.toLowerCase().includes("price")) {
          setLoadError({
            en: `We can't prepare this payment right now. Please contact us at ${supportEmail}.`,
            fr: `Nous ne pouvons pas préparer ce paiement pour le moment. Écrivez-nous à ${supportEmail}.`,
          });
        } else {
          setLoadError({
            en: "We couldn't start the payment. Please try again.",
            fr: "Nous n'avons pas pu démarrer le paiement. Veuillez réessayer.",
          });
        }
        return;
      }

      const ok = data as { clientSecret: string };
      setClientSecret(ok.clientSecret);
    } catch {
      setLoadError({
        en: "We couldn't connect. Check your internet connection and try again.",
        fr: "Nous n'avons pas pu nous connecter. Vérifiez votre connexion Internet et réessayez.",
      });
    } finally {
      setLoading(false);
    }
  }, [recoveryToken, supportEmail]);

  if (success) return <SuccessScreen />;

  const paymentHeading = (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-foreground">Payment</h2>
      <p className="text-xs text-foreground/50">Paiement</p>
    </div>
  );

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        {paymentHeading}

        {loadError && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 space-y-1">
            <p>{loadError.en}</p>
            <p className="opacity-80">{loadError.fr}</p>
            {loadError.showMyDealsLink && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2">
                <Link
                  href="/my-deals"
                  className="font-semibold underline"
                >
                  Go to My Deals
                </Link>
                <span className="opacity-40" aria-hidden="true">·</span>
                <Link
                  href="/my-deals"
                  className="font-semibold underline opacity-80"
                >
                  Voir mes achats groupés
                </Link>
              </div>
            )}
          </div>
        )}

        {!loadError?.terminal && (
          <button
            onClick={initPayment}
            disabled={loading}
            className="inline-flex min-h-[48px] w-full flex-col items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span>Setting up payment…</span>
                <span className="text-xs font-normal opacity-80">
                  Préparation…
                </span>
              </>
            ) : (
              <>
                <span>Pay {fmtEN(amountDollars)}</span>
                <span className="text-xs font-normal opacity-80">
                  Payer {fmtFR(amountDollars)}
                </span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {paymentHeading}
      <Elements
        stripe={getStripe()}
        options={{ clientSecret, appearance: { theme: "stripe" } }}
      >
        <RecoveryCheckoutForm
          amountDollars={amountDollars}
          supportEmail={supportEmail}
          onSuccess={() => setSuccess(true)}
        />
      </Elements>
    </div>
  );
}
