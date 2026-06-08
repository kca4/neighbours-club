// app/api/cron/close-deals/route.ts
//
// Vercel Cron entry point. Schedule every 5 minutes in vercel.json:
//   { "crons": [{ "path": "/api/cron/close-deals", "schedule": "*/5 * * * *" }] }
//
// Vercel sends `Authorization: Bearer <CRON_SECRET>` — verify it so the endpoint can't be
// triggered by the public. Settlement itself is idempotent (see settle.ts), so an accidental
// double-fire is harmless, but we still gate access.

import { NextResponse } from 'next/server';
import { settleDueDeals } from '@/lib/groupbuy/settle';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // allow the batch room; tune to your plan

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const results = await settleDueDeals();
    return NextResponse.json({ ok: true, settled: results.length, results });
  } catch (err) {
    // Let Vercel record a failure so the next 5-min tick retries; settlement is idempotent.
    console.error('close-deals cron failed', err);
    return new NextResponse('Settlement error', { status: 500 });
  }
}
