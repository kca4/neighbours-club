"use client";

import { useState } from "react";
import {
  ChefHat,
  TrendingUp,
  MessageSquare,
  Settings,
  Wifi,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Edit3,
  Heart,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

// ── Brand tokens ──────────────────────────────────────────────────────────────
const royalBlue    = "#0F766E";   // teal primary
const royalBlueDeep = "#0A5C56"; // teal dark
const kraft        = "#E2D9C8";   // bg muted
const kraftLight   = "#FAF8F3";  // page background
const kraftDark    = "#C5B99A";  // muted border
const ink          = "#1A1A2E";  // primary text
const inkSoft      = "#5A5870";  // muted text
const accent       = "#F59E0B";  // amber accent
const success      = "#166534";  // success green
const successSoft  = "#4ADE80";  // success soft
const warning      = "#D97706";  // warning amber
const danger       = "#DC2626";  // danger red

// ── Types ─────────────────────────────────────────────────────────────────────
type Period = "today" | "week" | "month";

interface Tokens {
  royalBlue: string; kraft: string; kraftLight: string; kraftDark: string;
  ink: string; inkSoft: string; success?: string; danger?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const nextPayout = { amount: 1847.5, date: "Friday, May 8", daysAway: 4, orderCount: 67 };

const periodData: Record<Period, { revenue: number; orders: number; avg: number; change: number }> = {
  today: { revenue: 312.4,  orders: 12,  avg: 26.03, change: 0.18 },
  week:  { revenue: 2104.5, orders: 78,  avg: 26.98, change: 0.14 },
  month: { revenue: 8912.0, orders: 332, avg: 26.84, change: 0.22 },
};

const hourlyData = [
  { h: "11", v: 4 }, { h: "12", v: 18 }, { h: "13", v: 14 }, { h: "14", v: 6 },
  { h: "15", v: 3 }, { h: "16", v: 4 },  { h: "17", v: 9 },  { h: "18", v: 22 },
  { h: "19", v: 28 }, { h: "20", v: 19 }, { h: "21", v: 11 },
];
const maxHourly = Math.max(...hourlyData.map((h) => h.v));

const dishPerformance = [
  { name: "Tonkotsu Classic", sold: 47, change: 0.12,  revenue: 799, trend: "up" as const,   tag: "Top seller" },
  { name: "Spicy Miso",       sold: 31, change: 0.34,  revenue: 558, trend: "up" as const,   tag: "Rising" },
  { name: "Pork Gyoza (5)",   sold: 28, change: 0.05,  revenue: 252, trend: "up" as const,   tag: undefined },
  { name: "Vegetable Shoyu",  sold: 14, change: -0.08, revenue: 224, trend: "down" as const, tag: undefined },
  { name: "Cold Genmaicha",   sold: 6,  change: -0.4,  revenue: 24,  trend: "down" as const, tag: "Consider removing" },
];
const maxSold = Math.max(...dishPerformance.map((d) => d.sold));

const feedback = {
  happy: 23, issues: 2,
  recent: [
    { type: "happy", text: "The broth was unreal. Yuki, please never close.", customer: "Marc D.", when: "Yesterday", note: undefined },
    { type: "issue", text: "Came a bit cold — driver was held up at the gate.", customer: "Priya S.", when: "2 days ago", note: "Not a kitchen issue" },
    { type: "happy", text: "Best ramen in Kanata, full stop.", customer: "Tom L.", when: "3 days ago", note: undefined },
  ],
};

const attention = [
  { label: "Hours look complete",           sub: "All 6 days configured",                        ok: true,  action: undefined },
  { label: "Spicy Miso photo missing",      sub: "Customers order more dishes with photos",       ok: false, action: "Add photo" },
  { label: "3 menu items have no description", sub: "Quick to add — under a minute each",        ok: false, action: "Review" },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function ManagementDashboard() {
  const [period, setPeriod] = useState<Period>("week");
  const stats = periodData[period];

  const baseTokens: Tokens = { royalBlue, kraft, kraftLight, kraftDark, ink, inkSoft };
  const fullTokens: Tokens = { ...baseTokens, success, danger };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: `linear-gradient(135deg, ${kraftLight} 0%, ${kraft} 100%)`, fontFamily: "'Fraunces', 'Georgia', serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter+Tight:wght@400;500;600;700&display=swap');

        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-body    { font-family: 'Inter Tight', system-ui, sans-serif; }

        .tablet-frame {
          width: 1024px; height: 720px; background: ${ink}; border-radius: 24px; padding: 14px;
          box-shadow: 0 60px 120px -30px rgba(26,24,20,0.5), 0 30px 60px -30px rgba(26,24,20,0.4);
          position: relative; max-width: 100%; max-height: 95vh;
        }
        .tablet-screen {
          width: 100%; height: 100%; background: ${kraftLight}; border-radius: 14px;
          overflow: hidden; position: relative; display: grid; grid-template-columns: 64px 1fr;
        }

        .scroll-hide { scrollbar-width: thin; scrollbar-color: ${kraftDark} transparent; }
        .scroll-hide::-webkit-scrollbar { width: 6px; }
        .scroll-hide::-webkit-scrollbar-track { background: transparent; }
        .scroll-hide::-webkit-scrollbar-thumb { background: ${kraftDark}; border-radius: 999px; }

        .nav-btn { width: 44px; height: 44px; border-radius: 12px; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; }
        .nav-btn:hover { transform: scale(1.05); }

        .pulse-dot { animation: pulseDot 1.4s ease-in-out infinite; }
        @keyframes pulseDot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

        .stamp::before { content: ""; position: absolute; inset: -4px -8px; border: 1.5px solid currentColor; border-radius: 2px; opacity: 0.25; transform: rotate(-1.5deg); }

        .bar-rise { animation: barRise 0.6s ease-out backwards; transform-origin: bottom; }
        @keyframes barRise { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }

        .grain::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px); background-size: 3px 3px; pointer-events: none; opacity: 0.5; z-index: 1; }
      `}</style>

      <div className="tablet-frame">
        <div className="tablet-screen">
          {/* LEFT RAIL */}
          <div style={{ background: ink, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: royalBlue, color: kraftLight, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 700, fontSize: 20, marginBottom: 4, border: `1px solid ${kraft}30` }}>N</div>

            <Link href="/partner/kitchen" className="nav-btn" style={{ background: "transparent", color: kraftLight + "AA" }} title="Kitchen">
              <ChefHat size={20} strokeWidth={2.2} />
            </Link>
            <button className="nav-btn" style={{ background: royalBlue, color: kraftLight }} title="Reports">
              <TrendingUp size={20} strokeWidth={2.2} />
            </button>
            <button className="nav-btn" style={{ background: "transparent", color: kraftLight + "AA" }} title="Menu">
              <MessageSquare size={20} strokeWidth={2.2} />
            </button>
            <button className="nav-btn" style={{ background: "transparent", color: kraftLight + "AA" }} title="Settings">
              <Settings size={20} strokeWidth={2.2} />
            </button>

            <div style={{ flex: 1 }} />

            <div style={{ width: 44, height: 44, borderRadius: 12, background: success + "30", color: successSoft, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Wifi size={18} strokeWidth={2.2} />
              <span className="pulse-dot" style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: successSoft }} />
            </div>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, ${danger})`, color: kraftLight, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Fraunces', serif", fontStyle: "italic", fontWeight: 700, fontSize: 16, border: `2px solid ${kraft}40` }}>Y</div>
          </div>

          {/* MAIN CONTENT */}
          <div className="grain" style={{ display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
            {/* Top bar */}
            <div style={{ padding: "16px 22px 14px", borderBottom: `1px solid ${kraftDark}40`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative", zIndex: 2 }}>
              <div>
                <div className="font-body" style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: inkSoft, fontWeight: 700, marginBottom: 2 }}>Maïko Ramen · Kanata</div>
                <h1 className="font-display" style={{ fontSize: 26, fontWeight: 600, fontStyle: "italic", color: ink, lineHeight: 1.05, letterSpacing: "-0.015em" }}>Good evening, Yuki.</h1>
              </div>
              <div style={{ display: "flex", background: kraftLight, border: `1px solid ${kraftDark}60`, borderRadius: 10, padding: 3, gap: 2 }}>
                {(["today", "week", "month"] as Period[]).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className="font-body" style={{ background: period === p ? ink : "transparent", color: period === p ? kraftLight : inkSoft, border: "none", borderRadius: 7, padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.05em", textTransform: "capitalize" }}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll body */}
            <div className="scroll-hide" style={{ flex: 1, overflowY: "auto", padding: "16px 22px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "min-content", gap: 14, position: "relative", zIndex: 2 }}>

              {/* Next payout — full width */}
              <div style={{ gridColumn: "1 / -1", background: success, color: kraftLight, borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden", boxShadow: "0 12px 32px -16px rgba(47,82,52,0.4)" }}>
                <div style={{ position: "absolute", top: -80, right: -50, width: 240, height: 240, borderRadius: "50%", border: `1px solid ${kraftLight}`, opacity: 0.15 }} />
                <div style={{ position: "absolute", top: -120, right: -90, width: 320, height: 320, borderRadius: "50%", border: `1px solid ${kraftLight}`, opacity: 0.1 }} />
                <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div className="font-body" style={{ fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", opacity: 0.85, fontWeight: 700, marginBottom: 6 }}>Next payout</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span className="font-display" style={{ fontSize: 48, fontWeight: 700, fontStyle: "italic", lineHeight: 1, letterSpacing: "-0.025em" }}>${nextPayout.amount.toFixed(2)}</span>
                    </div>
                    <div className="font-body" style={{ fontSize: 13, opacity: 0.85, marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar size={13} strokeWidth={2.2} />
                      Lands {nextPayout.date}
                      <span style={{ opacity: 0.5 }}>·</span>
                      <span>{nextPayout.orderCount} orders</span>
                      <span style={{ opacity: 0.5 }}>·</span>
                      <span>in {nextPayout.daysAway} days</span>
                    </div>
                  </div>
                  <button style={{ background: kraftLight, color: ink, border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Inter Tight', sans-serif" }}>
                    See payout history <ArrowUpRight size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Summary stats */}
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <StatCard label="Revenue"   value={`$${stats.revenue.toFixed(2)}`} change={stats.change}       tokens={fullTokens} />
                <StatCard label="Orders"    value={stats.orders}                    change={stats.change * 0.8} tokens={fullTokens} />
                <StatCard label="Avg order" value={`$${stats.avg.toFixed(2)}`}     change={0.04}               tokens={fullTokens} />
              </div>

              {/* When people order */}
              <Section title="When people order" sub="Hourly orders this week" tokens={baseTokens}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 4, height: 120, padding: "8px 0 0" }}>
                  {hourlyData.map((d, i) => {
                    const heightPct = (d.v / maxHourly) * 100;
                    const isPeak    = d.v === maxHourly;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5, height: "100%" }}>
                        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                          <div className="bar-rise" style={{ width: "100%", height: `${heightPct}%`, background: isPeak ? royalBlue : kraftDark, borderRadius: "4px 4px 0 0", animationDelay: `${i * 0.04}s` }} />
                        </div>
                        <span className="font-body" style={{ fontSize: 9, color: isPeak ? royalBlue : inkSoft, fontWeight: isPeak ? 700 : 500 }}>{d.h}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="font-body" style={{ fontSize: 11, color: inkSoft, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${kraftDark}40`, fontStyle: "italic" }}>
                  <span style={{ color: royalBlue, fontWeight: 700, fontStyle: "normal" }}>7 PM</span> is your peak — staff and prep accordingly.
                </div>
              </Section>

              {/* Customer feedback */}
              <Section title="What customers said" sub={`${feedback.happy} happy · ${feedback.issues} had issues`} tokens={baseTokens}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {feedback.recent.map((f, i) => (
                    <div key={i} style={{ background: f.type === "happy" ? success + "12" : warning + "12", border: `1px solid ${f.type === "happy" ? success + "40" : warning + "50"}`, borderRadius: 10, padding: "10px 12px" }}>
                      <p className="font-display" style={{ fontSize: 13, fontStyle: "italic", color: ink, lineHeight: 1.4, margin: 0, marginBottom: 4, fontWeight: 500 }}>
                        &ldquo;{f.text}&rdquo;
                      </p>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div className="font-body" style={{ fontSize: 10, color: inkSoft, display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontWeight: 600 }}>{f.customer}</span>
                          <span style={{ opacity: 0.5 }}>·</span>
                          <span>{f.when}</span>
                        </div>
                        {f.note && (
                          <span className="font-body" style={{ fontSize: 9, color: warning, fontWeight: 700, padding: "2px 6px", background: warning + "20", borderRadius: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{f.note}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Dish performance — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Section title="What&apos;s selling" sub="By dish, this week" tokens={baseTokens} action={{ label: "Edit menu", icon: <Edit3 size={12} strokeWidth={2.5} /> }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {dishPerformance.map((d, i) => {
                      const widthPct   = (d.sold / maxSold) * 100;
                      const isPositive = d.change >= 0;
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 80px", gap: 12, alignItems: "center", padding: "8px 4px" }}>
                          <div className="font-display" style={{ fontSize: 14, fontWeight: 600, color: ink, lineHeight: 1.2, display: "flex", alignItems: "center", gap: 8 }}>
                            {d.name}
                            {d.tag && (
                              <span className="font-body" style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", background: d.tag === "Top seller" ? royalBlue : d.tag === "Rising" ? successSoft + "30" : warning + "20", color: d.tag === "Top seller" ? kraftLight : d.tag === "Rising" ? success : warning, borderRadius: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{d.tag}</span>
                            )}
                          </div>
                          <div style={{ height: 6, background: kraftDark + "40", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${widthPct}%`, background: royalBlue, borderRadius: 999, transition: "width 0.6s ease" }} />
                          </div>
                          <div className="font-display" style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", color: ink, textAlign: "right" }}>{d.sold} sold</div>
                          <div className="font-body" style={{ fontSize: 12, fontWeight: 700, color: isPositive ? success : danger, textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 2 }}>
                            {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
                            {Math.abs(d.change * 100).toFixed(0)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Section>
              </div>

              {/* Needs attention — full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Section title="Needs your attention" sub="Quick wins for your listing" tokens={baseTokens}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {attention.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: kraftLight, border: `1px solid ${item.ok ? success + "30" : warning + "40"}`, borderRadius: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: item.ok ? success + "20" : warning + "20", color: item.ok ? success : warning, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {item.ok ? <Heart size={13} strokeWidth={2.5} fill={success} /> : <AlertCircle size={14} strokeWidth={2.5} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="font-display" style={{ fontSize: 13, fontWeight: 600, color: ink, lineHeight: 1.2 }}>{item.label}</div>
                          <div className="font-body" style={{ fontSize: 11, color: inkSoft, marginTop: 1 }}>{item.sub}</div>
                        </div>
                        {item.action && (
                          <button className="font-body" style={{ background: warning, color: kraftLight, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>{item.action}</button>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              </div>

              {/* Footer */}
              <div style={{ gridColumn: "1 / -1", textAlign: "center", paddingTop: 8 }}>
                <div className="font-display" style={{ fontSize: 11, fontStyle: "italic", color: inkSoft, opacity: 0.6 }}>— handled with care —</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, change, tokens }: { label: string; value: string | number; change: number; tokens: Tokens }) {
  const isPositive = change >= 0;
  return (
    <div style={{ background: tokens.kraftLight, border: `1px solid ${tokens.kraftDark}40`, borderRadius: 12, padding: "14px 16px" }}>
      <div className="font-body" style={{ fontSize: 9, letterSpacing: "0.25em", textTransform: "uppercase", color: tokens.inkSoft, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
        <span className="font-display" style={{ fontSize: 22, fontWeight: 700, fontStyle: "italic", color: tokens.ink, letterSpacing: "-0.015em", lineHeight: 1.1 }}>{value}</span>
        <span className="font-body" style={{ fontSize: 11, color: isPositive ? tokens.success : tokens.danger, fontWeight: 700, display: "flex", alignItems: "center", gap: 2, background: (isPositive ? tokens.success : tokens.danger) + "15", padding: "2px 6px", borderRadius: 4 }}>
          {isPositive ? <ArrowUpRight size={11} strokeWidth={2.5} /> : <ArrowDownRight size={11} strokeWidth={2.5} />}
          {Math.abs(change * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function Section({ title, sub, action, children, tokens }: { title: string; sub?: string; action?: { label: string; icon: React.ReactNode }; children: React.ReactNode; tokens: Tokens }) {
  return (
    <div style={{ background: tokens.kraftLight, border: `1px solid ${tokens.kraftDark}40`, borderRadius: 14, padding: "16px 18px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h3 className="font-display" style={{ fontSize: 16, fontWeight: 600, fontStyle: "italic", color: tokens.ink, lineHeight: 1.15, letterSpacing: "-0.01em", margin: 0 }}>{title}</h3>
          {sub && <p className="font-body" style={{ fontSize: 11, color: tokens.inkSoft, margin: 0, marginTop: 2 }}>{sub}</p>}
        </div>
        {action && (
          <button className="font-body" style={{ background: "transparent", border: `1px solid ${tokens.kraftDark}80`, color: tokens.ink, borderRadius: 8, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
            {action.icon}{action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
