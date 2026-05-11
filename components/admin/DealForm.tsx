"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TierEditor, { TierRow, newTier } from "./TierEditor";
import { DealStatus } from "@/lib/enums";

interface Supplier {
  id: string;
  name: string;
}

export interface DealFormData {
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  supplierId: string;
  minimumMembers: string;
  maximumMembers: string;
  maxQuantityPerMember: string;
  opensAt: string;
  closesAt: string;
  pickupLocation: string;
  pickupAddress: string;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  pickupInstructions: string;
}

interface Props {
  dealId?: string;
  initialData?: Partial<DealFormData>;
  initialTiers?: TierRow[];
  dealStatus?: DealStatus;
}

// Convert UTC ISO string → datetime-local string (local time)
function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

// datetime-local string → UTC ISO string
function fromDatetimeLocal(val: string): string {
  if (!val) return "";
  return new Date(val).toISOString();
}

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const OPEN_EDITABLE = [
  "description",
  "imageUrl",
  "pickupLocation",
  "pickupAddress",
  "pickupWindowStart",
  "pickupWindowEnd",
  "pickupInstructions",
] as const;

type OpenEditableField = (typeof OPEN_EDITABLE)[number];

function isOpenEditable(field: string): field is OpenEditableField {
  return (OPEN_EDITABLE as readonly string[]).includes(field);
}

