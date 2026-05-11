import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordReset } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

  // Always return 200 — never reveal whether the email exists (prevents enumeration)
  const ok = NextResponse.json({ ok: true });

  if (!email) return ok;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });

  if (!user) return ok;

  // Rate-limit: if a valid unused token was created within the last 5 minutes, skip
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentToken = await (prisma as any).passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: fiveMinutesAgo },
    },
  });

  if (recentToken) return ok;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await (prisma as any).passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  await sendPasswordReset({ to: user.email, memberName: user.name, token });

  return ok;
}
