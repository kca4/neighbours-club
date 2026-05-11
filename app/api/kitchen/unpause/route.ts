import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// TODO: replace with real DB update:
//   await prisma.restaurant.update({
//     where: { userId: session.user.id },
//     data: { isAcceptingOrders: true, pausedAt: null },
//   });

export async function POST(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, isAccepting: true });
}
