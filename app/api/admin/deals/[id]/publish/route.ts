import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DealStatus } from "@prisma/client";
import { enqueueCloseMessage } from "@/lib/groupbuy/qstash";
import { sendAdminAlert } from "@/lib/admin-alert";

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

  // supplierCutoffAt is required at publish time and must be: closesAt < supplierCutoffAt < pickupWindowStart
  if (!deal.supplierCutoffAt) {
    return NextResponse.json(
      {
        error:
          'Cannot publish: supplier cutoff date is not set. ' +
          'Set "Supplier cutoff" in the deal editor before publishing.',
      },
      { status: 400 },
    );
  }

  if (deal.supplierCutoffAt <= deal.closesAt) {
    return NextResponse.json(
      {
        error:
          'Cannot publish: supplier cutoff must be after closesAt. ' +
          'Update the deal and try again.',
      },
      { status: 400 },
    );
  }

  if (deal.supplierCutoffAt >= deal.pickupWindowStart) {
    return NextResponse.json(
      {
        error:
          'Cannot publish: supplier cutoff must be before pickup window start. ' +
          'Update the deal and try again.',
      },
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

  // Production guard: QStash is required in production. An OPEN deal without
  // a scheduled deadline trigger would silently miss its close time until the
  // next reconciliation cron run (up to 24 hours late on the current schedule).
  // Check both the token AND the signing keys — missing signing keys mean the
  // QStash webhook endpoint will reject every callback.
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.QSTASH_TOKEN) {
      return NextResponse.json(
        {
          error:
            'QStash is not configured. QSTASH_TOKEN is required in production. ' +
            'Deal remains DRAFT.',
        },
        { status: 503 },
      );
    }
    if (
      !process.env.QSTASH_CURRENT_SIGNING_KEY ||
      !process.env.QSTASH_NEXT_SIGNING_KEY
    ) {
      return NextResponse.json(
        {
          error:
            'QStash signing keys are not configured. ' +
            'QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY are required in production. ' +
            'Deal remains DRAFT.',
        },
        { status: 503 },
      );
    }
  }

  // Enqueue the QStash deadline trigger BEFORE opening the deal.
  // An OPEN deal without a scheduled trigger could stay open past closesAt
  // without being processed until the next reconciliation cron run (up to 5 min late).
  // If QStash is configured (QSTASH_TOKEN present) and the enqueue fails, block publish
  // so the admin knows to retry. If QStash is not configured (dev/CI), proceed normally —
  // the reconciliation cron is the sole trigger in that environment.
  let qstashMessageId: string | null = null;
  if (process.env.QSTASH_TOKEN) {
    try {
      qstashMessageId = await enqueueCloseMessage(id, deal.closesAt);
    } catch (err) {
      console.error('[publish] QStash enqueue failed for deal', id, err);
      sendAdminAlert(
        'DEAL_CLOSE_ERROR',
        `publish_qstash_fail:${id}`,
        `QStash enqueue failed during publish for deal ${id}. Deal remains DRAFT. Error: ${String(err)}`,
      ).catch(e => console.error('[publish] sendAdminAlert failed:', e));
      return NextResponse.json(
        { error: 'Failed to schedule deal deadline trigger. Please try again or contact support.' },
        { status: 503 },
      );
    }
  }

  // QStash succeeded (or is not configured) — open the deal.
  await prisma.deal.update({
    where: { id },
    data: {
      status: DealStatus.OPEN,
      ...(qstashMessageId ? { qstashMessageId } : {}),
    },
  });

  return NextResponse.json({ ok: true, status: DealStatus.OPEN });
}
