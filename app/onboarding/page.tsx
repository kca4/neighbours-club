"use client";

import { useState } from "react";
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
  Users,
  Truck,
  Newspaper,
  Info,
  ShieldCheck,
} from "lucide-react";

interface FormData {
  firstName: string;
  email: string;
  password: string;
  neighbourhood: string;
  agreedToTerms: boolean;
}

interface Tokens {
  royalBlue: string;
  royalBlueDeep: string;
  kraft: string;
  kraftLight: string;
  kraftDark: string;
  ink: string;
  inkSoft: string;
  accent: string;
  success: string;
  warning: string;
}

export default function CustomerOnboarding() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [data, setData] = useState<FormData>({
    firstName: "",
    email: "",
    password: "",
    neighbourhood: "kanata",
    agreedToTerms: false,
  });

  const royalBlue = "#0F766E";      // teal primary  (spec: royalBlue #1E3A8A)
  const royalBlueDeep = "#0A5C56"; // teal dark      (spec: royalBlueDeep #152B66)
  const kraft = "#E2D9C8";         // bg muted       (spec: kraft #E8DCC4)
  const kraftLight = "#FAF8F3";    // page bg        (spec: kraftLight #F5EFE0)
  const kraftDark = "#C5B99A";     // muted border   (spec: kraftDark #C9B896)
  const ink = "#1A1A2E";           // primary text   (spec: ink #1A1814)
  const inkSoft = "#5A5870";       // muted text     (spec: inkSoft #5C5448)
  const accent = "#F59E0B";        // amber accent   (spec: terracotta #D4622E)
  const success = "#166534";       // success green  (spec: success #2F5234)
  const warning = "#D97706";       // warning amber  (spec: warning #C97B1F)

  const totalSteps = 4;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const update = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const tokens: Tokens = {
    royalBlue,
    royalBlueDeep,
    kraft,
    kraftLight,
    kraftDark,
    ink,
    inkSoft,
    accent,
    success,
    warning,
  };

  const canContinue = () => {
    if (step === 0) return true;
    if (step === 1) {
      return (
        data.firstName.trim().length >= 1 &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
        data.password.length >= 8 &&
        data.agreedToTerms
      );
    }
    if (step === 2) return !!data.neighbourhood;
    return true;
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${kraftLight} 0%, ${kraft} 100%)`,
        fontFamily: "'Fraunces', 'Georgia', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Inter+Tight:wght@400;500;600;700&display=swap');

        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-body { font-family: 'Inter Tight', system-ui, sans-serif; }

        .phone-frame {
          width: 390px;
          height: 844px;
          background: ${ink};
          border-radius: 48px;
          padding: 12px;
          box-shadow:
            0 50px 100px -20px rgba(26, 24, 20, 0.4),
            0 30px 60px -30px rgba(26, 24, 20, 0.5),
            inset 0 0 0 2px rgba(255,255,255,0.08);
          position: relative;
        }
        .phone-screen {
          width: 100%;
          height: 100%;
          background: ${kraftLight};
          border-radius: 36px;
          overflow: hidden;
          position: relative;
        }
        .phone-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 120px;
          height: 32px;
          background: ${ink};
          border-radius: 20px;
          z-index: 50;
        }
        .scroll-container {
          height: 100%;
          overflow-y: auto;
          scrollbar-width: none;
          padding-bottom: 110px;
        }
        .scroll-container::-webkit-scrollbar { display: none; }

        .grain::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
          background-size: 3px 3px;
          pointer-events: none;
          opacity: 0.5;
          z-index: 1;
        }

        .step-content {
          animation: stepIn 0.35s ease-out;
        }
        @keyframes stepIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .input-clean {
          width: 100%;
          background: ${kraftLight};
          border: 1px solid ${kraftDark}80;
          border-radius: 12px;
          padding: 14px 14px 14px 42px;
          font-size: 14px;
          color: ${ink};
          outline: none;
          font-family: 'Inter Tight', sans-serif;
          transition: border-color 0.15s ease;
        }
        .input-clean:focus { border-color: ${royalBlue}; }
        .input-clean::placeholder { color: ${inkSoft}; opacity: 0.6; }

        .progress-bar {
          height: 3px;
          background: ${kraftDark}40;
          border-radius: 999px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: ${royalBlue};
          border-radius: 999px;
          transition: width 0.4s ease;
        }

        .float-soft {
          animation: floatSoft 4s ease-in-out infinite;
        }
        @keyframes floatSoft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen grain">
          {/* Header */}
          {step > 0 && step < totalSteps - 1 && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                padding: "52px 16px 14px",
                background: kraftLight,
                borderBottom: `1px solid ${kraftDark}30`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <button
                  onClick={back}
                  style={{
                    background: "transparent",
                    border: "none",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: ink,
                    cursor: "pointer",
                  }}
                >
                  <ChevronLeft size={20} strokeWidth={2.2} />
                </button>

                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    color: inkSoft,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                  }}
                >
                  {step + 1} of {totalSteps}
                </div>

                <div style={{ width: 36 }} />
              </div>

              <div className="progress-bar">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="scroll-container">
            {step > 0 && step < totalSteps - 1 && <div style={{ height: 105 }} />}
            {step === 0 && <div style={{ height: 60 }} />}
            {step === totalSteps - 1 && <div style={{ height: 60 }} />}

            <div className="step-content" key={step}>
              {step === 0 && <WelcomeStep tokens={tokens} />}
              {step === 1 && (
                <AccountStep
                  data={data}
                  update={update}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  tokens={tokens}
                />
              )}
              {step === 2 && (
                <NeighbourhoodStep
                  data={data}
                  update={update}
                  tokens={tokens}
                />
              )}
              {step === 3 && <DoneStep data={data} tokens={tokens} />}
            </div>

            <div style={{ height: 40 }} />
          </div>

          {/* Sticky CTA */}
          {step < totalSteps - 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "12px 20px 26px",
                background: `linear-gradient(to top, ${kraftLight} 70%, ${kraftLight}00)`,
                zIndex: 30,
              }}
            >
              <button
                onClick={next}
                disabled={!canContinue()}
                style={{
                  width: "100%",
                  background: canContinue() ? royalBlue : kraftDark,
                  color: kraftLight,
                  border: "none",
                  borderRadius: 16,
                  padding: "16px 20px",
                  cursor: canContinue() ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: canContinue()
                    ? "0 12px 28px -10px rgba(30,58,138,0.5)"
                    : "none",
                  opacity: canContinue() ? 1 : 0.6,
                  transition: "all 0.2s ease",
                }}
              >
                <span
                  className="font-display"
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                  }}
                >
                  {step === 0 ? "Join the club" : step === 2 ? "All set" : "Continue"}
                </span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>

              {step === 0 && (
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <span className="font-body" style={{ fontSize: 12, color: inkSoft }}>
                    Already a member?{" "}
                  </span>
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: royalBlue,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "'Inter Tight', sans-serif",
                    }}
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================= STEPS =========================

function WelcomeStep({ tokens }: { tokens: Tokens }) {
  return (
    <div style={{ padding: "20px 24px 0" }}>
      {/* Logo */}
      <div
        className="float-soft"
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: tokens.royalBlue,
          color: tokens.kraftLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Fraunces', serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 28,
          border: `2px solid ${tokens.kraft}40`,
          boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
        }}
      >
        N
      </div>

      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.royalBlue,
          marginBottom: 10,
        }}
      >
        Welcome to
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 36,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.0,
          letterSpacing: "-0.025em",
          marginBottom: 14,
        }}
      >
        Neighbours{" "}
        <span style={{ fontStyle: "italic", color: tokens.royalBlue }}>
          Club
        </span>
      </h1>

      <p
        className="font-display"
        style={{
          fontSize: 18,
          fontStyle: "italic",
          fontWeight: 400,
          color: tokens.inkSoft,
          lineHeight: 1.4,
          marginBottom: 28,
        }}
      >
        Your neighbourhood, working together.
      </p>

      {/* Group buy explainer */}
      <div
        style={{
          background: tokens.ink,
          color: tokens.kraftLight,
          borderRadius: 16,
          padding: "20px 22px",
          marginBottom: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -30,
            width: 180,
            height: 180,
            borderRadius: "50%",
            border: `1px solid ${tokens.royalBlue}`,
            opacity: 0.5,
          }}
        />
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: tokens.royalBlue,
              padding: "5px 10px",
              borderRadius: 4,
              marginBottom: 14,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "'Inter Tight', sans-serif",
            }}
          >
            <Sparkles size={11} strokeWidth={2.5} />
            Available now in Kanata
          </div>

          <h2
            className="font-display"
            style={{
              fontSize: 22,
              fontWeight: 600,
              lineHeight: 1.15,
              letterSpacing: "-0.015em",
              marginBottom: 10,
            }}
          >
            Save on everyday essentials by{" "}
            <span style={{ fontStyle: "italic" }}>pooling orders</span> with your neighbours.
          </h2>

          <p
            className="font-body"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              opacity: 0.8,
              margin: 0,
            }}
          >
            The more of us who join a deal, the lower the price for everyone.
            Pickup is at one local spot in your neighbourhood.
          </p>
        </div>
      </div>

      {/* Coming soon */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px dashed ${tokens.kraftDark}`,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div
          className="font-body"
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.inkSoft,
            marginBottom: 10,
          }}
        >
          More coming
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {[
            {
              icon: <Truck size={16} strokeWidth={2} />,
              label: "Local delivery",
              sub: "From your neighbours",
            },
            {
              icon: <Newspaper size={16} strokeWidth={2} />,
              label: "Notes",
              sub: "What&apos;s happening here",
            },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: tokens.kraft,
                  color: tokens.royalBlue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.ink,
                    fontStyle: "italic",
                    lineHeight: 1.1,
                    marginBottom: 1,
                  }}
                >
                  {item.label}
                </div>
                <div
                  className="font-body"
                  style={{ fontSize: 10, color: tokens.inkSoft, lineHeight: 1.3 }}
                >
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

