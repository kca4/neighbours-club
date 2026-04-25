import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  dealCreateSchema,
  dealOpenEditSchema,
  LOCKED_WHEN_OPEN,
} from "@/lib/admin-validation";
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

const TERMINAL_STATUSES = [
  DealStatus.CLOSING_SUCCESS,
  DealStatus.CLOSING_FAILED,
  DealStatus.FULFILLING,
  DealStatus.COMPLETED,
  DealStatus.CANCELLED,
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true } },
      tiers: { orderBy: { tierOrder: "asc" } },
      _count: { select: { orders: true } },
    },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...deal,
    tiers: deal.tiers.map((t) => ({
      ...t,
      pricePerUnit: Number(t.pricePerUnit),
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const deal = await prisma.deal.findUnique({ where: { id } });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (TERMINAL_STATUSES.includes(deal.status)) {
    return NextResponse.json(
      { error: "Deal is no longer editable" },
      { status: 400 },
    );
  }

  const body = await req.json();

  if (deal.status === DealStatus.OPEN) {
    // Check for locked field attempts
    const attempted = Object.keys(body).filter((k) =>
      (LOCKED_WHEN_OPEN as readonly string[]).includes(k),
    );
    if (attempted.length > 0) {
      return NextResponse.json(
        {
          error: `These fields are locked once a deal is OPEN: ${attempted.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const parsed = dealOpenEditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const d = parsed.data;
    const updated = await prisma.deal.update({
      where: { id },
      data: {
        ...(d.description !== undefined && { description: d.description }),
        ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl ?? null }),
        ...(d.pickupLocation !== undefined && { pickupLocation: d.pickupLocation }),
        ...(d.pickupAddress !== undefined && { pickupAddress: d.pickupAddress }),
        ...(d.pickupWindowStart !== undefined && {
          pickupWindowStart: new Date(d.pickupWindowStart),
        }),
        ...(d.pickupWindowEnd !== undefined && {
          pickupWindowEnd: new Date(d.pickupWindowEnd),
        }),
        ...(d.pickupInstructions !== undefined && {
          pickupInstructions: d.pickupInstructions ?? null,
        }),
      },
    });

    return NextResponse.json({ id: updated.id });
  }

  // DRAFT: full edit
  const parsed = dealCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;

  // opensAt >= now check (5-minute grace period for form submission delay)
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

  // Slug uniqueness (allow same slug for same deal)
  if (data.slug !== deal.slug) {
    const slugConflict = await prisma.deal.findUnique({ where: { slug: data.slug } });
    if (slugConflict) {
      return NextResponse.json({ error: "Slug is already taken" }, { status: 400 });
    }
  }

  void session; // used for audit if needed

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl ?? null,
        supplierId: data.supplierId,
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
      },
    });

    // Atomically replace tiers
    await tx.dealTier.deleteMany({ where: { dealId: id } });
    await tx.dealTier.createMany({
      data: data.tiers.map((t) => ({
        dealId: id,
        minMembers: t.minMembers,
        maxMembers: t.maxMembers ?? null,
        pricePerUnit: t.pricePerUnit,
        tierOrder: t.tierOrder,
      })),
    });
  });

  return NextResponse.json({ id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    select: { id: true, status: true, _count: { select: { orders: true } } },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== DealStatus.DRAFT) {
    return NextResponse.json(
      { error: "Only DRAFT deals can be deleted" },
      { status: 400 },
    );
  }

  // DealTier cascades on delete per schema
  // Orders count check — shouldn't have any real orders on a DRAFT, but be safe
  if (deal._count.orders > 0) {
    return NextResponse.json(
      { error: "Cannot delete a deal that has orders" },
      { status: 409 },
    );
  }

  await prisma.deal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
