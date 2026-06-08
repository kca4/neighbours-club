"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  MapPin,
  Truck,
  Car,
  AlertTriangle,
  X,
  CheckCircle,
  Loader2,
  PackageCheck,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";
import type { ActiveOrder } from "./actions/getActiveOrders";
import {
  acceptOrder,
  rejectOrder,
  startCooking,
  markReady,
  cancelOrder,
  devSetOrderStatus,
} from "./actions/orderActions";

// ─── Status display config ────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  PENDING: {
    label: "New order",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
  },
  ACCEPTED: {
    label: "Accepted",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
  },
  AWAITING_COURIER: {
    label: "Awaiting courier",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
  },
  COURIER_ASSIGNED: {
    label: "Courier assigned",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  COOKING: {
    label: "Cooking",
    badge: "bg-teal-100 text-teal-800 border-teal-200",
  },
  READY: {
    label: "Ready",
    badge: "bg-green-100 text-green-800 border-green-200",
  },
};

const CANCEL_PRESETS = ["Out of stock", "Kitchen slammed", "Closing early"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string): string {
  const secs = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

// ─── Button primitives ────────────────────────────────────────────────────────

function PrimaryBtn({
  onClick,
  disabled,
  loading,
  children,
  className = "",
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        "disabled:opacity-50",
        className,
      ].join(" ")}
      style={{ fontFamily: "var(--font-inter-tight)" }}
    >
      {loading && <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

// ─── Cancel dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  order,
  onClose,
}: {
  order: ActiveOrder;
  onClose: () => void;
}) {
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customText, setCustomText] = useState("");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { activeRestaurantId } = useDashboard();
  const dialogRef = useRef<HTMLDivElement>(null);

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Helper — query focusable children each time (list changes when textarea appears)
    function getFocusable() {
      return Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    }

    // Move focus into the dialog
    getFocusable()[0]?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const isCustom = selectedPreset === "__custom__";
  const effectiveReason = isCustom ? customText.trim() : selectedPreset;
  const canConfirm = effectiveReason.length > 0 && !isPending;

  function handleConfirm() {
    if (!canConfirm) return;
    startTransition(async () => {
      await cancelOrder(order.id, effectiveReason);
      await queryClient.invalidateQueries({
        queryKey: ["active-orders", activeRestaurantId],
      });
      onClose();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
    >
      <div ref={dialogRef} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="cancel-dialog-title"
              className="text-lg font-bold italic text-foreground"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Cancel order?
            </h2>
            <p
              className="text-xs text-foreground/45"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              #{order.id.slice(-6).toUpperCase()} · ${order.total.toFixed(2)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-foreground/6 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
          <AlertTriangle
            size={14}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-red-500"
            aria-hidden
          />
          <p
            className="text-xs leading-relaxed text-red-700"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            This order has already been accepted. Food work may have started.
            Cancelling will trigger a refund and flag this for admin review.
          </p>
        </div>

        {/* Reason picker */}
        <p
          className="mb-2 text-xs font-semibold text-foreground/70"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Reason for cancellation
        </p>

        <div className="flex flex-wrap gap-2">
          {CANCEL_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedPreset(preset)}
              className={[
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
                selectedPreset === preset
                  ? "border-primary bg-primary/8 text-primary"
                  : "border-foreground/12 text-foreground/60 hover:border-foreground/25",
              ].join(" ")}
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              {preset}
            </button>
          ))}
          <button
            onClick={() => setSelectedPreset("__custom__")}
            className={[
              "rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors",
              isCustom
                ? "border-primary bg-primary/8 text-primary"
                : "border-foreground/12 text-foreground/60 hover:border-foreground/25",
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Other…
          </button>
        </div>

        {isCustom && (
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Describe the issue…"
            rows={3}
            className="mt-3 w-full resize-none rounded-xl border border-foreground/15 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ fontFamily: "var(--font-inter-tight)" }}
            autoFocus
          />
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 rounded-xl border border-foreground/15 py-2.5 text-sm font-semibold text-foreground/70 transition-colors hover:border-foreground/25 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Go back
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {isPending && (
              <Loader2 size={14} strokeWidth={2} className="animate-spin" aria-hidden />
            )}
            {isPending ? "Cancelling…" : "Confirm cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dev controls ─────────────────────────────────────────────────────────────
// Only rendered when process.env.NODE_ENV === "development".
// Webpack tree-shakes this entirely from production bundles.

const DEV_STATUSES = [
  { label: "→ AWAITING_COURIER", status: "AWAITING_COURIER" },
  { label: "→ COURIER_ASSIGNED", status: "COURIER_ASSIGNED" },
  { label: "→ ACCEPTED", status: "ACCEPTED" },
  { label: "→ PENDING", status: "PENDING" },
] as const;

function DevControls({
  order,
  onMutate,
}: {
  order: ActiveOrder;
  onMutate: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  const { activeRestaurantId } = useDashboard();

  function handleDevSet(status: string) {
    startTransition(async () => {
      await devSetOrderStatus(order.id, status);
      await queryClient.invalidateQueries({
        queryKey: ["active-orders", activeRestaurantId],
      });
      onMutate();
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-orange-300 bg-orange-50 px-3 py-2.5">
      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-wider text-orange-500"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        Dev controls
      </p>
      <div className="flex flex-wrap gap-1.5">
        {DEV_STATUSES.map(({ label, status }) => (
          <button
            key={status}
            onClick={() => handleDevSet(status)}
            disabled={isPending || order.status === status}
            className="rounded-lg border border-orange-300 bg-white px-2 py-1 text-[11px] font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-40"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── OrderCard ────────────────────────────────────────────────────────────────

export default function OrderCard({
  order,
  isNew,
}: {
  order: ActiveOrder;
  isNew: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { activeRestaurantId } = useDashboard();

  const status = STATUS_CONFIG[order.status] ?? {
    label: order.status,
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  };

  // ── Generic action runner ────────────────────────────────────────────────
  function run(action: () => Promise<void>) {
    startTransition(async () => {
      try {
        await action();
        await queryClient.invalidateQueries({
          queryKey: ["active-orders", activeRestaurantId],
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Something went wrong.";
        setActionError(msg);
        setTimeout(() => setActionError(null), 4_000);
      }
    });
  }

  // ── Derived flags ────────────────────────────────────────────────────────
  const isUber = order.fulfillmentType === "UBER_DIRECT";
  const isAwaitingCourier = order.status === "AWAITING_COURIER";
  const isCourierAssigned = order.status === "COURIER_ASSIGNED";

  // "Start Cooking" is enabled only when ACCEPTED+INTERNAL or COURIER_ASSIGNED
  const canCook =
    (order.status === "ACCEPTED" && !isUber) || isCourierAssigned;

  // Emergency cancel: available on any post-PENDING active status
  const canEmergencyCancel = new Set([
    "ACCEPTED",
    "AWAITING_COURIER",
    "COURIER_ASSIGNED",
    "COOKING",
    "READY",
  ]).has(order.status);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <>
      <article
        className={[
          "rounded-2xl border bg-white p-4 shadow-sm",
          "transition-all duration-700",
          isNew
            ? "border-amber-400 bg-amber-50/60 ring-2 ring-amber-300/50"
            : "border-foreground/8",
        ].join(" ")}
        aria-label={`Order ${order.id.slice(-6).toUpperCase()}`}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-sm font-bold tabular-nums text-foreground"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              #{order.id.slice(-6).toUpperCase()}
            </p>
            <p
              className="mt-0.5 flex items-center gap-1 text-xs text-foreground/40"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              <Clock size={11} strokeWidth={2} aria-hidden />
              {timeAgo(order.createdAt)}
            </p>
          </div>

          <span
            className={[
              "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
              status.badge,
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {status.label}
          </span>
        </div>

        {/* ── Items ───────────────────────────────────────────────────── */}
        <ul className="mb-3 space-y-1.5">
          {order.items.map((item, i) => (
            <li
              key={i}
              className="flex items-baseline justify-between gap-2"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold tabular-nums text-primary">
                  ×{item.quantity}
                </span>
                <span className="truncate text-sm text-foreground">
                  {item.name}
                </span>
              </span>
              {item.redeemedWithCP ? (
                /* CP redemption line — show "Secret Menu · X CP" rather than
                   the misleading "$0.00" that price:0 would otherwise display */
                <span className="shrink-0 text-xs font-medium text-amber-600 tabular-nums">
                  Secret Menu · {(item.cpCost ?? 0).toLocaleString()} CP
                </span>
              ) : (
                <span className="shrink-0 text-xs tabular-nums text-foreground/45">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              )}
            </li>
          ))}
        </ul>

        {/* ── Footer row: address + fulfillment + total ────────────────── */}
        <div className="flex items-center justify-between gap-2 border-t border-foreground/6 pt-2.5">
          <div
            className="flex min-w-0 items-center gap-1.5 text-xs text-foreground/45"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            <MapPin size={11} strokeWidth={2} className="shrink-0" aria-hidden />
            <span className="truncate">{order.deliveryAddress.street}</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* "Paid with CP" tag — shown instead of fulfillment type for
                CP-only orders so staff know no fiat reconciliation is needed */}
            {order.items.some((i) => i.redeemedWithCP) ? (
              <span
                className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Paid with CP
              </span>
            ) : isUber ? (
              <span
                className="flex items-center gap-1 text-xs font-medium text-purple-700"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                <Truck size={11} strokeWidth={2} aria-hidden />
                Uber Direct
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-xs font-medium text-foreground/40"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                <Car size={11} strokeWidth={2} aria-hidden />
                Internal
              </span>
            )}
            <span
              className="text-sm font-bold tabular-nums text-foreground"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ── Courier status indicator ─────────────────────────────────── */}
        {isAwaitingCourier && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
            {/* Pulsing amber dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
            </span>
            <p
              className="text-xs font-medium text-amber-800"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Searching for Uber courier — do not start cooking yet
            </p>
          </div>
        )}

        {/* Internal driver PIN — shown for ACCEPTED / COOKING / READY when an
            internal driver has claimed the order and a PIN has been generated */}
        {!isUber &&
          ["ACCEPTED", "COOKING", "READY"].includes(order.status) &&
          order.pickupPin && (
            <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
              <CheckCircle
                size={14}
                strokeWidth={2}
                className="shrink-0 text-primary"
                aria-hidden
              />
              <p
                className="text-xs font-medium text-teal-800"
                style={{ fontFamily: "var(--font-inter-tight)" }}
              >
                Driver PIN:{" "}
                <span className="text-sm font-bold tracking-widest">
                  {order.pickupPin}
                </span>
              </p>
            </div>
          )}

        {isCourierAssigned && (
          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
            <CheckCircle
              size={14}
              strokeWidth={2}
              className="shrink-0 text-primary"
              aria-hidden
            />
            <p
              className="text-xs font-medium text-teal-800"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              Uber driver assigned
              {order.pickupPin && (
                <>
                  {" · "}
                  PIN:{" "}
                  <span className="text-sm font-bold tracking-widest">
                    {order.pickupPin}
                  </span>
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Driver note ──────────────────────────────────────────────── */}
        {order.driverNote && (
          <p
            className="mt-2.5 rounded-xl bg-foreground/4 px-3 py-2 text-xs italic text-foreground/55"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            &ldquo;{order.driverNote}&rdquo;
          </p>
        )}

        {/* ── Dev controls (development only) ─────────────────────────── */}
        {isDev && (
          <DevControls order={order} onMutate={() => setActionError(null)} />
        )}

        {/* ── Action row ───────────────────────────────────────────────── */}
        <div className="mt-3.5 flex gap-2.5">
          {/* ── PENDING: Accept + Reject ─── */}
          {order.status === "PENDING" && (
            <>
              <PrimaryBtn
                onClick={() => run(() => rejectOrder(order.id))}
                loading={isPending}
                disabled={isPending}
                className="border border-red-200 bg-white text-red-600 hover:bg-red-50"
              >
                Reject
              </PrimaryBtn>
              <PrimaryBtn
                onClick={() => run(() => acceptOrder(order.id))}
                loading={isPending}
                disabled={isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Accept
              </PrimaryBtn>
            </>
          )}

          {/* ── ACCEPTED (Internal): Start Cooking ─── */}
          {order.status === "ACCEPTED" && !isUber && (
            <>
              <PrimaryBtn
                onClick={() => run(() => startCooking(order.id))}
                loading={isPending}
                disabled={isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Start Cooking
              </PrimaryBtn>
              {canEmergencyCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-xs font-medium text-foreground/50 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                  title="Cancel order"
                >
                  <AlertTriangle size={12} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              )}
            </>
          )}

          {/* ── ACCEPTED (Uber Direct): Start Cooking disabled ─── */}
          {order.status === "ACCEPTED" && isUber && (
            <>
              <PrimaryBtn
                onClick={() => {}}
                disabled
                className="border border-foreground/10 bg-foreground/5 text-foreground/35 cursor-not-allowed"
              >
                Start Cooking
              </PrimaryBtn>
              {canEmergencyCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-xs font-medium text-foreground/50 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <AlertTriangle size={12} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              )}
            </>
          )}

          {/* ── AWAITING_COURIER: Start Cooking disabled ─── */}
          {order.status === "AWAITING_COURIER" && (
            <>
              <PrimaryBtn
                onClick={() => {}}
                disabled
                className="border border-foreground/10 bg-foreground/5 text-foreground/35 cursor-not-allowed"
              >
                Start Cooking
              </PrimaryBtn>
              {canEmergencyCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-xs font-medium text-foreground/50 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <AlertTriangle size={12} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              )}
            </>
          )}

          {/* ── COURIER_ASSIGNED: Start Cooking enabled ─── */}
          {order.status === "COURIER_ASSIGNED" && (
            <>
              <PrimaryBtn
                onClick={() => run(() => startCooking(order.id))}
                loading={isPending}
                disabled={isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Start Cooking
              </PrimaryBtn>
              {canEmergencyCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-xs font-medium text-foreground/50 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <AlertTriangle size={12} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              )}
            </>
          )}

          {/* ── COOKING: Mark Ready ─── */}
          {order.status === "COOKING" && (
            <>
              <PrimaryBtn
                onClick={() => run(() => markReady(order.id))}
                loading={isPending}
                disabled={isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Mark Ready
              </PrimaryBtn>
              {canEmergencyCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-xs font-medium text-foreground/50 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <AlertTriangle size={12} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              )}
            </>
          )}

          {/* ── READY: Awaiting pickup + emergency cancel ─── */}
          {order.status === "READY" && (
            <>
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-2.5">
                <PackageCheck
                  size={14}
                  strokeWidth={2}
                  className="text-green-600"
                  aria-hidden
                />
                <span
                  className="text-sm font-semibold text-green-700"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  Awaiting pickup
                </span>
              </div>
              {canEmergencyCancel && (
                <button
                  onClick={() => setShowCancel(true)}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded-xl border border-foreground/12 px-3 text-xs font-medium text-foreground/50 transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  <AlertTriangle size={12} strokeWidth={2} aria-hidden />
                  Cancel
                </button>
              )}
            </>
          )}
        </div>

        {/* ── Inline error ─────────────────────────────────────────────── */}
        {actionError && (
          <p
            className="mt-2.5 text-xs font-medium text-red-600"
            role="alert"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {actionError}
          </p>
        )}
      </article>

      {/* ── Cancel dialog (fixed overlay) ───────────────────────────────── */}
      {showCancel && (
        <CancelDialog order={order} onClose={() => setShowCancel(false)} />
      )}
    </>
  );
}
