import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/suppliers", label: "Suppliers" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-52 shrink-0 border-r border-foreground/10 bg-foreground/[0.02] px-3 py-6">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-widest text-foreground/40">
        Admin
      </p>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
