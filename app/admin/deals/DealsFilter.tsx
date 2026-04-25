"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { DealStatus } from "@/lib/enums";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  ...Object.values(DealStatus).map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
];

export default function DealsFilter({
  currentStatus,
  currentQ,
}: {
  currentStatus?: string;
  currentQ?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(currentQ ?? "");

  function navigate(status: string, query: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (query) params.set("q", query);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={currentStatus ?? ""}
        onChange={(e) => navigate(e.target.value, q)}
        className="admin-input w-48"
        disabled={isPending}
      >
        {STATUS_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && navigate(currentStatus ?? "", q)}
          placeholder="Search by title…"
          className="admin-input w-56"
          disabled={isPending}
        />
        <button
          type="button"
          onClick={() => navigate(currentStatus ?? "", q)}
          disabled={isPending}
          className="btn-secondary text-sm"
        >
          Search
        </button>
        {(currentStatus || currentQ) && (
          <button
            type="button"
            onClick={() => { setQ(""); navigate("", ""); }}
            className="text-sm text-foreground/50 hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
