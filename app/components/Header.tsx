import Link from "next/link";
import { auth } from "@/lib/auth";
import HeaderNav from "./HeaderNav";

export default async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/8 bg-background/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-5xl items-center justify-between px-4 py-0 sm:px-6">
        {/* Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 py-4 text-lg font-bold text-primary"
          aria-label="Neighbours Club home"
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Neighbours Club
        </Link>

        <HeaderNav isLoggedIn={!!session} isAdmin={isAdmin} />
      </div>
    </header>
  );
}
