import Link from "next/link";
import DealForm from "@/components/admin/DealForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New deal" };

export default function NewDealPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs text-foreground/40">
          Admin /{" "}
          <Link href="/admin/deals" className="hover:underline">
            Deals
          </Link>{" "}
          / New
        </p>
        <h1 className="text-2xl font-bold text-foreground">New deal</h1>
        <p className="text-sm text-foreground/50">Saved as draft. You can publish once ready.</p>
      </div>
      <div className="rounded-xl border border-foreground/10 bg-white p-6">
        <DealForm />
      </div>
    </div>
  );
}
