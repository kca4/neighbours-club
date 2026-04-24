import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { DealStatus, OrderStatus } from "@prisma/client";
import Link from "next/link";
import type { Metadata } from "next";
import JoinDealForm from "@/app/components/JoinDealForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const deal = await prisma.deal.findUnique({
    where: { slug },
    select: { title: true },
  });
  return {
    title: deal ? `Join ${deal.title} — Neighbours Club` : "Deal not found",
  };
}

// Statuses that block a new join
const BLOCKING_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_AUTHORIZATION,
  OrderStatus.AUTHORIZED,
  OrderStatus.CAPTURED,
  OrderStatus.PICKED_UP,
];

export default async function JoinDealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/deals/${slug}/join`);
  }

  const deal = await prisma.deal.findUnique({
    where: { slug },
    include: {
      tiers: { orderBy: { tierOrder: "asc" } },
    },
  });

  if (!deal || deal.status !== DealStatus.OPEN) notFound();

  if (deal.closesAt < new Date()) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <p className="text-center text-foreground/70">
          This deal has already closed.{" "}
          <Link href="/deals" className="text-primary hover:underline">
            Browse other deals
          </Link>
        </p>
      </main>
    );
  }

  // If the user already has a blocking order, redirect to my-deals
  const existingOrder = await prisma.order.findUnique({
    where: {
      userId_dealId: { userId: session.user.id, dealId: deal.id },
    },
    select: { status: true },
  });

  if (existingOrder && BLOCKING_STATUSES.includes(existingOrder.status)) {
    redirect("/my-deals");
  }

  const tier1 = deal.tiers[0];
  if (!tier1) notFound();

  const tier1PriceDollars = Number(tier1.pricePerUnit.toString());

  return (
    <main className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-foreground/50">
        <Link href="/deals" className="hover:text-foreground">
          Deals
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link href={`/deals/${slug}`} className="hover:text-foreground">
          {deal.title}
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground/80">Join</span>
      </nav>

      <h1 className="mb-2 text-2xl font-bold text-foreground">
        Join: {deal.title}
      </h1>
      <p className="mb-8 text-sm text-foreground/60">
        Tier-1 price: {tier1PriceDollars.toLocaleString("en-CA", { style: "currency", currency: "CAD", minimumFractionDigits: 2 })} / unit &middot; max{" "}
        {deal.maxQuantityPerMember} unit
        {deal.maxQuantityPerMember !== 1 ? "s" : ""}
      </p>

      <div className="rounded-2xl border border-foreground/10 bg-white p-6">
        <JoinDealForm
          slug={slug}
          maxQuantityPerMember={deal.maxQuantityPerMember}
          tier1PriceDollars={tier1PriceDollars}
          closesAt={deal.closesAt}
        />
      </div>
    </main>
  );
}
