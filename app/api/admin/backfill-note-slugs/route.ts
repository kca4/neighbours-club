import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slugify";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notes = await prisma.processedNote.findMany({
    where: { slug: null },
    select: { id: true, headline: true },
  });

  let updated = 0;
  for (const note of notes) {
    const base = toSlug(note.headline) || "note";
    let candidate = base;
    for (let i = 2; i <= 20; i++) {
      const existing = await prisma.processedNote.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing) break;
      candidate = `${base}-${i}`;
    }
    // Final fallback: append id prefix
    const finalSlug = candidate === base
      ? base
      : await (async () => {
          const check = await prisma.processedNote.findUnique({ where: { slug: candidate }, select: { id: true } });
          return check ? `${base}-${note.id.slice(0, 6)}` : candidate;
        })();

    await prisma.processedNote.update({
      where: { id: note.id },
      data: { slug: finalSlug },
    });
    updated++;
  }

  return NextResponse.json({ updated });
}
