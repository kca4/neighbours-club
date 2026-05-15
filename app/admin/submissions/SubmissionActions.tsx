"use client";

import { useTransition } from "react";
import { SubmissionStatus } from "@prisma/client";
import { approveSubmission, rejectSubmission } from "./actions";

export default function SubmissionActions({
  id,
  status,
}: {
  id: string;
  status: SubmissionStatus;
}) {
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  const isPending = status === "PENDING";

  return (
    <div className="flex items-center gap-2">
      <button
        disabled={!isPending || approvePending}
        onClick={() => startApprove(() => approveSubmission(id))}
        className="rounded-lg border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {approvePending ? "…" : "Approve"}
      </button>
      <button
        disabled={!isPending || rejectPending}
        onClick={() => startReject(() => rejectSubmission(id))}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {rejectPending ? "…" : "Reject"}
      </button>
    </div>
  );
}
