"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  MapPin,
  Clock,
  Phone,
  Navigation,
  ArrowRight,
  Truck,
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
};

// ── Static spotlight data (TODO: fetch from CMS) ─────────────────────────────
const SPOTLIGHTS: Record<string, {
  number: number;
  restaurantName: string;
  tagline: string;
  location: string;
  cuisine: string;
  deliveryMinutes: string;
  menuSlug: string;
  newPartner: boolean;
  story: { body: string[]; quote: { text: string; attribution: string } };
  dishes: { name: string; desc: string; price: string; gradient: [string, string]; initial: string }[];
  driverNote: string;
  practical: { label: string; value: string; sub: string; icon: "clock" | "pin" | "phone" | "nav" }[];
  closing: string;
}> = {
  "maiko-ramen": {
    number: 7,
    restaurantName: "Maïko Ramen",
    tagline: "Eighteen-hour broth, hidden behind a strip mall, run by one woman who really knows what she's doing.",
    location: "Hazeldean",
    cuisine: "Japanese · Ramen",
    deliveryMinutes: "25–35",
    menuSlug: "maiko-ramen",
    newPartner: true,
    story: {
      body: [
        "Yuki Tanaka opened Maïko in a small unit behind Hazeldean Mall six years ago. There's no sign on the main road. You find it because someone tells you about it, or because you're hungry enough to follow the smell.",
        "The tonkotsu broth simmers for eighteen hours. The noodles are made fresh every morning. Yuki does most of it herself, with help from her son on weekends. She told us she joined Neighbours Club because the other apps were taking too much for someone running a kitchen this small.",
      ],
      quote: {
        text: "I don't want my food to arrive cold to people who waited for it. That's the whole point of ramen.",
        attribution: "— Yuki, on why she signed with Neighbours Club",
      },
    },
    dishes: [
      { name: "Tonkotsu Classic", desc: "The 18-hour broth. The reason this place exists.", price: "$17", gradient: ["#E8B872", "#C9954A"], initial: "T" },
      { name: "Spicy Miso", desc: "Three kinds of miso, fermented chili, soft egg.", price: "$18", gradient: ["#C96B5B", "#8B3E30"], initial: "M" },
      { name: "Vegetable Shoyu", desc: "Underrated. Mushroom dashi base, very clean.", price: "$16", gradient: ["#4A7C59", "#2F5234"], initial: "V" },
    ],
    driverNote: "Pickup is around the back, not the mall side. Yuki seals the broth in a separate container so it doesn't soak the noodles — combine them when it arrives. The first fifty orders ship with handwritten thank-you notes.",
    practical: [
      { label: "Hours today", value: "11:30 AM – 9:00 PM", sub: "Closed Mondays", icon: "clock" },
      { label: "Address", value: "Behind Hazeldean Mall", sub: "Unit 4 · 300 Eagleson Rd", icon: "pin" },
      { label: "Phone", value: "(613) 555-0142", sub: "Yuki picks up directly", icon: "phone" },
      { label: "Distance", value: "1.4 km away", sub: "About 6 min drive", icon: "nav" },
    ],
    closing: "One of the seven new partners we onboarded this month in Kanata.",
  },
};

const ICON_MAP = {
  clock: <Clock size={16} strokeWidth={2} />,
  pin:   <MapPin size={16} strokeWidth={2} />,
  phone: <Phone size={16} strokeWidth={2} />,
  nav:   <Navigation size={16} strokeWidth={2} />,
};

