// lib/cp/index.ts
//
// Server-only entry point for the CP economy. ALL mint/burn flows through here.
// (CP Tokenomics Spec v2 §2: ledger is the source of truth, append-only, idempotent.)
//
// NOTE: this is a draft to drop into your repo — adjust the `prisma` import path and confirm
// the generated composite-unique key name (`walletId_referenceId_reason`) matches your schema.

import 'server-only';
import { prisma } from '@/lib/prisma'; // <-- adjust to your Prisma client
import { Prisma, LedgerReason } from '@prisma/client';
import {
  EconConfig,
  verifiedReadAmount,
  clampToCap,
  groupBuyRewardCp,
} from './core';

// ── EconConfig: seeded defaults are PLACEHOLDERS (Spec [TUNABLE]); real values in EconParam ──
const DEFAULTS: EconConfig = {
  verifiedReadCurve: [300, 100, 25, 25, 25],
  dailyContentCapCp: 550,
  dailyTotalEarnCapCp: 2000,
  weeklyTotalEarnCapCp: 8000,
  commerceCpPerCent: 0.05,
  cpToDollarCents: 1, // 1 CP = $0.01 — PLACEHOLDER, set deliberately (Spec §13 decision 1)
};

export async function getEconConfig(): Promise<EconConfig> {
  const row = await prisma.econParam.findUnique({ where: { key: 'econConfig' } });
  return { ...DEFAULTS, ...((row?.valueJson as Partial<EconConfig>) ?? {}) };
}

// ── helpers ──────────────────────────────────────────────────────────────────────────────
const since = (hours: number) => new Date(Date.now() - hours * 3_600_000);

export type LedgerResult = { entryId: string; amountCp: number; idempotentHit: boolean };

export async function getBalanceCp(walletId: string): Promise<number> {
  const agg = await prisma.walletLedger.aggregate({
    where: { walletId },
    _sum: { amountCp: true },
  });
  return agg._sum.amountCp ?? 0;
}

async function sumEarned(
  tx: Prisma.TransactionClient,
  walletId: string,
  gte: Date,
  reasons?: LedgerReason[],
): Promise<number> {
  const agg = await tx.walletLedger.aggregate({
    where: {
      walletId,
      createdAt: { gte },
      amountCp: { gt: 0 },
      ...(reasons ? { reason: { in: reasons } } : {}),
    },
    _sum: { amountCp: true },
  });
  return agg._sum.amountCp ?? 0;
}

/**
 * Idempotent ledger write, the single low-level primitive. Idempotent on
 * (walletId, referenceId, reason): a retry with the same triple returns the EXISTING entry
 * and never double-applies. `amountCp` is signed (+ mint / − burn). Must run inside a tx.
 */
async function writeLedger(
  tx: Prisma.TransactionClient,
  walletId: string,
  amountCp: number,
  reason: LedgerReason,
  referenceId: string,
  epochId?: string,
): Promise<LedgerResult> {
  try {
    const entry = await tx.walletLedger.create({
      data: { walletId, amountCp, reason, referenceId, epochId },
    });
    return { entryId: entry.id, amountCp, idempotentHit: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const existing = await tx.walletLedger.findUnique({
        where: { walletId_referenceId_reason: { walletId, referenceId, reason } },
      });
      // existing is guaranteed by the unique violation we just caught
      return { entryId: existing!.id, amountCp: existing!.amountCp, idempotentHit: true };
    }
    throw e;
  }
}

// ── faucets ──────────────────────────────────────────────────────────────────────────────

/**
 * Verified-read faucet with the diminishing curve + caps (Spec §4, §5).
 * The advisory lock serializes concurrent earns for THIS wallet so count-then-award is
 * race-safe (two different notes verified at once can't both claim the 1st-read amount).
 * The entry is always written even when it mints 0 CP, so the read is recorded and idempotent.
 */
