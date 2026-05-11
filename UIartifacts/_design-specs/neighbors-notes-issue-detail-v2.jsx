import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Bookmark,
  Share2,
  Bell,
  Heart,
  Coffee,
  Flame,
  ThumbsUp,
  MapPin,
  Clock,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";

export default function EditorialIssueDetail() {
  const [saved, setSaved] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = max > 0 ? Math.min(100, (el.scrollTop / max) * 100) : 0;
      setScrollProgress(p);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Brand tokens (matched to Neighbors Notes feed)
  const royalBlue = "#1E3A8A";
  const royalBlueDeep = "#152B66";
  const kraft = "#E8DCC4";
  const kraftLight = "#F5EFE0";
  const kraftDark = "#C9B896";
  const ink = "#1A1814";
  const inkSoft = "#5C5448";
  const accent = "#D4622E"; // warm terracotta for highlights

  const reactions = [
    { id: "love", icon: Heart, label: "Love" },
    { id: "fire", icon: Flame, label: "Fire" },
    { id: "thanks", icon: ThumbsUp, label: "Thanks" },
    { id: "coffee", icon: Coffee, label: "Cozy" },
  ];

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
        }
        .scroll-container::-webkit-scrollbar { display: none; }

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

        .drop-cap::first-letter {
          font-family: 'Fraunces', serif;
          font-size: 64px;
          font-weight: 700;
          font-style: italic;
          float: left;
          line-height: 0.85;
          padding: 6px 10px 0 0;
          color: ${royalBlue};
        }

        .rise {
          animation: rise 0.5s ease-out backwards;
        }
        @keyframes rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .progress-bar {
          position: absolute;
          top: 0;
          left: 0;
          height: 3px;
          background: ${royalBlue};
          transition: width 0.1s ease-out;
          z-index: 60;
        }

        .reaction-btn {
          transition: all 0.2s ease;
        }
        .reaction-btn.active {
          transform: scale(1.1);
        }

        .inline-card {
          transition: transform 0.2s ease;
        }
        .inline-card:hover {
          transform: translateY(-2px);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div className="min-h-screen w-full" style={{position: "relative"}}>
          {/* Reading progress bar */}
          <div
            className="progress-bar"
            style={{ width: `${scrollProgress}%` }}
          />

          {/* Sticky top nav */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              background: `${kraftLight}E6`,
              backdropFilter: "blur(12px)",
              padding: "52px 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: `1px solid ${kraftDark}30`,
            }}
          >
            <button
              style={{
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: ink,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
              <span
                className="font-body"
                style={{ fontSize: 13, fontWeight: 500 }}
              >
                Notes
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSaved(!saved)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: saved ? royalBlue : ink,
                  padding: 4,
                }}
              >
                <Bookmark
                  size={18}
                  fill={saved ? royalBlue : "transparent"}
                  strokeWidth={2}
                />
              </button>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: ink,
                  padding: 4,
                }}
              >
                <Share2 size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="scroll-container">
            {/* HERO */}
            <div
              style={{
                background: ink,
                color: kraftLight,
                padding: "100px 24px 40px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Massive issue number background */}
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  right: -30,
                  fontSize: 240,
                  fontWeight: 800,
                  fontStyle: "italic",
                  color: royalBlue,
                  opacity: 0.5,
                  lineHeight: 0.85,
                  fontFamily: "'Fraunces', serif",
                  pointerEvents: "none",
                  letterSpacing: "-0.05em",
                }}
              >
                18
              </div>

              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  className="font-body"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    opacity: 0.7,
                    marginBottom: 16,
                    fontWeight: 600,
                  }}
                >
                  Neighbors Notes · Issue 18
                </div>

                <h1
                  className="font-display"
                  style={{
                    fontSize: 36,
                    fontWeight: 600,
                    lineHeight: 1.02,
                    letterSpacing: "-0.02em",
                    marginBottom: 16,
                  }}
                >
                  Three new patios,
                  <br />
                  one farewell, and the
                  <span style={{ fontStyle: "italic", color: "#FFE8D4" }}>
                    {" "}return{" "}
                  </span>
                  of butter chicken poutine.
                </h1>

                <div
                  className="font-body"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    fontSize: 12,
                    opacity: 0.75,
                    marginBottom: 18,
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin size={12} strokeWidth={2.2} />
                    Kanata
                  </span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} strokeWidth={2.2} />
                    4 min
                  </span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span>Mon May 4</span>
                </div>

                {/* Byline */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    paddingTop: 16,
                    borderTop: `1px solid ${kraftDark}40`,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${royalBlue}, ${royalBlueDeep})`,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: kraftLight,
                      fontFamily: "'Fraunces', serif",
                      fontStyle: "italic",
                      fontWeight: 700,
                      fontSize: 16,
                      border: `1.5px solid ${kraft}40`,
                    }}
                  >
                    D
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      className="font-body"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.25em",
                        textTransform: "uppercase",
                        opacity: 0.55,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      Written by
                    </div>
                    <div
                      className="font-display"
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        fontStyle: "italic",
                        letterSpacing: "-0.005em",
                      }}
                    >
                      The Driver-in-Chief
                    </div>
                    <div
                      className="font-body"
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                        marginTop: 1,
                      }}
                    >
                      Driving Kanata · 1,200+ deliveries
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In this issue — table of contents */}
            <div
              className="rise"
              style={{
                padding: "28px 24px 8px",
                animationDelay: "0.05s",
              }}
            >
              <div
                className="font-body stamp"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  color: royalBlue,
                  marginBottom: 14,
                  display: "inline-block",
                }}
              >
                In this issue
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {[
                  { n: "01", title: "Patio season is open" },
                  { n: "02", title: "Saying goodbye to Café Mio" },
                  { n: "03", title: "Butter chicken poutine, again" },
                  { n: "04", title: "Three things on Hazeldean" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                      padding: "8px 0",
                      borderBottom:
                        i < 3 ? `1px solid ${kraftDark}30` : "none",
                    }}
                  >
                    <span
                      className="font-display"
                      style={{
                        fontSize: 13,
                        fontStyle: "italic",
                        color: royalBlue,
                        fontWeight: 600,
                        opacity: 0.7,
                        minWidth: 22,
                      }}
                    >
                      {item.n}
                    </span>
                    <span
                      className="font-body"
                      style={{
                        fontSize: 14,
                        color: ink,
                        fontWeight: 500,
                      }}
                    >
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* STORY 01 */}
            <article
              className="rise"
              style={{ padding: "32px 24px 8px", animationDelay: "0.1s" }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 56,
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: kraftDark,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                01
              </div>
              <h2
                className="font-display"
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  color: ink,
                  marginBottom: 14,
                }}
              >
                Patio season is{" "}
                <span style={{ fontStyle: "italic" }}>officially</span> open
              </h2>

              <p
                className="font-body drop-cap"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: ink,
                  marginBottom: 14,
                }}
              >
                The first warm Saturday of the year did what it always does
                in Kanata — it sent everyone outside at once. Three patios on
                Hazeldean opened this weekend, and by 6 PM none of them had a
                free table. If you missed the rush, this week is your chance.
              </p>

              <p
                className="font-body"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: ink,
                  marginBottom: 18,
                }}
              >
                The Grand Pizzeria stretched theirs all the way to the curb.
                Local Public Eatery added heaters, which feels optimistic
                for May but smart for May evenings. And around the corner,
                the new place that took over the old yoga studio finally
                soft-opened.
              </p>

              {/* Inline restaurant card */}
              <div
                className="inline-card"
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}60`,
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                  boxShadow: "0 4px 12px -8px rgba(26,24,20,0.15)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${accent}, #A8451B)`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: kraftLight,
                    fontSize: 22,
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontWeight: 700,
                  }}
                >
                  G
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-body"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: royalBlue,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Mentioned in this story
                  </div>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: ink,
                      lineHeight: 1.2,
                    }}
                  >
                    The Grand Pizzeria
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 11, color: inkSoft }}
                  >
                    Wood-fired · Hazeldean
                  </div>
                </div>
                <ArrowUpRight
                  size={18}
                  strokeWidth={2}
                  style={{ color: royalBlue, flexShrink: 0 }}
                />
              </div>
            </article>

            {/* Divider */}
            <div
              style={{
                margin: "8px 24px",
                textAlign: "center",
                color: kraftDark,
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                letterSpacing: "0.4em",
              }}
            >
              · · ·
            </div>

            {/* STORY 02 */}
            <article
              className="rise"
              style={{ padding: "20px 24px 8px", animationDelay: "0.15s" }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 56,
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: kraftDark,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                02
              </div>
              <h2
                className="font-display"
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  color: ink,
                  marginBottom: 14,
                }}
              >
                Saying goodbye to{" "}
                <span style={{ fontStyle: "italic" }}>Café Mio</span>
              </h2>

              <p
                className="font-body"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: ink,
                  marginBottom: 14,
                }}
              >
                After eleven years on Castlefrank, Café Mio is closing at
                the end of the month. Co-owner Daniela posted a handwritten
                note on the door — the kind of note you photograph and send
                to a friend.
              </p>

              <blockquote
                style={{
                  borderLeft: `3px solid ${royalBlue}`,
                  paddingLeft: 18,
                  margin: "0 0 18px",
                }}
              >
                <p
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    color: ink,
                    fontWeight: 500,
                  }}
                >
                  "Eleven years of espresso, eleven years of conversations.
                  We're tired in the best way."
                </p>
                <footer
                  className="font-body"
                  style={{
                    fontSize: 11,
                    color: inkSoft,
                    marginTop: 8,
                    fontStyle: "normal",
                  }}
                >
                  — From the note on the door
                </footer>
              </blockquote>

              <p
                className="font-body"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: ink,
                  marginBottom: 8,
                }}
              >
                The last day is May 31. If you've never been, go. If you've
                been a hundred times, go anyway.
              </p>
            </article>

            {/* Divider */}
            <div
              style={{
                margin: "20px 24px 8px",
                textAlign: "center",
                color: kraftDark,
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                letterSpacing: "0.4em",
              }}
            >
              · · ·
            </div>

            {/* STORY 03 */}
            <article
              className="rise"
              style={{ padding: "20px 24px 8px", animationDelay: "0.2s" }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 56,
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: kraftDark,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                03
              </div>
              <h2
                className="font-display"
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  color: ink,
                  marginBottom: 14,
                }}
              >
                Butter chicken poutine,{" "}
                <span style={{ fontStyle: "italic" }}>again</span>
              </h2>

              <p
                className="font-body"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: ink,
                  marginBottom: 14,
                }}
              >
                Two years ago, Kanata had a brief, intense love affair with
                butter chicken poutine. Then it disappeared. This week, it's
                back — quietly added to the menu at one of our partners,
                without fanfare, on a Wednesday.
              </p>

              <p
                className="font-body"
                style={{
                  fontSize: 15,
                  lineHeight: 1.65,
                  color: ink,
                  marginBottom: 18,
                }}
              >
                We tested it. It is exactly as good as you remember.
              </p>

              <div
                className="inline-card"
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}60`,
                  borderRadius: 14,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 18,
                  boxShadow: "0 4px 12px -8px rgba(26,24,20,0.15)",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, #B8860B, #8B6508)`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: kraftLight,
                    fontSize: 22,
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontWeight: 700,
                  }}
                >
                  S
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-body"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: royalBlue,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Order it now
                  </div>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: ink,
                      lineHeight: 1.2,
                    }}
                  >
                    Saffron Indian Kitchen
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 11, color: inkSoft }}
                  >
                    Indian · Centrum
                  </div>
                </div>
                <ArrowUpRight
                  size={18}
                  strokeWidth={2}
                  style={{ color: royalBlue, flexShrink: 0 }}
                />
              </div>
            </article>

            {/* Divider */}
            <div
              style={{
                margin: "20px 24px 8px",
                textAlign: "center",
                color: kraftDark,
                fontFamily: "'Fraunces', serif",
                fontSize: 18,
                letterSpacing: "0.4em",
              }}
            >
              · · ·
            </div>

            {/* STORY 04 — Quick hits */}
            <article
              className="rise"
              style={{ padding: "20px 24px 8px", animationDelay: "0.25s" }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 56,
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: kraftDark,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                04
              </div>
              <h2
                className="font-display"
                style={{
                  fontSize: 26,
                  fontWeight: 600,
                  lineHeight: 1.1,
                  letterSpacing: "-0.015em",
                  color: ink,
                  marginBottom: 18,
                }}
              >
                Three things on Hazeldean
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  {
                    n: "i.",
                    text: "The bakery on the corner of Hazeldean and Castlefrank now opens at 6 AM. Confirmed by your neighborhood driver at 6:04 AM, with photo evidence.",
                  },
                  {
                    n: "ii.",
                    text: "Glen Cairn farmers' market starts Sunday May 11. First-week vendors include three new ones we haven't seen before.",
                  },
                  {
                    n: "iii.",
                    text: "Construction on Eagleson is closing one lane until Friday. If you order delivery between 5 and 7 PM, please be patient with your driver.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: 12, alignItems: "baseline" }}
                  >
                    <span
                      className="font-display"
                      style={{
                        fontSize: 14,
                        fontStyle: "italic",
                        color: royalBlue,
                        fontWeight: 600,
                        minWidth: 20,
                      }}
                    >
                      {item.n}
                    </span>
                    <p
                      className="font-body"
                      style={{
                        fontSize: 14,
                        lineHeight: 1.6,
                        color: ink,
                        margin: 0,
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            {/* End mark */}
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px 8px",
                color: kraftDark,
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 24,
                  fontStyle: "italic",
                  fontWeight: 600,
                  letterSpacing: "0.5em",
                }}
              >
                ⁂
              </div>
              <div
                className="font-body"
                style={{
                  fontSize: 11,
                  color: inkSoft,
                  marginTop: 8,
                  fontStyle: "italic",
                }}
              >
                — The Driver-in-Chief, Kanata
              </div>
            </div>

            {/* PRIMARY CTA — Order from a mentioned restaurant */}
            <div style={{ padding: "16px 24px 0" }}>
              <button
                style={{
                  width: "100%",
                  background: royalBlue,
                  color: kraftLight,
                  border: "none",
                  borderRadius: 16,
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 8px 24px -12px rgba(30,58,138,0.5)",
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div
                    className="font-body"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      opacity: 0.75,
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    Mentioned in this issue
                  </div>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 17,
                      fontWeight: 600,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    Order from Saffron, Grand & 2 more
                  </div>
                </div>
                <ArrowRight size={22} strokeWidth={2.2} />
              </button>
            </div>

            {/* Reactions */}
            <div style={{ padding: "24px 24px 0" }}>
              <div
                className="font-body"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: inkSoft,
                  fontWeight: 600,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                How was this issue?
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 10,
                }}
              >
                {reactions.map((r) => {
                  const Icon = r.icon;
                  const active = reaction === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setReaction(active ? null : r.id)}
                      className={`reaction-btn ${active ? "active" : ""}`}
                      style={{
                        background: active ? royalBlue : kraftLight,
                        color: active ? kraftLight : ink,
                        border: `1px solid ${active ? royalBlue : kraftDark + "60"}`,
                        borderRadius: 999,
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        boxShadow: active
                          ? "0 4px 12px -6px rgba(30,58,138,0.4)"
                          : "none",
                      }}
                    >
                      <Icon
                        size={15}
                        strokeWidth={2}
                        fill={active ? kraftLight : "transparent"}
                      />
                      <span
                        className="font-body"
                        style={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {r.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subscribe */}
            <div style={{ padding: "28px 24px 0" }}>
              <div
                style={{
                  background: ink,
                  color: kraftLight,
                  borderRadius: 18,
                  padding: "22px 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 120,
                    height: 120,
                    borderRadius: "50%",
                    border: `1px solid ${royalBlue}`,
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -50,
                    right: -50,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    border: `1px solid ${royalBlue}`,
                    opacity: 0.25,
                  }}
                />
                <div style={{ position: "relative" }}>
                  <Bell
                    size={20}
                    strokeWidth={2}
                    style={{ marginBottom: 10, color: "#FFE8D4" }}
                  />
                  <h3
                    className="font-display"
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      lineHeight: 1.15,
                      letterSpacing: "-0.01em",
                      marginBottom: 6,
                    }}
                  >
                    Get next week's issue
                  </h3>
                  <p
                    className="font-body"
                    style={{
                      fontSize: 13,
                      opacity: 0.75,
                      lineHeight: 1.5,
                      marginBottom: 14,
                    }}
                  >
                    Notes drops every Monday morning, 6 AM. We'll ping you.
                  </p>
                  <button
                    onClick={() => setSubscribed(!subscribed)}
                    style={{
                      background: subscribed ? "transparent" : kraftLight,
                      color: subscribed ? kraftLight : ink,
                      border: subscribed
                        ? `1.5px solid ${kraftLight}`
                        : "none",
                      borderRadius: 999,
                      padding: "10px 18px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    className="font-body"
                  >
                    {subscribed ? "✓ Subscribed" : "Notify me Monday"}
                  </button>
                </div>
              </div>
            </div>

            {/* Past issues */}
            <div style={{ padding: "28px 24px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <span
                  className="font-body stamp"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    color: royalBlue,
                  }}
                >
                  Past issues
                </span>
                <button
                  className="font-body"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: inkSoft,
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  See archive →
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  {
                    n: "17",
                    title: "Why Tuesday is the best night to order in",
                    date: "Apr 27",
                  },
                  {
                    n: "16",
                    title: "A new bakery, a goodbye to the old one",
                    date: "Apr 20",
                  },
                  {
                    n: "15",
                    title: "Spring menus, ranked by your neighbors",
                    date: "Apr 13",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      background: kraftLight,
                      borderRadius: 12,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      border: `1px solid ${kraftDark}40`,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      className="font-display"
                      style={{
                        fontSize: 24,
                        fontStyle: "italic",
                        fontWeight: 700,
                        color: royalBlue,
                        lineHeight: 1,
                        opacity: 0.5,
                        minWidth: 36,
                      }}
                    >
                      {item.n}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="font-display"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: ink,
                          lineHeight: 1.25,
                          marginBottom: 2,
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        className="font-body"
                        style={{ fontSize: 11, color: inkSoft }}
                      >
                        {item.date}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={14}
                      strokeWidth={2}
                      style={{ color: inkSoft }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: "center",
                padding: "32px 24px 40px",
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 11,
                  fontStyle: "italic",
                  color: inkSoft,
                  opacity: 0.6,
                }}
              >
                — handled with care —
              </div>
            </div>
          </div>
        </div>
  );
}
