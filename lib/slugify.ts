import { prisma } from "@/lib/prisma";

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function generateBusinessSlug(name: string): Promise<string> {
  const base = toSlug(name) || "business";
  let candidate = base;
  for (let i = 2; i <= 20; i++) {
    const existing = await prisma.businessProfile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${i}`;
  }
  // Fallback: append a short random suffix
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function generateNoteSlug(headline: string): Promise<string> {
  const base = toSlug(headline) || "note";
  let candidate = base;
  for (let i = 2; i <= 20; i++) {
    const existing = await prisma.processedNote.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}-${i}`;
  }
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}
