import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";

const VALID_STEPS = ["welcome", "about", "owner", "hours", "menu", "photos", "payouts", "call"] as const;
type OnboardingStep = typeof VALID_STEPS[number];

// TODO: persist partial onboarding data per step:
//   await prisma.partnerApplication.upsert({
//     where: { userId: session.user.id },
//     create: { userId: session.user.id, currentStep: step, data: body },
//     update: { currentStep: step, data: { ...existing.data, ...body } },
//   });

const bodySchema = z.record(z.string(), z.unknown());

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ step: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { step } = await params;
  if (!VALID_STEPS.includes(step as OnboardingStep)) {
    return NextResponse.json({ error: "Unknown step" }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  bodySchema.parse(body); // validate it's an object
  // TODO: persist step data to PartnerApplication draft
  return NextResponse.json({ ok: true, step, saved: true });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ step: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const { step } = await params;
  // TODO: return saved draft data for this step from PartnerApplication
  return NextResponse.json({ step, data: {} });
}
