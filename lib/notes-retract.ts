/**
 * lib/notes-retract.ts
 *
 * Pure helpers for note retraction and provisional unpublish.
 *
 * Design constraints:
 *  - No @/lib/cp imports — retraction has NO effect on CP balances. Structural
 *    guarantee: this file cannot clawback because it has no wallet access.
 *  - Helpers accept a `tx` (Prisma transaction client) parameter for
 *    testability — unit tests can pass a mock tx, no DB needed.
 *  - buildVersionSnapshot is pure (no side effects), testable without any DB.
 */

import type { Prisma, ProcessedNote } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

/** The shape stored as NoteVersion.snapshot — full note row at the time of change. */
export type NoteSnapshot = Omit<ProcessedNote, "corrections" | "versions">;

/** Minimal Prisma tx-client interface — only the models we touch. */
export interface RetractTxClient {
  processedNote: {
    findUniqueOrThrow: (args: { where: { id: string } }) => Promise<ProcessedNote>;
    update: (args: { where: { id: string }; data: Prisma.ProcessedNoteUpdateInput }) => Promise<ProcessedNote>;
  };
  noteVersion: {
    create: (args: { data: Prisma.NoteVersionCreateInput }) => Promise<unknown>;
  };
}

// ─── buildVersionSnapshot ─────────────────────────────────────────────────────

/**
 * Snapshot the current note state for versioning.
 * Pure function — no side effects, safe to call without a DB transaction.
 */
export function buildVersionSnapshot(note: ProcessedNote): NoteSnapshot {
  // Strip the relation arrays that Prisma may have loaded — snapshot is
  // self-contained JSON, never relies on joins.
  const { ...rest } = note as ProcessedNote & {
    corrections?: unknown;
    versions?: unknown;
  };
  delete (rest as Record<string, unknown>).corrections;
  delete (rest as Record<string, unknown>).versions;
  return rest as NoteSnapshot;
}

// ─── writeVersion ─────────────────────────────────────────────────────────────

/**
 * Write a NoteVersion row inside the current transaction.
 * The new versionNumber = note.version + 1 (caller's responsibility to then
 * increment ProcessedNote.version in the same tx).
 */
export async function writeVersion(
  tx: RetractTxClient,
  note: ProcessedNote,
  changedBy: string,
  changeReason: string,
): Promise<void> {
  const snapshot = buildVersionSnapshot(note);
  await tx.noteVersion.create({
    data: {
      note:             { connect: { id: note.id } },
      versionNumber:    note.version + 1,
      snapshot:         snapshot as unknown as Prisma.InputJsonValue,
      changedBy,
      changeReason,
      riskScoreAtVersion: note.riskScore,
    },
  });
}

// ─── retractNoteInTx ──────────────────────────────────────────────────────────

/**
 * Retract a note (status → RETRACTED) inside a transaction.
 *
 * Writes a NoteVersion snapshot first, then updates the note status and
 * bumps version. Does NOT require a correction to exist — can be called
 * from a standalone admin action or correction-tied action.
 *
 * NO CP clawback — by design and by file-level structural guarantee.
 */
export async function retractNoteInTx(
  tx: RetractTxClient,
  noteId: string,
  changedBy: string,
  changeReason: string,
): Promise<void> {
  const note = await tx.processedNote.findUniqueOrThrow({ where: { id: noteId } });
  await writeVersion(tx, note, changedBy, changeReason);
  await tx.processedNote.update({
    where: { id: noteId },
    data: {
      status:  "RETRACTED",
      version: note.version + 1,
    },
  });
}

// ─── unpublishNoteInTx ────────────────────────────────────────────────────────

/**
 * Provisionally unpublish a note (status → CORRECTED) inside a transaction.
 *
 * This is correction-tied: every provisional unpublish has a correction-of-record
 * (the correction that triggered the dispute response). Status CORRECTED signals
 * to the public feed query that the note is under review.
 *
 * NO CP clawback — by design and by file-level structural guarantee.
 */
export async function unpublishNoteInTx(
  tx: RetractTxClient,
  noteId: string,
  changedBy: string,
  changeReason: string,
): Promise<void> {
  const note = await tx.processedNote.findUniqueOrThrow({ where: { id: noteId } });
  await writeVersion(tx, note, changedBy, changeReason);
  await tx.processedNote.update({
    where: { id: noteId },
    data: {
      status:  "CORRECTED",
      version: note.version + 1,
    },
  });
}
