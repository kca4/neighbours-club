"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubmitBusinessPage() {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const body = {
      businessName: fd.get("businessName") as string,
      contactEmail: fd.get("contactEmail") as string,
      message: fd.get("message") as string,
      address: fd.get("address") as string,
      websiteUrl: (fd.get("websiteUrl") as string) || undefined,
      phone: (fd.get("phone") as string) || undefined,
      offerDetails: (fd.get("offerDetails") as string) || undefined,
    };

    try {
      const res = await fetch("/api/notes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: "#FAF8F3" }}>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/notes"
          className="mb-6 inline-flex items-center gap-1 text-sm"
          style={{ color: "#0F766E" }}
        >
          ← Neighbours Notes
        </Link>

        <h1
          className="mb-1 text-3xl font-bold"
          style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
        >
          Submit Your Business
        </h1>
        <p className="mb-8 text-sm" style={{ color: "#1A1A2E", opacity: 0.6 }}>
          Share an announcement, offer, or update with the Kanata neighbourhood. We review every
          submission before it appears in the feed.
        </p>

        {success ? (
          <div className="rounded-xl border border-teal-200 bg-teal-50 px-6 py-8 text-center">
            <p
              className="mb-2 text-xl font-semibold"
              style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
            >
              Thanks for your submission!
            </p>
            <p className="text-sm" style={{ color: "#1A1A2E", opacity: 0.7 }}>
              We&apos;ll review it and get back to you if it&apos;s a good fit for the feed.
            </p>
            <Link
              href="/notes"
              className="mt-4 inline-block text-sm font-medium underline"
              style={{ color: "#0F766E" }}
            >
              Back to Neighbours Notes
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "rgba(26,26,46,0.1)" }}
          >
            <div className="space-y-5">
              {/* Business name */}
              <div>
                <label
                  htmlFor="businessName"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  Business name <span className="text-red-500">*</span>
                </label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  maxLength={100}
                  placeholder="e.g. Kanata Bakehouse"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>

              {/* Contact email */}
              <div>
                <label
                  htmlFor="contactEmail"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  Contact email <span className="text-red-500">*</span>
                </label>
                <input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  required
                  placeholder="you@yourbusiness.ca"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>

              {/* Message / announcement */}
              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  What do you want to share? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={4}
                  placeholder="Tell neighbours what's happening — a grand opening, seasonal offer, community event, etc."
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  Address in Kanata <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  maxLength={200}
                  placeholder="e.g. 400 March Rd, Kanata"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>

              {/* Website URL (optional) */}
              <div>
                <label
                  htmlFor="websiteUrl"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  Website{" "}
                  <span className="font-normal" style={{ opacity: 0.5 }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="url"
                  maxLength={300}
                  placeholder="https://yourbusiness.ca"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>

              {/* Phone (optional) */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  Phone{" "}
                  <span className="font-normal" style={{ opacity: 0.5 }}>
                    (optional)
                  </span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength={20}
                  placeholder="613-555-0100"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>

              {/* Offer details (optional) */}
              <div>
                <label
                  htmlFor="offerDetails"
                  className="mb-1.5 block text-sm font-medium"
                  style={{ color: "#1A1A2E" }}
                >
                  Offer details{" "}
                  <span className="font-normal" style={{ opacity: 0.5 }}>
                    (optional)
                  </span>
                </label>
                <textarea
                  id="offerDetails"
                  name="offerDetails"
                  maxLength={1000}
                  rows={3}
                  placeholder="Any specific deal, discount, or promotion you'd like to highlight"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  style={{ borderColor: "rgba(26,26,46,0.2)", color: "#1A1A2E" }}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-6 w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: "#0F766E" }}
            >
              {pending ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
