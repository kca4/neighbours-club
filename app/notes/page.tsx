import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { NoteCategory } from "@prisma/client";
import { Shield, DollarSign, Clock } from "lucide-react";
import { SubscribeForm } from "./SubscribeForm";

export const metadata: Metadata = {
  title: "Neighbours Notes",
  description: "What's happening in your neighbourhood — local news and civic updates for Kanata.",
};

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return "yesterday";
  return `${Math.floor(hrs / 24)}d ago`;
}

const categoryStyles: Record<NoteCategory, string> = {
  Safety: "bg-red-100 text-red-700",
  Transit: "bg-blue-100 text-blue-700",
  DevApp: "bg-purple-100 text-purple-700",
  Cost: "bg-amber-100 text-amber-700",
  Social: "bg-green-100 text-green-700",
  Weather: "bg-sky-100 text-sky-700",
  Other: "bg-gray-100 text-gray-600",
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
          className={`inline-block h-1.5 w-1.5 rounded-full ${i < score ? dot : "bg-gray-200"}`}
        />
      ))}
    </span>
  );
}

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string; unsubscribed?: string }>;
}) {
  const { subscribed, unsubscribed } = await searchParams;
  const notes = await prisma.processedNote.findMany({
    where: { status: { in: ["APPROVED", "PUBLISHED"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FAF8F3" }}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        {subscribed === "1" && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
            You&apos;re subscribed to Neighbours Notes! Check your inbox for the first edition.
          </div>
        )}
        {unsubscribed === "1" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You&apos;ve been unsubscribed from Neighbours Notes.
          </div>
        )}
        {unsubscribed === "already" && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
            You&apos;re already unsubscribed from Neighbours Notes.
          </div>
        )}
        <h1
          className="mb-1 text-3xl font-bold"
          style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
        >
          Neighbours Notes
        </h1>
        <p className="mb-6 text-sm" style={{ color: "#1A1A2E", opacity: 0.6 }}>
          What&apos;s happening in your neighbourhood
        </p>
        <p className="mb-6 text-xs italic" style={{ color: "#1A1A2E", opacity: 0.45 }}>
          Impact dots show how much each note affects safety, cost, and time — 1 dot (low) to 5 dots (high).
        </p>

        <SubscribeForm />

        {notes.length === 0 ? (
          <div
            className="rounded-xl border-2 px-6 py-10 text-center"
            style={{ borderColor: "#0F766E" }}
          >
            <p
              className="mb-2 text-xl font-semibold"
              style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
            >
              Nothing yet
            </p>
            <p className="text-sm" style={{ color: "#1A1A2E", opacity: 0.6 }}>
              Approved notes will appear here. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <article
                key={note.id}
                className="rounded-xl bg-white p-4 shadow-sm"
              >
                {/* Top row */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyles[note.category]}`}
                    >
                      {note.category}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: "#1A1A2E", opacity: 0.5 }}
                    >
                      {note.streetOrArea}
                    </span>
                  </div>
                  <span
                    className="shrink-0 text-xs"
                    style={{ color: "#1A1A2E", opacity: 0.4 }}
                  >
                    {relativeTime(note.createdAt)}
                  </span>
                </div>

                {/* Headline */}
                <h2
                  className="mb-1.5 text-base font-semibold leading-snug"
                  style={{
                    fontFamily: "var(--font-fraunces)",
                    color: "#1A1A2E",
                  }}
                >
                  {note.headline}
                </h2>

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
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
