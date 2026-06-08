// lib/cp/__tests__/core.test.ts
//
// Pure unit tests for the CP economy logic. No DB required — runs anywhere.
// (Vitest syntax; trivially portable to Jest.)

import { describe, it, expect } from 'vitest';
import {
  EconConfig,
  verifiedReadAmount,
  clampToCap,
  groupBuyRewardCp,
  computeChi,
} from '../core';

const cfg: EconConfig = {
  verifiedReadCurve: [300, 100, 25, 25, 25],
  dailyContentCapCp: 550,
  dailyTotalEarnCapCp: 2000,
  weeklyTotalEarnCapCp: 8000,
  commerceCpPerCent: 0.05,
  cpToDollarCents: 1,
};

describe('verifiedReadAmount — diminishing curve (Spec §4)', () => {
  it('follows the curve for the 1st..nth read', () => {
    expect(verifiedReadAmount(0, cfg)).toBe(300);
    expect(verifiedReadAmount(1, cfg)).toBe(100);
    expect(verifiedReadAmount(2, cfg)).toBe(25);
    expect(verifiedReadAmount(4, cfg)).toBe(25);
  });
  it('awards 0 past the end of the curve', () => {
    expect(verifiedReadAmount(5, cfg)).toBe(0);
    expect(verifiedReadAmount(99, cfg)).toBe(0);
  });
  it('treats negative counts as 0 (defensive)', () => {
    expect(verifiedReadAmount(-1, cfg)).toBe(0);
  });
});

describe('clampToCap — caps (Spec §5)', () => {
  it('passes the full amount through when well under cap', () => {
    expect(clampToCap(300, 0, 550)).toBe(300);
  });
  it('clamps to the remaining room under the cap', () => {
    expect(clampToCap(300, 400, 550)).toBe(150); // only 150 room left
  });
  it('returns 0 once the cap is reached or exceeded', () => {
    expect(clampToCap(300, 550, 550)).toBe(0);
    expect(clampToCap(300, 700, 550)).toBe(0);
  });
  it('never returns negative and ignores non-positive proposals', () => {
    expect(clampToCap(0, 100, 550)).toBe(0);
    expect(clampToCap(-50, 100, 550)).toBe(0);
  });
});

describe('groupBuyRewardCp — commerce-weighted emission (Spec §6)', () => {
  it('mints floor(capturedCents * rate)', () => {
    // $10.00 = 1000 cents * 0.05 = 50 CP
    expect(groupBuyRewardCp(1000, cfg)).toBe(50);
    // $12.50 = 1250 * 0.05 = 62.5 -> floor 62
    expect(groupBuyRewardCp(1250, cfg)).toBe(62);
  });
  it('mints 0 for non-positive capture', () => {
    expect(groupBuyRewardCp(0, cfg)).toBe(0);
    expect(groupBuyRewardCp(-100, cfg)).toBe(0);
  });
});

describe('computeChi — inflation metric (Spec §7)', () => {
  it('returns emitted/burned', () => {
    expect(computeChi(1100, 1000)).toBeCloseTo(1.1);
  });
  it('returns null when nothing was burned (Φ undefined)', () => {
    expect(computeChi(500, 0)).toBeNull();
  });
});
