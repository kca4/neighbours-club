/**
 * app/api/dispatch/cron-sweep/route.ts
 *
 * Thin route handler — authenticates the request, then delegates to
 * lib/dispatch/sweep.ts (the testable core logic).
 *
 * ─── Sweep phases ─────────────────────────────────────────────────────────────
 * See lib/dispatch/sweep.ts for the full phase descriptions.
 *
 * Phase 1 — INTERNAL TIMEOUT → UBER FALLBACK  [gated: ENABLE_UBER_ESCALATION]
 * Phase 2 — SIMULATED UBER COURIER ASSIGNMENT [gated: USE_SHIPPING_STUB=true]
 * Phase 3 — UBER STUB AUTO-COMPLETION         [gated: USE_SHIPPING_STUB=true]
 *
 * ─── LOCAL TESTING ────────────────────────────────────────────────────────────
 * 1. Start the dev server:  npm run dev
 * 2. Run a sweep:           npm run dispatch:sweep
 *    (sends: curl -s -H "Authorization: Bearer $CRON_SECRET" \
 *                 http://localhost:3000/api/dispatch/cron-sweep)
 *
 *    Or hit it in the browser with a query param:
 *    http://localhost:3000/api/dispatch/cron-sweep?secret=<your-CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shippingAdapter } from '@/lib/shipping/uberAdapter'
import { runSweep } from '@/lib/dispatch/sweep'

export const dynamic = 'force-dynamic'

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[dispatch-sweep] CRON_SECRET is not set — rejecting all requests')
    return false
  }

  // Vercel Cron sends:  Authorization: Bearer <secret>
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  // Manual browser testing convenience:  ?secret=<secret>
  const querySecret = new URL(req.url).searchParams.get('secret')
  if (querySecret === secret) return true

  return false
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runSweep({ prisma, shippingAdapter })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[dispatch-sweep] Unhandled error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
