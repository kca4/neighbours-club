/**
 * prisma/seed-econ.ts
 *
 * Seeds all [TUNABLE] EconParam rows for the CP token economy (Phase 1).
 * Idempotent: upserts by key so it is safe to re-run after tuning.
 *
 * Values are PILOT STARTING POINTS from CP Tokenomics Spec v2 — not final
 * business decisions. Calibrate against live Φ once a node is running.
 *
 * cp_to_dollar_rate is deliberately included here. It was withheld during the
 * tokenomics phase so no code could read a placeholder rate. That stance was
 * correct then; its reversal is correct now — $0.01/CP is a committed business
 * decision, not a placeholder (see commit message for full rationale).
 *
 * Run: npx tsx prisma/seed-econ.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const params: Array<{ key: string; value: string; description: string }> = [
  // ── Content faucet (rescaled to $0.01/CP; real dollar cost invariant held) ──
  // Curve sums to 157 CP/day max (100+33+8+8+8). Floor-rounding errs toward
  // less emission, which favours solvency over generosity.
  {
    key: 'content_faucet_read_1',
    value: '100',
    description: 'CP awarded for the 1st verified_read in the rolling 24h window per user',
  },
  {
    key: 'content_faucet_read_2',
    value: '33',
    description: 'CP awarded for the 2nd verified_read in the rolling 24h window per user',
  },
  {
    key: 'content_faucet_read_3to5',
    value: '8',
    description: 'CP awarded for the 3rd–5th verified_reads in the rolling 24h window per user (each)',
  },
  {
    key: 'content_faucet_daily_cap',
    value: '185',
    description: 'Hard daily CP cap from the content faucet alone per user (Spec §4)',
  },
  {
    key: 'daily_total_earn_cap',
    value: '650',
    description: 'Hard daily CP cap across ALL faucets per user — backstop against bugs/abuse (Spec §5)',
  },
  {
    key: 'weekly_total_earn_cap',
    value: '2600',
    description: 'Hard weekly CP cap across ALL faucets per user (Spec §5)',
  },
  // ── Disclosed CP→$ rate ───────────────────────────────────────────────────
  // 1 cent per CP = $0.01/CP. Committed business decision; in-code fallback
  // is intentional (not a placeholder). Units: cents per CP (integer).
  {
    key: 'cp_to_dollar_rate',
    value: '1',
    description: 'Disclosed CP→$ rate in cents per CP. 1 = $0.01/CP. Committed rate — not a pilot placeholder.',
  },
  {
    key: 'phi_target_low',
    value: '0.9',
    description: 'Φ lower bound of the healthy inflation band; below this CP is too deflationary (Spec §7)',
  },
  {
    key: 'phi_target_high',
    value: '1.1',
    description: 'Φ upper bound of the healthy inflation band (Spec §7)',
  },
  {
    key: 'phi_alarm_threshold',
    value: '1.15',
    description: 'Φ level at which the future throttle engages; measurement-only in Phase 1 (Spec §7)',
  },
  {
    key: 'cap_reset_timezone',
    value: 'America/Toronto',
    description: 'Timezone used for daily and weekly cap window resets (Spec §13 #5)',
  },
  {
    key: 'note_high_risk_threshold',
    value: '5',
    description: '[TUNABLE] riskScore >= this value is HIGH-risk; ingest cron sets BLOCKED_NEEDS_FRAMEWORK instead of DRAFT (pilot gate, Notes Editorial Governance Spec)',
  },
]

async function main() {
  console.log('Seeding EconParam rows…')
  for (const param of params) {
    await prisma.econParam.upsert({
      where: { key: param.key },
      create: param,
      update: { value: param.value, description: param.description },
    })
    console.log(`  upserted: ${param.key} = ${param.value}`)
  }
  console.log(`Done — ${params.length} rows seeded.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
