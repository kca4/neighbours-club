import { describe, it, expect } from 'vitest'
import { captureIdempotencyKey } from '../groupbuy/capture-key'

describe('captureIdempotencyKey', () => {
  it('is deterministic: same inputs always produce the same key', () => {
    expect(captureIdempotencyKey('deal-abc', 'order-xyz'))
      .toBe(captureIdempotencyKey('deal-abc', 'order-xyz'))
  })

  it('produces different keys for different orders on the same deal', () => {
    expect(captureIdempotencyKey('deal-abc', 'order-1'))
      .not.toBe(captureIdempotencyKey('deal-abc', 'order-2'))
  })

  it('produces different keys for the same order on different deals', () => {
    expect(captureIdempotencyKey('deal-1', 'order-abc'))
      .not.toBe(captureIdempotencyKey('deal-2', 'order-abc'))
  })

  it('has the groupbuy_capture_ prefix', () => {
    expect(captureIdempotencyKey('d', 'o')).toMatch(/^groupbuy_capture_/)
  })

  it('embeds both dealId and orderId', () => {
    const key = captureIdempotencyKey('deal-foo', 'order-bar')
    expect(key).toContain('deal-foo')
    expect(key).toContain('order-bar')
  })
})
