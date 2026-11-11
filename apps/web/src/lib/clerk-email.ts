import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { stagingEmailConfig } from "./email";

const INSTANCE = "ins_3L0UyDYr4FD8mVDmMG6JXePE0KR";
const MAX_BYTES = 65536;
type Dependencies = {
  env: Record<string, string | undefined>;
  allowed: (recipient: string) => Promise<boolean>;
  transport?: typeof fetch;
  now?: () => number;
};
function result(status: number, outcome: string) {
  return Response.json({ outcome }, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

// No request/provider errors escape this boundary: they may contain an OTP.
export async function handleClerkEmail(req: Request, deps: Dependencies): Promise<Response> {
  try {
    if (req.headers.get("content-type")?.split(";")[0] !== "application/json") return result(415, "invalid");
    if (Number(req.headers.get("content-length")) > MAX_BYTES) return result(413, "invalid");
    const headers = new Headers();
    for (const key of ["svix-id", "svix-timestamp", "svix-signature"]) {
      const value = req.headers.get(key);
      if (!value || value.length > 1024) return result(401, "denied");
      headers.set(key, value);
    }
    const secret = deps.env.CLERK_EMAIL_WEBHOOK_SECRET;
    if (deps.env.APP_ENV !== "staging" || !secret?.startsWith("whsec_")) return result(503, "unavailable");
    const reader = req.body?.getReader();
    if (!reader) return result(422, "invalid");
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); return result(413, "invalid"); }
      chunks.push(value);
    }
    let event;
    try {
      event = await verifyWebhook(new NextRequest(req.url, { method: "POST", headers, body: Buffer.concat(chunks) }), { signingSecret: secret });
    } catch { return result(401, "denied"); }
    if (event.instance_id !== INSTANCE) return result(401, "denied");
    if (event.type !== "email.created") return result(200, "ignored");
    const email = event.data;
    if (email.slug !== "verification_code" || email.delivered_by_clerk === true) return result(200, "ignored");
    const age = (deps.now ?? Date.now)() - event.timestamp;
    if (!Number.isSafeInteger(event.timestamp) || age < -30000) return result(422, "invalid");
    if (age >= 9 * 60000) return result(200, "expired");
    const recipient = email.to_email_address?.trim().toLowerCase();
    const allowed = (deps.env.AUTH_EMAIL_ALLOWED_RECIPIENTS ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
    const address = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (allowed.length < 1 || allowed.length > 2 || new Set(allowed).size !== allowed.length || !allowed.every(x => address.test(x))) return result(503, "unavailable");
    if (!recipient || !allowed.includes(recipient)) return result(403, "denied");
    const code: unknown = email.data?.otp_code;
    if (email.object !== "email" || typeof email.id !== "string" || !/^ema_[A-Za-z0-9_]{1,100}$/.test(email.id) || email.delivered_by_clerk !== false || typeof code !== "string" || !/^\d{6}$/.test(code)) return result(422, "invalid");
    const config = stagingEmailConfig(deps.env);
    if (!await deps.allowed(recipient)) return result(503, "limited");
    const response = await (deps.transport ?? fetch)("https://api.resend.com/emails", {
      method: "POST", cache: "no-store", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": `academyos-clerk/${createHash("sha256").update(email.id).digest("hex")}` },
      body: JSON.stringify({ from: config.from, to: recipient, reply_to: config.reply_to,
        subject: "[AcademyOS staging] Your verification code / رمز التحقق",
        text: `Your AcademyOS staging verification code is: ${code}\nEnter it only on the AcademyOS verification screen you opened. If you did not request this code, ignore this email.\n\nرمز التحقق في بيئة اختبار AcademyOS: ${code}\nأدخله فقط في شاشة التحقق التي فتحتها. إذا لم تطلب هذا الرمز، تجاهل الرسالة.` })
    });
    if (!response.ok) return result(503, "unavailable");
    const receipt: unknown = await response.json();
    if (!receipt || typeof receipt !== "object" || !("id" in receipt) || typeof receipt.id !== "string" || !receipt.id) return result(503, "unavailable");
    return result(200, "provider_accepted");
  } catch { return result(503, "unavailable"); }
}