interface AccountStepProps {
  data: FormData;
  update: (patch: Partial<FormData>) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  tokens: Tokens;
}

function AccountStep({ data, update, showPassword, setShowPassword, tokens }: AccountStepProps) {
  const passwordTooShort = data.password.length > 0 && data.password.length < 8;

  return (
    <div style={{ padding: "20px 24px 0" }}>
      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.royalBlue,
          marginBottom: 8,
        }}
      >
        Create your account
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        Just the basics.
      </h1>

      <p
        className="font-body"
        style={{
          fontSize: 13,
          color: tokens.inkSoft,
          lineHeight: 1.5,
          marginBottom: 28,
        }}
      >
        We keep this simple. You can always add more later.
      </p>

      {/* First name */}
      <div style={{ marginBottom: 14 }}>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.ink,
            marginBottom: 8,
          }}
        >
          First name
        </div>
        <div style={{ position: "relative" }}>
          <User
            size={16}
            strokeWidth={2}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: tokens.inkSoft,
            }}
          />
          <input
            className="input-clean"
            value={data.firstName}
            onChange={(e) => update({ firstName: e.target.value })}
            placeholder="What should we call you?"
          />
        </div>
      </div>

      {/* Email */}
      <div style={{ marginBottom: 14 }}>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.ink,
            marginBottom: 8,
          }}
        >
          Email
        </div>
        <div style={{ position: "relative" }}>
          <Mail
            size={16}
            strokeWidth={2}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: tokens.inkSoft,
            }}
          />
          <input
            className="input-clean"
            type="email"
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="you@example.com"
          />
        </div>
      </div>

      {/* Password */}
      <div style={{ marginBottom: 18 }}>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.ink,
            marginBottom: 8,
          }}
        >
          Password
        </div>
        <div style={{ position: "relative" }}>
          <Lock
            size={16}
            strokeWidth={2}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: tokens.inkSoft,
            }}
          />
          <input
            className="input-clean"
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => update({ password: e.target.value })}
            placeholder="At least 8 characters"
            style={{ paddingRight: 42 }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: tokens.inkSoft,
              cursor: "pointer",
              padding: 4,
            }}
          >
            {showPassword ? (
              <EyeOff size={16} strokeWidth={2} />
            ) : (
              <Eye size={16} strokeWidth={2} />
            )}
          </button>
        </div>
        {passwordTooShort && (
          <div
            className="font-body"
            style={{
              fontSize: 11,
              color: tokens.warning,
              marginTop: 6,
              fontWeight: 600,
            }}
          >
            A few more characters — minimum 8.
          </div>
        )}
      </div>

      {/* Terms */}
      <button
        onClick={() => update({ agreedToTerms: !data.agreedToTerms })}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: "8px 0",
          cursor: "pointer",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          textAlign: "left",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: data.agreedToTerms ? tokens.royalBlue : "transparent",
            border: data.agreedToTerms
              ? "none"
              : `1.5px solid ${tokens.kraftDark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tokens.kraftLight,
            flexShrink: 0,
            marginTop: 1,
            transition: "all 0.15s ease",
          }}
        >
          {data.agreedToTerms && <Check size={13} strokeWidth={3} />}
        </div>
        <div
          className="font-body"
          style={{ fontSize: 12, color: tokens.inkSoft, lineHeight: 1.45 }}
        >
          I agree to the{" "}
          <span style={{ color: tokens.royalBlue, fontWeight: 600 }}>Terms</span>{" "}
          and{" "}
          <span style={{ color: tokens.royalBlue, fontWeight: 600 }}>Privacy Policy</span>.
        </div>
      </button>

      {/* Privacy reassurance */}
      <div
        style={{
          marginTop: 16,
          padding: "10px 12px",
          background: tokens.kraft + "60",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <ShieldCheck size={14} strokeWidth={2} style={{ color: tokens.success, flexShrink: 0 }} />
        <span className="font-body" style={{ fontSize: 11, color: tokens.inkSoft, lineHeight: 1.4 }}>
          We&apos;ll never sell your data. Promise.
        </span>
      </div>
    </div>
  );
}

interface NeighbourhoodStepProps {
  data: FormData;
  update: (patch: Partial<FormData>) => void;
  tokens: Tokens;
}

function NeighbourhoodStep({ data, update, tokens }: NeighbourhoodStepProps) {
  return (
    <div style={{ padding: "20px 24px 0" }}>
      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.royalBlue,
          marginBottom: 8,
        }}
      >
        Your neighbourhood
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        Where are you,{" "}
        <span style={{ fontStyle: "italic", color: tokens.royalBlue }}>
          {data.firstName || "neighbour"}
        </span>
        ?
      </h1>

      <p
        className="font-body"
        style={{
          fontSize: 13,
          color: tokens.inkSoft,
          lineHeight: 1.5,
          marginBottom: 24,
        }}
      >
        Deals and pickup locations are organised by neighbourhood.
      </p>

      {/* Kanata — selected */}
      <button
        onClick={() => update({ neighbourhood: "kanata" })}
        style={{
          width: "100%",
          background: data.neighbourhood === "kanata" ? tokens.royalBlue : tokens.kraftLight,
          color: data.neighbourhood === "kanata" ? tokens.kraftLight : tokens.ink,
          border: data.neighbourhood === "kanata"
            ? "none"
            : `1.5px solid ${tokens.kraftDark}80`,
          borderRadius: 14,
          padding: "16px 18px",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 12,
          boxShadow: data.neighbourhood === "kanata"
            ? "0 8px 20px -10px rgba(30,58,138,0.4)"
            : "none",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: data.neighbourhood === "kanata"
              ? tokens.kraftLight + "20"
              : tokens.kraft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: data.neighbourhood === "kanata" ? tokens.kraftLight : tokens.royalBlue,
            flexShrink: 0,
          }}
        >
          <MapPin size={18} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="font-display"
            style={{
              fontSize: 17,
              fontWeight: 600,
              fontStyle: "italic",
              lineHeight: 1.15,
              marginBottom: 2,
            }}
          >
            Kanata
          </div>
          <div
            className="font-body"
            style={{
              fontSize: 11,
              opacity: data.neighbourhood === "kanata" ? 0.85 : 0.7,
              color: data.neighbourhood === "kanata" ? tokens.kraftLight : tokens.inkSoft,
            }}
          >
            Ottawa · Active now
          </div>
        </div>
        {data.neighbourhood === "kanata" && (
          <Check size={18} strokeWidth={2.5} />
        )}
      </button>

      {/* Other neighbourhoods — coming soon */}
      <div style={{ marginBottom: 16 }}>
        <div
          className="font-body"
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.inkSoft,
            marginBottom: 10,
            paddingLeft: 4,
          }}
        >
          Coming soon
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Stittsville", "Barrhaven", "Orl\u00e9ans"].map((n) => (
            <div
              key={n}
              style={{
                background: tokens.kraftLight,
                border: `1px dashed ${tokens.kraftDark}`,
                borderRadius: 10,
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                opacity: 0.6,
              }}
            >
              <div className="font-body" style={{ fontSize: 13, fontWeight: 500, color: tokens.ink }}>
                {n}
              </div>
              <button
                className="font-body"
                style={{
                  background: "transparent",
                  border: "none",
                  color: tokens.royalBlue,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                Notify me
              </button>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: tokens.kraft + "60",
          border: `1px solid ${tokens.kraftDark}80`,
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <Info
          size={13}
          strokeWidth={2.2}
          style={{ color: tokens.royalBlue, flexShrink: 0, marginTop: 2 }}
        />
        <span className="font-body" style={{ fontSize: 11, color: tokens.inkSoft, lineHeight: 1.45 }}>
          You can change neighbourhoods later in your account.
        </span>
      </div>
    </div>
  );
}

interface DoneStepProps {
  data: FormData;
  tokens: Tokens;
}

function DoneStep({ data, tokens }: DoneStepProps) {
  return (
    <div style={{ padding: "20px 24px 0" }}>
      {/* Big check */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: tokens.success,
          color: tokens.kraftLight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 16px 32px -12px rgba(47,82,52,0.5)",
        }}
      >
        <Check size={34} strokeWidth={3} />
      </div>

      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.royalBlue,
          marginBottom: 8,
        }}
      >
        You&apos;re in
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.0,
          letterSpacing: "-0.02em",
          marginBottom: 14,
        }}
      >
        Welcome,{" "}
        <span style={{ fontStyle: "italic", color: tokens.royalBlue }}>
          {data.firstName || "neighbour"}
        </span>
        .
      </h1>

      <p
        className="font-body"
        style={{ fontSize: 14, color: tokens.inkSoft, lineHeight: 1.5, marginBottom: 22 }}
      >
        Here&apos;s what&apos;s open in Kanata right now.
      </p>

      {/* Soft email verification */}
      <div
        style={{
          background: tokens.kraft + "60",
          border: `1px solid ${tokens.kraftDark}80`,
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 18,
        }}
      >
        <Mail size={14} strokeWidth={2.2} style={{ color: tokens.royalBlue, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="font-body" style={{ fontSize: 12, color: tokens.ink, fontWeight: 600 }}>
            We sent you a verification link
          </div>
          <div className="font-body" style={{ fontSize: 10, color: tokens.inkSoft, marginTop: 1 }}>
            No rush — you can browse and join deals right away.
          </div>
        </div>
      </div>

      {/* Live deals teaser */}
      <div
        className="font-body"
        style={{
          fontSize: 10,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.royalBlue,
          marginBottom: 12,
          paddingLeft: 4,
        }}
      >
        Open in Kanata · 2 deals
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {[
          {
            title: "Local Honey · 500g jars",
            supplier: "Stinson Apiary",
            tier1: "$14",
            tier2: "$11",
            joined: 7,
            min: 10,
            closes: "Closes Friday",
          },
          {
            title: "Olive Oil · 1L bottles",
            supplier: "Vrachio Importers",
            tier1: "$28",
            tier2: "$22",
            joined: 14,
            min: 10,
            closes: "Closes Sunday",
          },
        ].map((deal, i) => {
          const pct = Math.min(100, (deal.joined / deal.min) * 100);
          const minMet = deal.joined >= deal.min;
          return (
            <div
              key={i}
              style={{
                background: tokens.kraftLight,
                border: `1px solid ${tokens.kraftDark}50`,
                borderRadius: 14,
                padding: 14,
                cursor: "pointer",
                display: "flex",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${i === 0 ? "#D9A441" : "#7AA055"}, ${i === 0 ? "#A87622" : "#4F7034"})`,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: tokens.kraftLight,
                  fontFamily: "'Fraunces', serif",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {deal.title[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="font-display"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tokens.ink,
                    lineHeight: 1.15,
                    letterSpacing: "-0.005em",
                    marginBottom: 1,
                  }}
                >
                  {deal.title}
                </div>
                <div
                  className="font-body"
                  style={{ fontSize: 11, color: tokens.inkSoft, marginBottom: 6 }}
                >
                  {deal.supplier} · {deal.closes}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span
                    className="font-display"
                    style={{
                      fontSize: 14,
                      color: tokens.inkSoft,
                      textDecoration: "line-through",
                      fontStyle: "italic",
                      opacity: 0.6,
                    }}
                  >
                    {deal.tier1}
                  </span>
                  <span
                    className="font-display"
                    style={{ fontSize: 17, color: tokens.royalBlue, fontWeight: 700, fontStyle: "italic" }}
                  >
                    {deal.tier2}
                  </span>
                  <span
                    className="font-body"
                    style={{
                      fontSize: 9,
                      background: minMet ? tokens.success : tokens.warning,
                      color: tokens.kraftLight,
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {minMet ? "Min met" : `Need ${deal.min - deal.joined}`}
                  </span>
                </div>

                <div
                  style={{
                    height: 4,
                    background: tokens.kraftDark + "40",
                    borderRadius: 999,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: minMet ? tokens.success : tokens.royalBlue,
                      borderRadius: 999,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
                <div
                  className="font-body"
                  style={{ fontSize: 10, color: tokens.inkSoft, marginTop: 3, fontWeight: 600 }}
                >
                  <Users size={9} strokeWidth={2.2} style={{ display: "inline", marginRight: 3 }} />
                  {deal.joined} joined · min {deal.min}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Primary CTA */}
      <button
        style={{
          width: "100%",
          background: tokens.royalBlue,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 16,
          padding: "16px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
          marginBottom: 8,
        }}
      >
        <span
          className="font-display"
          style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.005em" }}
        >
          See all deals
        </span>
        <ArrowRight size={18} strokeWidth={2.2} />
      </button>

      <button
        className="font-body"
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          color: tokens.inkSoft,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          padding: "10px",
        }}
      >
        Take a quick tour first &rarr;
      </button>
    </div>
  );
}
