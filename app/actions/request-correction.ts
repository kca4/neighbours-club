"use server";

import { prisma } from "@/lib/prisma";

export type CorrectionRequestResult =
  | { ok: true }
  | { ok: false; error: string };

export async function requestCorrection(
  noteId: string,
  requesterContact: string,
  claim: string,
): Promise<CorrectionRequestResult> {
  if (!requesterContact.trim() || !claim.trim()) {
    return { ok: false, error: "Contact and claim are required." };
  }

  // Only APPROVED or PUBLISHED notes can receive corrections.
  const note = await prisma.processedNote.findUnique({
    where: { id: noteId },
    select: { status: true },
  });

  if (!note || !["APPROVED", "PUBLISHED"].includes(note.status)) {
    return { ok: false, error: "Note not found or not publicly visible." };
  }

  await prisma.noteCorrection.create({
    data: {
      noteId,
      requesterContact: requesterContact.trim(),
      claim: claim.trim(),
      status: "OPEN",
    },
  });

  return { ok: true };
}
