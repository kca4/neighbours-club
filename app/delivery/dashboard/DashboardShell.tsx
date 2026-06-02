"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { ExternalLink, ChevronDown, Store } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { OperatingHours } from "@/lib/types/delivery";
import { DashboardContext } from "./DashboardContext";
import QueryProvider from "./QueryProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OwnedRestaurant {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  hours: OperatingHours;
  isPaused: boolean;
}

// ─── Hours helpers (same logic as InfoBar.tsx) ────────────────────────────────

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0
    ? `${hour}:00 ${period}`
    : `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

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
  const closeMin = ch === 0 && cm === 0 ? 24 * 60 : ch * 60 + cm;

  if (nowMin < openMin) {
    return {
      isOpen: false,
      label: `Closed · Opens at ${formatTime(today.open)}`,
    };
  }
  if (nowMin >= closeMin) {
    return { isOpen: false, label: "Closed for today" };
  }
  return { isOpen: true, label: `Open until ${formatTime(today.close)}` };
}

// ─── RestaurantLogo ───────────────────────────────────────────────────────────

function RestaurantLogo({
  name,
  logoUrl,
  size = 40,
}: {
  name: string;
  logoUrl: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} logo`}
        width={size}
        height={size}
        className="rounded-xl object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontFamily: "var(--font-fraunces)",
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// ─── RestaurantSelector ───────────────────────────────────────────────────────

function RestaurantSelector({
  restaurants,
  activeId,
  onSelect,
}: {
  restaurants: OwnedRestaurant[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = restaurants.find((r) => r.id === activeId) ?? restaurants[0];

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-w-0 items-center gap-2 rounded-xl border border-foreground/12 bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        <RestaurantLogo name={active.name} logoUrl={active.logoUrl} size={24} />
        <span className="max-w-[180px] truncate">{active.name}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            "shrink-0 text-foreground/40 transition-transform duration-150",
            open ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Switch restaurant"
          className="absolute right-0 top-full z-50 mt-1.5 min-w-full overflow-hidden rounded-xl border border-foreground/10 bg-white py-1 shadow-lg"
        >
          {restaurants.map((r) => (
            <li key={r.id} role="option" aria-selected={r.id === activeId}>
              <button
                onClick={() => {
                  onSelect(r.id);
                  setOpen(false);
                }}
                className={[
                  "flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-foreground/4",
                  r.id === activeId
                    ? "font-semibold text-primary"
                    : "text-foreground",
                ].join(" ")}
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                <RestaurantLogo name={r.name} logoUrl={r.logoUrl} size={28} />
                <span className="min-w-0 truncate">{r.name}</span>
                {r.id === activeId && (
                  <span className="ml-auto shrink-0 text-xs text-primary/60">
                    active
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

export default function DashboardShell({
  restaurants,
  children,
}: {
  restaurants: OwnedRestaurant[];
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive active restaurant from URL param, fall back to first
  const paramId = searchParams.get("restaurant");
  const activeId =
    restaurants.find((r) => r.id === paramId)?.id ?? restaurants[0].id;
  const active = restaurants.find((r) => r.id === activeId) ?? restaurants[0];

  const hoursStatus = getHoursStatus(active.hours);
  const isMulti = restaurants.length > 1;

  function handleSelect(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("restaurant", id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <DashboardContext.Provider value={{ activeRestaurantId: activeId }}>
    <QueryProvider>
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Dashboard header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-foreground/8 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          {/* Logo + name */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <RestaurantLogo
              name={active.name}
              logoUrl={active.logoUrl}
              size={40}
            />

            <div className="min-w-0">
              <h1
                className="truncate text-xl font-bold italic text-foreground"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                {active.name}
              </h1>

              {/* Open / Closed indicator */}
              <div className="flex items-center gap-1.5">
                <span
                  className={[
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    hoursStatus.isOpen ? "bg-green-500" : "bg-foreground/25",
                  ].join(" ")}
                  aria-hidden
                />
                <p
                  className={[
                    "text-xs",
                    hoursStatus.isOpen
                      ? "font-medium text-green-700"
                      : "text-foreground/45",
                  ].join(" ")}
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  {hoursStatus.label}
                </p>
              </div>
            </div>
          </div>

          {/* Right-side controls */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Link to customer-facing menu */}
            <Link
              href={`/delivery/${active.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-sm font-medium text-foreground/60 transition-colors hover:border-foreground/25 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{ fontFamily: "var(--font-inter-tight)" }}
              title="View customer-facing menu"
            >
              <ExternalLink size={14} strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline">View menu</span>
            </Link>

            {/* Restaurant selector — only shown for multi-restaurant owners */}
            {isMulti && (
              <RestaurantSelector
                restaurants={restaurants}
                activeId={activeId}
                onSelect={handleSelect}
              />
            )}
          </div>
        </div>

        {/* Paused banner */}
        {active.isPaused && (
          <div className="border-t border-amber-200 bg-amber-50 px-4 py-2.5 sm:px-6">
            <p
              className="text-center text-xs font-medium text-amber-800"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Orders are paused for this restaurant. Customers cannot place new
              orders.
            </p>
          </div>
        )}
      </header>

      {/* ── Page content ─────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
    </QueryProvider>
    </DashboardContext.Provider>
  );
}
