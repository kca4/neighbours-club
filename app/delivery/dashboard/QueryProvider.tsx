"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// ─── Provider ─────────────────────────────────────────────────────────────────
// Scoped to the dashboard subtree — does not affect the rest of the app.

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // One QueryClient per mount — useState ensures it isn't recreated on re-render
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 5_000,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
