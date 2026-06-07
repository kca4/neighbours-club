"use server";

/**
 * verifyNote — Server Action for the "Verify" button on a Local Note.
 *
 * SECURITY MODEL:
 *  - userId is derived from the authenticated session via auth(). It is NEVER
 *    accepted as a parameter — server action arguments are client-controlled,
 *    so accepting userId would allow any caller to mint CP into any wallet.
 *  - CP is only minted for notes that exist AND have status APPROVED/PUBLISHED.
 *    Minting for DRAFT or REJECTED noteIds is blocked.
 *  - Idempotency is enforced inside earnVerifiedReadCP via the @@unique
 *    constraint on (walletId, referenceId, reason). A duplicate call returns
 *    alreadyClaimed without touching the balance.
 *  - The amount awarded is determined by the diminishing content-faucet curve
 *    and caps from EconParam — not a flat constant. A 6th+ daily read earns
 *    0 CP but still succeeds and is recorded.
 */

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { earnVerifiedReadCP } from "@/lib/cp";

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
    // Blocks DRAFT — neither earns points.
    return { success: false, error: "Note not available" };
  }

  // ── 3. Award CP via the diminishing content-faucet ──────────────────────────
  // referenceId is built internally inside earnVerifiedReadCP as
  // `verified_read:{userId}:{noteId}` — the action does not construct it.
  try {
    const result = await earnVerifiedReadCP({ userId, noteId });

    if (result.deduped) {
      // Same note verified twice by the same user — the original ledger row
      // already exists; balance is unchanged.
      return {
        success: true,
        alreadyClaimed: true,
        message: "You already earned points for this note.",
      };
    }

    return { success: true, newBalance: result.newBalance };
  } catch (e) {
    // InsufficientBalanceError cannot occur on an earn. Any error here is
    // unexpected. Log server-side; return a generic message to avoid leaking
    // internal details.
    console.error("[verifyNote] unexpected error for userId=%s noteId=%s", userId, noteId, e);
    return { success: false, error: "Something went wrong" };
  }
}
