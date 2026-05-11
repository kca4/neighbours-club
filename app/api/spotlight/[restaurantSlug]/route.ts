import { NextRequest, NextResponse } from "next/server";

// TODO: replace mock data with real restaurant database lookup
// when Restaurant model is fully populated via partner onboarding.

export interface SpotlightDish {
  name: string;
  description: string;
  price: string;
  initial: string;
  colorGradient: [string, string];
}

export interface SpotlightData {
  slug: string;
  name: string;
  tagline: string;
  cuisine: string;
  address: string;
  addressSub: string;
  phone: string;
  distance: string;
  distanceSub: string;
  estimatedMin: string;
  isNewPartner: boolean;
  spotlightNumber: number;
  ownerName: string;
  story: string[];
  ownerQuote: string;
  signatureDishes: SpotlightDish[];
  driverNote: string;
  pickupCount: number;
  hours: { label: string; value: string; sub: string };
  menuHref: string;
}

const MOCK_SPOTLIGHTS: Record<string, SpotlightData> = {
  "maiko-ramen": {
    slug: "maiko-ramen",
    name: "Maïko Ramen",
    tagline:
      "Eighteen-hour broth, hidden behind a strip mall, run by one woman who really knows what she's doing.",
    cuisine: "Japanese · Ramen",
    address: "Behind Hazeldean Mall",
    addressSub: "Unit 4 · 300 Eagleson Rd",
    phone: "(613) 555-0142",
    distance: "1.4 km away",
    distanceSub: "About 6 min drive",
    estimatedMin: "25–35 min",
    isNewPartner: true,
    spotlightNumber: 7,
    ownerName: "Yuki Tanaka",
    story: [
      "Yuki Tanaka opened Maïko in a small unit behind Hazeldean Mall six years ago. There's no sign on the main road. You find it because someone tells you about it, or because you're hungry enough to follow the smell.",
      "The tonkotsu broth simmers for eighteen hours. The noodles are made fresh every morning. Yuki does most of it herself, with help from her son on weekends. She told us she joined Neighbours because the other apps were taking too much for someone running a kitchen this small.",
    ],
    ownerQuote:
      "I don't want my food to arrive cold to people who waited for it. That's the whole point of ramen.",
    signatureDishes: [
      {
        name: "Tonkotsu Classic",
        description: "The 18-hour broth. The reason this place exists.",
        price: "$17",
        initial: "T",
        colorGradient: ["#E8B872", "#C9954A"],
      },
      {
        name: "Spicy Miso",
        description: "Three kinds of miso, fermented chili, soft egg.",
        price: "$18",
        initial: "M",
        colorGradient: ["#F59E0B", "#D97706"],
      },
      {
        name: "Vegetable Shoyu",
        description: "Underrated. Mushroom dashi base, very clean.",
        price: "$16",
        initial: "V",
        colorGradient: ["#166534", "#14532D"],
      },
    ],
    driverNote:
      "Pickup is around the back, not the mall side. Yuki seals the broth in a separate container so it doesn't soak the noodles — combine them when it arrives. The first fifty orders ship with handwritten thank-you notes.",
    // TODO: replace hardcoded pickupCount with real database count
    pickupCount: 12,
    hours: {
      label: "Hours today",
      value: "11:30 AM – 9:00 PM",
      sub: "Closed Mondays",
    },
    menuHref: "/menu/maiko-ramen",
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  const { restaurantSlug } = await params;
  const spotlight = MOCK_SPOTLIGHTS[restaurantSlug];

  if (!spotlight) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ spotlight });
}
