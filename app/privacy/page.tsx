import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Placeholder banner */}
      <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <strong>⚠ PLACEHOLDER</strong> — This page contains placeholder legal text. Replace with
        real legal content before public launch.
      </div>

      <h1 className="mb-1 text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mb-8 text-sm text-foreground/40">Last updated: [to be completed]</p>

      <div className="prose prose-sm max-w-none text-foreground/70 space-y-6">
        <p>
          This Privacy Policy describes how IREN Technologies Inc. operating as Neighbours Club
          collects, uses, and protects the personal information you provide when using the
          Neighbours Club platform. [Full privacy policy to be drafted by legal counsel before
          launch, in compliance with PIPEDA and applicable Canadian privacy legislation.]
        </p>

        <p>
          We collect information you provide directly to us, including your name, email address,
          and phone number, as well as payment information processed on our behalf by Stripe.
          We do not store your full card number. [Detailed data retention, sharing, and deletion
          policies to be completed.]
        </p>

        <p>
          We use your information to operate the Neighbours Club platform, process your
          transactions, send you transactional emails about deals you have joined, and
          communicate important updates about your account. [Marketing preferences and
          unsubscribe procedures to be documented.]
        </p>

        <p>
          You have the right to access, correct, or request deletion of your personal
          information. To exercise these rights, contact us at support@neighboursclub.ca.
          [Full list of rights and procedures under Canadian privacy law to be completed.]
        </p>
      </div>

      <div className="mt-10 text-sm text-foreground/60">
        Questions? Email{" "}
        <a href="mailto:support@neighboursclub.ca" className="text-primary hover:underline">
          support@neighboursclub.ca
        </a>
      </div>
    </main>
  );
}
