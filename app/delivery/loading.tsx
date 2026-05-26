// Skeleton shown by Next.js while /delivery page data is loading

export default function DeliveryLoading() {
  return (
    <main className="flex flex-1 flex-col bg-background animate-pulse">
      {/* Page header skeleton */}
      <div className="border-b border-foreground/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="mb-3 h-3 w-24 rounded-full bg-foreground/8" />
          <div className="h-10 w-44 rounded-lg bg-foreground/10" />
          <div className="mt-3 h-4 w-72 rounded-full bg-foreground/8" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Search + filter skeleton */}
        <div className="mb-6 space-y-4">
          <div className="h-10 max-w-md rounded-xl bg-foreground/8" />
          <div className="flex gap-2 overflow-hidden">
            {[80, 72, 96, 64].map((w, i) => (
              <div
                key={i}
                className="h-8 shrink-0 rounded-full bg-foreground/8"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>

        {/* Card grid */}
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex flex-col overflow-hidden rounded-2xl border border-foreground/5 bg-white"
            >
              {/* Hero placeholder */}
              <div className="aspect-video w-full bg-foreground/8" />
              {/* Body */}
              <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-8">
                <div className="h-5 w-3/4 rounded-lg bg-foreground/10" />
                <div className="h-3 w-1/2 rounded-full bg-foreground/8" />
                <div className="h-3 w-full rounded-full bg-foreground/8" />
                <div className="mt-1 h-3 w-1/3 rounded-full bg-foreground/8" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
