/**
 * lib/cp/econ-params.ts — Server-side accessor for EconParam config rows.
 *
 * ALL [TUNABLE] tokenomics values live in the `econ_params` DB table so they
 * can be changed without a redeploy. This module is the ONLY sanctioned way to
 * read them in application code.
 *
 * Design invariants:
 *  - `import 'server-only'` prevents this module from being bundled client-side.
 *  - `EconParamKey` is a CLOSED union — add new keys here deliberately; never
 *    pass raw strings.
 *  - Every key has an in-code fallback equal to the seeded pilot value so a
 *    missing row degrades gracefully rather than crashing.
 *  - No caching — config table is tiny; a direct read per call avoids stale
 *    values during the pilot calibration phase.
 */
import 'server-only'

import { prisma } from '@/lib/prisma'

// ─── Key vocabulary ───────────────────────────────────────────────────────────

/** Closed set of valid EconParam keys. Add new keys here when deliberately
 *  extending the economy config — never pass raw strings. */
export type EconParamKey =
  | 'content_faucet_read_1'
  | 'content_faucet_read_2'
  | 'content_faucet_read_3to5'
  | 'content_faucet_daily_cap'
  | 'daily_total_earn_cap'
  | 'weekly_total_earn_cap'
  | 'phi_target_low'
  | 'phi_target_high'
  | 'phi_alarm_threshold'
  | 'cap_reset_timezone'
  | 'note_high_risk_threshold'
  // Deliberately added once $0.01/CP was a committed decision, not a
  // placeholder. Previously withheld so no code could read a draft rate.
  | 'cp_to_dollar_rate'

// ─── In-code fallbacks ────────────────────────────────────────────────────────

/** Pilot defaults — identical to the seeded values in prisma/seed-econ.ts.
 *  Used when a row is missing so callers degrade gracefully. */
const FALLBACKS: Record<EconParamKey, string> = {
  content_faucet_read_1:    '50',
  content_faucet_read_2:    '16',
  content_faucet_read_3to5: '4',
  content_faucet_daily_cap: '92',
  daily_total_earn_cap:     '325',
  weekly_total_earn_cap:    '1300',
  phi_target_low:           '0.9',
  phi_target_high:          '1.1',
  phi_alarm_threshold:      '1.15',
  cap_reset_timezone:       'America/Toronto',
  note_high_risk_threshold: '5',
  // $0.01/CP — committed rate; fallback is intentional, not a placeholder.
  cp_to_dollar_rate:        '1',
}

// ─── Accessor ─────────────────────────────────────────────────────────────────

/**
 * Read a single EconParam by key.
 *
 * Returns the DB value if the row exists, otherwise the in-code fallback.
 * Numeric keys return a number; `cap_reset_timezone` returns a string.
 */
export async function getEconParam(key: EconParamKey): Promise<number | string> {
  const row = await prisma.econParam.findUnique({ where: { key } })
  const raw = row?.value ?? FALLBACKS[key]
  // cap_reset_timezone is the only string param; everything else is numeric.
  if (key === 'cap_reset_timezone') return raw
  const n = Number(raw)
  if (!Number.isFinite(n)) {
    // Corrupted DB value — fall back to the safe default rather than NaN.
    return Number(FALLBACKS[key])
  }
  return n
}

/**
 * Read all 10 EconParam keys in a single query and return them as a typed
 * record. Use this when the caller needs several params (avoids N round-trips).
 */
export async function getAllEconParams(): Promise<Record<EconParamKey, number | string>> {
  const rows = await prisma.econParam.findMany()
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  const keys = Object.keys(FALLBACKS) as EconParamKey[]
  const result = {} as Record<EconParamKey, number | string>

  for (const key of keys) {
    const raw = (byKey[key] as string | undefined) ?? FALLBACKS[key]
    if (key === 'cap_reset_timezone') {
      result[key] = raw
    } else {
      const n = Number(raw)
      result[key] = Number.isFinite(n) ? n : Number(FALLBACKS[key])
    }
  }

  return result
}
