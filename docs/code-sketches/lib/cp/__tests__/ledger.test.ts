// lib/cp/__tests__/ledger.test.ts
//
// Integration tests for the ledger. These need a TEST Postgres database (the same engine as
// prod — the advisory lock and the unique guard are Postgres behaviors, so don't mock them).
// Point DATABASE_URL at a disposable test DB and truncate WalletLedger before each test.
//
// The single most important property here is IDEMPOTENCY: a retry or double-submit must never
// double-apply. A silent failure of this is the one bug that corrupts the whole economy, so
// it gets the most coverage.

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  earnVerifiedRead,
  earnGroupBuyReward,
  burnCp,
  getBalanceCp,
  measureChi,
} from '../index';
import { LedgerReason } from '@prisma/client';

const WALLET = 'wallet_test_1';

beforeEach(async () => {
  await prisma.walletLedger.deleteMany({});
  // ensure EconParam uses defaults (no override row) for deterministic curve/caps
  await prisma.econParam.deleteMany({ where: { key: 'econConfig' } });
});

describe('idempotency (the critical property)', () => {
  it('verifying the same note twice mints once', async () => {
    const first = await earnVerifiedRead(WALLET, 'note_A');
    const second = await earnVerifiedRead(WALLET, 'note_A');

    expect(first.idempotentHit).toBe(false);
    expect(second.idempotentHit).toBe(true);
    expect(second.entryId).toBe(first.entryId);
    expect(await getBalanceCp(WALLET)).toBe(300); // not 600
  });

  it('burning twice for the same reference deducts once', async () => {
    await earnGroupBuyReward(WALLET, 'deal_1', 100_000); // fund the wallet generously
    const balBefore = await getBalanceCp(WALLET);

    const b1 = await burnCp(WALLET, 1500, LedgerReason.DELIVERY_FEE_WAIVER, 'order_9');
    const b2 = await burnCp(WALLET, 1500, LedgerReason.DELIVERY_FEE_WAIVER, 'order_9');

    expect(b1?.idempotentHit).toBe(false);
    expect(b2?.idempotentHit).toBe(true);
    expect(await getBalanceCp(WALLET)).toBe(balBefore - 1500); // deducted once
  });
});

describe('diminishing faucet + caps (Spec §4, §5)', () => {
  it('follows the curve across distinct notes and stops minting past the content cap', async () => {
    const ids = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7'];
    for (const id of ids) await earnVerifiedRead(WALLET, id);

    // 300 + 100 + 25 + 25 + 25 = 475, then 0,0 — under the 550 content cap, so balance = 475.
    expect(await getBalanceCp(WALLET)).toBe(475);
  });

  it('records the read even when it mints 0 CP (entry still exists, idempotent)', async () => {
    for (const id of ['a', 'b', 'c', 'd', 'e']) await earnVerifiedRead(WALLET, id);
    const sixth = await earnVerifiedRead(WALLET, 'f'); // past curve -> 0 CP
    expect(sixth.amountCp).toBe(0);

    const again = await earnVerifiedRead(WALLET, 'f');
    expect(again.idempotentHit).toBe(true); // the 0-CP read is still recorded
  });
});

describe('burn guards', () => {
  it('returns null and writes nothing when the wallet cannot afford the burn', async () => {
    const res = await burnCp(WALLET, 1500, LedgerReason.DELIVERY_FEE_WAIVER, 'order_x');
    expect(res).toBeNull();
    expect(await getBalanceCp(WALLET)).toBe(0); // no negative balance, no phantom entry
  });

  it('rejects non-positive burn costs', async () => {
    await expect(burnCp(WALLET, 0, LedgerReason.CIVIC_PLEDGE, 'c_0')).rejects.toThrow();
  });
});

describe('Φ measurement is observational only (Spec §7)', () => {
  it('computes emitted/burned over the window without throttling anything', async () => {
    await earnGroupBuyReward(WALLET, 'deal_z', 20_000); // mint 1000 CP (20000 * 0.05)
    await burnCp(WALLET, 500, LedgerReason.CIVIC_PLEDGE, 'pledge_1');

    const start = new Date(Date.now() - 3_600_000);
    const { emittedCp, burnedCp, chi } = await measureChi(start);

    expect(emittedCp).toBe(1000);
    expect(burnedCp).toBe(500);
    expect(chi).toBeCloseTo(2.0);
    // No assertion that earning changed — measurement must not modify behavior.
  });
});

// Note on concurrency: the per-wallet advisory lock serializes count-then-award, so two
// different notes verified simultaneously cannot both claim the 1st-read amount. A
// deterministic concurrency test is environment-sensitive; at minimum, assert that firing
// several earnVerifiedRead calls for the SAME note in parallel yields exactly one mint:
describe('concurrent same-note verifies', () => {
  it('parallel duplicates still mint exactly once', async () => {
    await Promise.all([
      earnVerifiedRead(WALLET, 'race_note'),
      earnVerifiedRead(WALLET, 'race_note'),
      earnVerifiedRead(WALLET, 'race_note'),
    ]);
    expect(await getBalanceCp(WALLET)).toBe(300); // one mint, not three
  });
});
