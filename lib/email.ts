/**
 * lib/email.ts — Central transactional email module.
 *
 * All email sends go through this file. Errors from Resend are caught and logged
 * but never thrown — email failure must never crash the calling route.
 *
 * Template approach: plain HTML strings with inline styles for maximum
 * email-client compatibility without adding React Email as a dependency.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "Neighbours Club <hello@neighborsclub.ca>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
// Support contact address for member-facing emails. Defaults to the address
// extracted from EMAIL_FROM so that dev environments work without extra config.
// In production, MEMBER_SUPPORT_EMAIL must point to a monitored inbox.
const SUPPORT_EMAIL =
  process.env.MEMBER_SUPPORT_EMAIL ??
  FROM.match(/<(.+?)>/)?.[1] ??
  FROM;

if (process.env.NODE_ENV === 'production' && !process.env.MEMBER_SUPPORT_EMAIL) {
  // Loud error at module load so it appears in server startup logs.
  // Does not throw — emails still send, but to potentially unmonitored address.
  console.error(
    '[email] PRODUCTION MISCONFIGURATION: MEMBER_SUPPORT_EMAIL is not set. ' +
    'Member support emails will route to the EMAIL_FROM address, which may not be monitored. ' +
    'Set MEMBER_SUPPORT_EMAIL=<monitored-inbox> before public launch.',
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCad(amount: number): string {
  return amount.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

function fmtCadFR(amount: number): string {
  return amount.toLocaleString("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  });
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

function fmtDateShort(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  });
}

function fmtTime(date: Date): string {
  return date.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "America/Toronto",
  });
}

function fmtPickupWindow(start: Date, end: Date): string {
  return `${fmtDate(start)} from ${fmtTime(start)} to ${fmtTime(end)}`;
}

// ─── Base template ────────────────────────────────────────────────────────────

function baseTemplate(content: string): string {
  const address = process.env.NEIGHBOURS_CLUB_ADDRESS ?? null;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">
                Neighbours Club
              </span>
            </td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <!-- NOTE for counsel: physical mailing address is required here under CASL for
               commercial electronic messages. NEIGHBOURS_CLUB_ADDRESS env var is used when set;
               if unset, no address is shown. Confirm CASL exemption before public launch. -->
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
              Neighbours Club${address ? ` &middot; ${address}` : ''}<br/>
              You received this email because you have an account with Neighbours Club.<br/>
              Vous recevez ce courriel parce que vous avez un compte Neighbours Club.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(label: string, href: string): string {
  return `<div style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#1f2937;color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
  </div>`;
}

function dl(rows: Array<[string, string]>): string {
  const items = rows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:6px 0;font-size:14px;color:#6b7280;width:45%;">${label}</td>
          <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:500;">${value}</td>
        </tr>`,
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;margin-top:16px;padding-top:8px;">${items}</table>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${text}</h1>`;
}

function p(text: string, muted = false): string {
  const color = muted ? "#6b7280" : "#374151";
  return `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:${color};">${text}</p>`;
}

// ─── Email senders ────────────────────────────────────────────────────────────

/**
 * 1. ORDER_AUTHORIZED — sent when PENDING_AUTHORIZATION → AUTHORIZED
 */
export async function sendOrderAuthorized(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  supplierName: string;
  quantity: number;
  maxAuthorizedAmount: number;
  closesAt: Date;
  pickupLocation: string;
  pickupAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
}) {
  const {
    to,
    memberName,
    dealTitle,
    supplierName,
    quantity,
    maxAuthorizedAmount,
    closesAt,
    pickupLocation,
    pickupAddress,
    pickupWindowStart,
    pickupWindowEnd,
  } = params;

  const html = baseTemplate(`
    ${h1(`You're in! Your spot on ${dealTitle} is confirmed`)}
    ${p(`Hi ${memberName}, your card hold has been placed and your spot is reserved.`)}
    ${dl([
      ["Deal", dealTitle],
      ["Supplier", supplierName],
      ["Quantity", String(quantity)],
      ["Max hold amount", fmtCad(maxAuthorizedAmount)],
      ["Deal closes", fmtDate(closesAt)],
      ["Pickup location", pickupLocation],
      ["Pickup address", pickupAddress],
      ["Pickup window", fmtPickupWindow(pickupWindowStart, pickupWindowEnd)],
    ])}
    ${p(`You'll only be charged the final group price when the deal closes on ${fmtDateShort(closesAt)}. If the deal doesn't reach the minimum number of members, your hold is released automatically and you pay nothing.`, true)}
    ${btn("View my deals", `${APP_URL}/my-deals`)}
  `);

  await send({
    to,
    subject: `You're in! Your spot on ${dealTitle} is confirmed`,
    html,
  });
}

