import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function NotesConfirmPage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/notes");
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { confirmationToken: token },
  });

  // Invalid token
  if (!subscriber) {
    return <ErrorPage title="Link not found" message="This confirmation link is invalid. If you signed up recently, try subscribing again." />;
  }

  // Already confirmed
  if (subscriber.confirmedAt) {
    return (
      <ErrorPage
        title="Already confirmed"
        message="Your Neighbours Notes subscription is already active."
        cta={{ label: "Read Neighbours Notes", href: "/notes" }}
      />
    );
  }

  // Expired (> 48 hours since subscribedAt)
  const ageMs = Date.now() - subscriber.subscribedAt.getTime();
  if (ageMs > 48 * 60 * 60 * 1000) {
    return (
      <ErrorPage
        title="Link expired"
        message="Confirmation links are valid for 48 hours. Please subscribe again to get a fresh link."
        cta={{ label: "Subscribe again", href: "/notes" }}
      />
    );
  }

  // Valid — confirm the subscription
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Link to User account if email matches (and not already linked)
  let userId = subscriber.userId;
  if (!userId) {
    const user = await prisma.user.findUnique({
      where: { email: subscriber.email },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }

  await prisma.subscriber.update({
    where: { confirmationToken: token },
    data: {
      confirmedAt: new Date(),
      confirmedIp: ip,
      confirmationToken: null,
      userId,
    },
  });

  redirect("/notes?subscribed=1");
}

// ─── Inline error/state component ────────────────────────────────────────────

function ErrorPage({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta?: { label: string; href: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[#FAF8F3] px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-3xl mb-4">✉️</p>
        <h1 className="text-xl font-bold text-[#1A1A2E] mb-3">{title}</h1>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">{message}</p>
        <Link
          href={cta?.href ?? "/notes"}
          className="inline-block bg-[#0F766E] text-white px-5 py-2.5 rounded-lg text-sm font-semibold"
        >
          {cta?.label ?? "Go to Neighbours Notes"}
        </Link>
      </div>
    </main>
  );
}
