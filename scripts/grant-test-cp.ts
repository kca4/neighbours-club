/**
 * DEV-ONLY — Grant CP to a user by email.
 *
 * Calls earnCP so the wallet ledger and balanceCP stay consistent (no drift).
 * The referenceId includes a timestamp so repeated runs always produce a new
 * ledger row rather than being silently deduped.
 *
 * Usage:
 *   npx tsx scripts/grant-test-cp.ts [email] [amount]
 *
 * Defaults:
 *   email  → customer@test.dev
 *   amount → 2000
 *
 * Examples:
 *   npx tsx scripts/grant-test-cp.ts
 *   npx tsx scripts/grant-test-cp.ts customer@test.dev 1500
 *   npx tsx scripts/grant-test-cp.ts admin@neighboursclub.test 5000
 */

if (process.env.NODE_ENV === 'production') {
  console.error('This script must not be run in production.')
  process.exit(1)
}

import { PrismaClient } from '@prisma/client'
import { earnCP } from '../lib/cp/core'

const prisma = new PrismaClient()

const email  = process.argv[2] ?? 'customer@test.dev'
const amount = parseInt(process.argv[3] ?? '2000', 10)

if (!Number.isInteger(amount) || amount <= 0) {
  console.error(`Invalid amount: "${process.argv[3]}" — must be a positive integer.`)
  process.exit(1)
}

async function main(): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    console.error(`No user found with email: ${email}`)
    process.exit(1)
  }

  // Timestamp-based referenceId so each script run creates a fresh ledger row.
  const referenceId = `manual_test_grant:${Date.now()}`

  console.log(`Granting ${amount} CP to ${user.name} <${user.email}>…`)

  const result = await earnCP({
    userId: user.id,
    amount,
    reason: 'manual_grant',
    referenceId,
  })

  if (result.deduped) {
    // Shouldn't happen with a timestamp referenceId, but handle it cleanly.
    console.log('No-op: this grant was already recorded (deduped).')
  } else {
    console.log(`Done. New balance: ${result.newBalance} CP  (referenceId: ${referenceId})`)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
