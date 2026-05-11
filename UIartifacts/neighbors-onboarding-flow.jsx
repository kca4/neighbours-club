import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Store,
  User,
  Clock,
  Menu as MenuIcon,
  Camera,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowRight,
  Upload,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Info,
  FileText,
  Image as ImageIcon,
  Phone,
  MapPin,
  Mail,
  Building,
} from "lucide-react";

export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  // Form state across steps
  const [data, setData] = useState({
    restaurantName: "Maïko Ramen",
    cuisine: "Japanese · Ramen",
    address: "Unit 4, 300 Eagleson Rd, Kanata",
    phone: "(613) 555-0142",
    email: "yuki@maikoramen.ca",
    ownerName: "Yuki Tanaka",
    businessNumber: "",
    hours: {
      mon: { open: false, from: "11:30", to: "21:00" },
      tue: { open: true, from: "11:30", to: "21:00" },
      wed: { open: true, from: "11:30", to: "21:00" },
      thu: { open: true, from: "11:30", to: "21:00" },
      fri: { open: true, from: "11:30", to: "22:00" },
      sat: { open: true, from: "11:30", to: "22:00" },
      sun: { open: true, from: "12:00", to: "20:00" },
    },
    menuMethod: null, // "bulk" | "manual"
    items: [{ name: "Tonkotsu Classic", price: "17", desc: "" }],
    bulkText: "",
    photosSkipped: false,
    bankConnected: false,
    callSlot: null,
  });

  // Brand tokens
  const royalBlue = "#1E3A8A";
  const royalBlueDeep = "#152B66";
  const kraft = "#E8DCC4";
  const kraftLight = "#F5EFE0";
  const kraftDark = "#C9B896";
  const ink = "#1A1814";
  const inkSoft = "#5C5448";
  const accent = "#D4622E";
  const success = "#2F5234";
  const warning = "#C97B1F";

  const steps = [
    { id: "welcome", label: "Welcome", icon: Sparkles },
    { id: "about", label: "About", icon: Store },
    { id: "owner", label: "Owner", icon: User },
    { id: "hours", label: "Hours", icon: Clock },
    { id: "menu", label: "Menu", icon: MenuIcon },
    { id: "photos", label: "Photos", icon: Camera },
    { id: "payouts", label: "Payouts", icon: CreditCard },
    { id: "call", label: "Call", icon: Calendar },
    { id: "done", label: "Done", icon: Check },
  ];

  const totalSteps = steps.length;
  const progressPct = ((step + 1) / totalSteps) * 100;

  const update = (patch) => setData((d) => ({ ...d, ...patch }));
  const next = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const tokens = {
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

  const currentStep = steps[step];
  const StepIcon = currentStep.icon;

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
          padding-bottom: 100px;
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
          padding: 12px 14px;
          font-size: 14px;
          color: ${ink};
          outline: none;
          font-family: 'Inter Tight', sans-serif;
          transition: border-color 0.15s ease;
        }
        .input-clean:focus {
          border-color: ${royalBlue};
        }
        .input-clean::placeholder {
          color: ${inkSoft};
          opacity: 0.6;
        }

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
      `}</style>

      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen grain">
          {/* Header */}
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
                disabled={step === 0}
                style={{
                  background: "transparent",
                  border: "none",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: step === 0 ? kraftDark : ink,
                  cursor: step === 0 ? "default" : "pointer",
                  opacity: step === 0 ? 0.4 : 1,
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
                Step {step + 1} of {totalSteps}
              </div>

              {step < totalSteps - 1 ? (
                <button
                  className="font-body"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: inkSoft,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save & exit
                </button>
              ) : (
                <div style={{ width: 36 }} />
              )}
            </div>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          <div className="scroll-container">
            <div style={{ height: 105 }} />

            <div className="step-content" key={step} style={{ padding: "20px 20px 0" }}>
              {step === 0 && <WelcomeStep tokens={tokens} />}
              {step === 1 && <AboutStep data={data} update={update} tokens={tokens} />}
              {step === 2 && <OwnerStep data={data} update={update} tokens={tokens} />}
              {step === 3 && <HoursStep data={data} update={update} tokens={tokens} />}
              {step === 4 && <MenuStep data={data} update={update} tokens={tokens} />}
              {step === 5 && <PhotosStep data={data} update={update} tokens={tokens} />}
              {step === 6 && <PayoutsStep data={data} update={update} tokens={tokens} />}
              {step === 7 && <CallStep data={data} update={update} tokens={tokens} />}
              {step === 8 && <DoneStep data={data} tokens={tokens} />}
            </div>

            <div style={{ height: 40 }} />
          </div>

          {/* Sticky next button */}
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
                style={{
                  width: "100%",
                  background: royalBlue,
                  color: kraftLight,
                  border: "none",
                  borderRadius: 16,
                  padding: "15px 20px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
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
                  {step === 0
                    ? "Let's go"
                    : step === 5 && data.photosSkipped
                    ? "Continue without photos"
                    : step === totalSteps - 2
                    ? "Schedule the call"
                    : "Continue"}
                </span>
                <ArrowRight size={18} strokeWidth={2.2} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================= STEPS =========================

function WelcomeStep({ tokens }) {
  return (
    <div>
      {/* Logo / hero */}
      <div
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
          marginBottom: 24,
          border: `2px solid ${tokens.kraft}40`,
        }}
      >
        N
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 32,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}
      >
        Welcome to{" "}
        <span style={{ fontStyle: "italic", color: tokens.royalBlue }}>
          Neighbors
        </span>
      </h1>

      <p
        className="font-body"
        style={{
          fontSize: 15,
          lineHeight: 1.55,
          color: tokens.inkSoft,
          marginBottom: 28,
        }}
      >
        Let's get your restaurant set up. This takes about 20 minutes
        — you can pause and come back anytime.
      </p>

      {/* What you'll need */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div
          className="font-body"
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.royalBlue,
            marginBottom: 12,
          }}
        >
          What you'll need
        </div>
        {[
          "Your business address and hours",
          "Your menu — paste, photo, or type it in",
          "A bank account for direct deposit",
          "A few minutes for a 30-min call this week",
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "6px 0",
            }}
          >
            <Check
              size={14}
              strokeWidth={2.5}
              style={{
                color: tokens.royalBlue,
                marginTop: 2,
                flexShrink: 0,
              }}
            />
            <span
              className="font-body"
              style={{
                fontSize: 13,
                color: tokens.ink,
                lineHeight: 1.45,
              }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>

      {/* Promise */}
      <div
        style={{
          background: tokens.ink,
          color: tokens.kraftLight,
          borderRadius: 14,
          padding: "16px 18px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -20,
            right: -10,
            fontSize: 100,
            fontFamily: "'Fraunces', serif",
            fontStyle: "italic",
            fontWeight: 700,
            color: tokens.royalBlue,
            opacity: 0.5,
            lineHeight: 1,
          }}
        >
          ⁂
        </div>
        <div style={{ position: "relative" }}>
          <div
            className="font-body"
            style={{
              fontSize: 9,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              opacity: 0.7,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Our promise
          </div>
          <p
            className="font-display"
            style={{
              fontSize: 15,
              fontStyle: "italic",
              fontWeight: 500,
              lineHeight: 1.4,
              margin: 0,
            }}
          >
            Lower fees than the big platforms. Drivers who keep 100%
            of tips. A real person to call when something's off.
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutStep({ data, update, tokens }) {
  return (
    <div>
      <StepHeader
        eyebrow="Step 1 · Restaurant"
        title="Tell us about your spot."
        sub="The basics customers will see when they find you in Neighbors."
        tokens={tokens}
      />

      <Field label="Restaurant name" tokens={tokens}>
        <input
          className="input-clean"
          value={data.restaurantName}
          onChange={(e) => update({ restaurantName: e.target.value })}
          placeholder="e.g. Maïko Ramen"
        />
      </Field>

      <Field label="Cuisine type" tokens={tokens}>
        <input
          className="input-clean"
          value={data.cuisine}
          onChange={(e) => update({ cuisine: e.target.value })}
          placeholder="e.g. Japanese · Ramen"
        />
      </Field>

      <Field label="Address" sub="Where customers will pick up from" tokens={tokens}>
        <div style={{ position: "relative" }}>
          <MapPin
            size={15}
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
            value={data.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Street address"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </Field>

      <Field label="Phone" tokens={tokens}>
        <div style={{ position: "relative" }}>
          <Phone
            size={15}
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
            value={data.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="(613) 555-0100"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </Field>

      <Field label="Email" tokens={tokens}>
        <div style={{ position: "relative" }}>
          <Mail
            size={15}
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
            value={data.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="you@yourrestaurant.com"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </Field>
    </div>
  );
}

function OwnerStep({ data, update, tokens }) {
  return (
    <div>
      <StepHeader
        eyebrow="Step 2 · You"
        title="Now, about you."
        sub="We need a real person on the other end of every restaurant. This stays private."
        tokens={tokens}
      />

      <Field label="Owner / contact name" tokens={tokens}>
        <input
          className="input-clean"
          value={data.ownerName}
          onChange={(e) => update({ ownerName: e.target.value })}
          placeholder="Your full name"
        />
      </Field>

      <Field
        label="Business registration number"
        sub="CRA business number or provincial registration. We'll verify before going live."
        tokens={tokens}
      >
        <div style={{ position: "relative" }}>
          <Building
            size={15}
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
            value={data.businessNumber}
            onChange={(e) => update({ businessNumber: e.target.value })}
            placeholder="123456789"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </Field>

      <InfoCallout
        icon={<Info size={14} strokeWidth={2.2} />}
        title="Why we ask"
        text="Verifying business registration keeps fake restaurants off Neighbors. We won't share this with customers."
        tokens={tokens}
      />
    </div>
  );
}

function HoursStep({ data, update, tokens }) {
  const days = [
    { key: "mon", label: "Mon" },
    { key: "tue", label: "Tue" },
    { key: "wed", label: "Wed" },
    { key: "thu", label: "Thu" },
    { key: "fri", label: "Fri" },
    { key: "sat", label: "Sat" },
    { key: "sun", label: "Sun" },
  ];

  const toggleDay = (key) => {
    update({
      hours: {
        ...data.hours,
        [key]: { ...data.hours[key], open: !data.hours[key].open },
      },
    });
  };

  return (
    <div>
      <StepHeader
        eyebrow="Step 3 · Hours"
        title="When are you open?"
        sub="You can change these any time from your dashboard."
        tokens={tokens}
      />

      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {days.map((day, i) => {
          const h = data.hours[day.key];
          return (
            <div
              key={day.key}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 14px",
                gap: 12,
                borderBottom:
                  i < days.length - 1
                    ? `1px solid ${tokens.kraftDark}30`
                    : "none",
              }}
            >
              <button
                onClick={() => toggleDay(day.key)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: h.open ? tokens.royalBlue : "transparent",
                  color: h.open ? tokens.kraftLight : tokens.inkSoft,
                  border: h.open ? "none" : `1px solid ${tokens.kraftDark}80`,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Inter Tight', sans-serif",
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              >
                {day.label}
              </button>

              {h.open ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    className="input-clean"
                    value={h.from}
                    onChange={(e) =>
                      update({
                        hours: {
                          ...data.hours,
                          [day.key]: { ...h, from: e.target.value },
                        },
                      })
                    }
                    style={{ padding: "8px 10px", fontSize: 13 }}
                  />
                  <span
                    className="font-body"
                    style={{ color: tokens.inkSoft, fontSize: 12 }}
                  >
                    to
                  </span>
                  <input
                    className="input-clean"
                    value={h.to}
                    onChange={(e) =>
                      update({
                        hours: {
                          ...data.hours,
                          [day.key]: { ...h, to: e.target.value },
                        },
                      })
                    }
                    style={{ padding: "8px 10px", fontSize: 13 }}
                  />
                </div>
              ) : (
                <span
                  className="font-body"
                  style={{
                    flex: 1,
                    color: tokens.inkSoft,
                    fontSize: 13,
                    fontStyle: "italic",
                  }}
                >
                  Closed
                </span>
              )}
            </div>
          );
        })}
      </div>

      <InfoCallout
        icon={<Info size={14} strokeWidth={2.2} />}
        title="Tap a day to toggle"
        text="Mon is currently closed. Tap MON to open it."
        tokens={tokens}
      />
    </div>
  );
}

function MenuStep({ data, update, tokens }) {
  if (!data.menuMethod) {
    return (
      <div>
        <StepHeader
          eyebrow="Step 4 · Menu"
          title="How do you want to add your menu?"
          sub="Pick whichever is fastest for you. You can edit anything later."
          tokens={tokens}
        />

        <button
          onClick={() => update({ menuMethod: "bulk" })}
          style={{
            width: "100%",
            background: tokens.kraftLight,
            border: `2px solid ${tokens.kraftDark}50`,
            borderRadius: 14,
            padding: "16px 18px",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: tokens.royalBlue,
              color: tokens.kraftLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Upload size={18} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-display"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: tokens.ink,
                lineHeight: 1.2,
                marginBottom: 3,
              }}
            >
              Bulk upload
              <span
                className="font-body"
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  marginLeft: 8,
                  padding: "2px 6px",
                  background: tokens.success + "20",
                  color: tokens.success,
                  borderRadius: 4,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  verticalAlign: "middle",
                }}
              >
                Fastest
              </span>
            </div>
            <p
              className="font-body"
              style={{
                fontSize: 12,
                color: tokens.inkSoft,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Paste menu text, upload a PDF, or take a photo of your menu.
              We'll do the typing.
            </p>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={2}
            style={{ color: tokens.inkSoft, flexShrink: 0 }}
          />
        </button>

        <button
          onClick={() => update({ menuMethod: "manual" })}
          style={{
            width: "100%",
            background: tokens.kraftLight,
            border: `2px solid ${tokens.kraftDark}50`,
            borderRadius: 14,
            padding: "16px 18px",
            cursor: "pointer",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: tokens.ink,
              color: tokens.kraftLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileText size={18} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-display"
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: tokens.ink,
                lineHeight: 1.2,
                marginBottom: 3,
              }}
            >
              Manual entry
            </div>
            <p
              className="font-body"
              style={{
                fontSize: 12,
                color: tokens.inkSoft,
                margin: 0,
                lineHeight: 1.4,
              }}
            >
              Type each item one at a time. Best for small menus or when
              you want full control.
            </p>
          </div>
          <ChevronRight
            size={18}
            strokeWidth={2}
            style={{ color: tokens.inkSoft, flexShrink: 0 }}
          />
        </button>
      </div>
    );
  }

  if (data.menuMethod === "bulk") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 8,
          }}
        >
          <button
            onClick={() => update({ menuMethod: null })}
            className="font-body"
            style={{
              background: "transparent",
              border: "none",
              color: tokens.royalBlue,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />
            Pick a different way
          </button>
        </div>

        <StepHeader
          eyebrow="Step 4 · Menu"
          title="Drop your menu in."
          sub="Paste the text, upload a file, or take a photo. Our team will format it."
          tokens={tokens}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <button
            style={{
              background: tokens.kraftLight,
              border: `2px dashed ${tokens.kraftDark}`,
              borderRadius: 12,
              padding: "16px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: tokens.ink,
            }}
          >
            <FileText size={20} strokeWidth={2} style={{ color: tokens.royalBlue }} />
            <span
              className="font-body"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Upload PDF
            </span>
          </button>
          <button
            style={{
              background: tokens.kraftLight,
              border: `2px dashed ${tokens.kraftDark}`,
              borderRadius: 12,
              padding: "16px 12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              color: tokens.ink,
            }}
          >
            <Camera size={20} strokeWidth={2} style={{ color: tokens.royalBlue }} />
            <span
              className="font-body"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Photo of menu
            </span>
          </button>
        </div>

        <div
          className="font-body"
          style={{
            fontSize: 11,
            color: tokens.inkSoft,
            textAlign: "center",
            marginBottom: 12,
            fontWeight: 600,
          }}
        >
          — or paste menu text below —
        </div>

        <textarea
          value={data.bulkText}
          onChange={(e) => update({ bulkText: e.target.value })}
          placeholder={`Tonkotsu Classic — $17\n18-hour broth, chashu, soft egg\n\nSpicy Miso — $18\nThree miso, chili, soft egg\n\n...`}
          className="input-clean"
          style={{
            minHeight: 160,
            fontFamily: "'Inter Tight', sans-serif",
            resize: "vertical",
          }}
        />

        <InfoCallout
          icon={<Sparkles size={14} strokeWidth={2.2} />}
          title="We'll format it for you"
          text="Our team reviews bulk menu uploads within 4 hours. You'll get a preview to approve before going live."
          tokens={tokens}
        />
      </div>
    );
  }

  // Manual entry
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        <button
          onClick={() => update({ menuMethod: null })}
          className="font-body"
          style={{
            background: "transparent",
            border: "none",
            color: tokens.royalBlue,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
          Pick a different way
        </button>
      </div>

      <StepHeader
        eyebrow="Step 4 · Menu"
        title="Add your items."
        sub="Start with your top sellers. You can keep adding more after launch."
        tokens={tokens}
      />

      {data.items.map((item, i) => (
        <div
          key={i}
          style={{
            background: tokens.kraftLight,
            border: `1px solid ${tokens.kraftDark}40`,
            borderRadius: 12,
            padding: 12,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              className="font-body"
              style={{
                fontSize: 10,
                color: tokens.inkSoft,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              Item {i + 1}
            </span>
            {data.items.length > 1 && (
              <button
                onClick={() =>
                  update({
                    items: data.items.filter((_, idx) => idx !== i),
                  })
                }
                style={{
                  background: "transparent",
                  border: "none",
                  color: tokens.warning,
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <Trash2 size={14} strokeWidth={2} />
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              className="input-clean"
              value={item.name}
              onChange={(e) => {
                const items = [...data.items];
                items[i] = { ...item, name: e.target.value };
                update({ items });
              }}
              placeholder="Item name"
              style={{ flex: 2, padding: "10px 12px", fontSize: 13 }}
            />
            <input
              className="input-clean"
              value={item.price}
              onChange={(e) => {
                const items = [...data.items];
                items[i] = { ...item, price: e.target.value };
                update({ items });
              }}
              placeholder="$"
              style={{ flex: 1, padding: "10px 12px", fontSize: 13 }}
            />
          </div>
          <input
            className="input-clean"
            value={item.desc}
            onChange={(e) => {
              const items = [...data.items];
              items[i] = { ...item, desc: e.target.value };
              update({ items });
            }}
            placeholder="Description (optional but recommended)"
            style={{ padding: "10px 12px", fontSize: 13 }}
          />
        </div>
      ))}

      <button
        onClick={() =>
          update({
            items: [...data.items, { name: "", price: "", desc: "" }],
          })
        }
        style={{
          width: "100%",
          background: "transparent",
          border: `1.5px dashed ${tokens.kraftDark}`,
          borderRadius: 12,
          padding: "12px",
          cursor: "pointer",
          color: tokens.royalBlue,
          fontSize: 13,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontFamily: "'Inter Tight', sans-serif",
        }}
      >
        <Plus size={14} strokeWidth={2.5} />
        Add another item
      </button>
    </div>
  );
}

function PhotosStep({ data, update, tokens }) {
  return (
    <div>
      <StepHeader
        eyebrow="Step 5 · Photos"
        title="Bring your food to life."
        sub="Optional — but here's why it matters."
        tokens={tokens}
      />

      {/* Why photos matter */}
      <div
        style={{
          background: tokens.ink,
          color: tokens.kraftLight,
          borderRadius: 14,
          padding: "14px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: tokens.royalBlue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} strokeWidth={2.2} />
        </div>
        <div>
          <div
            className="font-display"
            style={{
              fontSize: 15,
              fontWeight: 600,
              fontStyle: "italic",
              lineHeight: 1.2,
            }}
          >
            Items with photos sell ~2× more
          </div>
          <p
            className="font-body"
            style={{
              fontSize: 11,
              opacity: 0.75,
              margin: 0,
              marginTop: 2,
            }}
          >
            We can do a free photo shoot if it helps.
          </p>
        </div>
      </div>

      {/* Upload zones */}
      <div style={{ marginBottom: 14 }}>
        <div
          className="font-body"
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.royalBlue,
            marginBottom: 10,
          }}
        >
          Restaurant logo
        </div>
        <button
          style={{
            width: "100%",
            background: tokens.kraftLight,
            border: `2px dashed ${tokens.kraftDark}`,
            borderRadius: 12,
            padding: "20px 12px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            color: tokens.ink,
          }}
        >
          <ImageIcon size={20} strokeWidth={2} style={{ color: tokens.royalBlue }} />
          <span
            className="font-body"
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            Upload logo
          </span>
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          className="font-body"
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.royalBlue,
            marginBottom: 10,
          }}
        >
          Hero photo
          <span
            style={{
              color: tokens.inkSoft,
              fontWeight: 500,
              letterSpacing: 0,
              textTransform: "none",
              marginLeft: 6,
            }}
          >
            · top of your spotlight page
          </span>
        </div>
        <button
          style={{
            width: "100%",
            background: tokens.kraftLight,
            border: `2px dashed ${tokens.kraftDark}`,
            borderRadius: 12,
            padding: "32px 12px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            color: tokens.ink,
          }}
        >
          <Camera size={22} strokeWidth={2} style={{ color: tokens.royalBlue }} />
          <span
            className="font-body"
            style={{ fontSize: 13, fontWeight: 600 }}
          >
            Add a hero photo
          </span>
          <span
            className="font-body"
            style={{ fontSize: 11, color: tokens.inkSoft }}
          >
            JPG or PNG, 1200×800 ideal
          </span>
        </button>
      </div>

      {/* Skip */}
      <button
        onClick={() => update({ photosSkipped: !data.photosSkipped })}
        style={{
          width: "100%",
          background: data.photosSkipped ? tokens.warning + "15" : "transparent",
          border: `1px solid ${
            data.photosSkipped ? tokens.warning : tokens.kraftDark
          }80`,
          borderRadius: 12,
          padding: "12px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: tokens.ink,
          fontFamily: "'Inter Tight', sans-serif",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: data.photosSkipped ? tokens.warning : "transparent",
            border: data.photosSkipped
              ? "none"
              : `1.5px solid ${tokens.kraftDark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: tokens.kraftLight,
            flexShrink: 0,
          }}
        >
          {data.photosSkipped && <Check size={11} strokeWidth={3} />}
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div
            className="font-body"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: tokens.ink,
            }}
          >
            I'll add photos later
          </div>
          <div
            className="font-body"
            style={{
              fontSize: 11,
              color: tokens.inkSoft,
              marginTop: 2,
            }}
          >
            We'll show a placeholder until you upload them.
          </div>
        </div>
      </button>
    </div>
  );
}

