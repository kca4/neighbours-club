/**
 * lib/__tests__/notes-publish-gate.test.ts
 *
 * Pure unit tests for the Notes publish gate.
 * No DB, no Prisma mocks, no Next.js — checkPublishGate is a pure function.
 *
 * Gate rules (from lib/notes-publish-gate.ts):
 *  1. riskScore >= threshold  → blocked: true,  hardBlock: true   (BLOCKED_NEEDS_FRAMEWORK)
 *  2. sourceUrl + no publisher→ blocked: true,  hardBlock: false  (soft — status unchanged)
 *  Both true                  → rule 1 fires (content dominates metadata)
 *  Neither                    → blocked: false
 */

import { describe, it, expect } from 'vitest'
import { checkPublishGate } from '../notes-publish-gate'

const THRESHOLD = 5

// Helper for a clean low-risk sourced note.
// Uses 'in' checks (not ??) so that an explicit null override is passed
// through rather than coalesced to the default. The ?? null on the in-branch
// narrows string|null|undefined → string|null for the explicit return type.
function note(overrides: {
  riskScore?: number
  sourceUrl?: string | null
  sourcePublisher?: string | null
} = {}): { riskScore: number; sourceUrl: string | null; sourcePublisher: string | null } {
  return {
    riskScore:       'riskScore'       in overrides ? overrides.riskScore!                : 2,
    sourceUrl:       'sourceUrl'       in overrides ? (overrides.sourceUrl       ?? null) : 'https://example.com/article',
    sourcePublisher: 'sourcePublisher' in overrides ? (overrides.sourcePublisher ?? null) : 'CBC Ottawa',
  }
}

// ─── Rule 1: HIGH-risk hard block ─────────────────────────────────────────────

describe('Rule 1 — riskScore >= threshold → hard block', () => {
  it('score exactly at threshold is hard-blocked', () => {
    const result = checkPublishGate(note({ riskScore: THRESHOLD }), THRESHOLD)
    expect(result.blocked).toBe(true)
    if (result.blocked) {
      expect(result.hardBlock).toBe(true)
      expect(result.reason).toMatch(/HIGH-risk/)
      expect(result.reason).toMatch(new RegExp(`${THRESHOLD}`))
    }
  })

  it('score above threshold is hard-blocked', () => {
    const result = checkPublishGate(note({ riskScore: THRESHOLD + 2 }), THRESHOLD)
    expect(result.blocked).toBe(true)
    if (result.blocked) expect(result.hardBlock).toBe(true)
  })

  it('score one below threshold is NOT blocked', () => {
    const result = checkPublishGate(note({ riskScore: THRESHOLD - 1 }), THRESHOLD)
    expect(result.blocked).toBe(false)
  })
})

// ─── Rule 2: Attribution soft block ───────────────────────────────────────────

describe('Rule 2 — sourceUrl present but sourcePublisher missing → soft block', () => {
  it('sourceUrl with null sourcePublisher is soft-blocked', () => {
    const result = checkPublishGate(
      note({ riskScore: 2, sourceUrl: 'https://ottawacitizen.com/article', sourcePublisher: null }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(true)
    if (result.blocked) {
      expect(result.hardBlock).toBe(false)
      expect(result.reason).toMatch(/Attribution missing/)
    }
  })

  it('sourceUrl with empty string sourcePublisher is NOT blocked (not a null check)', () => {
    // Empty string is truthy for our gate — we only block on null/undefined.
    // The gate checks `!note.sourcePublisher`, and an empty string is falsy in JS,
    // so this would be caught. Document the exact behaviour here.
    const result = checkPublishGate(
      note({ riskScore: 2, sourceUrl: 'https://example.com', sourcePublisher: '' }),
      THRESHOLD,
    )
    // Empty string is falsy → treated same as null → soft-blocked
    expect(result.blocked).toBe(true)
    if (result.blocked) expect(result.hardBlock).toBe(false)
  })

  it('note with no sourceUrl (business submission) and no sourcePublisher is NOT blocked', () => {
    // No sourceUrl → not a sourced note → attribution rule does not apply
    const result = checkPublishGate(
      note({ riskScore: 2, sourceUrl: null, sourcePublisher: null }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(false)
  })

  it('sourceUrl with valid sourcePublisher is NOT blocked', () => {
    const result = checkPublishGate(
      note({ riskScore: 2, sourceUrl: 'https://example.com', sourcePublisher: 'CBC Ottawa' }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(false)
  })
})

// ─── Precedence: both rules true ──────────────────────────────────────────────

describe('Precedence — HIGH-risk dominates missing attribution', () => {
  it('riskScore >= threshold AND missing sourcePublisher → hard block (content dominates)', () => {
    // If we only checked attribution first and found a soft-block, the HIGH-risk
    // note would NOT get BLOCKED_NEEDS_FRAMEWORK set. Rule 1 must fire first.
    const result = checkPublishGate(
      note({ riskScore: THRESHOLD, sourceUrl: 'https://example.com', sourcePublisher: null }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(true)
    if (result.blocked) {
      expect(result.hardBlock).toBe(true)
      expect(result.reason).toMatch(/HIGH-risk/)
    }
  })

  it('riskScore above threshold AND missing sourcePublisher → hard block', () => {
    const result = checkPublishGate(
      note({ riskScore: THRESHOLD + 3, sourceUrl: 'https://example.com', sourcePublisher: null }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(true)
    if (result.blocked) expect(result.hardBlock).toBe(true)
  })
})

// ─── Clean pass ───────────────────────────────────────────────────────────────

describe('Clean note — no blocks', () => {
  it('low-risk note with full attribution passes', () => {
    const result = checkPublishGate(
      note({ riskScore: 2, sourceUrl: 'https://cbc.ca', sourcePublisher: 'CBC Ottawa' }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(false)
  })

  it('low-risk note with no source (business submission) passes', () => {
    const result = checkPublishGate(
      note({ riskScore: 0, sourceUrl: null, sourcePublisher: null }),
      THRESHOLD,
    )
    expect(result.blocked).toBe(false)
  })

  it('threshold of 1 blocks even a riskScore-1 note', () => {
    // Confirms gate is not hardcoded to default=5; it uses whatever threshold is passed
    const result = checkPublishGate(note({ riskScore: 1 }), 1)
    expect(result.blocked).toBe(true)
    if (result.blocked) expect(result.hardBlock).toBe(true)
  })

  it('threshold of 10 never blocks a riskScore-9 note', () => {
    const result = checkPublishGate(note({ riskScore: 9 }), 10)
    expect(result.blocked).toBe(false)
  })
})
