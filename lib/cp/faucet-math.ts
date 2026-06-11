/**
 * lib/cp/faucet-math.ts — Pure CP economy math.
 *
 * No database calls, no `server-only` guard. Extracted so that:
 *  1. Unit tests can import and run without mocking Prisma or Next.js.
 *  2. earnVerifiedReadCP (content-faucet.ts) keeps its DB logic separate
 *     from the economic formulas.
 *
 * Do NOT import from `@/lib/prisma` or `server-only` here — this file
 * must remain importable from plain Node test runners.
 */

/**
 * Returns the CP amount for the n-th verified_read by this user today,
 * where n is a 0-based index equal to the COUNT of verified_read ledger
 * rows already committed for this wallet today, BEFORE the new row is
 * inserted.
 *
 * n=0 → 1st read today → curve[0]   (pilot: 300)
 * n=1 → 2nd read today → curve[1]   (pilot: 100)
 * n=2 → 3rd read today → curve[2]   (pilot:  25)
 * n=3 → 4th read today → curve[3]   (pilot:  25)
 * n=4 → 5th read today → curve[4]   (pilot:  25) ← last paid
 * n≥5 → 6th+ read      → 0          ← first unpaid; row is still written
 */
export function contentFaucetAmount(n: number, curve: number[]): number {
  if (n < 0 || n >= curve.length) return 0
  return curve[n] ?? 0
}

/**
 * Returns the UTC instant that corresponds to midnight (00:00:00) in the
 * given IANA timezone, for the local calendar day that `now` falls in.
 *
 * Algorithm — probe-then-correct, DST-safe:
 *  1. Determine today's local date (YYYY-MM-DD) in `tz` using Intl.
 *  2. Create `probe` = UTC midnight of that calendar date.
 *  3. Format `probe` in `tz` to read back the local time h:m:s.
 *     Intl applies the UTC offset actually in effect at `probe`, so
 *     spring-forward and fall-back transitions are handled correctly.
 *  4. Derive the UTC offset from h:m:s and correct `probe` to true local
 *     midnight.
 *
 * Offset convention:
 *   West of UTC (e.g. UTC-5, Toronto winter): probe (midnight UTC) reads
 *   as ~19:00 local. probeSeconds > 43200 → negative UTC offset.
 *   East of UTC (e.g. UTC+5): probe reads as ~05:00 local. probeSeconds
 *   ≤ 43200 → positive UTC offset.
 *   Result = probe − offsetSeconds × 1000 in both cases.
 *
 * Midnight is never in a skipped/repeated hour for America/Toronto:
 * spring-forward and fall-back both happen at 2am, so midnight is always
 * a valid and unambiguous instant in this timezone.
 *
 * Assumption: UTC offset magnitude ≤ 11h (true for all populated IANA
 * zones). The ±12h boundary is ambiguous from `h` alone but does not
 * affect America/Toronto (UTC-5/UTC-4).
 */
export function getMidnightUTC(tz: string, now: Date = new Date()): Date {
  // Step 1 — local calendar date in `tz`.
  // en-CA gives unambiguous YYYY-MM-DD ordering.
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year  = Number(dateParts.find((p) => p.type === 'year')!.value)
  const month = Number(dateParts.find((p) => p.type === 'month')!.value) - 1
  const day   = Number(dateParts.find((p) => p.type === 'day')!.value)

  // Step 2 — probe: UTC midnight on this local calendar date.
  const probe = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))

  // Step 3 — what local time does the probe represent in `tz`?
  // en-GB + hour12:false guarantees 24-hour format (00–23).
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(probe)

  const rawH = Number(timeParts.find((p) => p.type === 'hour')!.value)
  const h = rawH === 24 ? 0 : rawH   // normalise '24' (rare platform quirk) → 0
  const m = Number(timeParts.find((p) => p.type === 'minute')!.value)
  const s = Number(timeParts.find((p) => p.type === 'second')!.value)

  // Step 4 — derive UTC offset and correct probe to true local midnight.
  //   probeSeconds > 12h  → west of UTC  → offsetSeconds is negative
  //   probeSeconds ≤ 12h  → east of UTC  → offsetSeconds is positive (or 0)
  //   local midnight UTC = probe − offsetSeconds × 1000
  const probeSeconds = h * 3600 + m * 60 + s
  const offsetSeconds = probeSeconds > 12 * 3600
    ? probeSeconds - 86_400   // west: subtract to yield a negative offset
    : probeSeconds             // east or UTC

  return new Date(probe.getTime() - offsetSeconds * 1000)
}