/**
 * 2. DEAL_CLOSED_SUCCESS — sent to all CAPTURED members when deal closes successfully
 */
export async function sendDealClosedSuccess(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  finalPricePerUnit: number;
  quantity: number;
  totalCharged: number;
  pickupLocation: string;
  pickupAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  pickupInstructions?: string | null;
  idempotencyKey?: string;
}): Promise<boolean> {
  const {
    to,
    memberName,
    dealTitle,
    finalPricePerUnit,
    quantity,
    totalCharged,
    pickupLocation,
    pickupAddress,
    pickupWindowStart,
    pickupWindowEnd,
    pickupInstructions,
    idempotencyKey,
  } = params;

  const html = baseTemplate(`
    ${h1(`Great news — ${dealTitle} is happening!`)}
    ${p(`Hi ${memberName}, the deal reached its minimum and your payment has been processed.`)}
    ${dl([
      ["Deal", dealTitle],
      ["Price per unit", fmtCad(finalPricePerUnit)],
      ["Quantity", String(quantity)],
      ["Total charged", fmtCad(totalCharged)],
      ["Pickup location", pickupLocation],
      ["Pickup address", pickupAddress],
      ["Pickup window", fmtPickupWindow(pickupWindowStart, pickupWindowEnd)],
    ])}
    ${pickupInstructions ? p(`<strong>Pickup instructions:</strong> ${pickupInstructions}`) : ""}
    ${p("Please bring your order confirmation when you come to pick up.", true)}
    ${btn("View my deals", `${APP_URL}/my-deals`)}
  `);

  return await send({
    to,
    subject: `Great news — ${dealTitle} is happening!`,
    html,
    idempotencyKey,
  });
}

/**
 * 3. DEAL_CLOSED_FAILED — sent to members whose orders were voided (threshold not met)
 */
export async function sendDealClosedFailed(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  idempotencyKey?: string;
}): Promise<boolean> {
  const { to, memberName, dealTitle, idempotencyKey } = params;

  const html = baseTemplate(`
    ${h1(`${dealTitle} didn't reach the minimum — no charge`)}
    ${p(`Hi ${memberName}, unfortunately ${dealTitle} didn't reach the minimum number of members needed to run.`)}
    ${p("Your card hold has been released automatically. You have not been charged anything.")}
    ${p("Check out other active deals — there might be something else you'll love.", true)}
    ${btn("Browse deals", `${APP_URL}/deals`)}
  `);

  return await send({
    to,
    subject: `${dealTitle} didn't reach the minimum — no charge`,
    html,
    idempotencyKey,
  });
}

/**
 * 4. ORDER_CAPTURE_FAILED — sent when a payment capture fails during closure.
 *    Bilingual (EN then FR). Includes the actual recovery deadline.
 */
