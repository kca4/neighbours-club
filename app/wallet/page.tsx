import { redirect } from "next/navigation";
import { getMyWalletView } from "@/lib/cp/wallet-view";
import { formatReason } from "@/lib/cp/labels";

export const metadata = {
  title: "My Wallet — Neighbours Club",
  description: "Your Community Points balance and activity history.",
};

export default async function WalletPage() {
  const wallet = await getMyWalletView();

  if (!wallet.signedIn) {
    redirect("/signin?next=/wallet");
  }

  const { balanceCP, history } = wallet;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {/* Balance hero */}
      <section className="mb-10 rounded-2xl bg-primary/8 px-6 py-8 text-center">
        <p className="mb-1 text-sm font-medium uppercase tracking-widest text-primary/70">
          Community Points
        </p>
        <p className="font-display text-5xl font-bold text-primary">
          {balanceCP.toLocaleString()}
          <span className="ml-2 text-2xl font-semibold">CP</span>
        </p>
        <p className="mt-3 text-sm text-foreground/60">
          Earn CP by reading notes, joining group buys, and more.
        </p>
      </section>

      {/* History */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Activity</h2>

        {history.length === 0 ? (
          <p className="rounded-xl border border-foreground/8 px-6 py-10 text-center text-sm text-foreground/50">
            No activity yet. Read a local note or join a group buy to earn your first CP.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-foreground/8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foreground/8 bg-foreground/3">
                  <th className="px-4 py-3 text-left font-medium text-foreground/60">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-foreground/60">Activity</th>
                  <th className="px-4 py-3 text-right font-medium text-foreground/60">Amount</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => {
                  const isEarn = row.amount > 0;
                  const date = new Date(row.createdAt);
                  const dateStr = date.toLocaleDateString("en-CA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                  return (
                    <tr
                      key={row.id}
                      className={
                        i < history.length - 1
                          ? "border-b border-foreground/5"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 text-foreground/50 tabular-nums whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="px-4 py-3 text-foreground/80">
                        {formatReason(row.reason)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap ${
                          isEarn ? "text-primary" : "text-foreground/50"
                        }`}
                      >
                        {isEarn ? "+" : ""}
                        {row.amount.toLocaleString()} CP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
