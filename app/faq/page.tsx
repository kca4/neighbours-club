import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const faqs: Array<{ q: string; a: string }> = [
  {
    q: "How does a group buy work?",
    a: "We negotiate a deal with a supplier for a product at a discounted price. The discount depends on how many people join — the more members, the lower the price for everyone. Once the deal closes, if enough people have joined, everyone pays the final price and picks up their order at the designated location.",
  },
  {
    q: "When will I be charged?",
    a: "We place a temporary hold on your card when you join a deal (similar to a hotel reservation). You're only charged the final price when the deal closes successfully. If the deal doesn't reach the minimum number of members, the hold is released and you pay nothing.",
  },
  {
    q: "What if the deal doesn't reach the minimum?",
    a: "No problem — your card hold is released automatically and you won't be charged anything. We'll send you an email to let you know.",
  },
  {
    q: "Where do I pick up my order?",
    a: "Pickup details (location, address, and time window) are shown on each deal's page and in your confirmation email. For our first deals, pickup is at Kanata Community Hub, 100 Charlemagne Blvd, Kanata.",
  },
  {
    q: "Can I cancel after joining?",
    a: "Yes — you can leave a deal any time before it closes. Your card hold will be released immediately. Once a deal closes and your payment is captured, cancellations are handled case by case — contact us at support@neighborsclub.ca.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards through our secure payment processor (Stripe). We do not store your card details.",
  },
  {
    q: "Is my payment information secure?",
    a: "Yes. All payments are processed by Stripe, which is PCI-DSS Level 1 certified. We never see or store your full card number.",
  },
  {
    q: "How do I contact you?",
    a: "Email us at support@neighborsclub.ca. We aim to respond within one business day.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="mb-2 text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
      <p className="mb-10 text-foreground/60">
        Everything you need to know about how Neighbours Club works.
      </p>

      <div className="space-y-6">
        {faqs.map(({ q, a }, i) => (
          <div key={i} className="rounded-xl border border-foreground/10 bg-white p-6">
            <h2 className="mb-3 text-base font-semibold text-foreground">{q}</h2>
            <p className="text-sm leading-relaxed text-foreground/70">{a}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-6 text-center text-sm text-foreground/60">
        Still have questions?{" "}
        <a href="mailto:support@neighborsclub.ca" className="font-medium text-primary hover:underline">
          Email us at support@neighborsclub.ca
        </a>
      </div>
    </main>
  );
}
