import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Placeholder banner */}
      <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        <strong>⚠ PLACEHOLDER</strong> — This page contains placeholder legal text. Replace with
        real legal content before public launch.
      </div>

      <h1 className="mb-1 text-3xl font-bold text-foreground">Refund Policy</h1>
      <p className="mb-8 text-sm text-foreground/40">Last updated: [to be completed]</p>

      <div className="prose prose-sm max-w-none text-foreground/70 space-y-6">
        <p>
          This Refund Policy explains the circumstances under which Neighbours Club will issue
          refunds for group buy purchases. [Full policy to be drafted by legal counsel before
          launch.]
        </p>

        <p>
          If a deal does not reach the minimum number of members required, your card hold will
          be released automatically at no charge. You will receive an email notification
          confirming that no payment was taken. [No further action required from members in
          this case.]
        </p>

        <p>
          If a deal closes successfully and your payment is captured, refunds may be
          considered on a case-by-case basis for quality issues or fulfilment failures.
          Please contact support@neighborsclub.ca within 7 days of your pickup date to
          initiate a refund request. [Detailed eligibility criteria and timelines to be
          completed.]
        </p>

        <p>
          Voluntary cancellations after a deal has closed and payment has been captured are
          not eligible for automatic refunds. Neighbours Club will use reasonable efforts to
          accommodate extenuating circumstances at its sole discretion. [Detailed cancellation
          procedures to be completed.]
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