/**
 * Returns the UTC instant for midnight of the most recent Monday
 * (ISO week start) in the given IANA timezone containing `now`.
 *
 * Week boundary: Monday 00:00:00 local time — a deliberate product decision
 * so weekly caps reset at Monday midnight Toronto time, consistent with the
 * daily cap reset (also midnight Toronto, not midnight UTC).
 */
export function getWeekStartUTC(tz: string, now: Date = new Date()): Date {
  const weekdayStr = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(now)

  // Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayStr)
  const daysBack = (dayIndex - 1 + 7) % 7   // 0 if today is Monday

  // Subtract whole days to land approximately on Monday, then re-derive
  // midnight precisely via getMidnightUTC (corrects for any DST offset
  // difference between today and Monday).
  const mondayAnchor = new Date(now.getTime() - daysBack * 86_400_000)
  return getMidnightUTC(tz, mondayAnchor)
}

/**
 * Clamps a proposed CP award against a remaining cap budget.
 *
 * Returns 0 if the budget is exhausted or the proposal is ≤ 0.
 * Never throws — callers log clamping events; this function is pure.
 */
export function clampToCap(proposed: number, alreadyEarned: number, cap: number): number {
  if (proposed <= 0) return 0
  const remaining = Math.max(0, cap - alreadyEarned)
  return Math.min(proposed, remaining)
}

// ─── Administrative adjustment reasons (Φ exclusion set) ─────────────────────
//
// Ledger `reason` values in this set are EXCLUDED from the structural Φ
// emitted sum. They represent administrative adjustments — support grants,
// test grants, goodwill credits, reversals — rather than real faucet activity.
//
// MAINTENANCE: when you add a new `CPReason` that is an administrative
// adjustment (not a real platform faucet), add it here. Failing to do so
// silently inflates structural Φ and may produce false inflation alarms.
//
// What belongs here: emit events that are NOT user-earned faucets.
// What does NOT belong: verified_read, group_buy_reward, referral_verified,
// merchant_bounty — these are real economic events and must stay in
// structural Φ.
export const ADMIN_ADJUSTMENT_REASONS = new Set<string>([
  'manual_grant', // dev/admin one-off grant (scripts, admin console, test setup)
])

// ─── Φ (phi) inflation metric ─────────────────────────────────────────────────

/**
 * Default rolling window length for Φ measurement.
 *
 * This is an OPEN DECISION (Spec §13 #2). The value 7 is the Phase 1 pilot
 * starting point. When live Φ history informs a better window, promote this
 * to an EconParam key in one commit. Do NOT add the key speculatively before
 * observing real data.
 */
export const PHI_DEFAULT_WINDOW_DAYS = 7

/**
 * Φ = Σ emitted / Σ burned — the CP inflation metric from Spec §7.
 *
 * Pure function: no DB calls, no side effects, no globals mutated.
 * The DB-facing measurePhi (lib/cp/phi.ts) calls this after aggregating
 * the ledger sums — computation and I/O are deliberately separated.
 *
 * Return values:
 *   null when burned === 0  — Φ is mathematically undefined (no burns yet).
 *                             Never returns Infinity or throws.
 *   0    when emitted === 0 — fully deflationary window; valid, expected in
 *                             early launch before commerce faucets fire.
 *   >0   normal case        — healthy band is [phi_target_low, phi_target_high].
 */
export function computePhi(emitted: number, burned: number): number | null {
  if (burned === 0) return null
  return emitted / burned
}
