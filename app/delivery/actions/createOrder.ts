"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import type { Prisma } from "@prisma/client";
import { DeliveryOrderStatus } from "@prisma/client";

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
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tip: number;
  tax: number;
  total: number;
  deliveryAddress: {
    street: string;
    unit: string | null;
    instructions: string | null;
  };
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

  const userId = session.user.id;

  // ── Validate items against current DB prices ──────────────────────────────
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

  // ── Create the DeliveryOrder before charging ───────────────────────────────
  // Order-before-payment pattern: prevents the race condition where payment
  // succeeds but the browser closes before we record the order.
  const order = await prisma.deliveryOrder.create({
    data: {
      userId,
      restaurantId: input.restaurantId,
      items: input.items as unknown as Prisma.InputJsonValue,
      subtotal: input.subtotal,
      deliveryFee: input.deliveryFee,
      serviceFee: input.serviceFee,
      tip: input.tip,
      tax: input.tax,
      total: input.total,
      status: DeliveryOrderStatus.pending_payment,
      deliveryAddress: input.deliveryAddress,
    },
  });

  // ── Get / create Stripe customer ───────────────────────────────────────────
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, stripeCustomerId: true },
  });

  const customerId = await getOrCreateStripeCustomer(user);

  // ── Create PaymentIntent (immediate capture for delivery) ──────────────────
  const amountInCents = Math.round(input.total * 100);

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

  // ── Attach the PaymentIntent ID to the order ──────────────────────────────
  await prisma.deliveryOrder.update({
    where: { id: order.id },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    orderId: order.id,
  };
}
