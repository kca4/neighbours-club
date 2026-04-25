"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DealStatus } from "@/lib/enums";

export default function DealActions({
  dealId,
  status,
}: {
  dealId: string;
  status: DealStatus;
}) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function publish() {
    setIsPublishing(true);
    setError("");
    const res = await fetch(`/api/admin/deals/${dealId}/publish`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Publish failed");
    }
    setIsPublishing(false);
  }

  async function cancel() {
    if (
      !confirm(
        "Cancel this deal? All authorized orders will be voided and Stripe PaymentIntents cancelled. This cannot be undone.",
      )
    )
      return;
    setIsCancelling(true);
    setError("");
    const res = await fetch(`/api/admin/deals/${dealId}/cancel`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Cancel failed");
    }
    setIsCancelling(false);
  }

  async function deleteDraft() {
    if (!confirm("Permanently delete this draft deal? This cannot be undone.")) return;
    setIsDeleting(true);
    setError("");
    const res = await fetch(`/api/admin/deals/${dealId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/deals");
    } else {
      const data = await res.json();
      setError(data.error ?? "Delete failed");
    }
    setIsDeleting(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}

      {status === DealStatus.DRAFT && (
        <>
          <button
            onClick={publish}
            disabled={isPublishing}
            className="btn-primary"
          >
            {isPublishing ? "Publishing…" : "Publish"}
          </button>
          <a href={`/admin/deals/${dealId}/edit`} className="btn-secondary">
            Edit
          </a>
          <button
            onClick={deleteDraft}
            disabled={isDeleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            {isDeleting ? "Deleting…" : "Delete draft"}
          </button>
        </>
      )}

      {status === DealStatus.OPEN && (
        <>
          <a href={`/admin/deals/${dealId}/edit`} className="btn-secondary">
            Edit allowed fields
          </a>
          <button
            onClick={cancel}
            disabled={isCancelling}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
          >
            {isCancelling ? "Cancelling…" : "Cancel deal"}
          </button>
        </>
      )}
    </div>
  );
}
