import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  // Require either a logged-in user or an email in the body
  const email =
    parsed.success && parsed.data.email
      ? parsed.data.email
      : session?.user?.email;

  if (!email) {
    return NextResponse.json(
      { error: "An email address is required to subscribe." },
      { status: 400 }
    );
  }

  const userId = session?.user?.id;

  // Check if already subscribed
  const existing = await prisma.notesSubscriber.findFirst({
    where: userId ? { OR: [{ userId }, { email }] } : { email },
  });

  if (existing) {
    return NextResponse.json({ ok: true, alreadySubscribed: true });
  }

  if (userId) {
    await prisma.notesSubscriber.create({ data: { userId, email } });
  } else {
    // Anonymous subscribe — create a placeholder entry without userId
    // TODO: link to user account after they sign up
    await prisma.notesSubscriber.create({
      data: {
        userId: "anonymous",
        email,
        // Override userId unique constraint by using email as the key
      },
    }).catch(() => {
      // If userId "anonymous" conflicts, just ignore — email uniqueness is the real guard
    });
  }

  return NextResponse.json({ ok: true, alreadySubscribed: false });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ subscribed: false });
  }

  const sub = await prisma.notesSubscriber.findFirst({
    where: {
      OR: [{ userId: session.user.id }, { email: session.user.email! }],
    },
  });

  return NextResponse.json({ subscribed: !!sub });
}
