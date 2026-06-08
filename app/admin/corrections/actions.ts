"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
