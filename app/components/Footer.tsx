import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export default async function Footer() {
  const year = new Date().getFullYear();
  const session = await auth();

  return (
    <footer className="mt-auto border-t border-foreground/8 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-col items-center gap-1 text-center">
          <p
            className="text-base font-bold"
            style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
          >
            Neighbours Club
          </p>
          <p className="text-xs" style={{ color: "#1A1A2E", opacity: 0.45 }}>
            your neighbourhood, working together
          </p>
        </div>

        <nav aria-label="Footer navigation" className="mb-6">
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-foreground/50">
            <li>
              <Link href="/notes" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Notes
              </Link>
            </li>
            <li>
              <Link href="/deals" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Deals
              </Link>
            </li>
            <li>
              <Link href="/notes/submit" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Submit an Announcement
              </Link>
            </li>
            {session ? (
              <li>
                <SignOutButton
                  className="text-sm font-medium text-foreground/50 hover:text-foreground transition-colors min-h-[44px] flex items-center"
                />
              </li>
            ) : (
              <>
                <li>
                  <Link href="/signin" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link href="/faq" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/refund-policy" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Refund Policy
              </Link>
            </li>
          </ul>
        </nav>

        <div className="flex flex-col items-center gap-1 text-xs text-foreground/40">
          <p>Made in Kanata.</p>
          <p>© {year} IREN Technologies Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
