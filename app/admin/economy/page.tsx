/**
 * Admin — CP Economy Φ Monitor
 *
 * Pilot solvency dashboard. Auth is enforced by app/admin/layout.tsx (ADMIN
 * role check + redirect) — no per-page auth needed.
 *
 * MEASUREMENT ONLY. The throttle is NOT active (Spec §13 #4). Every status
 * label on this page is a display-only signal; nothing here modifies any
 * faucet, balance, or ledger row.
 */
import type { Metadata } from 'next'
import { measurePhi } from '@/lib/cp'
import { getAllEconParams } from '@/lib/cp/econ-params'

export const metadata: Metadata = { title: 'Economy' }

type PhiStatus = 'healthy' | 'above_target' | 'alarm' | 'undefined'

function getStatus(
  phi: number | null,
  low: number,
  high: number,
  alarm: number,
): PhiStatus {
  if (phi === null) return 'undefined'
  if (phi >= alarm) return 'alarm'
  if (phi > high) return 'above_target'
  return 'healthy'
}

const STATUS_CONFIG: Record<PhiStatus, { label: string; classes: string }> = {
  healthy:      { label: 'Healthy',       classes: 'bg-green-100 text-green-800' },
  above_target: { label: 'Above target',  classes: 'bg-amber-100 text-amber-800' },
  alarm:        { label: 'Alarm',         classes: 'bg-red-100 text-red-700' },
  undefined:    { label: 'No burns yet — Φ undefined', classes: 'bg-gray-100 text-gray-600' },
}

function fmtPhi(n: number | null): string {
  return n === null ? '—' : n.toFixed(3)
}

function fmtCp(n: number): string {
  return n.toLocaleString('en-CA') + ' CP'
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Toronto',
  })
}

export default async function EconomyAdminPage() {
  const [m, cfg] = await Promise.all([measurePhi(), getAllEconParams()])

  const low   = cfg.phi_target_low      as number
  const high  = cfg.phi_target_high     as number
  const alarm = cfg.phi_alarm_threshold as number

  // Status is derived from structuralPhi — the primary signal.
  const status = getStatus(m.structuralPhi, low, high, alarm)
  const { label, classes } = STATUS_CONFIG[status]

  // How much of the raw emitted total was admin adjustments?
  const adminAdjustmentTotal = Math.max(0, m.emitted - m.structuralEmitted)

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <p className="text-xs text-foreground/40">Admin / Economy</p>
        <h1 className="text-2xl font-bold text-foreground">CP Economy — Φ Monitor</h1>
        <p className="mt-1 text-sm text-foreground/50">
          Rolling {m.windowDays}-day window ·{' '}
          {fmtDate(m.windowStart)} → {fmtDate(m.windowEnd)}
        </p>
      </div>

      {/* Throttle banner — must be prominent */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-semibold text-amber-800">
          Throttle is NOT active — measurement only (Spec §13 #4)
        </p>
        <p className="mt-0.5 text-xs text-amber-700">
          Status labels below are display-only signals. No faucet is being modified.
          The governor will remain in observe-only mode until Φ history is calibrated
          and §13 #4 is explicitly actioned.
        </p>
      </div>

      {/* ── Structural Φ (primary) ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-foreground">Structural Φ</h2>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
          >
            {label}
          </span>
          <span className="text-xs text-foreground/40">
            primary signal — excludes admin adjustments (manual_grant and similar)
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="text-3xl font-bold text-foreground">{fmtPhi(m.structuralPhi)}</p>
            <p className="text-sm text-foreground/60">Structural Φ</p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="text-3xl font-bold text-foreground">
              {m.structuralEmitted.toLocaleString('en-CA')}
            </p>
            <p className="text-sm text-foreground/60">Real faucet emitted (CP)</p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="text-3xl font-bold text-foreground">
              {m.burned.toLocaleString('en-CA')}
            </p>
            <p className="text-sm text-foreground/60">Burned (CP)</p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="text-3xl font-bold text-foreground">
              {adminAdjustmentTotal.toLocaleString('en-CA')}
            </p>
            <p className="text-sm text-foreground/60">Admin adjustments excluded</p>
          </div>
        </div>
      </section>

      {/* ── Raw Φ (secondary — for reconciliation) ────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-foreground/60">Raw Φ</h2>
          <span className="text-xs text-foreground/40">
            secondary — all ledger entries including admin adjustments; for reconciliation only
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.01] p-4">
            <p className="text-2xl font-bold text-foreground/60">{fmtPhi(m.phi)}</p>
            <p className="text-sm text-foreground/50">Raw Φ (all reasons)</p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.01] p-4">
            <p className="text-2xl font-bold text-foreground/60">
              {m.emitted.toLocaleString('en-CA')}
            </p>
            <p className="text-sm text-foreground/50">Total emitted incl. manual_grant (CP)</p>
          </div>
          {adminAdjustmentTotal > 0 && (
            <div className="rounded-xl border border-foreground/10 bg-foreground/[0.01] p-4">
              <p className="text-2xl font-bold text-foreground/60">
                {fmtCp(adminAdjustmentTotal)}
              </p>
              <p className="text-sm text-foreground/50">
                Gap: raw − structural (admin grants in window)
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Target band & thresholds ───────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-foreground">Target band (EconParam)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-2xl font-bold text-green-800">{low}–{high}</p>
            <p className="text-sm text-green-700">Healthy band (phi_target_low – phi_target_high)</p>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-2xl font-bold text-red-700">≥ {alarm}</p>
            <p className="text-sm text-red-600">
              Alarm threshold (phi_alarm_threshold) — throttle would engage here if active
            </p>
          </div>
          <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4">
            <p className="text-2xl font-bold text-foreground">{m.windowDays}d rolling</p>
            <p className="text-sm text-foreground/60">Measurement window (America/Toronto)</p>
          </div>
        </div>
        <p className="text-xs text-foreground/40">
          All [TUNABLE] values are in the <code>econ_params</code> table and can be
          adjusted without a redeploy. Throttle activation requires explicit action on
          Spec §13 #4.
        </p>
      </section>

    </div>
  )
}
