import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

// TODO: replace with real DB read/update:
//   GET: return prisma.user.findUnique({ where: { id: session.user.id }, select: { isOnline: true } })
//   PATCH: await prisma.user.update({ where: { id: session.user.id }, data: { isOnline: body.isOnline } })

const patchSchema = z.object({
  isOnline: z.boolean(),
});

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  // TODO: return real driver online status from DB
  return NextResponse.json({ isOnline: false });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  // TODO: persist isOnline to DB and update geolocation tracking
  return NextResponse.json({ ok: true, isOnline: parsed.data.isOnline });
}
