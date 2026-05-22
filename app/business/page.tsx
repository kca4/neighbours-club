import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "For Businesses | Neighbours Club",
  description:
    "Reach Kanata residents through Neighbours Notes. Submit your business announcement for free.",
};

export default async function BusinessPage() {
  const [subscriberCount, noteCount] = await Promise.all([
    prisma.subscriber.count({
      where: { confirmedAt: { not: null }, unsubscribedAt: null },
    }),
    prisma.processedNote.count({
      where: { status: { in: ["APPROVED", "PUBLISHED"] } },
    }),
  ]);

  const subscriberStat =
    subscriberCount >= 10
      ? `${subscriberCount} Kanata residents subscribed`
      : "Growing community of Kanata residents";

  const noteStat =
    noteCount >= 10
      ? `${noteCount} notes published`
      : "Neighbours Notes published and growing";

  const showExactSubscribers = subscriberCount >= 10;
  const showExactNotes = noteCount >= 10;

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section
        className="px-4 py-16 sm:py-24 text-center"
        style={{ backgroundColor: "#FAF8F3" }}
      >
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: "#0F766E" }}>
            Neighbours Notes · For Businesses
          </p>
          <h1
            className="mb-5 text-4xl font-bold leading-tight sm:text-5xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            Reach your Kanata neighbours
          </h1>
          <p className="mb-8 text-lg leading-relaxed" style={{ color: "#1A1A2E", opacity: 0.7 }}>
            Get your business in front of local residents who care about their neighbourhood. Free.
          </p>
          <Link
            href="/notes/submit"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-10 text-base font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#0F766E" }}
          >
            Submit your announcement →
          </Link>
        </div>
      </section>

      {/* ── WHY NEIGHBOURS CLUB ──────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20" style={{ backgroundColor: "#FAF8F3" }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            Why Neighbours Club?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* Card 1 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#0F766E1A" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0F766E" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold" style={{ color: "#1A1A2E" }}>
                Targeted reach
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1A1A2E", opacity: 0.65 }}>
                Your announcement goes directly to Kanata residents — not the whole internet.
              </p>
            </div>
            {/* Card 2 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#0F766E1A" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0F766E" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold" style={{ color: "#1A1A2E" }}>
                Trusted source
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1A1A2E", opacity: 0.65 }}>
                Neighbours Notes is an editorial feed, not a spam folder. We review every submission.
              </p>
            </div>
            {/* Card 3 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: "#0F766E1A" }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#0F766E" strokeWidth="2">
                  <path d="M20 12V22H4V12" />
                  <path d="M22 7H2v5h20V7z" />
                  <path d="M12 22V7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-base font-semibold" style={{ color: "#1A1A2E" }}>
                Zero cost to start
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#1A1A2E", opacity: 0.65 }}>
                Basic listings are free. Get discovered by your neighbours today.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20" style={{ backgroundColor: "#0F766E" }}>
        <div className="mx-auto max-w-4xl">
          <h2
            className="mb-10 text-center text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                n: "1",
                title: "Submit your announcement",
                body: "Tell us about your business, special offer, or event. Takes two minutes.",
              },
              {
                n: "2",
                title: "We review and publish",
                body: "Our editorial team ensures quality and relevance. Usually within 24 hours.",
              },
              {
                n: "3",
                title: "Your neighbours see it",
                body: "Appears in the daily digest email and the public Neighbours Notes feed.",
              },
            ].map((step) => (
              <div key={step.n} className="flex flex-col items-start sm:items-center sm:text-center">
                <span
                  className="mb-3 text-5xl font-bold leading-none"
                  style={{ fontFamily: "var(--font-fraunces)", color: "#F59E0B" }}
                >
                  {step.n}
                </span>
                <h3 className="mb-2 text-base font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-teal-100">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE STATS ───────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 text-center" style={{ backgroundColor: "#FAF8F3" }}>
        <div className="mx-auto max-w-2xl">
          <h2
            className="mb-10 text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            A real audience, right here in Kanata
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              {showExactSubscribers ? (
                <p
                  className="mb-1 text-4xl font-bold sm:text-5xl"
                  style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
                >
                  {subscriberCount}
                </p>
              ) : null}
              <p
                className="text-sm font-medium leading-snug"
                style={{ color: "#1A1A2E", opacity: showExactSubscribers ? 0.6 : 1 }}
              >
                {showExactSubscribers ? "Kanata residents subscribed" : subscriberStat}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              {showExactNotes ? (
                <p
                  className="mb-1 text-4xl font-bold sm:text-5xl"
                  style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
                >
                  {noteCount}
                </p>
              ) : null}
              <p
                className="text-sm font-medium leading-snug"
                style={{ color: "#1A1A2E", opacity: showExactNotes ? 0.6 : 1 }}
              >
                {showExactNotes ? "notes published" : noteStat}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU GET ─────────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-2xl">
          <h2
            className="mb-8 text-2xl font-bold sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)", color: "#1A1A2E" }}
          >
            What your listing includes — free
          </h2>
          <ul className="space-y-4">
            {[
              { text: "Your announcement in the Neighbours Notes feed", future: false },
              { text: "Included in the daily digest email to all subscribers", future: false },
              { text: '"Local Business" badge on your note', future: false },
              { text: "Link to your website from the note card", future: false },
              {
                text: "Coming soon: featured placement, group buy partnerships",
                future: true,
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3" style={{ opacity: item.future ? 0.45 : 1 }}>
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: item.future ? "#9CA3AF" : "#0F766E" }}
                >
                  {item.future ? (
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
                      <path d="M12 8v4l3 3" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="3">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-base leading-relaxed" style={{ color: "#1A1A2E" }}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────── */}
      <section className="px-4 py-14 sm:py-16 text-center" style={{ backgroundColor: "#0F766E" }}>
        <div className="mx-auto max-w-2xl">
          <h2
            className="mb-4 text-2xl font-bold text-white sm:text-3xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Ready to reach your neighbours?
          </h2>
          <p className="mb-6 text-base text-teal-100">
            Free. No account needed. We review submissions within 24 hours.
          </p>
          <Link
            href="/notes/submit"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl px-10 text-base font-semibold transition-colors hover:opacity-90"
            style={{ backgroundColor: "#F59E0B", color: "#1A1A2E" }}
          >
            Submit your announcement →
          </Link>
        </div>
      </section>
    </main>
  );
}
