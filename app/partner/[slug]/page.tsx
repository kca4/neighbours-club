"use client";

import { useState, useEffect, useRef } from "react";
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
  Star,
} from "lucide-react";
import Link from "next/link";

// ── Brand tokens — project palette ───────────────────────────────────────────
const royalBlue    = "#0F766E";   // teal primary  (spec: royalBlue #1E3A8A)
const royalBlueDeep = "#0A5C56"; // teal dark      (spec: royalBlueDeep #152B66)
const kraft        = "#E2D9C8";   // bg muted       (spec: kraft #E8DCC4)
const kraftLight   = "#FAF8F3";  // page bg        (spec: kraftLight #F5EFE0)
const kraftDark    = "#C5B99A";  // muted border   (spec: kraftDark #C9B896)
const ink          = "#1A1A2E";  // primary text   (spec: ink #1A1814)
const inkSoft      = "#5A5870";  // muted text     (spec: inkSoft #5C5448)
const accent       = "#F59E0B";  // amber accent   (spec: terracotta #D4622E)
const broth        = "#B8780B";  // warm amber dark (spec: broth #A8451B)

export default function PartnerSpotlightPage() {
  const [saved, setSaved]                   = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${kraftLight} 0%, ${kraft} 100%)`,
        fontFamily: "'Fraunces', 'Georgia', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter+Tight:wght@400;500;600;700&display=swap');

        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-body    { font-family: 'Inter Tight', system-ui, sans-serif; }

        .phone-frame {
          width: 390px; height: 844px;
          background: ${ink}; border-radius: 48px; padding: 12px;
          box-shadow: 0 50px 100px -20px rgba(26,24,20,0.4), 0 30px 60px -30px rgba(26,24,20,0.5), inset 0 0 0 2px rgba(255,255,255,0.08);
          position: relative;
        }
        .phone-screen { width: 100%; height: 100%; background: ${kraftLight}; border-radius: 36px; overflow: hidden; position: relative; }
        .phone-notch { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 120px; height: 32px; background: ${ink}; border-radius: 20px; z-index: 50; }

        .scroll-container { height: 100%; overflow-y: auto; scrollbar-width: none; padding-bottom: 100px; }
        .scroll-container::-webkit-scrollbar { display: none; }

        .grain::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 3px 3px; pointer-events: none; opacity: 0.6; z-index: 1; }

        .stamp { position: relative; display: inline-block; }
        .stamp::before { content: ""; position: absolute; inset: -4px -8px; border: 1.5px solid currentColor; border-radius: 2px; opacity: 0.25; transform: rotate(-1.5deg); }

        .drop-cap::first-letter { font-family: 'Fraunces', serif; font-size: 64px; font-weight: 700; font-style: italic; float: left; line-height: 0.85; padding: 6px 10px 0 0; color: ${royalBlue}; }

        .rise { animation: rise 0.5s ease-out backwards; }
        @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .progress-bar { position: absolute; top: 0; left: 0; height: 3px; background: ${royalBlue}; transition: width 0.1s ease-out; z-index: 60; }

        .dish-scroll { display: flex; gap: 12px; overflow-x: auto; padding: 0 24px 8px; scrollbar-width: none; scroll-snap-type: x mandatory; }
        .dish-scroll::-webkit-scrollbar { display: none; }
        .dish-card { scroll-snap-align: start; }

        .sticky-cta { position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, ${kraftLight} 60%, ${kraftLight}00); padding: 16px 20px 28px; z-index: 30; }
      `}</style>

      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen grain">
          <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />

          {/* Top nav */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 40, padding: "52px 16px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Link href="/restaurants" style={{ background: "rgba(26,24,20,0.4)", backdropFilter: "blur(8px)", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: kraftLight, cursor: "pointer", textDecoration: "none" }}>
              <ChevronLeft size={20} strokeWidth={2.2} />
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => setSaved(!saved)} style={{ background: "rgba(26,24,20,0.4)", backdropFilter: "blur(8px)", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: kraftLight, cursor: "pointer" }}>
                <Bookmark size={16} fill={saved ? kraftLight : "transparent"} strokeWidth={2} />
              </button>
              <button style={{ background: "rgba(26,24,20,0.4)", backdropFilter: "blur(8px)", border: "none", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: kraftLight, cursor: "pointer" }}>
                <Share2 size={16} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="scroll-container">
            {/* Hero */}
            <div style={{ background: `linear-gradient(180deg, ${kraftDark} 0%, ${kraft} 70%, ${kraftLight} 100%)`, height: 320, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 100, left: "50%", transform: "translateX(-50%)", fontSize: 80, opacity: 0.25, color: kraftLight, fontFamily: "serif", letterSpacing: "0.4em" }}>︵ ︵</div>
              <div style={{ position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)", width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, ${accent} 0%, ${broth} 60%, #6B2A0F 100%)`, boxShadow: "inset 0 -30px 60px rgba(0,0,0,0.3), 0 30px 60px -20px rgba(168,69,27,0.4)" }} />
              <div style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", width: 160, height: 8, background: "rgba(255,255,255,0.5)", borderRadius: "50%", filter: "blur(4px)" }} />
              <div style={{ position: "absolute", top: 100, left: 24, background: royalBlue, color: kraftLight, padding: "6px 12px", borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Inter Tight', sans-serif", boxShadow: "0 4px 12px -4px rgba(30,58,138,0.4)" }}>
                ★ New Partner
              </div>
            </div>

            {/* Title block */}
            <div className="rise" style={{ padding: "28px 24px 20px", position: "relative", animationDelay: "0.05s" }}>
              <div className="font-body" style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: royalBlue, fontWeight: 700, marginBottom: 10 }}>
                Partner Spotlight · No. 07
              </div>
              <h1 className="font-display" style={{ fontSize: 40, fontWeight: 600, lineHeight: 0.98, letterSpacing: "-0.025em", color: ink, marginBottom: 12 }}>
                Maïko <span style={{ fontStyle: "italic" }}>Ramen</span>
              </h1>
              <p className="font-display" style={{ fontSize: 17, fontStyle: "italic", lineHeight: 1.4, color: inkSoft, fontWeight: 400, marginBottom: 16 }}>
                Eighteen-hour broth, hidden behind a strip mall, run by one woman who really knows what she&apos;s doing.
              </p>
              <div className="font-body" style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: inkSoft, flexWrap: "wrap" }}>
                <span className="flex items-center gap-1.5"><MapPin size={12} strokeWidth={2.2} /> Hazeldean</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>Japanese · Ramen</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span className="flex items-center gap-1.5"><Clock size={12} strokeWidth={2.2} /> 25–35 min</span>
              </div>
            </div>

            {/* The Story */}
            <article className="rise" style={{ padding: "12px 24px 8px", animationDelay: "0.1s" }}>
              <div className="font-body stamp" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, color: royalBlue, marginBottom: 16, display: "inline-block" }}>
                The Story
              </div>
              <p className="font-body drop-cap" style={{ fontSize: 15, lineHeight: 1.65, color: ink, marginBottom: 14 }}>
                Yuki Tanaka opened Maïko in a small unit behind Hazeldean Mall six years ago. There&apos;s no sign on the main road. You find it because someone tells you about it, or because you&apos;re hungry enough to follow the smell.
              </p>
              <p className="font-body" style={{ fontSize: 15, lineHeight: 1.65, color: ink, marginBottom: 18 }}>
                The tonkotsu broth simmers for eighteen hours. The noodles are made fresh every morning. Yuki does most of it herself, with help from her son on weekends. She told us she joined Neighbors because the other apps were taking too much for someone running a kitchen this small.
              </p>
              <blockquote style={{ borderLeft: `3px solid ${royalBlue}`, paddingLeft: 18, margin: "0 0 8px" }}>
                <p className="font-display" style={{ fontSize: 19, fontStyle: "italic", lineHeight: 1.35, color: ink, fontWeight: 500, marginBottom: 8 }}>
                  &ldquo;I don&apos;t want my food to arrive cold to people who waited for it. That&apos;s the whole point of ramen.&rdquo;
                </p>
                <footer className="font-body" style={{ fontSize: 11, color: inkSoft, fontStyle: "normal" }}>
                  — Yuki, on why she signed with Neighbors
                </footer>
              </blockquote>
            </article>

            <div style={{ margin: "20px 24px", textAlign: "center", color: kraftDark, fontFamily: "'Fraunces', serif", fontSize: 18, letterSpacing: "0.4em" }}>· · ·</div>

            {/* What to order */}
            <div className="rise" style={{ animationDelay: "0.15s" }}>
              <div style={{ padding: "0 24px 14px", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span className="font-body stamp" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, color: royalBlue }}>What to order</span>
                <span className="font-body" style={{ fontSize: 11, color: inkSoft, fontStyle: "italic" }}>Picked by Yuki</span>
              </div>
              <div className="dish-scroll">
                {[
                  { name: "Tonkotsu Classic", desc: "The 18-hour broth. The reason this place exists.", price: "$17", color: `linear-gradient(135deg, #E8B872, #C9954A)`, initial: "T" },
                  { name: "Spicy Miso",       desc: "Three kinds of miso, fermented chili, soft egg.",   price: "$18", color: `linear-gradient(135deg, ${accent}, ${broth})`, initial: "M" },
                  { name: "Vegetable Shoyu",  desc: "Underrated. Mushroom dashi base, very clean.",      price: "$16", color: `linear-gradient(135deg, #4A7C59, #2F5234)`,   initial: "V" },
                ].map((dish, i) => (
                  <div key={i} className="dish-card" style={{ background: kraftLight, border: `1px solid ${kraftDark}50`, borderRadius: 16, width: 220, flexShrink: 0, overflow: "hidden", boxShadow: "0 8px 20px -12px rgba(26,24,20,0.2)" }}>
                    <div style={{ height: 140, background: dish.color, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div className="font-display" style={{ fontSize: 80, fontStyle: "italic", fontWeight: 700, color: kraftLight, opacity: 0.4, lineHeight: 1 }}>{dish.initial}</div>
                    </div>
                    <div style={{ padding: "14px 14px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                        <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, color: ink, lineHeight: 1.15, letterSpacing: "-0.005em" }}>{dish.name}</h3>
                        <span className="font-display" style={{ fontSize: 14, fontWeight: 600, color: royalBlue, fontStyle: "italic" }}>{dish.price}</span>
                      </div>
                      <p className="font-body" style={{ fontSize: 12, color: inkSoft, lineHeight: 1.45, margin: 0 }}>{dish.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ margin: "24px 24px 8px", textAlign: "center", color: kraftDark, fontFamily: "'Fraunces', serif", fontSize: 18, letterSpacing: "0.4em" }}>· · ·</div>

            {/* Driver's note */}
            <div className="rise" style={{ padding: "12px 24px 8px", animationDelay: "0.2s" }}>
              <div style={{ background: ink, color: kraftLight, borderRadius: 18, padding: "22px 22px 24px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -20, right: -10, fontSize: 140, fontWeight: 800, fontStyle: "italic", color: royalBlue, opacity: 0.5, lineHeight: 1, fontFamily: "'Fraunces', serif", pointerEvents: "none" }}>&ldquo;</div>
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <Truck size={14} strokeWidth={2} style={{ color: "#FFE8D4" }} />
                    <span className="font-body" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.7, fontWeight: 600 }}>A note from the driver</span>
                  </div>
                  <p className="font-display" style={{ fontSize: 17, lineHeight: 1.45, fontStyle: "italic", fontWeight: 500, marginBottom: 14 }}>
                    Pickup is around the back, not the mall side. Yuki seals the broth in a separate container so it doesn&apos;t soak the noodles — combine them when it arrives. The first fifty orders ship with handwritten thank-you notes.
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: `1px solid ${kraft}20` }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${royalBlue}, ${royalBlueDeep})`, display: "flex", alignItems: "center", justifyContent: "center", color: kraftLight, fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 700, fontSize: 14, border: `1.5px solid ${kraft}30` }}>D</div>
                    <div>
                      <div className="font-display" style={{ fontSize: 13, fontStyle: "italic", fontWeight: 600 }}>The Driver-in-Chief</div>
                      <div className="font-body" style={{ fontSize: 10, opacity: 0.65 }}>12 pickups from Maïko · Kanata</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ margin: "24px 24px 8px", textAlign: "center", color: kraftDark, fontFamily: "'Fraunces', serif", fontSize: 18, letterSpacing: "0.4em" }}>· · ·</div>

            {/* Practical info */}
            <div className="rise" style={{ padding: "12px 24px 8px", animationDelay: "0.25s" }}>
              <div className="font-body stamp" style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, color: royalBlue, marginBottom: 16, display: "inline-block" }}>Practical</div>
              <div style={{ background: kraftLight, borderRadius: 16, border: `1px solid ${kraftDark}40`, overflow: "hidden" }}>
                {[
                  { icon: <Clock size={16} strokeWidth={2} />,       label: "Hours today", value: "11:30 AM – 9:00 PM",  sub: "Closed Mondays" },
                  { icon: <MapPin size={16} strokeWidth={2} />,      label: "Address",     value: "Behind Hazeldean Mall", sub: "Unit 4 · 300 Eagleson Rd" },
                  { icon: <Phone size={16} strokeWidth={2} />,       label: "Phone",       value: "(613) 555-0142",      sub: "Yuki picks up directly" },
                  { icon: <Navigation size={16} strokeWidth={2} />,  label: "Distance",    value: "1.4 km away",         sub: "About 6 min drive" },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${kraftDark}30` : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: royalBlue, color: kraftLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{row.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-body" style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: inkSoft, fontWeight: 600, marginBottom: 2 }}>{row.label}</div>
                      <div className="font-display" style={{ fontSize: 15, fontWeight: 600, color: ink, lineHeight: 1.2, marginBottom: 1 }}>{row.value}</div>
                      <div className="font-body" style={{ fontSize: 11, color: inkSoft }}>{row.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing */}
            <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
              <div className="font-display" style={{ fontSize: 22, fontStyle: "italic", fontWeight: 600, color: kraftDark, letterSpacing: "0.5em", marginBottom: 12 }}>⁂</div>
              <div className="font-display" style={{ fontSize: 13, fontStyle: "italic", color: inkSoft, opacity: 0.75, lineHeight: 1.5, maxWidth: 240, margin: "0 auto" }}>
                One of the seven new partners we onboarded this month in Kanata.
              </div>
            </div>
            <div style={{ height: 60 }} />
          </div>

          {/* Sticky CTA */}
          <div className="sticky-cta">
            <Link href={`/restaurants/maiko-ramen`} style={{ width: "100%", background: royalBlue, color: kraftLight, border: "none", borderRadius: 16, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)", textDecoration: "none" }}>
              <div style={{ textAlign: "left" }}>
                <div className="font-body" style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.75, fontWeight: 600, marginBottom: 2 }}>25–35 min</div>
                <div className="font-display" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.005em" }}>Order from Maïko</div>
              </div>
              <ArrowRight size={22} strokeWidth={2.2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
