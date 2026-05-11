import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import OrderStatusView from "./OrderStatusView";

export const metadata: Metadata = { title: "Order Status" };

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/signin?callbackUrl=/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      deal: {
        include: {
          supplier: true,
          tiers: { orderBy: { tierOrder: "asc" } },
        },
      },
    },
  });

  if (!order || order.userId !== session.user.id) notFound();

  return (
    <OrderStatusView
      order={{
        id: order.id,
        status: order.status,
        quantity: order.quantity,
        maxAuthorizedAmount: order.maxAuthorizedAmount.toString(),
        finalAmount: order.finalAmount?.toString() ?? null,
        createdAt: order.createdAt.toISOString(),
        pickedUpAt: order.pickedUpAt?.toISOString() ?? null,
      }}
      deal={{
        id: order.deal.id,
        title: order.deal.title,
        supplierName: order.deal.supplier.name,
        closesAt: order.deal.closesAt.toISOString(),
        pickupLocation: order.deal.pickupLocation,
        pickupAddress: order.deal.pickupAddress,
        pickupWindowStart: order.deal.pickupWindowStart.toISOString(),
        pickupWindowEnd: order.deal.pickupWindowEnd.toISOString(),
        pickupInstructions: order.deal.pickupInstructions ?? null,
        status: order.deal.status,
        finalPrice: order.deal.finalPrice?.toString() ?? null,
      }}
    />
  );
}
