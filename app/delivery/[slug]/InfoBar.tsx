"use client";

import { useState } from "react";
import { Star, Clock, Truck, AlertCircle } from "lucide-react";
import type { OperatingHours } from "@/lib/types/delivery";
import { REVIEWS_ENABLED } from "@/lib/delivery/reviews";

// ─── Hours helpers ────────────────────────────────────────────────────────────

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** "14:30" → "2:30 PM", "00:00" → "12:00 AM" */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${hour}:00 ${period}`
    : `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Returns a human-readable hours status using the browser's local clock. */
function getHoursStatus(hours: OperatingHours): {
  isOpen: boolean;
  label: string;
} {
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const today = hours[dayKey];

  if (!today || today.isClosed) {
    return { isOpen: false, label: "Closed today" };
  }

  const [oh, om] = today.open.split(":").map(Number);
  const [ch, cm] = today.close.split(":").map(Number);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = oh * 60 + om;
  // "00:00" close means midnight — treat as 24:00 so the comparison works
  const closeMin = ch === 0 && cm === 0 ? 24 * 60 : ch * 60 + cm;

  if (nowMin < openMin) {
    return { isOpen: false, label: `Closed · Opens at ${formatTime(today.open)}` };
  }
  if (nowMin >= closeMin) {
    return { isOpen: false, label: "Closed for today" };
  }
  return { isOpen: true, label: `Open until ${formatTime(today.close)}` };
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InfoBarProps {
  rating: number | null;
  reviewCount: number;
  estimatedMinMin: number;
  estimatedMinMax: number;
  isPaused: boolean;
  ownerName: string | null;
  ownerQuote: string | null;
  description: string | null;
  hours: OperatingHours;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InfoBar({
  rating,
  reviewCount,
  estimatedMinMin,
  estimatedMinMax,
  isPaused,
  ownerName,
  ownerQuote,
  description,
  hours,
}: InfoBarProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  // Computed once on mount from browser clock — no polling needed
  const hoursStatus = getHoursStatus(hours);

  const hasLongDesc = (description?.length ?? 0) > 120;

  return (
    <div className="bg-white">
      {/* ── Info chips row ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 sm:px-6">
        {/* Rating */}
        {REVIEWS_ENABLED && rating !== null && (
          <div className="flex items-center gap-1.5">
            <Star
              size={14}
              fill="currentColor"
              strokeWidth={0}
              className="text-accent shrink-0"
            />
            <span className="text-sm font-semibold text-foreground">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-foreground/40">
              ({reviewCount.toLocaleString()})
            </span>
          </div>
        )}

        <span className="h-3.5 w-px bg-foreground/10" aria-hidden />

        {/* Delivery time */}
        <div className="flex items-center gap-1.5 text-sm text-foreground/60">
          <Clock size={14} strokeWidth={2} className="shrink-0" />
          <span>
            {estimatedMinMin}–{estimatedMinMax} min
          </span>
        </div>

        <span className="h-3.5 w-px bg-foreground/10" aria-hidden />

        {/* Delivery fee */}
        <div className="flex items-center gap-1.5 text-sm">
          <Truck size={14} strokeWidth={2} className="shrink-0 text-foreground/40" />
          <span className="font-medium text-green-700">Free delivery</span>
        </div>
      </div>

      {/* ── Paused banner ───────────────────────────────────────────────── */}
      {isPaused && (
        <div className="mx-5 mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:mx-6">
          <AlertCircle
            size={16}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-accent"
          />
          <p className="text-sm font-medium text-amber-800">
            This restaurant is currently not accepting orders.
          </p>
        </div>
      )}

      {/* ── Owner quote ─────────────────────────────────────────────────── */}
      {ownerQuote && (
        <div className="border-t border-foreground/5 px-5 py-4 sm:px-6">
          <blockquote className="flex flex-col gap-1">
            <p
              className="text-sm italic leading-relaxed text-foreground/65"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              &ldquo;{ownerQuote}&rdquo;
            </p>
            {ownerName && (
              <cite className="not-italic text-xs text-foreground/35">
                — {ownerName}, Owner
              </cite>
            )}
          </blockquote>
        </div>
      )}

      {/* ── Description ─────────────────────────────────────────────────── */}
      {description && (
        <div className="border-t border-foreground/5 px-5 py-4 sm:px-6">
          <p
            className={[
              "text-sm leading-relaxed text-foreground/60 transition-all",
              !descExpanded && hasLongDesc ? "line-clamp-2" : "",
            ].join(" ")}
          >
            {description}
          </p>
          {hasLongDesc && (
            <button
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1.5 text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
            >
              {descExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* ── Hours status ────────────────────────────────────────────────── */}
      <div className="border-t border-foreground/5 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          {/* Status dot */}
          <span
            className={[
              "h-2 w-2 shrink-0 rounded-full",
              hoursStatus.isOpen ? "bg-green-500" : "bg-foreground/20",
            ].join(" ")}
            aria-hidden
          />
          <p
            className={[
              "text-sm font-medium",
              hoursStatus.isOpen ? "text-green-700" : "text-foreground/45",
            ].join(" ")}
          >
            {hoursStatus.label}
          </p>
        </div>
      </div>
    </div>
  );
}