export async function sendOrderCaptureFailed(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  amountOwed: number;
  recoveryToken: string;
  recoveryExpiresAt: Date | null;
  idempotencyKey?: string;
}): Promise<boolean> {
  const { to, memberName, dealTitle, amountOwed, recoveryToken, recoveryExpiresAt, idempotencyKey } = params;
  const recoveryUrl = `${APP_URL}/recover-payment/${recoveryToken}`;

  const firstName = memberName.trim() ? memberName.split(' ')[0] : null;
  const greetingEN = firstName ? `Hi ${firstName},` : 'Hi,';
  const greetingFR = firstName ? `Bonjour ${firstName},` : 'Bonjour,';

  const deadlineEN = recoveryExpiresAt ? fmtDateTime(recoveryExpiresAt, 'en-CA') : null;
  const deadlineFR = recoveryExpiresAt ? fmtDateTime(recoveryExpiresAt, 'fr-CA') : null;

  const deadlineLineEN = deadlineEN
    ? `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">To keep your order, please complete your payment before <strong>${deadlineEN}</strong>:</p>`
    : `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">To keep your order, please complete your payment as soon as possible:</p>`;
  const deadlineLineFR = deadlineFR
    ? `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">Pour conserver votre commande, veuillez finaliser votre paiement avant le <strong>${deadlineFR}</strong>&nbsp;:</p>`
    : `<p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">Pour conserver votre commande, veuillez finaliser votre paiement dès que possible&nbsp;:</p>`;

  const content = `
    <!-- EN — Le français suit. -->
    ${p('<em>Le français suit.</em>', true)}
    ${h1(`Action needed: complete your payment for ${dealTitle}`)}
    ${p(greetingEN)}
    ${p(`<strong>${dealTitle}</strong> reached its goal, but we weren't able to process your payment, so you haven't been charged yet. This can happen for different reasons and doesn't necessarily mean there's a problem with your card.`)}
    ${dl([
      ["Deal", dealTitle],
      ["Amount due", fmtCad(amountOwed)],
    ])}
    ${deadlineLineEN}
    ${btn("Complete payment", recoveryUrl)}
    ${deadlineEN ? p(`If payment isn't completed before ${deadlineEN}, your order will be cancelled and you won't be charged.`) : ''}
    ${p(`Need help? Reach us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`, true)}
    ${p('Alex<br/>Neighbours Club', true)}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>

    <!-- FR -->
    ${h1(`Action requise\u00A0: finalisez votre paiement pour ${dealTitle}`)}
    ${p(greetingFR)}
    ${p(`L'achat groupé <strong>${dealTitle}</strong> a atteint son objectif, mais nous n'avons pas pu traiter votre paiement; aucun montant n'a donc été débité pour l'instant. Cela peut se produire pour différentes raisons et ne signifie pas nécessairement qu'il y a un problème avec votre carte.`)}
    ${dl([
      ["Achat groupé", dealTitle],
      ["Montant dû", fmtCadFR(amountOwed)],
    ])}
    ${deadlineLineFR}
    ${btn("Finaliser le paiement", recoveryUrl)}
    ${deadlineFR ? p(`Si le paiement n'est pas finalisé avant le ${deadlineFR}, votre commande sera annulée et aucun montant ne sera débité.`) : ''}
    ${p(`Besoin d'aide? Écrivez-nous à <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`, true)}
    ${p('Alex<br/>Neighbours Club', true)}
  `;

  return await send({
    to,
    subject: `Action needed: complete your payment for ${dealTitle}`,
    html: baseTemplate(content),
    idempotencyKey,
  });
}

/**
 * 4b. ORDER_RECOVERY_EXPIRED — sent when the recovery window closes without payment.
 *     Bilingual (EN then FR).
 */
export async function sendOrderRecoveryExpired(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  recoveryExpiresAt: Date;
  idempotencyKey?: string;
}): Promise<boolean> {
  const { to, memberName, dealTitle, recoveryExpiresAt, idempotencyKey } = params;

  const firstName = memberName.trim() ? memberName.split(' ')[0] : null;
  const greetingEN = firstName ? `Hi ${firstName},` : 'Hi,';
  const greetingFR = firstName ? `Bonjour ${firstName},` : 'Bonjour,';

  const deadlineEN = fmtDateTime(recoveryExpiresAt, 'en-CA');
  const deadlineFR = fmtDateTime(recoveryExpiresAt, 'fr-CA');

  const content = `
    <!-- EN — Le français suit. -->
    ${p('<em>Le français suit.</em>', true)}
    ${h1(`Your order for ${dealTitle} was cancelled — you weren't charged`)}
    ${p(greetingEN)}
    ${p(`The payment for your order of <strong>${dealTitle}</strong> wasn't completed before <strong>${deadlineEN}</strong>, so we've cancelled your order. You haven't been charged, and there's nothing further you need to do.`)}
    ${p(`Need help? Reach us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`, true)}
    ${p('Alex<br/>Neighbours Club', true)}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>

    <!-- FR -->
    ${h1(`Votre commande pour ${dealTitle} a été annulée — aucun montant débité`)}
    ${p(greetingFR)}
    ${p(`Le paiement pour votre commande de <strong>${dealTitle}</strong> n'a pas été finalisé avant le <strong>${deadlineFR}</strong>. Votre commande a donc été annulée. Aucun montant n'a été débité, et vous n'avez rien d'autre à faire.`)}
    ${p(`Besoin d'aide? Écrivez-nous à <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`, true)}
    ${p('Alex<br/>Neighbours Club', true)}
  `;

  return await send({
    to,
    subject: `Your order for ${dealTitle} was cancelled — you weren't charged`,
    html: baseTemplate(content),
    idempotencyKey,
  });
}

