"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SupplierFormData {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

interface Props {
  supplierId?: string;
  initialData?: Partial<SupplierFormData>;
}

export default function SupplierForm({ supplierId, initialData }: Props) {
  const router = useRouter();
  const isEdit = !!supplierId;

  const [form, setForm] = useState<SupplierFormData>({
    name: initialData?.name ?? "",
    contactName: initialData?.contactName ?? "",
    contactEmail: initialData?.contactEmail ?? "",
    contactPhone: initialData?.contactPhone ?? "",
    notes: initialData?.notes ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function set(field: keyof SupplierFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.length > 120) e.name = "Max 120 characters";
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      e.contactEmail = "Invalid email format";
    }
    if (form.notes.length > 2000) e.notes = "Max 2000 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError("");

    const body = {
      name: form.name,
      contactName: form.contactName || null,
      contactEmail: form.contactEmail || null,
      contactPhone: form.contactPhone || null,
      notes: form.notes || null,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/suppliers/${supplierId}` : "/api/admin/suppliers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Something went wrong");
        return;
      }

      const data = await res.json();
      router.push(`/admin/suppliers/${supplierId ?? data.id}`);
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {serverError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label className="admin-label">
          Supplier name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          className="admin-input"
          maxLength={120}
        />
        {errors.name && <p className="admin-error">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="admin-label">Contact name</label>
          <input
            type="text"
            value={form.contactName}
            onChange={(e) => set("contactName", e.target.value)}
            className="admin-input"
            maxLength={120}
          />
        </div>
        <div>
          <label className="admin-label">Contact phone</label>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
            className="admin-input"
            placeholder="613-555-1234"
          />
          {errors.contactPhone && <p className="admin-error">{errors.contactPhone}</p>}
        </div>
      </div>

      <div>
        <label className="admin-label">Contact email</label>
        <input
          type="email"
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
          className="admin-input"
        />
        {errors.contactEmail && <p className="admin-error">{errors.contactEmail}</p>}
      </div>

      <div>
        <label className="admin-label">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="admin-input"
          rows={4}
          maxLength={2000}
        />
        <p className="mt-1 text-xs text-foreground/40">{form.notes.length}/2000</p>
        {errors.notes && <p className="admin-error">{errors.notes}</p>}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="btn-primary">
          {isLoading ? "Saving…" : isEdit ? "Save changes" : "Create supplier"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
