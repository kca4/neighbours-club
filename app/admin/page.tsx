import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SignOutButton from "@/app/components/SignOutButton";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/my-deals");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent">
          Admin
        </div>
        <h1 className="mb-2 text-3xl font-bold text-foreground">
          Admin dashboard
        </h1>
        <p className="mb-10 text-lg text-foreground/60">
          {session.user.name}, you&apos;re signed in as admin.
        </p>

        <div className="rounded-2xl border border-foreground/10 bg-white p-8 text-center">
          <p className="text-foreground/50">
            Deal management, supplier management, and fulfillment tools are
            coming soon.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <SignOutButton variant="page" />
        </div>
      </div>
    </main>
  );
}
