import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DealStatus } from "@prisma/client";

export async function GET() {
  const deals = await prisma.deal.findMany({
    where: { status: DealStatus.OPEN },
    select: {
      id: true,
      slug: true,
      title: true,
      closesAt: true,
      minimumMembers: true,
      supplier: { select: { name: true } },
      tiers: { select: { minMembers: true, pricePerUnit: true, tierOrder: true }, orderBy: { tierOrder: "asc" } },
      _count: { select: { orders: true } },
    },
    orderBy: { closesAt: "asc" },
    take: 4,
  });

  const shaped = deals.map((d) => {
    const orderCount = d._count.orders;
    const lowestTier = d.tiers[d.tiers.length - 1];
    const currentTier =
      [...d.tiers].reverse().find((t) => orderCount >= t.minMembers) ?? d.tiers[0];
    return {
      id: d.id,
      slug: d.slug,
      title: d.title,
      supplierName: d.supplier.name,
      closesAt: d.closesAt.toISOString(),
      minimumMembers: d.minimumMembers,
      orderCount,
      currentPrice: Number(currentTier?.pricePerUnit ?? 0),
      lowestPrice: Number(lowestTier?.pricePerUnit ?? 0),
      startingPrice: Number(d.tiers[0]?.pricePerUnit ?? 0),
    };
  });

  return NextResponse.json(shaped);
}
