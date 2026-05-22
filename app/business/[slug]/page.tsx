import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NoteCategory } from "@prisma/client";
import { Shield, DollarSign, Clock, MapPin, Phone, Globe, ArrowLeft } from "lucide-react";

const categoryStyles: Record<NoteCategory, string> = {
  Safety: "bg-red-100 text-red-700",
  Transit: "bg-blue-100 text-blue-700",
  DevApp: "bg-purple-100 text-purple-700",
  Cost: "bg-amber-100 text-amber-700",
  Social: "bg-green-100 text-green-700",
  Weather: "bg-sky-100 text-sky-700",
  Other: "bg-gray-100 text-gray-600",
  Business: "bg-orange-100 text-orange-700",
};

function impactColor(score: number) {
  if (score <= 1) return { dot: "bg-green-500", label: "text-green-700" };
  if (score <= 3) return { dot: "bg-amber-500", label: "text-amber-700" };
  return { dot: "bg-red-500", label: "text-red-700" };
}

function ImpactDots({ score, max = 5 }: { score: number; max?: number }) {
  const { dot } = impactColor(score);
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${i < score ? dot : "bg-gray-200"}`}
        />
      ))}
    </span>
  );
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins <= 0) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return "yesterday";
  return `${Math.floor(hrs / 24)}d ago`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.businessProfile.findUnique({
    where: { slug },
    select: { businessName: true, description: true },
  });
  if (!profile) return { title: "Business Not Found" };
  return {
    title: `${profile.businessName} | Neighbours Club`,
    description: profile.description.slice(0, 160),
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await prisma.businessProfile.findUnique({
    where: { slug },
    include: {
      notes: {
        where: { status: { in: ["APPROVED", "PUBLISHED"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile || !profile.isPublic) notFound();

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FAF8F3" }}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/notes"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
          style={{ color: "#0F766E" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Neighbours Notes
        </Link>

        {/* Profile card */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          {/* Badge */}
          <span className="mb-4 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Local Business
          </span>

          {/* Name */}
          <h1
            className="mb-4 text-2xl font-bold leading-tight sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            {profile.businessName}
          </h1>

          {/* Contact details */}
          <div className="mb-5 space-y-2">
            <div className="flex items-start gap-2 text-sm" style={{ color: "#1A1A2E", opacity: 0.7 }}>
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#0F766E" }} />
              <span>{profile.address}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "#1A1A2E", opacity: 0.7 }}>
                <Phone className="h-4 w-4 shrink-0" style={{ color: "#0F766E" }} />
                <a href={`tel:${profile.phone}`} className="hover:underline">
                  {profile.phone}
                </a>
              </div>
            )}
            {profile.websiteUrl && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 shrink-0" style={{ color: "#0F766E" }} />
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                  style={{ color: "#0F766E" }}
                >
                  {profile.websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="mb-4 text-sm leading-relaxed" style={{ color: "#1A1A2E", opacity: 0.8 }}>
            {profile.description}
          </p>

          {/* Offer details */}
          {profile.offerDetails && (
            <div
              className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed"
              style={{ color: "#1A1A2E" }}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Current offer
              </p>
              {profile.offerDetails}
            </div>
          )}
        </div>

        {/* Notes */}
        {profile.notes.length > 0 && (
          <section>
            <h2
              className="mb-4 text-lg font-semibold"
              style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
            >
              From this business
            </h2>
            <div className="space-y-4">
              {profile.notes.map((note) => (
                <article key={note.id} className="rounded-xl bg-white p-4 shadow-sm">
                  {/* Top row */}
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyles[note.category]}`}
                      >
                        {note.category}
                      </span>
                      <span className="text-xs" style={{ color: "#1A1A2E", opacity: 0.5 }}>
                        {note.streetOrArea}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs" style={{ color: "#1A1A2E", opacity: 0.4 }}>
                      {relativeTime(note.createdAt)}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3
                    className="mb-1.5 text-base font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
                  >
                    {note.headline}
                  </h3>

                  {/* Summary */}
                  <p
                    className="mb-3 line-clamp-3 text-sm leading-relaxed"
                    style={{ color: "#1A1A2E", opacity: 0.75 }}
                  >
                    {note.summary}
                  </p>

                  {/* Impact row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                    {(
                      [
                        { icon: Shield, label: "Safety", score: note.impactSafety },
                        { icon: DollarSign, label: "Cost", score: note.impactCost },
                        { icon: Clock, label: "Time", score: note.impactTime },
                      ] as const
                    ).map(({ icon: Icon, label, score }) => {
                      const { label: labelColor } = impactColor(score);
                      return (
                        <span key={label} className={`flex items-center gap-1 ${labelColor}`}>
                          <Icon className="h-3 w-3 shrink-0" />
                          <span>{label}</span>
                          <ImpactDots score={score} />
                        </span>
                      );
                    })}
                  </div>

                  {note.sourceUrl && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <a
                        href={note.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium"
                        style={{ color: "#0F766E" }}
                      >
                        Visit website →
                      </a>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
