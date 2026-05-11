"use client";

import { useState, useEffect, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import {
  ChevronLeft,
  ArrowRight,
  Check,
  Mail,
  Lock,
  User,
  MapPin,
  Eye,
  EyeOff,
  Sparkles,
  Truck,
  Newspaper,
  Info,
  ShieldCheck,
  Users,
} from "lucide-react";

// ── Design tokens (codebase palette) ────────────────────────────────────────
const T = {
  primary:      "#0F766E",
  primaryDark:  "#0A5C56",
  primaryLight: "#CCFBF1",
  bg:           "#FAF8F3",
  bgWarm:       "#F0EBE0",
  bgMuted:      "#E2D9C8",
  ink:          "#1A1A2E",
  inkSoft:      "#5A5870",
  accent:       "#F59E0B",
  success:      "#166534",
  warning:      "#D97706",
};

const TOTAL_STEPS = 4;

interface FormData {
  firstName: string;
  email: string;
  password: string;
  neighbourhood: string;
  agreedToTerms: boolean;
}

interface OpenDeal {
  id: string;
  slug: string;
  title: string;
  supplierName: string;
  closesAt: string;
  minimumMembers: number;
  orderCount: number;
  currentPrice: number;
  lowestPrice: number;
  startingPrice: number;
}

export default function SignUpPage() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [openDeals, setOpenDeals] = useState<OpenDeal[]>([]);

  const [data, setData] = useState<FormData>({
    firstName: "",
    email: "",
    password: "",
    neighbourhood: "kanata",
    agreedToTerms: false,
  });

  const update = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canContinue = (): boolean => {
    if (step === 0) return true;
    if (step === 1)
      return (
        data.firstName.trim().length >= 1 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
        data.password.length >= 8 &&
        data.agreedToTerms
      );
    if (step === 2) return !!data.neighbourhood;
    return true;
  };

  // Fetch open deals when we reach the Done step
  useEffect(() => {
    if (step === 3) {
      fetch("/api/deals")
        .then((r) => r.json())
        .then((deals: OpenDeal[]) => setOpenDeals(deals.slice(0, 2)))
        .catch(() => {/* non-fatal */});
    }
  }, [step]);

  async function handleNext() {
    if (!canContinue()) return;

    // On step 2 → submit account + sign in, then advance to done
    if (step === 2) {
      setSubmitting(true);
      setServerError("");
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: data.firstName.trim(),
            email: data.email.trim(),
            password: data.password,
          }),
        });
        const body = await res.json();
        if (!res.ok) {
          setServerError(body.error ?? "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
        // Sign in silently without redirect
        await signIn("credentials", {
          email: data.email.trim(),
          password: data.password,
          redirect: false,
        });
      } catch {
        setServerError("Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  const progressPct = ((step + 1) / TOTAL_STEPS) * 100;
  const ctaLabel =
    step === 0 ? "Join the club" :
    step === 2 ? (submitting ? "Creating account…" : "All set") :
    "Continue";

  return (
    <>
      <style>{`
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .step-in { animation: stepIn 0.3s ease-out; }

        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-4px); }
        }
        .float-soft { animation: floatSoft 4s ease-in-out infinite; }

        .input-onboard {
          width: 100%;
          background: white;
          border: 1px solid ${T.bgMuted};
          border-radius: 12px;
          padding: 13px 13px 13px 40px;
          font-size: 15px;
          color: ${T.ink};
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .input-onboard:focus {
          border-color: ${T.primary};
          box-shadow: 0 0 0 3px ${T.primaryLight}80;
        }
        .input-onboard::placeholder { color: ${T.inkSoft}; opacity: 0.55; }
      `}</style>

      <main
        className="relative flex flex-1 flex-col"
        style={{ background: T.bg, minHeight: "100%" }}
      >
        {/* ── Sticky progress header (steps 1–2) ─────────────────────────── */}
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div
            className="sticky top-0 z-20 border-b"
            style={{ background: T.bg, borderColor: T.bgMuted + "80" }}
          >
            <div className="mx-auto flex max-w-sm items-center justify-between px-5 pb-3 pt-3">
              <button
                onClick={back}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                aria-label="Go back"
              >
                <ChevronLeft size={20} strokeWidth={2.2} style={{ color: T.ink }} />
              </button>

              <span
                className="text-xs font-semibold tracking-widest"
                style={{ color: T.inkSoft }}
              >
                {step} of {TOTAL_STEPS - 1}
              </span>

              <div className="w-9" aria-hidden />
            </div>

            {/* Progress bar */}
            <div className="mx-auto max-w-sm px-5 pb-3">
              <div
                className="h-[3px] overflow-hidden rounded-full"
                style={{ background: T.bgMuted + "60" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: T.primary }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Scrollable step content ─────────────────────────────────────── */}
        <div className="flex-1 overflow-auto pb-36">
          <div className="mx-auto max-w-sm px-5 py-6">
            <div className="step-in" key={step}>
              {step === 0 && <WelcomeStep />}
              {step === 1 && (
                <AccountStep
                  data={data}
                  update={update}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />
              )}
              {step === 2 && (
                <NeighbourhoodStep
                  data={data}
                  update={update}
                  serverError={serverError}
                />
              )}
              {step === 3 && <DoneStep data={data} openDeals={openDeals} />}
            </div>
          </div>
        </div>

        {/* ── Sticky CTA (steps 0–2) ────────────────────────────────────── */}
        {step < TOTAL_STEPS - 1 && (
          <div
            className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-8 pt-4"
            style={{
              background: `linear-gradient(to top, ${T.bg} 70%, ${T.bg}00)`,
            }}
          >
            <div className="mx-auto max-w-sm">
              <button
                onClick={handleNext}
                disabled={!canContinue() || submitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold text-white transition-all"
                style={{
                  background: canContinue() && !submitting ? T.primary : T.bgMuted,
                  color: canContinue() && !submitting ? "white" : T.inkSoft,
                  boxShadow: canContinue() && !submitting
                    ? `0 12px 28px -10px ${T.primary}50`
                    : "none",
                  cursor: canContinue() && !submitting ? "pointer" : "not-allowed",
                  opacity: !canContinue() ? 0.7 : 1,
                }}
              >
                <span>{ctaLabel}</span>
                {!submitting && <ArrowRight size={18} strokeWidth={2.2} />}
              </button>

              {step === 0 && (
                <p className="mt-3 text-center text-xs" style={{ color: T.inkSoft }}>
                  Already a member?{" "}
                  <Link
                    href="/signin"
                    className="font-bold"
                    style={{ color: T.primary }}
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ── Step 0: Welcome ─────────────────────────────────────────────────────────

function WelcomeStep() {
  return (
    <div>
      {/* Floating N logo */}
      <div
        className="float-soft mb-7 flex h-16 w-16 items-center justify-center rounded-[18px] text-3xl font-bold italic"
        style={{
          background: T.primary,
          color: T.bg,
          fontFamily: "Georgia, serif",
          boxShadow: `0 12px 28px -10px ${T.primary}60`,
          border: `2px solid ${T.bgMuted}40`,
        }}
      >
        N
      </div>

      <p
        className="mb-2.5 text-xs font-bold uppercase tracking-[0.3em]"
        style={{ color: T.primary }}
      >
        Welcome to
      </p>

      <h1
        className="mb-3.5 text-4xl font-bold leading-none tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: T.ink }}
      >
        Neighbours{" "}
        <em style={{ color: T.primary }}>Club</em>
      </h1>

      <p
        className="mb-7 text-lg italic leading-snug"
        style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}
      >
        Your neighbourhood, working together.
      </p>

      {/* Group buy explainer card */}
      <div
        className="relative mb-4 overflow-hidden rounded-2xl p-5"
        style={{ background: T.ink, color: T.bg }}
      >
        {/* Decorative ring */}
        <div
          className="pointer-events-none absolute -right-7 -top-10 h-44 w-44 rounded-full opacity-40"
          style={{ border: `1px solid ${T.primary}` }}
        />

        <div className="relative">
          <div
            className="mb-3.5 inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ background: T.primary }}
          >
            <Sparkles size={10} strokeWidth={2.5} />
            Available now in Kanata
          </div>

          <h2
            className="mb-2.5 text-xl font-semibold leading-snug tracking-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Save on everyday essentials by{" "}
            <em>pooling orders</em> with your neighbours.
          </h2>

          <p className="m-0 text-sm leading-relaxed opacity-80">
            The more of us who join a deal, the lower the price for everyone.
            Pickup is at one local spot in your neighbourhood.
          </p>
        </div>
      </div>

      {/* Coming soon teaser */}
      <div
        className="rounded-2xl p-4"
        style={{
          background: T.bg,
          border: `1px dashed ${T.bgMuted}`,
        }}
      >
        <p
          className="mb-2.5 text-[9px] font-bold uppercase tracking-[0.25em]"
          style={{ color: T.inkSoft }}
        >
          More coming
        </p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Truck size={15} strokeWidth={2} />, label: "Local delivery", sub: "From your neighbours" },
            { icon: <Newspaper size={15} strokeWidth={2} />, label: "Notes", sub: "What's happening here" },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: T.bgWarm, color: T.primary }}
              >
                {item.icon}
              </div>
              <div>
                <div
                  className="text-sm font-semibold italic leading-tight"
                  style={{ fontFamily: "Georgia, serif", color: T.ink }}
                >
                  {item.label}
                </div>
                <div className="text-[10px] leading-snug" style={{ color: T.inkSoft }}>
                  {item.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Step 1: Account ─────────────────────────────────────────────────────────

interface AccountStepProps {
  data: FormData;
  update: (patch: Partial<FormData>) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
}

function AccountStep({ data, update, showPassword, setShowPassword }: AccountStepProps) {
  const passwordTooShort = data.password.length > 0 && data.password.length < 8;

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: T.primary }}>
        Create your account
      </p>
      <h1
        className="mb-2 text-3xl font-semibold leading-tight tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: T.ink }}
      >
        Just the basics.
      </h1>
      <p className="mb-7 text-sm leading-relaxed" style={{ color: T.inkSoft }}>
        We keep this simple. You can always add more later.
      </p>

      {/* First name */}
      <div className="mb-4">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: T.ink }}>
          First name
        </label>
        <div className="relative">
          <User size={15} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: T.inkSoft }} />
          <input
            className="input-onboard"
            value={data.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            placeholder="What should we call you?"
            autoComplete="given-name"
          />
        </div>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: T.ink }}>
          Email
        </label>
        <div className="relative">
          <Mail size={15} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: T.inkSoft }} />
          <input
            className="input-onboard"
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Password */}
      <div className="mb-5">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: T.ink }}>
          Password
        </label>
        <div className="relative">
          <Lock size={15} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: T.inkSoft }} />
          <input
            className="input-onboard"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="At least 8 characters"
            style={{ paddingRight: 44 }}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            style={{ color: T.inkSoft }}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
          </button>
        </div>
        {passwordTooShort && (
          <p className="mt-1.5 text-xs font-semibold" style={{ color: T.warning }}>
            A few more characters — minimum 8.
          </p>
        )}
      </div>

      {/* Terms checkbox */}
      <button
        type="button"
        onClick={() => update({ agreedToTerms: !data.agreedToTerms })}
        className="flex w-full items-start gap-2.5 py-2 text-left"
      >
        <div
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all"
          style={{
            background: data.agreedToTerms ? T.primary : "transparent",
            border: data.agreedToTerms ? "none" : `1.5px solid ${T.bgMuted}`,
            color: "white",
          }}
        >
          {data.agreedToTerms && <Check size={12} strokeWidth={3} />}
        </div>
        <span className="text-xs leading-relaxed" style={{ color: T.inkSoft }}>
          I agree to the{" "}
          <Link href="/terms" className="font-bold" style={{ color: T.primary }} onClick={(e) => e.stopPropagation()}>
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-bold" style={{ color: T.primary }} onClick={(e) => e.stopPropagation()}>
            Privacy Policy
          </Link>
          .
        </span>
      </button>

      {/* Privacy reassurance */}
      <div
        className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5"
        style={{ background: T.bgWarm + "80" }}
      >
        <ShieldCheck size={13} strokeWidth={2} style={{ color: T.success, flexShrink: 0 }} />
        <span className="text-xs leading-snug" style={{ color: T.inkSoft }}>
          We'll never sell your data. Promise.
        </span>
      </div>
    </div>
  );
}

