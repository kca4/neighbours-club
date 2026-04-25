import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DealStatus } from "@prisma/client";

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

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;

  const deal = await prisma.deal.findUnique({
    where: { id },
    include: { tiers: true },
  });

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== DealStatus.DRAFT) {
    return NextResponse.json(
      { error: `Deal is already in status ${deal.status} and cannot be published` },
      { status: 400 },
    );
  }

  if (deal.tiers.length === 0) {
    return NextResponse.json(
      { error: "Deal must have at least one pricing tier before publishing" },
      { status: 400 },
    );
  }

  // MVP: reject if opensAt is in the future.
  // NOTE: The intended design is for deals to become OPEN automatically when opensAt is
  // reached (handled by a future cron job in Step 6). For MVP, admins must set opensAt
  // to now-or-past and publish manually.
  if (deal.opensAt > new Date()) {
    return NextResponse.json(
      {
        error:
          "opensAt is in the future. For MVP, set opensAt to now or a past time and publish. " +
          "Scheduled publishing (auto-open via cron) is not yet implemented.",
      },
      { status: 400 },
    );
  }

  await prisma.deal.update({
    where: { id },
    data: { status: DealStatus.OPEN },
  });

  return NextResponse.json({ ok: true, status: DealStatus.OPEN });
}
