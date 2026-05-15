/**
 * Daily-digest cron — POST /api/cron/send-daily-digest
 *
 * Runs once daily at 11:00 UTC (7:00 AM ET). Collects all APPROVED or
 * PUBLISHED notes from the last 24 hours that haven't been sent yet
 * (sentAt is null), selects the top 10 by total impact score, and emails
 * a digest to every confirmed, digest-enabled subscriber.
 *
 * After the send loop, sentAt is stamped on all included notes so they
 * are not re-queued in tomorrow's digest.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDailyDigest } from "@/lib/email";

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const vercelCron = req.headers.get("x-vercel-cron");
  const authorized =
    vercelCron === "1" ||
    (cronSecret && cronSecret === process.env.CRON_SECRET);

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Step 1: Fetch eligible notes from the last 24 hours
  const allNotes = await prisma.processedNote.findMany({
    where: {
      status: { in: ["APPROVED", "PUBLISHED"] },
      sentAt: null,
      createdAt: { gte: since },
    },
    select: {
      id: true,
      headline: true,
      summary: true,
      streetOrArea: true,
      category: true,
      impactSafety: true,
      impactCost: true,
      impactTime: true,
    },
  });

  if (allNotes.length === 0) {
    return NextResponse.json({ sent: 0, notesIncluded: 0, reason: "no_notes" });
  }

  // Step 2: Sort by total impact score descending, cap at 10
  const sorted = [...allNotes].sort(
    (a, b) =>
      b.impactSafety + b.impactCost + b.impactTime -
      (a.impactSafety + a.impactCost + a.impactTime)
  );
  const hasMore = sorted.length > 10;
  const notes = sorted.slice(0, 10);

  // Step 3: Fetch eligible subscribers
  const subscribers = await prisma.subscriber.findMany({
    where: {
      confirmedAt: { not: null },
      digestEnabled: true,
      unsubscribedAt: null,
    },
    select: { email: true, name: true, unsubscribeToken: true },
  });

  // Step 4: Send loop — soft-fail per subscriber
  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    try {
      const ok = await sendDailyDigest(subscriber, notes, now, hasMore);
      if (ok) {
        sent++;
      } else {
        failed++;
      }
    } catch (err) {
      console.error("[send-daily-digest] Failed for", subscriber.email, err);
      failed++;
    }
  }

  // Step 5: Stamp sentAt on all included notes (unconditional — prevents re-send tomorrow)
  await prisma.processedNote.updateMany({
    where: { id: { in: notes.map((n) => n.id) } },
    data: { sentAt: now },
  });

  return NextResponse.json({ sent, failed, notesIncluded: notes.length });
}
