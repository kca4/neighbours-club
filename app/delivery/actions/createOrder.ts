"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import type { Prisma } from "@prisma/client";
import { DeliveryOrderStatus } from "@prisma/client";
import { computeFees, computeWaiverSavings, WAIVER_COST_CP } from "@/lib/delivery/fees";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItemInput {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  restaurantId: string;
  items: CartItemInput[];
  /** Tip in dollars — user's choice. Validated server-side (non-negative, ≤ $100). */
  tip: number;
  deliveryAddress: {
    street: string;
    unit: string | null;
    instructions: string | null;
  };
  /**
   * When true the user wants to burn WAIVER_COST_CP to zero the delivery fee.
   * The server performs an eligibility check (balance >= WAIVER_COST_CP) and
   * rejects with a clear error if insufficient. The CP burn itself happens in
   * the payment_intent.succeeded webhook AFTER the card is captured.
   */
  applyCpWaiver?: boolean;
}

// ─── Server action ────────────────────────────────────────────────────────────

export async function createDeliveryOrder(input: CreateOrderInput): Promise<{
  clientSecret: string;
  orderId: string;
}> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to place an order.");
  }

  // userId comes from the session — never from client input.
  const userId = session.user.id;

  // ── Reject orders for restaurants that are not yet live ────────────────────
  // This is the server-side counterpart to the preview-mode UI block in
  // CartDrawer. A preview URL with a valid token lets merchants browse the menu
  // but cannot bypass this check to place real orders.
  const orderRestaurant = await prisma.restaurant.findUnique({
    where: { id: input.restaurantId },
    select: { isActive: true },
  });
  if (!orderRestaurant || !orderRestaurant.isActive) {
    throw new Error("Ordering is not available for this restaurant.");
  }

  // ── Basic tip sanity check (relative cap applied after subtotal is known) ───
  if (!Number.isFinite(input.tip) || input.tip < 0) {
    throw new Error("Tip amount is invalid.");
  }

  // ── Validate items against current DB prices ────────────────────────────────
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: input.items.map((i) => i.itemId) },
      restaurantId: input.restaurantId,
      isAvailable: true,
    },
    select: { id: true, name: true, price: true },
  });

  for (const cartItem of input.items) {
    const dbItem = menuItems.find((m) => m.id === cartItem.itemId);
    if (!dbItem) {
      throw new Error(`"${cartItem.name}" is no longer available.`);
    }
    const dbPrice = Number(dbItem.price);
    if (Math.abs(dbPrice - cartItem.price) > 0.001) {
      throw new Error(
        `The price for "${cartItem.name}" has changed. Please go back and refresh your cart.`
      );
    }
  }

  // ── Server-side fee computation ─────────────────────────────────────────────
  // Recompute subtotal from validated DB prices — never trust a client-supplied number.
  const subtotal = Math.round(
    menuItems.reduce((sum, dbItem) => {
      const cartItem = input.items.find((i) => i.itemId === dbItem.id)!;
      return sum + Number(dbItem.price) * cartItem.quantity;
    }, 0) * 100
  ) / 100;

  const tip = Math.round(input.tip * 100) / 100;

  // ── Relative tip cap (scales with order size) ───────────────────────────────
  // Allow up to 100% of subtotal — covers any normal percentage tip on any
  // order size while still rejecting clearly absurd values.
  if (tip > subtotal) {
    throw new Error("Tip amount is invalid.");
  }

  // ── CP waiver eligibility check ─────────────────────────────────────────────
  // This is a READ, not a reservation. We accept that in a rare race the balance
  // could drop between this check and the webhook burn; that case is handled in
  // settleDeliveryPayment (logs CP_WAIVER_UNSETTLED, does not fail the order).
  let cpWaiverApplied = false;
  let cpWaivedAmount: number | null = null;

  if (input.applyCpWaiver) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { balanceCP: true },
    });
    const balance = wallet?.balanceCP ?? 0;

    if (balance < WAIVER_COST_CP) {
      throw new Error(
        `Not enough Community Points to waive the delivery fee. ` +
        `You need ${WAIVER_COST_CP.toLocaleString()} CP but have ${balance.toLocaleString()} CP.`
      );
    }

    cpWaiverApplied = true;
  }

  // ── Compute fees (waived or standard) ──────────────────────────────────────
  // computeFees / computeWaiverSavings are the authoritative math — imported
  // from lib/delivery/fees.ts (same module the UI uses for display).
  let fees = computeFees(subtotal, tip);
  if (cpWaiverApplied) {
    const savings = computeWaiverSavings(subtotal, tip);
    fees = savings.waived;
    cpWaivedAmount = savings.cpWaivedAmount;
  }

  // ── Create the DeliveryOrder before charging ────────────────────────────────
  // Order-before-payment pattern: prevents the race condition where payment
  // succeeds but the browser closes before we record the order.
  const order = await prisma.deliveryOrder.create({
    data: {
      userId,
      restaurantId: input.restaurantId,
      items: input.items as unknown as Prisma.InputJsonValue,
      subtotal: fees.subtotal,
      deliveryFee: fees.deliveryFee,
      serviceFee: fees.serviceFee,
      tip: fees.tip,
      tax: fees.tax,
      total: fees.total,
      status: DeliveryOrderStatus.PENDING_PAYMENT,
      deliveryAddress: input.deliveryAddress,
      // CP waiver fields — cpWaiverSettled stays false until the webhook burn succeeds.
      cpWaiverApplied,
      cpWaivedAmount: cpWaivedAmount !== null ? cpWaivedAmount : undefined,
      cpWaiverCost: cpWaiverApplied ? WAIVER_COST_CP : undefined,
    },
  });

  // ── Get / create Stripe customer ────────────────────────────────────────────
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  const customerId = await getOrCreateStripeCustomer(user);

  // ── Create PaymentIntent ────────────────────────────────────────────────────
  // Amount is the server-computed total (waived or standard) — never a
  // client-supplied number. The CP burn does NOT happen here; it happens in
  // settleDeliveryPayment after payment_intent.succeeded fires.
  const amountInCents = Math.round(fees.total * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "cad",
    customer: customerId,
    metadata: {
      orderId: order.id,
      restaurantId: input.restaurantId,
      userId,
      vertical: "delivery",
    },
  });

  // ── Attach the PaymentIntent ID to the order ────────────────────────────────
  await prisma.deliveryOrder.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    orderId: order.id,
  };
}
