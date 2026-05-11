import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  neighbourhoodName: z.string().min(1).max(100).optional(),
  postalCode: z.string().min(5).max(10).optional(),
});

// TODO: replace stub with real waitlist:
//   await prisma.neighbourhoodWaitlist.create({
//     data: {
//       email: body.email,
//       neighbourhoodName: body.neighbourhoodName,
//       postalCode: body.postalCode,
//     },
//   });
//   // TODO: send confirmation email via Resend with estimated launch timeline

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  return NextResponse.json({ ok: true, email: parsed.data.email });
}