// ── Step 2: Neighbourhood ───────────────────────────────────────────────────

interface NeighbourhoodStepProps {
  data: FormData;
  update: (patch: Partial<FormData>) => void;
  serverError: string;
}

function NeighbourhoodStep({ data, update, serverError }: NeighbourhoodStepProps) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: T.primary }}>
        Your neighbourhood
      </p>
      <h1
        className="mb-2 text-3xl font-semibold leading-tight tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: T.ink }}
      >
        Where are you,{" "}
        <em style={{ color: T.primary }}>{data.firstName || "neighbour"}</em>?
      </h1>
      <p className="mb-6 text-sm leading-relaxed" style={{ color: T.inkSoft }}>
        Deals and pickup locations are organised by neighbourhood.
      </p>

      {serverError && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {/* Kanata — active */}
      <button
        type="button"
        onClick={() => update({ neighbourhood: "kanata" })}
        className="mb-3 flex w-full items-center gap-3.5 rounded-2xl px-4 py-4 text-left transition-all"
        style={{
          background: data.neighbourhood === "kanata" ? T.primary : "white",
          color: data.neighbourhood === "kanata" ? T.bg : T.ink,
          border: data.neighbourhood === "kanata" ? "none" : `1.5px solid ${T.bgMuted}80`,
          boxShadow: data.neighbourhood === "kanata" ? `0 8px 20px -10px ${T.primary}50` : "none",
        }}
      >
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: data.neighbourhood === "kanata" ? "rgba(255,255,255,0.15)" : T.bgWarm,
            color: data.neighbourhood === "kanata" ? T.bg : T.primary,
          }}
        >
          <MapPin size={18} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-base font-semibold italic leading-tight" style={{ fontFamily: "Georgia, serif" }}>
            Kanata
          </div>
          <div
            className="text-xs"
            style={{ opacity: data.neighbourhood === "kanata" ? 0.8 : 0.6 }}
          >
            Ottawa · Active now
          </div>
        </div>
        {data.neighbourhood === "kanata" && (
          <Check size={18} strokeWidth={2.5} />
        )}
      </button>

      {/* Coming soon */}
      <div className="mb-4">
        <p
          className="mb-2.5 pl-1 text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{ color: T.inkSoft }}
        >
          Coming soon
        </p>
        <div className="flex flex-col gap-1.5">
          {["Stittsville", "Barrhaven", "Orléans"].map((n) => (
            <div
              key={n}
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 opacity-60"
              style={{
                background: T.bg,
                border: `1px dashed ${T.bgMuted}`,
              }}
            >
              <span className="text-sm font-medium" style={{ color: T.ink }}>
                {n}
              </span>
              {/* TODO: wire notify-me to a waitlist subscription */}
              <button
                type="button"
                className="text-xs font-bold"
                style={{ color: T.primary }}
                onClick={(e) => e.stopPropagation()}
              >
                Notify me
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex items-start gap-2 rounded-xl px-3 py-2.5"
        style={{
          background: T.bgWarm + "60",
          border: `1px solid ${T.bgMuted}80`,
        }}
      >
        <Info size={12} strokeWidth={2.2} className="mt-0.5 shrink-0" style={{ color: T.primary }} />
        <span className="text-xs leading-snug" style={{ color: T.inkSoft }}>
          You can change neighbourhoods later in your account.
        </span>
      </div>
    </div>
  );
}

// ── Step 3: Done ────────────────────────────────────────────────────────────

interface DoneStepProps {
  data: FormData;
  openDeals: OpenDeal[];
}

function DoneStep({ data, openDeals }: DoneStepProps) {
  function daysUntil(iso: string) {
    return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div>
      {/* Big check */}
      <div
        className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full"
        style={{
          background: T.success,
          color: "white",
          boxShadow: `0 16px 32px -12px ${T.success}60`,
        }}
      >
        <Check size={34} strokeWidth={3} />
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: T.primary }}>
        You&apos;re in
      </p>
      <h1
        className="mb-3.5 text-[30px] font-semibold leading-none tracking-tight"
        style={{ fontFamily: "Georgia, serif", color: T.ink }}
      >
        Welcome,{" "}
        <em style={{ color: T.primary }}>{data.firstName || "neighbour"}</em>.
      </h1>
      <p className="mb-5 text-sm leading-relaxed" style={{ color: T.inkSoft }}>
        Here&apos;s what&apos;s open in Kanata right now.
      </p>

      {/* Email verification notice */}
      <div
        className="mb-5 flex items-center gap-2.5 rounded-xl px-3.5 py-3"
        style={{
          background: T.bgWarm + "60",
          border: `1px solid ${T.bgMuted}80`,
        }}
      >
        <Mail size={14} strokeWidth={2.2} className="shrink-0" style={{ color: T.primary }} />
        <div>
          <div className="text-xs font-semibold" style={{ color: T.ink }}>
            We sent you a verification link
          </div>
          <div className="mt-0.5 text-[10px]" style={{ color: T.inkSoft }}>
            No rush — you can browse and join deals right away.
          </div>
        </div>
      </div>

      {/* Live deals */}
      {openDeals.length > 0 && (
        <>
          <p
            className="mb-3 pl-1 text-[10px] font-bold uppercase tracking-[0.25em]"
            style={{ color: T.primary }}
          >
            Open in Kanata · {openDeals.length} deal{openDeals.length !== 1 ? "s" : ""}
          </p>

          <div className="mb-6 flex flex-col gap-2.5">
            {openDeals.map((deal, i) => {
              const progressPct = Math.min(100, Math.round((deal.orderCount / deal.minimumMembers) * 100));
              const minMet = deal.orderCount >= deal.minimumMembers;
              const daysLeft = daysUntil(deal.closesAt);
              const gradients = [
                ["#D9A441", "#A87622"],
                ["#7AA055", "#4F7034"],
                ["#5B8FC9", "#2E5F9A"],
                ["#C96B5B", "#8B3E30"],
              ];
              const [g1, g2] = gradients[i % gradients.length];

              return (
                <div
                  key={deal.id}
                  className="flex gap-3 rounded-2xl p-3.5"
                  style={{
                    background: "white",
                    border: `1px solid ${T.bgMuted}50`,
                  }}
                >
                  {/* Colour swatch */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl font-bold italic text-white"
                    style={{
                      background: `linear-gradient(135deg, ${g1}, ${g2})`,
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {deal.title[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className="mb-0.5 text-sm font-semibold leading-tight tracking-tight"
                      style={{ fontFamily: "Georgia, serif", color: T.ink }}
                    >
                      {deal.title}
                    </div>
                    <div className="mb-1.5 text-[11px]" style={{ color: T.inkSoft }}>
                      {deal.supplierName} ·{" "}
                      {daysLeft <= 0 ? "Closing soon" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
                    </div>

                    {/* Prices */}
                    <div className="mb-1.5 flex items-center gap-2">
                      {deal.startingPrice > deal.currentPrice && (
                        <span
                          className="text-sm italic line-through opacity-50"
                          style={{ fontFamily: "Georgia, serif", color: T.inkSoft }}
                        >
                          ${deal.startingPrice.toFixed(2)}
                        </span>
                      )}
                      <span
                        className="text-base font-bold italic"
                        style={{ fontFamily: "Georgia, serif", color: T.primary }}
                      >
                        ${deal.currentPrice.toFixed(2)}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white"
                        style={{ background: minMet ? T.success : T.warning }}
                      >
                        {minMet ? "Min met" : `Need ${deal.minimumMembers - deal.orderCount}`}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div
                      className="h-1 overflow-hidden rounded-full"
                      style={{ background: T.bgMuted + "60" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${progressPct}%`,
                          background: minMet ? T.success : T.primary,
                        }}
                      />
                    </div>
                    <div className="mt-1 text-[10px] font-semibold" style={{ color: T.inkSoft }}>
                      <Users size={9} strokeWidth={2.2} className="mr-1 inline" />
                      {deal.orderCount} joined · min {deal.minimumMembers}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Primary CTA */}
      <Link
        href="/deals"
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-semibold text-white"
        style={{
          background: T.primary,
          boxShadow: `0 12px 28px -10px ${T.primary}50`,
        }}
      >
        <span>See all deals</span>
        <ArrowRight size={18} strokeWidth={2.2} />
      </Link>
    </div>
  );
}
