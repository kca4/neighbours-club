import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NoteCategory, NoteSourceType } from "@prisma/client";
import { Shield, DollarSign, Clock } from "lucide-react";
import { VerifyReadButton } from "./VerifyReadButton";
import { CorrectionRequestForm } from "./CorrectionRequestForm";

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

function impactColor(score: number): { dot: string; label: string } {
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
          className={`inline-block h-2 w-2 rounded-full ${i < score ? dot : "bg-gray-200"}`}
        />
      ))}
    </span>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await prisma.processedNote.findUnique({
    where: { slug },
    select: { headline: true, summary: true },
  });
  if (!note) return { title: "Note not found" };
  return {
    title: note.headline,
    description: note.summary.slice(0, 155),
  };
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = await prisma.processedNote.findUnique({
    where: { slug },
    include: {
      businessProfile: {
        select: {
          slug: true,
          businessName: true,
          address: true,
          phone: true,
          websiteUrl: true,
          isPublic: true,
        },
      },
      corrections: {
        where: { reply: { not: null } },
        select: { id: true, reply: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!note || !["APPROVED", "PUBLISHED"].includes(note.status)) {
    notFound();
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FAF8F3" }}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Back link */}
        <Link
          href="/notes"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium"
          style={{ color: "#0F766E" }}
        >
          ← Back to Notes
        </Link>

        <article className="mt-6">
          {/* Top row: category, source type, location, date */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryStyles[note.category]}`}
            >
              {note.category}
            </span>
            {note.sourceType === NoteSourceType.BUSINESS_SUBMISSION && (
              note.businessProfile?.isPublic ? (
                <Link
                  href={`/business/${note.businessProfile.slug}`}
                  className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200 transition-colors"
                >
                  Local Business
                </Link>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Local Business
                </span>
              )
            )}
            <span className="text-sm" style={{ color: "#1A1A2E", opacity: 0.55 }}>
              {note.streetOrArea}
            </span>
            <span className="text-sm" style={{ color: "#1A1A2E", opacity: 0.4 }}>
              · {formatDate(note.createdAt)}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-5 text-3xl font-bold leading-tight sm:text-4xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            {note.headline}
          </h1>

          {/* Impact scores */}
          <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-gray-100 bg-white px-4 py-3">
            {(
              [
                { icon: Shield, label: "Safety", score: note.impactSafety },
                { icon: DollarSign, label: "Cost", score: note.impactCost },
                { icon: Clock, label: "Time", score: note.impactTime },
              ] as const
            ).map(({ icon: Icon, label, score }) => {
              const { label: labelColor } = impactColor(score);
              return (
                <span key={label} className={`flex items-center gap-1.5 text-sm ${labelColor}`}>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-medium">{label}</span>
                  <ImpactDots score={score} />
                </span>
              );
            })}
          </div>

          {/* Summary */}
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#1A1A2E", opacity: 0.8 }}
          >
            {note.summary}
          </p>

          {/* Source link */}
          {note.sourceUrl && (
            <div className="mb-8">
              <a
                href={note.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-2"
                style={{ color: "#0F766E" }}
              >
                View original source →
              </a>
            </div>
          )}

          {/* Business info */}
          {note.businessProfile && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                Local Business
              </p>
              <p
                className="mb-2 text-lg font-bold"
                style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
              >
                {note.businessProfile.businessName}
              </p>
              {note.businessProfile.address && (
                <p className="mb-1 text-sm" style={{ color: "#1A1A2E", opacity: 0.7 }}>
                  {note.businessProfile.address}
                </p>
              )}
              {note.businessProfile.phone && (
                <p className="mb-1 text-sm" style={{ color: "#1A1A2E", opacity: 0.7 }}>
                  {note.businessProfile.phone}
                </p>
              )}
              {note.businessProfile.websiteUrl && (
                <a
                  href={note.businessProfile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium underline underline-offset-2"
                  style={{ color: "#0F766E" }}
                >
                  {note.businessProfile.websiteUrl}
                </a>
              )}
            </div>
          )}
          {/* Right-of-reply callouts — shown when a correction has an attached reply */}
          {note.corrections.length > 0 && (
            <div className="mb-6 space-y-3">
              {note.corrections.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3"
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
                    Right of reply
                  </p>
                  <p className="text-sm leading-relaxed text-blue-900">{c.reply}</p>
                </div>
              ))}
            </div>
          )}

          {/* Verify-read CP button — placed after all content so it signals
              the reader has reached the end. noteId only; no userId. */}
          <VerifyReadButton noteId={note.id} />

          {/* Correction request — public, no auth required */}
          <CorrectionRequestForm noteId={note.id} />
        </article>
      </div>
    </main>
  );
}
