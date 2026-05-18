"use client";

import { useState } from "react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

interface HeaderNavProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export default function HeaderNav({ isLoggedIn, isAdmin }: HeaderNavProps) {
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <>
      {/* ── Desktop nav (sm+) ─────────────────────────── */}
      <nav className="hidden sm:flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
        <Link
          href="/deals"
          className="min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          Deals
        </Link>
        <Link
          href="/notes"
          className="min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          Notes
        </Link>
        {!isLoggedIn ? (
          <>
            <Link
              href="/signin"
              className="min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="min-h-[44px] flex items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            <Link
              href="/my-deals"
              className="min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              My Deals
            </Link>
            <Link
              href="/account"
              className="min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
            >
              Account
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="min-h-[44px] flex items-center px-3 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Admin
              </Link>
            )}
            <SignOutButton variant="nav" />
          </>
        )}
      </nav>

      {/* ── Mobile hamburger button (< sm) ────────────── */}
      <button
        className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          /* X icon */
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          /* Hamburger icon */
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* ── Mobile dropdown menu ───────────────────────── */}
      {open && (
        <div
          id="mobile-menu"
          className="sm:hidden absolute top-full left-0 right-0 z-50 border-b border-foreground/8 bg-background/98 backdrop-blur shadow-lg"
        >
          <nav className="mx-auto max-w-5xl flex flex-col px-4 py-2" aria-label="Mobile navigation">
            <Link
              href="/deals"
              onClick={close}
              className="min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/5 transition-colors"
            >
              Deals
            </Link>
            <Link
              href="/notes"
              onClick={close}
              className="min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/5 transition-colors"
            >
              Notes
            </Link>
            {!isLoggedIn ? (
              <>
                <Link
                  href="/signin"
                  onClick={close}
                  className="min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/5 transition-colors"
                >
                  Sign in
                </Link>
                <div className="py-3">
                  <Link
                    href="/signup"
                    onClick={close}
                    className="min-h-[44px] flex items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors"
                    style={{ backgroundColor: "#0F766E" }}
                  >
                    Sign up
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/my-deals"
                  onClick={close}
                  className="min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/5 transition-colors"
                >
                  My Deals
                </Link>
                <Link
                  href="/account"
                  onClick={close}
                  className="min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/5 transition-colors"
                >
                  Account
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={close}
                    className="min-h-[48px] flex items-center px-2 text-sm font-medium text-accent hover:text-accent/80 border-b border-foreground/5 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <div className="py-3">
                  <SignOutButton variant="nav" />
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
