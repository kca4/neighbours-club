"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Package,
  Clock,
  ChevronRight,
  Loader2,
  Navigation,
} from "lucide-react";
import type { DriverStatus, VehicleType } from "@prisma/client";
import {
  toggleDriverStatus,
  acceptOrder,
  getAvailableOrders,
  type AvailableOrder,
} from "./actions/driverActions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  const secs = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

// ─── StatusToggle ─────────────────────────────────────────────────────────────

function StatusToggle({
  status,
  onChange,
  disabled,
}: {
  status: DriverStatus;
  onChange: (next: DriverStatus) => void;
  disabled: boolean;
}) {
  const isAvailable = status === "AVAILABLE";

  return (
    <div className="flex flex-col items-center gap-3 px-6 py-6">
      <p
        className="text-xs font-semibold uppercase tracking-widest text-foreground/40"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        Status
      </p>

      {/* Toggle track */}
      <button
        role="switch"
        aria-checked={isAvailable}
        aria-label={isAvailable ? "Go offline" : "Go available"}
        disabled={disabled}
        onClick={() => onChange(isAvailable ? "OFFLINE" : "AVAILABLE")}
        className={[
          "relative flex h-16 w-40 items-center rounded-full border-2 transition-colors duration-300",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          "disabled:opacity-60",
          isAvailable
            ? "border-primary bg-primary"
            : "border-foreground/20 bg-foreground/8",
        ].join(" ")}
      >
        {/* Labels */}
        <span
          className={[
            "absolute left-4 text-sm font-bold transition-opacity duration-200",
            isAvailable ? "opacity-100 text-white" : "opacity-0",
          ].join(" ")}
          style={{ fontFamily: "var(--font-inter-tight)" }}
          aria-hidden
        >
          ON
        </span>
        <span
          className={[
            "absolute right-4 text-sm font-bold transition-opacity duration-200",
            !isAvailable ? "opacity-100 text-foreground/50" : "opacity-0",
          ].join(" ")}
          style={{ fontFamily: "var(--font-inter-tight)" }}
          aria-hidden
        >
          OFF
        </span>

        {/* Thumb */}
        <span
          className={[
            "absolute h-11 w-11 rounded-full bg-white shadow-md transition-all duration-300",
            isAvailable ? "left-[calc(100%-48px)]" : "left-1",
          ].join(" ")}
          aria-hidden
        />
      </button>

      <p
        className={[
          "text-base font-semibold",
          isAvailable ? "text-primary" : "text-foreground/45",
        ].join(" ")}
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        {isAvailable ? "Available for orders" : "Offline"}
      </p>
    </div>
  );
}

// ─── ActiveDeliveryBanner ─────────────────────────────────────────────────────

