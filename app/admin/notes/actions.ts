"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendUrgentNote } from "@/lib/email";

export async function approveNote(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");

  const note = await prisma.processedNote.findUniqueOrThrow({ where: { id } });

  await prisma.processedNote.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  const isUrgent =
    (note.category === "Safety" || note.category === "Weather") &&
    (note.impactSafety >= 4 || note.impactCost >= 4 || note.impactTime >= 4);

  if (isUrgent) {
    const subscribers = await prisma.subscriber.findMany({
      where: {
        confirmedAt: { not: null },
        urgentEnabled: true,
        unsubscribedAt: null,
      },
      select: { email: true, name: true, unsubscribeToken: true },
    });

    let sent = 0;
    for (const sub of subscribers) {
      const ok = await sendUrgentNote(sub, note);
      if (ok) sent++;
    }

    console.log(`[urgent-note] Sent ${sent}/${subscribers.length} emails for note ${id}`);

    await prisma.processedNote.update({
      where: { id },
      data: { sentAt: new Date() },
    });
  }

  revalidatePath("/admin/notes");
}

export async function rejectNote(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Forbidden");
  await prisma.processedNote.delete({ where: { id } });
  revalidatePath("/admin/notes");
}
