/**
 * DEV-ONLY — GET /api/dev/phi
 *
 * Returns the current Φ (phi) inflation metric for the CP economy, along
 * with the total emitted, total burned, measurement window, and the healthy
 * band + alarm threshold from EconParam.
 *
 * FOR HUMAN EYES ONLY. This route is the instrument, not the action:
 *  - It reads and reports. It does NOT throttle any faucet.
 *  - The status field is a display label. It triggers no automatic behavior.
 *  - The throttle stays unbuilt until Spec §13 #4 is explicitly actioned.
 *
 * Refuses to run outside development (NODE_ENV !== 'development').
 *
 * Usage:
 *   curl http://localhost:3000/api/dev/phi | python -m json.tool
 *   curl "http://localhost:3000/api/dev/phi?days=14"   ← custom window
 */
import { NextRequest, NextResponse } from 'next/server'
import { measurePhi } from '@/lib/cp'
import { getAllEconParams } from '@/lib/cp/econ-params'

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Optional ?days= query param to override the default 7-day window.
  const rawDays = req.nextUrl.searchParams.get('days')
  const windowDays = rawDays ? Math.max(1, Math.floor(Number(rawDays))) : undefined

  // Fetch Φ measurement and EconParam band in parallel — both are read-only.
  const [measurement, cfg] = await Promise.all([
    measurePhi({ windowDays }),
    getAllEconParams(),
  ])

  const phiLow   = cfg.phi_target_low       as number
  const phiHigh  = cfg.phi_target_high      as number
  const phiAlarm = cfg.phi_alarm_threshold  as number

  // Human-readable status — display only, no behavior attached.
  //   undefined   → no burns yet; Φ cannot be computed
  //   healthy     → Φ within [phi_target_low, phi_target_high]
  //   above_target → Φ above the healthy band but below alarm
  //   alarm       → Φ at or above phi_alarm_threshold (throttle would engage
  //                  once built; for now this is an observation only)
  let status: 'healthy' | 'above_target' | 'alarm' | 'undefined'
  if (measurement.phi === null) {
    status = 'undefined'
  } else if (measurement.phi >= phiAlarm) {
    status = 'alarm'
  } else if (measurement.phi > phiHigh) {
    status = 'above_target'
  } else {
    status = 'healthy'
  }

  return NextResponse.json({
    phi:        measurement.phi,
    emitted:    measurement.emitted,
    burned:     measurement.burned,
    windowDays: measurement.windowDays,
    windowStart: measurement.windowStart.toISOString(),
    windowEnd:   measurement.windowEnd.toISOString(),
    band: {
      low:   phiLow,
      high:  phiHigh,
      alarm: phiAlarm,
    },
    status,
    _note: 'Throttle is NOT active. status is a display label only (Spec §13 #4).',
  })
}
