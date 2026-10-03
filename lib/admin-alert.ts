/**
 * lib/admin-alert.ts
 *
 * Sends admin alert emails for P0 incidents using the existing Resend infrastructure.
 *
 * Alert deduplication: uses the AuditLog with a two-phase sentinel —
 *   ADMIN_ALERT_ATTEMPTED  — written before the send attempt
 *   ADMIN_ALERT_SENT       — written only after the provider accepts the email
 *
 * Dedup logic:
 *   - Skip if SENT exists within the window (alert already delivered).
 *   - Allow retry if only ATTEMPTED exists (previous send failed).
 *   - Skip if ATTEMPTED count >= MAX_ATTEMPTS (storm protection).
 *
 * This ensures P0 alerts are retryable after a transient email failure, while
 * still preventing duplicate storms.
 *
 * Env vars:
 *   ADMIN_ALERT_EMAIL           — recipient (required; if unset, alerts are logged only)
 *   ADMIN_ALERT_DEDUP_HOURS     — dedup window in hours (default 24)
 *   ADMIN_ALERT_MAX_ATTEMPTS    — max send attempts per incident per window (default 5)
 *   RESEND_API_KEY              — shared with lib/email.ts
 *   EMAIL_FROM                  — shared with lib/email.ts
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';

const ADMIN_ALERT_DEDUP_HOURS = parseInt(
  process.env.ADMIN_ALERT_DEDUP_HOURS ?? '24',
  10,
);
const MAX_ATTEMPTS = parseInt(process.env.ADMIN_ALERT_MAX_ATTEMPTS ?? '5', 10);

const ALERT_AUDIT_ATTEMPTED = 'ADMIN_ALERT_ATTEMPTED';
const ALERT_AUDIT_SENT = 'ADMIN_ALERT_SENT';

export type AdminAlertReason =
  | 'CAPTURE_FAILED'                         // an order entered CAPTURE_FAILED
  | 'CAPTURE_FAILED_EMAIL_MAX_ATTEMPTS'      // capture-failed recovery email repeatedly fails
  | 'RECOVERY_EXPIRED_EMAIL_MAX_ATTEMPTS'    // recovery-expired cancellation email repeatedly fails
  | 'DEAL_CLOSE_ERROR'                       // unexpected error during close execution
  | 'DEAL_STUCK'                             // deal remains stuck/incomplete after reconciliation
  | 'CLOSE_EMAIL_FAILED'                     // informational close email (success/failed) could not be sent
  | 'AUTH_EXPIRY_RISK';                      // auth will expire before deal closes + safety margin

export async function sendAdminAlert(
  reason: AdminAlertReason,
  incidentKey: string,
  detail: string,
): Promise<void> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;

  // Always log — useful even without email configured
  console.error(`[admin-alert] ${reason} | key=${incidentKey} | ${detail}`);

  if (!adminEmail) return;

  const dedupSince = new Date(Date.now() - ADMIN_ALERT_DEDUP_HOURS * 60 * 60 * 1000);

  // Skip if already successfully delivered within the window
  const sent = await prisma.auditLog.findFirst({
    where: {
      action: ALERT_AUDIT_SENT,
      entityId: incidentKey,
      createdAt: { gte: dedupSince },
    },
    select: { id: true },
  });
  if (sent) {
    console.warn(`[admin-alert] Suppressed duplicate alert for ${incidentKey} (already sent)`);
    return;
  }

  // Storm protection: skip if too many attempts already in the window
  const attempts = await prisma.auditLog.count({
    where: {
      action: ALERT_AUDIT_ATTEMPTED,
      entityId: incidentKey,
      createdAt: { gte: dedupSince },
    },
  });
  if (attempts >= MAX_ATTEMPTS) {
    console.warn(
      `[admin-alert] Max attempts (${MAX_ATTEMPTS}) reached for ${incidentKey}, suppressing`,
    );
    return;
  }

  // Write ATTEMPTED sentinel before the send attempt.
  // If the send fails, ATTEMPTED is recorded but SENT is not, so the next call will retry.
  await prisma.auditLog.create({
    data: {
      action: ALERT_AUDIT_ATTEMPTED,
      entityType: 'incident',
      entityId: incidentKey,
      metadata: { reason, detail, attemptNumber: attempts + 1 },
    },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? 'Neighbours Club <hello@neighborsclub.ca>';

  try {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `[Neighbours Club] ALERT: ${reason}`,
      html: `
        <h2>Neighbours Club — Admin Alert</h2>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Incident key:</strong> <code>${incidentKey}</code></p>
        <p><strong>Detail:</strong></p>
        <pre>${detail}</pre>
        <hr/>
        <p style="color:#666;font-size:12px;">
          Sent by the Neighbours Club automated alert system.<br/>
          Deduplication window: ${ADMIN_ALERT_DEDUP_HOURS}h per incident key.
          Attempt ${attempts + 1} of ${MAX_ATTEMPTS}.
        </p>
      `,
    });

    // Write SENT only after the provider accepts the message
    await prisma.auditLog.create({
      data: {
        action: ALERT_AUDIT_SENT,
        entityType: 'incident',
        entityId: incidentKey,
        metadata: { reason, detail, attemptNumber: attempts + 1 },
      },
    });
  } catch (err) {
    // ATTEMPTED is written, SENT is not — next invocation will retry up to MAX_ATTEMPTS
    console.error('[admin-alert] Failed to send admin email:', err);
  }
}
