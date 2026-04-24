"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function LeaveDealButton({ slug }: { slug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLeave = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deals/${slug}/leave`, { method: "DELETE" });
      const data: unknown = await res.json();

      if (!res.ok) {
        const errData = data as { error?: string };
        setError(errData?.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        setConfirming(false);
        return;
      }

      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
      setConfirming(false);
    }
  }, [slug, router]);

  if (confirming) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-foreground/70">
          Are you sure? Your authorization will be released and your spot
          forfeited.
        </p>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={handleLeave}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-red-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Leaving…" : "Yes, leave this deal"}
          </button>
          <button
            onClick={() => { setConfirming(false); setError(null); }}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-foreground/20 px-5 text-sm font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-red-200 px-5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
      >
        Leave this deal
      </button>
    </div>
  );
}
