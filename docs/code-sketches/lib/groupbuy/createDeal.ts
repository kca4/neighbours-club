// lib/groupbuy/createDeal.ts
//
// Deal-creation guardrail: no tier may price below the merchant's floor.
// (Group Buy Merchant Economics Spec §3 — a hard rejection, not a warning.)
//
// Postgres CHECK constraints can't reference another table's column, so the floor rule is
// enforced here in application logic (optionally backed by a DB trigger for defense-in-depth).

import 'server-only';
import { prisma } from '@/lib/prisma'; // adjust import
import { tiersBelowFloor, TierLike } from './pricing';

export interface CreateDealInput {
  restaurantId: string;
  floorPriceCents: number;
  minParticipants: number;
  maxCapacity: number;
  slowWindowStart: Date;
  slowWindowEnd: Date;
  closeTime: Date;
  merchantTakeRateBps?: number;
  merchantBountyCp?: number;
  tiers: TierLike[];
}

export class DealValidationError extends Error {}

export async function createDeal(input: CreateDealInput) {
  if (input.tiers.length === 0) {
    throw new DealValidationError('A deal needs at least one tier (the ceiling).');
  }
  const offenders = tiersBelowFloor(input.tiers, input.floorPriceCents);
  if (offenders.length > 0) {
    throw new DealValidationError(
      `Tiers below floor (${input.floorPriceCents}¢): ` +
        offenders.map((t) => `#${t.tierOrder}@${t.unitPriceCents}¢`).join(', '),
    );
  }
  if (input.minParticipants < 1 || input.maxCapacity < input.minParticipants) {
    throw new DealValidationError('Invalid participant bounds.');
  }

  return prisma.deal.create({
    data: {
      restaurantId: input.restaurantId,
      status: 'OPEN',
      floorPriceCents: input.floorPriceCents,
      minParticipants: input.minParticipants,
      maxCapacity: input.maxCapacity,
      slowWindowStart: input.slowWindowStart,
      slowWindowEnd: input.slowWindowEnd,
      closeTime: input.closeTime,
      merchantTakeRateBps: input.merchantTakeRateBps ?? 1000,
      merchantBountyCp: input.merchantBountyCp ?? null,
      tiers: { create: input.tiers },
    },
    include: { tiers: true },
  });
}
