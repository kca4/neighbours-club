"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  primary:     "#0F766E",
  primaryDark: "#0A5C56",
  bg:          "#FAF8F3",
  bgWarm:      "#F0EBE0",
  bgMuted:     "#E2D9C8",
  ink:         "#1A1A2E",
  inkSoft:     "#5A5870",
};

// ── Static menu data (TODO: fetch from CMS / restaurant API) ─────────────────
const RESTAURANTS: Record<string, {
  name: string;
  rating: number;
  reviews: number;
  deliveryMinutes: string;
  spotlightSlug?: string;
  categories: {
    key: string;
    label: string;
    items: {
      id: string;
      name: string;
      desc: string;
      price: number;
      color: string;
      tag?: string;
      tagIcon?: "flame" | "leaf";
    }[];
  }[];
}> = {
  "maiko-ramen": {
    name: "Maïko Ramen",
    rating: 4.8,
    reviews: 212,
    deliveryMinutes: "25–35",
    spotlightSlug: "maiko-ramen",
    categories: [
      {
        key: "ramen",
        label: "Ramen",
        items: [
          { id: "tonkotsu", name: "Tonkotsu Classic", desc: "18-hour pork bone broth, chashu, soft egg, scallion, nori.", price: 17, color: "#C9954A", tag: "Signature" },
          { id: "spicy-miso", name: "Spicy Miso", desc: "Three-miso blend, fermented chili, ground pork, soft egg.", price: 18, color: "#C96B5B", tag: "Spicy", tagIcon: "flame" },
          { id: "shoyu", name: "Shoyu Ramen", desc: "Clear chicken broth, house soy tare, bamboo, chashu.", price: 16, color: "#8B6508" },
          { id: "veg-shoyu", name: "Vegetable Shoyu", desc: "Mushroom dashi, tofu, seasonal vegetables, scallion oil.", price: 16, color: "#4A7C59", tag: "Veg", tagIcon: "leaf" },
        ],
      },
      {
        key: "sides",
        label: "Sides",
        items: [
          { id: "gyoza", name: "Pork Gyoza (5)", desc: "Hand-folded, pan-fried. House ponzu on the side.", price: 9, color: "#A8754D" },
          { id: "edamame", name: "Edamame", desc: "Steamed, sea salt. Simple, exactly right.", price: 6, color: "#5A8C4A" },
          { id: "karaage", name: "Chicken Karaage", desc: "Marinated, double-fried. Lemon and kewpie.", price: 11, color: "#B8860B" },
        ],
      },
      {
        key: "drinks",
        label: "Drinks",
        items: [
          { id: "ramune", name: "Ramune", desc: "Original or strawberry. Glass marble bottle.", price: 4, color: "#7AAFC8" },
          { id: "tea", name: "Cold Genmaicha", desc: "Roasted brown rice green tea. Brewed daily.", price: 4, color: "#8B9D6F" },
        ],
      },
    ],
  },
};

type Cart = Record<string, number>;

