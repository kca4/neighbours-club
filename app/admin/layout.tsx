import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { Metadata } from "next";

export const metadata: Metadata = { title: { template: "%s | Admin", default: "Admin" } };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") redirect("/my-deals");

  return (
    <div className="flex flex-1 flex-col sm:flex-row">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-x-auto px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  );
}
