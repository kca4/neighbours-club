import React, { useState, useEffect } from "react";
import {
  Bell,
  Clock,
  Check,
  X,
  ChefHat,
  Truck,
  AlertCircle,
  Volume2,
  VolumeX,
  Pause,
  Play,
  ChevronRight,
  MessageSquare,
  Flame,
  TrendingUp,
  Settings,
  Wifi,
  Zap,
  ZapOff,
} from "lucide-react";

export default function KitchenDashboard() {
  const [soundOn, setSoundOn] = useState(true);
  const [paused, setPaused] = useState(false);
  const [smartAcceptOn, setSmartAcceptOn] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("N-1842");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

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
  const warning = "#C97B1F";
  const danger = "#A8341B";

  // Mock orders
  const orders = [
    {
      id: "N-1842",
      status: "incoming",
      countdown: 22,
      placed: "7:02 PM",
      customer: "Marc D.",
      driver: null,
      items: [
        { qty: 1, name: "Tonkotsu Classic", note: "No green onion" },
        { qty: 1, name: "Spicy Miso", note: null },
        { qty: 1, name: "Pork Gyoza (5)", note: null },
      ],
      total: 51.27,
      payout: 36.38,
      note: "Allergic to sesame — please confirm no sesame oil.",
    },
    {
      id: "N-1841",
      status: "cooking",
      countdown: 8,
      placed: "6:54 PM",
      customer: "Priya S.",
      driver: { name: "Maya", eta: "4 min" },
      items: [
        { qty: 2, name: "Vegetable Shoyu", note: null },
        { qty: 1, name: "Edamame", note: null },
      ],
      total: 41.5,
      payout: 29.45,
      note: null,
    },
    {
      id: "N-1840",
      status: "ready",
      countdown: 0,
      placed: "6:48 PM",
      customer: "Jen K.",
      driver: { name: "Rashid", eta: "Here" },
      items: [
        { qty: 1, name: "Shoyu Ramen", note: null },
        { qty: 1, name: "Chicken Karaage", note: "Extra lemon" },
      ],
      total: 32.0,
      payout: 22.72,
      note: null,
    },
    {
      id: "N-1839",
      status: "out",
      countdown: 0,
      placed: "6:35 PM",
      customer: "Tom L.",
      driver: { name: "Maya", eta: "On the way" },
      items: [{ qty: 1, name: "Tonkotsu Classic", note: null }],
      total: 19.5,
      payout: 13.85,
      note: null,
    },
  ];

  const incoming = orders.filter((o) => o.status === "incoming");
  const cooking = orders.filter((o) => o.status === "cooking");
  const ready = orders.filter((o) => o.status === "ready");

  const todayCount = 42;
  const todayRevenue = 1184.5;

  // Threshold for smart accept (orders in queue)
  const queueLoad = incoming.length + cooking.length;
  const overThreshold = queueLoad >= 4;

  const statusColors = {
    incoming: { bg: royalBlue, fg: kraftLight, label: "New" },
    cooking: { bg: warning, fg: kraftLight, label: "Cooking" },
    ready: { bg: success, fg: kraftLight, label: "Ready" },
    out: { bg: kraftDark, fg: ink, label: "Out for delivery" },
  };

  const sel = orders.find((o) => o.id === selectedOrder) || orders[0];

  const formatTime = (d) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

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

        .tablet-frame {
          width: 1024px;
          height: 720px;
          background: ${ink};
          border-radius: 24px;
          padding: 14px;
          box-shadow:
            0 60px 120px -30px rgba(26, 24, 20, 0.5),
            0 30px 60px -30px rgba(26, 24, 20, 0.4);
          position: relative;
          max-width: 100%;
          max-height: 95vh;
        }
        .tablet-screen {
          width: 100%;
          height: 100%;
          background: ${kraftLight};
          border-radius: 14px;
          overflow: hidden;
          position: relative;
          display: grid;
          grid-template-columns: 64px 1fr 380px;
        }

        .scroll-hide {
          scrollbar-width: thin;
          scrollbar-color: ${kraftDark} transparent;
        }
        .scroll-hide::-webkit-scrollbar { width: 6px; }
        .scroll-hide::-webkit-scrollbar-track { background: transparent; }
        .scroll-hide::-webkit-scrollbar-thumb { background: ${kraftDark}; border-radius: 999px; }

        .order-card {
          transition: all 0.2s ease;
        }
        .order-card:hover { transform: translateY(-1px); }
        .order-card.selected {
          box-shadow: 0 0 0 2px ${royalBlue}, 0 8px 20px -8px rgba(30,58,138,0.3);
        }

        .pulse-ring::before {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          border: 2px solid ${royalBlue};
          opacity: 0.4;
          animation: ring 2s ease-out infinite;
          pointer-events: none;
        }
        @keyframes ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.08); opacity: 0; }
        }

        .pulse-dot {
          animation: pulseDot 1.4s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .countdown-bar {
          height: 4px;
          background: ${kraftDark}40;
          border-radius: 999px;
          overflow: hidden;
        }
        .countdown-bar-fill {
          height: 100%;
          background: ${royalBlue};
          border-radius: 999px;
          transition: width 1s ease;
        }

        .nav-btn {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .nav-btn:hover { transform: scale(1.05); }
      `}</style>

      <div className="tablet-frame">
        <div className="tablet-screen">
          {/* LEFT RAIL */}
          <div
            style={{
              background: ink,
              padding: "14px 10px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Logo */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: royalBlue,
                color: kraftLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 4,
                border: `1px solid ${kraft}30`,
              }}
            >
              N
            </div>

            {/* Nav buttons */}
            <button
              className="nav-btn"
              style={{
                background: royalBlue,
                color: kraftLight,
              }}
              title="Kitchen"
            >
              <ChefHat size={20} strokeWidth={2.2} />
            </button>
            <button
              className="nav-btn"
              style={{
                background: "transparent",
                color: kraftLight + "AA",
              }}
              title="Reports"
            >
              <TrendingUp size={20} strokeWidth={2.2} />
            </button>
            <button
              className="nav-btn"
              style={{
                background: "transparent",
                color: kraftLight + "AA",
              }}
              title="Menu"
            >
              <MessageSquare size={20} strokeWidth={2.2} />
            </button>
            <button
              className="nav-btn"
              style={{
                background: "transparent",
                color: kraftLight + "AA",
              }}
              title="Settings"
            >
              <Settings size={20} strokeWidth={2.2} />
            </button>

            <div style={{ flex: 1 }} />

            {/* Connection status */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: success + "30",
                color: "#7BC97D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
              title="Connected"
            >
              <Wifi size={18} strokeWidth={2.2} />
              <span
                className="pulse-dot"
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#7BC97D",
                }}
              />
            </div>

            {/* Yuki avatar */}
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${accent}, ${danger})`,
                color: kraftLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Fraunces', serif",
                fontStyle: "italic",
                fontWeight: 700,
                fontSize: 16,
                border: `2px solid ${kraft}40`,
              }}
            >
              Y
            </div>
          </div>

          {/* CENTER — ORDER COLUMNS */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Top bar */}
            <div
              style={{
                padding: "14px 20px 12px",
                borderBottom: `1px solid ${kraftDark}40`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: ink,
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Maïko Ramen
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    color: inkSoft,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Monday · {formatTime(now)}</span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: paused ? warning : success,
                      }}
                    />
                    {paused ? "Paused" : "Open & taking orders"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {/* Smart accept toggle */}
                <button
                  onClick={() => setSmartAcceptOn(!smartAcceptOn)}
                  className="font-body"
                  style={{
                    background: smartAcceptOn ? royalBlue : "transparent",
                    color: smartAcceptOn ? kraftLight : inkSoft,
                    border: smartAcceptOn
                      ? "none"
                      : `1px solid ${kraftDark}80`,
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    letterSpacing: "0.05em",
                  }}
                  title="Smart accept: auto under load, manual when busy"
                >
                  {smartAcceptOn ? (
                    <Zap size={13} strokeWidth={2.5} fill={kraftLight} />
                  ) : (
                    <ZapOff size={13} strokeWidth={2.5} />
                  )}
                  Smart Accept
                  {smartAcceptOn && overThreshold && (
                    <span
                      style={{
                        background: warning,
                        color: ink,
                        fontSize: 9,
                        padding: "2px 5px",
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                    >
                      MANUAL
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setSoundOn(!soundOn)}
                  className="nav-btn"
                  style={{
                    background: kraftLight,
                    color: ink,
                    border: `1px solid ${kraftDark}80`,
                    width: 36,
                    height: 36,
                  }}
                >
                  {soundOn ? (
                    <Volume2 size={16} strokeWidth={2.2} />
                  ) : (
                    <VolumeX size={16} strokeWidth={2.2} />
                  )}
                </button>

                <button
                  onClick={() => setPaused(!paused)}
                  className="nav-btn"
                  style={{
                    background: paused ? warning : kraftLight,
                    color: paused ? kraftLight : ink,
                    border: paused ? "none" : `1px solid ${kraftDark}80`,
                    width: 36,
                    height: 36,
                  }}
                >
                  {paused ? (
                    <Play size={15} strokeWidth={2.2} fill={kraftLight} />
                  ) : (
                    <Pause size={15} strokeWidth={2.2} />
                  )}
                </button>
              </div>
            </div>

            {/* Stats strip */}
            <div
              style={{
                padding: "10px 20px",
                borderBottom: `1px solid ${kraftDark}40`,
                display: "flex",
                gap: 18,
                alignItems: "center",
                background: kraft + "30",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: inkSoft,
                    fontWeight: 700,
                  }}
                >
                  Today
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: ink,
                    lineHeight: 1.1,
                  }}
                >
                  {todayCount} orders
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  height: 32,
                  background: kraftDark,
                  opacity: 0.5,
                }}
              />
              <div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: inkSoft,
                    fontWeight: 700,
                  }}
                >
                  Revenue
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: ink,
                    lineHeight: 1.1,
                  }}
                >
                  ${todayRevenue.toFixed(2)}
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  height: 32,
                  background: kraftDark,
                  opacity: 0.5,
                }}
              />
              <div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: inkSoft,
                    fontWeight: 700,
                  }}
                >
                  Queue load
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: overThreshold ? warning : ink,
                    lineHeight: 1.1,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {queueLoad} active
                  {overThreshold && (
                    <Flame size={14} strokeWidth={2.5} style={{ color: warning }} />
                  )}
                </div>
              </div>

              <div style={{ flex: 1 }} />

              {overThreshold && smartAcceptOn && (
                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    color: warning,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: warning + "15",
                    padding: "6px 10px",
                    borderRadius: 8,
                  }}
                >
                  <AlertCircle size={13} strokeWidth={2.2} />
                  You're busy — switched to manual accept
                </div>
              )}
            </div>

            {/* THREE COLUMNS */}
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1,
                background: kraftDark + "40",
                overflow: "hidden",
              }}
            >
              {/* INCOMING */}
              <Column
                title="Incoming"
                count={incoming.length}
                color={royalBlue}
                background={kraftLight}
              >
                {incoming.map((order) => (
                  <IncomingCard
                    key={order.id}
                    order={order}
                    selected={selectedOrder === order.id}
                    onSelect={() => setSelectedOrder(order.id)}
                    smartAcceptOn={smartAcceptOn}
                    overThreshold={overThreshold}
                    tokens={{
                      royalBlue,
                      kraft,
                      kraftLight,
                      kraftDark,
                      ink,
                      inkSoft,
                      success,
                      warning,
                      danger,
                    }}
                  />
                ))}
                {incoming.length === 0 && (
                  <EmptyState
                    text="Nothing incoming"
                    sub="You're caught up"
                    tokens={{ kraftDark, inkSoft }}
                  />
                )}
              </Column>

              {/* COOKING */}
              <Column
                title="Cooking"
                count={cooking.length}
                color={warning}
                background={kraftLight}
              >
                {cooking.map((order) => (
                  <CookingCard
                    key={order.id}
                    order={order}
                    selected={selectedOrder === order.id}
                    onSelect={() => setSelectedOrder(order.id)}
                    tokens={{
                      royalBlue,
                      kraft,
                      kraftLight,
                      kraftDark,
                      ink,
                      inkSoft,
                      warning,
                    }}
                  />
                ))}
                {cooking.length === 0 && (
                  <EmptyState
                    text="No active orders"
                    sub="—"
                    tokens={{ kraftDark, inkSoft }}
                  />
                )}
              </Column>

              {/* READY */}
              <Column
                title="Ready for pickup"
                count={ready.length}
                color={success}
                background={kraftLight}
              >
                {ready.map((order) => (
                  <ReadyCard
                    key={order.id}
                    order={order}
                    selected={selectedOrder === order.id}
                    onSelect={() => setSelectedOrder(order.id)}
                    tokens={{
                      royalBlue,
                      kraft,
                      kraftLight,
                      kraftDark,
                      ink,
                      inkSoft,
                      success,
                    }}
                  />
                ))}
                {ready.length === 0 && (
                  <EmptyState
                    text="Nothing ready"
                    sub="—"
                    tokens={{ kraftDark, inkSoft }}
                  />
                )}
              </Column>
            </div>
          </div>

          {/* RIGHT — DETAIL PANEL */}
          <div
            style={{
              background: kraftLight,
              borderLeft: `1px solid ${kraftDark}40`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Detail header */}
            <div
              style={{
                padding: "16px 18px 14px",
                borderBottom: `1px solid ${kraftDark}40`,
                background: ink,
                color: kraftLight,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -50,
                  right: -30,
                  fontSize: 100,
                  fontFamily: "'Fraunces', serif",
                  fontStyle: "italic",
                  fontWeight: 700,
                  color: royalBlue,
                  opacity: 0.4,
                  lineHeight: 1,
                  pointerEvents: "none",
                }}
              >
                #{sel.id.split("-")[1]}
              </div>

              <div style={{ position: "relative" }}>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    opacity: 0.7,
                    marginBottom: 4,
                  }}
                >
                  Order {sel.id}
                </div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontStyle: "italic",
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {sel.customer}
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    opacity: 0.7,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span>Placed {sel.placed}</span>
                  <span
                    style={{
                      padding: "2px 7px",
                      background: statusColors[sel.status].bg,
                      color: statusColors[sel.status].fg,
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    {statusColors[sel.status].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="scroll-hide" style={{ flex: 1, overflowY: "auto" }}>
              {/* CUSTOMER NOTE — surfaced at top, prominently */}
              {sel.note && (
                <div
                  style={{
                    margin: "14px 14px 0",
                    background: warning + "18",
                    border: `1px solid ${warning}80`,
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    className="font-body"
                    style={{
                      fontSize: 9,
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: warning,
                      fontWeight: 700,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <AlertCircle size={11} strokeWidth={2.5} />
                    Note from customer
                  </div>
                  <p
                    className="font-display"
                    style={{
                      fontSize: 14,
                      fontStyle: "italic",
                      color: ink,
                      lineHeight: 1.4,
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    "{sel.note}"
                  </p>
                </div>
              )}

              {/* Items */}
              <div style={{ padding: "16px 14px 8px" }}>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: royalBlue,
                    marginBottom: 10,
                  }}
                >
                  Items ({sel.items.length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sel.items.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: kraftLight,
                        border: `1px solid ${kraftDark}50`,
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <div
                          className="font-display"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: ink,
                            lineHeight: 1.2,
                          }}
                        >
                          <span
                            style={{
                              fontStyle: "italic",
                              color: royalBlue,
                              marginRight: 6,
                            }}
                          >
                            {item.qty}×
                          </span>
                          {item.name}
                        </div>
                      </div>
                      {item.note && (
                        <div
                          className="font-body"
                          style={{
                            fontSize: 11,
                            color: warning,
                            marginTop: 4,
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <AlertCircle size={10} strokeWidth={2.5} />
                          {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver assignment */}
              <div style={{ padding: "8px 14px 8px" }}>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: royalBlue,
                    marginBottom: 10,
                  }}
                >
                  Driver
                </div>
                {sel.driver ? (
                  <div
                    style={{
                      background: kraftLight,
                      border: `1px solid ${kraftDark}50`,
                      borderRadius: 10,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${royalBlue}, ${royalBlueDeep})`,
                        color: kraftLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                      }}
                    >
                      {sel.driver.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="font-display"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: ink,
                          lineHeight: 1.2,
                        }}
                      >
                        {sel.driver.name}
                      </div>
                      <div
                        className="font-body"
                        style={{
                          fontSize: 11,
                          color: inkSoft,
                          marginTop: 1,
                        }}
                      >
                        {sel.driver.eta}
                      </div>
                    </div>
                    <Truck
                      size={16}
                      strokeWidth={2}
                      style={{ color: royalBlue }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: kraft + "60",
                      border: `1px dashed ${kraftDark}`,
                      borderRadius: 10,
                      padding: "12px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      className="font-body"
                      style={{
                        fontSize: 11,
                        color: inkSoft,
                        fontStyle: "italic",
                      }}
                    >
                      Driver assigned when order accepted
                    </div>
                  </div>
                )}
              </div>

              {/* Payout breakdown */}
              <div style={{ padding: "8px 14px 14px" }}>
                <div
                  className="font-body"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: royalBlue,
                    marginBottom: 10,
                  }}
                >
                  Your payout
                </div>
                <div
                  style={{
                    background: success,
                    color: kraftLight,
                    borderRadius: 12,
                    padding: "14px 14px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      className="font-body"
                      style={{
                        fontSize: 11,
                        opacity: 0.85,
                      }}
                    >
                      Order total
                    </span>
                    <span
                      className="font-body"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      ${sel.total.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      className="font-body"
                      style={{ fontSize: 11, opacity: 0.85 }}
                    >
                      Neighbors fee
                    </span>
                    <span
                      className="font-body"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      −${(sel.total - sel.payout).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      borderTop: `1px solid ${kraftLight}30`,
                      paddingTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      className="font-display"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fontStyle: "italic",
                      }}
                    >
                      You receive
                    </span>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 22,
                        fontWeight: 700,
                        fontStyle: "italic",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      ${sel.payout.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action footer */}
            <div
              style={{
                padding: "14px 14px 16px",
                borderTop: `1px solid ${kraftDark}40`,
                display: "flex",
                gap: 8,
                background: kraft + "30",
              }}
            >
              {sel.status === "incoming" ? (
                <>
                  <button
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: `1.5px solid ${kraftDark}`,
                      color: inkSoft,
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Inter Tight', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <X size={15} strokeWidth={2.5} />
                    Reject
                  </button>
                  <button
                    style={{
                      flex: 2,
                      background: royalBlue,
                      border: "none",
                      color: kraftLight,
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Inter Tight', sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      boxShadow: "0 6px 16px -6px rgba(30,58,138,0.5)",
                    }}
                  >
                    <Check size={15} strokeWidth={2.5} />
                    Accept · Start cooking
                  </button>
                </>
              ) : sel.status === "cooking" ? (
                <button
                  style={{
                    flex: 1,
                    background: success,
                    border: "none",
                    color: kraftLight,
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Inter Tight', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    boxShadow: "0 6px 16px -6px rgba(47,82,52,0.5)",
                  }}
                >
                  <Check size={15} strokeWidth={2.5} />
                  Mark ready for pickup
                </button>
              ) : sel.status === "ready" ? (
                <button
                  style={{
                    flex: 1,
                    background: ink,
                    border: "none",
                    color: kraftLight,
                    borderRadius: 12,
                    padding: "12px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "'Inter Tight', sans-serif",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Truck size={15} strokeWidth={2.5} />
                  Handed to driver
                </button>
              ) : (
                <div
                  className="font-body"
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontSize: 11,
                    color: inkSoft,
                    fontStyle: "italic",
                    padding: "10px",
                  }}
                >
                  Out for delivery — nothing to do here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Sub-components ==============

function Column({ title, count, color, background, children }) {
  return (
    <div
      style={{
        background,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `2px solid ${color}`,
        }}
      >
        <span
          className="font-body"
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color,
          }}
        >
          {title}
        </span>
        <span
          className="font-display"
          style={{
            fontSize: 16,
            fontStyle: "italic",
            fontWeight: 700,
            color,
            lineHeight: 1,
          }}
        >
          {count}
        </span>
      </div>
      <div
        className="scroll-hide"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function IncomingCard({ order, selected, onSelect, smartAcceptOn, overThreshold, tokens }) {
  const willAutoAccept = smartAcceptOn && !overThreshold;

  return (
    <div
      onClick={onSelect}
      className={`order-card ${selected ? "selected" : ""}`}
      style={{
        background: tokens.kraftLight,
        border: `1px solid ${tokens.kraftDark}80`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div className="pulse-ring" style={{ borderRadius: 12 }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: tokens.ink,
            fontStyle: "italic",
          }}
        >
          {order.id}
        </span>
        <span
          className="font-body"
          style={{
            fontSize: 10,
            color: tokens.royalBlue,
            fontWeight: 700,
          }}
        >
          {willAutoAccept ? "AUTO" : "DECIDE"}
        </span>
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {order.customer}
      </div>
      <div
        className="font-body"
        style={{
          fontSize: 11,
          color: tokens.inkSoft,
          marginBottom: 6,
        }}
      >
        {order.items.length} items · ${order.total.toFixed(2)}
      </div>
      {order.note && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: tokens.warning + "20",
            color: tokens.warning,
            padding: "4px 6px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 600,
            fontFamily: "'Inter Tight', sans-serif",
          }}
        >
          <AlertCircle size={11} strokeWidth={2.5} />
          Has note
        </div>
      )}
    </div>
  );
}

function CookingCard({ order, selected, onSelect, tokens }) {
  const minLeft = order.countdown;
  const totalCookMin = 15;
  const elapsed = totalCookMin - minLeft;
  const progressPct = Math.min(100, (elapsed / totalCookMin) * 100);

  return (
    <div
      onClick={onSelect}
      className={`order-card ${selected ? "selected" : ""}`}
      style={{
        background: tokens.kraftLight,
        border: `1px solid ${tokens.kraftDark}80`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: tokens.ink,
            fontStyle: "italic",
          }}
        >
          {order.id}
        </span>
        <span
          className="font-display"
          style={{
            fontSize: 13,
            fontWeight: 700,
            fontStyle: "italic",
            color: tokens.warning,
          }}
        >
          {minLeft}m
        </span>
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {order.customer}
      </div>
      <div
        className="font-body"
        style={{
          fontSize: 11,
          color: tokens.inkSoft,
          marginBottom: 8,
        }}
      >
        {order.items.length} items
      </div>
      <div className="countdown-bar">
        <div
          className="countdown-bar-fill"
          style={{
            width: `${progressPct}%`,
            background: tokens.warning,
          }}
        />
      </div>
      {order.driver && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 10,
            fontFamily: "'Inter Tight', sans-serif",
            color: tokens.inkSoft,
          }}
        >
          <Truck size={11} strokeWidth={2.2} />
          <span style={{ fontWeight: 600 }}>{order.driver.name}</span>
          <span>·</span>
          <span>{order.driver.eta}</span>
        </div>
      )}
    </div>
  );
}

function ReadyCard({ order, selected, onSelect, tokens }) {
  return (
    <div
      onClick={onSelect}
      className={`order-card ${selected ? "selected" : ""}`}
      style={{
        background: tokens.kraftLight,
        border: `1px solid ${tokens.success}60`,
        borderRadius: 12,
        padding: "10px 12px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <span
          className="font-display"
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: tokens.ink,
            fontStyle: "italic",
          }}
        >
          {order.id}
        </span>
        <Check size={14} strokeWidth={3} style={{ color: tokens.success }} />
      </div>
      <div
        className="font-display"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {order.customer}
      </div>
      <div
        className="font-body"
        style={{
          fontSize: 11,
          color: tokens.inkSoft,
          marginBottom: 8,
        }}
      >
        {order.items.length} items
      </div>
      {order.driver && (
        <div
          style={{
            background: tokens.success + "15",
            border: `1px solid ${tokens.success}40`,
            borderRadius: 8,
            padding: "5px 8px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontFamily: "'Inter Tight', sans-serif",
            color: tokens.success,
            fontWeight: 700,
          }}
        >
          <Truck size={12} strokeWidth={2.5} />
          {order.driver.name} · {order.driver.eta}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text, sub, tokens }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "32px 12px",
        color: tokens.inkSoft,
        opacity: 0.5,
      }}
    >
      <div
        className="font-display"
        style={{
          fontSize: 14,
          fontStyle: "italic",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {text}
      </div>
      <div
        className="font-body"
        style={{
          fontSize: 11,
        }}
      >
        {sub}
      </div>
    </div>
  );
}
