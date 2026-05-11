"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Newspaper,
  ShoppingBag,
  User,
  MapPin,
  Bell,
  ChevronRight,
  AlertCircle,
  Trash2,
  Construction,
  Bus,
  Bookmark,
  Share2,
} from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary:     "#0F766E",
  primaryDark: "#0A5C56",
  bg:          "#FAF8F3",
  bgWarm:      "#F0EBE0",
  bgMuted:     "#E2D9C8",
  ink:         "#1A1A2E",
  inkSoft:     "#5A5870",
};

interface Event { day: string; date: string; title: string; where: string; tag: string; }
interface CivicAlert { label: string; type: string; }
interface HeadsUpItem { icon: string; label: string; detail: string; meta: string; }

interface Props {
  events: Event[];
  civicAlerts: CivicAlert[];
  headsUp: HeadsUpItem[];
}

const CIVIC_ICONS: Record<string, React.ReactNode> = {
  trash:        <Trash2 size={15} />,
  construction: <Construction size={15} />,
  bus:          <Bus size={15} />,
  alert:        <AlertCircle size={15} />,
};

const TICKER_ICONS: Record<string, React.ReactNode> = {
  waste:        <Trash2 size={11} />,
  construction: <Construction size={11} />,
  transit:      <Bus size={11} />,
  alert:        <AlertCircle size={11} />,
};

