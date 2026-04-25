import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Suppliers" };

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { deals: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground/40">Admin / Suppliers</p>
          <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
        </div>
        <Link href="/admin/suppliers/new" className="btn-primary">
          New supplier
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-foreground/10">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Deals</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-foreground/40">
                  No suppliers yet.{" "}
                  <Link href="/admin/suppliers/new" className="text-accent hover:underline">
                    Create one
                  </Link>
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">
                  <Link href={`/admin/suppliers/${s.id}`} className="hover:text-accent">
                    {s.name}
                  </Link>
                </td>
                <td className="text-foreground/60">{s.contactName ?? "—"}</td>
                <td className="text-foreground/60">{s.contactEmail ?? "—"}</td>
                <td>{s._count.deals}</td>
                <td>
                  <div className="flex gap-3">
                    <Link href={`/admin/suppliers/${s.id}`} className="text-sm text-accent hover:underline">
                      View
                    </Link>
                    <Link href={`/admin/suppliers/${s.id}/edit`} className="text-sm text-foreground/50 hover:underline">
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
