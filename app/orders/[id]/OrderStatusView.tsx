"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Check,
  Receipt,
  Share2,
  HelpCircle,
  MapPin,
  Clock,
  Package,
} from "lucide-react";
import { OrderStatus, DealStatus } from "@prisma/client";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary:      "#0F766E",
  primaryDark:  "#0A5C56",
  primaryLight: "#CCFBF1",
  bg:           "#FAF8F3",
  bgWarm:       "#F0EBE0",
  bgMuted:      "#E2D9C8",
  ink:          "#1A1A2E",
  inkSoft:      "#5A5870",
  success:      "#166534",
  warning:      "#D97706",
  danger:       "#991B1B",
};

interface OrderData {
  id: string;
  status: OrderStatus;
  quantity: number;
  maxAuthorizedAmount: string;
  finalAmount: string | null;
  createdAt: string;
  pickedUpAt: string | null;
}

interface DealData {
  id: string;
  title: string;
  supplierName: string;
  closesAt: string;
  pickupLocation: string;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  pickupInstructions: string | null;
  status: DealStatus;
  finalPrice: string | null;
}

interface Props {
  order: OrderData;
  deal: DealData;
}

function fmt(n: string | number) {
  return Number(n).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "Closing now";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function OrderStatusView({ order, deal }: Props) {
  const [countdown, setCountdown] = useState("");

  // Update countdown every minute
  useEffect(() => {
    const target =
      order.status === OrderStatus.AUTHORIZED ? deal.closesAt : deal.pickupWindowStart;
    const update = () => setCountdown(timeUntil(target));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [order.status, deal.closesAt, deal.pickupWindowStart]);

  // ── Derive timeline state ────────────────────────────────────────────────
  const isVoidedOrRefunded =
    order.status === OrderStatus.VOIDED ||
    order.status === OrderStatus.REFUNDED ||
    order.status === OrderStatus.NO_SHOW ||
    order.status === OrderStatus.CAPTURE_FAILED;

  const stepIndex = (() => {
    if (order.status === OrderStatus.PICKED_UP) return 3;
    if (order.status === OrderStatus.CAPTURED) return 2;
    if (
      order.status === OrderStatus.AUTHORIZED &&
      (deal.status === DealStatus.CLOSING_SUCCESS ||
        deal.status === DealStatus.FULFILLING ||
        deal.status === DealStatus.COMPLETED)
    )
      return 1;
    return 0; // AUTHORIZED + OPEN
  })();

  const timelineSteps = [
    {
      label: "Joined",
      sub: `Spot reserved on ${formatDate(order.createdAt)}`,
      time: formatDate(order.createdAt),
    },
    {
      label: "Deal closed",
      sub: deal.finalPrice ? `Final price ${fmt(deal.finalPrice)} / unit` : `Closes ${formatDate(deal.closesAt)}`,
      time: formatDate(deal.closesAt),
    },
    {
      label: "Ready for pickup",
      sub: `${deal.pickupLocation} · ${formatTime(deal.pickupWindowStart)}–${formatTime(deal.pickupWindowEnd)}`,
      time: formatDate(deal.pickupWindowStart),
    },
    {
      label: "Picked up",
      sub: order.pickedUpAt ? formatDate(order.pickedUpAt) : "Enjoy!",
      time: order.pickedUpAt ? formatDate(order.pickedUpAt) : "—",
    },
  ];

  // ── Editorial messages per status ────────────────────────────────────────
  const editorial = (() => {
    if (order.status === OrderStatus.PICKED_UP)
      return {
        title: "You've got it.",
        sub: "Thanks for being part of the group. See you on the next one.",
      };
    if (order.status === OrderStatus.CAPTURED)
      return {
        title: "The deal went through.",
        sub: `Head to ${deal.pickupLocation} between ${formatTime(deal.pickupWindowStart)} and ${formatTime(deal.pickupWindowEnd)} on ${formatDate(deal.pickupWindowStart)}.`,
      };
    if (isVoidedOrRefunded)
      return {
        title: "This order didn't go through.",
        sub: "Your payment was not captured. Any hold has been released.",
      };
    return {
      title: `${deal.supplierName} has your spot.`,
      sub: `The deal is live. When enough neighbours join, everyone's payment is captured and you'll get pickup details.`,
    };
  })();

  // ── Countdown card label ─────────────────────────────────────────────────
  const countdownLabel = (() => {
    if (order.status === OrderStatus.PICKED_UP) return "Completed";
    if (order.status === OrderStatus.CAPTURED) return "Pickup from";
    if (isVoidedOrRefunded) return "Cancelled";
    return "Deal closes in";
  })();

  const countdownValue = (() => {
    if (order.status === OrderStatus.PICKED_UP) return "Done";
    if (isVoidedOrRefunded) return "—";
    if (order.status === OrderStatus.CAPTURED)
      return `${formatTime(deal.pickupWindowStart)}`;
    return countdown || "…";
  })();

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        .float-pin { animation: float 3s ease-in-out infinite; }

        @keyframes stepRipple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .step-active-ring::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: ${T.primary};
          opacity: 0.2;
          animation: stepRipple 2s ease-out infinite;
        }
      `}</style>

      <main className="relative flex-1 overflow-auto" style={{ background: T.bg }}>
        {/* ── Top nav ──────────────────────────────────────────────────────── */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-4 pt-4">
          <Link
            href="/my-deals"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
            style={{ background: "rgba(250,248,243,0.9)", backdropFilter: "blur(8px)", color: T.ink }}
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </Link>
          <button
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
            style={{ background: "rgba(250,248,243,0.9)", backdropFilter: "blur(8px)", color: T.ink }}
            aria-label="Help"
          >
            <HelpCircle size={18} strokeWidth={2} />
          </button>
        </div>

        {/* ── Illustrated map area ─────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden"
          style={{
            height: 260,
            background: `linear-gradient(180deg, ${T.bgMuted} 0%, ${T.bgWarm} 100%)`,
          }}
        >
          {/* Street grid */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 390 260"
            preserveAspectRatio="none"
          >
            {[40, 90, 140, 200].map((y, i) => (
              <line key={`h${i}`} x1="0" y1={y} x2="390" y2={y}
                stroke={T.bgMuted} strokeWidth="0.8" opacity="0.7" />
            ))}
            {[60, 140, 220, 310].map((x, i) => (
              <line key={`v${i}`} x1={x} y1="0" x2={x} y2="260"
                stroke={T.bgMuted} strokeWidth="0.8" opacity="0.7" />
            ))}
            {/* Green area */}
            <rect x="220" y="55" width="110" height="75" fill="#9BC48A" opacity="0.3" rx="4" />
          </svg>

          {/* Pickup location pin */}
          <div className="float-pin absolute" style={{ top: 80, left: "50%", transform: "translateX(-50%)" }}>
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-full border-[3px] text-base font-bold italic"
              style={{
                background: T.primary,
                borderColor: T.bg,
                color: T.bg,
                fontFamily: "Georgia, serif",
                boxShadow: `0 4px 12px -2px ${T.primary}50`,
              }}
            >
              <MapPin size={18} strokeWidth={2.2} style={{ color: "white" }} />
            </div>
            <div
              className="mt-1 text-center text-[9px] font-bold tracking-wide"
              style={{ color: T.ink }}
            >
              {deal.pickupLocation}
            </div>
          </div>
        </div>

        {/* ── Countdown / status card — overlaps map ───────────────────────── */}
        <div className="relative z-10 mx-auto max-w-lg px-4" style={{ marginTop: -44 }}>
          <div
            className="relative overflow-hidden rounded-2xl p-5 shadow-xl"
            style={{ background: T.ink, color: T.bg }}
          >
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full opacity-40"
              style={{ border: `1px solid ${T.primary}` }} />
            <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-25"
              style={{ border: `1px solid ${T.primary}` }} />

            <div className="relative">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] opacity-70">
                {!isVoidedOrRefunded && order.status !== OrderStatus.PICKED_UP && (
                  <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full" style={{ background: T.primaryLight }} />
                )}
                {countdownLabel}
              </div>

              <div
                className="mb-1 text-5xl font-bold italic leading-none tracking-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {countdownValue}
              </div>

              {order.status === OrderStatus.AUTHORIZED && (
                <div className="mt-1 text-xs opacity-60">
                  Deal closes {formatDate(deal.closesAt)} · Order #{order.id.slice(-6).toUpperCase()}
                </div>
              )}
              {order.status === OrderStatus.CAPTURED && (
                <div className="mt-1 text-xs opacity-60">
                  {formatDate(deal.pickupWindowStart)} · {deal.pickupAddress}
                </div>
              )}

              {/* Progress bar (for AUTHORIZED, tracks time until close) */}
              {order.status === OrderStatus.AUTHORIZED && (
                <div
                  className="mt-4 h-1 overflow-hidden rounded-full"
                  style={{ background: `${T.bgWarm}30` }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, (1 - (new Date(deal.closesAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)) * 100))}%`,
                      background: T.primaryLight,
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg space-y-4 px-4 py-5">
          {/* ── Editorial message ─────────────────────────────────────────── */}
          <div
            className="relative rounded-2xl p-4"
            style={{
              background: T.bgWarm,
              border: `1px solid ${T.bgMuted}60`,
            }}
          >
            <div
              className="pointer-events-none absolute right-3 top-2 text-5xl italic font-bold leading-none opacity-10"
              style={{ fontFamily: "Georgia, serif", color: T.primary }}
            >
              "
            </div>
            <h2
              className="mb-1 text-lg font-semibold italic leading-snug tracking-tight"
              style={{ fontFamily: "Georgia, serif", color: T.ink }}
            >
              {editorial.title}
            </h2>
            <p className="m-0 text-sm leading-relaxed" style={{ color: T.inkSoft }}>
              {editorial.sub}
            </p>
            {deal.pickupInstructions && order.status === OrderStatus.CAPTURED && (
              <div
                className="mt-3 rounded-xl px-3 py-2.5 text-xs leading-snug"
                style={{ background: T.primary + "15", color: T.primaryDark, borderLeft: `3px solid ${T.primary}` }}
              >
                <strong>Note: </strong>{deal.pickupInstructions}
              </div>
            )}
          </div>

          {/* ── Status timeline ───────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: T.bgWarm,
              border: `1px solid ${T.bgMuted}60`,
            }}
          >
            {timelineSteps.map((step, i) => {
              const completed = i < stepIndex || (isVoidedOrRefunded && i === 0);
              const active = i === stepIndex && !isVoidedOrRefunded;
              const upcoming = i > stepIndex && !isVoidedOrRefunded;
              const isLast = i === timelineSteps.length - 1;

              return (
                <div
                  key={i}
                  className="relative flex gap-3.5"
                  style={{ paddingBottom: isLast ? 0 : 18 }}
                >
                  {/* Connector */}
                  {!isLast && (
                    <div
                      className="absolute bottom-0 left-[11px] top-6 w-0.5"
                      style={{
                        background: completed || active ? T.primary : T.bgMuted,
                      }}
                    />
                  )}

                  {/* Dot */}
                  <div className="relative shrink-0">
                    <div
                      className={active ? "step-active-ring" : ""}
                      style={{
                        position: "relative",
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: completed || active ? T.primary : "transparent",
                        border: upcoming ? `2px solid ${T.bgMuted}` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        zIndex: 2,
                      }}
                    >
                      {completed && <Check size={12} strokeWidth={3} />}
                      {active && (
                        <div className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </div>
                  </div>

                  {/* Text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <span
                        className="text-[15px] font-semibold leading-snug"
                        style={{
                          fontFamily: active ? "Georgia, serif" : undefined,
                          fontStyle: active ? "italic" : undefined,
                          color: upcoming ? T.inkSoft : T.ink,
                        }}
                      >
                        {step.label}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: T.inkSoft }}>
                        {step.time}
                      </span>
                    </div>
                    <div
                      className="mt-0.5 text-xs leading-snug"
                      style={{ color: T.inkSoft, opacity: upcoming ? 0.6 : 1 }}
                    >
                      {step.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Order summary ─────────────────────────────────────────────── */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: T.bgWarm,
              border: `1px solid ${T.bgMuted}60`,
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Package size={14} strokeWidth={2} style={{ color: T.primary }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: T.inkSoft }}>
                Order details
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span style={{ color: T.inkSoft }}>{deal.title}</span>
                <span className="font-semibold" style={{ color: T.ink }}>×{order.quantity}</span>
              </div>
              {order.finalAmount ? (
                <div className="flex justify-between text-sm">
                  <span style={{ color: T.inkSoft }}>Total paid</span>
                  <span className="font-bold" style={{ color: T.primary }}>{fmt(order.finalAmount)}</span>
                </div>
              ) : (
                <div className="flex justify-between text-sm">
                  <span style={{ color: T.inkSoft }}>Max authorised</span>
                  <span className="font-semibold" style={{ color: T.ink }}>{fmt(order.maxAuthorizedAmount)}</span>
                </div>
              )}
              {order.status === OrderStatus.CAPTURED && (
                <div
                  className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: T.primary + "15" }}
                >
                  <Clock size={12} strokeWidth={2} style={{ color: T.primary }} />
                  <span className="text-xs" style={{ color: T.primaryDark }}>
                    Pickup: {formatDate(deal.pickupWindowStart)}, {formatTime(deal.pickupWindowStart)}–{formatTime(deal.pickupWindowEnd)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/orders/${order.id}/receipt`}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              style={{
                background: T.bgWarm,
                border: `1px solid ${T.bgMuted}60`,
                color: T.ink,
              }}
            >
              <Receipt size={14} strokeWidth={2} />
              Receipt
            </Link>
            <button
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
              style={{
                background: T.bgWarm,
                border: `1px solid ${T.bgMuted}60`,
                color: T.ink,
              }}
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: deal.title, url: window.location.href }).catch(() => {});
                }
              }}
            >
              <Share2 size={14} strokeWidth={2} />
              Share
            </button>
          </div>

          {/* Footer mark */}
          <div className="py-4 text-center text-xs italic opacity-40" style={{ color: T.inkSoft, fontFamily: "Georgia, serif" }}>
            — handled with care —
          </div>
        </div>
      </main>
    </>
  );
}
