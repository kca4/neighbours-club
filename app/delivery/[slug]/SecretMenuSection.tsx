"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Loader2 } from "lucide-react";
import { redeemSecretItem } from "../actions/redeemSecretItem";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializedSecretMenuItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  colorHex: string | null;
  cpCost: number; // guaranteed > 0 (server component filters nulls/zeros)
}

interface Props {
  items: SerializedSecretMenuItem[];
  /** null = user is not signed in */
  walletBalance: number | null;
}

// ─── SecretMenuSection ────────────────────────────────────────────────────────

export default function SecretMenuSection({ items, walletBalance }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Hidden entirely when the restaurant has no secret items.
  if (items.length === 0) return null;

  function handleRedeem(itemId: string) {
    if (isPending) return;
    setErrors((prev) => ({ ...prev, [itemId]: "" }));
    setActiveItemId(itemId);
    startTransition(async () => {
      const result = await redeemSecretItem(itemId);
      if (result.ok) {
        // revalidatePath('/', 'layout') is called inside redeemSecretItem on
        // the server — no client router.refresh() needed here.
        router.push(`/delivery/checkout/confirmation?orderId=${result.orderId}`);
      } else {
        setErrors((prev) => ({ ...prev, [itemId]: result.error }));
        setActiveItemId(null);
      }
    });
  }

  return (
    <section
      className="px-4 pb-16 pt-6 sm:px-6"
      aria-labelledby="secret-menu-heading"
    >
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="mb-5 flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg, #92400e 0%, #d97706 100%)" }}
          aria-hidden
        >
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <h2
            id="secret-menu-heading"
            className="text-xl font-bold italic text-foreground"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Secret Menu
          </h2>
          <p
            className="text-xs text-foreground/45"
            style={{ fontFamily: "var(--font-inter-tight)" }}
          >
            Members-only · Redeem with Community Points
          </p>
        </div>
      </div>

      {/* ── Item cards ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const cpFormatted = item.cpCost.toLocaleString();
          const canAfford =
            walletBalance !== null && walletBalance >= item.cpCost;
          const isLoading = isPending && activeItemId === item.id;
          const error = errors[item.id];

          return (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-white shadow-sm"
            >
              <div className="p-4">
                {/* ── Item header ─────────────────────────────────────────── */}
                <div className="flex items-start gap-3">
                  {/* Color swatch */}
                  {item.colorHex && (
                    <div
                      className="h-12 w-12 shrink-0 rounded-xl"
                      style={{ backgroundColor: item.colorHex }}
                      aria-hidden
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="font-bold text-foreground"
                        style={{ fontFamily: "var(--font-inter-tight)" }}
                      >
                        {item.name}
                      </p>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
                        }}
                      >
                        VIP
                      </span>
                    </div>

                    {item.description && (
                      <p
                        className="mt-1 line-clamp-2 text-sm leading-relaxed text-foreground/55"
                        style={{ fontFamily: "var(--font-inter-tight)" }}
                      >
                        {item.description}
                      </p>
                    )}

                    {/* CP price */}
                    <p
                      className="mt-2 text-base font-bold text-amber-600"
                      style={{ fontFamily: "var(--font-inter-tight)" }}
                    >
                      {cpFormatted} CP
                    </p>
                  </div>
                </div>

                {/* ── CTA / hint ──────────────────────────────────────────── */}
                <div className="mt-3.5">
                  {walletBalance === null ? (
                    /* Not signed in */
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2.5">
                      <Lock size={12} className="text-foreground/35" aria-hidden />
                      <p
                        className="text-xs text-foreground/45"
                        style={{ fontFamily: "var(--font-inter-tight)" }}
                      >
                        Sign in to unlock
                      </p>
                    </div>
                  ) : canAfford ? (
                    /* Affordable — active redeem button */
                    <button
                      onClick={() => handleRedeem(item.id)}
                      disabled={isLoading || isPending}
                      className={[
                        "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white",
                        "transition-all duration-150 active:scale-[0.98]",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      ].join(" ")}
                      style={{
                        background:
                          "linear-gradient(135deg, #b45309 0%, #d97706 100%)",
                        fontFamily: "var(--font-inter-tight)",
                      }}
                    >
                      {isLoading && (
                        <Loader2
                          size={14}
                          strokeWidth={2}
                          className="animate-spin"
                          aria-hidden
                        />
                      )}
                      {isLoading
                        ? "Redeeming…"
                        : `Redeem for ${cpFormatted} CP`}
                    </button>
                  ) : (
                    /* Insufficient balance — balance-aware hint */
                    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-foreground/10 bg-white/70 px-3 py-2.5">
                      <Lock size={12} className="text-foreground/35" aria-hidden />
                      <p
                        className="text-xs text-foreground/50"
                        style={{ fontFamily: "var(--font-inter-tight)" }}
                      >
                        Need {cpFormatted} CP — you have{" "}
                        {walletBalance.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {/* Inline error (e.g. "not enough points" from server) */}
                  {error && (
                    <p
                      className="mt-2 text-center text-xs font-medium text-red-600"
                      role="alert"
                      style={{ fontFamily: "var(--font-inter-tight)" }}
                    >
                      {error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
