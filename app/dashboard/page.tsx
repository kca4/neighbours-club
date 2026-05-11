import { redirect } from "next/navigation";

/**
 * Canonical route for the partner management dashboard is /partner/dashboard.
 * This page provides a stable /dashboard alias.
 */
export default function DashboardAlias() {
  redirect("/partner/dashboard");
}
