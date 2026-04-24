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
    (o) => o.status === OrderStatus.CAPTURED,
  );

  const historyOrders = orders.filter(
    (o) =>
      !activeOrders.some((a) => a.id === o.id) &&
      !capturedOrders.some((c) => c.id === o.id),
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
