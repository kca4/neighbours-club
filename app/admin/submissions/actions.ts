"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveSubmission(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const submission = await prisma.businessSubmission.findUniqueOrThrow({ where: { id } });

  await prisma.$transaction([
    prisma.businessSubmission.update({
      where: { id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
    prisma.processedNote.create({
      data: {
        headline: submission.businessName,
        summary: submission.message,
        category: "Business",
        sourceType: "BUSINESS_SUBMISSION",
        streetOrArea: submission.address,
        riskScore: 5,
        autoPublishEligible: false,
        impactSafety: 0,
        impactCost: 0,
        impactTime: 0,
        status: "DRAFT",
      },
    }),
  ]);

  revalidatePath("/admin/submissions");
  revalidatePath("/admin/notes");
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
