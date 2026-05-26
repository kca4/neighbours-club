"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import CategoryTabs from "./CategoryTabs";
import MenuSection from "./MenuSection";
import MenuSearchBar from "./MenuSearchBar";
import type { SerializedMenuItem } from "./MenuItemCard";

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
  items: SerializedMenuItem[];
}

const MOST_ORDERED = "Most Ordered";

export default function MenuBrowser({ items }: MenuBrowserProps) {
  const [isScrollSpyActive, setScrollSpyActive] = useState(true);
  const [query, setQuery] = useState("");

  // Stable callback so MenuSearchBar's debounce effect doesn't re-fire unnecessarily
  const handleSearch = useCallback((q: string) => setQuery(q), []);

  // Pause observer while search is active — filtered sections collapse page height
  // and make the observer fire against the wrong section.
  useEffect(() => {
    setScrollSpyActive(query === "");
  }, [query]);

  // ── Category list — "Most Ordered" always first if present ───────────────
  const rawCategories = Array.from(new Set(items.map((item) => item.category)));
  const hasMostOrdered = rawCategories.includes(MOST_ORDERED);
  const allCategories = hasMostOrdered
    ? [MOST_ORDERED, ...rawCategories.filter((c) => c !== MOST_ORDERED)]
    : rawCategories;

  // ── Filter ───────────────────────────────────────────────────────────────
  const isSearching = query.length > 0;
  const filteredItems = isSearching
    ? items.filter((item) => matchesQuery(item, query))
    : items;
  const visibleCategories = isSearching
    ? allCategories.filter((cat) =>
        filteredItems.some((item) => item.category === cat)
      )
    : allCategories;

  // Group + sort items within each visible category
  const byCategory = new Map<string, SerializedMenuItem[]>();
  for (const cat of visibleCategories) {
    byCategory.set(
      cat,
      filteredItems
        .filter((item) => item.category === cat)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    );
  }

  const totalResults = filteredItems.length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <ScrollSpyContext.Provider value={{ isScrollSpyActive, setScrollSpyActive }}>
      {/* Search bar — between InfoBar and the tabs/result-count strip */}
      <MenuSearchBar onSearch={handleSearch} />

      {/* Tabs strip ↔ results count (CategoryTabs unmount disconnects observer) */}
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
        {/* No items at all — restaurant hasn't set up their menu yet */}
        {!isSearching && items.length === 0 ? (
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
              // Suppress subtitle + badges when filtering — filtered subset ≠ ranked list
              isMostOrdered={cat === MOST_ORDERED && !isSearching}
            />
          ))
        )}
      </div>
    </ScrollSpyContext.Provider>
  );
}
