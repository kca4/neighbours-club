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
    return user.stripeCustomerId;
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
