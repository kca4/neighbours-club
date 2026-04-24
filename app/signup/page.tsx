"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

interface FieldErrors {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
}

export default function SignUpPage() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});
    setServerError("");

    const form = new FormData(e.currentTarget);
    const rawPhone = (form.get("phone") as string).trim();

    const payload = {
      name: (form.get("name") as string).trim(),
      email: (form.get("email") as string).trim(),
      password: form.get("password") as string,
      ...(rawPhone ? { phone: rawPhone } : {}),
    };

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setFieldErrors({ email: body.error });
        } else if (res.status === 400 && Array.isArray(body.issues)) {
          const errs: FieldErrors = {};
          for (const issue of body.issues as { path: string[]; message: string }[]) {
            const field = issue.path[0] as keyof FieldErrors;
            if (field) errs[field] = issue.message;
          }
          setFieldErrors(errs);
        } else {
          setServerError(body.error ?? "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Account created — sign in immediately and redirect to /my-deals
      await signIn("credentials", {
        email: payload.email,
        password: payload.password,
        callbackUrl: "/my-deals",
      });
      // signIn with redirect:true (default) navigates away; loading stays true
    } catch {
      setServerError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Create your account</h1>
        <p className="mb-8 text-foreground/60">
          Already have one?{" "}
          <Link href="/signin" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError && (
            <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-foreground">
              Full name <span aria-hidden="true">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-describedby={fieldErrors.name ? "name-error" : undefined}
              aria-invalid={!!fieldErrors.name}
              className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Sarah Tremblay"
            />
            {fieldErrors.name && (
              <p id="name-error" role="alert" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
              Email address <span aria-hidden="true">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              aria-invalid={!!fieldErrors.email}
              className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="you@example.com"
            />
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Password <span aria-hidden="true">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
              aria-invalid={!!fieldErrors.password}
              className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Min. 8 characters"
            />
            {fieldErrors.password ? (
              <p id="password-error" role="alert" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.password}
              </p>
            ) : (
              <p id="password-hint" className="mt-1.5 text-xs text-foreground/50">
                Minimum 8 characters
              </p>
            )}
          </div>

          {/* Phone (optional) */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-foreground">
              Phone{" "}
              <span className="font-normal text-foreground/50">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              aria-describedby={fieldErrors.phone ? "phone-error" : "phone-hint"}
              aria-invalid={!!fieldErrors.phone}
              className="block w-full rounded-lg border border-foreground/20 bg-white px-4 py-3 text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+1 613 555 0100"
            />
            {fieldErrors.phone ? (
              <p id="phone-error" role="alert" className="mt-1.5 text-sm text-red-600">
                {fieldErrors.phone}
              </p>
            ) : (
              <p id="phone-hint" className="mt-1.5 text-xs text-foreground/50">
                Used for pickup reminders only
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </main>
  );
}
