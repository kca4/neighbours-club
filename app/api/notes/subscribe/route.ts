import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotesConfirmation } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

// ─── In-memory rate limiter (max 3 per IP per 10 min) ────────────────────────

type RateEntry = { count: number; windowStart: number };
const rateMap = new Map<string, RateEntry>();
const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
});

// ─── POST /api/notes/subscribe ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  const { email, name, source = "notes-page" } = parsed.data;
  const OK = NextResponse.json({
    ok: true,
    message: "Check your email to confirm your subscription.",
  });

  const existing = await prisma.subscriber.findUnique({ where: { email } });

  if (existing) {
    if (existing.confirmedAt) {
      // Already confirmed — return success silently (no email enumeration)
      return OK;
    }
    // Unconfirmed — regenerate token and resend
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    await prisma.subscriber.update({
      where: { email },
      data: { confirmationToken, subscribedAt: new Date(), source },
    });
    await sendNotesConfirmation({
      to: email,
      name: existing.name,
      confirmationToken,
      unsubscribeToken: existing.unsubscribeToken,
    });
    return OK;
  }

  // New subscriber
  const confirmationToken = crypto.randomBytes(32).toString("hex");
  const unsubscribeToken = crypto.randomBytes(32).toString("hex");

  // Pre-link to User if email matches an existing account
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  await prisma.subscriber.create({
    data: {
      email,
      name: name ?? null,
      confirmationToken,
      unsubscribeToken,
      source,
      userId: user?.id ?? null,
    },
  });

  await sendNotesConfirmation({ to: email, name, confirmationToken, unsubscribeToken });
  return OK;
}
