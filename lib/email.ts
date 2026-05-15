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
const FROM = process.env.EMAIL_FROM ?? "Neighbours Club <hello@neighboursclub.ca>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCad(amount: number): string {
  return amount.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }) + " CAD";
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
          <tr>
            <td style="padding-top:24px;font-size:12px;color:#9ca3af;text-align:center;">
              Neighbours Club &middot; Kanata, Ottawa<br/>
              You received this email because you have an account with Neighbours Club.<br/>
              To manage email preferences, <a href="${APP_URL}/account" style="color:#9ca3af;">visit your account</a>.
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
}) {
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

  await send({
    to,
    subject: `Great news — ${dealTitle} is happening!`,
    html,
  });
}

/**
 * 3. DEAL_CLOSED_FAILED — sent to members whose orders were voided (threshold not met)
 */
export async function sendDealClosedFailed(params: {
  to: string;
  memberName: string;
  dealTitle: string;
}) {
  const { to, memberName, dealTitle } = params;

  const html = baseTemplate(`
    ${h1(`${dealTitle} didn't reach the minimum — no charge`)}
    ${p(`Hi ${memberName}, unfortunately ${dealTitle} didn't reach the minimum number of members needed to run.`)}
    ${p("Your card hold has been released automatically. You have not been charged anything.")}
    ${p("Check out other active deals — there might be something else you'll love.", true)}
    ${btn("Browse deals", `${APP_URL}/deals`)}
  `);

  await send({
    to,
    subject: `${dealTitle} didn't reach the minimum — no charge`,
    html,
  });
}

/**
 * 4. ORDER_CAPTURE_FAILED — sent when a payment capture fails during closure
 */
export async function sendOrderCaptureFailed(params: {
  to: string;
  memberName: string;
  dealTitle: string;
  amountOwed: number;
  recoveryToken: string;
}) {
  const { to, memberName, dealTitle, amountOwed, recoveryToken } = params;
  const recoveryUrl = `${APP_URL}/recover-payment/${recoveryToken}`;

  const html = baseTemplate(`
    ${h1(`Action needed — payment issue on ${dealTitle}`)}
    ${p(`Hi ${memberName}, the deal succeeded but we were unable to process your payment.`)}
    ${dl([
      ["Deal", dealTitle],
      ["Amount due", fmtCad(amountOwed)],
    ])}
    ${p("Please complete your payment within <strong>48 hours</strong> to keep your spot in the deal.")}
    ${btn("Complete payment now", recoveryUrl)}
    ${p("If you need help, reply to this email or contact us at support@neighboursclub.ca.", true)}
  `);

  await send({
    to,
    subject: `Action needed — payment issue on ${dealTitle}`,
    html,
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

// ─── Internal send helper ─────────────────────────────────────────────────────

async function send(params: {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      headers: params.headers,
    });
    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Failed to send email to", params.to, err);
  }
}
