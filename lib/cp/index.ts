/**
 * lib/cp — Community Points mutation helpers (app-facing entry point).
 *
 * THIS IS THE ONLY SANCTIONED WAY TO MOVE CP IN APPLICATION CODE.
 *
 * The 'server-only' import below causes a build error if this module is
 * ever imported from a client component or a plain browser bundle. All
 * application code (routes, server actions, server components, cron handlers)
 * must import from here.
 *
 * The actual implementations live in lib/cp/core.ts, which omits the guard
 * so that trusted server-side scripts (e.g. scripts/grant-test-cp.ts) can
 * import the logic directly via tsx without triggering the Next.js guard.
 * Scripts must never be bundled into the application.
 */
import 'server-only'

export {
  getOrCreateWallet,
  earnCP,
  burnCP,
  reconcileWallet,
} from './core'

export { earnVerifiedReadCP } from './content-faucet'

export type {
  CPReason,
  CPResult,
  EarnCPParams,
  BurnCPParams,
  ReconcileResult,
} from './types'

export { InsufficientBalanceError } from './types'