function PayoutsStep({ data, update, tokens }) {
  return (
    <div>
      <StepHeader
        eyebrow="Step 6 · Payouts"
        title="Get paid."
        sub="Direct deposit, weekly. We use Stripe to handle this securely."
        tokens={tokens}
      />

      <button
        onClick={() => update({ bankConnected: !data.bankConnected })}
        style={{
          width: "100%",
          background: data.bankConnected ? tokens.success : tokens.royalBlue,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 14,
          padding: "16px 18px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          boxShadow: "0 8px 20px -10px rgba(30,58,138,0.4)",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: tokens.kraftLight + "20",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {data.bankConnected ? (
            <Check size={18} strokeWidth={2.5} />
          ) : (
            <CreditCard size={18} strokeWidth={2.2} />
          )}
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div
            className="font-display"
            style={{
              fontSize: 15,
              fontWeight: 600,
              fontStyle: "italic",
              lineHeight: 1.2,
            }}
          >
            {data.bankConnected ? "Bank connected" : "Connect your bank"}
          </div>
          <div
            className="font-body"
            style={{
              fontSize: 11,
              opacity: 0.85,
              marginTop: 2,
            }}
          >
            {data.bankConnected
              ? "RBC · ••••4321"
              : "Secured by Stripe · 1 minute"}
          </div>
        </div>
        <ChevronRight size={18} strokeWidth={2.2} />
      </button>

      {/* Payout schedule preview */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div
          className="font-body"
          style={{
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: tokens.royalBlue,
            marginBottom: 10,
          }}
        >
          How payouts work
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              icon: <Calendar size={14} strokeWidth={2.2} />,
              label: "Weekly, every Friday",
              sub: "Covers Mon–Sun of the previous week",
            },
            {
              icon: <CreditCard size={14} strokeWidth={2.2} />,
              label: "Direct deposit",
              sub: "Lands in your account within 1–2 business days",
            },
            {
              icon: <FileText size={14} strokeWidth={2.2} />,
              label: "Full transparency",
              sub: "Every order, every fee, every cent — visible in your dashboard",
            },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: tokens.royalBlue,
                  color: tokens.kraftLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {row.icon}
              </div>
              <div>
                <div
                  className="font-display"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: tokens.ink,
                    lineHeight: 1.2,
                  }}
                >
                  {row.label}
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    color: tokens.inkSoft,
                    marginTop: 2,
                  }}
                >
                  {row.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CallStep({ data, update, tokens }) {
  const slots = [
    { day: "Tomorrow", date: "Tue May 5", time: "10:00 AM" },
    { day: "Tomorrow", date: "Tue May 5", time: "2:00 PM" },
    { day: "Wed", date: "Wed May 6", time: "11:00 AM" },
    { day: "Wed", date: "Wed May 6", time: "3:30 PM" },
    { day: "Thu", date: "Thu May 7", time: "10:30 AM" },
  ];

  return (
    <div>
      <StepHeader
        eyebrow="Step 7 · Call"
        title="Pick a time for the onboarding call."
        sub="30 minutes with a real person. We'll walk through the kitchen tablet, answer your questions, and lock in your launch date."
        tokens={tokens}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {slots.map((slot, i) => {
          const selected = data.callSlot === i;
          return (
            <button
              key={i}
              onClick={() => update({ callSlot: i })}
              style={{
                background: selected ? tokens.royalBlue : tokens.kraftLight,
                color: selected ? tokens.kraftLight : tokens.ink,
                border: selected
                  ? "none"
                  : `1px solid ${tokens.kraftDark}60`,
                borderRadius: 12,
                padding: "12px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: selected
                    ? tokens.kraftLight + "20"
                    : tokens.kraft,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: selected ? tokens.kraftLight : tokens.ink,
                  flexShrink: 0,
                }}
              >
                <span
                  className="font-body"
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    opacity: 0.7,
                  }}
                >
                  {slot.date.split(" ")[1]}
                </span>
                <span
                  className="font-display"
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    fontStyle: "italic",
                    lineHeight: 1,
                  }}
                >
                  {slot.date.split(" ")[2]}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  className="font-display"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  {slot.day} · {slot.time}
                </div>
                <div
                  className="font-body"
                  style={{
                    fontSize: 11,
                    opacity: selected ? 0.85 : 0.7,
                    color: selected ? tokens.kraftLight : tokens.inkSoft,
                    marginTop: 2,
                  }}
                >
                  30 min · video or phone — you pick
                </div>
              </div>
              {selected && <Check size={18} strokeWidth={2.5} />}
            </button>
          );
        })}
      </div>

      <button
        className="font-body"
        style={{
          width: "100%",
          marginTop: 12,
          background: "transparent",
          border: "none",
          color: tokens.royalBlue,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          padding: "10px",
        }}
      >
        Don't see a good time? See more options →
      </button>
    </div>
  );
}

