import { prisma } from "@/lib/prisma";
import { CorrectionStatus } from "@prisma/client";
import Link from "next/link";
import { CorrectionActions } from "./CorrectionActions";

const STATUS_COLORS: Record<CorrectionStatus, string> = {
  OPEN:         "bg-amber-100 text-amber-800",
  ACKNOWLEDGED: "bg-blue-100 text-blue-800",
  RESOLVED:     "bg-green-100 text-green-800",
  REJECTED:     "bg-gray-100 text-gray-600",
};

export default async function CorrectionsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const statusFilter =
    status && Object.keys(STATUS_COLORS).includes(status)
      ? (status as CorrectionStatus)
      : undefined;

  const corrections = await prisma.noteCorrection.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      note: { select: { id: true, headline: true, slug: true, status: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground/40">Admin / Corrections</p>
          <h1 className="text-2xl font-bold text-foreground">Correction Requests</h1>
        </div>
        <p className="text-xs text-foreground/40">{corrections.length} shown</p>
      </div>

      {/* ── Status filter tabs ── */}
      <div className="flex flex-wrap gap-2">
        {[undefined, "OPEN", "ACKNOWLEDGED", "RESOLVED", "REJECTED"].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/corrections?status=${s}` : "/admin/corrections"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s || (!statusFilter && s === undefined)
                ? "bg-foreground text-background"
                : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
            }`}
          >
            {s ?? "All"}
          </Link>
        ))}
      </div>

      {corrections.length === 0 ? (
        <p className="text-sm text-foreground/50">No correction requests.</p>
      ) : (
        <div className="space-y-4">
          {corrections.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-foreground/10 bg-white p-4"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/notes/${c.note.slug}`}
                    className="block truncate text-sm font-semibold text-primary hover:underline"
                  >
                    {c.note.headline}
                  </Link>
                  <p className="mt-0.5 text-xs text-foreground/40">
                    {c.createdAt.toLocaleDateString("en-CA", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" · "}
                    {c.requesterContact}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[c.status]}`}
                >
                  {c.status}
                </span>
              </div>

              <p className="mb-3 text-sm text-foreground/80">{c.claim}</p>

              {c.resolution && (
                <p className="mb-2 rounded bg-gray-50 px-3 py-2 text-xs text-foreground/60">
                  <span className="font-medium">Resolution: </span>
                  {c.resolution}
                </p>
              )}

              {c.reply && (
                <p className="mb-2 rounded bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <span className="font-medium">Right-of-reply: </span>
                  {c.reply}
                </p>
              )}

              <CorrectionActions
                id={c.id}
                status={c.status}
                existingReply={c.reply}
                noteStatus={c.note.status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
