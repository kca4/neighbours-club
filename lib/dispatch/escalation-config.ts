/**
 * lib/dispatch/escalation-config.ts
 *
 * Runtime configuration helpers for the dispatch cron's Uber escalation phase.
 * Pure functions with no external dependencies — kept here so they can be
 * unit-tested without mocking Prisma or Next.js.
 */

/**
 * Whether Phase 1 (PENDING → AWAITING_COURIER escalation) may run.
 *
 * Default: false — the pilot runs on internal couriers only. Unclaimed orders
 * stay on the internal driver feed indefinitely when this is off.
 *
 * Set ENABLE_UBER_ESCALATION=true in production when real Uber Direct is live.
 */
export function isUberEscalationEnabled(): boolean {
  return process.env.ENABLE_UBER_ESCALATION === 'true'
}

/**
 * How long (ms) an unclaimed PENDING/INTERNAL order sits before being
 * escalated to Uber Direct. Reads UBER_ESCALATION_TIMEOUT_MINUTES (integer,
 * minutes); falls back to 3 minutes if unset or unparseable.
 *
 * Only meaningful when isUberEscalationEnabled() returns true.
 */
export function getEscalationTimeoutMs(): number {
  const raw = process.env.UBER_ESCALATION_TIMEOUT_MINUTES
  const minutes = raw !== undefined ? parseInt(raw, 10) : NaN
  return (Number.isFinite(minutes) && minutes >= 1 ? minutes : 3) * 60 * 1000
}
