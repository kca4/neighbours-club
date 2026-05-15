"use client";

import { useTransition } from "react";
import { NoteStatus } from "@prisma/client";
import { approveNote, rejectNote } from "./actions";

export default function NoteActions({
  id,
  status,
}: {
  id: string;
  status: NoteStatus;
}) {
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  const isApproved = status === "APPROVED";

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={isApproved || approvePending}
        onClick={() => startApprove(() => approveNote(id))}
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
  );
}
