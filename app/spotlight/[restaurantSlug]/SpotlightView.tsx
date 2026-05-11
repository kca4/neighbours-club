"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { SpotlightData } from "@/app/api/spotlight/[restaurantSlug]/route";
import { DRIVER_IN_CHIEF_DELIVERIES } from "@/lib/config";

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  primary:     "#0F766E",
  primaryDark: "#0A5C56",
  bg:          "#FAF8F3",
  bgWarm:      "#E2D9C8",
  bgMuted:     "#C5B99A",
  ink:         "#1A1A2E",
  inkSoft:     "#5A5870",
  accent:      "#F59E0B",
};

interface Props {
  spotlight: SpotlightData;
}

export default function SpotlightView({ spotlight }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist bookmark to localStorage (falls back to nothing for unauthed users)
  // TODO: persist to user account when logged in via PATCH /api/me/saved-notes
  useEffect(() => {
    const key = `spotlight-saved-${spotlight.slug}`;
    setSaved(localStorage.getItem(key) === "1");
  }, [spotlight.slug]);

  const toggleSave = () => {
    const key = `spotlight-saved-${spotlight.slug}`;
    const next = !saved;
    setSaved(next);
    if (next) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: spotlight.name, url });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url).catch(() => {});
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <style>{`
        .spotlight-scroll { overflow-y: auto; scrollbar-width: none; padding-bottom: 100px; }
        .spotlight-scroll::-webkit-scrollbar { display: none; }

        .stamp-label { position: relative; display: inline-block; }
        .stamp-label::before {
          content: "";
          position: absolute;
          inset: -3px -7px;
          border: 1.5px solid currentColor;
          border-radius: 2px;
          opacity: 0.22;
          transform: rotate(-1.5deg);
        }

        .drop-cap::first-letter {
          font-size: 64px;
          font-weight: 700;
          font-style: italic;
          float: left;
          line-height: 0.85;
          padding: 6px 10px 0 0;
          color: ${T.primary};
          font-family: Georgia, serif;
        }

        .dish-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding: 0 24px 8px;
          scrollbar-width: none;
          scroll-snap-type: x mandatory;
        }
        .dish-scroll::-webkit-scrollbar { display: none; }
        .dish-card { scroll-snap-align: start; }

        .rise {
          animation: rise 0.5s ease-out backwards;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="relative min-h-screen"
        style={{ background: `linear-gradient(135deg, ${T.bg} 0%, ${T.bgWarm} 100%)` }}
      >
        {/* Reading progress bar */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: 3,
            background: T.primary,
            width: `${scrollProgress}%`,
            transition: "width 0.1s ease-out",
            zIndex: 60,
          }}
        />

        {/* Top nav (over hero) */}
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            padding: "16px 16px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "rgba(26,26,46,0.4)",
              backdropFilter: "blur(8px)",
              border: "none",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.bg,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSave}
              style={{
                background: "rgba(26,26,46,0.4)",
                backdropFilter: "blur(8px)",
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.bg,
                cursor: "pointer",
              }}
            >
              <Bookmark size={16} fill={saved ? T.bg : "transparent"} strokeWidth={2} />
            </button>
            <button
              onClick={handleShare}
              style={{
                background: "rgba(26,26,46,0.4)",
                backdropFilter: "blur(8px)",
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.bg,
                cursor: "pointer",
              }}
            >
              <Share2 size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="spotlight-scroll" style={{ paddingTop: 0 }}>
          {/* Hero */}
          <div
            style={{
              background: `linear-gradient(180deg, ${T.bgMuted} 0%, ${T.bgWarm} 70%, ${T.bg} 100%)`,
              height: 320,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Steam wisps decoration */}
            <div
              style={{
                position: "absolute",
                top: 100,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 80,
                opacity: 0.2,
                color: T.bg,
                fontFamily: "serif",
                letterSpacing: "0.4em",
              }}
            >
              ︵ ︵
            </div>

            {/* Bowl illustration */}
            <div
              style={{
                position: "absolute",
                bottom: -60,
                left: "50%",
                transform: "translateX(-50%)",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: `radial-gradient(circle at 35% 30%, ${T.accent} 0%, #D97706 60%, #92400E 100%)`,
                boxShadow: "inset 0 -30px 60px rgba(0,0,0,0.3), 0 30px 60px -20px rgba(217,119,6,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 110,
                left: "50%",
                transform: "translateX(-50%)",
                width: 160,
                height: 8,
                background: "rgba(255,255,255,0.5)",
                borderRadius: "50%",
                filter: "blur(4px)",
              }}
            />

            {spotlight.isNewPartner && (
              <div
                style={{
                  position: "absolute",
                  top: 70,
                  left: 24,
                  background: T.primary,
                  color: T.bg,
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  boxShadow: "0 4px 12px -4px rgba(15,118,110,0.4)",
                }}
              >
                ★ New Partner
              </div>
            )}
          </div>

          {/* Title block */}
          <div className="rise" style={{ padding: "28px 24px 20px", animationDelay: "0.05s" }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: T.primary,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Partner Spotlight · No. {String(spotlight.spotlightNumber).padStart(2, "0")}
            </div>

            <h1
              style={{
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 0.98,
                letterSpacing: "-0.025em",
                color: T.ink,
                marginBottom: 12,
                fontFamily: "Georgia, serif",
              }}
            >
              {spotlight.name}
            </h1>

            <p
              style={{
                fontSize: 17,
                fontStyle: "italic",
                lineHeight: 1.4,
                color: T.inkSoft,
                fontWeight: 400,
                marginBottom: 16,
                fontFamily: "Georgia, serif",
              }}
            >
              {spotlight.tagline}
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 12,
                color: T.inkSoft,
                flexWrap: "wrap",
              }}
            >
              <span className="flex items-center gap-1.5">
                <MapPin size={12} strokeWidth={2.2} />
                {spotlight.address}
              </span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{spotlight.cuisine}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={2.2} />
                {spotlight.estimatedMin}
              </span>
            </div>
          </div>

          {/* The Story */}
          <article className="rise" style={{ padding: "12px 24px 8px", animationDelay: "0.1s" }}>
            <div
              className="stamp-label"
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 600,
                color: T.primary,
                marginBottom: 16,
                display: "inline-block",
              }}
            >
              The Story
            </div>

            {spotlight.story.map((para, i) => (
              <p
                key={i}
                className={i === 0 ? "drop-cap" : ""}
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: T.ink,
                  marginBottom: 14,
                }}
              >
                {para}
              </p>
            ))}

            <blockquote
              style={{
                borderLeft: `3px solid ${T.primary}`,
                paddingLeft: 18,
                margin: "0 0 8px",
              }}
            >
              <p
                style={{
                  fontSize: 19,
                  fontStyle: "italic",
                  lineHeight: 1.35,
                  color: T.ink,
                  fontWeight: 500,
                  marginBottom: 8,
                  fontFamily: "Georgia, serif",
                }}
              >
                &ldquo;{spotlight.ownerQuote}&rdquo;
              </p>
              <footer style={{ fontSize: 11, color: T.inkSoft, fontStyle: "normal" }}>
                — {spotlight.ownerName}, on why she signed with Neighbours
              </footer>
            </blockquote>
          </article>

          {/* Divider */}
          <div style={{ margin: "20px 24px", textAlign: "center", color: T.bgMuted, fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: "0.4em" }}>
            · · ·
          </div>

          {/* Signature Dishes */}
          <div className="rise" style={{ animationDelay: "0.15s" }}>
            <div
              style={{
                padding: "0 24px 14px",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <span
                className="stamp-label"
                style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, color: T.primary }}
              >
                What to order
              </span>
              <span style={{ fontSize: 11, color: T.inkSoft, fontStyle: "italic" }}>
                Picked by {spotlight.ownerName.split(" ")[0]}
              </span>
            </div>

            <div className="dish-scroll">
              {spotlight.signatureDishes.map((dish, i) => (
                <div
                  key={i}
                  className="dish-card"
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.bgMuted}50`,
                    borderRadius: 16,
                    width: 220,
                    flexShrink: 0,
                    overflow: "hidden",
                    boxShadow: "0 8px 20px -12px rgba(26,26,46,0.2)",
                  }}
                >
                  <div
                    style={{
                      height: 140,
                      background: `linear-gradient(135deg, ${dish.colorGradient[0]}, ${dish.colorGradient[1]})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 80,
                        fontStyle: "italic",
                        fontWeight: 700,
                        color: T.bg,
                        opacity: 0.4,
                        lineHeight: 1,
                        fontFamily: "Georgia, serif",
                      }}
                    >
                      {dish.initial}
                    </div>
                  </div>
                  <div style={{ padding: "14px 14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <h3
                        style={{ fontSize: 16, fontWeight: 600, color: T.ink, lineHeight: 1.15, fontFamily: "Georgia, serif" }}
                      >
                        {dish.name}
                      </h3>
                      <span
                        style={{ fontSize: 14, fontWeight: 600, color: T.primary, fontStyle: "italic", fontFamily: "Georgia, serif" }}
                      >
                        {dish.price}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.45, margin: 0 }}>
                      {dish.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ margin: "24px 24px 8px", textAlign: "center", color: T.bgMuted, fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: "0.4em" }}>
            · · ·
          </div>

          {/* Driver's Note */}
          <div className="rise" style={{ padding: "12px 24px 8px", animationDelay: "0.2s" }}>
            <div
              style={{
                background: T.ink,
                color: T.bg,
                borderRadius: 18,
                padding: "22px 22px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -20,
                  right: -10,
                  fontSize: 140,
                  fontWeight: 800,
                  fontStyle: "italic",
                  color: T.primary,
                  opacity: 0.5,
                  lineHeight: 1,
                  fontFamily: "Georgia, serif",
                  pointerEvents: "none",
                }}
              >
                &ldquo;
              </div>

              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Truck size={14} strokeWidth={2} style={{ color: "#FFE8D4" }} />
                  <span
                    style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.7, fontWeight: 600 }}
                  >
                    A note from the driver
                  </span>
                </div>

                <p
                  style={{ fontSize: 17, lineHeight: 1.45, fontStyle: "italic", fontWeight: 500, marginBottom: 14, fontFamily: "Georgia, serif" }}
                >
                  {spotlight.driverNote}
                </p>

                <div
                  style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: `1px solid ${T.bgWarm}20` }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.bg,
                      fontFamily: "Georgia, serif",
                      fontStyle: "italic",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    D
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontStyle: "italic", fontWeight: 600, fontFamily: "Georgia, serif" }}>
                      The Driver-in-Chief
                    </div>
                    {/* TODO: replace hardcoded pickup count with real DB count */}
                    <div style={{ fontSize: 10, opacity: 0.65 }}>
                      {spotlight.pickupCount} pickups from {spotlight.name.split(" ")[0]} · Kanata ·{" "}
                      {DRIVER_IN_CHIEF_DELIVERIES} deliveries
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ margin: "24px 24px 8px", textAlign: "center", color: T.bgMuted, fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: "0.4em" }}>
            · · ·
          </div>

          {/* Practical info */}
          <div className="rise" style={{ padding: "12px 24px 8px", animationDelay: "0.25s" }}>
            <div
              className="stamp-label"
              style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, color: T.primary, marginBottom: 16, display: "inline-block" }}
            >
              Practical
            </div>

            <div
              style={{ background: T.bg, borderRadius: 16, border: `1px solid ${T.bgMuted}40`, overflow: "hidden" }}
            >
              {[
                {
                  Icon: Clock,
                  label: spotlight.hours.label,
                  value: spotlight.hours.value,
                  sub: spotlight.hours.sub,
                },
                {
                  Icon: MapPin,
                  label: "Address",
                  value: spotlight.address,
                  sub: spotlight.addressSub,
                },
                {
                  Icon: Phone,
                  label: "Phone",
                  value: spotlight.phone,
                  sub: "Call ahead for large orders",
                },
                {
                  Icon: Navigation,
                  label: "Distance",
                  value: spotlight.distance,
                  sub: spotlight.distanceSub,
                },
              ].map((row, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 16px",
                    borderBottom: i < arr.length - 1 ? `1px solid ${T.bgMuted}30` : "none",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: T.primary,
                      color: T.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <row.Icon size={16} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: T.inkSoft, fontWeight: 600, marginBottom: 2 }}>
                      {row.label}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, lineHeight: 1.2, marginBottom: 1, fontFamily: "Georgia, serif" }}>
                      {row.value}
                    </div>
                    <div style={{ fontSize: 11, color: T.inkSoft }}>{row.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Closing */}
          <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
            <div style={{ fontSize: 22, fontStyle: "italic", fontWeight: 600, color: T.bgMuted, letterSpacing: "0.5em", marginBottom: 12, fontFamily: "Georgia, serif" }}>
              ⁂
            </div>
            <div style={{ fontSize: 13, fontStyle: "italic", color: T.inkSoft, opacity: 0.75, lineHeight: 1.5, maxWidth: 240, margin: "0 auto", fontFamily: "Georgia, serif" }}>
              One of our restaurant partners in Kanata.
            </div>
          </div>

          {/* Spacer for sticky CTA */}
          <div style={{ height: 60 }} />
        </div>

        {/* Sticky Order CTA */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: `linear-gradient(to top, ${T.bg} 60%, ${T.bg}00)`,
            padding: "16px 20px 28px",
            zIndex: 30,
          }}
        >
          <Link
            href={spotlight.menuHref}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              background: T.primary,
              color: T.bg,
              border: "none",
              borderRadius: 16,
              padding: "16px 20px",
              textDecoration: "none",
              boxShadow: "0 12px 28px -10px rgba(15,118,110,0.5)",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.75, fontWeight: 600, marginBottom: 2 }}>
                {spotlight.estimatedMin}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "Georgia, serif" }}>
                Order from {spotlight.name.split(" ")[0]} →
              </div>
            </div>
            <ArrowRight size={22} strokeWidth={2.2} />
          </Link>
        </div>
      </div>
    </>
  );
}
