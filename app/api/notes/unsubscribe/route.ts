import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/notes?unsubscribed=error", req.url));
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!subscriber) {
    return NextResponse.redirect(new URL("/notes?unsubscribed=error", req.url));
  }

  if (subscriber.unsubscribedAt) {
    return NextResponse.redirect(
      new URL("/notes?unsubscribed=already", req.url)
    );
  }

  await prisma.subscriber.update({
    where: { unsubscribeToken: token },
    data: { unsubscribedAt: new Date() },
  });

  return NextResponse.redirect(new URL("/notes?unsubscribed=1", req.url));
}
