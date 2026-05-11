import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace mock with real reviews query:
//   const reviews = await prisma.deliveryOrderReview.findMany({
//     where: { order: { restaurantId: restaurant.id } },
//     include: { author: { select: { firstName: true } } },
//     orderBy: { createdAt: "desc" },
//     take: 20,
//   });

export interface CustomerFeedback {
  id: string;
  customerFirstName: string;
  rating: number;
  comment: string;
  dish?: string;
  createdAt: string;
  isPublic: boolean;
}

const MOCK_FEEDBACK: CustomerFeedback[] = [
  {
    id: "rev_001",
    customerFirstName: "James",
    rating: 5,
    comment: "Best ramen in Kanata. The broth arrived hot and the noodles were perfectly packaged separately.",
    dish: "Tonkotsu Classic",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
  },
  {
    id: "rev_002",
    customerFirstName: "Priya",
    rating: 5,
    comment: "Obsessed with the spicy miso. Yuki knows what she's doing.",
    dish: "Spicy Miso",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
  },
  {
    id: "rev_003",
    customerFirstName: "Marco",
    rating: 4,
    comment: "Great food, delivery was slightly late but driver kept me updated.",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isPublic: true,
  },
];

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ feedback: MOCK_FEEDBACK });
}
