import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DealStatus, OrderStatus } from "@prisma/client";
import Link from "next/link";
import LeaveDealButton from "@/app/components/LeaveDealButton";

// Statuses visible on the public detail page (DRAFT and CANCELLED are hidden)
const VISIBLE_STATUSES: DealStatus[] = [
  DealStatus.OPEN,
  DealStatus.CLOSING_SUCCESS,
  DealStatus.CLOSING_FAILED,
  DealStatus.FULFILLING,
  DealStatus.COMPLETED,
];

// Only these statuses count toward member progress and capacity
const CONFIRMED_STATUSES: OrderStatus[] = [
  OrderStatus.AUTHORIZED,
  OrderStatus.CAPTURED,
  OrderStatus.PICKED_UP,
];

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
    title: deal ? `${deal.title} — Neighbours Club` : "Deal not found",
  };
}

function formatPrice(price: { toString(): string } | number): string {
  return Number(price.toString()).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function DealPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [deal, session] = await Promise.all([
    prisma.deal.findUnique({
      where: { slug },
      include: {
        supplier: true,
        tiers: { orderBy: { tierOrder: "asc" } },
        // Count only confirmed orders for member progress display
        _count: {
          select: {
            orders: { where: { status: { in: CONFIRMED_STATUSES } } },
          },
        },
      },
    }),
    auth(),
  ]);

  if (!deal || !VISIBLE_STATUSES.includes(deal.status)) notFound();

  const orderCount = deal._count.orders;
  const daysLeft = daysUntil(deal.closesAt);
  const progress = Math.min(
    100,
    Math.round((orderCount / deal.minimumMembers) * 100),
  );
  const currentTier =
    [...deal.tiers].reverse().find((t) => orderCount >= t.minMembers) ??
    deal.tiers[0];
  const isOpen = deal.status === DealStatus.OPEN;

  // Check if the signed-in user already has a non-terminal order on this deal
  let userOrder: {
    quantity: number;
    maxAuthorizedAmount: unknown;
    status: OrderStatus;
  } | null = null;
  if (session?.user?.id) {
    userOrder = await prisma.order.findUnique({
      where: { userId_dealId: { userId: session.user.id, dealId: deal.id } },
      select: { quantity: true, maxAuthorizedAmount: true, status: true },
    });
    // Don't show VOIDED/terminal orders as "you're in"
    if (
      userOrder &&
      (userOrder.status === OrderStatus.VOIDED ||
        userOrder.status === OrderStatus.REFUNDED ||
        userOrder.status === OrderStatus.NO_SHOW ||
        userOrder.status === OrderStatus.CAPTURE_FAILED)
    ) {
      userOrder = null;
    }
  }

  const userIsAuthorized =
    userOrder?.status === OrderStatus.AUTHORIZED;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-foreground/50" aria-label="Breadcrumb">
        <Link
          href="/deals"
          className="transition-colors hover:text-foreground"
        >
          Deals
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span className="text-foreground/80">{deal.title}</span>
      </nav>

      {/* Supplier + title */}
      <div className="mb-1 text-sm font-semibold uppercase tracking-widest text-primary/70">
        {deal.supplier.name}
      </div>
      <h1 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
        {deal.title}
      </h1>

      {/* Status badges */}
      <div className="mb-8 flex flex-wrap gap-2">
        {deal.status === DealStatus.OPEN && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Open
          </span>
        )}
        {deal.status === DealStatus.FULFILLING && (
          <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            Fulfilling
          </span>
        )}
        {deal.status === DealStatus.CLOSING_SUCCESS && (
          <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Closing — deal ran!
          </span>
        )}
        {deal.status === DealStatus.CLOSING_FAILED && (
          <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            Closing — deal did not reach minimum
          </span>
        )}
        {deal.status === DealStatus.COMPLETED && (
          <span className="inline-flex items-center rounded-full bg-foreground/8 px-3 py-1 text-xs font-semibold text-foreground/60">
            Completed
          </span>
        )}
        {isOpen && (
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              daysLeft <= 2
                ? "bg-red-50 text-red-700"
                : "bg-foreground/8 text-foreground/60"
            }`}
          >
            {daysLeft <= 0
              ? "Closing soon"
              : daysLeft === 1
                ? "1 day left"
                : `${daysLeft} days left`}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="mb-10 text-base leading-relaxed text-foreground/70">
        {deal.description}
      </p>

      {/* Member progress */}
      <div className="mb-6 rounded-2xl border border-foreground/10 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Member progress
        </h2>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-foreground/60">
            {orderCount} member{orderCount !== 1 ? "s" : ""} joined
          </span>
          <span className="font-medium text-foreground/60">
            {deal.minimumMembers} needed to unlock
          </span>
        </div>
        <div className="mb-3 h-3 overflow-hidden rounded-full bg-foreground/10">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress < 100 ? (
          <p className="text-sm text-foreground/50">
            {deal.minimumMembers - orderCount} more member
            {deal.minimumMembers - orderCount !== 1 ? "s" : ""} needed to
            guarantee this deal runs.
          </p>
        ) : (
          <p className="text-sm font-semibold text-primary">
            Minimum reached — this deal is on!
          </p>
        )}
      </div>

      {/* Pricing tiers */}
      <div className="mb-6 rounded-2xl border border-foreground/10 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Pricing tiers
        </h2>
        <div className="divide-y divide-foreground/8">
          {deal.tiers.map((tier) => {
            const isCurrent = tier.id === currentTier?.id;
            return (
              <div
                key={tier.id}
                className={`flex items-center justify-between py-3 ${
                  isCurrent ? "text-foreground" : "text-foreground/45"
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      now
                    </span>
                  )}
                  <span className="text-sm">
                    {tier.maxMembers
                      ? `${tier.minMembers}–${tier.maxMembers} members`
                      : `${tier.minMembers}+ members`}
                  </span>
                </div>
                <span
                  className={`font-semibold ${isCurrent ? "text-xl" : "text-sm"}`}
                >
                  {formatPrice(tier.pricePerUnit)}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-foreground/40">
          Up to {deal.maxQuantityPerMember} unit
          {deal.maxQuantityPerMember !== 1 ? "s" : ""} per member.
        </p>
      </div>

      {/* Pickup details */}
      <div className="mb-10 rounded-2xl border border-foreground/10 bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">
          Pickup details
        </h2>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-foreground/50">Location</dt>
            <dd className="text-foreground">{deal.pickupLocation}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground/50">Address</dt>
            <dd className="text-foreground">{deal.pickupAddress}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground/50">Pickup window</dt>
            <dd className="text-foreground">
              {formatDate(deal.pickupWindowStart)},{" "}
              {formatTime(deal.pickupWindowStart)}–
              {formatTime(deal.pickupWindowEnd)}
            </dd>
          </div>
          {deal.pickupInstructions && (
            <div>
              <dt className="font-medium text-foreground/50">Instructions</dt>
              <dd className="text-foreground">{deal.pickupInstructions}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Call to action */}
      {isOpen && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
          {userOrder ? (
            <div className="space-y-4">
              <div>
                <div className="mb-1 text-sm font-semibold text-primary">
                  You&apos;re in!
                </div>
                <p className="text-sm text-foreground/70">
                  You&apos;ve reserved {userOrder.quantity} unit
                  {userOrder.quantity !== 1 ? "s" : ""}. We&apos;ll notify you
                  with final pricing and pickup details once the deal closes.
                </p>
              </div>
              {userIsAuthorized && (
                <LeaveDealButton slug={deal.slug} />
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 text-sm font-semibold text-foreground">
                  Ready to join?
                </div>
                <p className="text-sm text-foreground/60">
                  Current price:{" "}
                  <strong>{formatPrice(currentTier?.pricePerUnit ?? 0)}</strong>{" "}
                  / unit. Payment is only captured if the deal runs.
                </p>
              </div>
              {session ? (
                <Link
                  href={`/deals/${deal.slug}/join`}
                  className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Join this deal
                </Link>
              ) : (
                <Link
                  href={`/signin?callbackUrl=/deals/${deal.slug}`}
                  className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  Sign in to join
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
