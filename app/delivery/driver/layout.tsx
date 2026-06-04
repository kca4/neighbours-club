import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import QueryProvider from "@/app/delivery/dashboard/QueryProvider";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/delivery/driver");
  }

  return (
    <QueryProvider>
      {/* Minimal header — drivers don't need site nav while working */}
      <div className="flex min-h-screen flex-col bg-[#FAF8F3]">
        <header className="sticky top-0 z-30 border-b border-foreground/8 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <h1
              className="text-base font-bold italic text-primary"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Neighbours Club · Driver
            </h1>
            <Link
              href="/delivery"
              className="text-xs text-foreground/45 hover:text-foreground/70 transition-colors"
              style={{ fontFamily: "var(--font-inter-tight)" }}
            >
              ← Back
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </QueryProvider>
  );
}
