import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveTrip } from "./actions/tripActions";
import ActiveTripView from "./ActiveTripView";

export default async function ActiveTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: orderId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=/delivery/driver/orders/${orderId}`);
  }

  const driver = await prisma.deliveryDriver.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!driver) {
    redirect("/delivery/driver");
  }

  const order = await getActiveTrip(orderId);

  if (!order) {
    notFound();
  }

  return <ActiveTripView order={order} />;
}
