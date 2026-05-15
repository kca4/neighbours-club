import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SubmissionStatus } from "@prisma/client";
import SubmissionActions from "./SubmissionActions";

export const metadata: Metadata = { title: "Submissions" };

const statusBadge: Record<SubmissionStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function SubmissionsPage() {
  const submissions = await prisma.businessSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">
            Admin
          </p>
          <h1 className="text-2xl font-bold text-foreground">Business Submissions</h1>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-foreground/10">
        {submissions.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-foreground/50">
            No submissions yet.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Business</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Offer details</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.businessName}</td>
                  <td className="text-foreground/70">{s.contactEmail}</td>
                  <td className="max-w-[180px] truncate text-foreground/70" title={s.address}>
                    {s.address}
                  </td>
                  <td
                    className="max-w-[200px] truncate text-foreground/60"
                    title={s.offerDetails ?? undefined}
                  >
                    {s.offerDetails ?? "—"}
                  </td>
                  <td className="whitespace-nowrap text-foreground/60">
                    {s.createdAt.toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td>
                    <SubmissionActions id={s.id} status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