/**
 * 5. PICKUP_REMINDER — sent ~24 hours before the pickup window opens
 */
export async function sendPickupReminder(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  pickupLocation: string;
  pickupAddress: string;
  pickupWindowStart: Date;
  pickupWindowEnd: Date;
  pickupInstructions?: string | null;
}) {
  const {
    to,
    memberName,
    dealTitle,
    pickupLocation,
    pickupAddress,
    pickupWindowStart,
    pickupWindowEnd,
    pickupInstructions,
  } = params;

  const html = baseTemplate(`
    ${h1(`Pickup reminder — ${dealTitle} tomorrow`)}
    ${p(`Hi ${memberName}, your order is ready for pickup tomorrow!`)}
    ${dl([
      ["Deal", dealTitle],
      ["Pickup location", pickupLocation],
      ["Pickup address", pickupAddress],
      ["Pickup window", fmtPickupWindow(pickupWindowStart, pickupWindowEnd)],
    ])}
    ${pickupInstructions ? p(`<strong>Pickup instructions:</strong> ${pickupInstructions}`) : ""}
    ${p("Please bring this email or open your My Deals page for reference.", true)}
    ${btn("View my deals", `${APP_URL}/my-deals`)}
  `);

  await send({
    to,
    subject: `Pickup reminder — ${dealTitle} tomorrow`,
    html,
  });
}

/**
 * 6. PASSWORD_RESET — sent when a member requests a password reset
 */
export async function sendPasswordReset(params: {
  to: string;
  memberName: string;
  token: string;
}) {
  const { to, memberName, token } = params;
  const resetUrl = `${APP_URL}/reset-password/${token}`;

  const html = baseTemplate(`
    ${h1("Reset your Neighbours Club password")}
    ${p(`Hi ${memberName}, we received a request to reset your password.`)}
    ${p("Click the button below to set a new password. This link is valid for 1 hour.")}
    ${btn("Reset my password", resetUrl)}
    ${p("If you didn't request a password reset, you can safely ignore this email — your password will not change.", true)}
    ${p("For security, never share this link with anyone.", true)}
  `);

  await send({
    to,
    subject: "Reset your Neighbours Club password",
    html,
  });
}

/**
 * 7. NOTES_CONFIRMATION — double opt-in confirmation for Neighbours Notes subscribers
 */
export async function sendNotesConfirmation(params: {
  to: string;
  name?: string | null;
  confirmationToken: string;
  unsubscribeToken: string;
}) {
  const { to, name, confirmationToken, unsubscribeToken } = params;
  const confirmUrl = `${APP_URL}/notes/confirm?token=${confirmationToken}`;
  const unsubscribeUrl = `${APP_URL}/api/notes/unsubscribe?token=${unsubscribeToken}`;
  const address =
    process.env.NEIGHBOURS_CLUB_ADDRESS ?? "Kanata, Ottawa, ON";
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">
                Neighbours Club
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Confirm your Neighbours Notes subscription</h1>
              <p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;">${greeting} please confirm your email address to start receiving Neighbours Notes.</p>
              <p style="margin:12px 0;font-size:15px;line-height:1.6;color:#374151;"><strong>Neighbours Notes</strong> is a free neighbourhood briefing for Kanata, Ottawa. You'll receive:</p>
              <ul style="margin:8px 0 16px;padding-left:20px;font-size:15px;line-height:1.8;color:#374151;">
                <li>A daily digest of what matters in your neighbourhood — transit, development applications, safety, cost-of-living</li>
                <li>Urgent alerts for time-sensitive issues that affect your street</li>
              </ul>
              <div style="margin:24px 0;">
                <a href="${confirmUrl}" style="display:inline-block;background:#0F766E;color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Confirm my subscription</a>
              </div>
              <p style="margin:12px 0;font-size:14px;line-height:1.6;color:#6b7280;">Button not working? Copy and paste this link into your browser:</p>
              <p style="margin:4px 0 16px;font-size:13px;line-height:1.6;color:#6b7280;word-break:break-all;">${confirmUrl}</p>
              <p style="margin:12px 0;font-size:14px;line-height:1.6;color:#6b7280;">This link expires in 48 hours. If you didn't sign up for Neighbours Notes, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
              Neighbours Club &middot; ${address}<br/>
              You're receiving this because you requested a Neighbours Notes subscription.<br/>
              <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await send({
    to,
    subject: "Confirm your Neighbours Notes subscription",
    html,
    headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
  });
}

