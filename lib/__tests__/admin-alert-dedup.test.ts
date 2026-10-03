/**
 * lib/__tests__/admin-alert-dedup.test.ts
 *
 * Tests for the two-phase ATTEMPTED/SENT dedup sentinel in sendAdminAlert.
 *
 * Invariants under test:
 * 1. Successful send: writes ATTEMPTED before send, SENT after accept.
 * 2. SENT found in window: suppressed — no retry.
 * 3. ATTEMPTED but no SENT (previous send failed): allowed to retry.
 * 4. MAX_ATTEMPTS reached with no SENT: suppressed (storm protection).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before imports) ────────────────────────────────────

vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
  },
}))

const mockEmailSend = vi.fn().mockResolvedValue({ id: 'email-id' })

vi.mock('resend', () => {
  const ResendMock = vi.fn().mockImplementation(function () {
    return { emails: { send: mockEmailSend } }
  })
  return { Resend: ResendMock }
})

// ── Imports after mocks ───────────────────────────────────────────────────────

import { prisma } from '@/lib/prisma'
import { sendAdminAlert } from '@/lib/admin-alert'

// ── Test setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockEmailSend.mockResolvedValue({ id: 'email-id' })
  process.env.ADMIN_ALERT_EMAIL = 'admin@test.com'
  process.env.RESEND_API_KEY = 'test-key'
  process.env.EMAIL_FROM = 'Neighbours Club <test@test.com>'
  process.env.ADMIN_ALERT_MAX_ATTEMPTS = '5'
  process.env.ADMIN_ALERT_DEDUP_HOURS = '24'

  // Default: no existing SENT or ATTEMPTED records
  vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null)
  vi.mocked(prisma.auditLog.count).mockResolvedValue(0)
  vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never)
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('sendAdminAlert — ATTEMPTED/SENT dedup sentinel', () => {
  it('Test 1: first call — writes ATTEMPTED before send, writes SENT after success', async () => {
    await sendAdminAlert('CAPTURE_FAILED', 'capture_failed:order-1', 'Test detail')

    const createCalls = vi.mocked(prisma.auditLog.create).mock.calls

    // ATTEMPTED must be written (before the send)
    const attemptedCall = createCalls.find(
      c => (c[0] as { data: { action: string } }).data?.action === 'ADMIN_ALERT_ATTEMPTED',
    )
    expect(attemptedCall).toBeDefined()
    expect((attemptedCall![0] as { data: { entityId: string } }).data?.entityId).toBe(
      'capture_failed:order-1',
    )

    // SENT must be written (after the send)
    const sentCall = createCalls.find(
      c => (c[0] as { data: { action: string } }).data?.action === 'ADMIN_ALERT_SENT',
    )
    expect(sentCall).toBeDefined()
    expect((sentCall![0] as { data: { entityId: string } }).data?.entityId).toBe(
      'capture_failed:order-1',
    )

    // ATTEMPTED must have been created before SENT in call order
    const attemptedIdx = createCalls.indexOf(attemptedCall!)
    const sentIdx = createCalls.indexOf(sentCall!)
    expect(attemptedIdx).toBeLessThan(sentIdx)

    // Email must have been sent exactly once
    expect(mockEmailSend).toHaveBeenCalledOnce()
  })

  it('Test 2: SENT record found in window — alert suppressed, no email sent', async () => {
    // Simulate: SENT record exists from a previous successful delivery
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({ id: 'existing-sent' } as never)

    await sendAdminAlert('CAPTURE_FAILED', 'capture_failed:order-1', 'Test detail')

    // No new audit entries should be written
    expect(prisma.auditLog.create).not.toHaveBeenCalled()

    // No email sent
    expect(mockEmailSend).not.toHaveBeenCalled()
  })

  it('Test 3: ATTEMPTED exists but no SENT (previous send failed) — retry is allowed', async () => {
    // Simulate: ATTEMPTED was written but SENT was never written (email send failed)
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null) // no SENT
    vi.mocked(prisma.auditLog.count).mockResolvedValue(1) // 1 ATTEMPTED already

    await sendAdminAlert('CAPTURE_FAILED', 'capture_failed:order-1', 'Test detail')

    // Should proceed to write ATTEMPTED again and attempt send
    const createCalls = vi.mocked(prisma.auditLog.create).mock.calls
    const attemptedCall = createCalls.find(
      c => (c[0] as { data: { action: string } }).data?.action === 'ADMIN_ALERT_ATTEMPTED',
    )
    expect(attemptedCall).toBeDefined()

    // Email send should be attempted
    expect(mockEmailSend).toHaveBeenCalledOnce()
  })

  it('Test 4: MAX_ATTEMPTS reached with no SENT — suppressed (storm protection)', async () => {
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null) // no SENT
    vi.mocked(prisma.auditLog.count).mockResolvedValue(5) // exactly MAX_ATTEMPTS

    await sendAdminAlert('CAPTURE_FAILED', 'capture_failed:order-1', 'Test detail')

    // No new audit entries, no email
    expect(prisma.auditLog.create).not.toHaveBeenCalled()
    expect(mockEmailSend).not.toHaveBeenCalled()
  })
})
