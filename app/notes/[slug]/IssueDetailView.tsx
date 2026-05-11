"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  Bell,
  Heart,
  Flame,
  ThumbsUp,
  Coffee,
  MapPin,
  Clock,
  ArrowRight,
  ArrowUpRight,
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

interface Story {
  n: string;
  title: string;
  body: string[];
  quote?: { text: string; attribution: string };
  card?: { initial: string; name: string; sub: string; cta: string; gradient: [string, string] };
  bullets?: { n: string; text: string }[];
  dropCap?: boolean;
}

interface Issue {
  number: number;
  headline: string;
  subhead: string;
  publishedAt: string;
  readMinutes: number;
  byline: string;
  toc: { n: string; title: string }[];
  stories: Story[];
  mentionedPartners: string;
  pastIssues: { n: string; title: string; date: string; slug: string }[];
}

export default function IssueDetailView({ issue }: { issue: Issue }) {
  const [saved, setSaved] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
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

  const reactions = [
    { id: "love",   Icon: Heart,    label: "Love" },
    { id: "fire",   Icon: Flame,    label: "Fire" },
    { id: "thanks", Icon: ThumbsUp, label: "Thanks" },
    { id: "cozy",   Icon: Coffee,   label: "Cozy" },
  ];

  return (
    <>
      <style>{`
        .drop-cap-para::first-letter {
          font-family: Georgia, serif;
          font-size: 62px;
          font-weight: 700;
          font-style: italic;
          float: left;
          line-height: 0.85;
          padding: 6px 10px 0 0;
          color: ${T.primary};
        }
        .inline-card-hover { transition: transform 0.2s ease; }
        .inline-card-hover:hover { transform: translateY(-2px); }
        .reaction-active { transform: scale(1.1); }
      `}</style>

      <main className="relative flex flex-1 flex-col overflow-hidden" style={{ background: T.bg }}>
        {/* ── Reading progress bar ─────────────────────────────────────────── */}
        <div
          className="pointer-events-none absolute left-0 top-0 z-50 h-[3px] transition-all duration-100"
          style={{ width: `${scrollProgress}%`, background: T.primary }}
        />

        {/* ── Sticky header ────────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
          style={{
            background: `${T.bg}E6`,
            backdropFilter: "blur(12px)",
            borderBottom: `1px solid ${T.bgMuted}60`,
          }}
        >
          <Link
            href="/notes"
            className="flex items-center gap-1 text-sm font-medium"
            style={{ color: T.ink }}
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
            Notes
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSaved(!saved)}
              aria-label={saved ? "Unsave" : "Save"}
              style={{ color: saved ? T.primary : T.ink }}
            >
              <Bookmark size={18} strokeWidth={2} fill={saved ? T.primary : "transparent"} />
            </button>
            <button
              aria-label="Share"
              style={{ color: T.ink }}
              onClick={() => navigator.share?.({ title: issue.headline, url: window.location.href }).catch(() => {})}
            >
              <Share2 size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ───────────────────────────────────────────────── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <div
            className="relative overflow-hidden px-6 pb-10 pt-8"
            style={{ background: T.ink, color: T.bg }}
          >
            {/* Big issue number watermark */}
            <div
              className="pointer-events-none absolute -right-7 top-7 font-extrabold italic leading-none tracking-tighter opacity-40"
              style={{
                fontSize: 240,
                fontFamily: "Georgia, serif",
                color: T.primary,
                lineHeight: 0.85,
              }}
            >
              {issue.number}
            </div>

            <div className="relative">
              <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] opacity-70">
                Neighbours Notes · Issue {issue.number}
              </div>

              <h1
                className="mb-4 text-4xl font-semibold leading-[1.02] tracking-tight"
                style={{ fontFamily: "Georgia, serif" }}
              >
                {issue.headline.split("return").map((part, i) =>
                  i === 0 ? (
                    <span key={i}>{part}<em className="opacity-80">return</em></span>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </h1>

              <div className="mb-5 flex flex-wrap items-center gap-3 text-xs opacity-75">
                <span className="flex items-center gap-1.5">
                  <MapPin size={11} strokeWidth={2.2} />Kanata
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={11} strokeWidth={2.2} />{issue.readMinutes} min
                </span>
                <span className="opacity-40">·</span>
                <span>{issue.publishedAt}</span>
              </div>

              {/* Byline */}
              <div
                className="flex items-center gap-3 border-t pt-4"
                style={{ borderColor: `${T.bgMuted}40` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold italic"
                  style={{
                    background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                    fontFamily: "Georgia, serif",
                    border: `1.5px solid ${T.bgMuted}40`,
                  }}
                >
                  D
                </div>
                <div>
                  <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] opacity-55">Written by</div>
                  <div className="text-sm font-semibold italic" style={{ fontFamily: "Georgia, serif" }}>
                    {issue.byline}
                  </div>
                  <div className="mt-0.5 text-[11px] opacity-65">Driving Kanata · 1,200+ deliveries</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Table of contents ─────────────────────────────────────────── */}
          <div className="px-6 pb-2 pt-7">
            <div
              className="mb-3.5 inline-block text-[10px] font-semibold uppercase tracking-[0.25em]"
              style={{ color: T.primary }}
            >
              In this issue
            </div>
            <div className="flex flex-col gap-0.5">
              {issue.toc.map((item, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-3 py-2"
                  style={{ borderBottom: i < issue.toc.length - 1 ? `1px solid ${T.bgMuted}50` : "none" }}
                >
                  <span
                    className="min-w-[22px] text-sm font-semibold italic opacity-65"
                    style={{ fontFamily: "Georgia, serif", color: T.primary }}
                  >
                    {item.n}
                  </span>
                  <span className="text-sm font-medium" style={{ color: T.ink }}>{item.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Stories ───────────────────────────────────────────────────── */}
          {issue.stories.map((story, si) => (
            <div key={si}>
              <article className="px-6 pb-2 pt-8">
                <div
                  className="mb-1 text-[56px] font-semibold italic leading-none"
                  style={{ fontFamily: "Georgia, serif", color: T.bgMuted }}
                >
                  {story.n}
                </div>
                <h2
                  className="mb-3.5 text-2xl font-semibold leading-tight tracking-tight"
                  style={{ fontFamily: "Georgia, serif", color: T.ink }}
                >
                  {story.title}
                </h2>

                {story.body.map((para, pi) => (
                  <p
                    key={pi}
                    className={`mb-3.5 text-[15px] leading-[1.65] ${pi === 0 && story.dropCap ? "drop-cap-para" : ""}`}
                    style={{ color: T.ink }}
                  >
                    {para}
                  </p>
                ))}

                {story.quote && (
                  <blockquote
                    className="mb-4"
                    style={{ borderLeft: `3px solid ${T.primary}`, paddingLeft: 18 }}
                  >
                    <p
                      className="text-lg font-medium italic leading-snug"
                      style={{ fontFamily: "Georgia, serif", color: T.ink }}
                    >
                      &ldquo;{story.quote.text}&rdquo;
                    </p>
                    <footer className="mt-2 text-xs not-italic" style={{ color: T.inkSoft }}>
                      {story.quote.attribution}
                    </footer>
                  </blockquote>
                )}

                {story.card && (
                  <div
                    className="inline-card-hover mb-4 flex items-center gap-3 rounded-2xl p-3.5 shadow-sm"
                    style={{
                      background: "white",
                      border: `1px solid ${T.bgMuted}80`,
                    }}
                  >
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold italic text-white"
                      style={{
                        background: `linear-gradient(135deg, ${story.card.gradient[0]}, ${story.card.gradient[1]})`,
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      {story.card.initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: T.primary }}
                      >
                        {story.card.cta}
                      </div>
                      <div
                        className="text-base font-semibold leading-snug"
                        style={{ fontFamily: "Georgia, serif", color: T.ink }}
                      >
                        {story.card.name}
                      </div>
                      <div className="text-xs" style={{ color: T.inkSoft }}>{story.card.sub}</div>
                    </div>
                    <ArrowUpRight size={18} strokeWidth={2} style={{ color: T.primary, flexShrink: 0 }} />
                  </div>
                )}

                {story.bullets && (
                  <div className="flex flex-col gap-3.5">
                    {story.bullets.map((b, bi) => (
                      <div key={bi} className="flex items-baseline gap-3">
                        <span
                          className="min-w-[20px] text-sm font-semibold italic"
                          style={{ fontFamily: "Georgia, serif", color: T.primary }}
                        >
                          {b.n}
                        </span>
                        <p className="m-0 text-sm leading-relaxed" style={{ color: T.ink }}>
                          {b.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              {/* Divider between stories */}
              {si < issue.stories.length - 1 && (
                <div
                  className="my-2 text-center text-lg tracking-[0.4em]"
                  style={{ fontFamily: "Georgia, serif", color: T.bgMuted }}
                >
                  · · ·
                </div>
              )}
            </div>
          ))}

          {/* ── End mark ──────────────────────────────────────────────────── */}
          <div className="px-6 pb-2 pt-8 text-center" style={{ color: T.bgMuted }}>
            <div
              className="text-2xl font-semibold italic tracking-[0.5em]"
              style={{ fontFamily: "Georgia, serif" }}
            >
              ⁂
            </div>
            <div className="mt-2 text-xs italic opacity-70" style={{ color: T.inkSoft }}>
              — The Driver-in-Chief, Kanata
            </div>
          </div>

          {/* ── Primary CTA ───────────────────────────────────────────────── */}
          <div className="px-4 pt-4">
            {/* TODO: wire to real partner deal pages */}
            <Link
              href="/deals"
              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-white shadow-lg"
              style={{
                background: T.primary,
                boxShadow: `0 8px 24px -12px ${T.primary}60`,
              }}
            >
              <div>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-75">
                  Mentioned in this issue
                </div>
                <div className="text-base font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
                  {issue.mentionedPartners}
                </div>
              </div>
              <ArrowRight size={22} strokeWidth={2.2} />
            </Link>
          </div>

          {/* ── Reactions ─────────────────────────────────────────────────── */}
          <div className="px-6 pt-6">
            <div
              className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: T.inkSoft }}
            >
              How was this issue?
            </div>
            <div className="flex justify-center gap-2.5">
              {reactions.map(({ id, Icon, label }) => {
                const active = reaction === id;
                return (
                  <button
                    key={id}
                    onClick={() => setReaction(active ? null : id)}
                    className={active ? "reaction-active" : ""}
                    style={{
                      background: active ? T.primary : "white",
                      color: active ? "white" : T.ink,
                      border: `1px solid ${active ? T.primary : T.bgMuted}`,
                      borderRadius: 999,
                      padding: "9px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                      boxShadow: active ? `0 4px 12px -6px ${T.primary}50` : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Icon size={14} strokeWidth={2} fill={active ? "white" : "transparent"} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Subscribe block ───────────────────────────────────────────── */}
          <div className="px-4 pt-7">
            <div
              className="relative overflow-hidden rounded-2xl p-5"
              style={{ background: T.ink, color: T.bg }}
            >
              <div className="pointer-events-none absolute -right-7 -top-7 h-28 w-28 rounded-full opacity-30"
                style={{ border: `1px solid ${T.primary}` }} />
              <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-18"
                style={{ border: `1px solid ${T.primary}` }} />

              <div className="relative">
                <Bell size={20} strokeWidth={2} className="mb-2.5" style={{ color: T.bgWarm }} />
                <h3
                  className="mb-1.5 text-xl font-semibold leading-snug tracking-tight"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Get next week&apos;s issue
                </h3>
                <p className="mb-3.5 text-sm leading-relaxed opacity-75">
                  Notes drops every Monday morning, 6 AM. We&apos;ll ping you.
                </p>
                {/* TODO: wire subscribe action to user account / email preference */}
                <button
                  onClick={() => setSubscribed(!subscribed)}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold transition-all"
                  style={{
                    background: subscribed ? "transparent" : T.bg,
                    color: subscribed ? T.bg : T.ink,
                    border: subscribed ? `1.5px solid ${T.bg}` : "none",
                  }}
                >
                  {subscribed ? "✓ Subscribed" : "Notify me Monday"}
                </button>
              </div>
            </div>
          </div>

          {/* ── Past issues ───────────────────────────────────────────────── */}
          <div className="px-4 pt-7">
            <div className="mb-3.5 flex items-baseline justify-between">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.25em]"
                style={{ color: T.primary }}
              >
                Past issues
              </span>
              <Link href="/notes" className="text-xs font-medium" style={{ color: T.inkSoft }}>
                See archive →
              </Link>
            </div>

            <div className="flex flex-col gap-2.5">
              {issue.pastIssues.map((past) => (
                <Link
                  key={past.slug}
                  href={`/notes/${past.slug}`}
                  className="flex items-center gap-3.5 rounded-2xl px-3.5 py-3"
                  style={{
                    background: "white",
                    border: `1px solid ${T.bgMuted}60`,
                  }}
                >
                  <div
                    className="min-w-[36px] text-2xl font-bold italic leading-none opacity-40"
                    style={{ fontFamily: "Georgia, serif", color: T.primary }}
                  >
                    {past.n}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="text-sm font-semibold leading-snug"
                      style={{ fontFamily: "Georgia, serif", color: T.ink }}
                    >
                      {past.title}
                    </div>
                    <div className="mt-0.5 text-xs" style={{ color: T.inkSoft }}>{past.date}</div>
                  </div>
                  <ArrowUpRight size={14} strokeWidth={2} style={{ color: T.inkSoft, flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="py-10 text-center text-xs italic opacity-50" style={{ color: T.inkSoft, fontFamily: "Georgia, serif" }}>
            — handled with care —
          </div>
        </div>
      </main>
    </>
  );
}
