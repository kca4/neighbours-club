"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import CategoryTabs from "./CategoryTabs";
import MenuSection from "./MenuSection";
import MenuSearchBar from "./MenuSearchBar";
import type { SerializedMenuItem } from "./MenuItemCard";
import type { RestaurantInfo } from "../CartProvider";

// ─── Scroll-spy context ───────────────────────────────────────────────────────
// CategoryTabs reads this to decide whether to run its IntersectionObserver.
// MenuBrowser sets it to false while search is active so that collapsing
// sections don't cause erratic tab highlight jumps.

interface ScrollSpyContextValue {
  isScrollSpyActive: boolean;
  setScrollSpyActive: (v: boolean) => void;
}

const ScrollSpyContext = createContext<ScrollSpyContextValue>({
  isScrollSpyActive: true,
  setScrollSpyActive: () => {},
});

export function useMenuScrollSpy(): ScrollSpyContextValue {
  return useContext(ScrollSpyContext);
}

// ─── Filter helper ────────────────────────────────────────────────────────────

function matchesQuery(item: SerializedMenuItem, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    item.name.toLowerCase().includes(lower) ||
    (item.description?.toLowerCase().includes(lower) ?? false) ||
    item.tags.some((tag) => tag.toLowerCase().includes(lower))
  );
}

// ─── MenuBrowser ─────────────────────────────────────────────────────────────

interface MenuBrowserProps {
  /** All available menu items for this restaurant (one row per item). */
  items: SerializedMenuItem[];
  /** Restaurant identity — passed down to menu cards for cart actions. */
  restaurant: RestaurantInfo;
}

export default function MenuBrowser({ items, restaurant }: MenuBrowserProps) {
  const [isScrollSpyActive, setScrollSpyActive] = useState(true);
  const [query, setQuery] = useState("");

  // Stable callback so MenuSearchBar's debounce effect doesn't re-fire unnecessarily
  const handleSearch = useCallback((q: string) => setQuery(q), []);

  // Pause the Intersection Observer while search is active — filtered sections
  // collapse page height and make the observer fire against the wrong section.
  useEffect(() => {
    setScrollSpyActive(query === "");
  }, [query]);

  const isSearching = query.length > 0;

  // ── Categories — ordered by minimum sortOrder of first item in each group ──
  // sortOrder = JSON array index from the seed script, so this preserves the
  // merchant's intended category sequence regardless of DB iteration order.
  const categoryMinSort = new Map<string, number>();
  for (const item of items) {
    const cur = categoryMinSort.get(item.category) ?? Infinity;
    if (item.sortOrder < cur) categoryMinSort.set(item.category, item.sortOrder);
  }
  const realCategories = [...categoryMinSort.keys()].sort(
    (a, b) => categoryMinSort.get(a)! - categoryMinSort.get(b)!
  );

  const allCategories = realCategories;

  // ── Apply search filter across all items ─────────────────────────────────
  const filteredItems = isSearching
    ? items.filter((item) => matchesQuery(item, query))
    : items;

  const visibleCategories = isSearching
    ? realCategories.filter((cat) =>
        filteredItems.some((item) => item.category === cat)
      )
    : allCategories;

  // ── Group + sort items for each section ──────────────────────────────────
  const byCategory = new Map<string, SerializedMenuItem[]>();

  for (const cat of realCategories) {
    byCategory.set(
      cat,
      filteredItems
        .filter((item) => item.category === cat)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  const totalResults = filteredItems.length;

  return (
    <ScrollSpyContext.Provider value={{ isScrollSpyActive, setScrollSpyActive }}>
      {/* Search bar — between InfoBar and the tabs/result-count strip */}
      <MenuSearchBar onSearch={handleSearch} />

      {/* Tabs strip ↔ results count.
          CategoryTabs unmounting when isSearching also disconnects the observer
          (its useEffect cleanup fires on unmount). */}
      {isSearching ? (
        <div className="border-b border-foreground/8 bg-white px-5 py-3 sm:px-6">
          <p
            className="text-sm text-foreground/45"
            style={{ fontFamily: "var(--font-inter-tight)" }}
            aria-live="polite"
            aria-atomic="true"
          >
            {totalResults === 0
              ? `No results for "${query}"`
              : `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`}
          </p>
        </div>
      ) : allCategories.length > 0 ? (
        <CategoryTabs categories={allCategories} />
      ) : null}

      {/* Sections */}
      <div className="flex flex-col gap-10 py-6 pb-24">
        {!isSearching && items.length === 0 ? (
          /* Restaurant has no menu items yet */
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <p
              className="text-base font-semibold text-foreground/40"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Menu coming soon
            </p>
            <p className="text-sm text-foreground/30">
              This restaurant hasn&apos;t added their menu yet. Check back soon.
            </p>
          </div>
        ) : isSearching && visibleCategories.length === 0 ? (
          /* Search returned no matches */
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <p
              className="text-base font-semibold text-foreground/40"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Nothing found
            </p>
            <p className="text-sm text-foreground/30">Try a different search term</p>
          </div>
        ) : (
          visibleCategories.map((cat) => (
            <MenuSection
              key={cat}
              category={cat}
              items={byCategory.get(cat) ?? []}
              restaurant={restaurant}
            />
          ))
        )}
      </div>
    </ScrollSpyContext.Provider>
  );
}
