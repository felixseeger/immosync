/**
 * POST /api/send-password-reset
 * Body: { email: string }
 * Generates Firebase password reset link (Admin SDK) and sends it via Resend (same sender as welcome).
 * Env: RESEND_API_KEY, FIREBASE_SERVICE_ACCOUNT_JSON (full JSON string), APP_URL
 */
import type { IncomingMessage, ServerResponse } from "http";
import * as admin from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { sendPasswordResetEmail } from "../src/services/emailService";

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
  initializeApp({ credential: admin.credential.cert(cred) });
  return getAuth();
}

export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== "POST") {
      sendJson(res, 405, { ok: false, error: "Method not allowed" });
      return;
    }

    const body = (req as Req).body ?? (await readBody(req));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      sendJson(res, 400, { ok: false, error: "email required" });
      return;
    }

    const appUrl = process.env.APP_URL || "https://immosync.felixseeger.de";
    const continueUrl = appUrl.replace(/\/$/, "") + "/";

    const auth = getFirebaseAuth();
    const link = await auth.generatePasswordResetLink(email, { url: continueUrl });
    const result = await sendPasswordResetEmail(email, link);
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