export default function PartnerSpotlightPage() {
  const { slug } = useParams<{ slug: string }>();
  const spotlight = SPOTLIGHTS[slug];

  const [saved, setSaved] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!spotlight) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="mb-4 text-foreground/60">Spotlight not found.</p>
          <Link href="/notes" className="font-semibold text-primary hover:underline">← Back to Notes</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`
        .drop-cap-spotlight::first-letter {
          font-family: Georgia, serif;
          font-size: 62px;
          font-weight: 700;
          font-style: italic;
          float: left;
          line-height: 0.85;
          padding: 6px 10px 0 0;
          color: ${T.primary};
        }
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
        .dish-scroll-x { overflow-x: auto; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .dish-scroll-x::-webkit-scrollbar { display: none; }
        .dish-snap { scroll-snap-align: start; }
      `}</style>

      <main className="relative flex flex-1 flex-col overflow-hidden" style={{ background: T.bg }}>
        {/* ── Reading progress ─────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-50 h-[3px] transition-all duration-100"
          style={{ width: `${scrollProgress}%`, background: T.primary }}
        />

        {/* ── Floating top nav (over hero) ─────────────────────────────── */}
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-4 pt-4">
          <Link
            href="/notes"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: "rgba(26,24,20,0.4)", backdropFilter: "blur(8px)", color: T.bg }}
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </Link>
          <div className="pointer-events-auto flex gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "rgba(26,24,20,0.4)", backdropFilter: "blur(8px)", color: T.bg }}
              aria-label={saved ? "Unsave" : "Save"}
            >
              <Bookmark size={16} fill={saved ? T.bg : "transparent"} strokeWidth={2} />
            </button>
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "rgba(26,24,20,0.4)", backdropFilter: "blur(8px)", color: T.bg }}
              aria-label="Share"
              onClick={() => navigator.share?.({ title: spotlight.restaurantName, url: window.location.href }).catch(() => {})}
            >
              <Share2 size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pb-28">

          {/* ── Hero ──────────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden"
            style={{
              height: 300,
              background: `linear-gradient(180deg, ${T.bgMuted} 0%, ${T.bgWarm} 70%, ${T.bg} 100%)`,
            }}
          >
            {/* Steam wisps */}
            <div
              className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 text-[80px] tracking-[0.4em] opacity-20"
              style={{ fontFamily: "serif", color: T.bg }}
            >
              ︵ ︵
            </div>
            {/* Bowl illustration */}
            <div
              className="absolute -bottom-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full"
              style={{
                background: `radial-gradient(circle at 35% 30%, ${T.primary} 0%, ${T.primaryDark} 60%, #0A3B37 100%)`,
                boxShadow: `inset 0 -30px 60px rgba(0,0,0,0.3), 0 30px 60px -20px ${T.primary}50`,
              }}
            />
            {/* Rim highlight */}
            <div
              className="absolute bottom-[120px] left-1/2 h-2 w-40 -translate-x-1/2 rounded-full opacity-50"
              style={{ background: "white", filter: "blur(4px)" }}
            />
            {spotlight.newPartner && (
              <div
                className="absolute left-6 top-[100px] rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ background: T.primary, color: T.bg, boxShadow: `0 4px 12px -4px ${T.primary}50` }}
              >
                ★ New Partner
              </div>
            )}
          </div>

          {/* ── Title block ───────────────────────────────────────────── */}
          <div className="px-6 pb-5 pt-7">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: T.primary }}>
              Partner Spotlight · No. {String(spotlight.number).padStart(2, "0")}
            </p>
            <h1
              className="mb-3 text-[40px] font-semibold leading-none tracking-tight"
              style={{ fontFamily: "Georgia, serif", color: T.ink }}
            >
              {spotlight.restaurantName.split(" ").map((word, i) =>
                i === spotlight.restaurantName.split(" ").length - 1
                  ? <em key={i}> {word}</em>
                  : <span key={i}>{i > 0 ? " " : ""}{word}</span>
              )}
            </h1>
            <p
              className="mb-4 text-base italic leading-snug"
              style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}
            >
              {spotlight.tagline}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: T.inkSoft }}>
              <span className="flex items-center gap-1.5"><MapPin size={11} strokeWidth={2.2} />{spotlight.location}</span>
              <span className="opacity-40">·</span>
              <span>{spotlight.cuisine}</span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1.5"><Clock size={11} strokeWidth={2.2} />{spotlight.deliveryMinutes} min</span>
            </div>
          </div>

          {/* ── The Story ─────────────────────────────────────────────── */}
          <article className="px-6 pb-4">
            <div className="stamp-label mb-4 inline-block text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
              The Story
            </div>

            {spotlight.story.body.map((para, i) => (
              <p
                key={i}
                className={`mb-3.5 text-[15px] leading-[1.65] ${i === 0 ? "drop-cap-spotlight" : ""}`}
                style={{ color: T.ink }}
              >
                {para}
              </p>
            ))}

            <blockquote style={{ borderLeft: `3px solid ${T.primary}`, paddingLeft: 18, margin: "0 0 8px" }}>
              <p className="mb-2 text-[19px] font-medium italic leading-snug" style={{ fontFamily: "Georgia, serif", color: T.ink }}>
                &ldquo;{spotlight.story.quote.text}&rdquo;
              </p>
              <footer className="text-xs not-italic" style={{ color: T.inkSoft }}>
                {spotlight.story.quote.attribution}
              </footer>
            </blockquote>
          </article>

          <div className="my-5 text-center text-lg tracking-[0.4em]" style={{ fontFamily: "Georgia, serif", color: T.bgMuted }}>· · ·</div>

          {/* ── What to order ─────────────────────────────────────────── */}
          <div className="pb-2">
            <div className="mb-3.5 flex items-baseline justify-between px-6">
              <span className="stamp-label text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
                What to order
              </span>
              <span className="text-[11px] italic" style={{ color: T.inkSoft }}>Picked by Yuki</span>
            </div>

            <div className="dish-scroll-x flex gap-3 px-6">
              {spotlight.dishes.map((dish, i) => (
                <div
                  key={i}
                  className="dish-snap shrink-0 overflow-hidden rounded-2xl shadow-sm"
                  style={{ width: 210, background: "white", border: `1px solid ${T.bgMuted}60` }}
                >
                  <div
                    className="flex h-36 items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${dish.gradient[0]}, ${dish.gradient[1]})` }}
                  >
                    <span
                      className="text-[80px] font-bold italic leading-none opacity-40 text-white"
                      style={{ fontFamily: "Georgia, serif" }}
                    >
                      {dish.initial}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <div className="mb-1 flex items-baseline justify-between">
                      <h3
                        className="text-base font-semibold leading-snug tracking-tight"
                        style={{ fontFamily: "Georgia, serif", color: T.ink }}
                      >
                        {dish.name}
                      </h3>
                      <span
                        className="text-sm font-semibold italic"
                        style={{ fontFamily: "Georgia, serif", color: T.primary }}
                      >
                        {dish.price}
                      </span>
                    </div>
                    <p className="m-0 text-xs leading-snug" style={{ color: T.inkSoft }}>{dish.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="my-5 text-center text-lg tracking-[0.4em]" style={{ fontFamily: "Georgia, serif", color: T.bgMuted }}>· · ·</div>

          {/* ── Driver's note ─────────────────────────────────────────── */}
          <div className="px-6 pb-2">
            <div
              className="relative overflow-hidden rounded-2xl p-5"
              style={{ background: T.ink, color: T.bg }}
            >
              <div
                className="pointer-events-none absolute -right-2 -top-5 text-[140px] font-extrabold italic leading-none opacity-40"
                style={{ fontFamily: "Georgia, serif", color: T.primary }}
              >
                "
              </div>
              <div className="relative">
                <div className="mb-3.5 flex items-center gap-2">
                  <Truck size={13} strokeWidth={2} style={{ color: T.bgWarm }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] opacity-70">
                    A note from the driver
                  </span>
                </div>
                <p className="mb-3.5 text-base font-medium italic leading-relaxed" style={{ fontFamily: "Georgia, serif" }}>
                  {spotlight.driverNote}
                </p>
                <div className="flex items-center gap-2.5 border-t pt-3.5" style={{ borderColor: T.bgWarm + "20" }}>
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold italic"
                    style={{
                      background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                      fontFamily: "Georgia, serif",
                      border: `1.5px solid ${T.bgWarm}30`,
                    }}
                  >
                    D
                  </div>
                  <div>
                    <div className="text-sm font-semibold italic" style={{ fontFamily: "Georgia, serif" }}>The Driver-in-Chief</div>
                    <div className="mt-0.5 text-[10px] opacity-65">12 pickups from Maïko · Kanata</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="my-5 text-center text-lg tracking-[0.4em]" style={{ fontFamily: "Georgia, serif", color: T.bgMuted }}>· · ·</div>

          {/* ── Practical info ────────────────────────────────────────── */}
          <div className="px-6 pb-4">
            <div className="stamp-label mb-4 inline-block text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: T.primary }}>
              Practical
            </div>
            <div
              className="overflow-hidden rounded-2xl"
              style={{ background: "white", border: `1px solid ${T.bgMuted}60` }}
            >
              {spotlight.practical.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                  style={{ borderBottom: i < spotlight.practical.length - 1 ? `1px solid ${T.bgMuted}50` : "none" }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: T.primary }}
                  >
                    {ICON_MAP[row.icon]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: T.inkSoft }}>
                      {row.label}
                    </div>
                    <div
                      className="text-[15px] font-semibold leading-snug"
                      style={{ fontFamily: "Georgia, serif", color: T.ink }}
                    >
                      {row.value}
                    </div>
                    <div className="text-xs" style={{ color: T.inkSoft }}>{row.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Closing ───────────────────────────────────────────────── */}
          <div className="px-6 pb-6 pt-4 text-center">
            <div
              className="mb-3 text-[22px] font-semibold italic tracking-[0.5em]"
              style={{ fontFamily: "Georgia, serif", color: T.bgMuted }}
            >
              ⁂
            </div>
            <p className="mx-auto max-w-xs text-sm italic leading-relaxed opacity-70" style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}>
              {spotlight.closing}
            </p>
          </div>
        </div>

        {/* ── Sticky CTA ───────────────────────────────────────────────── */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-8 pt-3"
          style={{ background: `linear-gradient(to top, ${T.bg} 60%, ${T.bg}00)` }}
        >
          <div className="mx-auto max-w-lg">
            <Link
              href={`/restaurants/${spotlight.menuSlug}`}
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white shadow-xl"
              style={{
                background: T.primary,
                boxShadow: `0 12px 28px -10px ${T.primary}60`,
              }}
            >
              <div>
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75">
                  {spotlight.deliveryMinutes} min
                </div>
                <div className="text-base font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                  Order from {spotlight.restaurantName.split(" ")[0]}
                </div>
              </div>
              <ArrowRight size={22} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
