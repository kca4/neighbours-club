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
  /**
   * The top-N items to show in the virtual "Most Ordered" section.
   * These are the SAME objects from `items` — same IDs, no DB duplication.
   * Derived in the server component by sorting items by sortOrder globally
   * and slicing the first 4.
   */
  mostOrderedItems: SerializedMenuItem[];
  /** Restaurant identity — passed down to menu cards for cart actions. */
  restaurant: RestaurantInfo;
}

const MOST_ORDERED = "Most Ordered";

export default function MenuBrowser({ items, mostOrderedItems, restaurant }: MenuBrowserProps) {
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

  // ── Real categories — derived from items, never includes "Most Ordered" ──
  // Items in mostOrderedItems also appear here in their real categories,
  // matching the DoorDash pattern where popular items show up in both sections.
  const realCategories = Array.from(
    new Set(items.map((item) => item.category).filter((c) => c !== MOST_ORDERED))
  );

  // ── Full category list for tabs ──────────────────────────────────────────
  // "Most Ordered" is first, but hidden during search (items are reachable
  // via their real categories and deduplication is irrelevant in search).
  const allCategories = isSearching
    ? realCategories
    : mostOrderedItems.length > 0
    ? [MOST_ORDERED, ...realCategories]
    : realCategories;

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

  if (!isSearching && mostOrderedItems.length > 0) {
    // "Most Ordered" is a virtual section — items are NOT re-sorted by sortOrder
    // here because they arrive pre-sorted from the server.
    byCategory.set(MOST_ORDERED, mostOrderedItems);
  }

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
              // Show the subtitle + ranking badges only in the "Most Ordered"
              // section when not filtering (a filtered subset ≠ the ranked list).
              isMostOrdered={cat === MOST_ORDERED && !isSearching}
            />
          ))
        )}
      </div>
    </ScrollSpyContext.Provider>
  );
}
