import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DealStatusBadge } from "@/components/admin/StatusBadge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Supplier" };

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      deals: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
      },
    },
  });

  if (!supplier) notFound();

  const fields = [
    { label: "Name", value: supplier.name },
    { label: "Contact", value: supplier.contactName },
    { label: "Email", value: supplier.contactEmail },
    { label: "Phone", value: supplier.contactPhone },
    { label: "Notes", value: supplier.notes },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div>
        <p className="text-xs text-foreground/40">
          Admin /{" "}
          <Link href="/admin/suppliers" className="hover:underline">
            Suppliers
          </Link>{" "}
          / {supplier.name}
        </p>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
          <Link href={`/admin/suppliers/${id}/edit`} className="btn-secondary text-sm">
            Edit
          </Link>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-foreground/10 bg-white p-6">
        <dl className="grid grid-cols-2 gap-4">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs font-medium uppercase tracking-wide text-foreground/40">
                {label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Associated deals */}
      <section>
        <h2 className="mb-3 font-semibold text-foreground">
          Associated deals ({supplier.deals.length})
        </h2>
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {supplier.deals.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-foreground/40">
                    No deals for this supplier yet.
                  </td>
                </tr>
              )}
              {supplier.deals.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.title}</td>
                  <td>
                    <DealStatusBadge status={d.status} />
                  </td>
                  <td className="text-foreground/60">
                    {new Date(d.createdAt).toLocaleDateString("en-CA")}
                  </td>
                  <td>
                    <Link
                      href={`/admin/deals/${d.id}`}
                      className="text-sm text-accent hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
