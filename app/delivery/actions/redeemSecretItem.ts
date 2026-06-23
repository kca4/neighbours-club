"use server";

import { revalidatePath } from 'next/cache';
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { burnCP } from "@/lib/cp";
import { InsufficientBalanceError } from "@/lib/cp";
import { DeliveryOrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RedeemResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

// ─── Constants ────────────────────────────────────────────────────────────────

/** How long a PENDING_PAYMENT draft is considered recoverable from a crash. */
const DRAFT_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ─── Server action ────────────────────────────────────────────────────────────

/**
 * Synchronous, self-healing, concurrency-safe CP secret-menu redemption.
 *
 * Pattern:
 *   1. Validate item eligibility.
 *   2. Find or create a PENDING_PAYMENT draft (heals crashes from prior attempts).
 *   3. Concurrency guard: catch unique-key violation, re-query, converge.
 *   4. Burn CP (idempotent via ledger @@unique).
 *   5. Flip draft → PENDING, clear redemptionKey, inject into kitchen queue.
 *
 * Identity ALWAYS from auth() — menuItemId is the only external input.
 */
export async function redeemSecretItem(menuItemId: string): Promise<RedeemResult> {
  // ── 1. Auth ──────────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You must be signed in to redeem a secret item." };
  }
  const userId = session.user.id;

  // ── 1. Validate MenuItem ─────────────────────────────────────────────────────
  const item = await prisma.menuItem.findUnique({
    where: { id: menuItemId },
    select: {
      id: true,
      name: true,
      cpCost: true,
      isSecret: true,
      restaurantId: true,
      isAvailable: true,
    },
  });

  if (!item || !item.isSecret || !item.isAvailable) {
    return { ok: false, error: "Item not found or not available for redemption." };
  }
  if (item.cpCost === null || !Number.isInteger(item.cpCost) || item.cpCost <= 0) {
    return { ok: false, error: "This item is not configured for CP redemption." };
  }

  const cpCost = item.cpCost;
  // The concurrency guard: one live PENDING_PAYMENT draft per (userId × menuItemId).
  // Cleared to null when the order flips to PENDING, so future redemptions are
  // unblocked (NULLs don't collide in the Postgres unique index).
  const redemptionKey = `${userId}:${menuItemId}`;

  // ── 2. Draft-sweep pre-check (self-heals crashed retries) ───────────────────
  // A live draft has: correct redemptionKey, PENDING_PAYMENT, not yet settled,
  // and was created recently enough to be a real crash recovery (not ancient).
  const cutoff = new Date(Date.now() - DRAFT_TTL_MS);

  let orderId: string;

  const existingDraft = await prisma.deliveryOrder.findFirst({
    where: {
      redemptionKey,
      status: DeliveryOrderStatus.PENDING_PAYMENT,
      cpRedemptionSettled: false,
      createdAt: { gte: cutoff },
    },
    select: { id: true },
  });

  if (existingDraft) {
    // Crashed prior attempt — reuse the draft. The burn below will dedupe.
    orderId = existingDraft.id;
  } else {
    // ── Create a fresh $0 PENDING_PAYMENT draft ──────────────────────────────
    // price:0 because this item is paid in CP, not fiat.
    // redeemedWithCP / cpCost in the snapshot let the kitchen OrderCard display
    // "Secret Menu · X CP" instead of the confusing "$0.00" a price:0 would show.
    const itemsSnapshot: Prisma.InputJsonValue = [
      {
        itemId: item.id,
        name: item.name,
        price: 0,           // CP-paid — not fiat
        quantity: 1,
        redeemedWithCP: true,
        cpCost,
      },
    ];

    try {
      const newOrder = await prisma.deliveryOrder.create({
        data: {
          userId,
          restaurantId: item.restaurantId,
          items: itemsSnapshot,
          subtotal: 0,
          deliveryFee: 0,
          serviceFee: 0,
          tax: 0,
          tip: 0,
          total: 0,
          status: DeliveryOrderStatus.PENDING_PAYMENT,
          // Sentinel address for counter-pickup orders — displayed in the kitchen
          // dashboard address chip so staff know it's an in-house redemption.
          deliveryAddress: { street: "Counter pickup", unit: null, instructions: null },
          cpRedemptionSettled: false,
          redemptionKey,
        },
        select: { id: true },
      });
      orderId = newOrder.id;
    } catch (err) {
      // ── 3. Concurrency: unique constraint on redemptionKey ─────────────────
      // A concurrent request won the race. Re-query for that winner draft.
      if (isUniqueConstraintViolation(err)) {
        const race = await prisma.deliveryOrder.findFirst({
          where: {
            redemptionKey,
            status: DeliveryOrderStatus.PENDING_PAYMENT,
            cpRedemptionSettled: false,
          },
          select: { id: true },
        });
        if (!race) {
          // Should not happen — the winner must still be in PENDING_PAYMENT
          // unless it was committed and flipped in the same millisecond.
          return { ok: false, error: "Please try again." };
        }
        orderId = race.id;
      } else {
        throw err;
      }
    }
  }

  // ── 4. Burn CP ───────────────────────────────────────────────────────────────
  // The @@unique([walletId, referenceId, reason]) ledger guard makes this
  // idempotent: a retry after a crash returns { deduped: true } — treat as success.
  try {
    await burnCP({
      userId,
      amount: cpCost,
      reason: "secret_menu_redeem",
      referenceId: `secret_redemption:${orderId}`,
    });
  } catch (err) {
    if (err instanceof InsufficientBalanceError) {
      // User genuinely can't afford it. Delete the draft — no food will be sent,
      // no CP lost. If delete fails (concurrent cancel/cleanup), that's fine.
      await prisma.deliveryOrder
        .delete({ where: { id: orderId } })
        .catch((e) =>
          console.warn(`[redeemSecretItem] Could not delete draft ${orderId} after InsufficientBalanceError:`, e)
        );
      return {
        ok: false,
        error: `Not enough Community Points. You need ${cpCost.toLocaleString()} CP.`,
      };
    }
    throw err;
  }

  // ── 5. Flip: PENDING_PAYMENT → PENDING ──────────────────────────────────────
  // - cpRedemptionSettled = true: marks that CP has been collected
  // - redemptionKey = null: frees the unique slot so this user can redeem this
  //   item again later (repeat purchases are allowed)
  // - dispatchStartedAt = now: injects the order into the kitchen queue and
  //   starts the cron-sweep dispatch clock
  await prisma.deliveryOrder.update({
    where: { id: orderId },
    data: {
      status: DeliveryOrderStatus.PENDING,
      cpRedemptionSettled: true,
      redemptionKey: null,
      dispatchStartedAt: new Date(),
    },
  });

  // CP burned — mark root-layout RSC cache stale so the Header badge reflects
  // the new balance. The client's router.push() to the confirmation page will
  // trigger a fresh layout render, picking this up automatically.
  revalidatePath('/', 'layout');
  return { ok: true, orderId };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Prisma wraps Postgres unique violations as PrismaClientKnownRequestError P2002. */
function isUniqueConstraintViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "P2002"
  );
}
