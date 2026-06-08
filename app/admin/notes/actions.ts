"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendUrgentNote } from "@/lib/email";
import { getEconParam } from "@/lib/cp/econ-params";
import { checkPublishGate } from "@/lib/notes-publish-gate";

// ─── Result type ──────────────────────────────────────────────────────────────

export type ApproveResult =
  | { blocked: false }
  | { blocked: true; reason: string }

// ─── approveNote ──────────────────────────────────────────────────────────────

/**
 * Approve a ProcessedNote for public visibility.
 *
 * THE HARD PUBLISH GATE lives here — the single chokepoint before a note
 * becomes publicly visible. Two layers of protection:
 *
 *  a) Fail-closed threshold read: if note_high_risk_threshold is missing or
 *     unreadable, the note is blocked and status is set to BLOCKED_NEEDS_FRAMEWORK.
 *     Never defaults to allowing publication on a config failure.
 *
 *  b) checkPublishGate: pure function checking riskScore vs threshold (hard) and
 *     attribution completeness (soft). See lib/notes-publish-gate.ts for rules.
 *
 * Only { blocked: false } reaches the APPROVED write + publishedAt stamp.
 */
export async function approveNote(id: string): Promise<ApproveResult> {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const note = await prisma.processedNote.findUniqueOrThrow({ where: { id } });

  // ── 1. Read threshold — FAIL-CLOSED ────────────────────────────────────────
  // If config is missing, corrupted, or not a positive finite number, block.
  // We set BLOCKED_NEEDS_FRAMEWORK so the admin can see it caught something,
  // then fix the EconParam and retry.
  let threshold: number;
  try {
    const raw = await getEconParam("note_high_risk_threshold");
    threshold = raw as number;
    if (!Number.isFinite(threshold) || threshold <= 0) throw new Error("invalid");
  } catch {
    await prisma.processedNote.update({
      where: { id },
      data: { status: "BLOCKED_NEEDS_FRAMEWORK" },
    });
    revalidatePath("/admin/notes");
    return {
      blocked: true,
      reason:
        "HIGH-risk: note_high_risk_threshold config is unreadable — failing closed. Fix the EconParam row and retry.",
    };
  }

  // ── 2. Gate check ──────────────────────────────────────────────────────────
  const gate = checkPublishGate(note, threshold);
  if (gate.blocked) {
    if (gate.hardBlock) {
      // Content problem — hard-label the note so it surfaces in the BLOCKED queue.
      await prisma.processedNote.update({
        where: { id },
        data: { status: "BLOCKED_NEEDS_FRAMEWORK" },
      });
    }
    // Attribution problem (hardBlock: false) — status unchanged; admin fixes
    // sourcePublisher and calls approveNote again.
    revalidatePath("/admin/notes");
    return { blocked: true, reason: gate.reason };
  }

  // ── 3. Approve ─────────────────────────────────────────────────────────────
  const now = new Date();
  await prisma.processedNote.update({
    where: { id },
    data: { status: "APPROVED", publishedAt: now },
  });

  // Urgent email — logic unchanged from original
  const isUrgent =
    (note.category === "Safety" || note.category === "Weather") &&
    (note.impactSafety >= 4 || note.impactCost >= 4 || note.impactTime >= 4);

  if (isUrgent) {
    const subscribers = await prisma.subscriber.findMany({
      where: {
        confirmedAt: { not: null },
        urgentEnabled: true,
        unsubscribedAt: null,
      },
      select: { email: true, name: true, unsubscribeToken: true },
    });

    let sent = 0;
    for (const sub of subscribers) {
      const ok = await sendUrgentNote(sub, note);
      if (ok) sent++;
    }

    console.log(
      `[urgent-note] Sent ${sent}/${subscribers.length} emails for note ${id}`,
    );

    await prisma.processedNote.update({
      where: { id },
      data: { sentAt: now },
    });
  }

  revalidatePath("/admin/notes");
  return { blocked: false };
}

// ─── rejectNote ───────────────────────────────────────────────────────────────

export async function rejectNote(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  await prisma.processedNote.delete({ where: { id } });
  revalidatePath("/admin/notes");
}
