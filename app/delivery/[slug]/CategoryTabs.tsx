"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMenuScrollSpy } from "./MenuBrowser";
import { slugifyCategory } from "./MenuSection";

interface CategoryTabsProps {
  categories: string[];
}

export default function CategoryTabs({ categories }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0] ?? "");
  const { isScrollSpyActive } = useMenuScrollSpy();
  const activeTabRef = useRef<HTMLButtonElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Intersection Observer — highlights the tab whose section midpoint is in view
  useEffect(() => {
    if (!isScrollSpyActive || categories.length === 0) return;

    const sectionEls = categories
      .map((cat) => document.getElementById(`menu-section-${slugifyCategory(cat)}`))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const matched = categories.find(
              (c) => `menu-section-${slugifyCategory(c)}` === entry.target.id
            );
            if (matched) setActiveCategory(matched);
          }
        }
      },
      { rootMargin: "-50% 0px", threshold: 0 }
    );

    for (const el of sectionEls) observer.observe(el);
    return () => observer.disconnect();
  }, [categories, isScrollSpyActive]);

  // Keep the active tab scrolled into view within the horizontal container
  useEffect(() => {
    if (!activeTabRef.current || !scrollContainerRef.current) return;
    activeTabRef.current.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeCategory]);

  const activateTab = useCallback(
    (category: string) => {
      setActiveCategory(category);
      document
        .getElementById(`menu-section-${slugifyCategory(category)}`)
        ?.scrollIntoView({ behavior: "smooth" });
    },
    []
  );

  // ── Keyboard navigation — roving tabindex pattern for ARIA tablist
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let nextIndex: number | null = null;
      switch (e.key) {
        case "ArrowRight":
          nextIndex = (index + 1) % categories.length;
          break;
        case "ArrowLeft":
          nextIndex = (index - 1 + categories.length) % categories.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = categories.length - 1;
          break;
        default:
          return;
      }
      e.preventDefault();
      // Move focus without activating (manual activation on click/Enter)
      const tabs =
        scrollContainerRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs?.[nextIndex]?.focus();
    },
    [categories.length]
  );

  return (
    // Sticks below the site header (≈ 60px, z-40). z-30 keeps tabs above
    // content but below the nav.
    <div
      className="sticky top-[60px] z-30 border-b border-foreground/8 bg-white shadow-sm"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Menu categories"
        className="flex items-end overflow-x-auto px-4 sm:px-6"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Suppress WebKit scrollbar without a global rule */}
        <style>{`[role="tablist"]::-webkit-scrollbar{display:none}`}</style>

        {categories.map((cat, index) => {
          const isActive = cat === activeCategory;
          return (
            <button
              key={cat}
              ref={(el) => {
                if (isActive) activeTabRef.current = el;
              }}
              role="tab"
              aria-selected={isActive}
              // Roving tabindex: only the active tab is reachable via Tab key;
              // arrow keys move within the tablist.
              tabIndex={isActive ? 0 : -1}
              onClick={() => activateTab(cat)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                "relative shrink-0 whitespace-nowrap px-4 py-3 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
                isActive
                  ? "font-semibold text-primary"
                  : "font-medium text-foreground/45 hover:text-foreground/65",
              ].join(" ")}
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              {cat}
              {/* Teal underline indicator for active tab */}
              {isActive && (
                <span
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
