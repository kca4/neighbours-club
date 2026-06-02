"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect, useCallback } from "react";
import { RefreshCw, WifiOff, RotateCcw } from "lucide-react";
import { useDashboard } from "./DashboardContext";
import { getActiveOrders, type ActiveOrder } from "./actions/getActiveOrders";
import OrderCard from "./OrderCard";

// ─── Grouping ─────────────────────────────────────────────────────────────────

const PREPARING_STATUSES = new Set([
  "ACCEPTED",
  "AWAITING_COURIER",
  "COURIER_ASSIGNED",
  "COOKING",
]);

// ─── Audio alert ──────────────────────────────────────────────────────────────
// Uses Web Audio API oscillator — no audio file needed.

function playNewOrderBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone "ding" — high then slightly lower
    osc.type = "sine";
    osc.frequency.setValueAtTime(1046, ctx.currentTime); // C6
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18); // A5

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);

    // Release the AudioContext after the beep is done
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // AudioContext not available (SSR, restricted browser policy, etc.)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAgo(ts: number): string {
  if (!ts) return "—";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  return `${Math.floor(secs / 60)}m ago`;
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface ColumnProps {
  title: string;
  orders: ActiveOrder[];
  newOrderIds: Set<string>;
  headerClass: string;
  dotClass: string;
  emptyText: string;
}

function Column({
  title,
  orders,
  newOrderIds,
  headerClass,
  dotClass,
  emptyText,
}: ColumnProps) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      {/* Column header */}
      <div
        className={[
          "flex items-center gap-2 rounded-xl px-3.5 py-2.5",
          headerClass,
        ].join(" ")}
      >
        <span
          className={["h-2 w-2 shrink-0 rounded-full", dotClass].join(" ")}
          aria-hidden
        />
        <h2
          className="flex-1 text-sm font-semibold"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {title}
        </h2>
        {orders.length > 0 && (
          <span
            className="rounded-full bg-white/60 px-2 py-0.5 text-xs font-bold tabular-nums"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {orders.length}
          </span>
        )}
      </div>

      {/* Cards or empty state */}
      {orders.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-foreground/10 py-10">
          <p
            className="text-xs text-foreground/30"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {emptyText}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isNew={newOrderIds.has(order.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── OrderFeed ────────────────────────────────────────────────────────────────

export default function OrderFeed() {
  const { activeRestaurantId } = useDashboard();

  // ── Pause polling when the tab is hidden ──────────────────────────────────
  const [isTabVisible, setIsTabVisible] = useState(true);
  useEffect(() => {
    function handleVisibility() {
      setIsTabVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const { data, dataUpdatedAt, refetch, isFetching, isError } = useQuery({
    queryKey: ["active-orders", activeRestaurantId],
    queryFn: () => getActiveOrders(activeRestaurantId),
    refetchInterval: isTabVisible ? 10_000 : false,
    staleTime: 5_000,
  });

  // ── New-order detection ────────────────────────────────────────────────────
  const seenIdsRef = useRef<Set<string> | null>(null);
  const isFirstLoadRef = useRef(true);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!data) return;

    // First successful load: seed the seen-ids without beeping
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      seenIdsRef.current = new Set(data.map((o) => o.id));
      return;
    }

    // Find PENDING orders that weren't in the previous poll
    const freshPending = data
      .filter(
        (o) => o.status === "PENDING" && !seenIdsRef.current?.has(o.id)
      )
      .map((o) => o.id);

    // Always update the seen-ids set before returning
    seenIdsRef.current = new Set(data.map((o) => o.id));

    if (freshPending.length === 0) return;

    playNewOrderBeep();
    setNewOrderIds((prev) => new Set([...prev, ...freshPending]));

    // Remove the highlight after 5 seconds
    const timer = setTimeout(() => {
      setNewOrderIds((prev) => {
        const next = new Set(prev);
        freshPending.forEach((id) => next.delete(id));
        return next;
      });
    }, 5_000);

    return () => clearTimeout(timer);
  }, [data]);

  // ── Tick for "last updated" label ─────────────────────────────────────────
  // Re-renders every 10 s so the relative timestamp stays fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 10_000);
    return () => clearInterval(t);
  }, []);

  // Stable refetch callback for the error banner button
  const handleRetry = useCallback(() => { void refetch(); }, [refetch]);

  // ── Group orders by kitchen stage ─────────────────────────────────────────
  const orders = data ?? [];
  const pending = orders.filter((o) => o.status === "PENDING");
  const preparing = orders.filter((o) => PREPARING_STATUSES.has(o.status));
  const ready = orders.filter((o) => o.status === "READY");

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Status bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {isError ? (
            <>
              <WifiOff
                size={13}
                strokeWidth={2}
                className="text-red-400"
                aria-hidden
              />
              <span
                className="text-xs text-red-500"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Connection error — retrying…
              </span>
            </>
          ) : (
            <>
              {/* Pulsing live dot */}
              <span className="relative flex h-2.5 w-2.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span
                className="text-xs text-foreground/40"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                {dataUpdatedAt
                  ? `Updated ${formatAgo(dataUpdatedAt)}`
                  : "Loading…"}
              </span>
            </>
          )}
        </div>

        <button
          onClick={() => void refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-xl border border-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground/50 transition-colors hover:border-foreground/20 hover:text-foreground/70 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          style={{ fontFamily: "var(--font-inter-tight)" }}
          title="Refresh now"
          aria-label="Refresh orders"
        >
          <RefreshCw
            size={12}
            strokeWidth={2}
            className={isFetching ? "animate-spin" : ""}
            aria-hidden
          />
          Refresh
        </button>
      </div>

      {/* Error banner — shown when the query is in a hard error state */}
      {isError && (
        <div
          className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          role="alert"
        >
          <p
            className="text-sm text-red-700"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Could not load orders — check your connection.
          </p>
          <button
            onClick={handleRetry}
            disabled={isFetching}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            <RotateCcw size={12} strokeWidth={2} className={isFetching ? "animate-spin" : ""} aria-hidden />
            Try again
          </button>
        </div>
      )}

      {/* Three-column kitchen board */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Column
          title="New"
          orders={pending}
          newOrderIds={newOrderIds}
          headerClass="bg-amber-50 text-amber-900"
          dotClass="bg-amber-400"
          emptyText="No new orders"
        />
        <Column
          title="Preparing"
          orders={preparing}
          newOrderIds={newOrderIds}
          headerClass="bg-teal-50 text-teal-900"
          dotClass="bg-primary"
          emptyText="Nothing in the kitchen"
        />
        <Column
          title="Ready"
          orders={ready}
          newOrderIds={newOrderIds}
          headerClass="bg-green-50 text-green-900"
          dotClass="bg-green-500"
          emptyText="No orders ready yet"
        />
      </div>
    </div>
  );
}
