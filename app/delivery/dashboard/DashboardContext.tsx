"use client";

import { createContext, useContext } from "react";

// ─── Context ──────────────────────────────────────────────────────────────────

interface DashboardContextValue {
  activeRestaurantId: string;
}

export const DashboardContext = createContext<DashboardContextValue | null>(
  null
);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error("useDashboard must be used inside DashboardShell");
  return ctx;
}