function ActiveDeliveryBanner({ orderId }: { orderId: string }) {
  const router = useRouter();

  return (
    <div className="mx-4 mb-4">
      <button
        onClick={() => router.push(`/delivery/driver/orders/${orderId}`)}
        className={[
          "flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-4",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          "active:scale-[0.98] transition-transform",
        ].join(" ")}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Navigation size={20} strokeWidth={2} className="text-white" aria-hidden />
          </div>
          <div className="text-left">
            <p
              className="text-sm font-bold text-white"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Active delivery in progress
            </p>
            <p
              className="text-xs text-white/70"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Order #{orderId.slice(-6).toUpperCase()} · Tap to view
            </p>
          </div>
        </div>
        <ChevronRight size={20} strokeWidth={2} className="shrink-0 text-white/70" aria-hidden />
      </button>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

function AvailableOrderCard({
  order,
  onAccepted,
}: {
  order: AvailableOrder;
  onAccepted: (orderId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await acceptOrder(order.id);
      if (!result.success) {
        setError(result.error ?? "Could not accept order.");
        // Refresh the feed so the taken order disappears
        await queryClient.invalidateQueries({ queryKey: ["available-orders"] });
        return;
      }
      // Navigate to active trip page (built in next prompt)
      onAccepted(order.id);
    });
  }

  return (
    <article
      className="mx-4 mb-3 rounded-2xl border border-foreground/8 bg-white p-4 shadow-sm"
      aria-label={`Order from ${order.restaurantName}`}
    >
      {/* Header: restaurant + time */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <p
          className="text-base font-bold text-foreground"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {order.restaurantName}
        </p>
        <span
          className="flex shrink-0 items-center gap-1 text-xs text-foreground/40"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          <Clock size={11} strokeWidth={2} aria-hidden />
          {timeAgo(order.createdAt)}
        </span>
      </div>

      {/* Pickup / dropoff */}
      <div className="mb-3 space-y-2">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
            aria-label="Pickup"
          >
            P
          </span>
          <p
            className="text-sm text-foreground/70 leading-snug"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {order.pickupAddress}
          </p>
        </div>

        {/* Connector line */}
        <div className="ml-[9px] h-4 w-px bg-foreground/12" aria-hidden />

        <div className="flex items-start gap-2.5">
          <MapPin
            size={18}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-foreground/40"
            aria-label="Dropoff"
          />
          <p
            className="text-sm text-foreground/70 leading-snug"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {order.dropoffAddress}
          </p>
        </div>
      </div>

      {/* Footer: items + total */}
      <div
        className="mb-4 flex items-center justify-between border-t border-foreground/6 pt-3"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        <span className="flex items-center gap-1.5 text-sm text-foreground/50">
          <Package size={14} strokeWidth={2} aria-hidden />
          {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
        </span>
        <span className="text-base font-bold tabular-nums text-foreground">
          ${order.total.toFixed(2)}
        </span>
      </div>

      {/* Accept button — full width, tall tap target */}
      <button
        onClick={handleAccept}
        disabled={isPending}
        className={[
          "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
          "bg-primary text-white text-base font-bold",
          "transition-colors hover:bg-primary/90 active:scale-[0.98]",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
          "disabled:opacity-60",
        ].join(" ")}
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        {isPending ? (
          <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />
        ) : null}
        {isPending ? "Accepting…" : "Accept delivery"}
      </button>

      {error && (
        <p
          className="mt-2 text-center text-sm font-medium text-red-600"
          role="alert"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {error}
        </p>
      )}
    </article>
  );
}

// ─── DriverDashboard ──────────────────────────────────────────────────────────

export default function DriverDashboard({
  driverId,
  initialStatus,
  activeOrderId: initialActiveOrderId,
  vehicleType,
}: {
  driverId: string;
  initialStatus: DriverStatus;
  activeOrderId: string | null;
  vehicleType: VehicleType;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<DriverStatus>(initialStatus);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(
    initialActiveOrderId
  );
  const [isTogglingStatus, startToggle] = useTransition();

  const isAvailable = status === "AVAILABLE";
  const hasActiveOrder = activeOrderId !== null;

  // ── Available orders feed ────────────────────────────────────────────────
  // Only enabled when driver is AVAILABLE and has no active order.
  const { data: availableOrders = [], isLoading: isFeedLoading } = useQuery({
    queryKey: ["available-orders"],
    queryFn: () => getAvailableOrders(),
    refetchInterval: 10_000,
    enabled: isAvailable && !hasActiveOrder,
  });

  // ── Status toggle ────────────────────────────────────────────────────────
  function handleToggle(next: DriverStatus) {
    setStatus(next); // optimistic
    startToggle(async () => {
      try {
        await toggleDriverStatus(next);
      } catch {
        setStatus((prev) => (prev === next ? (next === "AVAILABLE" ? "OFFLINE" : "AVAILABLE") : prev));
      }
    });
  }

  // ── After accepting an order ─────────────────────────────────────────────
  function handleAccepted(orderId: string) {
    setActiveOrderId(orderId);
    router.push(`/delivery/driver/orders/${orderId}`);
  }

  return (
    <div className="pb-8">
      {/* Status toggle */}
      <div className="border-b border-foreground/6 bg-white">
        <StatusToggle
          status={status}
          onChange={handleToggle}
          disabled={isTogglingStatus}
        />
      </div>

      {/* Active delivery banner — shown when driver has a claimed order */}
      {hasActiveOrder && (
        <div className="pt-4" role="status" aria-live="polite">
          <ActiveDeliveryBanner orderId={activeOrderId!} />
        </div>
      )}

      {/* Available orders feed */}
      {isAvailable && !hasActiveOrder && (
        <div className="pt-4">
          <p
            className="mb-3 px-4 text-xs font-semibold uppercase tracking-widest text-foreground/40"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Available orders
          </p>

          {isFeedLoading && (
            <div
              aria-label="Loading available orders"
              aria-busy="true"
              className="space-y-3 px-4"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-foreground/6 bg-white p-4"
                  aria-hidden
                >
                  {/* Header row */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="h-4 w-36 rounded-lg bg-foreground/8" />
                    <div className="h-3 w-16 rounded-lg bg-foreground/6" />
                  </div>
                  {/* Pickup / dropoff lines */}
                  <div className="mb-3 space-y-2">
                    <div className="h-3 w-full rounded-lg bg-foreground/6" />
                    <div className="ml-[9px] h-4 w-px bg-foreground/8" />
                    <div className="h-3 w-5/6 rounded-lg bg-foreground/6" />
                  </div>
                  {/* Footer row */}
                  <div className="mb-4 flex items-center justify-between border-t border-foreground/6 pt-3">
                    <div className="h-3 w-20 rounded-lg bg-foreground/6" />
                    <div className="h-4 w-16 rounded-lg bg-foreground/8" />
                  </div>
                  {/* Accept button */}
                  <div className="h-14 w-full rounded-2xl bg-foreground/8" />
                </div>
              ))}
            </div>
          )}

          {!isFeedLoading && availableOrders.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p
                className="text-sm text-foreground/40"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                No orders available right now.
              </p>
              <p
                className="mt-1 text-xs text-foreground/30"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                New orders appear here automatically.
              </p>
            </div>
          )}

          {availableOrders.map((order) => (
            <AvailableOrderCard
              key={order.id}
              order={order}
              onAccepted={handleAccepted}
            />
          ))}
        </div>
      )}

      {/* Offline state */}
      {!isAvailable && !hasActiveOrder && (
        <div className="px-4 py-12 text-center">
          <p
            className="text-sm text-foreground/40"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            You&apos;re offline. Toggle the switch above to start receiving
            orders.
          </p>
        </div>
      )}
    </div>
  );
}
