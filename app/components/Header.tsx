import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function Header() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/8 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-0 sm:px-6">
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

        {/* Navigation */}
        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
          <Link
            href="/deals"
            className="min-h-[44px] flex items-center px-2 sm:px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
          >
            Deals
          </Link>
          {!session ? (
            <>
              <Link
                href="/signin"
                className="min-h-[44px] flex items-center px-2 sm:px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="min-h-[44px] flex items-center rounded-lg bg-primary px-3 sm:px-4 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/my-deals"
                className="min-h-[44px] flex items-center px-2 sm:px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                My Deals
              </Link>
              <Link
                href="/account"
                className="min-h-[44px] hidden sm:flex items-center px-2 sm:px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
              >
                Account
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="min-h-[44px] flex items-center px-2 sm:px-3 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
                >
                  Admin
                </Link>
              )}
              <SignOutButton variant="nav" />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
