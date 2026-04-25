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
    <div className="flex flex-1">
      <AdminSidebar />
      <main className="flex-1 overflow-x-auto px-6 py-6">{children}</main>
    </div>
  );
}
