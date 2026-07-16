import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Placeholder banner */}
      <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <strong>⚠ PLACEHOLDER</strong> — This page contains placeholder legal text. Replace with
        real legal content before public launch.
      </div>

      <h1 className="mb-1 text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mb-8 text-sm text-foreground/40">Last updated: [to be completed]</p>

      <div className="prose prose-sm max-w-none text-foreground/70 space-y-6">
        <p>
          This Terms of Service agreement will govern your use of the Neighbours Club platform,
          including all associated services, features, and content provided by IREN Technologies
          Inc. operating as Neighbours Club. [Full terms to be drafted by legal counsel before
          launch.]
        </p>

        <p>
          By creating an account or joining a group buy deal on Neighbours Club, you agree to be
          bound by these Terms. If you do not agree, please do not use the platform. [Detailed
          terms covering eligibility, account responsibilities, prohibited conduct, and dispute
          resolution to be completed.]
        </p>

        <p>
          Payment terms, including the hold-and-capture model used for group buy deals, the
          conditions under which charges are made or released, and the refund policy, will be
          described in full in the final version of this agreement. [See also our Refund Policy
          page.]
        </p>

        <p>
          These Terms of Service are subject to change. Registered users will be notified of
          material changes by email. [Final terms to include governing law, limitation of
          liability, and warranty disclaimers.]
        </p>
      </div>

      <div className="mt-10 text-sm text-foreground/60">
        Questions? Email{" "}
        <a href="mailto:support@neighborsclub.ca" className="text-primary hover:underline">
          support@neighborsclub.ca
        </a>
      </div>
    </main>
  );
}
