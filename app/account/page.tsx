import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import SignOutButton from "@/app/components/SignOutButton";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await auth();
  if (!session) redirect("/signin?callbackUrl=/account");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, phone: true, role: true },
  });

  if (!user) redirect("/signin");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-foreground">Account</h1>

        <div className="rounded-2xl border border-foreground/10 bg-white p-6 sm:p-8">
          <dl className="divide-y divide-foreground/8">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Phone" value={user.phone ?? "—"} />
            <Row label="Role" value={user.role} />
          </dl>
        </div>

        <div className="mt-8 flex justify-end">
          <SignOutButton variant="page" />
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:gap-0">
      <dt className="w-32 shrink-0 text-sm font-medium text-foreground/50">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}
