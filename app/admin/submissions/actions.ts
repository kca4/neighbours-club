"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBusinessSlug, generateNoteSlug } from "@/lib/slugify";
import { revalidatePath } from "next/cache";

export async function approveSubmission(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const submission = await prisma.businessSubmission.findUniqueOrThrow({ where: { id } });

  // Upsert profile keyed by contactEmail — second approval from same email reuses existing profile
  const existingProfile = await prisma.businessProfile.findFirst({
    where: { contactEmail: submission.contactEmail },
    select: { id: true, slug: true },
  });

  const slug = existingProfile?.slug ?? (await generateBusinessSlug(submission.businessName));

  const profile = existingProfile
    ? existingProfile
    : await prisma.businessProfile.create({
        data: {
          slug,
          businessName: submission.businessName,
          contactEmail: submission.contactEmail,
          address: submission.address,
          websiteUrl: submission.websiteUrl ?? null,
          phone: submission.phone ?? null,
          description: submission.message,
          offerDetails: submission.offerDetails ?? null,
          isPublic: true,
        },
        select: { id: true, slug: true },
      });

  const noteSlug = await generateNoteSlug(submission.businessName);

  await prisma.$transaction([
    prisma.businessSubmission.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        businessProfileId: profile.id,
      },
    }),
    prisma.processedNote.create({
      data: {
        headline: submission.businessName,
        summary: submission.message,
        category: "Business",
        sourceType: "BUSINESS_SUBMISSION",
        streetOrArea: submission.address,
        sourceUrl: submission.websiteUrl ?? null,
        riskScore: 5,
        autoPublishEligible: false,
        impactSafety: 0,
        impactCost: 0,
        impactTime: 0,
        slug: noteSlug,
        status: "DRAFT",
        businessProfileId: profile.id,
      },
    }),
  ]);

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/notes");
  revalidatePath(`/business/${profile.slug}`);
}

export async function rejectSubmission(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  await prisma.businessSubmission.update({
    where: { id },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });

  revalidatePath("/admin/submissions");
}
