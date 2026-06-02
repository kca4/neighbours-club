import type { Metadata } from "next";
import OrderFeed from "./OrderFeed";

export const metadata: Metadata = {
  title: "Kitchen Dashboard — Neighbours Club",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
// OrderFeed reads the active restaurant from DashboardContext (provided by
// DashboardShell in the layout) and polls every 10 seconds via TanStack Query.

export default function DashboardPage() {
  return <OrderFeed />;
}
