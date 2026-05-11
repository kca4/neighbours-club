import React, { useState } from "react";
import {
  Home,
  Newspaper,
  ShoppingBag,
  User,
  MapPin,
  Bell,
  ChevronRight,
  Calendar,
  AlertCircle,
  Trash2,
  Construction,
  Bus,
  Heart,
  Bookmark,
  Share2,
  Clock,
} from "lucide-react";

export default function NeighborsPulse() {
  const [activeTab, setActiveTab] = useState("pulse");
  const [savedPosts, setSavedPosts] = useState(new Set());

  const toggleSave = (id) => {
    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Brand tokens
  const royalBlue = "#1E3A8A";
  const royalBlueDeep = "#152B66";
  const kraft = "#E8DCC4";
  const kraftLight = "#F5EFE0";
  const kraftDark = "#C9B896";
  const ink = "#1A1814";
  const inkSoft = "#5C5448";

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: `linear-gradient(135deg, ${kraftLight} 0%, ${kraft} 100%)`,
        fontFamily: "'Fraunces', 'Georgia', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter+Tight:wght@400;500;600;700&display=swap');

        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Inter Tight', system-ui, sans-serif; };
          border-radius: 48px;
          padding: 12px;
          box-shadow:
            0 50px 100px -20px rgba(26, 24, 20, 0.4),
            0 30px 60px -30px rgba(26, 24, 20, 0.5),
            inset 0 0 0 2px rgba(255,255,255,0.08);
          position: relative;
        };
          border-radius: 36px;
          overflow: hidden;
          position: relative;
        };
          border-radius: 20px;
          z-index: 50;
        }

        .scroll-container {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: none;
          padding-bottom: 90px;
        }
        .scroll-container::-webkit-scrollbar { display: none; }

        .grain::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 3px 3px;
          pointer-events: none;
          opacity: 0.6;
        }

        .stamp {
          position: relative;
          display: inline-block;
        }
        .stamp::before {
          content: "";
          position: absolute;
          inset: -4px -8px;
          border: 1.5px solid currentColor;
          border-radius: 2px;
          opacity: 0.25;
          transform: rotate(-1.5deg);
        }

        .ticker {
          display: flex;
          animation: ticker 28s linear infinite;
          white-space: nowrap;
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .card-rise {
          animation: rise 0.6s ease-out backwards;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .pulse-dot {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .torn-edge {
          --c: ${kraft};
          background: var(--c);
          mask-image:
            radial-gradient(circle at 6px 6px, transparent 4px, black 4.5px);
          mask-size: 12px 12px;
          mask-position: 0 -6px;
          mask-repeat: repeat-x;
        }
      `}</style>

      <div className="min-h-screen w-full" style={{position: "relative"}}>
          <div className="scroll-container">
            {/* HEADER */}
            <div
              style={{
                background: royalBlue,
                color: kraftLight,
                padding: "56px 20px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative arc */}
              <div
                style={{
                  position: "absolute",
                  top: -80,
                  right: -80,
                  width: 220,
                  height: 220,
                  borderRadius: "50%",
                  border: `1px solid ${kraft}`,
                  opacity: 0.15,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -120,
                  right: -120,
                  width: 280,
                  height: 280,
                  borderRadius: "50%",
                  border: `1px solid ${kraft}`,
                  opacity: 0.1,
                }}
              />

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} strokeWidth={2.5} />
                  <span
                    className="font-body text-xs uppercase tracking-[0.2em]"
                    style={{ opacity: 0.85 }}
                  >
                    Kanata
                  </span>
                  <ChevronRight size={14} style={{ opacity: 0.6 }} />
                </div>
                <Bell size={18} strokeWidth={2} />
              </div>

              <h1
                className="font-display"
                style={{
                  fontSize: 44,
                  lineHeight: 0.95,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  fontStyle: "italic",
                  marginBottom: 6,
                }}
              >
                Neighbors Notes
              </h1>
              <p
                className="font-body text-sm"
                style={{ opacity: 0.75, fontWeight: 400 }}
              >
                Monday, May 4 · what's happening on your block
              </p>
            </div>

            {/* TICKER — Civic alerts */}
            <div
              style={{
                background: ink,
                color: kraftLight,
                padding: "10px 0",
                overflow: "hidden",
                borderBottom: `1px solid ${royalBlueDeep}`,
              }}
            >
              <div className="ticker font-body text-xs uppercase tracking-wider">
                {[...Array(2)].map((_, dup) => (
                  <div key={dup} className="flex items-center shrink-0">
                    <span className="flex items-center gap-2 px-5">
                      <Trash2 size={12} />
                      Green bin pickup tomorrow
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span className="flex items-center gap-2 px-5">
                      <Construction size={12} />
                      Eagleson Rd lane closure until Fri
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span className="flex items-center gap-2 px-5">
                      <Bus size={12} />
                      Route 61 detour at Hazeldean
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span className="flex items-center gap-2 px-5">
                      <AlertCircle size={12} />
                      Boil water advisory lifted
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CONTENT */}
            <div style={{ padding: "20px 16px 0" }}>
              {/* SECTION: RESTAURANT SPOTLIGHT */}
              <div
                className="card-rise"
                style={{ animationDelay: "0.05s", marginBottom: 28 }}
              >
                <div className="flex items-baseline justify-between mb-3 px-1">
                  <span
                    className="font-body stamp text-[10px] uppercase tracking-[0.25em] font-semibold"
                    style={{ color: royalBlue }}
                  >
                    Partner Spotlight
                  </span>
                  <span
                    className="font-body text-[10px]"
                    style={{ color: inkSoft }}
                  >
                    01 / 04
                  </span>
                </div>

                <article
                  style={{
                    background: kraftLight,
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow:
                      "0 1px 0 rgba(26,24,20,0.04), 0 12px 32px -16px rgba(26,24,20,0.18)",
                    border: `1px solid ${kraftDark}40`,
                  }}
                >
                  {/* Image area — illustrated kraft texture */}
                  <div
                    style={{
                      height: 180,
                      background: `linear-gradient(135deg, ${kraftDark} 0%, ${kraft} 60%, ${kraftLight} 100%)`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Decorative bowl illustration */}
                    <div
                      style={{
                        position: "absolute",
                        bottom: -40,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: `radial-gradient(circle at 40% 35%, #D4622E 0%, #A8451B 70%)`,
                        boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.2)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: 30,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 80,
                        height: 6,
                        background: "rgba(255,255,255,0.4)",
                        borderRadius: "50%",
                        filter: "blur(4px)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: royalBlue,
                        color: kraftLight,
                        padding: "5px 10px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                      }}
                      className="font-body"
                    >
                      New Partner
                    </div>
                  </div>

                  <div style={{ padding: "20px 20px 18px" }}>
                    <h2
                      className="font-display"
                      style={{
                        fontSize: 26,
                        fontWeight: 600,
                        lineHeight: 1.05,
                        letterSpacing: "-0.01em",
                        color: ink,
                        marginBottom: 8,
                      }}
                    >
                      Maïko Ramen joins the
                      <span style={{ fontStyle: "italic" }}>
                        {" "}
                        Neighbors family
                      </span>
                    </h2>
                    <p
                      className="font-body text-sm"
                      style={{
                        color: inkSoft,
                        lineHeight: 1.5,
                        marginBottom: 14,
                      }}
                    >
                      Hidden behind Hazeldean Mall, Chef Yuki has been pulling
                      18-hour tonkotsu broth for six years. Now she's on
                      Neighbors — and the first 50 orders ship with handwritten
                      thank-you notes.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      {["Ramen", "Japanese", "Family-owned"].map((tag) => (
                        <span
                          key={tag}
                          className="font-body"
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            background: kraft,
                            color: ink,
                            borderRadius: 999,
                            fontWeight: 500,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <button
                        style={{
                          background: royalBlue,
                          color: kraftLight,
                          padding: "10px 18px",
                          borderRadius: 999,
                          fontSize: 13,
                          fontWeight: 600,
                          border: "none",
                          cursor: "pointer",
                        }}
                        className="font-body"
                      >
                        Order from Maïko →
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSave("maiko")}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: savedPosts.has("maiko") ? royalBlue : inkSoft,
                          }}
                        >
                          <Bookmark
                            size={18}
                            fill={
                              savedPosts.has("maiko") ? royalBlue : "transparent"
                            }
                          />
                        </button>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: inkSoft,
                          }}
                        >
                          <Share2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </div>

              {/* SECTION: WEEKLY EDITORIAL */}
              <div
                className="card-rise"
                style={{ animationDelay: "0.15s", marginBottom: 28 }}
              >
                <div className="flex items-baseline justify-between mb-3 px-1">
                  <span
                    className="font-body stamp text-[10px] uppercase tracking-[0.25em] font-semibold"
                    style={{ color: royalBlue }}
                  >
                    This Week in Kanata
                  </span>
                  <span
                    className="font-body text-[10px]"
                    style={{ color: inkSoft }}
                  >
                    Issue №18
                  </span>
                </div>

                <article
                  style={{
                    background: ink,
                    color: kraftLight,
                    borderRadius: 20,
                    padding: "24px 22px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Decorative number */}
                  <div
                    style={{
                      position: "absolute",
                      top: -20,
                      right: -10,
                      fontSize: 180,
                      fontWeight: 800,
                      fontStyle: "italic",
                      color: royalBlue,
                      opacity: 0.4,
                      lineHeight: 1,
                      fontFamily: "'Fraunces', serif",
                      pointerEvents: "none",
                    }}
                  >
                    18
                  </div>

                  <div style={{ position: "relative" }}>
                    <div
                      className="font-body text-[10px] uppercase tracking-[0.25em] mb-3"
                      style={{ opacity: 0.6 }}
                    >
                      <span className="pulse-dot inline-block w-2 h-2 rounded-full mr-2" style={{ background: "#7DD3FC" }} />
                      Posted 2h ago · 4 min read
                    </div>

                    <h2
                      className="font-display"
                      style={{
                        fontSize: 28,
                        fontWeight: 600,
                        lineHeight: 1.05,
                        letterSpacing: "-0.015em",
                        marginBottom: 12,
                      }}
                    >
                      Three new patios,
                      <br />
                      one farewell, and the
                      <span style={{ fontStyle: "italic" }}> return </span>
                      of butter chicken poutine.
                    </h2>

                    <p
                      className="font-body text-sm"
                      style={{
                        opacity: 0.78,
                        lineHeight: 1.55,
                        marginBottom: 18,
                      }}
                    >
                      A roundup of what opened, what's leaving, and what's
                      cooking on Hazeldean this week — written by Alex, your
                      neighborhood driver-in-chief.
                    </p>

                    <button
                      style={{
                        background: kraftLight,
                        color: ink,
                        padding: "10px 18px",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                      }}
                      className="font-body"
                    >
                      Read the issue →
                    </button>
                  </div>
                </article>
              </div>

              {/* SECTION: BIA EVENTS */}
              <div
                className="card-rise"
                style={{ animationDelay: "0.25s", marginBottom: 28 }}
              >
                <div className="flex items-baseline justify-between mb-3 px-1">
                  <span
                    className="font-body stamp text-[10px] uppercase tracking-[0.25em] font-semibold"
                    style={{ color: royalBlue }}
                  >
                    Around the Neighborhood
                  </span>
                  <span
                    className="font-body text-[10px]"
                    style={{ color: inkSoft }}
                  >
                    via Kanata Central BIA
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    {
                      day: "Wed",
                      date: "07",
                      title: "Spring Makers Market",
                      where: "Centrum Plaza · 4–8 PM",
                      tag: "Free",
                    },
                    {
                      day: "Sat",
                      date: "10",
                      title: "Hazeldean Library: Storytime",
                      where: "Hazeldean Branch · 10:30 AM",
                      tag: "Family",
                    },
                    {
                      day: "Sun",
                      date: "11",
                      title: "Kanata Farmers' Market opens",
                      where: "Glen Cairn · 9 AM",
                      tag: "Local",
                    },
                  ].map((event, i) => (
                    <div
                      key={i}
                      style={{
                        background: kraftLight,
                        borderRadius: 14,
                        padding: "14px 14px 14px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        border: `1px solid ${kraftDark}40`,
                      }}
                    >
                      <div
                        style={{
                          flexShrink: 0,
                          width: 52,
                          height: 56,
                          background: kraft,
                          borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          border: `1px solid ${kraftDark}`,
                        }}
                      >
                        <div
                          className="font-body text-[9px] uppercase tracking-wider"
                          style={{ color: inkSoft, fontWeight: 600 }}
                        >
                          {event.day}
                        </div>
                        <div
                          className="font-display"
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            lineHeight: 1,
                            color: ink,
                            fontStyle: "italic",
                          }}
                        >
                          {event.date}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          className="font-display"
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: ink,
                            lineHeight: 1.2,
                            marginBottom: 3,
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {event.title}
                        </h3>
                        <p
                          className="font-body text-xs"
                          style={{ color: inkSoft }}
                        >
                          {event.where}
                        </p>
                      </div>
                      <span
                        className="font-body"
                        style={{
                          fontSize: 10,
                          padding: "3px 8px",
                          background: royalBlue,
                          color: kraftLight,
                          borderRadius: 999,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {event.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: CIVIC DETAILS */}
              <div
                className="card-rise"
                style={{ animationDelay: "0.35s", marginBottom: 20 }}
              >
                <div className="flex items-baseline justify-between mb-3 px-1">
                  <span
                    className="font-body stamp text-[10px] uppercase tracking-[0.25em] font-semibold"
                    style={{ color: royalBlue }}
                  >
                    Heads Up
                  </span>
                  <span
                    className="font-body text-[10px]"
                    style={{ color: inkSoft }}
                  >
                    City of Ottawa · OC Transpo
                  </span>
                </div>

                <div
                  style={{
                    background: kraftLight,
                    borderRadius: 16,
                    padding: 4,
                    border: `1px solid ${kraftDark}40`,
                  }}
                >
                  {[
                    {
                      icon: <Trash2 size={16} />,
                      label: "Green bin",
                      detail: "Tomorrow · Tue May 5",
                      meta: "Curb by 7 AM",
                    },
                    {
                      icon: <Construction size={16} />,
                      label: "Eagleson Rd",
                      detail: "Lane closure · Hazeldean to Hope Side",
                      meta: "Until Fri",
                    },
                    {
                      icon: <Bus size={16} />,
                      label: "Route 61",
                      detail: "Detour around Hazeldean Rd",
                      meta: "Live",
                    },
                  ].map((item, i, arr) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "12px 14px",
                        borderBottom:
                          i < arr.length - 1
                            ? `1px solid ${kraftDark}30`
                            : "none",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: royalBlue,
                          color: kraftLight,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {item.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="font-body"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: ink,
                            marginBottom: 2,
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          className="font-body text-xs"
                          style={{ color: inkSoft }}
                        >
                          {item.detail}
                        </div>
                      </div>
                      <span
                        className="font-body"
                        style={{
                          fontSize: 10,
                          color: inkSoft,
                          fontWeight: 500,
                          textAlign: "right",
                        }}
                      >
                        {item.meta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer attribution */}
              <div
                style={{
                  textAlign: "center",
                  padding: "12px 0 24px",
                }}
              >
                <p
                  className="font-body"
                  style={{
                    fontSize: 10,
                    color: inkSoft,
                    opacity: 0.7,
                    lineHeight: 1.5,
                  }}
                >
                  Civic data: City of Ottawa Open Data
                  <br />
                  Transit: OC Transpo · Events: partners
                </p>
                <div
                  className="font-display"
                  style={{
                    fontSize: 11,
                    fontStyle: "italic",
                    color: inkSoft,
                    marginTop: 10,
                    opacity: 0.6,
                  }}
                >
                  — handled with care —
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM NAV */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: kraftLight,
              borderTop: `1px solid ${kraftDark}40`,
              padding: "10px 0 24px",
              display: "flex",
              justifyContent: "space-around",
              alignItems: "center",
            }}
          >
            {[
              { id: "home", icon: Home, label: "Home" },
              { id: "pulse", icon: Newspaper, label: "Notes" },
              { id: "orders", icon: ShoppingBag, label: "Orders" },
              { id: "you", icon: User, label: "You" },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    color: active ? royalBlue : inkSoft,
                    padding: "4px 16px",
                    position: "relative",
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        top: -10,
                        width: 24,
                        height: 3,
                        background: royalBlue,
                        borderRadius: 999,
                      }}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.4 : 1.8}
                    fill={active && tab.id === "pulse" ? royalBlue : "transparent"}
                  />
                  <span
                    className="font-body"
                    style={{
                      fontSize: 10,
                      fontWeight: active ? 600 : 500,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
  );
}
