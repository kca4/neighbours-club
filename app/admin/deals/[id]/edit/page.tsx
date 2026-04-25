import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DealForm from "@/components/admin/DealForm";
import { DealStatus } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit deal" };

// Convert UTC Date to datetime-local string (YYYY-MM-DDTHH:MM)
function toLocal(d: Date): string {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { tiers: { orderBy: { tierOrder: "asc" } } },
  });

  if (!deal) notFound();

  const isTerminal = !([DealStatus.DRAFT, DealStatus.OPEN] as DealStatus[]).includes(deal.status);

  if (isTerminal) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-xs text-foreground/40">
          Admin / <Link href="/admin/deals" className="hover:underline">Deals</Link> /{" "}
          <Link href={`/admin/deals/${id}`} className="hover:underline">{deal.title}</Link> / Edit
        </p>
        <div className="rounded-xl border border-foreground/10 bg-white p-6 text-center text-foreground/50">
          This deal is in status <strong>{deal.status}</strong> and is no longer editable.
        </div>
      </div>
    );
  }

  const initialData = {
    title: deal.title,
    slug: deal.slug,
    description: deal.description,
    imageUrl: deal.imageUrl ?? "",
    supplierId: deal.supplierId,
    minimumMembers: String(deal.minimumMembers),
    maximumMembers: deal.maximumMembers !== null ? String(deal.maximumMembers) : "",
    maxQuantityPerMember: String(deal.maxQuantityPerMember),
    opensAt: toLocal(deal.opensAt),
    closesAt: toLocal(deal.closesAt),
    pickupLocation: deal.pickupLocation,
    pickupAddress: deal.pickupAddress,
    pickupWindowStart: toLocal(deal.pickupWindowStart),
    pickupWindowEnd: toLocal(deal.pickupWindowEnd),
    pickupInstructions: deal.pickupInstructions ?? "",
  };

  const initialTiers = deal.tiers.map((t) => ({
    minMembers: t.minMembers,
    maxMembers: t.maxMembers,
    pricePerUnit: Number(t.pricePerUnit).toFixed(2),
    tierOrder: t.tierOrder,
  }));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-foreground/40">
          Admin /{" "}
          <Link href="/admin/deals" className="hover:underline">Deals</Link> /{" "}
          <Link href={`/admin/deals/${id}`} className="hover:underline">{deal.title}</Link> / Edit
        </p>
        <h1 className="text-2xl font-bold text-foreground">Edit deal</h1>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-white p-6">
        <DealForm
          dealId={id}
          initialData={initialData}
          initialTiers={initialTiers}
          dealStatus={deal.status}
        />
      </div>
    </div>
  );
}
