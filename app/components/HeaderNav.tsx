"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

interface HeaderNavProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isRestaurantOwner: boolean;
  isCourier: boolean;
  balanceCP?: number;
}

export default function HeaderNav({
  isLoggedIn,
  isAdmin,
  isRestaurantOwner,
  isCourier,
  balanceCP,
}: HeaderNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setOpen(false);

  const isDeliveryActive = pathname.startsWith("/delivery");

  // ── Link class helpers ────────────────────────────────────────────────────
  const desktopLink =
    "min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors";
  const desktopLinkActive =
    "min-h-[44px] flex items-center px-3 text-sm font-medium text-foreground transition-colors";
  const mobileLink =
    "min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground/70 hover:text-foreground border-b border-foreground/5 transition-colors";
  const mobileLinkActive =
    "min-h-[48px] flex items-center px-2 text-sm font-medium text-foreground border-b border-foreground/5 transition-colors";

  return (
    <>
      {/* ── Desktop nav (sm+) ─────────────────────────── */}
      <nav className="hidden sm:flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
        <Link href="/deals" className={desktopLink}>
          Deals
        </Link>
        <Link href="/notes" className={desktopLink}>
          Notes
        </Link>
        <Link
          href="/delivery"
          className={isDeliveryActive ? desktopLinkActive : desktopLink}
          aria-current={isDeliveryActive ? "page" : undefined}
        >
          Order Food
        </Link>
        {!isLoggedIn ? (
          <>
            <Link href="/signin" className={desktopLink}>
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
            <Link href="/my-deals" className={desktopLink}>
              My Deals
            </Link>
            <Link href="/account" className={desktopLink}>
              Account
            </Link>
            {balanceCP !== undefined && (
              <Link
                href="/wallet"
                className="min-h-[44px] flex items-center gap-1.5 px-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                aria-label={`Community Points balance: ${balanceCP.toLocaleString()} CP`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <text x="12" y="16" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">C</text>
                </svg>
                {balanceCP.toLocaleString()} CP
              </Link>
            )}
            {isRestaurantOwner && (
              <Link
                href="/delivery/dashboard"
                className="min-h-[44px] flex items-center px-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Restaurant Dashboard
              </Link>
            )}
            {isCourier && (
              <Link
                href="/delivery/driver"
                className="min-h-[44px] flex items-center px-3 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Driver
              </Link>
            )}
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
            <Link href="/deals" onClick={close} className={mobileLink}>
              Deals
            </Link>
            <Link href="/notes" onClick={close} className={mobileLink}>
              Notes
            </Link>
            <Link
              href="/delivery"
              onClick={close}
              className={isDeliveryActive ? mobileLinkActive : mobileLink}
              aria-current={isDeliveryActive ? "page" : undefined}
            >
              Order Food
            </Link>
            {!isLoggedIn ? (
              <>
                <Link href="/signin" onClick={close} className={mobileLink}>
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
                <Link href="/my-deals" onClick={close} className={mobileLink}>
                  My Deals
                </Link>
                <Link href="/account" onClick={close} className={mobileLink}>
                  Account
                </Link>
                {balanceCP !== undefined && (
                  <Link
                    href="/wallet"
                    onClick={close}
                    className="min-h-[48px] flex items-center gap-1.5 px-2 text-sm font-medium text-primary hover:text-primary/80 border-b border-foreground/5 transition-colors"
                    aria-label={`Community Points balance: ${balanceCP.toLocaleString()} CP`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <text x="12" y="16" textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">C</text>
                    </svg>
                    {balanceCP.toLocaleString()} CP
                  </Link>
                )}
                {isRestaurantOwner && (
                  <Link
                    href="/delivery/dashboard"
                    onClick={close}
                    className="min-h-[48px] flex items-center px-2 text-sm font-medium text-primary hover:text-primary/80 border-b border-foreground/5 transition-colors"
                  >
                    Restaurant Dashboard
                  </Link>
                )}
                {isCourier && (
                  <Link
                    href="/delivery/driver"
                    onClick={close}
                    className="min-h-[48px] flex items-center px-2 text-sm font-medium text-primary hover:text-primary/80 border-b border-foreground/5 transition-colors"
                  >
                    Driver
                  </Link>
                )}
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
