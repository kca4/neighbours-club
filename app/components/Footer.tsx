export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-foreground/8 bg-background">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-foreground/50 sm:flex-row sm:px-6">
        <p>© {year} Neighbours Club. All rights reserved.</p>
        <nav aria-label="Footer navigation">
          <ul className="flex gap-6">
            <li>
              <a href="#" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                About
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-foreground transition-colors min-h-[44px] flex items-center">
                Terms
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
