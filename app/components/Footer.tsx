import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-foreground/8 bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex flex-col items-center gap-4 text-sm text-foreground/50 sm:flex-row sm:justify-between">
          <p>© {year} Neighbours Club. All rights reserved.</p>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                  About
                </Link>
              </li>
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
              <li>
                <a
                  href="mailto:support@neighboursclub.ca"
                  className="hover:text-foreground transition-colors min-h-[44px] flex items-center"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
