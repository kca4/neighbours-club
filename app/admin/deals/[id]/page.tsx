import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealStatus, OrderStatus } from "@prisma/client";
import { DealStatusBadge, OrderStatusBadge } from "@/components/admin/StatusBadge";
import DealActions from "./DealActions";
import CopyButton from "./CopyButton";
import RemoteImage from "@/components/RemoteImage";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Deal detail" };

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      supplier: true,
      tiers: { orderBy: { tierOrder: "asc" } },
      orders: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!deal) notFound();

  const confirmedCount = deal.orders.filter((o) =>
    [OrderStatus.AUTHORIZED, OrderStatus.CAPTURED, OrderStatus.PICKED_UP].includes(o.status),
  ).length;
  const pendingCount = deal.orders.filter(
    (o) => o.status === OrderStatus.PENDING_AUTHORIZATION,
  ).length;
  const voidedCount = deal.orders.filter((o) => o.status === OrderStatus.VOIDED).length;

  const detailRows = [
    { label: "Slug", value: deal.slug },
    { label: "Supplier", value: deal.supplier.name },
    { label: "Min members", value: deal.minimumMembers },
    { label: "Max members", value: deal.maximumMembers ?? "No cap" },
    { label: "Max qty/member", value: deal.maxQuantityPerMember },
    { label: "Opens", value: fmt(deal.opensAt) },
    { label: "Closes", value: fmt(deal.closesAt) },
    { label: "Pickup location", value: deal.pickupLocation },
    { label: "Pickup address", value: deal.pickupAddress },
    { label: "Pickup window", value: `${fmt(deal.pickupWindowStart)} → ${fmt(deal.pickupWindowEnd)}` },
    { label: "Pickup instructions", value: deal.pickupInstructions ?? "—" },
    { label: "Image URL", value: deal.imageUrl ?? "—" },
  ];

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs text-foreground/40">
            Admin /{" "}
            <Link href="/admin/deals" className="hover:underline">
              Deals
            </Link>{" "}
            / {deal.title}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{deal.title}</h1>
            <DealStatusBadge status={deal.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-foreground/40">{deal.slug}</p>
        </div>
        <DealActions dealId={id} status={deal.status} />
      </div>

      {/* Member count summary */}
      <div className="flex gap-6 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
          <p className="text-xs text-foreground/50">Confirmed</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-xs text-foreground/50">Pending</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-400">{voidedCount}</p>
          <p className="text-xs text-foreground/50">Voided</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground/70">{deal.minimumMembers}</p>
          <p className="text-xs text-foreground/50">Minimum needed</p>
        </div>
      </div>

      {/* Description */}
      <section>
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-foreground/70">{deal.description}</p>
      </section>

      {/* Deal image */}
      {deal.imageUrl && (
        <section>
          <h2 className="mb-2 font-semibold">Image preview</h2>
          <RemoteImage
            src={deal.imageUrl}
            alt={deal.title}
            width={480}
            height={270}
            className="rounded-lg border border-foreground/10 object-cover"
          />
        </section>
      )}

      {/* Detail fields */}
      <section>
        <h2 className="mb-3 font-semibold">Deal details</h2>
        <div className="rounded-xl border border-foreground/10 bg-white p-5">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {detailRows.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-foreground">{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Pricing tiers */}
      <section>
        <h2 className="mb-3 font-semibold">Pricing tiers</h2>
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Members</th>
                <th>Price / unit</th>
              </tr>
            </thead>
            <tbody>
              {deal.tiers.map((t, i) => (
                <tr key={t.id}>
                  <td className="text-foreground/50">{i + 1}</td>
                  <td>
                    {t.minMembers}
                    {t.maxMembers !== null ? `–${t.maxMembers}` : "+"}
                  </td>
                  <td className="font-mono">${Number(t.pricePerUnit).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Orders */}
      <section>
        <h2 className="mb-3 font-semibold">Orders ({deal.orders.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Qty</th>
                <th>Status</th>
                <th>Authorized</th>
                <th>Final charge</th>
                <th>Payment intent</th>
              </tr>
            </thead>
            <tbody>
              {deal.orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-foreground/40">
                    No orders yet.
                  </td>
                </tr>
              )}
              {deal.orders.map((o) => {
                const piId = o.stripePaymentIntentId;
                return (
                  <tr key={o.id}>
                    <td className="font-medium">{o.user.name}</td>
                    <td className="text-foreground/60">{o.user.email}</td>
                    <td>{o.quantity}</td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className="font-mono">
                      ${Number(o.maxAuthorizedAmount).toFixed(2)}
                    </td>
                    <td className="font-mono text-foreground/50">
                      {o.finalAmount !== null
                        ? `$${Number(o.finalAmount).toFixed(2)}`
                        : "—"}
                    </td>
                    <td>
                      {piId ? (
                        <CopyButton text={piId} />
                      ) : (
                        <span className="text-foreground/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Link to public deal */}
      {deal.status === DealStatus.OPEN && (
        <div className="text-sm text-foreground/50">
          Public URL:{" "}
          <Link
            href={`/deals/${deal.slug}`}
            className="text-accent hover:underline"
            target="_blank"
          >
            /deals/{deal.slug}
          </Link>
        </div>
      )}
    </div>
  );
}
