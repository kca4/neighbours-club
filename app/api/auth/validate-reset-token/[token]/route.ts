import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const resetToken = await (prisma as any).passwordResetToken.findUnique({
    where: { token },
    select: { expiresAt: true, usedAt: true },
  });

  if (!resetToken) {
    return NextResponse.json({ valid: false, reason: "not_found" });
  }
  if (resetToken.usedAt !== null) {
    return NextResponse.json({ valid: false, reason: "used" });
  }
  if (new Date(resetToken.expiresAt) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({ valid: true });
}
