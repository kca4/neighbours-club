import React, { useState, useEffect } from "react";
import {
  Power,
  DollarSign,
  Clock,
  MapPin,
  Navigation,
  Phone,
  MessageCircle,
  Camera,
  Check,
  X,
  ChevronRight,
  HelpCircle,
  Package,
  Home,
  Truck,
  AlertCircle,
  ArrowRight,
  ChevronUp,
  Star,
  Heart,
} from "lucide-react";

export default function DriverApp() {
  // States: "offline" → "online" → "offer" → "to_pickup" → "at_pickup" → "to_dropoff" → "at_dropoff" → "complete"
  const [state, setState] = useState("online");
  const [photoTaken, setPhotoTaken] = useState({ pickup: false, dropoff: false });
  const [helpOpen, setHelpOpen] = useState(false);

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
  const successSoft = "#7BC97D";
  const warning = "#C97B1F";
  const danger = "#A8341B";

  const tokens = {
    royalBlue,
    royalBlueDeep,
    kraft,
    kraftLight,
    kraftDark,
    ink,
    inkSoft,
    accent,
    success,
    successSoft,
    warning,
    danger,
  };

  // Mock order
  const order = {
    id: "N-1842",
    restaurant: "Maïko Ramen",
    pickupAddress: "300 Eagleson Rd, Unit 4",
    pickupNote: "Pickup is around the back, not the mall side.",
    customer: "Marc D.",
    dropoffAddress: "142 Castlefrank Rd, Apt 3B",
    dropoffNote: "Buzz code 1142. Leave at door.",
    distance: "3.2 km",
    duration: "9 min",
    items: 3,
    basePay: 8.5,
    tip: 4.5, // hidden until complete
    total: 13.0,
  };

  const states = [
    { id: "offline", label: "Offline" },
    { id: "online", label: "Online" },
    { id: "offer", label: "Offer" },
    { id: "to_pickup", label: "→ Pickup" },
    { id: "at_pickup", label: "@ Pickup" },
    { id: "to_dropoff", label: "→ Drop" },
    { id: "at_dropoff", label: "@ Drop" },
    { id: "complete", label: "Done" },
  ];

  // Status bar background per state
  const stateBg = {
    offline: ink,
    online: success,
    offer: royalBlue,
    to_pickup: royalBlue,
    at_pickup: warning,
    to_dropoff: royalBlue,
    at_dropoff: warning,
    complete: success,
  }[state];

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
          padding-bottom: 80px;
        }
        .scroll-container::-webkit-scrollbar { display: none; }

        .pulse-ring::before {
          content: "";
          position: absolute;
          inset: -8px;
          border-radius: inherit;
          border: 3px solid ${royalBlue};
          opacity: 0.4;
          animation: ring 1.5s ease-out infinite;
          pointer-events: none;
        }
        @keyframes ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.15); opacity: 0; }
        }

        .pulse-dot {
          animation: pulseDot 1.4s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.4); }
        }

        .slide-up {
          animation: slideUp 0.35s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .float-pin {
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        .accept-btn {
          animation: acceptPulse 1.8s ease-in-out infinite;
        }
        @keyframes acceptPulse {
          0%, 100% { box-shadow: 0 12px 28px -10px rgba(30,58,138,0.5); }
          50% { box-shadow: 0 16px 36px -8px rgba(30,58,138,0.7); }
        }
      `}</style>

      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          {/* Top status bar — color and label change per state */}
          <div
            style={{
              background: stateBg,
              color: kraftLight,
              paddingTop: 52,
              paddingBottom: 10,
              paddingLeft: 16,
              paddingRight: 16,
              transition: "background 0.4s ease",
              position: "relative",
              zIndex: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  className="pulse-dot"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: kraftLight,
                  }}
                />
                <span
                  className="font-body"
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  {state === "offline" && "Offline"}
                  {state === "online" && "Online · Available"}
                  {state === "offer" && "New order"}
                  {state === "to_pickup" && "Heading to pickup"}
                  {state === "at_pickup" && "At restaurant"}
                  {state === "to_dropoff" && "Heading to customer"}
                  {state === "at_dropoff" && "At drop-off"}
                  {state === "complete" && "Delivered"}
                </span>
              </div>

              <button
                onClick={() => setHelpOpen(!helpOpen)}
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "none",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: kraftLight,
                  cursor: "pointer",
                }}
              >
                <HelpCircle size={16} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Render state-specific content */}
          <div className="scroll-container" key={state}>
            {state === "offline" && <OfflineState onGoOnline={() => setState("online")} tokens={tokens} />}
            {state === "online" && <OnlineState onSimulateOffer={() => setState("offer")} onGoOffline={() => setState("offline")} tokens={tokens} />}
            {state === "offer" && <OfferState order={order} onAccept={() => setState("to_pickup")} onDecline={() => setState("online")} tokens={tokens} />}
            {state === "to_pickup" && <ToPickupState order={order} onArrive={() => setState("at_pickup")} tokens={tokens} />}
            {state === "at_pickup" && <AtPickupState order={order} photoTaken={photoTaken.pickup} onPhoto={() => setPhotoTaken({ ...photoTaken, pickup: true })} onPickedUp={() => setState("to_dropoff")} tokens={tokens} />}
            {state === "to_dropoff" && <ToDropoffState order={order} onArrive={() => setState("at_dropoff")} tokens={tokens} />}
            {state === "at_dropoff" && <AtDropoffState order={order} photoTaken={photoTaken.dropoff} onPhoto={() => setPhotoTaken({ ...photoTaken, dropoff: true })} onDelivered={() => setState("complete")} tokens={tokens} />}
            {state === "complete" && <CompleteState order={order} onNext={() => { setState("online"); setPhotoTaken({ pickup: false, dropoff: false }); }} tokens={tokens} />}
          </div>

          {/* Help panel overlay */}
          {helpOpen && (
            <div
              onClick={() => setHelpOpen(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(26,24,20,0.5)",
                zIndex: 60,
                display: "flex",
                alignItems: "flex-end",
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="slide-up"
                style={{
                  background: kraftLight,
                  width: "100%",
                  borderRadius: "24px 24px 0 0",
                  padding: "20px 22px 32px",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    background: kraftDark,
                    borderRadius: 999,
                    margin: "0 auto 18px",
                  }}
                />
                <h3
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: ink,
                    marginBottom: 16,
                  }}
                >
                  Need help?
                </h3>
                {[
                  { icon: <Phone size={18} />, label: "Call support", sub: "A real person, 7 days/week", color: royalBlue },
                  { icon: <MessageCircle size={18} />, label: "Message support", sub: "Reply usually within 5 min", color: ink },
                  { icon: <AlertCircle size={18} />, label: "Emergency", sub: "I feel unsafe right now", color: danger },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setHelpOpen(false)}
                    style={{
                      width: "100%",
                      background: kraftLight,
                      border: `1px solid ${kraftDark}60`,
                      borderRadius: 14,
                      padding: "14px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 8,
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: item.color,
                        color: kraftLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        className="font-display"
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: ink,
                          lineHeight: 1.2,
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        className="font-body"
                        style={{
                          fontSize: 11,
                          color: inkSoft,
                          marginTop: 2,
                        }}
                      >
                        {item.sub}
                      </div>
                    </div>
                    <ChevronRight size={18} strokeWidth={2} style={{ color: inkSoft }} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Demo controls — for sketch only */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "8px 8px 12px",
              background: ink,
              zIndex: 40,
              display: "flex",
              gap: 4,
              overflowX: "auto",
            }}
          >
            {states.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setState(s.id);
                  if (s.id === "online" || s.id === "offline" || s.id === "offer") {
                    setPhotoTaken({ pickup: false, dropoff: false });
                  }
                }}
                style={{
                  background: state === s.id ? royalBlue : "transparent",
                  color: state === s.id ? kraftLight : kraftLight + "80",
                  border: state === s.id ? "none" : `1px solid ${kraftLight}30`,
                  borderRadius: 6,
                  padding: "5px 8px",
                  fontSize: 9,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter Tight', sans-serif",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================= STATES =========================

function OfflineState({ onGoOnline, tokens }) {
  return (
    <div style={{ padding: "32px 24px", textAlign: "center" }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: tokens.kraft,
          color: tokens.inkSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "40px auto 24px",
        }}
      >
        <Power size={32} strokeWidth={2} />
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 26,
          fontWeight: 600,
          fontStyle: "italic",
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          marginBottom: 8,
        }}
      >
        You're offline.
      </h1>
      <p
        className="font-body"
        style={{
          fontSize: 13,
          color: tokens.inkSoft,
          lineHeight: 1.5,
          marginBottom: 32,
          maxWidth: 280,
          margin: "0 auto 32px",
        }}
      >
        Go online when you're ready to take orders. We'll never ping you while you're off.
      </p>

      {/* Today's earnings preview */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 24,
          textAlign: "left",
        }}
      >
        <div
          className="font-body"
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.inkSoft,
            marginBottom: 6,
          }}
        >
          Today so far
        </div>
        <div
          className="font-display"
          style={{
            fontSize: 28,
            fontWeight: 700,
            fontStyle: "italic",
            color: tokens.ink,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          $84.50
        </div>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            color: tokens.inkSoft,
            marginTop: 2,
          }}
        >
          7 deliveries · 3 hr 42 min online
        </div>
      </div>

      <button
        onClick={onGoOnline}
        style={{
          width: "100%",
          background: tokens.success,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 16,
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 12px 28px -10px rgba(47,82,52,0.5)",
        }}
      >
        <Power size={18} strokeWidth={2.2} />
        <span
          className="font-display"
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.005em",
          }}
        >
          Go online
        </span>
      </button>
    </div>
  );
}

function OnlineState({ onSimulateOffer, onGoOffline, tokens }) {
  return (
    <div>
      {/* Map */}
      <div
        style={{
          height: 280,
          background: `linear-gradient(180deg, ${tokens.kraft} 0%, ${tokens.kraftLight} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 390 280"
          style={{ position: "absolute", inset: 0 }}
          preserveAspectRatio="none"
        >
          {[40, 100, 160, 220].map((y, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={y}
              x2="390"
              y2={y}
              stroke={tokens.kraftDark}
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          {[60, 140, 220, 300].map((x, i) => (
            <line
              key={`v-${i}`}
              x1={x}
              y1="0"
              x2={x}
              y2="280"
              stroke={tokens.kraftDark}
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          <rect x="180" y="60" width="100" height="70" fill="#A8C09A" opacity="0.35" rx="4" />
        </svg>

        {/* Driver pin */}
        <div
          className="float-pin"
          style={{
            position: "absolute",
            top: 130,
            left: 175,
          }}
        >
          <div
            className="pulse-ring"
            style={{
              position: "relative",
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: tokens.success,
              border: `3px solid ${tokens.kraftLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.kraftLight,
              boxShadow: "0 6px 16px -4px rgba(47,82,52,0.5)",
            }}
          >
            <Truck size={18} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: tokens.kraftLight,
              border: `1px solid ${tokens.kraftDark}40`,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div
              className="font-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: tokens.inkSoft,
                marginBottom: 4,
              }}
            >
              Today
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontStyle: "italic",
                color: tokens.ink,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
              }}
            >
              $84.50
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 10,
                color: tokens.inkSoft,
                marginTop: 1,
              }}
            >
              7 deliveries
            </div>
          </div>
          <div
            style={{
              background: tokens.kraftLight,
              border: `1px solid ${tokens.kraftDark}40`,
              borderRadius: 12,
              padding: "12px 14px",
            }}
          >
            <div
              className="font-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: tokens.inkSoft,
                marginBottom: 4,
              }}
            >
              Online
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontStyle: "italic",
                color: tokens.ink,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
              }}
            >
              3h 42m
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 10,
                color: tokens.inkSoft,
                marginTop: 1,
              }}
            >
              ~$22.85/hr
            </div>
          </div>
        </div>

        {/* Waiting status */}
        <div
          style={{
            background: tokens.ink,
            color: tokens.kraftLight,
            borderRadius: 14,
            padding: "16px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            className="pulse-dot"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: tokens.successSoft,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              className="font-display"
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              Waiting for orders
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginTop: 2,
              }}
            >
              Average wait in Kanata · 4 min
            </div>
          </div>
        </div>

        {/* Demo trigger */}
        <button
          onClick={onSimulateOffer}
          style={{
            width: "100%",
            background: tokens.royalBlue,
            color: tokens.kraftLight,
            border: "none",
            borderRadius: 12,
            padding: "12px 18px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'Inter Tight', sans-serif",
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          ▷ DEMO: Simulate incoming order
        </button>

        <button
          onClick={onGoOffline}
          style={{
            width: "100%",
            background: "transparent",
            color: tokens.inkSoft,
            border: `1px solid ${tokens.kraftDark}80`,
            borderRadius: 12,
            padding: "10px 18px",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Inter Tight', sans-serif",
          }}
        >
          Go offline
        </button>
      </div>
    </div>
  );
}

function OfferState({ order, onAccept, onDecline, tokens }) {
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ padding: "20px 20px 0" }}>
      {/* Countdown */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 18,
        }}
      >
        <div
          className="font-display"
          style={{
            fontSize: 56,
            fontWeight: 700,
            fontStyle: "italic",
            color: tokens.royalBlue,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          {secondsLeft}s
        </div>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.inkSoft,
            marginTop: 4,
          }}
        >
          To accept
        </div>
      </div>

      {/* Pay block — guaranteed only */}
      <div
        style={{
          background: tokens.success,
          color: tokens.kraftLight,
          borderRadius: 16,
          padding: "18px 20px",
          marginBottom: 14,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 12px 28px -10px rgba(47,82,52,0.4)",
        }}
      >
        <div
          className="font-body"
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            opacity: 0.85,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Guaranteed pay
        </div>
        <div
          className="font-display"
          style={{
            fontSize: 42,
            fontWeight: 700,
            fontStyle: "italic",
            lineHeight: 1,
            letterSpacing: "-0.025em",
          }}
        >
          ${order.basePay.toFixed(2)}
        </div>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            opacity: 0.75,
            marginTop: 6,
          }}
        >
          + tip you'll see after delivery
        </div>
      </div>

      {/* Trip summary */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
            paddingBottom: 12,
            borderBottom: `1px solid ${tokens.kraftDark}30`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Navigation size={13} strokeWidth={2.2} style={{ color: tokens.royalBlue }} />
            <span
              className="font-display"
              style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", color: tokens.ink }}
            >
              {order.distance}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} strokeWidth={2.2} style={{ color: tokens.royalBlue }} />
            <span
              className="font-display"
              style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", color: tokens.ink }}
            >
              {order.duration}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={13} strokeWidth={2.2} style={{ color: tokens.royalBlue }} />
            <span
              className="font-display"
              style={{ fontSize: 14, fontWeight: 700, fontStyle: "italic", color: tokens.ink }}
            >
              {order.items} items
            </span>
          </div>
        </div>

        {/* Pickup */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tokens.ink,
              color: tokens.kraftLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Package size={14} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: tokens.inkSoft,
                marginBottom: 2,
              }}
            >
              Pickup
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: tokens.ink,
                lineHeight: 1.2,
              }}
            >
              {order.restaurant}
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 11,
                color: tokens.inkSoft,
                marginTop: 1,
              }}
            >
              {order.pickupAddress}
            </div>
          </div>
        </div>

        {/* Connector */}
        <div
          style={{
            marginLeft: 15,
            borderLeft: `2px dashed ${tokens.kraftDark}80`,
            height: 14,
            marginBottom: 4,
          }}
        />

        {/* Drop-off */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tokens.royalBlue,
              color: tokens.kraftLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Home size={14} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: tokens.inkSoft,
                marginBottom: 2,
              }}
            >
              Drop-off
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: tokens.ink,
                lineHeight: 1.2,
              }}
            >
              {order.customer}
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 11,
                color: tokens.inkSoft,
                marginTop: 1,
              }}
            >
              {order.dropoffAddress}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 8,
        }}
      >
        <button
          onClick={onDecline}
          style={{
            background: "transparent",
            color: tokens.inkSoft,
            border: `1.5px solid ${tokens.kraftDark}`,
            borderRadius: 16,
            padding: "16px 14px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "'Inter Tight', sans-serif",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <X size={16} strokeWidth={2.5} />
          Decline
        </button>
        <button
          onClick={onAccept}
          className="accept-btn"
          style={{
            background: tokens.royalBlue,
            color: tokens.kraftLight,
            border: "none",
            borderRadius: 16,
            padding: "16px 18px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Check size={18} strokeWidth={2.5} />
          <span
            className="font-display"
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            Accept order
          </span>
        </button>
      </div>
    </div>
  );
}

function ToPickupState({ order, onArrive, tokens }) {
  return (
    <div>
      {/* Map placeholder */}
      <div
        style={{
          height: 200,
          background: `linear-gradient(180deg, ${tokens.kraft} 0%, ${tokens.kraftLight} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 390 200"
          style={{ position: "absolute", inset: 0 }}
          preserveAspectRatio="none"
        >
          {[50, 100, 150].map((y, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={y}
              x2="390"
              y2={y}
              stroke={tokens.kraftDark}
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          <path
            d="M 50 160 Q 130 160, 130 100 T 240 60 Q 300 50, 340 70"
            stroke={tokens.royalBlue}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Driver pin */}
        <div className="float-pin" style={{ position: "absolute", top: 140, left: 35 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tokens.royalBlue,
              border: `3px solid ${tokens.kraftLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.kraftLight,
              boxShadow: "0 4px 10px -2px rgba(30,58,138,0.4)",
            }}
          >
            <Truck size={16} strokeWidth={2.2} />
          </div>
        </div>

        {/* Restaurant pin */}
        <div style={{ position: "absolute", top: 50, left: 320 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tokens.ink,
              border: `3px solid ${tokens.kraftLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.kraftLight,
              boxShadow: "0 4px 8px -2px rgba(0,0,0,0.25)",
            }}
          >
            <Package size={16} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 20px 0" }}>
        {/* ETA */}
        <div
          style={{
            background: tokens.ink,
            color: tokens.kraftLight,
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: tokens.royalBlue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={20} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                opacity: 0.7,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              Pickup at
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 17,
                fontWeight: 600,
                fontStyle: "italic",
                lineHeight: 1.15,
              }}
            >
              {order.restaurant}
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginTop: 2,
              }}
            >
              {order.pickupAddress} · 4 min away
            </div>
          </div>
        </div>

        {/* Pickup note — surfaced prominently */}
        <div
          style={{
            background: tokens.warning + "18",
            border: `1.5px solid ${tokens.warning}80`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div
            className="font-body"
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: tokens.warning,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <AlertCircle size={11} strokeWidth={2.5} />
            Restaurant note
          </div>
          <p
            className="font-display"
            style={{
              fontSize: 15,
              fontStyle: "italic",
              color: tokens.ink,
              lineHeight: 1.4,
              margin: 0,
              fontWeight: 500,
            }}
          >
            "{order.pickupNote}"
          </p>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <button
            style={{
              background: tokens.kraftLight,
              border: `1.5px solid ${tokens.kraftDark}`,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: tokens.ink,
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Phone size={14} strokeWidth={2.2} />
            Call restaurant
          </button>
          <button
            style={{
              background: tokens.royalBlue,
              color: tokens.kraftLight,
              border: "none",
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Navigation size={14} strokeWidth={2.2} />
            Open in Maps
          </button>
        </div>

        <button
          onClick={onArrive}
          style={{
            width: "100%",
            background: tokens.warning,
            color: tokens.kraftLight,
            border: "none",
            borderRadius: 16,
            padding: "16px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 12px 28px -10px rgba(201,123,31,0.5)",
          }}
        >
          <MapPin size={18} strokeWidth={2.2} />
          <span
            className="font-display"
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            I've arrived
          </span>
        </button>
      </div>
    </div>
  );
}

function AtPickupState({ order, photoTaken, onPhoto, onPickedUp, tokens }) {
  return (
    <div style={{ padding: "20px 20px 0" }}>
      {/* Header */}
      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.warning,
          marginBottom: 8,
        }}
      >
        At {order.restaurant}
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          marginBottom: 6,
        }}
      >
        Confirm{" "}
        <span style={{ fontStyle: "italic" }}>order #{order.id.split("-")[1]}</span>
      </h1>
      <p
        className="font-body"
        style={{
          fontSize: 13,
          color: tokens.inkSoft,
          lineHeight: 1.5,
          marginBottom: 22,
        }}
      >
        {order.items} items for {order.customer}. Take a photo of the bag before leaving.
      </p>

      {/* Photo capture */}
      <button
        onClick={onPhoto}
        style={{
          width: "100%",
          background: photoTaken ? tokens.success + "12" : tokens.kraftLight,
          border: `2px ${photoTaken ? "solid" : "dashed"} ${
            photoTaken ? tokens.success : tokens.kraftDark
          }`,
          borderRadius: 18,
          padding: "32px 20px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          color: tokens.ink,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: photoTaken ? tokens.success : tokens.royalBlue,
            color: tokens.kraftLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoTaken ? <Check size={26} strokeWidth={3} /> : <Camera size={24} strokeWidth={2.2} />}
        </div>
        <div>
          <div
            className="font-display"
            style={{
              fontSize: 17,
              fontWeight: 600,
              fontStyle: "italic",
              color: photoTaken ? tokens.success : tokens.ink,
              textAlign: "center",
            }}
          >
            {photoTaken ? "Pickup photo saved" : "Take pickup photo"}
          </div>
          {!photoTaken && (
            <div
              className="font-body"
              style={{
                fontSize: 11,
                color: tokens.inkSoft,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              One quick shot of the sealed bag
            </div>
          )}
        </div>
      </button>

      {/* Mark picked up */}
      <button
        onClick={onPickedUp}
        disabled={!photoTaken}
        style={{
          width: "100%",
          background: photoTaken ? tokens.royalBlue : tokens.kraftDark,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 16,
          padding: "16px 20px",
          cursor: photoTaken ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: photoTaken ? "0 12px 28px -10px rgba(30,58,138,0.5)" : "none",
          opacity: photoTaken ? 1 : 0.6,
          transition: "all 0.2s ease",
        }}
      >
        <Package size={18} strokeWidth={2.2} />
        <span
          className="font-display"
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.005em",
          }}
        >
          I have the order
        </span>
      </button>

      {!photoTaken && (
        <p
          className="font-body"
          style={{
            fontSize: 11,
            color: tokens.inkSoft,
            textAlign: "center",
            marginTop: 10,
            fontStyle: "italic",
          }}
        >
          Photo required before continuing
        </p>
      )}
    </div>
  );
}

function ToDropoffState({ order, onArrive, tokens }) {
  return (
    <div>
      {/* Map placeholder */}
      <div
        style={{
          height: 200,
          background: `linear-gradient(180deg, ${tokens.kraft} 0%, ${tokens.kraftLight} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 390 200"
          style={{ position: "absolute", inset: 0 }}
          preserveAspectRatio="none"
        >
          {[50, 100, 150].map((y, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={y}
              x2="390"
              y2={y}
              stroke={tokens.kraftDark}
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}
          <path
            d="M 340 60 Q 280 80, 240 110 T 100 130 Q 70 140, 50 160"
            stroke={tokens.royalBlue}
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        <div className="float-pin" style={{ position: "absolute", top: 100, left: 230 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tokens.royalBlue,
              border: `3px solid ${tokens.kraftLight}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.kraftLight,
              boxShadow: "0 4px 10px -2px rgba(30,58,138,0.4)",
            }}
          >
            <Truck size={16} strokeWidth={2.2} />
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 25, left: 35 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: tokens.kraftLight,
              border: `3px solid ${tokens.ink}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: tokens.ink,
              boxShadow: "0 4px 8px -2px rgba(0,0,0,0.2)",
            }}
          >
            <Home size={16} strokeWidth={2.2} />
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 20px 0" }}>
        <div
          style={{
            background: tokens.ink,
            color: tokens.kraftLight,
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: tokens.royalBlue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Home size={20} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-body"
              style={{
                fontSize: 9,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                opacity: 0.7,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              Drop-off to
            </div>
            <div
              className="font-display"
              style={{
                fontSize: 17,
                fontWeight: 600,
                fontStyle: "italic",
                lineHeight: 1.15,
              }}
            >
              {order.customer}
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginTop: 2,
              }}
            >
              {order.dropoffAddress} · 6 min away
            </div>
          </div>
        </div>

        <div
          style={{
            background: tokens.kraft + "60",
            border: `1px solid ${tokens.kraftDark}80`,
            borderRadius: 14,
            padding: "14px 16px",
            marginBottom: 14,
          }}
        >
          <div
            className="font-body"
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: tokens.royalBlue,
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Info size={11} strokeWidth={2.5} />
            Drop-off note
          </div>
          <p
            className="font-display"
            style={{
              fontSize: 14,
              fontStyle: "italic",
              color: tokens.ink,
              lineHeight: 1.4,
              margin: 0,
              fontWeight: 500,
            }}
          >
            "{order.dropoffNote}"
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <button
            style={{
              background: tokens.kraftLight,
              border: `1.5px solid ${tokens.kraftDark}`,
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: tokens.ink,
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <MessageCircle size={14} strokeWidth={2.2} />
            Message {order.customer.split(" ")[0]}
          </button>
          <button
            style={{
              background: tokens.royalBlue,
              color: tokens.kraftLight,
              border: "none",
              borderRadius: 14,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Inter Tight', sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Navigation size={14} strokeWidth={2.2} />
            Open in Maps
          </button>
        </div>

        <button
          onClick={onArrive}
          style={{
            width: "100%",
            background: tokens.warning,
            color: tokens.kraftLight,
            border: "none",
            borderRadius: 16,
            padding: "16px 20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 12px 28px -10px rgba(201,123,31,0.5)",
          }}
        >
          <MapPin size={18} strokeWidth={2.2} />
          <span
            className="font-display"
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.005em",
            }}
          >
            I've arrived
          </span>
        </button>
      </div>
    </div>
  );
}

function Info({ size, strokeWidth, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} style={style}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function AtDropoffState({ order, photoTaken, onPhoto, onDelivered, tokens }) {
  return (
    <div style={{ padding: "20px 20px 0" }}>
      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.warning,
          marginBottom: 8,
        }}
      >
        At drop-off
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 26,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          marginBottom: 6,
        }}
      >
        Confirm{" "}
        <span style={{ fontStyle: "italic" }}>delivery</span>
      </h1>
      <p
        className="font-body"
        style={{
          fontSize: 13,
          color: tokens.inkSoft,
          lineHeight: 1.5,
          marginBottom: 14,
        }}
      >
        For {order.customer} at {order.dropoffAddress}.
      </p>

      {/* Drop-off note reminder */}
      <div
        style={{
          background: tokens.kraft + "70",
          border: `1px solid ${tokens.kraftDark}80`,
          borderRadius: 12,
          padding: "10px 14px",
          marginBottom: 18,
        }}
      >
        <p
          className="font-display"
          style={{
            fontSize: 13,
            fontStyle: "italic",
            color: tokens.ink,
            lineHeight: 1.4,
            margin: 0,
            fontWeight: 500,
          }}
        >
          "{order.dropoffNote}"
        </p>
      </div>

      {/* Photo capture */}
      <button
        onClick={onPhoto}
        style={{
          width: "100%",
          background: photoTaken ? tokens.success + "12" : tokens.kraftLight,
          border: `2px ${photoTaken ? "solid" : "dashed"} ${
            photoTaken ? tokens.success : tokens.kraftDark
          }`,
          borderRadius: 18,
          padding: "32px 20px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          color: tokens.ink,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: photoTaken ? tokens.success : tokens.royalBlue,
            color: tokens.kraftLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoTaken ? <Check size={26} strokeWidth={3} /> : <Camera size={24} strokeWidth={2.2} />}
        </div>
        <div>
          <div
            className="font-display"
            style={{
              fontSize: 17,
              fontWeight: 600,
              fontStyle: "italic",
              color: photoTaken ? tokens.success : tokens.ink,
              textAlign: "center",
            }}
          >
            {photoTaken ? "Drop-off photo saved" : "Take drop-off photo"}
          </div>
          {!photoTaken && (
            <div
              className="font-body"
              style={{
                fontSize: 11,
                color: tokens.inkSoft,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Show where you left the order
            </div>
          )}
        </div>
      </button>

      <button
        onClick={onDelivered}
        disabled={!photoTaken}
        style={{
          width: "100%",
          background: photoTaken ? tokens.success : tokens.kraftDark,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 16,
          padding: "16px 20px",
          cursor: photoTaken ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: photoTaken ? "0 12px 28px -10px rgba(47,82,52,0.5)" : "none",
          opacity: photoTaken ? 1 : 0.6,
          transition: "all 0.2s ease",
        }}
      >
        <Check size={18} strokeWidth={2.5} />
        <span
          className="font-display"
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.005em",
          }}
        >
          Mark as delivered
        </span>
      </button>

      {!photoTaken && (
        <p
          className="font-body"
          style={{
            fontSize: 11,
            color: tokens.inkSoft,
            textAlign: "center",
            marginTop: 10,
            fontStyle: "italic",
          }}
        >
          Photo required before continuing
        </p>
      )}
    </div>
  );
}

function CompleteState({ order, onNext, tokens }) {
  return (
    <div style={{ padding: "32px 24px 0", textAlign: "center" }}>
      {/* Big check */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: tokens.success,
          color: tokens.kraftLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "20px auto 24px",
          boxShadow: "0 16px 32px -12px rgba(47,82,52,0.5)",
        }}
      >
        <Check size={42} strokeWidth={3} />
      </div>

      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.success,
          marginBottom: 8,
        }}
      >
        Delivered
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
          marginBottom: 24,
        }}
      >
        Nice work.
      </h1>

      {/* Earnings reveal — tip now visible */}
      <div
        style={{
          background: tokens.success,
          color: tokens.kraftLight,
          borderRadius: 18,
          padding: "20px 22px",
          marginBottom: 16,
          textAlign: "left",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 16px 32px -12px rgba(47,82,52,0.4)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -30,
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `1px solid ${tokens.kraftLight}`,
            opacity: 0.15,
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            className="font-body"
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              opacity: 0.85,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            You earned
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span
              className="font-display"
              style={{
                fontSize: 48,
                fontWeight: 700,
                fontStyle: "italic",
                lineHeight: 1,
                letterSpacing: "-0.025em",
              }}
            >
              ${order.total.toFixed(2)}
            </span>
          </div>

          {/* Breakdown */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              paddingTop: 12,
              borderTop: `1px solid ${tokens.kraftLight}30`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                className="font-body"
                style={{ fontSize: 12, opacity: 0.85 }}
              >
                Base pay
              </span>
              <span
                className="font-body"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                ${order.basePay.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                className="font-body"
                style={{
                  fontSize: 12,
                  opacity: 0.85,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Heart size={11} strokeWidth={2.2} fill={tokens.kraftLight} />
                Tip from {order.customer.split(" ")[0]}
              </span>
              <span
                className="font-body"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                ${order.tip.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today total */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div
            className="font-body"
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: tokens.inkSoft,
              marginBottom: 2,
            }}
          >
            Today total
          </div>
          <div
            className="font-display"
            style={{
              fontSize: 22,
              fontWeight: 700,
              fontStyle: "italic",
              color: tokens.ink,
              letterSpacing: "-0.015em",
              lineHeight: 1.1,
            }}
          >
            $97.50
          </div>
          <div
            className="font-body"
            style={{
              fontSize: 11,
              color: tokens.inkSoft,
              marginTop: 1,
            }}
          >
            8 deliveries · ~$25.10/hr
          </div>
        </div>
        <ChevronRight size={18} strokeWidth={2} style={{ color: tokens.inkSoft }} />
      </div>

      <button
        onClick={onNext}
        style={{
          width: "100%",
          background: tokens.royalBlue,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 16,
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
          marginBottom: 8,
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.005em",
          }}
        >
          Ready for next order
        </span>
        <ArrowRight size={18} strokeWidth={2.2} />
      </button>

      <button
        className="font-body"
        style={{
          width: "100%",
          background: "transparent",
          color: tokens.inkSoft,
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          padding: "10px",
        }}
      >
        Take a break →
      </button>
    </div>
  );
}
