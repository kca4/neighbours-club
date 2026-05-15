import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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
  businessName: z.string().min(1).max(100),
  contactEmail: z.string().email(),
  message: z.string().min(10).max(2000),
  address: z.string().min(1).max(200),
  websiteUrl: z.string().url().or(z.literal("")).optional(),
  phone: z.string().max(20).optional(),
  offerDetails: z.string().max(1000).optional(),
});

// ─── POST /api/notes/submit ───────────────────────────────────────────────────

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
    return NextResponse.json(
      { error: "Please check the form for errors." },
      { status: 400 }
    );
  }

  const { businessName, contactEmail, message, address, websiteUrl, phone, offerDetails } =
    parsed.data;

  await prisma.businessSubmission.create({
    data: {
      businessName,
      contactEmail,
      message,
      address,
      websiteUrl: websiteUrl || null,
      phone: phone || null,
      offerDetails: offerDetails || null,
    },
  });

  return NextResponse.json({ ok: true });
}
