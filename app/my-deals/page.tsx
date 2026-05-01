import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrderStatus, DealStatus } from "@prisma/client";
import Link from "next/link";
import OrderCard from "@/app/components/OrderCard";

export const metadata: Metadata = { title: "My Deals" };

// Only confirmed orders appear on this page (PENDING_AUTHORIZATION is invisible)
const ACTIVE_ORDER_STATUSES = [
  OrderStatus.AUTHORIZED,
  OrderStatus.CAPTURED,
  OrderStatus.PICKED_UP,
  OrderStatus.VOIDED,
  OrderStatus.REFUNDED,
  OrderStatus.NO_SHOW,
  OrderStatus.CAPTURE_FAILED,
];

function fmt(n: number) {
  return n.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

export default async function MyDealsPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/my-deals");

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      status: { in: ACTIVE_ORDER_STATUSES },
    },
    include: {
      deal: {
        include: {
          supplier: true,
          tiers: { orderBy: { tierOrder: "asc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.AUTHORIZED &&
      o.deal.status === DealStatus.OPEN,
  );

  const capturedOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.CAPTURED &&
      o.deal.status === DealStatus.FULFILLING,
  );

  const captureFailedOrders = orders.filter(
    (o) => o.status === OrderStatus.CAPTURE_FAILED,
  );

  const historyOrders = orders.filter(
    (o) =>
      !activeOrders.some((a) => a.id === o.id) &&
      !capturedOrders.some((c) => c.id === o.id) &&
      !captureFailedOrders.some((f) => f.id === o.id),
  );

  // Serialize Decimal fields for client components
  const serialize = (o: (typeof orders)[number]) => ({
    id: o.id,
    status: o.status,
    quantity: o.quantity,
    maxAuthorizedAmount: o.maxAuthorizedAmount.toString(),
    finalAmount: o.finalAmount?.toString() ?? null,
    createdAt: o.createdAt.toISOString(),
    pickedUpAt: o.pickedUpAt?.toISOString() ?? null,
    deal: {
      id: o.deal.id,
      slug: o.deal.slug,
      title: o.deal.title,
      imageUrl: o.deal.imageUrl,
      status: o.deal.status,
      closesAt: o.deal.closesAt.toISOString(),
      pickupLocation: o.deal.pickupLocation,
      pickupWindowStart: o.deal.pickupWindowStart.toISOString(),
      pickupWindowEnd: o.deal.pickupWindowEnd.toISOString(),
      tiers: o.deal.tiers.map((t) => ({
        pricePerUnit: t.pricePerUnit.toString(),
      })),
      supplier: { name: o.deal.supplier.name },
    },
  });

  const hasOrders = orders.length > 0;

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-foreground">My Deals</h1>

      {!hasOrders ? (
        <div className="rounded-2xl border border-foreground/10 bg-white p-8 text-center">
          <p className="mb-4 text-foreground/50">
            You haven&apos;t joined any deals yet.
          </p>
          <Link
            href="/deals"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Browse deals
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Action needed — capture failures requiring recovery payment */}
          {captureFailedOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Action needed
              </h2>
              <div className="space-y-4">
                {captureFailedOrders.map((o) => {
                  const finalPrice = o.deal.finalPrice
                    ? Number(o.deal.finalPrice)
                    : null;
                  const amountDue =
                    finalPrice !== null ? finalPrice * o.quantity : null;

                  return (
                    <div
                      key={o.id}
                      className="rounded-2xl border border-amber-200 bg-amber-50 p-6"
                    >
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <div className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-amber-700">
                            {o.deal.supplier.name}
                          </div>
                          <p className="text-base font-semibold text-foreground">
                            {o.deal.title}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Payment failed
                        </span>
                      </div>
                      <p className="mb-4 text-sm text-foreground/70">
                        Your payment authorization could not be captured when
                        this deal closed.{" "}
                        {amountDue !== null && (
                          <>
                            Amount due:{" "}
                            <strong>{fmt(amountDue)}</strong>.{" "}
                          </>
                        )}
                        Please complete your payment to keep your spot.
                      </p>
                      {o.recoveryToken ? (
                        <Link
                          href={`/recover-payment/${o.recoveryToken}`}
                          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                        >
                          Pay now
                        </Link>
                      ) : (
                        <p className="text-sm text-foreground/50">
                          Contact support to resolve this payment.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Active */}
          {activeOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Active
              </h2>
              <div className="space-y-4">
                {activeOrders.map((o) => (
                  <OrderCard key={o.id} order={serialize(o)} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming pickup */}
          {capturedOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Upcoming pickup
              </h2>
              <p className="mb-4 text-sm text-foreground/60">
                Your payment has been captured. See you at pickup!
              </p>
              <div className="space-y-4">
                {capturedOrders.map((o) => (
                  <OrderCard key={o.id} order={serialize(o)} />
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {historyOrders.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                History
              </h2>
              <div className="space-y-4">
                {historyOrders.map((o) => (
                  <OrderCard key={o.id} order={serialize(o)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
