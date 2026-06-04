/**
 * CP mutation helper — verification script.
 *
 * Proves three properties:
 *   1. IDEMPOTENCY  — earnCP with the same (userId, reason, referenceId) twice
 *                     increments the balance once; second call returns deduped:true.
 *   2. OVERDRAFT    — burnCP for more than the balance throws InsufficientBalanceError,
 *                     leaves balanceCP unchanged, and writes NO ledger row.
 *   3. HAPPY PATH   — earnCP 100, burnCP 30 → balance 70; two ledger rows;
 *                     reconcileWallet reports drift 0.
 *
 * Run: npx tsx scripts/verify-cp.ts
 */

import { PrismaClient } from '@prisma/client'
import {
  earnCP,
  burnCP,
  reconcileWallet,
  InsufficientBalanceError,
} from '../lib/cp/index'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`  FAIL: ${message}`)
    process.exitCode = 1
  } else {
    console.log(`  PASS: ${message}`)
  }
}

async function createTestUser(tag: string): Promise<string> {
  const user = await prisma.user.create({
    data: {
      email: `verify-cp-${tag}-${Date.now()}@test.local`,
      passwordHash: 'test',
      name: `CP Test ${tag}`,
      role: 'MEMBER',
    },
  })
  return user.id
}

async function getBalance(userId: string): Promise<number> {
  const w = await prisma.wallet.findUnique({ where: { userId } })
  return w?.balanceCP ?? 0
}

async function getLedgerRows(userId: string): Promise<number> {
  const w = await prisma.wallet.findUnique({ where: { userId } })
  if (!w) return 0
  return prisma.walletLedger.count({ where: { walletId: w.id } })
}

// ─── Scenario 1: Idempotency ──────────────────────────────────────────────────

async function testIdempotency(): Promise<void> {
  console.log('\nScenario 1 — Idempotency')
  const userId = await createTestUser('idem')

  const params = {
    userId,
    amount: 50,
    reason: 'signup_bonus' as const,
    referenceId: 'idem-test-ref-001',
  }

  const r1 = await earnCP(params)
  assert(r1.ok === true, 'first earn: ok=true')
  assert(!r1.deduped, 'first earn: deduped=false')
  assert('newBalance' in r1 && r1.newBalance === 50, 'first earn: newBalance=50')

  const r2 = await earnCP(params)   // exact same params
  assert(r2.ok === true, 'second earn (dup): ok=true')
  assert(r2.deduped === true, 'second earn (dup): deduped=true')

  const balance = await getBalance(userId)
  assert(balance === 50, `balance after dup earn is still 50 (got ${balance})`)

  const rows = await getLedgerRows(userId)
  assert(rows === 1, `only 1 ledger row written (got ${rows})`)
}

// ─── Scenario 2: Overdraft protection ─────────────────────────────────────────

async function testOverdraft(): Promise<void> {
  console.log('\nScenario 2 — Overdraft protection')
  const userId = await createTestUser('over')

  // Give the user 40 CP
  await earnCP({
    userId,
    amount: 40,
    reason: 'signup_bonus',
    referenceId: 'over-earn-001',
  })

  const balanceBefore = await getBalance(userId)
  assert(balanceBefore === 40, `balance before overdraft attempt is 40 (got ${balanceBefore})`)
  const rowsBefore = await getLedgerRows(userId)

  let caughtCorrectError = false
  try {
    await burnCP({
      userId,
      amount: 100,   // more than the 40 available
      reason: 'delivery_waiver',
      referenceId: 'over-burn-001',
    })
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      caughtCorrectError = true
    } else {
      throw e
    }
  }

  assert(caughtCorrectError, 'burnCP threw InsufficientBalanceError')

  const balanceAfter = await getBalance(userId)
  assert(
    balanceAfter === 40,
    `balanceCP unchanged after failed burn (got ${balanceAfter})`,
  )

  const rowsAfter = await getLedgerRows(userId)
  assert(
    rowsAfter === rowsBefore,
    `no ledger row written for failed burn (before=${rowsBefore}, after=${rowsAfter})`,
  )
}

// ─── Scenario 3: Happy path + reconcile ───────────────────────────────────────

async function testHappyPath(): Promise<void> {
  console.log('\nScenario 3 — Happy path + reconcile')
  const userId = await createTestUser('happy')

  const earn = await earnCP({
    userId,
    amount: 100,
    reason: 'group_buy_reward',
    referenceId: 'happy-earn-001',
  })
  assert(!earn.deduped && earn.newBalance === 100, `earn 100 → newBalance=100 (got ${JSON.stringify(earn)})`)

  const burn = await burnCP({
    userId,
    amount: 30,
    reason: 'delivery_waiver',
    referenceId: 'happy-burn-001',
  })
  assert(!burn.deduped && burn.newBalance === 70, `burn 30 → newBalance=70 (got ${JSON.stringify(burn)})`)

  const rows = await getLedgerRows(userId)
  assert(rows === 2, `exactly 2 ledger rows (got ${rows})`)

  const rec = await reconcileWallet(userId)
  assert(rec.cached === 70, `cached=70 (got ${rec.cached})`)
  assert(rec.computed === 70, `computed (SUM ledger)=70 (got ${rec.computed})`)
  assert(rec.drift === 0, `drift=0 (got ${rec.drift})`)
}

// ─── Scenario 4: burnCP amount validation ─────────────────────────────────────

async function testInputValidation(): Promise<void> {
  console.log('\nScenario 4 — Input validation (zero / negative / float rejected)')
  const userId = await createTestUser('valid')

  for (const bad of [0, -1, 1.5]) {
    let threw = false
    try {
      await earnCP({ userId, amount: bad, reason: 'signup_bonus', referenceId: 'v1' })
    } catch { threw = true }
    assert(threw, `earnCP(${bad}) throws before any DB work`)

    threw = false
    try {
      await burnCP({ userId, amount: bad, reason: 'delivery_waiver', referenceId: 'v2' })
    } catch { threw = true }
    assert(threw, `burnCP(${bad}) throws before any DB work`)
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────

async function cleanup(): Promise<void> {
  await prisma.user.deleteMany({
    where: { email: { endsWith: '@test.local' } },
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('=== CP mutation helper — verification ===')

  try {
    await testIdempotency()
    await testOverdraft()
    await testHappyPath()
    await testInputValidation()
  } finally {
    await cleanup()
    await prisma.$disconnect()
  }

  if (process.exitCode === 1) {
    console.log('\nResult: FAILED — see FAIL lines above')
  } else {
    console.log('\nResult: ALL PASS')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
