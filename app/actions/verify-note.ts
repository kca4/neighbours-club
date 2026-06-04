"use server";

/**
 * verifyNote — Server Action for the "Verify" button on a Local Note.
 *
 * SECURITY MODEL:
 *  - userId is derived from the authenticated session via auth(). It is NEVER
 *    accepted as a parameter — server action arguments are client-controlled,
 *    so accepting userId would allow any caller to mint CP into any wallet.
 *  - CP is only minted for notes that exist AND have status APPROVED. Minting
 *    for DRAFT or REJECTED noteIds is blocked, closing the point-farming hole.
 *  - Idempotency is enforced inside earnCP via the @@unique constraint on
 *    (walletId, referenceId, reason). A duplicate call returns alreadyClaimed
 *    without touching the balance.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { earnCP } from "@/lib/cp";
import { CP_REWARDS } from "@/lib/cp/rewards";

// ─── Result type ──────────────────────────────────────────────────────────────

export type VerifyNoteResult =
  | { success: true; alreadyClaimed: true; message: string }
  | { success: true; alreadyClaimed?: false; newBalance: number }
  | { success: false; error: string };

// ─── Action ───────────────────────────────────────────────────────────────────

export async function verifyNote(noteId: string): Promise<VerifyNoteResult> {
  // ── 1. Auth: userId MUST come from the session ──────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Not signed in" };
  }
  const userId = session.user.id; // server-derived; trusted

  // ── 2. Validate the note exists and is published ────────────────────────────
  const note = await prisma.processedNote.findUnique({
    where: { id: noteId },
    select: { id: true, status: true },
  });

  if (!note) {
    return { success: false, error: "Note not found" };
  }

  if (!["APPROVED", "PUBLISHED"].includes(note.status)) {
    // Blocks DRAFT — neither earns points. Matches the exact filter the
    // public feed and note page use, so this gate stays in sync with
    // what users can actually read.
    return { success: false, error: "Note not available" };
  }

  // ── 3. Stable, reason-scoped referenceId ────────────────────────────────────
  // Prefixed with the reason so the same userId:noteId pair can never collide
  // with a future reward type that legitimately uses the same two identifiers.
  const referenceId = `verified_read:${userId}:${noteId}`;

  // ── 4. Mint CP ───────────────────────────────────────────────────────────────
  try {
    const result = await earnCP({
      userId,
      amount: CP_REWARDS.verified_read,
      reason: "verified_read",
      referenceId,
    });

    // Duplicate call — the (walletId, referenceId, reason) row already exists.
    // earnCP returns deduped: true and leaves the balance unchanged.
    if (result.deduped) {
      return {
        success: true,
        alreadyClaimed: true,
        message: "You already earned points for this note.",
      };
    }

    return { success: true, newBalance: result.newBalance };
  } catch (e) {
    // InsufficientBalanceError cannot occur on an earn; any error here is
    // unexpected. Log server-side; return a generic message to the client so
    // internal details are not exposed.
    console.error("[verifyNote] unexpected error for userId=%s noteId=%s", userId, noteId, e);
    return { success: false, error: "Something went wrong" };
  }
}
