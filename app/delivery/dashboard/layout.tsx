import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OperatingHours } from "@/lib/types/delivery";
import DashboardShell from "./DashboardShell";
import type { OwnedRestaurant } from "./DashboardShell";

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/delivery/dashboard");
  }

  const rows = await prisma.restaurant.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      hours: true,
      isPaused: true,
    },
    orderBy: { name: "asc" },
  });

  // ── Zero restaurants ────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/8">
          <Store size={36} strokeWidth={1.5} className="text-primary/60" />
        </div>

        <div className="max-w-sm text-center">
          <h1
            className="text-2xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            No restaurants yet
          </h1>
          <p
            className="mt-3 text-sm leading-relaxed text-foreground/55"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            You&apos;re not managing any restaurants on Neighbours Club yet.
            Apply to become a partner and we&apos;ll get your kitchen set up.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Link
            href="/partner/apply"
            className="rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Apply to be a partner
          </Link>
          <Link
            href="/delivery"
            className="text-sm text-foreground/45 hover:text-foreground/70 transition-colors"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Back to delivery
          </Link>
        </div>
      </div>
    );
  }

  // ── Serialise Prisma types for client boundary ──────────────────────────────
  const restaurants: OwnedRestaurant[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    logoUrl: r.logoUrl,
    hours: r.hours as unknown as OperatingHours,
    isPaused: r.isPaused,
  }));

  // ── DashboardShell uses useSearchParams — requires Suspense ────────────────
  return (
    <Suspense>
      <DashboardShell restaurants={restaurants}>{children}</DashboardShell>
    </Suspense>
  );
}