export default function NotesFeed({ events, civicAlerts, headsUp }: Props) {
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long", month: "long", day: "numeric",
  });

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-strip { animation: ticker 30s linear infinite; }

        @keyframes cardRise {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .card-rise { animation: cardRise 0.5s ease-out backwards; }

        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.3); }
        }
        .pulse-dot { animation: pulseDot 2s ease-in-out infinite; }

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

      <main className="flex flex-1 flex-col overflow-hidden" style={{ background: T.bg }}>
        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto pb-20">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden px-5 pb-6 pt-6"
            style={{ background: T.primary, color: T.bg }}
          >
            {/* Decorative rings */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-15"
              style={{ border: `1px solid ${T.bg}` }} />
            <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full opacity-10"
              style={{ border: `1px solid ${T.bg}` }} />

            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <MapPin size={13} strokeWidth={2.5} />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] opacity-85">Kanata</span>
                <ChevronRight size={13} className="opacity-60" />
              </div>
              <button aria-label="Notifications">
                <Bell size={18} strokeWidth={2} />
              </button>
            </div>

            <h1
              className="mb-1.5 text-[44px] font-semibold italic leading-none tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Neighbours Notes
            </h1>
            <p className="text-sm opacity-75">{today} · what&apos;s happening on your block</p>
          </div>

          {/* ── Ticker strip ────────────────────────────────────────────── */}
          <div
            className="overflow-hidden py-2.5"
            style={{ background: T.ink, color: T.bgWarm, borderBottom: `1px solid ${T.primaryDark}` }}
          >
            <div className="ticker-strip flex shrink-0 whitespace-nowrap">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex shrink-0 items-center">
                  {civicAlerts.map((alert) => (
                    <span key={alert.label} className="flex items-center gap-2 px-5 text-xs font-semibold uppercase tracking-wider">
                      {TICKER_ICONS[alert.type] ?? <AlertCircle size={11} />}
                      {alert.label}
                      <span className="opacity-30">•</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* ── Feed content ────────────────────────────────────────────── */}
          <div className="space-y-7 px-4 py-5">

            {/* ── Partner Spotlight ─────────────────────────────────────── */}
            <section className="card-rise" style={{ animationDelay: "0.05s" }}>
              <div className="mb-3 flex items-baseline justify-between px-1">
                <span className="stamp-label text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                  Partner Spotlight
                </span>
                <span className="text-[10px]" style={{ color: T.inkSoft }}>01 / 04</span>
              </div>

              <article
                className="overflow-hidden rounded-2xl shadow-sm"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                {/* Illustrated hero */}
                <div
                  className="relative overflow-hidden"
                  style={{
                    height: 180,
                    background: `linear-gradient(135deg, ${T.bgMuted} 0%, ${T.bgWarm} 60%, ${T.bg} 100%)`,
                  }}
                >
                  {/* Abstract bowl illustration */}
                  <div
                    className="absolute -bottom-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 40% 35%, ${T.primary} 0%, ${T.primaryDark} 70%)`,
                      boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.2)",
                      opacity: 0.85,
                    }}
                  />
                  <div
                    className="absolute bottom-8 left-1/2 h-1.5 w-20 -translate-x-1/2 rounded-full opacity-40"
                    style={{ background: "white", filter: "blur(4px)" }}
                  />
                  <div
                    className="absolute left-3 top-3 rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
                    style={{ background: T.primary, color: T.bg }}
                  >
                    New Partner
                  </div>
                </div>

                <div className="p-5">
                  <h2
                    className="mb-2 text-2xl font-semibold leading-tight tracking-tight"
                    style={{ fontFamily: "Georgia, serif", color: T.ink }}
                  >
                    Maïko Ramen joins the{" "}
                    <em>Neighbours family</em>
                  </h2>
                  <p className="mb-4 text-sm leading-relaxed" style={{ color: T.inkSoft }}>
                    Hidden behind Hazeldean Mall, Chef Yuki has been pulling 18-hour tonkotsu
                    broth for six years. Now she&apos;s on Neighbours Club — and the first 50 orders
                    ship with handwritten thank-you notes.
                  </p>

                  <div className="mb-4 flex flex-wrap gap-2">
                    {["Ramen", "Japanese", "Family-owned"].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{ background: T.bgWarm, color: T.ink }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    {/* TODO: wire to real partner menu route */}
                    <Link
                      href="/deals"
                      className="rounded-full px-4 py-2.5 text-sm font-semibold text-white"
                      style={{ background: T.primary }}
                    >
                      Order from Maïko →
                    </Link>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleSave("maiko-spotlight")}
                        aria-label={saved.has("maiko-spotlight") ? "Unsave" : "Save"}
                        style={{ color: saved.has("maiko-spotlight") ? T.primary : T.inkSoft }}
                      >
                        <Bookmark
                          size={18}
                          fill={saved.has("maiko-spotlight") ? T.primary : "transparent"}
                        />
                      </button>
                      <button
                        aria-label="Share"
                        style={{ color: T.inkSoft }}
                        onClick={() => navigator.share?.({ title: "Maïko Ramen on Neighbours Club", url: window.location.href }).catch(() => {})}
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            </section>

            {/* ── Weekly Editorial ──────────────────────────────────────── */}
            <section className="card-rise" style={{ animationDelay: "0.15s" }}>
              <div className="mb-3 flex items-baseline justify-between px-1">
                <span className="stamp-label text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                  This Week in Kanata
                </span>
                <span className="text-[10px]" style={{ color: T.inkSoft }}>Issue №18</span>
              </div>

              <article
                className="relative overflow-hidden rounded-2xl p-6"
                style={{ background: T.ink, color: T.bg }}
              >
                {/* Decorative issue number */}
                <div
                  className="pointer-events-none absolute -right-2 -top-5 text-[180px] font-extrabold italic leading-none opacity-30"
                  style={{ fontFamily: "Georgia, serif", color: T.primary }}
                >
                  18
                </div>

                <div className="relative">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] opacity-60">
                    <span className="pulse-dot inline-block h-2 w-2 rounded-full bg-sky-300" />
                    Posted 2h ago · 4 min read
                  </div>

                  <h2
                    className="mb-3 text-[28px] font-semibold leading-tight tracking-tight"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    Three new patios, one farewell, and the{" "}
                    <em>return</em> of butter chicken poutine.
                  </h2>

                  <p className="mb-5 text-sm leading-relaxed opacity-80">
                    A roundup of what opened, what&apos;s leaving, and what&apos;s cooking on
                    Hazeldean this week — written by Alex, your neighbourhood driver-in-chief.
                  </p>

                  <Link
                    href="/notes/issue-18"
                    className="inline-block rounded-full px-4 py-2.5 text-sm font-semibold"
                    style={{ background: T.bg, color: T.ink }}
                  >
                    Read the issue →
                  </Link>
                </div>
              </article>
            </section>

            {/* ── BIA Events ────────────────────────────────────────────── */}
            <section className="card-rise" style={{ animationDelay: "0.25s" }}>
              <div className="mb-3 flex items-baseline justify-between px-1">
                <span className="stamp-label text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                  Around the Neighbourhood
                </span>
                <span className="text-[10px]" style={{ color: T.inkSoft }}>via Kanata Central BIA</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {events.map((event, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-2xl p-3.5"
                    style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
                  >
                    {/* Date badge */}
                    <div
                      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl"
                      style={{ background: T.bgWarm, border: `1px solid ${T.bgMuted}` }}
                    >
                      <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: T.inkSoft }}>
                        {event.day}
                      </div>
                      <div
                        className="text-2xl font-bold italic leading-none"
                        style={{ fontFamily: "Georgia, serif", color: T.ink }}
                      >
                        {event.date}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3
                        className="mb-0.5 text-base font-semibold leading-snug tracking-tight"
                        style={{ fontFamily: "Georgia, serif", color: T.ink }}
                      >
                        {event.title}
                      </h3>
                      <p className="text-xs" style={{ color: T.inkSoft }}>{event.where}</p>
                    </div>

                    <span
                      className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                      style={{ background: T.primary }}
                    >
                      {event.tag}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Heads Up ──────────────────────────────────────────────── */}
            <section className="card-rise" style={{ animationDelay: "0.35s" }}>
              <div className="mb-3 flex items-baseline justify-between px-1">
                <span className="stamp-label text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                  Heads Up
                </span>
                <span className="text-[10px]" style={{ color: T.inkSoft }}>City of Ottawa · OC Transpo</span>
              </div>

              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
              >
                {headsUp.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      borderBottom: i < headsUp.length - 1 ? `1px solid ${T.bgMuted}50` : "none",
                    }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{ background: T.primary }}
                    >
                      {CIVIC_ICONS[item.icon] ?? <AlertCircle size={15} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold" style={{ color: T.ink }}>{item.label}</div>
                      <div className="text-xs" style={{ color: T.inkSoft }}>{item.detail}</div>
                    </div>
                    <span className="text-right text-[10px] font-medium" style={{ color: T.inkSoft }}>
                      {item.meta}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Footer */}
            <div className="py-4 text-center">
              <p className="text-[10px] leading-relaxed opacity-60" style={{ color: T.inkSoft }}>
                Civic data: City of Ottawa Open Data
                <br />
                Transit: OC Transpo · Events: partners
              </p>
              <div
                className="mt-2.5 text-xs italic opacity-50"
                style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}
              >
                — handled with care —
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom nav ───────────────────────────────────────────────────── */}
        <nav
          className="flex shrink-0 items-center justify-around border-t pb-safe-area-inset-bottom pt-2.5"
          style={{
            background: T.bg,
            borderColor: T.bgMuted,
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
          }}
        >
          {[
            { href: "/",        Icon: Home,       label: "Home"  },
            { href: "/notes",   Icon: Newspaper,  label: "Notes" },
            { href: "/my-deals", Icon: ShoppingBag, label: "Orders" },
            { href: "/account", Icon: User,       label: "You"   },
          ].map(({ href, Icon, label }) => {
            const active = href === "/notes";
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-1 px-4 py-1"
                style={{ color: active ? T.primary : T.inkSoft }}
              >
                {active && (
                  <div
                    className="absolute -top-2.5 h-0.5 w-6 rounded-full"
                    style={{ background: T.primary }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={active ? 2.4 : 1.8}
                  fill={active && label === "Notes" ? T.primary : "transparent"}
                />
                <span className="text-[10px] font-semibold tracking-wide">{label}</span>
              </Link>
            );
          })}
        </nav>
      </main>
    </>
  );
}
