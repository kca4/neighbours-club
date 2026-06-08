"use client";

import { useState, useTransition } from "react";
import { NoteStatus } from "@prisma/client";
import { approveNote, rejectNote, retractNoteStandalone } from "./actions";

export default function NoteActions({
  id,
  status,
  riskScore,
  threshold,
}: {
  id: string;
  status: NoteStatus;
  riskScore: number;
  threshold: number;
}) {
  const [blockMessage, setBlockMessage] = useState<string | null>(null);
  const [retractReason, setRetractReason] = useState("");
  const [showRetract, setShowRetract] = useState(false);
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();
  const [retractPending, startRetract] = useTransition();

  const isAlreadyApproved = status === "APPROVED";
  const isAlreadyBlocked  = status === "BLOCKED_NEEDS_FRAMEWORK";
  // Pre-check against threshold — the server gate is the authority, but we
  // render the blocked state immediately so admins don't click through.
  const isHighRisk = riskScore >= threshold;

  // ── Approve button rendering ───────────────────────────────────────────────

  if (isHighRisk || isAlreadyBlocked) {
    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
          HIGH-risk — cannot publish in pilot
          {!isAlreadyBlocked && (
            <span className="ml-1 opacity-70">(score: {riskScore})</span>
          )}
        </span>
        {/* Reject remains available — admin can still hard-delete a blocked note */}
        <button
          disabled={rejectPending}
          onClick={() => startReject(() => rejectNote(id))}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rejectPending ? "…" : "Delete"}
        </button>
      </div>
    );
  }

  // ── Normal approve/reject ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          disabled={isAlreadyApproved || approvePending}
          onClick={() =>
            startApprove(async () => {
              const result = await approveNote(id);
              if (result.blocked) {
                setBlockMessage(result.reason);
              } else {
                setBlockMessage(null);
              }
            })
          }
          className="rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {approvePending ? "…" : "Approve"}
        </button>
        <button
          disabled={rejectPending}
          onClick={() => startReject(() => rejectNote(id))}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rejectPending ? "…" : "Reject"}
        </button>
      </div>
      {/* Inline error when the server gate fires (soft block or unexpected HIGH) */}
      {blockMessage && (
        <p className="max-w-xs text-xs text-red-600">{blockMessage}</p>
      )}

      {/* ── Standalone retract (APPROVED/CORRECTED notes only) ── */}
      {(status === "APPROVED" || status === "CORRECTED") && (
        <div className="mt-1">
          {!showRetract ? (
            <button
              onClick={() => setShowRetract(true)}
              className="text-xs underline underline-offset-1 text-foreground/40 hover:text-foreground/70"
            >
              Retract
            </button>
          ) : (
            <div className="flex flex-col gap-1">
              <textarea
                value={retractReason}
                onChange={(e) => setRetractReason(e.target.value)}
                placeholder="Reason for retraction (required)…"
                rows={2}
                className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
              />
              <div className="flex gap-1">
                <button
                  disabled={retractPending || !retractReason.trim()}
                  onClick={() =>
                    startRetract(() =>
                      retractNoteStandalone(id, retractReason)
                    )
                  }
                  className="rounded-lg border border-orange-200 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-40"
                >
                  {retractPending ? "…" : "Confirm retract"}
                </button>
                <button
                  onClick={() => { setShowRetract(false); setRetractReason(""); }}
                  className="text-xs text-foreground/40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
