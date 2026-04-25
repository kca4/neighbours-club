import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import SupplierForm from "@/components/admin/SupplierForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit supplier" };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs text-foreground/40">
          Admin /{" "}
          <Link href="/admin/suppliers" className="hover:underline">
            Suppliers
          </Link>{" "}
          /{" "}
          <Link href={`/admin/suppliers/${id}`} className="hover:underline">
            {supplier.name}
          </Link>{" "}
          / Edit
        </p>
        <h1 className="text-2xl font-bold text-foreground">Edit supplier</h1>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-white p-6">
        <SupplierForm
          supplierId={id}
          initialData={{
            name: supplier.name,
            contactName: supplier.contactName ?? "",
            contactEmail: supplier.contactEmail ?? "",
            contactPhone: supplier.contactPhone ?? "",
            notes: supplier.notes ?? "",
          }}
        />
      </div>
    </div>
  );
}
