/**
 * Deterministic per-order email event keys used for:
 *   1. AuditLog state tracking (prevents duplicate sends across retries)
 *   2. Resend provider idempotency keys (prevents duplicate sends at transport layer)
 */
export type CloseEmailEvent =
  | 'DEAL_SUCCESS'             // CAPTURED member: deal succeeded, payment processed
  | 'DEAL_FAILED'              // VOIDED member: threshold not met
  | 'CAPTURE_FAILED_RECOVERY'  // CAPTURE_FAILED member: action required
  | 'AUTH_EXPIRY'              // VOIDED member: authorization expired before deal closes
  | 'RECOVERY_EXPIRED';        // VOIDED member: recovery window closed without payment

export function emailIdempotencyKey(event: CloseEmailEvent, orderId: string): string {
  const slug: Record<CloseEmailEvent, string> = {
    DEAL_SUCCESS: 'deal_success',
    DEAL_FAILED: 'deal_failed',
    CAPTURE_FAILED_RECOVERY: 'capture_failed',
    AUTH_EXPIRY: 'auth_expiry',
    RECOVERY_EXPIRED: 'recovery_expired',
  };
  return `groupbuy_${slug[event]}_${orderId}`;
}

export const EMAIL_AUDIT_ATTEMPTED = (event: CloseEmailEvent): string =>
  `ORDER_EMAIL_ATTEMPTED_${event}`;
export const EMAIL_AUDIT_SENT = (event: CloseEmailEvent): string =>
  `ORDER_EMAIL_SENT_${event}`;
