import React, { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  Search,
  Heart,
  Share2,
  Star,
  Clock,
  Plus,
  Minus,
  ShoppingBag,
  Users,
  Info,
  Flame,
  Leaf,
} from "lucide-react";

export default function PartnerMenu() {
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState("ramen");
  const [orderMode, setOrderMode] = useState("solo"); // "solo" | "group"
  const scrollRef = useRef(null);

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

  const menu = {
    ramen: {
      label: "Ramen",
      items: [
        {
          id: "tonkotsu",
          name: "Tonkotsu Classic",
          desc: "18-hour pork bone broth, chashu, soft egg, scallion, nori.",
          price: 17,
          tag: "Signature",
          color: "#C9954A",
        },
        {
          id: "spicy-miso",
          name: "Spicy Miso",
          desc: "Three-miso blend, fermented chili, ground pork, soft egg.",
          price: 18,
          tag: "Spicy",
          color: accent,
          icon: Flame,
        },
        {
          id: "shoyu",
          name: "Shoyu Ramen",
          desc: "Clear chicken broth, house soy tare, bamboo, chashu.",
          price: 16,
          color: "#8B6508",
        },
        {
          id: "veg-shoyu",
          name: "Vegetable Shoyu",
          desc: "Mushroom dashi, tofu, seasonal vegetables, scallion oil.",
          price: 16,
          tag: "Veg",
          color: "#4A7C59",
          icon: Leaf,
        },
      ],
    },
    sides: {
      label: "Sides",
      items: [
        {
          id: "gyoza",
          name: "Pork Gyoza (5)",
          desc: "Hand-folded, pan-fried. House ponzu on the side.",
          price: 9,
          color: "#A8754D",
        },
        {
          id: "edamame",
          name: "Edamame",
          desc: "Steamed, sea salt. Simple, exactly right.",
          price: 6,
          color: "#5A8C4A",
        },
        {
          id: "karaage",
          name: "Chicken Karaage",
          desc: "Marinated, double-fried. Lemon and kewpie.",
          price: 11,
          color: "#B8860B",
        },
      ],
    },
    drinks: {
      label: "Drinks",
      items: [
        {
          id: "ramune",
          name: "Ramune",
          desc: "Original or strawberry. Glass marble bottle.",
          price: 4,
          color: "#7AAFC8",
        },
        {
          id: "tea",
          name: "Cold Genmaicha",
          desc: "Roasted brown rice green tea. Brewed daily.",
          price: 4,
          color: "#8B9D6F",
        },
      ],
    },
  };

  const allItems = Object.values(menu).flatMap((c) => c.items);
  const cartItems = Object.entries(cart)
    .filter(([_, q]) => q > 0)
    .map(([id, q]) => ({ ...allItems.find((i) => i.id === id), qty: q }));

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const updateQty = (id, delta) => {
    setCart((prev) => {
      const next = { ...prev };
      next[id] = Math.max(0, (next[id] || 0) + delta);
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  // Auto-update active category on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const sections = Object.keys(menu).map((key) => ({
        key,
        el: document.getElementById(`section-${key}`),
      }));
      const scrollTop = el.scrollTop + 200;
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].el && sections[i].el.offsetTop <= scrollTop) {
          setActiveCategory(sections[i].key);
          break;
        }
      }
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

        .cat-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 12px 16px;
        }
        .cat-scroll::-webkit-scrollbar { display: none; }

        .qty-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .qty-btn:active {
          transform: scale(0.9);
        }

        .pop {
          animation: pop 0.3s ease-out;
        }
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
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
              background: kraftLight,
              borderBottom: `1px solid ${kraftDark}40`,
              paddingTop: 52,
            }}
          >
            <div
              style={{
                padding: "10px 16px 12px",
                display: "flex",
                alignItems: "center",
                gap: 12,
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

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-display"
                  style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: ink,
                    lineHeight: 1.1,
                    letterSpacing: "-0.005em",
                  }}
                >
                  Maïko Ramen
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    color: inkSoft,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 2,
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Star size={10} fill={royalBlue} stroke={royalBlue} />
                    <span style={{ color: ink, fontWeight: 600 }}>4.8</span>
                    <span style={{ opacity: 0.7 }}>(212)</span>
                  </span>
                  <span style={{ opacity: 0.4 }}>·</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    25–35 min
                  </span>
                </div>
              </div>

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
                <Search size={18} strokeWidth={2} />
              </button>
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
                <Heart size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Order mode toggle */}
            <div
              style={{
                padding: "0 16px 10px",
                display: "flex",
                gap: 6,
              }}
            >
              <button
                onClick={() => setOrderMode("solo")}
                style={{
                  flex: 1,
                  background: orderMode === "solo" ? royalBlue : "transparent",
                  color: orderMode === "solo" ? kraftLight : inkSoft,
                  border:
                    orderMode === "solo"
                      ? "none"
                      : `1px solid ${kraftDark}60`,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                className="font-body"
              >
                <ShoppingBag size={13} strokeWidth={2.2} />
                Just me
              </button>
              <button
                onClick={() => setOrderMode("group")}
                style={{
                  flex: 1,
                  background: orderMode === "group" ? royalBlue : "transparent",
                  color: orderMode === "group" ? kraftLight : inkSoft,
                  border:
                    orderMode === "group"
                      ? "none"
                      : `1px solid ${kraftDark}60`,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
                className="font-body"
              >
                <Users size={13} strokeWidth={2.2} />
                Group order
              </button>
            </div>

            {/* Category tabs */}
            <div className="cat-scroll">
              {Object.entries(menu).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => {
                    const el = document.getElementById(`section-${key}`);
                    if (el && scrollRef.current) {
                      scrollRef.current.scrollTo({
                        top: el.offsetTop - 180,
                        behavior: "smooth",
                      });
                    }
                  }}
                  style={{
                    background:
                      activeCategory === key ? ink : "transparent",
                    color: activeCategory === key ? kraftLight : inkSoft,
                    border:
                      activeCategory === key
                        ? "none"
                        : `1px solid ${kraftDark}50`,
                    borderRadius: 999,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "'Inter Tight', sans-serif",
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scroll body */}
          <div ref={scrollRef} className="scroll-container">
            <div style={{ height: 200 }} />

            {/* Group order banner (if active) */}
            {orderMode === "group" && (
              <div
                style={{
                  margin: "0 16px 16px",
                  background: ink,
                  color: kraftLight,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Users size={18} strokeWidth={2} />
                <div style={{ flex: 1 }}>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    Start a group order
                  </div>
                  <div
                    className="font-body"
                    style={{
                      fontSize: 11,
                      opacity: 0.75,
                      marginTop: 2,
                    }}
                  >
                    Share a link, everyone adds their own.
                  </div>
                </div>
                <button
                  className="font-body"
                  style={{
                    background: kraftLight,
                    color: ink,
                    border: "none",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Start
                </button>
              </div>
            )}

            {/* Spotlight callback strip */}
            <div
              style={{
                margin: "0 16px 16px",
                padding: "12px 14px",
                background: kraft,
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                gap: 10,
                border: `1px dashed ${kraftDark}`,
              }}
            >
              <div
                className="font-display"
                style={{
                  fontSize: 18,
                  fontStyle: "italic",
                  fontWeight: 600,
                  color: royalBlue,
                  lineHeight: 1,
                }}
              >
                ⁂
              </div>
              <p
                className="font-body"
                style={{
                  fontSize: 11.5,
                  color: ink,
                  lineHeight: 1.45,
                  margin: 0,
                  flex: 1,
                }}
              >
                Read the spotlight on Yuki and Maïko
                <span style={{ color: royalBlue, fontWeight: 600 }}> →</span>
              </p>
            </div>

            {/* Menu sections */}
            {Object.entries(menu).map(([key, cat]) => (
              <section
                key={key}
                id={`section-${key}`}
                style={{ padding: "8px 16px 12px" }}
              >
                <h2
                  className="font-display"
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: ink,
                    letterSpacing: "-0.015em",
                    marginBottom: 12,
                    paddingLeft: 4,
                  }}
                >
                  {cat.label}
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {cat.items.map((item) => {
                    const qty = cart[item.id] || 0;
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: kraftLight,
                          border: `1px solid ${kraftDark}30`,
                          borderRadius: 14,
                          padding: 12,
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        {/* Image placeholder (colored block) */}
                        <div
                          style={{
                            width: 84,
                            height: 84,
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)`,
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <span
                            className="font-display"
                            style={{
                              fontSize: 42,
                              fontStyle: "italic",
                              fontWeight: 700,
                              color: kraftLight,
                              opacity: 0.4,
                              lineHeight: 1,
                            }}
                          >
                            {item.name[0]}
                          </span>
                          {item.tag && (
                            <span
                              className="font-body"
                              style={{
                                position: "absolute",
                                top: 6,
                                left: 6,
                                background: ink,
                                color: kraftLight,
                                fontSize: 8,
                                fontWeight: 700,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                padding: "2px 6px",
                                borderRadius: 3,
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              {Icon && <Icon size={8} strokeWidth={2.5} />}
                              {item.tag}
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3
                            className="font-display"
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: ink,
                              lineHeight: 1.2,
                              marginBottom: 3,
                              letterSpacing: "-0.005em",
                            }}
                          >
                            {item.name}
                          </h3>
                          <p
                            className="font-body"
                            style={{
                              fontSize: 11.5,
                              color: inkSoft,
                              lineHeight: 1.4,
                              marginBottom: 8,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.desc}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span
                              className="font-display"
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: ink,
                                fontStyle: "italic",
                              }}
                            >
                              ${item.price}
                            </span>

                            {qty === 0 ? (
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                style={{
                                  background: royalBlue,
                                  color: kraftLight,
                                  border: "none",
                                  borderRadius: 999,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                                className="font-body"
                              >
                                <Plus size={12} strokeWidth={2.5} />
                                Add
                              </button>
                            ) : (
                              <div
                                className="pop"
                                key={qty}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  background: ink,
                                  borderRadius: 999,
                                  padding: 3,
                                }}
                              >
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className="qty-btn"
                                  style={{
                                    background: "transparent",
                                    color: kraftLight,
                                  }}
                                >
                                  <Minus size={13} strokeWidth={2.5} />
                                </button>
                                <span
                                  className="font-body"
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: kraftLight,
                                    minWidth: 16,
                                    textAlign: "center",
                                  }}
                                >
                                  {qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.id, 1)}
                                  className="qty-btn"
                                  style={{
                                    background: kraftLight,
                                    color: ink,
                                  }}
                                >
                                  <Plus size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Fee transparency block */}
            <div
              style={{
                margin: "16px 16px 24px",
                padding: "16px 16px 18px",
                background: kraftLight,
                borderRadius: 14,
                border: `1px solid ${kraftDark}40`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Info size={14} strokeWidth={2} style={{ color: royalBlue }} />
                <span
                  className="font-body"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.25em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    color: royalBlue,
                  }}
                >
                  Fees, in plain English
                </span>
              </div>
              <p
                className="font-body"
                style={{
                  fontSize: 12.5,
                  color: ink,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                We charge a $1.49 service fee. The other guys charge $4–6.
                The difference goes back to Yuki and to your driver.
              </p>
            </div>

            <div
              style={{
                textAlign: "center",
                padding: "8px 24px 32px",
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

            {/* Spacer for sticky cart */}
            {itemCount > 0 && <div style={{ height: 90 }} />}
          </div>

          {/* Sticky cart (only when items present) */}
          {itemCount > 0 && (
            <div
              className="slide-up"
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
                  padding: "14px 18px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
                }}
              >
                <div
                  style={{
                    background: royalBlueDeep,
                    color: kraftLight,
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'Inter Tight', sans-serif",
                  }}
                >
                  {itemCount}
                </div>
                <span
                  className="font-display"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  Review order
                </span>
                <span
                  className="font-display"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    fontStyle: "italic",
                  }}
                >
                  ${subtotal.toFixed(2)}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
