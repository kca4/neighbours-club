"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TokenState = "loading" | "valid" | "expired" | "used" | "not_found";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<TokenState>("loading");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Resolve params (Next.js 16 params is a Promise)
  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  // Validate token on load
  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/validate-reset-token/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenState("valid");
        } else {
          setTokenState(data.reason as TokenState);
        }
      })
      .catch(() => setTokenState("not_found"));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const password = form.get("password") as string;
    const confirmPassword = form.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword }),
    });

    if (!res.ok) {
      const data = await res.json();
      const reasonMap: Record<string, string> = {
        expired: "This reset link has expired. Please request a new one.",
        used: "This reset link has already been used.",
        not_found: "This reset link is not valid.",
      };
      setError(reasonMap[data.error] ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/signin?message=password-updated");
  }

  if (tokenState === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <p className="text-foreground/50">Verifying link…</p>
      </main>
    );
  }

  if (tokenState !== "valid") {
    const messages: Record<string, { title: string; body: string }> = {
      expired: {
        title: "Reset link expired",
        body: "This link expired after 1 hour. Please request a new one.",
      },
      used: {
        title: "Link already used",
        body: "This reset link has already been used. If you need to reset your password again, please request a new link.",
      },
      not_found: {
        title: "Link not valid",
        body: "This reset link is not valid. It may have been copied incorrectly.",
      },
    };
    const msg = messages[tokenState] ?? messages.not_found;

    return (
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-foreground/10 bg-white p-8 text-center">
          <p className="mb-2 text-xl font-bold text-foreground">{msg.title}</p>
          <p className="mb-6 text-sm text-foreground/60">{msg.body}</p>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Request new link
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Set new password</h1>
        <p className="mb-8 text-foreground/60">Choose a strong password — at least 8 characters.</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {error && (
            <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Repeat your new password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </main>
  );
}
