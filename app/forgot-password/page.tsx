"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Metadata } from "next";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") }),
    });
    // Always show the success message — never reveal whether the email exists
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Forgot password?</h1>
        <p className="mb-8 text-foreground/60">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-semibold text-green-800">Check your email</p>
            <p className="mt-2 text-sm text-green-700">
              If an account exists with that email address, we&apos;ve sent a password reset link.
              The link expires in 1 hour.
            </p>
            <Link
              href="/signin"
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
            <p className="text-center text-sm text-foreground/60">
              <Link href="/signin" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
