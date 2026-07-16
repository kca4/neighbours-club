/**
 * scripts/seed-prod-econ.ts
 *
 * Production-safe seed for the EconParam table.
 *
 * Seeds ONLY the 12 economy-config rows — no users, no test data.
 * Every upsert is idempotent: safe to re-run at any time without
 * double-writing or changing values that were manually tuned in the DB.
 *
 * Usage (pass the target DB URL explicitly):
 *
 *   DATABASE_URL="postgresql://..." npx tsx scripts/seed-prod-econ.ts
 *
 * The script refuses to run if DATABASE_URL is unset or points to localhost,
 * so it cannot accidentally corrupt a dev database.
 *
 * Values here MUST match the FALLBACKS in lib/cp/econ-params.ts.
 * If you tune a value in production via a DB client, you do NOT need
 * to re-run this script — the live DB row takes precedence over fallbacks.
 */

import { PrismaClient } from "@prisma/client";

// ─── Safety guard ─────────────────────────────────────────────────────────────

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(
    "ERROR: DATABASE_URL is not set.\n" +
      "Pass it explicitly: DATABASE_URL=\"postgresql://...\" npx tsx scripts/seed-prod-econ.ts",
  );
  process.exit(1);
}

if (dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")) {
  console.error(
    "ERROR: DATABASE_URL points to localhost.\n" +
      "This script is for production databases only.\n" +
      "To seed a local dev DB, use: npm run db:seed",
  );
  process.exit(1);
}

// ─── Pilot EconParam values ───────────────────────────────────────────────────
//
// These are the 12 keys read by lib/cp/econ-params.ts (EconParamKey union).
// They match the FALLBACKS constant in that file exactly.
// The `description` field is for human operators reading the DB directly.

const ECON_PARAMS: Array<{ key: string; value: string; description: string }> =
  [
    // Content faucet curve (Spec §4) — CP earned per verified Note read in a rolling window
    {
      key: "content_faucet_read_1",
      value: "100",
      description: "CP earned on the 1st verified Note read in the daily window",
    },
    {
      key: "content_faucet_read_2",
      value: "33",
      description:
        "CP earned on the 2nd verified Note read in the daily window",
    },
    {
      key: "content_faucet_read_3to5",
      value: "8",
      description:
        "CP earned on the 3rd–5th verified Note reads in the daily window",
    },
    // Per-faucet daily cap (Spec §5)
    {
      key: "content_faucet_daily_cap",
      value: "185",
      description:
        "Maximum CP a member can earn from verified reads in one calendar day (Toronto time)",
    },
    // Total earn backstops (Spec §5) — apply across all faucets combined
    {
      key: "daily_total_earn_cap",
      value: "650",
      description:
        "Maximum CP a member can earn from any source in one calendar day (Toronto time)",
    },
    {
      key: "weekly_total_earn_cap",
      value: "2600",
      description:
        "Maximum CP a member can earn from any source in one calendar week (Toronto time)",
    },
    // Φ inflation governor thresholds (Spec §7) — measurement only; throttle not active
    {
      key: "phi_target_low",
      value: "0.9",
      description:
        "Φ lower healthy bound (emitted/burned ratio); below this = deflationary",
    },
    {
      key: "phi_target_high",
      value: "1.1",
      description:
        "Φ upper healthy bound (emitted/burned ratio); above this = inflationary",
    },
    {
      key: "phi_alarm_threshold",
      value: "1.15",
      description:
        "Φ alarm level; throttle would engage here if active (currently measurement-only)",
    },
    // Cap windowing
    {
      key: "cap_reset_timezone",
      value: "America/Toronto",
      description:
        "Timezone for daily/weekly cap resets (IANA name; matches pilot audience)",
    },
    // Notes risk gate
    {
      key: "note_high_risk_threshold",
      value: "5",
      description:
        "ProcessedNote.riskScore at or above this value blocks auto-publish (requires admin review)",
    },
    // Disclosed CP→$ rate (Spec §8, §10) — committed at $0.01/CP
    {
      key: "cp_to_dollar_rate",
      value: "1",
      description:
        "Disclosed CP-to-dollar rate: 1 unit = $0.01 CAD. Committed rate; do not change without member disclosure.",
    },
  ];

// ─── Seed ─────────────────────────────────────────────────────────────────────

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl } },
});

async function main() {
  console.log(`Seeding EconParam rows → ${dbUrl!.replace(/:[^:@]+@/, ":***@")}`);
  console.log(`${ECON_PARAMS.length} rows to upsert (idempotent)\n`);

  for (const param of ECON_PARAMS) {
    await prisma.econParam.upsert({
      where: { key: param.key },
      create: param,
      update: { description: param.description },
      // NOTE: `update` intentionally does NOT overwrite `value`.
      // If an operator has manually tuned a value in prod, re-running this
      // script will NOT reset it — only the description is refreshed.
    });
    console.log(`  ✓ ${param.key} = ${param.value}  (${param.description})`);
  }

  console.log(`\nDone. ${ECON_PARAMS.length} EconParam rows are present.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