/**
 * 8. URGENT_NOTE — immediate alert to opted-in subscribers when an urgent note is approved
 */
export async function sendUrgentNote(
  subscriber: { email: string; name: string | null; unsubscribeToken: string },
  note: {
    headline: string;
    summary: string;
    streetOrArea: string;
    category: string;
    impactSafety: number;
    impactCost: number;
    impactTime: number;
  }
): Promise<boolean> {
  const unsubscribeUrl = `${APP_URL}/api/notes/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const notesUrl = `${APP_URL}/notes`;
  const address = process.env.NEIGHBOURS_CLUB_ADDRESS ?? "Kanata, Ottawa, ON";
  const greeting = subscriber.name ? `Hi ${subscriber.name},` : "Hi there,";

  const impactChip = (label: string, score: number) => {
    const bg = score >= 4 ? "#F59E0B" : "#e5e7eb";
    const color = score >= 4 ? "#ffffff" : "#374151";
    return `<span style="display:inline-block;background:${bg};color:${color};padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;margin-right:6px;">${label} ${score}/5</span>`;
  };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">
                Neighbours Club
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#0F766E;border-radius:12px 12px 0 0;padding:20px 32px;">
              <span style="font-size:13px;font-weight:700;color:#ccfbf1;letter-spacing:0.5px;text-transform:uppercase;">⚡ Urgent Neighbours Alert</span>
              <span style="display:inline-block;margin-left:10px;background:#ffffff22;color:#ffffff;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;">${note.category}</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:0 0 12px 12px;border:1px solid #e5e7eb;border-top:none;padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">${note.streetOrArea}</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;line-height:1.3;">${note.headline}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#374151;">${greeting} ${note.summary}</p>
              <div style="margin:0 0 24px;">
                ${impactChip("Safety", note.impactSafety)}
                ${impactChip("Cost", note.impactCost)}
                ${impactChip("Time", note.impactTime)}
              </div>
              <div style="margin:24px 0;">
                <a href="${notesUrl}" style="display:inline-block;background:#0F766E;color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">View full neighbourhood feed →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
              Neighbours Club &middot; ${address}<br/>
              You're receiving this because you subscribed to urgent Neighbours Notes alerts.<br/>
              <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: subscriber.email,
      subject: `⚡ ${note.category} Alert: ${note.headline}`,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });
    if (error) {
      console.error(`[urgent-note] Resend error for ${subscriber.email}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[urgent-note] Failed to send to ${subscriber.email}:`, err);
    return false;
  }
}

/**
 * 9. DAILY_DIGEST — morning summary of approved notes for digest subscribers
 */
export async function sendDailyDigest(
  subscriber: { email: string; name: string | null; unsubscribeToken: string },
  notes: Array<{
    id: string;
    headline: string;
    summary: string;
    streetOrArea: string;
    category: string;
    impactSafety: number;
    impactCost: number;
    impactTime: number;
  }>,
  date: Date,
  hasMore: boolean
): Promise<boolean> {
  const unsubscribeUrl = `${APP_URL}/api/notes/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const notesUrl = `${APP_URL}/notes`;
  const address = process.env.NEIGHBOURS_CLUB_ADDRESS ?? "Kanata, Ottawa, ON";
  const greeting = subscriber.name ? `Hi ${subscriber.name},` : "Hi there,";
  const dateLabel = date.toLocaleDateString("en-CA", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const subject = `📰 Neighbours Notes — ${dateLabel}`;

  const impactChip = (label: string, score: number) => {
    const bg = score >= 4 ? "#F59E0B" : "#e5e7eb";
    const color = score >= 4 ? "#ffffff" : "#374151";
    return `<span style="display:inline-block;background:${bg};color:${color};padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;margin-right:6px;">${label} ${score}/5</span>`;
  };

  const noteCards = notes
    .map(
      (note, i) => `
      ${i > 0 ? '<hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />' : ""}
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 6px;">${note.headline}</p>
      <p style="margin:0 0 8px;">
        <span style="display:inline-block;background:#0F766E;color:#fff;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;">${note.category}</span>
        <span style="font-size:13px;color:#6b7280;margin-left:8px;">${note.streetOrArea}</span>
      </p>
      <p style="font-size:14px;line-height:1.6;color:#374151;margin:0 0 10px;">${note.summary}</p>
      <div style="margin-bottom:4px;">
        ${impactChip("Safety", note.impactSafety)}${impactChip("Cost", note.impactCost)}${impactChip("Time", note.impactTime)}
      </div>`
    )
    .join("");

  const viewAllButton = hasMore
    ? `<div style="margin:24px 0 0;">
        <a href="${notesUrl}" style="display:inline-block;background:#0F766E;color:#ffffff;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">View all notes on the web →</a>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:24px;">
              <span style="font-size:20px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">
                Neighbours Club
              </span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;">
              <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#111827;">Neighbours Notes Daily Digest</h1>
              <p style="margin:0 0 24px;font-size:13px;color:#6b7280;">${dateLabel}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#374151;">${greeting} here's what's happening in your neighbourhood today.</p>
              ${noteCards}
              ${viewAllButton}
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
              Neighbours Club &middot; ${address}<br/>
              You're receiving this because you're subscribed to Neighbours Notes.<br/>
              <a href="${unsubscribeUrl}" style="color:#9ca3af;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await send({
      to: subscriber.email,
      subject,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
    });
    return true;
  } catch (err) {
    console.error(`[daily-digest] Failed to send to ${subscriber.email}:`, err);
    return false;
  }
}

// ─── Order auth-expiry notification ──────────────────────────────────────────

// Helper: date + time formatted for email body (locale-specific, always America/Toronto)
export function fmtDateTime(date: Date, locale: 'en-CA' | 'fr-CA'): string {
  return date.toLocaleString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Toronto',
    timeZoneName: 'short',
  });
}

/**
 * Sent when a member's card authorization was voided because it would expire
 * before the deal closes.
 *
 * variant:
 *   'rejoin_available' — deal still OPEN, safeRejoinAt computed (Case A)
 *   'no_rejoin'        — deal still OPEN, auth too short for any window (Case B)
 *   'deal_closed'      — deal is no longer OPEN at send time (Case C)
 *
 * Copy for Case B and Case C is WORDING PENDING COMMUNICATIONS REVIEW.
 */
export async function sendOrderAuthExpired({
  to,
  memberName,
  dealTitle,
  dealSlug,
  closesAt,
  safeRejoinAt,
  variant = 'rejoin_available',
  idempotencyKey,
}: {
  to: string;
  memberName: string | null;
  dealTitle: string;
  dealSlug: string;
  closesAt: Date;
  safeRejoinAt: Date | null;
  variant?: 'rejoin_available' | 'no_rejoin' | 'deal_closed';
  idempotencyKey?: string;
}): Promise<boolean> {
  const firstName = memberName?.split(' ')[0] ?? null;
  const greetingEN = firstName ? `Hi ${firstName},` : 'Hi,';
  const greetingFR = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  const closeDateEN = fmtDateTime(closesAt, 'en-CA');
  const closeDateFR = fmtDateTime(closesAt, 'fr-CA');
  const rejoinUrl = `${APP_URL}/deals/${dealSlug}`;

  // "closes on" vs. "closed on" — past tense when deal is no longer OPEN
  const closesOrClosedEN = variant === 'deal_closed' ? 'closed on' : 'closes on';
  const closesOrClosedFR =
    variant === 'deal_closed'
      ? 'le'
      : 'prévue le';         // "scheduled for"

  // ── Case-specific rejoin sections ────────────────────────────────────────
  let rejoinSectionEN: string;
  let rejoinSectionFR: string;

  if (variant === 'rejoin_available' && safeRejoinAt) {
    // Case A: deal open, rejoin window exists
    rejoinSectionEN = `
      <p>If you'd still like to take part, you can re-join from
      <strong>${fmtDateTime(safeRejoinAt, 'en-CA')}</strong> until the deal closes:</p>
      ${btn('Re-join this deal', rejoinUrl)}`;
    rejoinSectionFR = `
      <p>Si vous souhaitez toujours participer, vous pourrez vous réinscrire à partir du
      <strong>${fmtDateTime(safeRejoinAt, 'fr-CA')}</strong> jusqu'à la fermeture de l'achat groupé&nbsp;:</p>
      ${btn('Participer de nouveau', rejoinUrl)}`;
  } else if (variant === 'no_rejoin') {
    // Case B: deal open, auth window too short for any rejoin
    rejoinSectionEN =
      p("Unfortunately, we can't hold a payment long enough for this deal, so re-joining isn't possible this time. We're sorry for the inconvenience.");
    rejoinSectionFR =
      p("Malheureusement, nous ne pouvons pas réserver le paiement assez longtemps pour cet achat groupé. Il n'est donc pas possible de vous réinscrire cette fois-ci. Nous sommes désolés pour cet inconvénient.");
  } else {
    // Case C: deal already closed
    rejoinSectionEN =
      p(`<strong>${dealTitle}</strong> has now closed, so there's nothing further you need to do. You haven't been charged, and the temporary hold on your card has been released.`);
    rejoinSectionFR =
      p(`L'achat groupé <strong>${dealTitle}</strong> est maintenant terminé; vous n'avez rien d'autre à faire. Aucun montant n'a été débité, et le blocage temporaire sur votre carte a été levé.`);
  }

  const content = `
    <!-- EN — Le français suit. -->
    ${p('<em>Le français suit.</em>', true)}
    ${h1(`Your order for ${dealTitle} was cancelled — you weren't charged`)}
    ${p(greetingEN)}
    ${p(`We've cancelled your order for <strong>${dealTitle}</strong> before any payment was taken.`)}
    ${p(
      `When you join a group buy, your bank places a temporary hold on your card until the deal closes. ` +
      `In your case, that hold would have ended before <strong>${dealTitle}</strong> ${closesOrClosedEN} ` +
      `<strong>${closeDateEN}</strong>, so we couldn't have completed your order properly.`
    )}
    ${variant !== 'deal_closed' ? p(`This doesn't mean anything is wrong with your card, and you haven't been charged. The hold has been released; depending on your bank, it may take a few days to disappear from your account.`) : ''}
    ${rejoinSectionEN}
    ${p(`Questions? Reach us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`, true)}
    ${p('Alex<br/>Neighbours Club', true)}

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>

    <!-- FR -->
    ${h1(`Votre commande pour ${dealTitle} a été annulée — aucun montant débité`)}
    ${p(greetingFR)}
    ${p(`Nous avons annulé votre commande pour <strong>${dealTitle}</strong> avant tout paiement.`)}
    ${p(
      `Quand vous participez à un achat groupé, votre banque bloque temporairement le montant sur votre carte ` +
      `jusqu'à la fermeture de l'offre. Dans votre cas, ce blocage aurait pris fin avant la fermeture de ` +
      `l'achat groupé <strong>${dealTitle}</strong>, ${closesOrClosedFR} <strong>${closeDateFR}</strong>, ` +
      `et nous n'aurions pas pu finaliser votre commande.`
    )}
    ${variant !== 'deal_closed' ? p(`Cela ne veut pas dire que votre carte pose problème, et aucun montant n'a été débité. Le blocage a été levé; selon votre banque, il pourrait prendre quelques jours à disparaître de votre compte.`) : ''}
    ${rejoinSectionFR}
    ${p(`Besoin d'aide? Écrivez-nous à <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.`, true)}
    ${p('Alex<br/>Neighbours Club', true)}
  `;

  return send({
    to,
    subject: `Your order for ${dealTitle} was cancelled — you weren't charged`,
    html: baseTemplate(content),
    idempotencyKey,
  });
}

// ─── Internal send helper ─────────────────────────────────────────────────────

async function send(params: {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}): Promise<boolean> {
  try {
    const { error } = await resend.emails.send(
      {
        from: FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
        headers: params.headers,
        replyTo: SUPPORT_EMAIL,
      },
      params.idempotencyKey ? { idempotencyKey: params.idempotencyKey } : undefined,
    );
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send email to", params.to, err);
    return false;
  }
}
