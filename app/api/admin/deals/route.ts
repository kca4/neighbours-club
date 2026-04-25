import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dealCreateSchema } from "@/lib/admin-validation";
import { DealStatus, OrderStatus } from "@prisma/client";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get("status");

  const where = statusParam
    ? { status: statusParam as DealStatus }
    : {};

  const deals = await prisma.deal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      supplier: { select: { name: true } },
      orders: {
        where: {
          status: { in: [OrderStatus.AUTHORIZED, OrderStatus.CAPTURED, OrderStatus.PICKED_UP] },
        },
        select: { id: true },
      },
    },
  });

  const serialized = deals.map((d) => ({
    ...d,
    memberCount: d.orders.length,
    orders: undefined,
  }));

  return NextResponse.json(serialized);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const body = await req.json();

  const parsed = dealCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // opensAt must be >= now (5-minute grace period for form submission delay)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (new Date(data.opensAt) < fiveMinutesAgo) {
    return NextResponse.json(
      { error: "opensAt must not be in the past by more than 5 minutes" },
      { status: 400 },
    );
  }

  // Verify supplier exists
  const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
  if (!supplier) {
    return NextResponse.json({ error: "Supplier not found" }, { status: 400 });
  }

  // Verify slug is unique
  const existing = await prisma.deal.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return NextResponse.json({ error: "Slug is already taken" }, { status: 400 });
  }

  const deal = await prisma.$transaction(async (tx) => {
    const created = await tx.deal.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl ?? null,
        supplierId: data.supplierId,
        createdById: session!.user.id,
        minimumMembers: data.minimumMembers,
        maximumMembers: data.maximumMembers ?? null,
        maxQuantityPerMember: data.maxQuantityPerMember,
        opensAt: new Date(data.opensAt),
        closesAt: new Date(data.closesAt),
        pickupLocation: data.pickupLocation,
        pickupAddress: data.pickupAddress,
        pickupWindowStart: new Date(data.pickupWindowStart),
        pickupWindowEnd: new Date(data.pickupWindowEnd),
        pickupInstructions: data.pickupInstructions ?? null,
        status: DealStatus.DRAFT,
      },
    });

    await tx.dealTier.createMany({
      data: data.tiers.map((t) => ({
        dealId: created.id,
        minMembers: t.minMembers,
        maxMembers: t.maxMembers ?? null,
        pricePerUnit: t.pricePerUnit,
        tierOrder: t.tierOrder,
      })),
    });

    return created;
  });

  return NextResponse.json({ id: deal.id }, { status: 201 });
}
