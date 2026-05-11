import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { SERVICE_FEE } from "@/lib/config";

const itemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().positive(),
});

const bodySchema = z.object({
  restaurantSlug: z.string(),
  items: z.array(itemSchema).min(1),
  deliveryAddressLine1: z.string().min(1),
  deliveryAddressLine2: z.string().optional(),
  deliveryCity: z.string().min(1),
  deliveryPostal: z.string().min(1),
  deliveryNote: z.string().max(500).optional(),
  tipAmount: z.number().min(0),
  paymentMethodId: z.string(), // Stripe PaymentMethod ID
});

// TODO: implement real order creation:
//   1. Look up Restaurant by slug, verify isActive
//   2. Validate all menuItemIds belong to that restaurant and prices match
//   3. Create Stripe PaymentIntent with manual capture
//   4. Create DeliveryOrder in DB with status PENDING
//   5. Notify kitchen (push or email)
//   6. Return order ID for client to poll /api/orders/delivery/[orderId]

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const subtotal = parsed.data.items.reduce(
    (s, i) => s + i.unitPrice * i.quantity,
    0
  );
  const tax = +(subtotal * 0.13).toFixed(2);
  const total = +(subtotal + 2.99 + SERVICE_FEE + tax + parsed.data.tipAmount).toFixed(2);

  // TODO: replace stub orderId with real DB-generated ID
  const orderId = `ord_${Date.now()}`;
  return NextResponse.json({ ok: true, orderId, total }, { status: 201 });
}
