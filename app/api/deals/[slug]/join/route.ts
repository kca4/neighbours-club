import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { DealStatus, OrderStatus } from "@prisma/client";

const CONFIRMED_STATUSES: OrderStatus[] = [
  OrderStatus.AUTHORIZED,
  OrderStatus.CAPTURED,
  OrderStatus.PICKED_UP,
];

const NON_TERMINAL_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_AUTHORIZATION,
  OrderStatus.AUTHORIZED,
  OrderStatus.CAPTURED,
  OrderStatus.PICKED_UP,
];

const TERMINAL_STATUSES: OrderStatus[] = [
  OrderStatus.VOIDED,
  OrderStatus.REFUNDED,
  OrderStatus.NO_SHOW,
  OrderStatus.CAPTURE_FAILED,
];

const joinSchema = z.object({
  quantity: z.number().int().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = joinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { quantity } = parsed.data;

  // Load deal with all needed relations
  const deal = await prisma.deal.findUnique({
    where: { slug },
    include: {
      tiers: { orderBy: { tierOrder: "asc" } },
      _count: {
        select: {
          orders: {
            where: { status: { in: CONFIRMED_STATUSES } },
          },
        },
      },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Validate quantity against deal limit
  if (quantity > deal.maxQuantityPerMember) {
    return NextResponse.json(
      {
        error: `Maximum ${deal.maxQuantityPerMember} unit${deal.maxQuantityPerMember !== 1 ? "s" : ""} per member`,
      },
      { status: 400 },
    );
  }

  // Deal must be open
  if (deal.status !== DealStatus.OPEN) {
    return NextResponse.json(
      { error: "This deal is not currently open" },
      { status: 409 },
    );
  }

  // Deal must not be past closesAt
  if (deal.closesAt < new Date()) {
    return NextResponse.json(
      { error: "This deal has already closed" },
      { status: 409 },
    );
  }

  // Check maximum members cap (confirmed orders only)
  if (
    deal.maximumMembers !== null &&
    deal._count.orders >= deal.maximumMembers
  ) {
    return NextResponse.json(
      { error: "This deal is full" },
      { status: 409 },
    );
  }

  // Check for existing order
  const existingOrder = await prisma.order.findUnique({
    where: {
      userId_dealId: { userId: session.user.id, dealId: deal.id },
    },
    select: {
      id: true,
      status: true,
      quantity: true,
      stripePaymentIntentId: true,
      createdAt: true,
    },
  });

  if (existingOrder && NON_TERMINAL_STATUSES.includes(existingOrder.status)) {
    // Narrow idempotent-retry case: PENDING_AUTHORIZATION, same quantity, created < 2 min ago
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    if (
      existingOrder.status === OrderStatus.PENDING_AUTHORIZATION &&
      existingOrder.quantity === quantity &&
      existingOrder.createdAt > twoMinutesAgo &&
      existingOrder.stripePaymentIntentId
    ) {
      const pi = await stripe.paymentIntents.retrieve(
        existingOrder.stripePaymentIntentId,
      );
      return NextResponse.json(
        { orderId: existingOrder.id, clientSecret: pi.client_secret },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        error:
          "You already have an active order on this deal. Visit My Deals to manage it.",
      },
      { status: 409 },
    );
  }

  // Tier-1 price is the max possible charge
  const tier1 = deal.tiers[0];
  if (!tier1) {
    return NextResponse.json(
      { error: "Deal has no pricing tiers" },
      { status: 500 },
    );
  }

  const maxAmountDollars = Number(tier1.pricePerUnit.toString()) * quantity;
  const maxAmountCents = Math.round(maxAmountDollars * 100);

  // Load user for Stripe Customer lazy creation
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  const stripeCustomerId = await getOrCreateStripeCustomer(user);

  // All DB writes inside a transaction. PaymentIntent creation happens after
  // the transaction succeeds — if it fails we catch and void the order.
  let orderId: string;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      if (existingOrder && TERMINAL_STATUSES.includes(existingOrder.status)) {
        // Reuse the terminal-status row to satisfy the unique constraint
        const updated = await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            quantity,
            maxAuthorizedAmount: maxAmountDollars,
            status: OrderStatus.PENDING_AUTHORIZATION,
            createdAt: new Date(),
            stripePaymentIntentId: null,
            finalAmount: null,
            pickedUpAt: null,
            pickedUpBy: null,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: session.user.id,
            action: "ORDER_REVIVED_FROM_TERMINAL",
            entityType: "Order",
            entityId: existingOrder.id,
            metadata: {
              dealId: deal.id,
              previousStatus: existingOrder.status,
              quantity,
              maxAmountCents,
            },
          },
        });
        return updated.id;
      }

      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          dealId: deal.id,
          quantity,
          maxAuthorizedAmount: maxAmountDollars,
          status: OrderStatus.PENDING_AUTHORIZATION,
          stripePaymentIntentId: null,
        },
      });
      return order.id;
    });
  } catch (err) {
    console.error("[join] DB order creation failed", err);
    return NextResponse.json(
      { error: "Could not create order. Please try again." },
      { status: 500 },
    );
  }

  // Create PaymentIntent outside the transaction (Stripe call)
  let paymentIntent: Awaited<ReturnType<typeof stripe.paymentIntents.create>>;
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: maxAmountCents,
      currency: "cad",
      customer: stripeCustomerId,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderId,
        userId: session.user.id,
        dealId: deal.id,
        quantity: String(quantity),
      },
    });
  } catch (err) {
    console.error("[join] Stripe PaymentIntent creation failed", err);
    // Roll back: void the order we just created
    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.VOIDED },
    });
    return NextResponse.json(
      { error: "Payment setup failed. Please try again." },
      { status: 500 },
    );
  }

  // Persist PaymentIntent id and write audit log
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { stripePaymentIntentId: paymentIntent.id },
    }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ORDER_CREATED_PENDING",
        entityType: "Order",
        entityId: orderId,
        metadata: {
          dealId: deal.id,
          quantity,
          maxAmountCents,
          stripePaymentIntentId: paymentIntent.id,
        },
      },
    }),
  ]);

  return NextResponse.json(
    { orderId, clientSecret: paymentIntent.client_secret },
    { status: 201 },
  );
}
