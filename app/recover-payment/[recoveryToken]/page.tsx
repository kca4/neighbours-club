import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import Link from "next/link";
import RecoveryPaymentForm from "./RecoveryPaymentForm";

export const metadata: Metadata = { title: "Complete your payment — Neighbours Club" };

function fmt(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

export default async function RecoveryPaymentPage({
  params,
}: {
  params: Promise<{ recoveryToken: string }>;
}) {
  const { recoveryToken } = await params;

  const order = await prisma.order.findFirst({
    where: { recoveryToken },
    select: {
      id: true,
      status: true,
      quantity: true,
      recoveryExpiresAt: true,
      deal: {
        select: {
          title: true,
          finalPrice: true,
          pickupLocation: true,
          pickupWindowStart: true,
          pickupWindowEnd: true,
          supplier: { select: { name: true } },
        },
      },
    },
  });

  const supportEmail =
    process.env.MEMBER_SUPPORT_EMAIL ??
    (process.env.EMAIL_FROM?.match(/<(.+?)>/)?.[1] ?? 'hello@neighborsclub.ca');

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl border border-foreground/10 bg-white p-8">
          {/* English */}
          <p className="mb-2 text-xl font-bold text-foreground">
            We couldn&apos;t find this payment link
          </p>
          <p className="mb-4 text-sm text-foreground/60">
            Please check that you used the full link from your email. Questions? Reach us at{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to My Deals
          </Link>

          <hr className="my-6 border-foreground/10" />

          {/* Français */}
          <p className="mb-2 text-xl font-bold text-foreground">
            Lien de paiement introuvable
          </p>
          <p className="mb-4 text-sm text-foreground/60">
            Nous n&apos;avons pas trouvé ce lien de paiement. Vérifiez que vous avez utilisé le lien complet reçu par courriel. Des questions? Écrivez-nous à{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Voir mes achats groupés
          </Link>
        </div>
      </main>
    );
  }

  // ── Recovery window expired ────────────────────────────────────────────────
  if (order.recoveryExpiresAt && order.recoveryExpiresAt <= new Date()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl border border-foreground/10 bg-white p-8">
          {/* English */}
          <p className="mb-2 text-xl font-bold text-foreground">
            Payment link expired
          </p>
          <p className="mb-4 text-sm text-foreground/60">
            This payment link has expired. The payment deadline for{" "}
            <strong>{order.deal.title}</strong> has passed, so your order was cancelled.
            You haven&apos;t been charged. Questions? Reach us at{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to My Deals
          </Link>

          <hr className="my-6 border-foreground/10" />

          {/* Français */}
          <p className="mb-2 text-xl font-bold text-foreground">
            Lien de paiement expiré
          </p>
          <p className="mb-4 text-sm text-foreground/60">
            Ce lien de paiement a expiré. La date limite de paiement pour l&apos;achat groupé{" "}
            <strong>{order.deal.title}</strong> est passée; votre commande a donc été annulée.
            Aucun montant n&apos;a été débité. Des questions? Écrivez-nous à{" "}
            <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
              {supportEmail}
            </a>
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Voir mes achats groupés
          </Link>
        </div>
      </main>
    );
  }

  // ── Already resolved ───────────────────────────────────────────────────────
  if (order.status !== OrderStatus.CAPTURE_FAILED) {
    // Mapped statuses render label-in-sentence copy.
    // NO_SHOW and any unmapped status render generic copy (no raw status value exposed).
    const statusLabelEN: Record<string, string> = {
      CAPTURED: "already paid",
      PICKED_UP: "already picked up",
      VOIDED: "cancelled",
      REFUNDED: "refunded",
    };
    const statusLabelFR: Record<string, string> = {
      CAPTURED: "déjà payée",
      PICKED_UP: "déjà récupérée",
      VOIDED: "annulée",
      REFUNDED: "remboursée",
    };
    const labelEN = statusLabelEN[order.status] ?? null;
    const labelFR = statusLabelFR[order.status] ?? null;

    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl border border-foreground/10 bg-white p-8">
          {/* English */}
          <p className="mb-2 text-xl font-bold text-foreground">
            No payment needed
          </p>
          <p className="mb-4 text-sm text-foreground/60">
            {labelEN
              ? <>This order is {labelEN} — no further action is required.</>
              : <>No further payment is needed for this order.</>
            }
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to My Deals
          </Link>

          <hr className="my-6 border-foreground/10" />

          {/* Français */}
          <p className="mb-2 text-xl font-bold text-foreground">
            Aucun paiement requis
          </p>
          <p className="mb-4 text-sm text-foreground/60">
            {labelFR
              ? <>Cette commande est {labelFR}; aucune autre action n&apos;est requise.</>
              : <>Aucun autre paiement n&apos;est requis pour cette commande.</>
            }
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Voir mes achats groupés
          </Link>
        </div>
      </main>
    );
  }

  // ── Payment needed ─────────────────────────────────────────────────────────
  const finalPrice = order.deal.finalPrice ? Number(order.deal.finalPrice) : null;
  const amountDollars = finalPrice !== null ? finalPrice * order.quantity : 0;

  const pickupWindow = `${order.deal.pickupWindowStart.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })} – ${order.deal.pickupWindowEnd.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}`;

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-600">
        Action required
      </div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Complete your payment
      </h1>

      {/* Order summary */}
      <div className="mb-6 rounded-2xl border border-foreground/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-foreground/40">
          Order summary
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/60">Deal</dt>
            <dd className="font-medium text-foreground text-right">
              {order.deal.title}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Supplier</dt>
            <dd className="font-medium text-foreground">{order.deal.supplier.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Quantity</dt>
            <dd className="font-medium text-foreground">{order.quantity}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/60">Pickup</dt>
            <dd className="font-medium text-foreground text-right">
              {order.deal.pickupLocation}
              <br />
              <span className="font-normal text-foreground/60">{pickupWindow}</span>
            </dd>
          </div>
          <div className="flex justify-between border-t border-foreground/10 pt-3">
            <dt className="font-semibold text-foreground">Amount due</dt>
            <dd className="font-bold text-foreground text-lg">
              {fmt(amountDollars)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Payment form */}
      <div className="rounded-2xl border border-foreground/10 bg-white p-6">
        <RecoveryPaymentForm
          recoveryToken={recoveryToken}
          amountDollars={amountDollars}
        />
      </div>

      <p className="mt-4 text-center text-xs text-foreground/40">
        Payments are processed securely by Stripe.
      </p>
    </main>
  );
}
