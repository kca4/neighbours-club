// Skeleton shown by Next.js while the restaurant detail page data is loading

export default function RestaurantDetailLoading() {
  return (
    <main className="flex flex-1 flex-col bg-background animate-pulse">
      {/* Hero skeleton — taller on mobile, wide on desktop */}
      <div className="aspect-[4/3] w-full bg-foreground/10 sm:aspect-[2/1] lg:aspect-[3/1]" />

      {/* Info bar skeleton */}
      <div className="bg-white px-5 py-4 sm:px-6">
        <div className="flex flex-wrap gap-4">
          <div className="h-4 w-16 rounded-full bg-foreground/8" />
          <div className="h-4 w-20 rounded-full bg-foreground/8" />
          <div className="h-4 w-24 rounded-full bg-foreground/8" />
        </div>
        <div className="mt-4 border-t border-foreground/5 pt-4">
          <div className="h-3 w-64 rounded-full bg-foreground/8" />
        </div>
        <div className="mt-4 border-t border-foreground/5 pt-4">
          <div className="h-3 w-48 rounded-full bg-foreground/8" />
        </div>
        <div className="mt-4 border-t border-foreground/5 pt-4">
          <div className="h-3 w-28 rounded-full bg-foreground/8" />
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="bg-white px-4 py-3 sm:px-6">
        <div className="h-10 rounded-full bg-gray-100" />
      </div>

      {/* Category tabs skeleton */}
      <div className="sticky top-[60px] z-30 flex gap-2 border-b border-foreground/8 bg-white px-4 py-2.5 sm:px-6">
        {[88, 96, 64, 80].map((w, i) => (
          <div
            key={i}
            className="h-7 shrink-0 rounded-full bg-foreground/8"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Menu sections skeleton */}
      <div className="flex flex-col gap-10 px-4 py-6 sm:px-6">
        {[
          { heading: 176, subtitle: true, cols: 4 },
          { heading: 96, subtitle: false, cols: 4 },
          { heading: 64, subtitle: false, list: 4 },
        ].map((section, si) => (
          <div key={si}>
            {/* Section heading */}
            <div
              className="h-7 rounded-lg bg-foreground/10"
              style={{ width: section.heading }}
            />
            {section.subtitle && (
              <div className="mt-1.5 h-3 w-56 rounded-full bg-foreground/8" />
            )}

            {/* Image grid */}
            {section.cols && (
              <div className="mt-4 grid grid-cols-2 gap-4">
                {Array.from({ length: section.cols }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="aspect-square w-full rounded-lg bg-foreground/8" />
                    <div className="h-4 w-3/4 rounded-full bg-foreground/10" />
                    <div className="h-3 w-1/2 rounded-full bg-foreground/8" />
                  </div>
                ))}
              </div>
            )}

            {/* List items */}
            {section.list && (
              <div className="mt-4 flex flex-col gap-3">
                {Array.from({ length: section.list }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-foreground/8 bg-white px-4 py-3"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 w-1/2 rounded-full bg-foreground/10" />
                      <div className="h-3 w-full rounded-full bg-foreground/8" />
                      <div className="h-3 w-1/4 rounded-full bg-foreground/8" />
                    </div>
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-foreground/8" />
                    <div className="h-8 w-8 shrink-0 rounded-full bg-foreground/10" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
