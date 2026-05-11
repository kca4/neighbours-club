import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ManagementDashboard from "./ManagementDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partner Dashboard — Neighbours Club",
};

export default async function PartnerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/partner/dashboard");
  // TODO: expand to PARTNER role once that role is added to the User model
  if (session.user.role !== "ADMIN") redirect("/my-deals");

  return <ManagementDashboard />;
}
