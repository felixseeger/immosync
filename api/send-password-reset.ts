/**
 * POST /api/send-password-reset
 * Body: { email: string }
 * Generates Firebase password reset link (Admin SDK) and sends it via Resend.
 * Env: RESEND_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string), APP_URL
 * Self-contained (no ../src) so Vercel serverless can load it.
 */
import { getAuth } from "firebase-admin/auth";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { Resend } from "resend";

type VercelRes = { status: (code: number) => { json: (data: object) => void } };
function sendJson(res: VercelRes, status: number, data: object) {
  res.status(status).json(data);
}

function getFirebaseAuth() {
  if (getApps().length > 0) return getAuth();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not set");
  let cred: ServiceAccount;
  try {
    cred = JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON invalid JSON");
  }
  initializeApp({ credential: cert(cred) });
  return getAuth();
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendResetEmail(to: string, resetLink: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY || (process.env as Record<string, string>).RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    (process.env as Record<string, string>).EMAIL_ADRESSS ||
    "no-reply@immosync.felixseeger.de";
  const from = `IMMOSYNC <${fromEmail}>`;
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
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to: [to], subject, text, html });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export default async function handler(
  req: { method?: string; body?: Record<string, unknown> },
  res: VercelRes
) {
  try {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }
    const body = typeof req.body === "object" && req.body !== null ? req.body : {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      sendJson(res, 400, { ok: false, error: "email required" });
      return;
    }
    const appUrl = process.env.APP_URL || "https://immosync.felixseeger.de";
    const continueUrl = appUrl.replace(/\/$/, "") + "/";
    const auth = getFirebaseAuth();
    const link = await auth.generatePasswordResetLink(email, { url: continueUrl });
    const result = await sendResetEmail(email, link);
    if (!result.ok) {
      sendJson(res, 500, { ok: false, error: result.error || "Resend failed to send email" });
      return;
    }
    sendJson(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const code = err && typeof err === "object" && "code" in err ? String((err as { code: string }).code) : "";
    const isUserNotFound =
      code === "auth/user-not-found" ||
      code === "auth/invalid-email" ||
      /EMAIL_NOT_FOUND|user-not-found|no user record/i.test(message);
    if (isUserNotFound) {
      sendJson(res, 200, { ok: true });
      return;
    }
    sendJson(res, 500, { ok: false, error: message || "Server error" });
  }
}
