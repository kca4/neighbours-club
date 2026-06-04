import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Server-side Stripe instance — never import this in client components.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

/**
 * Returns the Stripe Customer id for a user, creating one lazily if needed.
 * Persists the customer id back to the User row on first creation.
 */
export async function getOrCreateStripeCustomer(user: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) {
    // Verify the customer still exists in this Stripe environment.
    // If the sandbox keys were rotated the stored ID will be stale —
    // catch the "no such customer" error and fall through to create a new one.
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) {
        return user.stripeCustomerId;
      }
    } catch (err: unknown) {
      const stripeErr = err as { code?: string };
      if (stripeErr?.code !== "resource_missing") throw err;
      // resource_missing → stale ID; fall through to create a new customer
    }

    // Clear the invalid ID so we don't hit this path again for this user.
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: null },
    });
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user.id, email: user.email, name: user.name },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
