"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus } from "@/lib/enums";

export default function PickupActions({
  orderId,
  orderStatus,
}: {
  orderId: string;
  orderStatus: string;
}) {
  const router = useRouter();
  const [isMarkingPickedUp, setIsMarkingPickedUp] = useState(false);
  const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (orderStatus !== OrderStatus.CAPTURED) {
    return null;
  }

  async function markPickedUp() {
    setIsMarkingPickedUp(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-picked-up`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to mark as picked up");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsMarkingPickedUp(false);
    }
  }

  async function markNoShow() {
    if (!confirm("Mark this order as no-show?")) return;
    setIsMarkingNoShow(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-no-show`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to mark as no-show");
      }
    } catch {
      setError("Network error");
    } finally {
      setIsMarkingNoShow(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {error && (
        <span className="text-xs text-red-600">{error}</span>
      )}
      <div className="flex gap-2">
        <button
          onClick={markPickedUp}
          disabled={isMarkingPickedUp || isMarkingNoShow}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {isMarkingPickedUp ? "Marking…" : "Picked up"}
        </button>
        <button
          onClick={markNoShow}
          disabled={isMarkingPickedUp || isMarkingNoShow}
          className="rounded-lg border border-foreground/20 px-3 py-1.5 text-xs font-semibold text-foreground/60 transition-colors hover:bg-foreground/5 disabled:opacity-60"
        >
          {isMarkingNoShow ? "Marking…" : "No-show"}
        </button>
      </div>
    </div>
  );
}
