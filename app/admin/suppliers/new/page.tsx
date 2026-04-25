import SupplierForm from "@/components/admin/SupplierForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New supplier" };

export default function NewSupplierPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <p className="text-xs text-foreground/40">
          Admin /{" "}
          <a href="/admin/suppliers" className="hover:underline">
            Suppliers
          </a>{" "}
          / New
        </p>
        <h1 className="text-2xl font-bold text-foreground">New supplier</h1>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-white p-6">
        <SupplierForm />
      </div>
    </div>
  );
}
