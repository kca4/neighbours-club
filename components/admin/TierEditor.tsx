"use client";

export interface TierRow {
  minMembers: number;
  maxMembers: number | null;
  pricePerUnit: string; // string to allow partial input
  tierOrder: number;
}

interface Props {
  tiers: TierRow[];
  onChange: (tiers: TierRow[]) => void;
  disabled?: boolean;
  /** Per-tier error messages, keyed by tier index */
  tierErrors?: Record<number, string>;
}

export function newTier(tiers: TierRow[]): TierRow[] {
  if (tiers.length === 0) {
    return [{ minMembers: 1, maxMembers: null, pricePerUnit: "", tierOrder: 0 }];
  }
  const last = tiers[tiers.length - 1];
  // Default the previous last tier's max to min + 9 if uncapped (gives a sensible suggestion)
  const prevMax = last.maxMembers ?? last.minMembers + 9;
  const newMin = prevMax + 1;
  const updated = [...tiers];
  updated[updated.length - 1] = { ...last, maxMembers: prevMax };
  return [
    ...updated,
    {
      minMembers: newMin,
      maxMembers: null,
      pricePerUnit: "",
      tierOrder: tiers.length,
    },
  ];
}

export function removeTier(tiers: TierRow[]): TierRow[] {
  if (tiers.length <= 1) return tiers;
  const updated = tiers.slice(0, -1);
  updated[updated.length - 1] = { ...updated[updated.length - 1], maxMembers: null };
  return updated.map((t, i) => ({ ...t, tierOrder: i }));
}

export default function TierEditor({ tiers, onChange, disabled, tierErrors }: Props) {
  function updateMinMembers(index: number, value: number) {
    const updated = tiers.map((t, i) => {
      if (i === index) return { ...t, minMembers: value };
      if (i === index - 1) return { ...t, maxMembers: value - 1 };
      return t;
    });
    onChange(updated);
  }

  function updateMaxMembers(index: number, value: string) {
    const updated = tiers.map((t, i) => {
      if (i !== index) return t;
      const num = parseInt(value, 10);
      return { ...t, maxMembers: value === "" || isNaN(num) ? null : num };
    });
    onChange(updated);
  }

  function updatePrice(index: number, value: string) {
    const updated = tiers.map((t, i) =>
      i === index ? { ...t, pricePerUnit: value } : t,
    );
    onChange(updated);
  }

  return (
    <div className="space-y-3">
      {tiers.map((tier, i) => {
        const isLast = i === tiers.length - 1;
        return (
          <div
            key={i}
            className="grid grid-cols-3 gap-3 rounded-lg border border-foreground/10 bg-foreground/[0.01] p-3"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                Min members
              </label>
              <input
                type="number"
                min={1}
                value={tier.minMembers}
                disabled={disabled || i === 0} // first tier always starts at 1
                onChange={(e) => updateMinMembers(i, parseInt(e.target.value, 10))}
                className="admin-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                Max members {isLast && <span className="text-foreground/40">(blank = open)</span>}
              </label>
              <input
                type="number"
                min={tier.minMembers}
                value={tier.maxMembers ?? ""}
                placeholder={isLast ? "No limit" : ""}
                disabled={disabled || isLast}
                onChange={(e) => updateMaxMembers(i, e.target.value)}
                className="admin-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground/60">
                Price / unit ($)
              </label>
              <input
                type="number"
                min={0.01}
                step={0.01}
                value={tier.pricePerUnit}
                disabled={disabled}
                onChange={(e) => updatePrice(i, e.target.value)}
                className="admin-input"
                placeholder="0.00"
              />
            </div>
            {tierErrors?.[i] && (
              <p className="col-span-3 mt-1 text-xs text-red-600">{tierErrors[i]}</p>
            )}
          </div>
        );
      })}

      {!disabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(newTier(tiers))}
            className="rounded-lg border border-dashed border-foreground/20 px-3 py-1.5 text-sm text-foreground/60 hover:border-foreground/40 hover:text-foreground/80"
          >
            + Add tier
          </button>
          {tiers.length > 1 && (
            <button
              type="button"
              onClick={() => onChange(removeTier(tiers))}
              className="rounded-lg border border-dashed border-red-200 px-3 py-1.5 text-sm text-red-500 hover:border-red-400"
            >
              Remove last
            </button>
          )}
        </div>
      )}
    </div>
  );
}
