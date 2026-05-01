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

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!order) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl border border-foreground/10 bg-white p-8">
          <p className="mb-2 text-xl font-bold text-foreground">
            Recovery link not valid
          </p>
          <p className="mb-6 text-sm text-foreground/60">
            This link may have already been used or may have expired.
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to My Deals
          </Link>
        </div>
      </main>
    );
  }

  // ── Already resolved ───────────────────────────────────────────────────────
  if (order.status !== OrderStatus.CAPTURE_FAILED) {
    const statusLabel: Record<string, string> = {
      CAPTURED: "already charged",
      PICKED_UP: "picked up",
      VOIDED: "cancelled",
      REFUNDED: "refunded",
      NO_SHOW: "marked no-show",
    };
    const label = statusLabel[order.status] ?? order.status.toLowerCase();

    return (
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 text-center">
        <div className="rounded-2xl border border-foreground/10 bg-white p-8">
          <p className="mb-2 text-xl font-bold text-foreground">
            No payment needed
          </p>
          <p className="mb-6 text-sm text-foreground/60">
            This order is {label} — no further action is required.
          </p>
          <Link
            href="/my-deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to My Deals
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
