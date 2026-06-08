/**
 * lib/__tests__/notes-retract.test.ts
 *
 * Pure unit tests for the notes retraction helpers.
 * No real DB — all tests use mock tx clients.
 *
 * Critical invariant under test:
 *   NO CP clawback — retractNoteInTx and unpublishNoteInTx must NEVER touch
 *   Wallet or WalletLedger. The mock tx exposes wallet spy methods; any call
 *   to those methods fails the test.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildVersionSnapshot,
  retractNoteInTx,
  unpublishNoteInTx,
  type RetractTxClient,
} from '../notes-retract'
import type { ProcessedNote } from '@prisma/client'

// ─── Fixture ──────────────────────────────────────────────────────────────────

function makeNote(overrides: Partial<ProcessedNote> = {}): ProcessedNote {
  return {
    id:                  'note-1',
    rawIntelId:          null,
    headline:            'Test headline',
    summary:             'Test summary',
    streetOrArea:        'Kanata',
    category:            'Safety' as ProcessedNote['category'],
    sourceType:          'EDITORIAL' as ProcessedNote['sourceType'],
    impactSafety:        3,
    impactCost:          2,
    impactTime:          1,
    riskScore:           3,
    autoPublishEligible: true,
    sourceUrl:           'https://example.com/article',
    slug:                'test-headline',
    status:              'APPROVED' as ProcessedNote['status'],
    sentAt:              null,
    createdAt:           new Date('2026-06-07T12:00:00Z'),
    updatedAt:           new Date('2026-06-07T12:00:00Z'),
    businessProfileId:   null,
    restaurantId:        null,
    sourcePublisher:     'CBC Ottawa',
    sourceIngestedAt:    null,
    aiModel:             'gemini-2.5-flash',
    aiConfidence:        0.9,
    publishedAt:         new Date('2026-06-07T12:00:00Z'),
    version:             1,
    ...overrides,
  }
}

// ─── Mock tx factory ──────────────────────────────────────────────────────────

function makeTx(note: ProcessedNote): {
  tx: RetractTxClient & { wallet: { update: ReturnType<typeof vi.fn> }; walletLedger: { create: ReturnType<typeof vi.fn> } };
  updateSpy: ReturnType<typeof vi.fn>;
  createVersionSpy: ReturnType<typeof vi.fn>;
} {
  const updateSpy = vi.fn().mockResolvedValue({ ...note });
  const createVersionSpy = vi.fn().mockResolvedValue({});
  const walletUpdateSpy = vi.fn();
  const walletLedgerCreateSpy = vi.fn();

  const tx = {
    processedNote: {
      findUniqueOrThrow: vi.fn().mockResolvedValue(note),
      update: updateSpy,
    },
    noteVersion: {
      create: createVersionSpy,
    },
    // wallet/walletLedger are NOT part of RetractTxClient — added here to
    // prove they are never called.
    wallet: { update: walletUpdateSpy },
    walletLedger: { create: walletLedgerCreateSpy },
  }

  return { tx: tx as unknown as RetractTxClient & typeof tx, updateSpy, createVersionSpy }
}

// ─── buildVersionSnapshot ─────────────────────────────────────────────────────

describe('buildVersionSnapshot', () => {
  it('returns a snapshot with all scalar note fields', () => {
    const note = makeNote()
    const snap = buildVersionSnapshot(note)
    expect(snap.id).toBe('note-1')
    expect(snap.headline).toBe('Test headline')
    expect(snap.status).toBe('APPROVED')
    expect(snap.version).toBe(1)
    expect(snap.riskScore).toBe(3)
  })

  it('strips corrections and versions arrays if present', () => {
    const noteWithRelations = {
      ...makeNote(),
      corrections: [{ id: 'c1' }],
      versions:    [{ id: 'v1' }],
    } as unknown as ProcessedNote
    const snap = buildVersionSnapshot(noteWithRelations)
    expect((snap as Record<string, unknown>).corrections).toBeUndefined()
    expect((snap as Record<string, unknown>).versions).toBeUndefined()
  })

  it('is a pure function — does not mutate the original note', () => {
    const note = makeNote()
    const originalStatus = note.status
    buildVersionSnapshot(note)
    expect(note.status).toBe(originalStatus)
  })
})

// ─── retractNoteInTx ──────────────────────────────────────────────────────────

describe('retractNoteInTx', () => {
  it('writes a NoteVersion before updating status', async () => {
    const note = makeNote({ status: 'APPROVED', version: 1 })
    const { tx, updateSpy, createVersionSpy } = makeTx(note)

    await retractNoteInTx(tx, 'note-1', 'admin@example.com', 'Factual error found')

    expect(createVersionSpy).toHaveBeenCalledOnce()
    expect(updateSpy).toHaveBeenCalledOnce()

    // Version must be written before the status update (call order)
    const createOrder = createVersionSpy.mock.invocationCallOrder[0]
    const updateOrder = updateSpy.mock.invocationCallOrder[0]
    expect(createOrder).toBeLessThan(updateOrder)
  })

  it('sets status to RETRACTED and bumps version', async () => {
    const note = makeNote({ status: 'APPROVED', version: 2 })
    const { tx, updateSpy } = makeTx(note)

    await retractNoteInTx(tx, 'note-1', 'admin@example.com', 'Error')

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'note-1' },
      data: { status: 'RETRACTED', version: 3 },
    })
  })

  it('snapshots the note at version N; NoteVersion.versionNumber = N+1', async () => {
    const note = makeNote({ version: 5 })
    const { tx, createVersionSpy } = makeTx(note)

    await retractNoteInTx(tx, 'note-1', 'editor@example.com', 'Reason')

    const createCall = createVersionSpy.mock.calls[0][0]
    expect(createCall.data.versionNumber).toBe(6)
    expect(createCall.data.riskScoreAtVersion).toBe(note.riskScore)
  })

  it('records changedBy and changeReason on the version row', async () => {
    const note = makeNote()
    const { tx, createVersionSpy } = makeTx(note)

    await retractNoteInTx(tx, 'note-1', 'editor@example.com', 'Test reason')

    const createCall = createVersionSpy.mock.calls[0][0]
    expect(createCall.data.changedBy).toBe('editor@example.com')
    expect(createCall.data.changeReason).toBe('Test reason')
  })

  it('NEVER touches wallet or walletLedger (no CP clawback)', async () => {
    const note = makeNote()
    const { tx } = makeTx(note)

    await retractNoteInTx(tx, 'note-1', 'admin@example.com', 'Error')

    expect((tx as unknown as { wallet: { update: ReturnType<typeof vi.fn> } }).wallet.update).not.toHaveBeenCalled()
    expect((tx as unknown as { walletLedger: { create: ReturnType<typeof vi.fn> } }).walletLedger.create).not.toHaveBeenCalled()
  })
})

// ─── unpublishNoteInTx ────────────────────────────────────────────────────────

describe('unpublishNoteInTx', () => {
  it('sets status to CORRECTED and bumps version', async () => {
    const note = makeNote({ status: 'APPROVED', version: 1 })
    const { tx, updateSpy } = makeTx(note)

    await unpublishNoteInTx(tx, 'note-1', 'admin@example.com', 'Disputed claim')

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'note-1' },
      data: { status: 'CORRECTED', version: 2 },
    })
  })

  it('writes a NoteVersion snapshot before changing status', async () => {
    const note = makeNote({ status: 'APPROVED', version: 3 })
    const { tx, createVersionSpy, updateSpy } = makeTx(note)

    await unpublishNoteInTx(tx, 'note-1', 'admin@example.com', 'Under dispute')

    expect(createVersionSpy).toHaveBeenCalledOnce()
    expect(updateSpy).toHaveBeenCalledOnce()
    const createOrder = createVersionSpy.mock.invocationCallOrder[0]
    const updateOrder = updateSpy.mock.invocationCallOrder[0]
    expect(createOrder).toBeLessThan(updateOrder)
  })

  it('NEVER touches wallet or walletLedger (no CP clawback)', async () => {
    const note = makeNote()
    const { tx } = makeTx(note)

    await unpublishNoteInTx(tx, 'note-1', 'admin@example.com', 'Dispute')

    expect((tx as unknown as { wallet: { update: ReturnType<typeof vi.fn> } }).wallet.update).not.toHaveBeenCalled()
    expect((tx as unknown as { walletLedger: { create: ReturnType<typeof vi.fn> } }).walletLedger.create).not.toHaveBeenCalled()
  })

  it('uses the correct versionNumber on the snapshot row', async () => {
    const note = makeNote({ version: 7 })
    const { tx, createVersionSpy } = makeTx(note)

    await unpublishNoteInTx(tx, 'note-1', 'admin@example.com', 'Test')

    const createCall = createVersionSpy.mock.calls[0][0]
    expect(createCall.data.versionNumber).toBe(8)
  })
})
