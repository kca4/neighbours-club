import { prisma } from "@/lib/prisma";
import { NoteStatus } from "@prisma/client";
import NoteActions from "./NoteActions";

function riskClass(score: number) {
  if (score <= 3) return "bg-green-50 text-green-700";
  if (score <= 5) return "bg-yellow-50 text-yellow-700";
  return "bg-red-50 text-red-700";
}

const STATUS_COLORS: Record<NoteStatus, string> = {
  DRAFT:                   "bg-gray-100 text-gray-700",
  APPROVED:                "bg-green-100 text-green-800",
  PUBLISHED:               "bg-blue-100 text-blue-800",
  REJECTED:                "bg-red-100 text-red-700",
  CORRECTED:               "bg-amber-100 text-amber-800",
  RETRACTED:               "bg-orange-100 text-orange-800",
  BLOCKED_NEEDS_FRAMEWORK: "bg-purple-100 text-purple-800",
};

export default async function NotesAdminPage() {
  const notes = await prisma.processedNote.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-foreground/40">Admin / Notes</p>
          <h1 className="text-2xl font-bold text-foreground">
            Neighbours Notes
          </h1>
        </div>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-foreground/50">No notes yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-foreground/10">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Headline</th>
                <th>Category</th>
                <th>Street / Area</th>
                <th>Risk</th>
                <th>Auto-publish</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note) => {
                const safeToPush =
                  note.autoPublishEligible && note.riskScore <= 3;
                return (
                  <tr key={note.id}>
                    <td className="max-w-xs">
                      <span
                        className="block truncate font-medium"
                        title={note.headline}
                      >
                        {note.headline}
                      </span>
                    </td>
                    <td>{note.category}</td>
                    <td>{note.streetOrArea}</td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${riskClass(note.riskScore)}`}
                      >
                        {note.riskScore}
                      </span>
                    </td>
                    <td>
                      {safeToPush ? (
                        <span
                          className="text-base text-green-600"
                          title="Safe to auto-publish"
                        >
                          ✓
                        </span>
                      ) : (
                        <span className="text-foreground/30">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[note.status]}`}
                      >
                        {note.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-sm text-foreground/60">
                      {note.createdAt.toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <NoteActions id={note.id} status={note.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
