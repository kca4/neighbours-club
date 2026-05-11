import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, password, confirmPassword } = body ?? {};

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Missing password" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const resetToken = await (prisma as any).passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!resetToken) {
    return NextResponse.json({ error: "not_found" }, { status: 400 });
  }
  if (resetToken.usedAt !== null) {
    return NextResponse.json({ error: "used" }, { status: 400 });
  }
  if (new Date(resetToken.expiresAt) < new Date()) {
    return NextResponse.json({ error: "expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Update both atomically — mark token used first to prevent replay, then update password
  await (prisma as any).passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });
  await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });

  return NextResponse.json({ ok: true });
}
