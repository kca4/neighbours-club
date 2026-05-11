import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  reaction: z.enum(["love", "fire", "thanks", "cozy"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Sign in to react to an issue." },
      { status: 401 }
    );
  }

  const { issueId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  }

  const { reaction } = parsed.data;

  // Upsert: one reaction per user per issue (last reaction wins)
  await prisma.noteReaction.upsert({
    where: { userId_issueId: { userId: session.user.id, issueId } },
    update: { reaction },
    create: { userId: session.user.id, issueId, reaction },
  });

  // Return aggregate counts for this issue
  const counts = await prisma.noteReaction.groupBy({
    by: ["reaction"],
    where: { issueId },
    _count: true,
  });

  return NextResponse.json({
    ok: true,
    counts: counts.map((c) => ({ reaction: c.reaction, count: c._count })),
  });
}
