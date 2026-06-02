// ─── Dashboard skeleton ───────────────────────────────────────────────────────
// Shown by Next.js App Router while the dashboard page is loading.

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-foreground/8 bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="h-4 w-20 rounded-full bg-foreground/8" />
          <div className="mt-1.5 h-3 w-14 rounded-full bg-foreground/6" />
        </div>
        <div className="h-5 w-24 rounded-full bg-foreground/8" />
      </div>
      {/* Item lines */}
      <div className="mb-3 space-y-2">
        <div className="h-4 w-full rounded-full bg-foreground/6" />
        <div className="h-4 w-3/4 rounded-full bg-foreground/6" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between border-t border-foreground/6 pt-2.5">
        <div className="h-3 w-28 rounded-full bg-foreground/6" />
        <div className="h-4 w-14 rounded-full bg-foreground/8" />
      </div>
      {/* Action button */}
      <div className="mt-3.5 h-10 w-full rounded-xl bg-foreground/6" />
    </div>
  );
}

// Show 2 cards in "New", 1 each in "Preparing" and "Ready"
const COLUMN_CARD_COUNTS = [2, 1, 1];

export default function DashboardLoading() {
  return (
    <div className="flex animate-pulse flex-col gap-5">
      {/* Status bar */}
      <div className="flex items-center justify-between">
        <div className="h-3 w-36 rounded-full bg-foreground/8" />
        <div className="h-8 w-20 rounded-xl bg-foreground/8" />
      </div>

      {/* Three-column grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {COLUMN_CARD_COUNTS.map((count, col) => (
          <div key={col} className="flex flex-col gap-3">
            {/* Column header */}
            <div className="h-9 rounded-xl bg-foreground/6" />
            {/* Cards */}
            {Array.from({ length: count }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
