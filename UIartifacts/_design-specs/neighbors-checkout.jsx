import React, { useState } from "react";
import {
  ChevronLeft,
  MapPin,
  Clock,
  CreditCard,
  Edit3,
  ChevronRight,
  Sparkles,
  Heart,
  Plus,
  Minus,
  MessageSquare,
} from "lucide-react";

export default function Checkout() {
  const [tipPct, setTipPct] = useState(18);
  const [customTip, setCustomTip] = useState(false);
  const [customTipAmount, setCustomTipAmount] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

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

  // Cart items
  const items = [
    { name: "Tonkotsu Classic", qty: 1, price: 17, color: "#C9954A" },
    { name: "Spicy Miso", qty: 1, price: 18, color: accent },
    { name: "Pork Gyoza (5)", qty: 1, price: 9, color: "#A8754D" },
  ];

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = 2.99;
  const serviceFee = 1.49;
  const tax = +(subtotal * 0.13).toFixed(2);
  const tip = customTip
    ? +parseFloat(customTipAmount || 0).toFixed(2)
    : +((subtotal * tipPct) / 100).toFixed(2);
  const total = +(subtotal + deliveryFee + serviceFee + tax + tip).toFixed(2);

  // Savings calc — based on typical Ottawa service+delivery fees ($6+ vs ours $4.48)
  const savedOnFees = 3.5;

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
          padding-bottom: 110px;
        }
        .scroll-container::-webkit-scrollbar { display: none; }

        .stamp::before {
          content: "";
          position: absolute;
          inset: -4px -8px;
          border: 1.5px solid currentColor;
          border-radius: 2px;
          opacity: 0.25;
          transform: rotate(-1.5deg);
        }
      `}</style>

      <div className="min-h-screen w-full" style={{position: "relative"}}>
          {/* Top header */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 40,
              background: `${kraftLight}E6`,
              backdropFilter: "blur(12px)",
              padding: "52px 16px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderBottom: `1px solid ${kraftDark}30`,
            }}
          >
            <button
              style={{
                background: "transparent",
                border: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: ink,
                cursor: "pointer",
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </button>
            <div style={{ flex: 1 }}>
              <div
                className="font-display"
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: ink,
                  fontStyle: "italic",
                  letterSpacing: "-0.01em",
                }}
              >
                Review your order
              </div>
              <div
                className="font-body"
                style={{ fontSize: 11, color: inkSoft }}
              >
                From Maïko Ramen
              </div>
            </div>
          </div>

          <div className="scroll-container">
            <div style={{ height: 110 }} />

            {/* Delivery address */}
            <div style={{ padding: "16px 16px 8px" }}>
              <span
                className="font-body stamp"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: royalBlue,
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 12,
                  marginLeft: 4,
                }}
              >
                Delivering to
              </span>

              <div
                style={{
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: royalBlue,
                    color: kraftLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={17} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: ink,
                      lineHeight: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    Home · 142 Castlefrank Rd
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 11, color: inkSoft }}
                  >
                    Apt 3B · Buzz code 1142
                  </div>
                </div>
                <Edit3
                  size={16}
                  strokeWidth={2}
                  style={{ color: inkSoft, flexShrink: 0 }}
                />
              </div>

              {/* Delivery time */}
              <div
                style={{
                  marginTop: 10,
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: ink,
                    color: kraftLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Clock size={17} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: ink,
                      lineHeight: 1.2,
                      marginBottom: 2,
                    }}
                  >
                    As soon as possible
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 11, color: inkSoft }}
                  >
                    Estimated 25–35 min · arrives ~7:14 PM
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  style={{ color: inkSoft }}
                />
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "20px 16px 8px" }}>
              <span
                className="font-body stamp"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: royalBlue,
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 12,
                  marginLeft: 4,
                }}
              >
                Your order
              </span>

              <div
                style={{
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  overflow: "hidden",
                }}
              >
                {items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: 12,
                      borderBottom:
                        i < items.length - 1
                          ? `1px solid ${kraftDark}30`
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: kraftLight,
                        fontFamily: "'Fraunces', serif",
                        fontStyle: "italic",
                        fontWeight: 700,
                        fontSize: 18,
                        opacity: 0.85,
                      }}
                    >
                      {item.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="font-display"
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: ink,
                          lineHeight: 1.2,
                          marginBottom: 2,
                        }}
                      >
                        {item.qty} × {item.name}
                      </div>
                      <button
                        className="font-body"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: royalBlue,
                          fontSize: 11,
                          fontWeight: 600,
                          padding: 0,
                          cursor: "pointer",
                        }}
                      >
                        Edit
                      </button>
                    </div>
                    <span
                      className="font-display"
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: ink,
                        fontStyle: "italic",
                      }}
                    >
                      ${(item.price * item.qty).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Add more */}
                <button
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    borderTop: `1px dashed ${kraftDark}80`,
                    padding: "12px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: royalBlue,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                  className="font-body"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Add more from Maïko
                </button>
              </div>
            </div>

            {/* Note for restaurant/driver */}
            <div style={{ padding: "20px 16px 8px" }}>
              <span
                className="font-body stamp"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: royalBlue,
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 12,
                  marginLeft: 4,
                }}
              >
                A note for Yuki & your driver
              </span>

              <div
                style={{
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <MessageSquare
                  size={16}
                  strokeWidth={2}
                  style={{ color: inkSoft, marginTop: 2, flexShrink: 0 }}
                />
                <input
                  type="text"
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Allergy notes, gate codes, where to leave it..."
                  className="font-body"
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontSize: 13,
                    color: ink,
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Tip */}
            <div style={{ padding: "20px 16px 8px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 12,
                  paddingLeft: 4,
                }}
              >
                <span
                  className="font-body stamp"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: royalBlue,
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  Tip your driver
                </span>
              </div>

              <div
                style={{
                  background: ink,
                  color: kraftLight,
                  borderRadius: 14,
                  padding: "14px 16px",
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Heart
                  size={16}
                  strokeWidth={2.2}
                  fill="#FFE8D4"
                  style={{ color: "#FFE8D4", flexShrink: 0 }}
                />
                <p
                  className="font-body"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    Drivers keep 100% of tips.
                  </span>
                  <span style={{ opacity: 0.78 }}> Always. No exceptions.</span>
                </p>
              </div>

              <div
                style={{
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr) auto",
                  gap: 6,
                }}
              >
                {[15, 18, 20, 25].map((pct) => {
                  const active = !customTip && tipPct === pct;
                  return (
                    <button
                      key={pct}
                      onClick={() => {
                        setTipPct(pct);
                        setCustomTip(false);
                      }}
                      style={{
                        background: active ? royalBlue : "transparent",
                        color: active ? kraftLight : ink,
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 4px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <span
                        className="font-display"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          fontStyle: "italic",
                          lineHeight: 1,
                        }}
                      >
                        {pct}%
                      </span>
                      <span
                        className="font-body"
                        style={{
                          fontSize: 10,
                          opacity: active ? 0.85 : 0.6,
                          marginTop: 3,
                          fontWeight: 500,
                        }}
                      >
                        ${((subtotal * pct) / 100).toFixed(2)}
                      </span>
                    </button>
                  );
                })}
                <button
                  onClick={() => setCustomTip(true)}
                  style={{
                    background: customTip ? royalBlue : "transparent",
                    color: customTip ? kraftLight : ink,
                    border: "none",
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Inter Tight', sans-serif",
                  }}
                >
                  Other
                </button>
              </div>
              {customTip && (
                <input
                  type="number"
                  value={customTipAmount}
                  onChange={(e) => setCustomTipAmount(e.target.value)}
                  placeholder="Custom tip amount ($)"
                  className="font-body"
                  style={{
                    width: "100%",
                    marginTop: 8,
                    background: kraftLight,
                    border: `1px solid ${royalBlue}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: ink,
                    outline: "none",
                  }}
                />
              )}
            </div>

            {/* Payment */}
            <div style={{ padding: "20px 16px 8px" }}>
              <span
                className="font-body stamp"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: royalBlue,
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 12,
                  marginLeft: 4,
                }}
              >
                Payment
              </span>

              <div
                style={{
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  padding: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: ink,
                    color: kraftLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CreditCard size={16} strokeWidth={2.2} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: ink,
                      lineHeight: 1.2,
                    }}
                  >
                    Visa · 4242
                  </div>
                  <div
                    className="font-body"
                    style={{ fontSize: 11, color: inkSoft, marginTop: 2 }}
                  >
                    Default
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  strokeWidth={2}
                  style={{ color: inkSoft }}
                />
              </div>
            </div>

            {/* Breakdown */}
            <div style={{ padding: "20px 16px 8px" }}>
              <span
                className="font-body stamp"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: royalBlue,
                  position: "relative",
                  display: "inline-block",
                  marginBottom: 12,
                  marginLeft: 4,
                }}
              >
                Breakdown
              </span>

              <div
                style={{
                  background: kraftLight,
                  borderRadius: 14,
                  border: `1px solid ${kraftDark}40`,
                  padding: "16px 16px 14px",
                }}
              >
                {[
                  { label: "Subtotal", value: subtotal.toFixed(2) },
                  { label: "Delivery fee", value: deliveryFee.toFixed(2) },
                  { label: "Service fee", value: serviceFee.toFixed(2) },
                  { label: "Tax (HST 13%)", value: tax.toFixed(2) },
                  { label: "Tip", value: tip.toFixed(2), highlight: tip > 0 },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      className="font-body"
                      style={{ fontSize: 13, color: inkSoft }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="font-body"
                      style={{
                        fontSize: 13,
                        color: ink,
                        fontWeight: row.highlight ? 600 : 500,
                      }}
                    >
                      ${row.value}
                    </span>
                  </div>
                ))}

                <div
                  style={{
                    height: 1,
                    background: kraftDark + "60",
                    margin: "12px 0",
                  }}
                />

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
                      fontSize: 16,
                      fontWeight: 600,
                      color: ink,
                      fontStyle: "italic",
                    }}
                  >
                    Total
                  </span>
                  <span
                    className="font-display"
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: ink,
                      fontStyle: "italic",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Savings callout — non-comparative */}
              <div
                style={{
                  marginTop: 10,
                  background: success,
                  color: kraftLight,
                  borderRadius: 14,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Sparkles
                  size={16}
                  strokeWidth={2.2}
                  style={{ flexShrink: 0 }}
                />
                <p
                  className="font-body"
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    margin: 0,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>
                    You saved about ${savedOnFees.toFixed(2)} on fees.
                  </span>
                  <span style={{ opacity: 0.85 }}>
                    {" "}
                    Our service fee is the lowest in Ottawa.
                  </span>
                </p>
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "12px 24px 20px",
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

          {/* Sticky place order */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "12px 16px 24px",
              background: `linear-gradient(to top, ${kraftLight} 70%, ${kraftLight}00)`,
              zIndex: 30,
            }}
          >
            <button
              style={{
                width: "100%",
                background: royalBlue,
                color: kraftLight,
                border: "none",
                borderRadius: 16,
                padding: "16px 20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
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
                Place order
              </span>
              <span
                className="font-display"
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  fontStyle: "italic",
                }}
              >
                ${total.toFixed(2)}
              </span>
            </button>
          </div>
        </div>
  );
}
