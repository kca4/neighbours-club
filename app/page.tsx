import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Neighbours Club — Kanata's Local Intelligence & Group Buying",
  description:
    "Know what's happening in Kanata. Save on everyday essentials by pooling orders with your neighbours. Free to join.",
};
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NoteCategory } from "@prisma/client";
import { SubscribeForm } from "@/app/components/SubscribeForm";

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

export default async function HomePage() {
  const session = await auth();
  const [recentNotes, confirmedSubscriber] = await Promise.all([
    prisma.processedNote.findMany({
      where: { status: { in: ["APPROVED", "PUBLISHED"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        headline: true,
        category: true,
        streetOrArea: true,
        summary: true,
        slug: true,
      },
    }),
    session?.user?.email
      ? prisma.subscriber.findFirst({
          where: { email: session.user.email, confirmedAt: { not: null } },
          select: { id: true },
        })
      : null,
  ]);
  const isSubscribed = !!confirmedSubscriber;

  return (
    <main>
      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(15,118,110,0.08) 0%, transparent 65%), #FAF8F3",
        }}
        className="px-4 pb-20 pt-20 sm:pb-28 sm:pt-28"
      >
        <div
          className="mx-auto max-w-2xl text-center"
          style={{ animation: "fadeInUp 0.7s ease both" }}
        >
          <p
            className="mb-4 text-sm font-semibold uppercase tracking-widest"
            style={{ color: "#0F766E" }}
          >
            Kanata, Ottawa
          </p>
          <h1
            className="mb-6 text-5xl font-bold leading-tight sm:text-6xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            Your neighbourhood,{" "}
            <br className="hidden sm:block" />
            <span style={{ color: "#0F766E" }}>working together.</span>
          </h1>
          <p
            className="mb-10 text-lg leading-relaxed"
            style={{ color: "#1A1A2E", opacity: 0.7 }}
          >
            Kanata&apos;s local intelligence and group buying platform.{" "}
            Know what&apos;s happening. Save together.
          </p>
          {isSubscribed ? (
            <p className="text-sm" style={{ color: "#0F766E" }}>
              You&apos;re subscribed to Neighbours Notes.
            </p>
          ) : (
            <>
              <div className="mx-auto max-w-md">
                <SubscribeForm source="homepage" />
              </div>
              <p className="text-sm" style={{ color: "#1A1A2E", opacity: 0.45 }}>
                Free. One email to confirm. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-12 text-center text-3xl font-bold sm:text-4xl"
            style={{
              fontFamily: "var(--font-fraunces)",
              color: "#1A1A2E",
              animation: "fadeInUp 0.6s ease 0.05s both",
            }}
          >
            How it works
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {(
              [
                {
                  icon: "📡",
                  title: "Get the intel",
                  body: "Road closures, development applications, restaurant openings — summarized daily for your inbox.",
                  delay: "0.1s",
                },
                {
                  icon: "🛒",
                  title: "Save together",
                  body: "Pool orders with your neighbours for wholesale prices on everyday essentials.",
                  delay: "0.2s",
                },
                {
                  icon: "🏘️",
                  title: "Strengthen your neighbourhood",
                  body: "The more neighbours join, the better the deals and the smarter the intel.",
                  delay: "0.3s",
                },
              ] as const
            ).map(({ icon, title, body, delay }) => (
              <div
                key={title}
                className="rounded-2xl bg-white p-6 shadow-sm"
                style={{ animation: `fadeInUp 0.6s ease ${delay} both` }}
              >
                <div className="mb-4 text-3xl leading-none">{icon}</div>
                <h3
                  className="mb-2 text-lg font-bold"
                  style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#1A1A2E", opacity: 0.65 }}
                >
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST NOTES ────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20" style={{ backgroundColor: "white" }}>
        <div className="mx-auto max-w-4xl">
          <div
            className="mb-8 flex items-end justify-between gap-4"
            style={{ animation: "fadeInUp 0.6s ease 0.05s both" }}
          >
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
            >
              Latest from Kanata
            </h2>
            <Link
              href="/notes"
              className="shrink-0 text-sm font-medium underline-offset-2 hover:underline"
              style={{ color: "#0F766E" }}
            >
              See all notes →
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="rounded-xl border border-gray-100 px-6 py-10 text-center">
              <p className="text-sm" style={{ color: "#1A1A2E", opacity: 0.5 }}>
                Notes will appear here once approved.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              {recentNotes.map((note, i) => (
                <Link
                  key={note.id}
                  href={note.slug ? `/notes/${note.slug}` : "/notes"}
                  className="flex flex-col rounded-2xl border border-gray-100 p-5 transition-shadow hover:shadow-md"
                  style={{
                    backgroundColor: "#FAF8F3",
                    animation: `fadeInUp 0.6s ease ${0.1 + i * 0.1}s both`,
                  }}
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${categoryStyles[note.category]}`}
                    >
                      {note.category}
                    </span>
                    {note.streetOrArea && (
                      <span className="text-xs" style={{ color: "#1A1A2E", opacity: 0.5 }}>
                        {note.streetOrArea}
                      </span>
                    )}
                  </div>
                  <h3
                    className="mb-2 text-base font-semibold leading-snug"
                    style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
                  >
                    {note.headline}
                  </h3>
                  <p
                    className="line-clamp-3 text-sm leading-relaxed"
                    style={{ color: "#1A1A2E", opacity: 0.65 }}
                  >
                    {note.summary}
                  </p>
                </Link>
              ))}
            </div>
          )}

          <div
            className="mt-8 text-center"
            style={{ animation: "fadeInUp 0.6s ease 0.4s both" }}
          >
            <Link
              href="/notes"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border-2 px-6 text-sm font-semibold transition-colors hover:bg-teal-50"
              style={{ borderColor: "#0F766E", color: "#0F766E" }}
            >
              See all notes →
            </Link>
          </div>
        </div>
      </section>

      {/* ── GROUP BUY ───────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20">
        <div
          className="mx-auto max-w-2xl text-center"
          style={{ animation: "fadeInUp 0.6s ease 0.05s both" }}
        >
          <p className="mb-6 text-4xl leading-none" aria-hidden="true">
            🏷️
          </p>
          <h2
            className="mb-4 text-3xl font-bold sm:text-4xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            Save more when you buy together
          </h2>
          <p
            className="mb-8 text-base leading-relaxed"
            style={{ color: "#1A1A2E", opacity: 0.7 }}
          >
            Group buys let neighbours pool orders to hit wholesale price tiers. When enough
            people join a deal, everyone pays less — automatically. Pick up at a local spot
            in Kanata, no subscriptions required.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/deals"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-8 text-base font-semibold text-white transition-colors sm:w-auto"
              style={{ backgroundColor: "#0F766E" }}
            >
              Browse current deals
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 px-8 text-base font-semibold transition-colors sm:w-auto"
              style={{ borderColor: "#0F766E", color: "#0F766E" }}
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOR BUSINESSES ──────────────────────────────────── */}
      <section className="px-4 py-14 sm:py-16" style={{ backgroundColor: "#0F766E" }}>
        <div
          className="mx-auto max-w-2xl text-center"
          style={{ animation: "fadeInUp 0.6s ease 0.05s both" }}
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-200">
            For local businesses
          </p>
          <h2
            className="mb-3 text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Are you a Kanata business?
          </h2>
          <p className="mb-6 text-base text-teal-100">
            Get discovered by your neighbours. Submit an announcement — it&apos;s free.
          </p>
          <Link
            href="/business"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-white px-8 text-base font-semibold transition-colors hover:bg-teal-50"
            style={{ color: "#0F766E" }}
          >
            Submit an announcement
          </Link>
        </div>
      </section>
    </main>
  );
}
