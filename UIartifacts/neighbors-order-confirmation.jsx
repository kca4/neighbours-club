import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Check,
  Phone,
  MessageCircle,
  Share2,
  Receipt,
  HelpCircle,
} from "lucide-react";

export default function OrderConfirmation() {
  const [elapsedMin, setElapsedMin] = useState(8);
  const [currentStep, setCurrentStep] = useState(1); // 0=confirmed, 1=cooking, 2=on-way, 3=delivered

  // Brand tokens
  const royalBlue = "#1E3A8A";
  const royalBlueDeep = "#152B66";
  const kraft = "#E8DCC4";
  const kraftLight = "#F5EFE0";
  const kraftDark = "#C9B896";
  const ink = "#1A1814";
  const inkSoft = "#5C5448";
  const accent = "#D4622E";
  const success = "#2F5234";

  const totalMin = 30;
  const remaining = Math.max(0, totalMin - elapsedMin);
  const progressPct = (elapsedMin / totalMin) * 100;

  const steps = [
    {
      label: "Confirmed",
      sub: "Yuki received your order",
      time: "7:02 PM",
    },
    {
      label: "Cooking",
      sub: "Yuki started your order",
      time: "7:05 PM",
    },
    {
      label: "On the way",
      sub: "Picked up by your driver",
      time: "—",
    },
    {
      label: "Delivered",
      sub: "Enjoy",
      time: "—",
    },
  ];

  // Editorial touch — varies by step
  const editorialMessage = {
    0: {
      title: "Yuki received your order.",
      sub: "She's heating the broth. Good things take a minute.",
    },
    1: {
      title: "Yuki started your order.",
      sub: "The 18-hour broth is going into your bowl right now.",
    },
    2: {
      title: "Your order is on the way.",
      sub: "Maya picked it up. She knows the back entrance trick.",
    },
    3: {
      title: "Delivered.",
      sub: "Combine the broth and noodles. Don't let it sit.",
    },
  }[currentStep];

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
        .font-body { font-family: 'Inter Tight', system-ui, sans-serif; }

        .phone-frame {
          width: 390px;
          height: 844px;
          background: ${ink};
          border-radius: 48px;
          padding: 12px;
          box-shadow:
            0 50px 100px -20px rgba(26, 24, 20, 0.4),
            0 30px 60px -30px rgba(26, 24, 20, 0.5),
            inset 0 0 0 2px rgba(255,255,255,0.08);
          position: relative;
        }
        .phone-screen {
          width: 100%;
          height: 100%;
          background: ${kraftLight};
          border-radius: 36px;
          overflow: hidden;
          position: relative;
        }
        .phone-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 32px;
          background: ${ink};
          border-radius: 20px;
          z-index: 50;
        }
        .scroll-container {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .scroll-container::-webkit-scrollbar { display: none; }

        .pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }

        .draw-line {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: draw 2s ease-out forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 200; }
        }

        .float-pin {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .step-active::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: ${royalBlue};
          opacity: 0.2;
          animation: ripple 2s ease-out infinite;
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          {/* Top header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              padding: "52px 16px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <button
              style={{
                background: "rgba(245,239,224,0.85)",
                backdropFilter: "blur(8px)",
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ink,
                cursor: "pointer",
                boxShadow: "0 2px 8px -2px rgba(0,0,0,0.1)",
              }}
            >
              <ChevronLeft size={20} strokeWidth={2.2} />
            </button>

            <button
              style={{
                background: "rgba(245,239,224,0.85)",
                backdropFilter: "blur(8px)",
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ink,
                cursor: "pointer",
                boxShadow: "0 2px 8px -2px rgba(0,0,0,0.1)",
              }}
            >
              <HelpCircle size={18} strokeWidth={2} />
            </button>
          </div>

          <div className="scroll-container">
            {/* MAP — illustrated, lightweight */}
            <div
              style={{
                height: 280,
                background: `linear-gradient(180deg, ${kraft} 0%, ${kraftLight} 100%)`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative road/route SVG */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 390 280"
                style={{ position: "absolute", inset: 0 }}
                preserveAspectRatio="none"
              >
                {/* Background grid lines (streets) */}
                {[40, 80, 130, 180, 230].map((y, i) => (
                  <line
                    key={`h-${i}`}
                    x1="0"
                    y1={y}
                    x2="390"
                    y2={y}
                    stroke={kraftDark}
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                ))}
                {[60, 130, 200, 280, 340].map((x, i) => (
                  <line
                    key={`v-${i}`}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2="280"
                    stroke={kraftDark}
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                ))}

                {/* Park / green area */}
                <rect
                  x="200"
                  y="60"
                  width="120"
                  height="80"
                  fill="#A8C09A"
                  opacity="0.35"
                  rx="4"
                />

                {/* Route line */}
                <path
                  d="M 70 220 Q 130 220, 130 160 T 200 100 Q 260 70, 320 90"
                  stroke={royalBlue}
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                  opacity="0.5"
                />
                <path
                  d="M 70 220 Q 130 220, 130 160 T 200 100"
                  stroke={royalBlue}
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>

              {/* Restaurant pin (origin) */}
              <div
                style={{
                  position: "absolute",
                  top: 75,
                  left: 305,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: ink,
                    border: `3px solid ${kraftLight}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: kraftLight,
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: 15,
                    boxShadow: "0 4px 8px -2px rgba(0,0,0,0.25)",
                  }}
                >
                  M
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: ink,
                    textAlign: "center",
                    marginTop: 4,
                    letterSpacing: "0.05em",
                  }}
                >
                  Maïko
                </div>
              </div>

              {/* Driver pin (moving) */}
              <div
                className="float-pin"
                style={{
                  position: "absolute",
                  top: 145,
                  left: 115,
                }}
              >
                <div
                  className="step-active"
                  style={{
                    position: "relative",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: royalBlue,
                    border: `3px solid ${kraftLight}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: kraftLight,
                    fontSize: 16,
                    boxShadow: "0 4px 10px -2px rgba(30,58,138,0.4)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 17h2l1.5-4h11l1.5 4h2v2H3v-2zm15.5-6h-13l-1-4h15l-1 4z"
                      fill={kraftLight}
                    />
                  </svg>
                </div>
              </div>

              {/* Home pin (destination) */}
              <div
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 55,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: kraftLight,
                    border: `3px solid ${ink}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: ink,
                    boxShadow: "0 4px 8px -2px rgba(0,0,0,0.2)",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3l9 8h-2v9h-5v-6h-4v6H5v-9H3l9-8z"
                      fill={ink}
                    />
                  </svg>
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: ink,
                    textAlign: "center",
                    marginTop: 4,
                    letterSpacing: "0.05em",
                  }}
                >
                  Home
                </div>
              </div>
            </div>

            {/* Countdown card — overlaps map */}
            <div style={{ padding: "0 16px", marginTop: -42, position: "relative", zIndex: 5 }}>
              <div
                style={{
                  background: ink,
                  color: kraftLight,
                  borderRadius: 20,
                  padding: "20px 22px",
                  boxShadow: "0 20px 40px -20px rgba(26,24,20,0.4)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Decorative arc */}
                <div
                  style={{
                    position: "absolute",
                    top: -60,
                    right: -40,
                    width: 180,
                    height: 180,
                    borderRadius: "50%",
                    border: `1px solid ${royalBlue}`,
                    opacity: 0.5,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -90,
                    right: -70,
                    width: 240,
                    height: 240,
                    borderRadius: "50%",
                    border: `1px solid ${royalBlue}`,
                    opacity: 0.3,
                  }}
                />

                <div style={{ position: "relative" }}>
                  <div
                    className="font-body"
                    style={{
                      fontSize: 10,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      opacity: 0.7,
                      fontWeight: 700,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      className="pulse"
                      style={{
                        display: "inline-block",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#FFE8D4",
                      }}
                    />
                    Arriving in
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 56,
                        fontWeight: 700,
                        fontStyle: "italic",
                        lineHeight: 1,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      {remaining}
                    </span>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 18,
                        fontStyle: "italic",
                        opacity: 0.7,
                      }}
                    >
                      min
                    </span>
                  </div>

                  <div
                    className="font-body"
                    style={{
                      fontSize: 12,
                      opacity: 0.7,
                      marginTop: 4,
                    }}
                  >
                    Estimated arrival 7:32 PM · Order #N-1842
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      marginTop: 16,
                      height: 4,
                      background: `${kraft}30`,
                      borderRadius: 999,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progressPct}%`,
                        background: kraftLight,
                        borderRadius: 999,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial touch — Yuki started your order */}
            <div style={{ padding: "20px 16px 0" }}>
              <div
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}40`,
                  borderRadius: 16,
                  padding: "16px 18px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 12,
                    fontSize: 56,
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontWeight: 700,
                    color: royalBlue,
                    opacity: 0.15,
                    lineHeight: 0.7,
                  }}
                >
                  "
                </div>
                <h2
                  className="font-display"
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: ink,
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                    marginBottom: 4,
                  }}
                >
                  {editorialMessage.title}
                </h2>
                <p
                  className="font-body"
                  style={{
                    fontSize: 13,
                    color: inkSoft,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  {editorialMessage.sub}
                </p>
              </div>
            </div>

            {/* Status timeline */}
            <div style={{ padding: "20px 16px 0" }}>
              <div
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}40`,
                  borderRadius: 16,
                  padding: "18px 18px 8px",
                }}
              >
                {steps.map((step, i) => {
                  const completed = i < currentStep;
                  const active = i === currentStep;
                  const upcoming = i > currentStep;
                  const isLast = i === steps.length - 1;

                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 14,
                        position: "relative",
                        paddingBottom: isLast ? 12 : 18,
                      }}
                    >
                      {/* Connector line */}
                      {!isLast && (
                        <div
                          style={{
                            position: "absolute",
                            left: 11,
                            top: 24,
                            bottom: 0,
                            width: 2,
                            background:
                              completed || active
                                ? royalBlue
                                : kraftDark + "60",
                          }}
                        />
                      )}

                      {/* Dot */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div
                          className={active ? "step-active" : ""}
                          style={{
                            position: "relative",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: completed
                              ? royalBlue
                              : active
                              ? royalBlue
                              : kraftLight,
                            border: upcoming
                              ? `2px solid ${kraftDark}`
                              : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: kraftLight,
                            zIndex: 2,
                          }}
                        >
                          {completed && (
                            <Check size={13} strokeWidth={3} />
                          )}
                          {active && (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: kraftLight,
                              }}
                            />
                          )}
                        </div>
                      </div>

                      {/* Text */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span
                            className="font-display"
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: upcoming ? inkSoft : ink,
                              lineHeight: 1.2,
                              letterSpacing: "-0.005em",
                              fontStyle: active ? "italic" : "normal",
                            }}
                          >
                            {step.label}
                          </span>
                          <span
                            className="font-body"
                            style={{
                              fontSize: 11,
                              color: inkSoft,
                              fontWeight: 500,
                            }}
                          >
                            {step.time}
                          </span>
                        </div>
                        <div
                          className="font-body"
                          style={{
                            fontSize: 12,
                            color: inkSoft,
                            marginTop: 2,
                            opacity: upcoming ? 0.6 : 1,
                          }}
                        >
                          {step.sub}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Driver block */}
            <div style={{ padding: "20px 16px 0" }}>
              <div
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}40`,
                  borderRadius: 16,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: `linear-gradient(135deg, ${royalBlue}, ${royalBlueDeep})`,
                    color: kraftLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Fraunces', serif",
                    fontStyle: "italic",
                    fontWeight: 700,
                    fontSize: 20,
                    flexShrink: 0,
                    border: `2px solid ${kraft}40`,
                  }}
                >
                  M
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-body"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: inkSoft,
                      fontWeight: 600,
                      marginBottom: 2,
                    }}
                  >
                    Your driver
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
                    Maya
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 11, color: inkSoft, marginTop: 1 }}
                  >
                    Driving in Kanata · 240+ deliveries
                  </div>
                </div>
                <button
                  style={{
                    background: ink,
                    color: kraftLight,
                    border: "none",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <MessageCircle size={16} strokeWidth={2.2} />
                </button>
                <button
                  style={{
                    background: ink,
                    color: kraftLight,
                    border: "none",
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Phone size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Step demo controls (sketch only) */}
            <div style={{ padding: "20px 16px 8px" }}>
              <div
                className="font-body"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: inkSoft,
                  fontWeight: 600,
                  marginBottom: 8,
                  textAlign: "center",
                  opacity: 0.7,
                }}
              >
                Demo · Tap to advance status
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 6,
                }}
              >
                {steps.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentStep(i);
                      setElapsedMin([2, 8, 22, 30][i]);
                    }}
                    style={{
                      background: currentStep === i ? royalBlue : "transparent",
                      color: currentStep === i ? kraftLight : inkSoft,
                      border:
                        currentStep === i
                          ? "none"
                          : `1px solid ${kraftDark}50`,
                      borderRadius: 8,
                      padding: "6px 4px",
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Inter Tight', sans-serif",
                    }}
                  >
                    {i + 1}. {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt + share row */}
            <div
              style={{
                padding: "12px 16px 0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              <button
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}50`,
                  borderRadius: 12,
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  color: ink,
                }}
                className="font-body"
              >
                <Receipt size={14} strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Receipt</span>
              </button>
              <button
                style={{
                  background: kraftLight,
                  border: `1px solid ${kraftDark}50`,
                  borderRadius: 12,
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  cursor: "pointer",
                  color: ink,
                }}
                className="font-body"
              >
                <Share2 size={14} strokeWidth={2} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>Share</span>
              </button>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "24px 24px 32px",
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
      </div>
    </div>
  );
}
