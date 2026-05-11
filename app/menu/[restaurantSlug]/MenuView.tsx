"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Search,
  Heart,
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
import type { RestaurantMenuData } from "@/app/api/menu/[restaurantSlug]/route";
import { SERVICE_FEE, TYPICAL_COMPETITOR_FEE } from "@/lib/config";

// Brand tokens — project palette
const T = {
  primary:     "#0F766E",   // teal primary  (spec: royalBlue #1E3A8A)
  primaryDeep: "#0A5C56",   // teal dark      (spec: royalBlueDeep #152B66)
  bg:          "#E2D9C8",   // muted bg       (spec: kraft #E8DCC4)
  bgLight:     "#FAF8F3",   // page bg        (spec: kraftLight #F5EFE0)
  bgDark:      "#C5B99A",   // muted border   (spec: kraftDark #C9B896)
  ink:         "#1A1A2E",   // primary text
  inkSoft:     "#5A5870",   // muted text     (spec: inkSoft #5C5448)
  accent:      "#F59E0B",   // amber accent   (spec: terracotta #D4622E)
  success:     "#166534",   // success green
};

interface CartState {
  [itemId: string]: number;
}

type OrderMode = "solo" | "group";

interface MenuViewProps {
  menu: RestaurantMenuData;
}

export default function MenuView({ menu }: MenuViewProps) {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({});
  const [activeCategory, setActiveCategory] = useState<string>(
    menu.categories[0]?.label.toLowerCase() ?? ""
  );
  const [orderMode, setOrderMode] = useState<OrderMode>("solo");
  const [isSaved, setIsSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist saved state to localStorage
  // TODO: sync with user account favourites via /api/me/favourites
  useEffect(() => {
    const saved = localStorage.getItem(`saved-restaurant-${menu.slug}`);
    if (saved === "true") setIsSaved(true);
  }, [menu.slug]);

  const toggleSaved = () => {
    const next = !isSaved;
    setIsSaved(next);
    localStorage.setItem(`saved-restaurant-${menu.slug}`, String(next));
  };

  // Auto-update active category on scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sectionIds = menu.categories.map((c) => categoryKey(c.label));
    const onScroll = () => {
      const scrollTop = el.scrollTop + 220;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const sectionEl = document.getElementById(`section-${sectionIds[i]}`);
        if (sectionEl && sectionEl.offsetTop <= scrollTop) {
          setActiveCategory(sectionIds[i]);
          break;
        }
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [menu.categories]);

  const allItems = menu.categories.flatMap((c) => c.items);

  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => {
      const item = allItems.find((i) => i.id === id);
      return item ? { ...item, qty } : null;
    })
    .filter(Boolean) as Array<(typeof allItems)[0] & { qty: number }>;

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      next[id] = Math.max(0, (next[id] ?? 0) + delta);
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const scrollToCategory = (key: string) => {
    const el = document.getElementById(`section-${key}`);
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: el.offsetTop - 195,
        behavior: "smooth",
      });
    }
  };

  // Navigate to checkout with cart data
  // TODO: persist cart to session or URL params instead of localStorage for SSR
  const handleReviewOrder = () => {
    localStorage.setItem(
      "pending-cart",
      JSON.stringify({ restaurantSlug: menu.slug, items: cartItems })
    );
    router.push("/checkout");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${T.bgLight} 0%, ${T.bg} 100%)`,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        .nc-scroll-hide { scrollbar-width: none; }
        .nc-scroll-hide::-webkit-scrollbar { display: none; }

        .nc-qty-btn {
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
        .nc-qty-btn:active { transform: scale(0.9); }

        @keyframes nc-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .nc-pop { animation: nc-pop 0.25s ease-out; }

        @keyframes nc-slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .nc-slide-up { animation: nc-slide-up 0.3s ease-out; }
      `}</style>

      {/* ── Fixed header ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: T.bgLight,
          borderBottom: `1px solid ${T.bgDark}40`,
        }}
      >
        {/* Restaurant name row */}
        <div
          style={{
            padding: "14px 16px 10px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              background: "transparent",
              border: "none",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: T.ink,
              cursor: "pointer",
              flexShrink: 0,
            }}
            aria-label="Go back"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: T.ink,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {menu.name}
            </div>
            <div
              style={{
                fontSize: 11,
                color: T.inkSoft,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 3,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={10} fill={T.primary} stroke={T.primary} />
                <span style={{ color: T.ink, fontWeight: 700 }}>
                  {menu.rating}
                </span>
                <span style={{ opacity: 0.7 }}>({menu.reviewCount})</span>
              </span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} />
                {menu.estimatedMin}
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
              color: T.inkSoft,
              cursor: "pointer",
            }}
            aria-label="Search menu"
          >
            <Search size={18} strokeWidth={2} />
          </button>
          <button
            onClick={toggleSaved}
            style={{
              background: "transparent",
              border: "none",
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isSaved ? T.primary : T.inkSoft,
              cursor: "pointer",
            }}
            aria-label={isSaved ? "Remove from favourites" : "Add to favourites"}
          >
            <Heart
              size={18}
              strokeWidth={2}
              fill={isSaved ? T.primary : "none"}
            />
          </button>
        </div>

        {/* Order mode toggle */}
        <div style={{ padding: "0 16px 10px", display: "flex", gap: 6 }}>
          {(["solo", "group"] as OrderMode[]).map((mode) => {
            const active = orderMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setOrderMode(mode)}
                style={{
                  flex: 1,
                  background: active ? T.ink : "transparent",
                  color: active ? T.bgLight : T.inkSoft,
                  border: active ? "none" : `1px solid ${T.bgDark}60`,
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {mode === "solo" ? (
                  <ShoppingBag size={13} strokeWidth={2.2} />
                ) : (
                  <Users size={13} strokeWidth={2.2} />
                )}
                {mode === "solo" ? "Just me" : "Group order"}
              </button>
            );
          })}
        </div>

        {/* Category tabs */}
        <div
          className="nc-scroll-hide"
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            padding: "6px 16px 12px",
          }}
        >
          {menu.categories.map((cat) => {
            const key = categoryKey(cat.label);
            const active = activeCategory === key;
            return (
              <button
                key={key}
                onClick={() => scrollToCategory(key)}
                style={{
                  background: active ? T.ink : "transparent",
                  color: active ? T.bgLight : T.inkSoft,
                  border: active ? "none" : `1px solid ${T.bgDark}50`,
                  borderRadius: 999,
                  padding: "7px 16px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div
        ref={scrollRef}
        className="nc-scroll-hide"
        style={{
          height: "100vh",
          overflowY: "auto",
          paddingTop: 170, // matches fixed header height
        }}
      >
        {/* Group order banner */}
        {orderMode === "group" && (
          <div
            style={{
              margin: "0 16px 16px",
              background: T.ink,
              color: T.bgLight,
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
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Start a group order
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.75,
                  marginTop: 2,
                }}
              >
                Share a link — everyone adds their own items.
              </div>
            </div>
            <button
              style={{
                background: T.bgLight,
                color: T.ink,
                border: "none",
                borderRadius: 999,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onClick={() => {
                // TODO: implement group order session creation via /api/orders/delivery/group
                alert("Group orders coming soon.");
              }}
            >
              Start
            </button>
          </div>
        )}

        {/* Spotlight callback strip */}
        <a
          href={menu.spotlightHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            margin: "0 16px 16px",
            padding: "12px 14px",
            background: T.bg,
            borderRadius: 12,
            border: `1px dashed ${T.bgDark}`,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontStyle: "italic",
              fontWeight: 700,
              color: T.primary,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ⁂
          </div>
          <p
            style={{
              fontSize: 11.5,
              color: T.ink,
              lineHeight: 1.45,
              margin: 0,
              flex: 1,
            }}
          >
            Read the story behind{" "}
            <span style={{ color: T.ink, fontWeight: 600 }}>{menu.name}</span>
            <span style={{ color: T.primary, fontWeight: 700 }}> →</span>
          </p>
        </a>

        {/* Menu sections */}
        {menu.categories.map((cat) => {
          const key = categoryKey(cat.label);
          return (
            <section
              key={key}
              id={`section-${key}`}
              style={{ padding: "8px 16px 12px" }}
            >
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  fontStyle: "italic",
                  color: T.ink,
                  letterSpacing: "-0.015em",
                  marginBottom: 12,
                  paddingLeft: 4,
                }}
              >
                {cat.label}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {cat.items.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  const TagIcon = getTagIcon(item.tags);

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: T.bgLight,
                        border: `1px solid ${T.bgDark}30`,
                        borderRadius: 14,
                        padding: 12,
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      {/* Image placeholder */}
                      <div
                        style={{
                          width: 84,
                          height: 84,
                          borderRadius: 10,
                          background: `linear-gradient(135deg, ${item.colorHex}, ${item.colorHex}CC)`,
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 42,
                            fontStyle: "italic",
                            fontWeight: 700,
                            color: T.bgLight,
                            opacity: 0.4,
                            lineHeight: 1,
                          }}
                        >
                          {item.name[0]}
                        </span>
                        {item.tags.length > 0 && (
                          <span
                            style={{
                              position: "absolute",
                              top: 6,
                              left: 6,
                              background: T.ink,
                              color: T.bgLight,
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              padding: "2px 6px",
                              borderRadius: 3,
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                          >
                            {TagIcon && (
                              <TagIcon size={8} strokeWidth={2.5} />
                            )}
                            {item.tags[0]}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: T.ink,
                            lineHeight: 1.2,
                            marginBottom: 3,
                            letterSpacing: "-0.005em",
                          }}
                        >
                          {item.name}
                        </h3>
                        <p
                          style={{
                            fontSize: 11.5,
                            color: T.inkSoft,
                            lineHeight: 1.4,
                            marginBottom: 8,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          } as React.CSSProperties}
                        >
                          {item.description}
                        </p>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: T.ink,
                              fontStyle: "italic",
                            }}
                          >
                            ${item.price}
                          </span>

                          {qty === 0 ? (
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              style={{
                                background: T.primary,
                                color: "#fff",
                                border: "none",
                                borderRadius: 999,
                                padding: "6px 14px",
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Plus size={12} strokeWidth={2.5} />
                              Add
                            </button>
                          ) : (
                            <div
                              className="nc-pop"
                              key={qty}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: T.ink,
                                borderRadius: 999,
                                padding: 3,
                              }}
                            >
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="nc-qty-btn"
                                style={{
                                  background: "transparent",
                                  color: T.bgLight,
                                }}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} strokeWidth={2.5} />
                              </button>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: T.bgLight,
                                  minWidth: 16,
                                  textAlign: "center",
                                }}
                              >
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="nc-qty-btn"
                                style={{
                                  background: T.bgLight,
                                  color: T.ink,
                                }}
                                aria-label="Increase quantity"
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
          );
        })}

        {/* Fee transparency block */}
        <div
          style={{
            margin: "16px 16px 24px",
            padding: "16px 16px 18px",
            background: T.bgLight,
            borderRadius: 14,
            border: `1px solid ${T.bgDark}40`,
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
            <Info size={14} strokeWidth={2} style={{ color: T.primary }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: T.primary,
              }}
            >
              Fees, in plain English
            </span>
          </div>
          <p
            style={{
              fontSize: 12.5,
              color: T.ink,
              lineHeight: 1.55,
              margin: 0,
            }}
          >
            We charge a ${SERVICE_FEE.toFixed(2)} service fee. The other
            delivery apps charge ${Math.floor(TYPICAL_COMPETITOR_FEE)}–
            {Math.ceil(TYPICAL_COMPETITOR_FEE) + 1}. The difference goes back
            to the restaurant and to your driver.
          </p>
        </div>

        {/* Footer mark */}
        <div
          style={{
            textAlign: "center",
            padding: "8px 24px 32px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontStyle: "italic",
              color: T.inkSoft,
              opacity: 0.5,
            }}
          >
            — handled with care —
          </div>
        </div>

        {/* Spacer for sticky cart */}
        {itemCount > 0 && <div style={{ height: 90 }} />}
      </div>

      {/* ── Sticky cart ── */}
      {itemCount > 0 && (
        <div
          className="nc-slide-up"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "12px 16px 24px",
            background: `linear-gradient(to top, ${T.bgLight} 70%, transparent)`,
            zIndex: 50,
          }}
        >
          <button
            onClick={handleReviewOrder}
            style={{
              width: "100%",
              background: T.primary,
              color: "#fff",
              border: "none",
              borderRadius: 16,
              padding: "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: `0 12px 28px -10px ${T.primary}80`,
            }}
          >
            <div
              style={{
                background: T.primaryDeep,
                color: "#fff",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {itemCount}
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "-0.005em",
              }}
            >
              Review order
            </span>
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                fontStyle: "italic",
              }}
            >
              ${subtotal.toFixed(2)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

/** Normalise a category label to a DOM-safe key */
function categoryKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "-");
}

/** Map item tags to icon components */
function getTagIcon(
  tags: string[]
): React.ComponentType<{ size?: number; strokeWidth?: number }> | null {
  const tag = tags[0]?.toLowerCase();
  if (tag === "spicy") return Flame;
  if (tag === "veg" || tag === "vegetarian" || tag === "vegan") return Leaf;
  return null;
}