function DoneStep({ data, tokens }) {
  return (
    <div>
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
        <Check size={36} strokeWidth={3} />
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
        You're in
      </div>

      <h1
        className="font-display"
        style={{
          fontSize: 30,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          marginBottom: 12,
        }}
      >
        Welcome to Neighbors,{" "}
        <span style={{ fontStyle: "italic", color: tokens.royalBlue }}>
          {data.ownerName.split(" ")[0]}
        </span>
        .
      </h1>

      <p
        className="font-body"
        style={{
          fontSize: 14,
          lineHeight: 1.55,
          color: tokens.inkSoft,
          marginBottom: 28,
        }}
      >
        We've got everything we need. Here's exactly what happens next.
      </p>

      {/* Timeline */}
      <div
        style={{
          background: tokens.kraftLight,
          border: `1px solid ${tokens.kraftDark}40`,
          borderRadius: 16,
          padding: "18px 18px 14px",
          marginBottom: 16,
        }}
      >
        {[
          {
            when: "Within 4 hours",
            label: "Menu review",
            sub: "We'll format your menu and email you a preview to approve.",
          },
          {
            when: "Tue May 5 · 2:00 PM",
            label: "Onboarding call",
            sub: "30 min with your Neighbors partner success contact.",
          },
          {
            when: "Within 48 hours",
            label: "Business verification",
            sub: "We confirm registration and bank info.",
          },
          {
            when: "Then — you're live",
            label: "First order can come any time",
            sub: "We'll soft-launch you to a small batch of customers first.",
            highlight: true,
          },
        ].map((item, i, arr) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 14,
              paddingBottom: i < arr.length - 1 ? 16 : 0,
              position: "relative",
            }}
          >
            {i < arr.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  left: 11,
                  top: 24,
                  bottom: 0,
                  width: 2,
                  background: tokens.kraftDark + "60",
                }}
              />
            )}
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: item.highlight ? tokens.royalBlue : tokens.kraftLight,
                border: item.highlight ? "none" : `2px solid ${tokens.kraftDark}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                position: "relative",
                zIndex: 2,
              }}
            >
              {item.highlight && (
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: tokens.kraftLight,
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div
                className="font-body"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: item.highlight ? tokens.royalBlue : tokens.inkSoft,
                  fontWeight: 700,
                  marginBottom: 2,
                }}
              >
                {item.when}
              </div>
              <div
                className="font-display"
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: tokens.ink,
                  lineHeight: 1.2,
                  fontStyle: item.highlight ? "italic" : "normal",
                  marginBottom: 2,
                }}
              >
                {item.label}
              </div>
              <div
                className="font-body"
                style={{
                  fontSize: 11,
                  color: tokens.inkSoft,
                  lineHeight: 1.45,
                }}
              >
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Direct contact */}
      <div
        style={{
          background: tokens.ink,
          color: tokens.kraftLight,
          borderRadius: 14,
          padding: "16px 18px",
          marginBottom: 24,
        }}
      >
        <div
          className="font-body"
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            opacity: 0.7,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          A real person, not a chatbot
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${tokens.royalBlue}, ${tokens.royalBlueDeep})`,
              border: `2px solid ${tokens.kraft}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Fraunces', serif",
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-display"
              style={{
                fontSize: 15,
                fontWeight: 600,
                fontStyle: "italic",
                lineHeight: 1.2,
              }}
            >
              Alex · Partner success
            </div>
            <div
              className="font-body"
              style={{
                fontSize: 11,
                opacity: 0.75,
                marginTop: 2,
              }}
            >
              alex@neighbors.app · (613) 555-0100
            </div>
          </div>
        </div>
      </div>

      <button
        style={{
          width: "100%",
          background: tokens.royalBlue,
          color: tokens.kraftLight,
          border: "none",
          borderRadius: 16,
          padding: "15px 20px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          boxShadow: "0 12px 28px -10px rgba(30,58,138,0.5)",
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
          Go to my dashboard
        </span>
        <ArrowRight size={18} strokeWidth={2.2} />
      </button>
    </div>
  );
}

// ========================= SHARED =========================

function StepHeader({ eyebrow, title, sub, tokens }) {
  return (
    <div style={{ marginBottom: 24 }}>
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
        {eyebrow}
      </div>
      <h1
        className="font-display"
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: tokens.ink,
          lineHeight: 1.1,
          letterSpacing: "-0.015em",
          marginBottom: 6,
        }}
      >
        {title}
      </h1>
      {sub && (
        <p
          className="font-body"
          style={{
            fontSize: 13,
            color: tokens.inkSoft,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function Field({ label, sub, children, tokens }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        className="font-body"
        style={{
          fontSize: 11,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontWeight: 700,
          color: tokens.ink,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          className="font-body"
          style={{
            fontSize: 11,
            color: tokens.inkSoft,
            marginBottom: 6,
            lineHeight: 1.4,
          }}
        >
          {sub}
        </div>
      )}
      {children}
    </div>
  );
}

function InfoCallout({ icon, title, text, tokens }) {
  return (
    <div
      style={{
        background: tokens.kraft + "60",
        border: `1px solid ${tokens.kraftDark}80`,
        borderRadius: 12,
        padding: "12px 14px",
        marginTop: 12,
        display: "flex",
        gap: 10,
      }}
    >
      <div style={{ color: tokens.royalBlue, marginTop: 1, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div
          className="font-body"
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: tokens.ink,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        <div
          className="font-body"
          style={{
            fontSize: 11,
            color: tokens.inkSoft,
            lineHeight: 1.45,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
