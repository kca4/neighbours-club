"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveNote(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  await prisma.processedNote.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  revalidatePath("/admin/notes");
}

export async function rejectNote(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  await prisma.processedNote.delete({ where: { id } });
  revalidatePath("/admin/notes");
}
