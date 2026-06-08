// lib/groupbuy/settle.ts
//
// Group-buy settlement — Branch A (success) / Branch B (failure).
// (Group Buy Merchant Economics Spec §7; CP Tokenomics Spec §6.)
//
// ── ASSUMED MODEL (map to your real schema) ──────────────────────────────────────────────
// Deal:        id, status('OPEN'|'SETTLING'|'CLOSING_SUCCESS'|'CLOSING_FAILED'), closeTime,
//              closingProcessedAt: Date|null, minParticipants, merchantTakeRateBps,
//              merchantBountyCp: number|null, restaurantId, tiers[], pledges[]
// DealPledge:  id, dealId, userId, walletId, stripePaymentIntentId, quantity(=1), items(Json)
//   NOTE: DealPledge wasn't in the original schema you provided but is required for group buys.
//
// Idempotency strategy (the hard part of a 5-minute cron):
//   1) Atomic CLAIM moves OPEN -> SETTLING; only one runner wins (updateMany count === 1).
//   2) A crashed mid-settlement deal (stuck in SETTLING) is re-claimable after RESUME_AFTER,
//      and resume is SAFE because every per-pledge effect is independently idempotent:
//        - Stripe capture/cancel use deterministic idempotencyKeys,
//        - earnGroupBuyReward is idempotent on (walletId, dealId, GROUP_BUY_REWARD),
//        - DeliveryOrder creation upserts on the unique stripePaymentIntentId.

import 'server-only';
import { prisma } from '@/lib/prisma'; // adjust
import { stripe } from '@/lib/stripe'; // adjust
import { earnGroupBuyReward } from '@/lib/cp';
import { finalTier } from './pricing';

const RESUME_AFTER_MS = 10 * 60_000; // re-claim a stalled SETTLING deal after 10 min

export async function settleDueDeals(now: Date = new Date()) {
  const due = await prisma.deal.findMany({
    where: {
      OR: [
        { status: 'OPEN', closeTime: { lte: now } },
        { status: 'SETTLING', closingProcessedAt: { lte: new Date(now.getTime() - RESUME_AFTER_MS) } },
      ],
    },
    select: { id: true },
  });
  const results = [];
  for (const { id } of due) results.push(await settleOneDeal(id, now));
  return results;
}

export async function settleOneDeal(dealId: string, now: Date = new Date()) {
  // 1) Atomic claim — only one runner proceeds.
  const claim = await prisma.deal.updateMany({
    where: {
      id: dealId,
      OR: [
        { status: 'OPEN', closeTime: { lte: now } },
        { status: 'SETTLING', closingProcessedAt: { lte: new Date(now.getTime() - RESUME_AFTER_MS) } },
      ],
    },
    data: { status: 'SETTLING', closingProcessedAt: now },
  });
  if (claim.count !== 1) return { dealId, skipped: 'not-due-or-already-claimed' };

  const deal = await prisma.deal.findUniqueOrThrow({
    where: { id: dealId },
    include: { tiers: true, pledges: true },
  });

  const participantCount = deal.pledges.length;

  // 2) Branch B — failure: void every authorization, charge nothing.
  if (participantCount < deal.minParticipants) {
    await voidAllAuthorizations(deal.pledges);
    await prisma.deal.update({ where: { id: dealId }, data: { status: 'CLOSING_FAILED' } });
    return { dealId, outcome: 'CLOSING_FAILED', participantCount };
  }

  // 3) Branch A — success: capture at the final tier, vest rewards, create orders.
  const tier = finalTier(participantCount, deal.tiers);
  if (!tier) {
    // Misconfigured deal (no eligible tier). Fail safe rather than charge an unknown price.
    await voidAllAuthorizations(deal.pledges);
    await prisma.deal.update({ where: { id: dealId }, data: { status: 'CLOSING_FAILED' } });
    return { dealId, outcome: 'CLOSING_FAILED', reason: 'no-eligible-tier', participantCount };
  }
  const unit = tier.unitPriceCents;

  let grossCents = 0;
  let unitsSold = 0;
  const captureFailures: Array<{ pledgeId: string; error: string }> = [];

  for (const p of deal.pledges) {
    const amount = unit * (p.quantity ?? 1);
    try {
      await stripe.paymentIntents.capture(
        p.stripePaymentIntentId,
        { amount_to_capture: amount },
        { idempotencyKey: `gb_capture_${dealId}_${p.id}` },
      );
      grossCents += amount;
      unitsSold += p.quantity ?? 1;

      // Idempotent on (walletId, dealId, GROUP_BUY_REWARD) — safe to re-run on resume.
      await earnGroupBuyReward(p.walletId, dealId, amount);
      await createDeliveryOrderForPledge(deal, p, amount);
    } catch (err) {
      // A capture can fail (e.g. card declined at capture time). Don't abort the batch;
      // record it. Policy for failed-capture participants is a business decision (§9).
      captureFailures.push({ pledgeId: p.id, error: String(err) });
    }
  }

  const takeCents = Math.round((grossCents * deal.merchantTakeRateBps) / 10_000);
  const bountyCostCents = 0; // merchant-funded bounty settles separately (Spec §6); 0 here.
  await prisma.merchantPayout.create({
    data: {
      dealId,
      unitsSold,
      grossCents,
      takeCents,
      bountyCostCents,
      netToMerchantCents: grossCents - takeCents - bountyCostCents,
      status: 'PENDING',
    },
  });

  await prisma.deal.update({ where: { id: dealId }, data: { status: 'CLOSING_SUCCESS' } });
  return { dealId, outcome: 'CLOSING_SUCCESS', participantCount, unitCents: unit, grossCents, captureFailures };
}

async function voidAllAuthorizations(pledges: Array<{ id: string; stripePaymentIntentId: string }>) {
  for (const p of pledges) {
    try {
      await stripe.paymentIntents.cancel(p.stripePaymentIntentId, undefined, {
        idempotencyKey: `gb_void_${p.id}`,
      });
    } catch {
      // Already-canceled / non-cancelable states are fine on a retry — swallow and continue.
    }
  }
}

async function createDeliveryOrderForPledge(
  deal: { id: string; restaurantId: string },
  pledge: { userId: string; stripePaymentIntentId: string; items?: unknown },
  subtotalCents: number,
) {
  // Honest itemized pricing (Engagement Standard §1). Tax base = subtotal + fees;
  // confirm the exact HST base with finance (§9 decision).
  const deliveryFeeCents = 499;
  const serviceFeeCents = Math.round(subtotalCents * 0.1);
  const taxCents = Math.round((subtotalCents + deliveryFeeCents + serviceFeeCents) * 0.13);
  const totalCents = subtotalCents + deliveryFeeCents + serviceFeeCents + taxCents;

  // Upsert on the unique stripePaymentIntentId makes order creation idempotent on resume.
  await prisma.deliveryOrder.upsert({
    where: { stripePaymentIntentId: pledge.stripePaymentIntentId },
    create: {
      userId: pledge.userId,
      restaurantId: deal.restaurantId,
      status: 'PENDING',
      items: (pledge.items ?? {}) as object,
      origin: 'GROUP_BUY',
      sourceDealId: deal.id,
      subtotalCents,
      deliveryFeeCents,
      serviceFeeCents,
      taxCents,
      totalCents,
      stripePaymentIntentId: pledge.stripePaymentIntentId,
    },
    update: {}, // already created on a prior (crashed) run — leave as-is
  });
}
