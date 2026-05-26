import { ImageMenuItemCard, ListMenuItemCard } from "./MenuItemCard";
import type { SerializedMenuItem } from "./MenuItemCard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function slugifyCategory(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MenuSectionProps {
  category: string;
  items: SerializedMenuItem[];
  isMostOrdered?: boolean;
}

export default function MenuSection({
  category,
  items,
  isMostOrdered = false,
}: MenuSectionProps) {
  const imageItems = items.filter((item) => item.imageUrl);
  const listItems = items.filter((item) => !item.imageUrl);

  // Derive "Most Ordered" badges from real data
  let mostLikedId: string | null = null;
  let greatPriceId: string | null = null;

  if (isMostOrdered && items.length > 0) {
    // "#1 Most liked" — first item by sortOrder (already sorted)
    mostLikedId = items[0].id;

    // "Great price" — lowest-priced item; skip the #1 item if possible
    const sorted = [...items].sort((a, b) => a.price - b.price);
    greatPriceId = sorted[0].id === mostLikedId && sorted.length > 1
      ? sorted[1].id
      : sorted[0].id;

    // Don't show "Great price" if it would duplicate "#1 Most liked"
    if (greatPriceId === mostLikedId) greatPriceId = null;
  }

  return (
    <section
      id={`menu-section-${slugifyCategory(category)}`}
      // scroll-mt accounts for sticky header (~60px) + sticky tabs bar (~52px)
      className="scroll-mt-[116px] px-4 sm:px-6"
    >
      {/* Section heading */}
      <h2
        className="text-xl font-bold italic text-foreground"
        style={{ fontFamily: "var(--font-fraunces)" }}
      >
        {category}
      </h2>

      {isMostOrdered && (
        <p className="mt-1 text-sm text-foreground/50">
          The most commonly ordered items from this store
        </p>
      )}

      {/* Image items — 2-col grid */}
      {imageItems.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {imageItems.map((item) => {
            const badge =
              isMostOrdered && item.id === mostLikedId
                ? "#1 Most liked"
                : isMostOrdered && item.id === greatPriceId
                ? "Great price"
                : null;
            return <ImageMenuItemCard key={item.id} item={item} badge={badge} />;
          })}
        </div>
      )}

      {/* List items — stacked */}
      {listItems.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {listItems.map((item) => (
            <ListMenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
