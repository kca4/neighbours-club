"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Package,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Store,
  FileText,
  Camera,
  X,
} from "lucide-react";
import type { DeliveryOrderStatus } from "@prisma/client";
import {
  markPickedUp,
  markDelivered,
  type TripOrder,
} from "./actions/tripActions";

// ─── Status helpers ───────────────────────────────────────────────────────────

type Phase = "heading_to_pickup" | "waiting_for_order" | "ready_for_pickup" | "in_transit" | "delivered";

function getPhase(status: DeliveryOrderStatus): Phase {
  if (status === "DELIVERED") return "delivered";
  if (status === "PICKED_UP") return "in_transit";
  if (status === "READY") return "ready_for_pickup";
  if (status === "COOKING") return "waiting_for_order";
  // ACCEPTED (and any unexpected states)
  return "heading_to_pickup";
}

const PHASE_LABEL: Record<Phase, string> = {
  heading_to_pickup: "Head to restaurant",
  waiting_for_order: "Waiting for order",
  ready_for_pickup: "Order ready — confirm pickup",
  in_transit: "En route to customer",
  delivered: "Delivery complete",
};

const PHASE_COLOR: Record<Phase, string> = {
  heading_to_pickup: "text-amber-600 bg-amber-50 border-amber-200",
  waiting_for_order: "text-blue-600 bg-blue-50 border-blue-200",
  ready_for_pickup: "text-primary bg-primary/8 border-primary/20",
  in_transit: "text-primary bg-primary/8 border-primary/20",
  delivered: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const PROGRESS_STEPS: Phase[] = [
  "heading_to_pickup",
  "waiting_for_order",
  "ready_for_pickup",
  "in_transit",
  "delivered",
];

// ─── ProgressBar ─────────────────────────────────────────────────────────────

function ProgressBar({ phase }: { phase: Phase }) {
  const currentIdx = PROGRESS_STEPS.indexOf(phase);

  return (
    <div className="flex items-center px-6 py-4">
      {PROGRESS_STEPS.map((step, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step} className="flex flex-1 items-center">
            <div
              className={[
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                isComplete
                  ? "border-primary bg-primary text-white"
                  : isCurrent
                  ? "border-primary bg-white text-primary"
                  : "border-foreground/20 bg-white text-foreground/30",
              ].join(" ")}
            >
              {isComplete ? (
                <CheckCircle2 size={14} strokeWidth={2.5} aria-hidden />
              ) : (
                i + 1
              )}
            </div>
            {i < PROGRESS_STEPS.length - 1 && (
              <div
                className={[
                  "h-0.5 flex-1 transition-colors",
                  isComplete ? "bg-primary" : "bg-foreground/12",
                ].join(" ")}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── AddressBlock ─────────────────────────────────────────────────────────────

function AddressBlock({
  icon,
  label,
  name,
  address,
  note,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  address: string;
  note?: string | null;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        highlight
          ? "border-primary/25 bg-primary/5"
          : "border-foreground/8 bg-white",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={[
            "flex h-7 w-7 items-center justify-center rounded-lg",
            highlight
              ? "bg-primary/12 text-primary"
              : "bg-foreground/6 text-foreground/50",
          ].join(" ")}
        >
          {icon}
        </span>
        <p
          className="text-xs font-semibold uppercase tracking-widest text-foreground/40"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {label}
        </p>
      </div>
      <p
        className="text-sm font-semibold text-foreground"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        {name}
      </p>
      <p
        className="mt-0.5 text-sm text-foreground/60"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        {address}
      </p>
      {note && (
        <p
          className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          {note}
        </p>
      )}
    </div>
  );
}

// ─── ItemsList ────────────────────────────────────────────────────────────────

function ItemsList({ items }: { items: TripOrder["items"] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-foreground/8 bg-white">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-2xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Package
            size={15}
            strokeWidth={2}
            className="text-foreground/40"
            aria-hidden
          />
          {items.reduce((s, i) => s + i.quantity, 0)} items in order
        </div>
        <ChevronRight
          size={16}
          strokeWidth={2}
          className={[
            "text-foreground/30 transition-transform",
            open ? "rotate-90" : "",
          ].join(" ")}
          aria-hidden
        />
      </button>

      {open && (
        <div className="space-y-1.5 border-t border-foreground/6 px-4 pb-3 pt-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              <span className="text-sm text-foreground/70">
                <span className="font-semibold text-foreground">
                  {item.quantity}×
                </span>{" "}
                {item.name}
              </span>
              <span className="text-sm tabular-nums text-foreground/50">
                ${(item.price * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PinInput ─────────────────────────────────────────────────────────────────
// Four individual digit boxes that auto-advance and support backspace.

function PinInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const inputRefs = [ref0, ref1, ref2, ref3];

  // Always produce a 4-element array — padEnd("") can't pad, so use indexed access.
  const digits = Array.from({ length: 4 }, (_, i) => value[i] ?? "");

  function handleChange(idx: number, char: string) {
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === idx ? digit : d)).join("");
    onChange(next);
    if (digit && idx < 3) {
      inputRefs[idx + 1].current?.focus();
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus();
      const next = digits.map((d, i) => (i === idx - 1 ? "" : d)).join("");
      onChange(next);
    }
  }

  return (
    <div className="flex justify-center gap-3">
      {([0, 1, 2, 3] as const).map((idx) => (
        <input
          key={idx}
          ref={inputRefs[idx]}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[idx]}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          aria-label={`PIN digit ${idx + 1}`}
          className={[
            "h-14 w-14 rounded-2xl border-2 text-center text-xl font-bold tabular-nums",
            "focus:outline-none focus:ring-4 focus:ring-primary/30",
            "transition-colors",
            digits[idx] && digits[idx] !== " "
              ? "border-primary bg-primary/5 text-primary"
              : "border-foreground/20 bg-white text-foreground",
            "disabled:opacity-60",
          ].join(" ")}
          style={{ fontFamily: "var(--font-inter-tight)" }}
        />
      ))}
    </div>
  );
}

// ─── PhotoCapture ─────────────────────────────────────────────────────────────

function PhotoCapture({
  photoDataUri,
  onChange,
  disabled,
}: {
  photoDataUri: string | null;
  onChange: (dataUri: string | null) => void;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") onChange(result);
    };
    reader.readAsDataURL(file);
  }

  if (photoDataUri) {
    return (
      <div className="relative overflow-hidden rounded-2xl border-2 border-primary/25">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoDataUri}
          alt="Delivery photo proof"
          className="h-48 w-full object-cover"
        />
        <button
          type="button"
          onClick={() => onChange(null)}
          disabled={disabled}
          aria-label="Remove photo"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={14} strokeWidth={2.5} aria-hidden />
        </button>
        <div
          className="absolute bottom-0 left-0 right-0 bg-black/40 px-3 py-1.5 text-center text-xs font-semibold text-white"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        >
          Photo added
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={disabled}
      className={[
        "flex h-32 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed",
        "border-foreground/20 bg-white text-foreground/50",
        "transition-colors hover:border-primary/40 hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        "disabled:opacity-60",
      ].join(" ")}
    >
      <Camera size={28} strokeWidth={1.5} aria-hidden />
      <span
        className="text-sm font-semibold"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        Take delivery photo
      </span>
      <span
        className="text-xs text-foreground/40"
        style={{ fontFamily: "var(--font-inter-tight)" }}
      >
        Required to complete delivery
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFile}
        aria-hidden
        tabIndex={-1}
      />
    </button>
  );
}

// ─── ActiveTripView ───────────────────────────────────────────────────────────

export default function ActiveTripView({ order }: { order: TripOrder }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // PIN state (for READY → PICKED_UP)
  const [pin, setPin] = useState("");

  // Photo state (for PICKED_UP → DELIVERED)
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);

  const phase = getPhase(order.status);
  const isDelivered = phase === "delivered";
  const isInTransit = phase === "in_transit";
  const isReadyForPickup = phase === "ready_for_pickup";
  const isWaitingForKitchen =
    phase === "heading_to_pickup" || phase === "waiting_for_order";

  const pinComplete = !order.hasPinRequired || pin.length === 4;
  const canConfirmPickup = isReadyForPickup && pinComplete;
  const canConfirmDelivery = isInTransit && photoDataUri !== null;

  function handlePickedUp() {
    setError(null);
    startTransition(async () => {
      const result = await markPickedUp(order.id, pin);
      if (!result.success) {
        setError(result.error ?? "Could not confirm pickup.");
        return;
      }
      router.refresh();
    });
  }

  function handleDelivered() {
    if (!photoDataUri) {
      setError("Please take a delivery photo first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await markDelivered(order.id, photoDataUri);
      if (!result.success) {
        setError(result.error ?? "Could not confirm delivery.");
        return;
      }
      router.push("/delivery/driver");
    });
  }

  return (
    <div className="pb-44">
      {/* Status badge + progress */}
      <div className="border-b border-foreground/6 bg-white">
        <div className="px-4 pt-4">
          <span
            aria-live="polite"
            aria-atomic="true"
            className={[
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
              PHASE_COLOR[phase],
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {PHASE_LABEL[phase]}
          </span>
          <p
            className="mt-1 text-xs text-foreground/40"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Order #{order.id.slice(-6).toUpperCase()}
          </p>
        </div>
        <ProgressBar phase={phase} />
      </div>

      <div className="space-y-3 px-4 pt-4">
        {/* Pickup address */}
        <AddressBlock
          icon={<Store size={15} strokeWidth={2} />}
          label="Pickup"
          name={order.restaurantName}
          address={order.pickupAddress}
          highlight={isWaitingForKitchen || isReadyForPickup}
        />

        {/* Dropoff address */}
        <AddressBlock
          icon={<MapPin size={15} strokeWidth={2} />}
          label="Dropoff"
          name={order.customerName}
          address={order.dropoffAddress}
          note={order.dropoffInstructions}
          highlight={isInTransit}
        />

        {/* Customer note */}
        {order.driverNote && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <FileText
              size={15}
              strokeWidth={2}
              className="mt-0.5 shrink-0 text-amber-600"
              aria-hidden
            />
            <p
              className="text-sm text-amber-800"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              <span className="font-semibold">Customer note: </span>
              {order.driverNote}
            </p>
          </div>
        )}

        {/* Items */}
        <ItemsList items={order.items} />

        {/* Totals */}
        <div className="space-y-1.5 rounded-2xl border border-foreground/8 bg-white px-4 py-3">
          {[
            { label: "Subtotal", value: order.subtotal },
            { label: "Delivery fee", value: order.deliveryFee },
            { label: "Tip", value: order.tip },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex justify-between"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              <span className="text-sm text-foreground/50">{label}</span>
              <span className="text-sm tabular-nums text-foreground/50">
                ${value.toFixed(2)}
              </span>
            </div>
          ))}
          <div
            className="flex justify-between border-t border-foreground/8 pt-1.5"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              ${order.total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-foreground/8 bg-white px-4 pb-safe pt-4">
        {error && (
          <p
            className="mb-3 text-center text-sm font-medium text-red-600"
            role="alert"
            aria-live="assertive"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            {error}
          </p>
        )}

        {/* ACCEPTED / COOKING — waiting for kitchen */}
        {isWaitingForKitchen && (
          <button
            disabled
            className={[
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
              "bg-foreground/8 text-foreground/40 text-base font-bold",
              "cursor-not-allowed",
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />
            Waiting for kitchen to finish
          </button>
        )}

        {/* READY — PIN entry + confirm pickup */}
        {isReadyForPickup && (
          <div className="space-y-4">
            {order.hasPinRequired && (
              <div>
                <p
                  className="mb-3 text-center text-sm font-semibold text-foreground"
                  style={{ fontFamily: "var(--font-inter-tight)" }}
                >
                  Enter the 4-digit PIN from the kitchen
                </p>
                <PinInput
                  value={pin}
                  onChange={setPin}
                  disabled={isPending}
                />
              </div>
            )}
            <button
              onClick={handlePickedUp}
              disabled={isPending || !canConfirmPickup}
              className={[
                "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
                "bg-primary text-white text-base font-bold",
                "transition-colors hover:bg-primary/90 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              {isPending ? (
                <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />
              ) : (
                <Package size={18} strokeWidth={2} aria-hidden />
              )}
              {isPending ? "Confirming…" : "Confirm pickup"}
            </button>
          </div>
        )}

        {/* PICKED_UP — photo capture + confirm delivery */}
        {isInTransit && (
          <div className="space-y-3">
            <PhotoCapture
              photoDataUri={photoDataUri}
              onChange={setPhotoDataUri}
              disabled={isPending}
            />
            <button
              onClick={handleDelivered}
              disabled={isPending || !canConfirmDelivery}
              className={[
                "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
                "bg-primary text-white text-base font-bold",
                "transition-colors hover:bg-primary/90 active:scale-[0.98]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              {isPending ? (
                <Loader2 size={18} strokeWidth={2} className="animate-spin" aria-hidden />
              ) : (
                <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
              )}
              {isPending ? "Confirming…" : "Confirm delivery"}
            </button>
          </div>
        )}

        {/* DELIVERED */}
        {isDelivered && (
          <button
            onClick={() => router.push("/delivery/driver")}
            className={[
              "flex h-14 w-full items-center justify-center gap-2 rounded-2xl",
              "bg-emerald-600 text-white text-base font-bold",
              "transition-colors hover:bg-emerald-700",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30",
            ].join(" ")}
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            <CheckCircle2 size={18} strokeWidth={2} aria-hidden />
            Back to dashboard
          </button>
        )}
      </div>
    </div>
  );
}
