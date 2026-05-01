import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealStatus, OrderStatus } from "@prisma/client";
import { DealStatusBadge, OrderStatusBadge } from "@/components/admin/StatusBadge";
import DealActions from "./DealActions";
import CopyButton from "./CopyButton";
import PickupActions from "./PickupActions";
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
    (
      [
        OrderStatus.AUTHORIZED,
        OrderStatus.CAPTURED,
        OrderStatus.PICKED_UP,
      ] as OrderStatus[]
    ).includes(o.status),
  ).length;
  const pendingCount = deal.orders.filter(
    (o) => o.status === OrderStatus.PENDING_AUTHORIZATION,
  ).length;
  const voidedCount = deal.orders.filter(
    (o) => o.status === OrderStatus.VOIDED,
  ).length;

  const isFulfilling = deal.status === DealStatus.FULFILLING;

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
    {
      label: "Pickup window",
      value: `${fmt(deal.pickupWindowStart)} → ${fmt(deal.pickupWindowEnd)}`,
    },
    {
      label: "Pickup instructions",
      value: deal.pickupInstructions ?? "—",
    },
    { label: "Image URL", value: deal.imageUrl ?? "—" },
    ...(deal.finalPrice !== null
      ? [
          {
            label: "Final price",
            value: `$${Number(deal.finalPrice).toFixed(2)} (tier ${(deal.finalTierIndex ?? 0) + 1})`,
          },
        ]
      : []),
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
          <p className="text-2xl font-bold text-foreground/70">
            {deal.minimumMembers}
          </p>
          <p className="text-xs text-foreground/50">Minimum needed</p>
        </div>
      </div>

      {/* Description */}
      <section>
        <h2 className="mb-2 font-semibold">Description</h2>
        <p className="whitespace-pre-wrap text-sm text-foreground/70">
          {deal.description}
        </p>
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
              {deal.tiers.map((t, i) => {
                const isActive =
                  deal.finalTierIndex !== null && deal.finalTierIndex === i;
                return (
                  <tr key={t.id} className={isActive ? "bg-primary/5" : ""}>
                    <td className="text-foreground/50">{i + 1}</td>
                    <td>
                      {t.minMembers}
                      {t.maxMembers !== null ? `–${t.maxMembers}` : "+"}
                    </td>
                    <td className="font-mono">
                      ${Number(t.pricePerUnit).toFixed(2)}
                      {isActive && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          final
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Orders — FULFILLING: show pickup actions */}
      {isFulfilling ? (
        <section>
          <h2 className="mb-3 font-semibold">
            Pickup tracking ({deal.orders.length} orders)
          </h2>
          <div className="overflow-x-auto rounded-xl border border-foreground/10">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Qty</th>
                  <th>Final charge</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deal.orders.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-foreground/40"
                    >
                      No orders.
                    </td>
                  </tr>
                )}
                {deal.orders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium">{o.user.name}</td>
                    <td>
                      <a
                        href={`mailto:${o.user.email}`}
                        className="text-accent hover:underline"
                      >
                        {o.user.email}
                      </a>
                    </td>
                    <td>{o.quantity}</td>
                    <td className="font-mono">
                      {o.finalAmount !== null
                        ? `$${Number(o.finalAmount).toFixed(2)}`
                        : "—"}
                    </td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td>
                      <PickupActions
                        orderId={o.id}
                        orderStatus={o.status}
                      />
                      {o.status === OrderStatus.CAPTURE_FAILED && (
                        <a
                          href={`/recover-payment/${o.recoveryToken ?? ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-amber-600 hover:underline"
                        >
                          Recovery link
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* Orders — all other statuses */
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
                    <td
                      colSpan={7}
                      className="py-6 text-center text-foreground/40"
                    >
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
      )}

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
