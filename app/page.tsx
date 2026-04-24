import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
          Kanata, Ottawa
        </p>
        <h1 className="mb-6 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
          Neighbours Club —{" "}
          <span className="text-primary">your neighbourhood, organized.</span>
        </h1>
        <p className="mb-10 text-lg text-foreground/70">
          Pool your buying power with neighbours to unlock lower prices on food,
          household goods, and more. Pick up your order locally — no delivery
          fees, no middlemen.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/deals"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-white transition-colors hover:bg-primary-dark sm:w-auto"
          >
            Browse deals
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-primary px-8 text-base font-semibold text-primary transition-colors hover:bg-primary-light sm:w-auto"
          >
            Join the club
          </Link>
        </div>
      </div>
    </main>
  );
}
