/**
 * Email sending via Resend. Use from server only (API route, Cloud Function).
 * Do not call from browser – RESEND_API_KEY must stay server-side.
 */

import { Resend } from "resend";

const apiKey =
  typeof process !== "undefined"
    ? process.env.RESEND_API_KEY || (process.env as Record<string, string>).RESEND_API_KEY
    : "";
const fromEmail =
  (typeof process !== "undefined" &&
    (process.env.RESEND_FROM_EMAIL ||
      (process.env as Record<string, string>).EMAIL_ADRESSS)) ||
  "no-reply@immosync.felixseeger.de";

const resend = apiKey ? new Resend(apiKey) : null;

const FROM = `IMMOSYNC <${fromEmail}>`;

export type SendEmailOptions = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY not set" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      text,
      html: html || undefined,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export type WelcomeEmailVars = {
  firstName: string;
  loginLink: string;
  bookingLink?: string;
};

const defaultAppUrl =
  typeof process !== "undefined"
    ? (process.env.APP_URL || (process.env as Record<string, string>).APP_URL) || "https://immosync.felixseeger.de"
    : "https://immosync.felixseeger.de";

function renderWelcomeEmail(vars: WelcomeEmailVars): { subject: string; text: string; html: string } {
  const { firstName, loginLink, bookingLink } = vars;
  const booking = bookingLink || `${defaultAppUrl.replace(/\/$/, "")}/`;
  const subject = "Willkommen bei IMMOSYNC";
  const text = [
    `Hallo ${firstName},`,
    "",
    "willkommen bei IMMOSYNC. Sie können sich jetzt anmelden und alle Funktionen nutzen.",
    "",
    `Anmelden: ${loginLink}`,
    bookingLink ? `Zur App: ${booking}` : "",
    "",
    "Bei Fragen antworten Sie einfach auf diese E-Mail.",
    "",
    "Ihr IMMOSYNC-Team",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hallo ${escapeHtml(firstName)},</p>
  <p>willkommen bei IMMOSYNC. Sie können sich jetzt anmelden und alle Funktionen nutzen.</p>
  <p><a href="${escapeHtml(loginLink)}" style="color: #0f766e;">Jetzt anmelden</a></p>
  ${bookingLink ? `<p><a href="${escapeHtml(booking)}" style="color: #0f766e;">Zur App</a></p>` : ""}
  <p>Bei Fragen antworten Sie einfach auf diese E-Mail.</p>
  <p>Ihr IMMOSYNC-Team</p>
</body>
</html>`.trim();

  return { subject, text, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendWelcomeEmail(
  to: string,
  vars: WelcomeEmailVars
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { subject, text, html } = renderWelcomeEmail(vars);
  return sendEmail({ to, subject, text, html });
}

/** Password reset: send link via Resend (same inbox as welcome, better deliverability). */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const subject = "Passwort zurücksetzen – IMMOSYNC";
  const text = [
    "Hallo,",
    "",
    "Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link, um ein neues Passwort zu setzen:",
    "",
    resetLink,
    "",
    "Der Link ist nur begrenzt gültig. Wenn Sie die Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.",
    "",
    "Ihr IMMOSYNC-Team",
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p>Hallo,</p>
  <p>Sie haben angefordert, Ihr Passwort zurückzusetzen. Klicken Sie auf den folgenden Link, um ein neues Passwort zu setzen:</p>
  <p><a href="${escapeHtml(resetLink)}" style="color: #0f766e;">Passwort zurücksetzen</a></p>
  <p style="color: #666; font-size: 14px;">Der Link ist nur begrenzt gültig. Wenn Sie die Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail.</p>
  <p>Ihr IMMOSYNC-Team</p>
</body>
</html>`.trim();

  return sendEmail({ to, subject, text, html });
}