export default function RestaurantMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const restaurant = RESTAURANTS[slug];

  const [cart, setCart] = useState<Cart>({});
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [orderMode, setOrderMode] = useState<"solo" | "group">("solo");
  const [favourited, setFavourited] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = restaurant?.categories ?? [];

  useEffect(() => {
    if (categories.length > 0) setActiveCategory(categories[0].key);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-spy active category
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const scrollTop = el.scrollTop + 220;
      for (let i = categories.length - 1; i >= 0; i--) {
        const sectionEl = document.getElementById(`section-${categories[i].key}`);
        if (sectionEl && sectionEl.offsetTop <= scrollTop) {
          setActiveCategory(categories[i].key);
          break;
        }
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [categories]);

  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev };
      next[id] = Math.max(0, (next[id] ?? 0) + delta);
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const allItems = categories.flatMap((c) => c.items);
  const cartItems = Object.entries(cart)
    .filter(([, q]) => q > 0)
    .map(([id, qty]) => ({ ...allItems.find((i) => i.id === id)!, qty }));
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const itemCount = cartItems.reduce((s, i) => s + i.qty, 0);

  if (!restaurant) {
    return (
      <main className="flex flex-1 items-center justify-center p-8 text-center">
        <div>
          <p className="mb-4 text-foreground/60">Restaurant not found.</p>
          <Link href="/deals" className="font-semibold text-primary hover:underline">Browse deals →</Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .slide-up { animation: slideUp 0.25s ease-out; }

        @keyframes pop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.06); }
          100% { transform: scale(1); }
        }
        .pop { animation: pop 0.25s ease-out; }

        .cat-strip { overflow-x: auto; scrollbar-width: none; }
        .cat-strip::-webkit-scrollbar { display: none; }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <main
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ background: T.bg }}
      >
        {/* ── Sticky header: back + title + mode toggle + category tabs ─── */}
        <div
          className="sticky top-0 z-30 border-b"
          style={{ background: T.bg, borderColor: T.bgMuted + "80" }}
        >
          {/* Row 1: back button + name + search + heart */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: T.ink }}
            >
              <ChevronLeft size={22} strokeWidth={2.2} />
            </Link>

            <div className="min-w-0 flex-1">
              <div
                className="text-base font-semibold leading-tight tracking-tight"
                style={{ fontFamily: "Georgia, serif", color: T.ink }}
              >
                {restaurant.name}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px]" style={{ color: T.inkSoft }}>
                <span className="flex items-center gap-1">
                  <Star size={9} fill={T.primary} stroke={T.primary} />
                  <span className="font-semibold" style={{ color: T.ink }}>{restaurant.rating}</span>
                  <span className="opacity-70">({restaurant.reviews})</span>
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1">
                  <Clock size={9} />
                  {restaurant.deliveryMinutes} min
                </span>
              </div>
            </div>

            <button aria-label="Search menu" style={{ color: T.ink }}>
              <Search size={18} strokeWidth={2} />
            </button>
            <button
              aria-label={favourited ? "Unfavourite" : "Favourite"}
              onClick={() => setFavourited(!favourited)}
              style={{ color: favourited ? "#E53E3E" : T.ink }}
            >
              <Heart size={18} strokeWidth={2} fill={favourited ? "#E53E3E" : "transparent"} />
            </button>
          </div>

          {/* Row 2: order mode toggle */}
          <div className="flex gap-2 px-4 pb-2">
            {(["solo", "group"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setOrderMode(mode)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all"
                style={{
                  background: orderMode === mode ? T.ink : "transparent",
                  color: orderMode === mode ? T.bg : T.inkSoft,
                  border: orderMode === mode ? "none" : `1px solid ${T.bgMuted}80`,
                }}
              >
                {mode === "solo" ? <ShoppingBag size={12} strokeWidth={2.2} /> : <Users size={12} strokeWidth={2.2} />}
                {mode === "solo" ? "Just me" : "Group order"}
              </button>
            ))}
          </div>

          {/* Row 3: category tabs */}
          <div className="cat-strip flex gap-1.5 px-4 pb-3">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  const el = document.getElementById(`section-${cat.key}`);
                  if (el && scrollRef.current) {
                    scrollRef.current.scrollTo({ top: el.offsetTop - 200, behavior: "smooth" });
                  }
                }}
                className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all"
                style={{
                  background: activeCategory === cat.key ? T.ink : "transparent",
                  color: activeCategory === cat.key ? T.bg : T.inkSoft,
                  border: activeCategory === cat.key ? "none" : `1px solid ${T.bgMuted}80`,
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable menu body ─────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{ paddingBottom: itemCount > 0 ? 100 : 32 }}
        >
          {/* Group order banner */}
          {orderMode === "group" && (
            <div
              className="mx-4 mt-4 flex items-center gap-3 rounded-2xl p-4"
              style={{ background: T.ink, color: T.bg }}
            >
              <Users size={18} strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <div
                  className="text-sm font-semibold leading-snug"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Start a group order
                </div>
                <div className="mt-0.5 text-xs opacity-75">Share a link, everyone adds their own.</div>
              </div>
              {/* TODO: implement group order sharing */}
              <button
                className="shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold"
                style={{ background: T.bg, color: T.ink }}
              >
                Start
              </button>
            </div>
          )}

          {/* Spotlight callout strip */}
          {restaurant.spotlightSlug && (
            <Link
              href={`/notes/partners/${restaurant.spotlightSlug}`}
              className="mx-4 mt-4 flex items-center gap-2.5 rounded-2xl p-3.5"
              style={{
                background: T.bgWarm,
                border: `1px dashed ${T.bgMuted}`,
              }}
            >
              <span
                className="text-lg font-semibold italic"
                style={{ fontFamily: "Georgia, serif", color: T.primary }}
              >
                ⁂
              </span>
              <p className="m-0 flex-1 text-[11.5px] leading-snug" style={{ color: T.ink }}>
                Read the spotlight on Yuki and Maïko
                <span className="ml-1 font-semibold" style={{ color: T.primary }}>→</span>
              </p>
            </Link>
          )}

          {/* Menu sections */}
          {categories.map((cat) => (
            <section key={cat.key} id={`section-${cat.key}`} className="px-4 pb-3 pt-5">
              <h2
                className="mb-3 pl-1 text-[22px] font-semibold italic leading-none tracking-tight"
                style={{ fontFamily: "Georgia, serif", color: T.ink }}
              >
                {cat.label}
              </h2>

              <div className="flex flex-col gap-2">
                {cat.items.map((item) => {
                  const qty = cart[item.id] ?? 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl p-3"
                      style={{ background: "white", border: `1px solid ${T.bgMuted}50` }}
                    >
                      {/* Colour swatch / image placeholder */}
                      <div
                        className="relative flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}CC)` }}
                      >
                        <span
                          className="text-[42px] font-bold italic leading-none opacity-40 text-white"
                          style={{ fontFamily: "Georgia, serif" }}
                        >
                          {item.name[0]}
                        </span>
                        {item.tag && (
                          <span
                            className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white"
                            style={{ background: T.ink }}
                          >
                            {item.tagIcon === "flame" && <Flame size={7} strokeWidth={2.5} />}
                            {item.tagIcon === "leaf" && <Leaf size={7} strokeWidth={2.5} />}
                            {item.tag}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="mb-0.5 text-[15px] font-semibold leading-snug tracking-tight"
                          style={{ fontFamily: "Georgia, serif", color: T.ink }}
                        >
                          {item.name}
                        </h3>
                        <p
                          className="line-clamp-2 mb-2 text-xs leading-snug"
                          style={{ color: T.inkSoft }}
                        >
                          {item.desc}
                        </p>
                        <div className="flex items-center justify-between">
                          <span
                            className="text-sm font-semibold italic"
                            style={{ fontFamily: "Georgia, serif", color: T.ink }}
                          >
                            ${item.price}
                          </span>

                          {qty === 0 ? (
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                              style={{ background: T.primary }}
                            >
                              <Plus size={11} strokeWidth={2.5} />
                              Add
                            </button>
                          ) : (
                            <div
                              className="pop flex items-center gap-2 rounded-full p-0.5"
                              key={qty}
                              style={{ background: T.ink }}
                            >
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform active:scale-90"
                              >
                                <Minus size={12} strokeWidth={2.5} />
                              </button>
                              <span className="min-w-[16px] text-center text-sm font-semibold text-white">
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-90"
                                style={{ background: T.bg, color: T.ink }}
                              >
                                <Plus size={12} strokeWidth={2.5} />
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

          {/* Fee transparency */}
          <div
            className="mx-4 mb-6 mt-2 rounded-2xl p-4"
            style={{ background: "white", border: `1px solid ${T.bgMuted}50` }}
          >
            <div className="mb-2.5 flex items-center gap-2">
              <Info size={13} strokeWidth={2} style={{ color: T.primary }} />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.25em]"
                style={{ color: T.primary }}
              >
                Fees, in plain English
              </span>
            </div>
            <p className="m-0 text-xs leading-relaxed" style={{ color: T.ink }}>
              We charge a $1.49 service fee. The other guys charge $4–6.
              The difference goes back to the kitchen and to your driver.
            </p>
          </div>

          <div
            className="mb-8 text-center text-xs italic opacity-50"
            style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}
          >
            — handled with care —
          </div>
        </div>

        {/* ── Sticky cart button ─────────────────────────────────────────── */}
        {itemCount > 0 && (
          <div
            className="slide-up fixed bottom-0 left-0 right-0 z-40 px-4 pb-8 pt-3"
            style={{ background: `linear-gradient(to top, ${T.bg} 70%, ${T.bg}00)` }}
          >
            <div className="mx-auto max-w-lg">
              {/* TODO: wire to real checkout flow once restaurant ordering is implemented */}
              <button
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-white shadow-xl"
                style={{
                  background: T.primary,
                  boxShadow: `0 12px 28px -10px ${T.primary}60`,
                }}
              >
                <div
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: T.primaryDark }}
                >
                  {itemCount}
                </div>
                <span
                  className="text-sm font-semibold tracking-tight"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  Review order
                </span>
                <span
                  className="text-sm font-semibold italic"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  ${subtotal.toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
