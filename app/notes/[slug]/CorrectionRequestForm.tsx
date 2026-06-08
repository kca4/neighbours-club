"use client";

import { useState, useTransition } from "react";
import { requestCorrection } from "@/app/actions/request-correction";

export function CorrectionRequestForm({ noteId }: { noteId: string }) {
  const [open, setOpen] = useState(false);
  const [contact, setContact] = useState("");
  const [claim, setClaim] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (submitted) {
    return (
      <p className="mt-6 text-sm" style={{ color: "#0F766E" }}>
        Thank you — your correction request has been received and will be reviewed.
      </p>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-sm underline underline-offset-2"
          style={{ color: "#1A1A2E", opacity: 0.5 }}
        >
          Request a correction
        </button>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-sm font-semibold" style={{ color: "#1A1A2E" }}>
            Request a correction
          </h2>
          <p className="mb-4 text-xs" style={{ color: "#1A1A2E", opacity: 0.55 }}>
            If you believe something in this note is inaccurate, describe the problem below.
            Your contact details will only be used to follow up if needed.
          </p>

          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium" style={{ color: "#1A1A2E", opacity: 0.7 }}>
              Your email or phone
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="email@example.com or 613-555-0100"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              style={{ color: "#1A1A2E" }}
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium" style={{ color: "#1A1A2E", opacity: 0.7 }}>
              What is inaccurate, and what is the correct information?
            </label>
            <textarea
              value={claim}
              onChange={(e) => setClaim(e.target.value)}
              rows={4}
              placeholder="Describe the error and what the correct facts are..."
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
              style={{ color: "#1A1A2E" }}
            />
          </div>

          {error && (
            <p className="mb-3 text-xs text-red-600">{error}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await requestCorrection(noteId, contact, claim);
                  if (result.ok) {
                    setSubmitted(true);
                  } else {
                    setError(result.error);
                  }
                })
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#0F766E" }}
            >
              {pending ? "Submitting…" : "Submit"}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null); }}
              className="text-sm"
              style={{ color: "#1A1A2E", opacity: 0.5 }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
