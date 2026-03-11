/**
 * Vercel serverless: POST /api/send-welcome
 * Body: { email: string, firstName: string, loginLink?: string, bookingLink?: string }
 * Env: RESEND_API_KEY, RESEND_FROM_EMAIL or EMAIL_ADRESSS, APP_URL
 */
import type { IncomingMessage, ServerResponse } from "http";
import { sendWelcomeEmail } from "../src/services/emailService";

type Req = IncomingMessage & { method?: string; body?: Record<string, unknown> };
type Res = ServerResponse;

function sendJson(res: Res, status: number, data: object) {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Method not allowed" });
    return;
  }

  const body = (req as Req).body ?? (await readBody(req));
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";

  if (!email || !firstName) {
    sendJson(res, 400, { ok: false, error: "email and firstName required" });
    return;
  }

  const appUrl = process.env.APP_URL || "https://immosync.felixseeger.de";
  const loginLink = typeof body.loginLink === "string" ? body.loginLink : appUrl.replace(/\/$/, "");
  const bookingLink = typeof body.bookingLink === "string" ? body.bookingLink : undefined;

  const result = await sendWelcomeEmail(email, { firstName, loginLink, bookingLink });

  if (!result.ok) {
    sendJson(res, 500, { ok: false, error: result.error });
    return;
  }
  sendJson(res, 200, { ok: true, id: result.id });
}
