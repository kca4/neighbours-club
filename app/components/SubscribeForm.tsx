"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "success" | "error";

export function SubscribeForm({ source = "notes-page" }: { source?: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const name = (form.get("name") as string) || undefined;
    setSubmittedEmail(email);
    try {
      const res = await fetch("/api/notes/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source }),
      });
      if (res.ok) {
        setStatus("success");
      } else if (res.status === 429) {
        setErrorMsg("Too many requests. Please try again later.");
        setStatus("error");
      } else {
        setErrorMsg("Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  if (status === "success") {
    return (
      <div className="mb-6 rounded-xl border border-teal-200 bg-white p-5 shadow-sm">
        <p
          className="mb-1 text-base font-bold"
          style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
        >
          Check your email to confirm!
        </p>
        <p className="text-sm" style={{ color: "#1A1A2E", opacity: 0.65 }}>
          We&apos;ve sent a confirmation link to{" "}
          <span className="font-medium" style={{ opacity: 1, color: "#1A1A2E" }}>
            {submittedEmail}
          </span>
          . Click it to activate your subscription.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
      <p
        className="mb-1 text-xl font-bold"
        style={{ fontFamily: "var(--font-fraunces)", color: "#0F766E" }}
      >
        Get Kanata news in your inbox
      </p>
      <p className="mb-4 text-sm" style={{ color: "#1A1A2E", opacity: 0.65 }}>
        Daily neighbourhood briefings — transit, development, safety, and more.
        Free, no spam, unsubscribe anytime.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder:text-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
        />
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder="Your name (optional)"
          className="block w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-[#1A1A2E] placeholder:text-gray-400 focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] w-full rounded-lg bg-[#0F766E] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Subscribing…" : "Subscribe"}
        </button>
        {status === "error" && (
          <p className="text-xs text-red-600">{errorMsg}</p>
        )}
      </form>
    </div>
  );
}
