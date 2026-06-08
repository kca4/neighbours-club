// prisma/seed-econ.ts
//
// Seeds the single `econConfig` row that drives all [TUNABLE] tokenomics values.
// Run once (e.g. `tsx prisma/seed-econ.ts`) or fold into your main seed script.
//
// EVERY value here is a PLACEHOLDER from CP Tokenomics Spec v2 — they are starting points to
// calibrate against live Φ, NOT final business decisions. The one to set deliberately before
// anything real touches money is `cpToDollarCents` (the disclosed CP→$ rate, Spec §13).

import { prisma } from '@/lib/prisma'; // adjust

const econConfig = {
  // Diminishing content faucet (Spec §4): CP for the 1st, 2nd, 3rd... read in a 24h window.
  verifiedReadCurve: [300, 100, 25, 25, 25],
  // Caps (Spec §5)
  dailyContentCapCp: 550,
  dailyTotalEarnCapCp: 2000,
  weeklyTotalEarnCapCp: 8000,
  // Commerce emission (Spec §6): CP minted per cent captured. 0.05 = 5 CP per $1.
  commerceCpPerCent: 0.05,
  // Disclosed CP→$ rate in cents per CP (Spec §8, §10). 1 = 1 CP worth $0.01. SET DELIBERATELY.
  cpToDollarCents: 1,
};

async function main() {
  await prisma.econParam.upsert({
    where: { key: 'econConfig' },
    create: { key: 'econConfig', valueJson: econConfig },
    update: { valueJson: econConfig },
  });
  console.log('Seeded econConfig:', econConfig);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
