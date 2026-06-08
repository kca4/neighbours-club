import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/suppliers", label: "Suppliers" },
  { href: "/admin/notes", label: "Notes" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/corrections", label: "Corrections" },
];

export default function AdminSidebar() {
  return (
    <aside className="shrink-0 border-b border-foreground/10 bg-foreground/[0.02] sm:w-52 sm:border-b-0 sm:border-r">
      <div className="flex items-center gap-1 overflow-x-auto px-3 py-3 sm:flex-col sm:items-stretch sm:gap-1 sm:px-3 sm:py-6">
        <p className="hidden px-2 text-xs font-semibold uppercase tracking-widest text-foreground/40 sm:mb-4 sm:block">
          Admin
        </p>
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground sm:shrink"
          >
            {label}
          </Link>
        ))}
      </div>
    </aside>
  );
}
