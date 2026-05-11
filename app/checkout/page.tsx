"use client";

import { useState } from "react";
import Link from "next/link";
import { SERVICE_FEE } from "@/lib/config";
import {
  ChevronLeft,
  MapPin,
  Clock,
  CreditCard,
  Edit3,
  ChevronRight,
  Sparkles,
  Heart,
  Plus,
  MessageSquare,
} from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary:      "#0F766E",
  primaryDark:  "#0A5C56",
  bg:           "#FAF8F3",
  bgWarm:       "#F0EBE0",
  bgMuted:      "#E2D9C8",
  ink:          "#1A1A2E",
  inkSoft:      "#5A5870",
  success:      "#166534",
};

// TODO: replace static cart with real cart state (context / URL params / session)
const MOCK_ITEMS = [
  { name: "Tonkotsu Classic", qty: 1, price: 17, color: "#C9954A" },
  { name: "Spicy Miso",       qty: 1, price: 18, color: "#C96B5B" },
  { name: "Pork Gyoza (5)",   qty: 1, price: 9,  color: "#A8754D" },
];
const RESTAURANT_NAME = "Maïko Ramen";
const RESTAURANT_SLUG = "maiko-ramen";

export default function CheckoutPage() {
  const [tipPct, setTipPct] = useState(18);
  const [customTip, setCustomTip] = useState(false);
  const [customTipAmt, setCustomTipAmt] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  const items = MOCK_ITEMS;
  const subtotal  = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = 2.99;
  const serviceFee  = SERVICE_FEE;
  const tax  = +(subtotal * 0.13).toFixed(2);
  const tip  = customTip
    ? +(parseFloat(customTipAmt || "0")).toFixed(2)
    : +((subtotal * tipPct) / 100).toFixed(2);
  const total = +(subtotal + deliveryFee + serviceFee + tax + tip).toFixed(2);
  const savedOnFees = 3.50;

  return (
    <>
      <style>{`
        .stamp-label {
          position: relative;
          display: inline-block;
        }
        .stamp-label::before {
          content: "";
          position: absolute;
          inset: -3px -7px;
          border: 1.5px solid currentColor;
          border-radius: 2px;
          opacity: 0.22;
          transform: rotate(-1.5deg);
        }
      `}</style>

      <main
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ background: T.bg }}
      >
        {/* ── Sticky header ────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-30 flex items-center gap-3 border-b px-4 py-3"
          style={{
            background: `${T.bg}E6`,
            backdropFilter: "blur(12px)",
            borderColor: T.bgMuted + "60",
          }}
        >
          <Link
            href={`/restaurants/${RESTAURANT_SLUG}`}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ color: T.ink }}
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </Link>
          <div className="min-w-0 flex-1">
            <div
              className="text-xl font-semibold italic leading-tight tracking-tight"
              style={{ fontFamily: "Georgia, serif", color: T.ink }}
            >
              Review your order
            </div>
            <div className="text-xs" style={{ color: T.inkSoft }}>From {RESTAURANT_NAME}</div>
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-32">
          <div className="mx-auto max-w-lg space-y-5 px-4 py-4">

            {/* Delivering to */}
            <div>
              <div className="stamp-label mb-3 ml-1 inline-block text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                Delivering to
              </div>
              <div className="space-y-2.5">
                {/* Address */}
                <div
                  className="flex items-center gap-3 rounded-2xl p-3.5"
                  style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: T.primary }}>
                    <MapPin size={17} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* TODO: load from user profile / address book */}
                    <div className="text-sm font-semibold leading-snug" style={{ fontFamily: "Georgia, serif", color: T.ink }}>
                      Home · 142 Castlefrank Rd
                    </div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>Apt 3B · Buzz code 1142</div>
                  </div>
                  <Edit3 size={15} strokeWidth={2} style={{ color: T.inkSoft, flexShrink: 0 }} />
                </div>

                {/* Time */}
                <div
                  className="flex items-center gap-3 rounded-2xl p-3.5"
                  style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: T.ink }}>
                    <Clock size={17} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold leading-snug" style={{ fontFamily: "Georgia, serif", color: T.ink }}>
                      As soon as possible
                    </div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>Estimated 25–35 min</div>
                  </div>
                  <ChevronRight size={15} strokeWidth={2} style={{ color: T.inkSoft }} />
                </div>
              </div>
            </div>

            {/* Your order */}
            <div>
              <div className="stamp-label mb-3 ml-1 inline-block text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                Your order
              </div>
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                {items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3"
                    style={{ borderBottom: i < items.length - 1 ? `1px solid ${T.bgMuted}50` : "none" }}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl text-lg font-bold italic text-white opacity-85"
                      style={{
                        background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      {item.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold leading-snug" style={{ fontFamily: "Georgia, serif", color: T.ink }}>
                        {item.qty} × {item.name}
                      </div>
                      <button className="text-xs font-semibold" style={{ color: T.primary }}>Edit</button>
                    </div>
                    <span
                      className="text-sm font-semibold italic"
                      style={{ fontFamily: "Georgia, serif", color: T.ink }}
                    >
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}
                <Link
                  href={`/restaurants/${RESTAURANT_SLUG}`}
                  className="flex w-full items-center justify-center gap-1.5 py-3 text-xs font-semibold"
                  style={{
                    borderTop: `1px dashed ${T.bgMuted}`,
                    color: T.primary,
                  }}
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Add more from {RESTAURANT_NAME.split(" ")[0]}
                </Link>
              </div>
            </div>

            {/* Note */}
            <div>
              <div className="stamp-label mb-3 ml-1 inline-block text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                A note for the kitchen & driver
              </div>
              <div
                className="flex items-start gap-2.5 rounded-2xl p-3.5"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                <MessageSquare size={15} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: T.inkSoft }} />
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Allergy notes, gate codes, where to leave it..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: T.ink }}
                />
              </div>
            </div>

            {/* Tip */}
            <div>
              <div className="stamp-label mb-3 ml-1 inline-block text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                Tip your driver
              </div>

              {/* Drivers keep 100% callout */}
              <div
                className="mb-2.5 flex items-center gap-2.5 rounded-2xl p-3.5"
                style={{ background: T.ink, color: T.bgWarm }}
              >
                <Heart size={15} strokeWidth={2.2} fill={T.bgWarm} style={{ flexShrink: 0 }} />
                <p className="m-0 text-xs leading-snug">
                  <strong>Drivers keep 100% of tips.</strong>{" "}
                  <span className="opacity-80">Always. No exceptions.</span>
                </p>
              </div>

              <div
                className="overflow-hidden rounded-2xl p-2"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(4, 1fr) auto" }}>
                  {[15, 18, 20, 25].map((pct) => {
                    const active = !customTip && tipPct === pct;
                    return (
                      <button
                        key={pct}
                        onClick={() => { setTipPct(pct); setCustomTip(false); }}
                        className="flex flex-col items-center rounded-xl py-2.5 transition-all"
                        style={{
                          background: active ? T.primary : "transparent",
                          color: active ? "white" : T.ink,
                        }}
                      >
                        <span className="text-sm font-bold italic leading-none" style={{ fontFamily: "Georgia, serif" }}>
                          {pct}%
                        </span>
                        <span className="mt-0.5 text-[10px] font-medium opacity-70">
                          ${((subtotal * pct) / 100).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCustomTip(true)}
                    className="rounded-xl px-3 py-2.5 text-xs font-semibold transition-all"
                    style={{
                      background: customTip ? T.primary : "transparent",
                      color: customTip ? "white" : T.ink,
                    }}
                  >
                    Other
                  </button>
                </div>
                {customTip && (
                  <input
                    type="number"
                    value={customTipAmt}
                    onChange={(e) => setCustomTipAmt(e.target.value)}
                    placeholder="Custom tip amount ($)"
                    className="mt-2 w-full rounded-xl px-3.5 py-2.5 text-sm outline-none"
                    style={{
                      background: T.bg,
                      border: `1px solid ${T.primary}`,
                      color: T.ink,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Payment */}
            <div>
              <div className="stamp-label mb-3 ml-1 inline-block text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                Payment
              </div>
              {/* TODO: integrate Stripe payment methods from user account */}
              <div
                className="flex items-center gap-3 rounded-2xl p-3.5"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: T.ink }}>
                  <CreditCard size={15} strokeWidth={2.2} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-snug" style={{ fontFamily: "Georgia, serif", color: T.ink }}>
                    Visa · 4242
                  </div>
                  <div className="text-xs" style={{ color: T.inkSoft }}>Default</div>
                </div>
                <ChevronRight size={15} strokeWidth={2} style={{ color: T.inkSoft }} />
              </div>
            </div>

            {/* Order breakdown */}
            <div>
              <div className="stamp-label mb-3 ml-1 inline-block text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                Breakdown
              </div>
              <div
                className="rounded-2xl p-4"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                {[
                  { label: "Subtotal",       value: subtotal.toFixed(2) },
                  { label: "Delivery fee",   value: deliveryFee.toFixed(2) },
                  { label: "Service fee",    value: serviceFee.toFixed(2) },
                  { label: "Tax (HST 13%)",  value: tax.toFixed(2) },
                  { label: "Tip",            value: tip.toFixed(2), highlight: tip > 0 },
                ].map((row, i) => (
                  <div key={i} className="mb-2 flex justify-between">
                    <span className="text-sm" style={{ color: T.inkSoft }}>{row.label}</span>
                    <span
                      className="text-sm"
                      style={{ color: T.ink, fontWeight: row.highlight ? 600 : 500 }}
                    >
                      ${row.value}
                    </span>
                  </div>
                ))}

                <div className="my-3 h-px" style={{ background: T.bgMuted }} />

                <div className="flex items-baseline justify-between">
                  <span
                    className="text-base font-semibold italic"
                    style={{ fontFamily: "Georgia, serif", color: T.ink }}
                  >
                    Total
                  </span>
                  <span
                    className="text-2xl font-bold italic tracking-tight"
                    style={{ fontFamily: "Georgia, serif", color: T.ink }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Savings callout */}
              <div
                className="mt-2.5 flex items-center gap-2.5 rounded-2xl p-3.5 text-white"
                style={{ background: T.success }}
              >
                <Sparkles size={15} strokeWidth={2.2} className="shrink-0" />
                <p className="m-0 text-xs leading-snug">
                  <strong>You saved about ${savedOnFees.toFixed(2)} on fees.</strong>{" "}
                  <span className="opacity-85">Our service fee is the lowest in Ottawa.</span>
                </p>
              </div>
            </div>

            <div className="pb-2 text-center text-xs italic opacity-50" style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}>
              — handled with care —
            </div>
          </div>
        </div>

        {/* ── Sticky place order button ─────────────────────────────────── */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-8 pt-3"
          style={{ background: `linear-gradient(to top, ${T.bg} 70%, ${T.bg}00)` }}
        >
          <div className="mx-auto max-w-lg">
            {/* TODO: wire to real order placement API (Stripe payment intent + restaurant order) */}
            <button
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white shadow-xl"
              style={{
                background: T.primary,
                boxShadow: `0 12px 28px -10px ${T.primary}60`,
              }}
            >
              <span className="text-base font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                Place order
              </span>
              <span className="text-lg font-bold italic" style={{ fontFamily: "Georgia, serif" }}>
                ${total.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