export async function earnVerifiedRead(
  walletId: string,
  noteId: string,
): Promise<LedgerResult> {
  const cfg = await getEconConfig();
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${walletId}))`;

    const dup = await tx.walletLedger.findUnique({
      where: {
        walletId_referenceId_reason: {
          walletId,
          referenceId: noteId,
          reason: LedgerReason.VERIFIED_READ,
        },
      },
    });
    if (dup) return { entryId: dup.id, amountCp: dup.amountCp, idempotentHit: true };

    const day = since(24);
    const week = since(24 * 7);
    const priorReads = await tx.walletLedger.count({
      where: { walletId, reason: LedgerReason.VERIFIED_READ, createdAt: { gte: day } },
    });
    const contentEarned = await sumEarned(tx, walletId, day, [LedgerReason.VERIFIED_READ]);
    const dailyEarned = await sumEarned(tx, walletId, day);
    const weeklyEarned = await sumEarned(tx, walletId, week);

    let amount = verifiedReadAmount(priorReads, cfg);
    amount = clampToCap(amount, contentEarned, cfg.dailyContentCapCp);
    amount = clampToCap(amount, dailyEarned, cfg.dailyTotalEarnCapCp);
    amount = clampToCap(amount, weeklyEarned, cfg.weeklyTotalEarnCapCp);

    return writeLedger(tx, walletId, amount, LedgerReason.VERIFIED_READ, noteId);
  });
}

/** Commerce-weighted group-buy reward (Spec §6). `dealReferenceId` = deal/txn signature. */
export async function earnGroupBuyReward(
  walletId: string,
  dealReferenceId: string,
  capturedCents: number,
): Promise<LedgerResult> {
  const cfg = await getEconConfig();
  const amount = groupBuyRewardCp(capturedCents, cfg);
  return prisma.$transaction((tx) =>
    writeLedger(tx, walletId, amount, LedgerReason.GROUP_BUY_REWARD, dealReferenceId),
  );
}

// ── burns ────────────────────────────────────────────────────────────────────────────────

/**
 * Idempotent burn. Returns null (and writes nothing) if the wallet can't afford it.
 * Idempotent on (walletId, referenceId, reason). Used for fee waivers, civic pledges, etc.
 */
export async function burnCp(
  walletId: string,
  costCp: number,
  reason: LedgerReason,
  referenceId: string,
): Promise<LedgerResult | null> {
  if (costCp <= 0) throw new Error('burnCp: costCp must be positive');
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${walletId}))`;

    const dup = await tx.walletLedger.findUnique({
      where: { walletId_referenceId_reason: { walletId, referenceId, reason } },
    });
    if (dup) return { entryId: dup.id, amountCp: dup.amountCp, idempotentHit: true };

    const agg = await tx.walletLedger.aggregate({
      where: { walletId },
      _sum: { amountCp: true },
    });
    const balance = agg._sum.amountCp ?? 0;
    if (balance < costCp) return null; // insufficient — caller surfaces "unavailable"

    return writeLedger(tx, walletId, -costCp, reason, referenceId);
  });
}

// ── Φ measurement (Spec §7 — MEASUREMENT ONLY, throttle disabled in Phase 1) ───────────────
export async function measureChi(
  epochStart: Date,
  epochEnd: Date = new Date(),
): Promise<{ emittedCp: number; burnedCp: number; chi: number | null }> {
  const [emitted, burned] = await Promise.all([
    prisma.walletLedger.aggregate({
      where: { createdAt: { gte: epochStart, lt: epochEnd }, amountCp: { gt: 0 } },
      _sum: { amountCp: true },
    }),
    prisma.walletLedger.aggregate({
      where: { createdAt: { gte: epochStart, lt: epochEnd }, amountCp: { lt: 0 } },
      _sum: { amountCp: true },
    }),
  ]);
  const emittedCp = emitted._sum.amountCp ?? 0;
  const burnedCp = Math.abs(burned._sum.amountCp ?? 0);
  return { emittedCp, burnedCp, chi: burnedCp > 0 ? emittedCp / burnedCp : null };
}

// ── Delivery integration (thin wrapper; real burn, not a stub) ─────────────────────────────
export async function quoteFeeWaiver(
  walletId: string,
  feeWaiverCostCp: number,
): Promise<{ available: boolean; cpCost: number; reason?: string }> {
  const balance = await getBalanceCp(walletId);
  return balance >= feeWaiverCostCp
    ? { available: true, cpCost: feeWaiverCostCp }
    : { available: false, cpCost: feeWaiverCostCp, reason: 'Not enough CP' };
}

/** Apply a fee waiver; returns the ledger id to store in DeliveryOrder.feeWaiverLedgerId. */
export async function applyFeeWaiver(
  walletId: string,
  orderId: string,
  feeWaiverCostCp: number,
): Promise<{ ledgerId: string } | null> {
  const res = await burnCp(walletId, feeWaiverCostCp, LedgerReason.DELIVERY_FEE_WAIVER, orderId);
  return res ? { ledgerId: res.entryId } : null;
}
