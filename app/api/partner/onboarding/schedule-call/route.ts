import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  slotDate: z.string(), // e.g. "2026-05-06"
  slotTime: z.string(), // e.g. "14:00"
  timezone: z.string().default("America/Toronto"),
  preferPhone: z.boolean().optional(),
  notes: z.string().max(300).optional(),
});

// TODO: integrate with real calendar booking:
//   1. Check slot availability in Google Calendar / Calendly
//   2. Create calendar event and send confirmation email via Resend
//   3. Update PartnerApplication.callScheduledAt
//   4. Notify the internal partner success team

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  // TODO: create real booking
  return NextResponse.json({
    ok: true,
    scheduledAt: `${parsed.data.slotDate}T${parsed.data.slotTime}:00`,
    confirmationEmailSent: false, // TODO: true after Resend integration
  });
}