export default function DealForm({
  dealId,
  initialData,
  initialTiers,
  dealStatus,
}: Props) {
  const router = useRouter();
  const isEdit = !!dealId;
  const isOpen = dealStatus === DealStatus.OPEN;
  const isLocked =
    dealStatus !== undefined &&
    dealStatus !== DealStatus.DRAFT &&
    dealStatus !== DealStatus.OPEN;

  const [form, setForm] = useState<DealFormData>({
    title: initialData?.title ?? "",
    slug: initialData?.slug ?? "",
    description: initialData?.description ?? "",
    imageUrl: initialData?.imageUrl ?? "",
    supplierId: initialData?.supplierId ?? "",
    minimumMembers: initialData?.minimumMembers ?? "1",
    maximumMembers: initialData?.maximumMembers ?? "",
    maxQuantityPerMember: initialData?.maxQuantityPerMember ?? "1",
    opensAt: initialData?.opensAt ?? "",
    closesAt: initialData?.closesAt ?? "",
    pickupLocation: initialData?.pickupLocation ?? "",
    pickupAddress: initialData?.pickupAddress ?? "",
    pickupWindowStart: initialData?.pickupWindowStart ?? "",
    pickupWindowEnd: initialData?.pickupWindowEnd ?? "",
    pickupInstructions: initialData?.pickupInstructions ?? "",
  });

  const [tiers, setTiers] = useState<TierRow[]>(
    initialTiers ?? newTier([]),
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tierErrors, setTierErrors] = useState<Record<number, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [slugAutoset, setSlugAutoset] = useState(!isEdit);

  useEffect(() => {
    fetch("/api/admin/suppliers")
      .then((r) => r.json())
      .then((data: Supplier[]) => setSuppliers(data))
      .catch(() => {});
  }, []);

  function set(field: keyof DealFormData, value: string) {
    if (isLocked) return;
    if (isOpen && !isOpenEditable(field)) return;

    setForm((f) => {
      const next = { ...f, [field]: value };
      // Auto-slug from title on create
      if (field === "title" && slugAutoset) {
        next.slug = toSlug(value);
      }
      return next;
    });
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function disabled(field: keyof DealFormData) {
    if (isLocked) return true;
    if (isOpen) return !isOpenEditable(field as string);
    return false;
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title) e.title = "Required";
    if (!form.slug) e.slug = "Required";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = "Lowercase letters, numbers, hyphens only";
    if (!form.description || form.description.length < 10) e.description = "Min 10 characters";
    if (!form.supplierId && !isOpen) e.supplierId = "Required";
    if (!form.minimumMembers && !isOpen) e.minimumMembers = "Required";
    if (!form.opensAt && !isOpen) e.opensAt = "Required";
    if (!form.closesAt && !isOpen) e.closesAt = "Required";
    if (!form.pickupLocation) e.pickupLocation = "Required";
    if (!form.pickupAddress) e.pickupAddress = "Required";
    if (!form.pickupWindowStart) e.pickupWindowStart = "Required";
    if (!form.pickupWindowEnd) e.pickupWindowEnd = "Required";
    if (!isOpen && tiers.length === 0) e.tiers = "At least one tier required";
    if (form.imageUrl && form.imageUrl.trim()) {
      try { new URL(form.imageUrl); } catch { e.imageUrl = "Must be a valid URL"; }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError("");

    const body: Record<string, unknown> = isOpen
      ? {
          description: form.description,
          imageUrl: form.imageUrl || null,
          pickupLocation: form.pickupLocation,
          pickupAddress: form.pickupAddress,
          pickupWindowStart: fromDatetimeLocal(form.pickupWindowStart),
          pickupWindowEnd: fromDatetimeLocal(form.pickupWindowEnd),
          pickupInstructions: form.pickupInstructions || null,
        }
      : {
          title: form.title,
          slug: form.slug,
          description: form.description,
          imageUrl: form.imageUrl || null,
          supplierId: form.supplierId,
          minimumMembers: parseInt(form.minimumMembers, 10),
          maximumMembers: form.maximumMembers ? parseInt(form.maximumMembers, 10) : null,
          maxQuantityPerMember: parseInt(form.maxQuantityPerMember, 10),
          opensAt: fromDatetimeLocal(form.opensAt),
          closesAt: fromDatetimeLocal(form.closesAt),
          pickupLocation: form.pickupLocation,
          pickupAddress: form.pickupAddress,
          pickupWindowStart: fromDatetimeLocal(form.pickupWindowStart),
          pickupWindowEnd: fromDatetimeLocal(form.pickupWindowEnd),
          pickupInstructions: form.pickupInstructions || null,
          tiers: tiers.map((t) => ({
            minMembers: t.minMembers,
            maxMembers: t.maxMembers,
            pricePerUnit: parseFloat(t.pricePerUnit),
            tierOrder: t.tierOrder,
          })),
        };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/deals/${dealId}` : "/api/admin/deals",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        if (data.issues && Array.isArray(data.issues)) {
          const fieldErrors: Record<string, string> = {};
          const newTierErrors: Record<number, string> = {};
          const formLevelMessages: string[] = [];

          for (const issue of data.issues as Array<{ path: (string | number)[]; message: string }>) {
            const path = issue.path ?? [];
            if (path.length === 0) {
              formLevelMessages.push(issue.message);
            } else if (path[0] === "tiers" && typeof path[1] === "number") {
              // Tier-specific error — show under the relevant tier row
              const tierIdx = path[1] as number;
              // Combine if multiple messages for same tier
              newTierErrors[tierIdx] = newTierErrors[tierIdx]
                ? `${newTierErrors[tierIdx]}; ${issue.message}`
                : issue.message;
            } else {
              const key = path.join(".");
              fieldErrors[key] = issue.message;
            }
          }

          setErrors(fieldErrors);
          setTierErrors(newTierErrors);
          // Only show the generic banner for form-level issues or when there are no field errors
          const hasFieldErrors = Object.keys(fieldErrors).length > 0 || Object.keys(newTierErrors).length > 0;
          setServerError(
            formLevelMessages.length > 0
              ? formLevelMessages.join(" ")
              : hasFieldErrors
              ? ""
              : (data.error ?? "Validation failed"),
          );
        } else {
          setServerError(data.error ?? "Something went wrong");
        }
        return;
      }

      const data = await res.json();
      router.push(`/admin/deals/${dealId ?? data.id}`);
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const F = ({
    field,
    label,
    required,
    type = "text",
    placeholder,
    children,
  }: {
    field: keyof DealFormData;
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    children?: React.ReactNode;
  }) => (
    <div>
      <label className="admin-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {isOpen && !isOpenEditable(field as string) && (
          <span className="ml-2 text-xs text-amber-600">(locked)</span>
        )}
      </label>
      {children ?? (
        <input
          type={type}
          value={form[field]}
          disabled={disabled(field)}
          placeholder={placeholder}
          onChange={(e) => set(field, e.target.value)}
          className="admin-input"
        />
      )}
      {errors[field] && <p className="admin-error">{errors[field]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {isOpen && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This deal is <strong>OPEN</strong>. Only description, image URL, and pickup details can be edited.
        </div>
      )}

      {/* Basic info */}
      <section>
        <h3 className="admin-section-heading">Basic information</h3>
        <div className="space-y-4">
          <F field="title" label="Title" required />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="admin-label">
                Slug <span className="text-red-500">*</span>
                {isOpen && <span className="ml-2 text-xs text-amber-600">(locked)</span>}
              </label>
              <input
                type="text"
                value={form.slug}
                disabled={disabled("slug")}
                onChange={(e) => {
                  setSlugAutoset(false);
                  set("slug", e.target.value);
                }}
                className="admin-input font-mono"
                placeholder="my-deal-slug"
              />
              {errors.slug && <p className="admin-error">{errors.slug}</p>}
            </div>
            <div>
              <label className="admin-label">
                Supplier <span className="text-red-500">*</span>
                {isOpen && <span className="ml-2 text-xs text-amber-600">(locked)</span>}
              </label>
              <select
                value={form.supplierId}
                disabled={disabled("supplierId")}
                onChange={(e) => set("supplierId", e.target.value)}
                className="admin-input"
              >
                <option value="">Select a supplier…</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="admin-error">{errors.supplierId}</p>}
              {!isOpen && (
                <a
                  href="/admin/suppliers/new"
                  target="_blank"
                  className="mt-1 inline-block text-xs text-accent hover:underline"
                >
                  + New supplier (opens in new tab)
                </a>
              )}
            </div>
          </div>

          <div>
            <label className="admin-label">Description <span className="text-red-500">*</span></label>
            <textarea
              value={form.description}
              disabled={disabled("description")}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              className="admin-input"
            />
            <p className="mt-1 text-xs text-foreground/40">{form.description.length}/5000</p>
            {errors.description && <p className="admin-error">{errors.description}</p>}
          </div>

          <F field="imageUrl" label="Image URL" placeholder="https://example.com/image.jpg" />
        </div>
      </section>

      {/* Deal settings */}
      <section>
        <h3 className="admin-section-heading">
          Deal settings
          {isOpen && <span className="ml-2 text-xs font-normal text-amber-600">(locked while OPEN)</span>}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="admin-label">Minimum members <span className="text-red-500">*</span></label>
            <input
              type="number"
              min={1}
              value={form.minimumMembers}
              disabled={disabled("minimumMembers")}
              onChange={(e) => set("minimumMembers", e.target.value)}
              className="admin-input"
            />
            {errors.minimumMembers && <p className="admin-error">{errors.minimumMembers}</p>}
          </div>
          <div>
            <label className="admin-label">Maximum members <span className="text-xs text-foreground/40">(blank = no cap)</span></label>
            <input
              type="number"
              min={1}
              value={form.maximumMembers}
              disabled={disabled("maximumMembers")}
              onChange={(e) => set("maximumMembers", e.target.value)}
              className="admin-input"
              placeholder="No limit"
            />
          </div>
          <div>
            <label className="admin-label">Max qty / member</label>
            <input
              type="number"
              min={1}
              value={form.maxQuantityPerMember}
              disabled={disabled("maxQuantityPerMember")}
              onChange={(e) => set("maxQuantityPerMember", e.target.value)}
              className="admin-input"
            />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h3 className="admin-section-heading">
          Timeline
          {isOpen && <span className="ml-2 text-xs font-normal text-amber-600">(opensAt/closesAt locked)</span>}
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="admin-label">Opens at (UTC) <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={form.opensAt}
              disabled={disabled("opensAt")}
              onChange={(e) => set("opensAt", e.target.value)}
              className="admin-input"
            />
            {errors.opensAt && <p className="admin-error">{errors.opensAt}</p>}
          </div>
          <div>
            <label className="admin-label">Closes at (UTC) <span className="text-red-500">*</span></label>
            <input
              type="datetime-local"
              value={form.closesAt}
              disabled={disabled("closesAt")}
              onChange={(e) => set("closesAt", e.target.value)}
              className="admin-input"
            />
            {errors.closesAt && <p className="admin-error">{errors.closesAt}</p>}
          </div>
        </div>
      </section>

      {/* Pickup */}
      <section>
        <h3 className="admin-section-heading">Pickup details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <F field="pickupLocation" label="Pickup location" required />
            <F field="pickupAddress" label="Pickup address" required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="admin-label">Pickup window start <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.pickupWindowStart}
                disabled={disabled("pickupWindowStart")}
                onChange={(e) => set("pickupWindowStart", e.target.value)}
                className="admin-input"
              />
              {errors.pickupWindowStart && <p className="admin-error">{errors.pickupWindowStart}</p>}
            </div>
            <div>
              <label className="admin-label">Pickup window end <span className="text-red-500">*</span></label>
              <input
                type="datetime-local"
                value={form.pickupWindowEnd}
                disabled={disabled("pickupWindowEnd")}
                onChange={(e) => set("pickupWindowEnd", e.target.value)}
                className="admin-input"
              />
              {errors.pickupWindowEnd && <p className="admin-error">{errors.pickupWindowEnd}</p>}
            </div>
          </div>
          <div>
            <label className="admin-label">Pickup instructions</label>
            <textarea
              value={form.pickupInstructions}
              disabled={disabled("pickupInstructions")}
              onChange={(e) => set("pickupInstructions", e.target.value)}
              rows={3}
              className="admin-input"
              maxLength={2000}
            />
          </div>
        </div>
      </section>

      {/* Tiers */}
      {!isOpen && (
        <section>
          <h3 className="admin-section-heading">Pricing tiers</h3>
          <p className="mb-3 text-xs text-foreground/50">
            Prices must decrease with each tier. First tier always starts at 1 member. Last tier has no upper bound.
          </p>
          <TierEditor tiers={tiers} onChange={setTiers} disabled={isOpen || isLocked} tierErrors={tierErrors} />
          {errors.tiers && <p className="admin-error mt-2">{errors.tiers}</p>}
        </section>
      )}

      <div className="flex gap-3 border-t border-foreground/10 pt-6">
        <button type="submit" disabled={isLoading || isLocked} className="btn-primary">
          {isLoading ? "Saving…" : isEdit ? "Save changes" : "Save as draft"}
        </button>
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
