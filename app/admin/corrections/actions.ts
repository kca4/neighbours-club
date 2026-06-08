"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { retractNoteInTx, unpublishNoteInTx } from "@/lib/notes-retract";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
}

// ─── acknowledgeCorrection ────────────────────────────────────────────────────

export async function acknowledgeCorrection(correctionId: string) {
  await requireAdmin();
  await prisma.noteCorrection.update({
    where: { id: correctionId },
    data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
  });
  revalidatePath("/admin/corrections");
}

// ─── resolveCorrection ────────────────────────────────────────────────────────

export async function resolveCorrection(correctionId: string, resolution: string) {
  await requireAdmin();
  await prisma.noteCorrection.update({
    where: { id: correctionId },
    data: { status: "RESOLVED", resolution, resolvedAt: new Date() },
  });
  revalidatePath("/admin/corrections");
}

// ─── rejectCorrection ─────────────────────────────────────────────────────────

export async function rejectCorrection(correctionId: string, resolution: string) {
  await requireAdmin();
  await prisma.noteCorrection.update({
    where: { id: correctionId },
    data: { status: "REJECTED", resolution, resolvedAt: new Date() },
  });
  revalidatePath("/admin/corrections");
}

// ─── attachReply ──────────────────────────────────────────────────────────────

/**
 * Attach a right-of-reply to a correction. The reply is stored on the
 * NoteCorrection row and rendered publicly on the note detail page so the
 * subject of the note has a visible voice. Status is unchanged — a reply
 * does not automatically resolve the dispute.
 */
export async function attachReply(correctionId: string, reply: string) {
  await requireAdmin();
  await prisma.noteCorrection.update({
    where: { id: correctionId },
    data: { reply },
  });
  revalidatePath("/admin/corrections");
}

// ─── unpublishNote ────────────────────────────────────────────────────────────

/**
 * Provisionally unpublish a note (CORRECTED) in response to a specific
 * correction request. Correction-tied only — every unpublish has a
 * correction-of-record. Writes a NoteVersion snapshot before status change.
 * NO CP clawback.
 */
export async function unpublishNote(correctionId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const correction = await prisma.noteCorrection.findUniqueOrThrow({
    where: { id: correctionId },
    select: { noteId: true },
  });

  await prisma.$transaction(async (tx) => {
    await unpublishNoteInTx(
      tx,
      correction.noteId,
      session.user?.email ?? "admin",
      `Provisional unpublish in response to correction ${correctionId}`,
    );
    // Mark correction acknowledged (if still OPEN) so the queue reflects action taken.
    await tx.noteCorrection.update({
      where: { id: correctionId },
      data: {
        status:         "ACKNOWLEDGED",
        acknowledgedAt: new Date(),
      },
    });
  });

  revalidatePath("/admin/corrections");
  revalidatePath("/admin/notes");
}

// ─── retractNoteFromCorrection ────────────────────────────────────────────────

/**
 * Full retraction triggered from the corrections queue (RETRACTED).
 * Writes NoteVersion snapshot, resolves the correction.
 * NO CP clawback.
 */
export async function retractNoteFromCorrection(correctionId: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const correction = await prisma.noteCorrection.findUniqueOrThrow({
    where: { id: correctionId },
    select: { noteId: true },
  });

  await prisma.$transaction(async (tx) => {
    await retractNoteInTx(
      tx,
      correction.noteId,
      session.user?.email ?? "admin",
      `Retraction in response to correction ${correctionId}`,
    );
    await tx.noteCorrection.update({
      where: { id: correctionId },
      data: {
        status:     "RESOLVED",
        resolution: "Note retracted.",
        resolvedAt: new Date(),
      },
    });
  });

  revalidatePath("/admin/corrections");
  revalidatePath("/admin/notes");
}
