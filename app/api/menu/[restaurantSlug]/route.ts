import { NextRequest, NextResponse } from "next/server";

// TODO: replace mock with real database query:
//   const restaurant = await prisma.restaurant.findUnique({
//     where: { slug: restaurantSlug, isActive: true },
//     include: { menuItems: { where: { isAvailable: true }, orderBy: { sortOrder: 'asc' } } },
//   });

export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  colorHex: string;
  isAvailable: boolean;
}

export interface MenuCategoryData {
  label: string;
  items: MenuItemData[];
}

export interface RestaurantMenuData {
  slug: string;
  name: string;
  cuisine: string;
  estimatedMin: string;
  rating: number;
  reviewCount: number;
  categories: MenuCategoryData[];
  spotlightHref: string;
}

const MOCK_MENUS: Record<string, RestaurantMenuData> = {
  "maiko-ramen": {
    slug: "maiko-ramen",
    name: "Maïko Ramen",
    cuisine: "Japanese · Ramen",
    estimatedMin: "25–35 min",
    rating: 4.8,
    reviewCount: 212,
    spotlightHref: "/spotlight/maiko-ramen",
    categories: [
      {
        label: "Ramen",
        items: [
          {
            id: "tonkotsu",
            name: "Tonkotsu Classic",
            description:
              "18-hour pork bone broth, chashu, soft egg, scallion, nori.",
            price: 17,
            category: "Ramen",
            tags: ["Signature"],
            colorHex: "#C9954A",
            isAvailable: true,
          },
          {
            id: "spicy-miso",
            name: "Spicy Miso",
            description:
              "Three-miso blend, fermented chili, ground pork, soft egg.",
            price: 18,
            category: "Ramen",
            tags: ["Spicy"],
            colorHex: "#F59E0B",
            isAvailable: true,
          },
          {
            id: "shoyu",
            name: "Shoyu Ramen",
            description:
              "Clear chicken broth, house soy tare, bamboo, chashu.",
            price: 16,
            category: "Ramen",
            tags: [],
            colorHex: "#8B6508",
            isAvailable: true,
          },
          {
            id: "veg-shoyu",
            name: "Vegetable Shoyu",
            description:
              "Mushroom dashi, tofu, seasonal vegetables, scallion oil.",
            price: 16,
            category: "Ramen",
            tags: ["Veg"],
            colorHex: "#166534",
            isAvailable: true,
          },
        ],
      },
      {
        label: "Sides",
        items: [
          {
            id: "gyoza",
            name: "Pork Gyoza (5)",
            description: "Hand-folded, pan-fried. House ponzu on the side.",
            price: 9,
            category: "Sides",
            tags: [],
            colorHex: "#A8754D",
            isAvailable: true,
          },
          {
            id: "edamame",
            name: "Edamame",
            description: "Steamed, sea salt. Simple, exactly right.",
            price: 6,
            category: "Sides",
            tags: [],
            colorHex: "#5A8C4A",
            isAvailable: true,
          },
          {
            id: "karaage",
            name: "Chicken Karaage",
            description: "Marinated, double-fried. Lemon and kewpie.",
            price: 11,
            category: "Sides",
            tags: [],
            colorHex: "#B8860B",
            isAvailable: true,
          },
        ],
      },
      {
        label: "Drinks",
        items: [
          {
            id: "ramune",
            name: "Ramune",
            description: "Original or strawberry. Glass marble bottle.",
            price: 4,
            category: "Drinks",
            tags: [],
            colorHex: "#7AAFC8",
            isAvailable: true,
          },
          {
            id: "tea",
            name: "Cold Genmaicha",
            description: "Roasted brown rice green tea. Brewed daily.",
            price: 4,
            category: "Drinks",
            tags: [],
            colorHex: "#8B9D6F",
            isAvailable: true,
          },
        ],
      },
    ],
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  const { restaurantSlug } = await params;
  const menu = MOCK_MENUS[restaurantSlug];

  if (!menu) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  return NextResponse.json({ menu });
}
