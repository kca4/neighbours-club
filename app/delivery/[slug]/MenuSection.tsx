import { ImageMenuItemCard, ListMenuItemCard } from "./MenuItemCard";
import type { SerializedMenuItem } from "./MenuItemCard";
import type { RestaurantInfo } from "../CartProvider";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function slugifyCategory(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MenuSectionProps {
  category: string;
  items: SerializedMenuItem[];
  restaurant: RestaurantInfo;
}

export default function MenuSection({
  category,
  items,
  restaurant,
}: MenuSectionProps) {
  const imageItems = items.filter((item) => item.imageUrl);
  const listItems = items.filter((item) => !item.imageUrl);

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

      {/* Image items — 2-col grid */}
      {imageItems.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4">
          {imageItems.map((item) => (
            <ImageMenuItemCard
              key={item.id}
              item={item}
              restaurant={restaurant}
            />
          ))}
        </div>
      )}

      {/* List items — stacked */}
      {listItems.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {listItems.map((item) => (
            <ListMenuItemCard key={item.id} item={item} restaurant={restaurant} />
          ))}
        </div>
      )}
    </section>
  );
}
