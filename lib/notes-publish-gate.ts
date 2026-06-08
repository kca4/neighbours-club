/**
 * lib/notes-publish-gate.ts — Pure publish-gate logic.
 *
 * No database calls, no `server-only` guard. Extracted so that:
 *  1. Unit tests can import and run without mocking Prisma or Next.js.
 *  2. approveNote (app/admin/notes/actions.ts) keeps its DB/auth logic
 *     separate from the gate rules.
 *
 * GATE RULES (checked in order — first match wins):
 *
 *  1. riskScore >= threshold → hardBlock: true → BLOCKED_NEEDS_FRAMEWORK
 *     Content judgment. Irreversible in the pilot. Sets the status label so
 *     the blocked queue is a clean signal of what the firewall catches.
 *
 *  2. sourceUrl present but sourcePublisher absent → hardBlock: false
 *     Metadata gap. Admin can populate attribution and retry. Status stays
 *     DRAFT; note does NOT enter the BLOCKED queue.
 *
 * PRECEDENCE: if a note is BOTH high-risk AND missing attribution, rule 1
 * fires first (content problem dominates metadata problem) and the note is
 * hard-blocked. The both-true case is tested explicitly.
 *
 * Do NOT import from `@/lib/prisma` or `server-only` here.
 */

export type GateResult =
  | { blocked: false }
  | { blocked: true; reason: string; hardBlock: boolean }

/**
 * Check whether a note may be approved for publication.
 *
 * @param note      Subset of ProcessedNote fields needed for the gate checks.
 * @param threshold The note_high_risk_threshold EconParam value (integer, read
 *                  by the caller — gate itself is a pure function of note + threshold).
 * @returns { blocked: false } when the note may proceed to APPROVED.
 *          { blocked: true, hardBlock: true  } for HIGH-risk content — caller
 *            must set status = BLOCKED_NEEDS_FRAMEWORK.
 *          { blocked: true, hardBlock: false } for fixable metadata — caller
 *            must NOT change status; admin can remediate and retry.
 */
export function checkPublishGate(
  note: {
    riskScore: number
    sourceUrl: string | null
    sourcePublisher: string | null
  },
  threshold: number,
): GateResult {
  // Rule 1 — content gate (hard, irreversible in pilot)
  if (note.riskScore >= threshold) {
    return {
      blocked: true,
      hardBlock: true,
      reason: `HIGH-risk: riskScore ${note.riskScore} ≥ threshold ${threshold} — cannot publish in pilot. Route to framework review.`,
    }
  }

  // Rule 2 — attribution gate (soft, remediable)
  // Only applies to sourced notes (sourceUrl present).
  // Notes without a sourceUrl (e.g. business submissions) are not subject to
  // the attribution check — there is no external source to attribute.
  if (note.sourceUrl && !note.sourcePublisher) {
    return {
      blocked: true,
      hardBlock: false,
      reason: 'Attribution missing: note has a sourceUrl but no sourcePublisher. Populate attribution before approving.',
    }
  }

  return { blocked: false }
}
