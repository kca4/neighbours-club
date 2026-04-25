import { z } from "zod";

// ─── Supplier ─────────────────────────────────────────────────────────────────

const NORTH_AMERICAN_PHONE =
  /^(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/;

export const supplierSchema = z.object({
  name: z.string().min(1).max(120),
  contactName: z.string().max(120).nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z
    .string()
    .regex(NORTH_AMERICAN_PHONE, "Invalid North American phone number")
    .nullable()
    .optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// ─── Deal tiers ───────────────────────────────────────────────────────────────

export const tierInputSchema = z.object({
  minMembers: z.number().int().min(1),
  maxMembers: z.union([z.number().int().min(1), z.null()]),
  pricePerUnit: z
    .number()
    .gt(0)
    .refine((n) => Math.round(n * 100) === n * 100, {
      message: "Price must have at most 2 decimal places",
    }),
  tierOrder: z.number().int().min(0),
});

export type TierInput = z.infer<typeof tierInputSchema>;

// ─── Deal create / DRAFT edit ─────────────────────────────────────────────────

export const dealCreateSchema = z
  .object({
    title: z.string().min(1).max(200),
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, or hyphens",
      ),
    description: z.string().min(10).max(5000),
    imageUrl: z.union([z.string().url(), z.null()]).optional(),
    supplierId: z.string().min(1),
    minimumMembers: z.number().int().min(1),
    maximumMembers: z.union([z.number().int().min(1), z.null()]),
    maxQuantityPerMember: z.number().int().min(1).default(1),
    opensAt: z.string().min(1),
    closesAt: z.string().min(1),
    pickupLocation: z.string().min(1).max(200),
    pickupAddress: z.string().min(1).max(300),
    pickupWindowStart: z.string().min(1),
    pickupWindowEnd: z.string().min(1),
    pickupInstructions: z.string().max(2000).nullable().optional(),
    tiers: z.array(tierInputSchema).min(1).max(10),
  })
  .superRefine((data, ctx) => {
    const opensAt = new Date(data.opensAt);
    const closesAt = new Date(data.closesAt);
    const pickupStart = new Date(data.pickupWindowStart);
    const pickupEnd = new Date(data.pickupWindowEnd);

    if (isNaN(opensAt.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid opensAt date",
        path: ["opensAt"],
      });
      return;
    }

    if (closesAt <= opensAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "closesAt must be after opensAt",
        path: ["closesAt"],
      });
    }

    const SIX_DAYS_MS = 6 * 24 * 60 * 60 * 1000;
    if (closesAt.getTime() - opensAt.getTime() > SIX_DAYS_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Deal duration (opensAt→closesAt) must be at most 6 days (Stripe authorization expiry buffer)",
        path: ["closesAt"],
      });
    }

    if (pickupStart < closesAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pickup window start must be on or after closesAt",
        path: ["pickupWindowStart"],
      });
    }

    if (pickupEnd <= pickupStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "pickupWindowEnd must be after pickupWindowStart",
        path: ["pickupWindowEnd"],
      });
    }

    if (
      data.maximumMembers !== null &&
      data.maximumMembers !== undefined &&
      data.maximumMembers < data.minimumMembers
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "maximumMembers must be >= minimumMembers",
        path: ["maximumMembers"],
      });
    }

    // Tier structure validation
    const tiers = data.tiers;
    if (tiers.length === 0) return;

    if (tiers[0].minMembers !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First tier minMembers must be 1",
        path: ["tiers", 0, "minMembers"],
      });
    }

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const isLast = i === tiers.length - 1;

      if (!isLast && tier.maxMembers === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Only the last tier may have no upper bound (maxMembers null)",
          path: ["tiers", i, "maxMembers"],
        });
      }

      if (i > 0) {
        const prev = tiers[i - 1];
        if (prev.maxMembers !== null && tier.minMembers !== prev.maxMembers + 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Tier ${i + 1} minMembers must equal tier ${i} maxMembers + 1`,
            path: ["tiers", i, "minMembers"],
          });
        }
        if (tier.pricePerUnit >= tiers[i - 1].pricePerUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Prices must decrease with each tier (volume discount)",
            path: ["tiers", i, "pricePerUnit"],
          });
        }
      }
    }
  });

export type DealCreateInput = z.infer<typeof dealCreateSchema>;

// ─── Deal open-edit (only editable fields when OPEN) ─────────────────────────

export const dealOpenEditSchema = z.object({
  description: z.string().min(10).max(5000).optional(),
  imageUrl: z.union([z.string().url(), z.null()]).optional(),
  pickupLocation: z.string().min(1).max(200).optional(),
  pickupAddress: z.string().min(1).max(300).optional(),
  pickupWindowStart: z.string().min(1).optional(),
  pickupWindowEnd: z.string().min(1).optional(),
  pickupInstructions: z.string().max(2000).nullable().optional(),
});

export type DealOpenEditInput = z.infer<typeof dealOpenEditSchema>;

// Locked fields that cannot be changed when deal is OPEN
export const LOCKED_WHEN_OPEN = [
  "title",
  "slug",
  "supplierId",
  "minimumMembers",
  "maximumMembers",
  "maxQuantityPerMember",
  "opensAt",
  "closesAt",
  "tiers",
] as const;
