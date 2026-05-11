import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import KitchenDashboard from "./KitchenDashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Dashboard — Neighbours Club",
};

export default async function KitchenPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/partner/kitchen");
  // TODO: expand to PARTNER role once that role is added to the User model
  if (session.user.role !== "ADMIN") redirect("/my-deals");

  return <KitchenDashboard />;
}
