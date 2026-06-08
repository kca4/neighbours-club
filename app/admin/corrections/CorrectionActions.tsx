"use client";

import { useState, useTransition } from "react";
import { CorrectionStatus } from "@prisma/client";
import {
  acknowledgeCorrection,
  resolveCorrection,
  rejectCorrection,
  attachReply,
} from "./actions";

export function CorrectionActions({
  id,
  status,
  existingReply,
}: {
  id: string;
  status: CorrectionStatus;
  existingReply: string | null;
}) {
  const [resolutionText, setResolutionText] = useState("");
  const [replyText, setReplyText] = useState(existingReply ?? "");
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [pending, startTransition] = useTransition();

  if (status === "RESOLVED" || status === "REJECTED") {
    return (
      <span className="text-xs text-foreground/40">
        {status === "RESOLVED" ? "Resolved" : "Dismissed"}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Status transitions ─── */}
      {status === "OPEN" && (
        <button
          disabled={pending}
          onClick={() => startTransition(() => acknowledgeCorrection(id))}
          className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-40"
        >
          Acknowledge
        </button>
      )}

      {/* Resolution (resolve or reject) */}
      <div className="flex flex-col gap-1">
        <textarea
          value={resolutionText}
          onChange={(e) => setResolutionText(e.target.value)}
          placeholder="Resolution note…"
          rows={2}
          className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
        />
        <div className="flex gap-1">
          <button
            disabled={pending || !resolutionText.trim()}
            onClick={() =>
              startTransition(() => resolveCorrection(id, resolutionText))
            }
            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-40"
          >
            Resolve
          </button>
          <button
            disabled={pending || !resolutionText.trim()}
            onClick={() =>
              startTransition(() => rejectCorrection(id, resolutionText))
            }
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-foreground/60 hover:bg-gray-50 disabled:opacity-40"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* ── Right-of-reply ─── */}
      {!showReplyBox ? (
        <button
          onClick={() => setShowReplyBox(true)}
          className="text-left text-xs underline underline-offset-1 text-foreground/40 hover:text-foreground/70"
        >
          {existingReply ? "Edit reply" : "Attach reply"}
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Subject's right-of-reply (shown publicly on the note)…"
            rows={3}
            className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
          />
          <div className="flex gap-1">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await attachReply(id, replyText);
                  setShowReplyBox(false);
                })
              }
              className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 disabled:opacity-40"
            >
              Save reply
            </button>
            <button
              onClick={() => setShowReplyBox(false)}
              className="text-xs text-foreground/40"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
