import "server-only";
import { Receiver } from "@upstash/qstash";
import { stagingJobPublisher } from "./jobs";
import { stagingEmailConfig } from "./email";
import { STAGING_ORIGIN } from "./config";
import { onboardingKey, signProof } from "./onboarding";
import { onboardingDatabase, rpc } from "./onboarding-server";
import { guardianToken, guardianRecipientAllowed } from './guardians';
export const INVITATION_CALLBACK = `${STAGING_ORIGIN}/api/jobs/guardians`;
export async function dispatchGuardian(invitation: string) {
  await stagingJobPublisher().publishJSON({ url: INVITATION_CALLBACK, body: { invitation }, headers: process.env.JOB_PROTECTION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.JOB_PROTECTION_BYPASS_SECRET } : {}, timeout: 15, retries: 4 });
}
export async function verifyGuardianDelivery(body: string, signature: string) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY, nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey || !signature) return false;
  try { return await new Receiver({ currentSigningKey, nextSigningKey }).verify({ body, signature, url: INVITATION_CALLBACK, clockTolerance: 5 }); } catch { return false; }
}
export async function deliverGuardian(invitation: string) {
  const key = onboardingKey(), client = onboardingDatabase();
  const proof = (lease: string | null, outcome: string | null) => signProof("delivery", `guardian:${invitation}:1:${lease ?? "claim"}:${outcome ?? ""}`, "user_delivery_worker", [], key);
  const result = await rpc(client, "g3_delivery_v1", { invitation, proof: proof(null, null) }) as { send: boolean; retry?: boolean; lease: string; recipient: string };
  if (result.retry) throw new Error("Delivery lease active");
  if (!result.send) return;
  let outcome = "blocked", provider: string | null = null;
  try {
    const config = stagingEmailConfig(process.env);
    if (!guardianRecipientAllowed(result.recipient) || !config.to.includes(result.recipient)) { outcome = "blocked"; }
    else {
      const token = guardianToken(invitation, key);
      // Token is a fragment: no server access log, referrer or query parameter contains it.
      const link = `${STAGING_ORIGIN}/en/guardian-invitation#${invitation}.${token}`;
      outcome = "unknown";
      const res = await fetch("https://api.resend.com/emails", {
method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": `academyos-guardian/${invitation}/1` },
        body: JSON.stringify({ from: config.from, to: result.recipient, reply_to: config.reply_to, subject: "[AcademyOS staging] Guardian appointment / دعوة ولي الأمر", text: `Synthetic staging only. You have been offered read-only access to one fictional player’s name and branch. Sign in with your intended verified email and review before accepting. No payer or consent authority is granted. This invitation expires in 72 hours.\n\nبيئة اختبار فقط. دعوة لعرض اسم وفرع لاعب خيالي واحد فقط. سجّل الدخول ببريدك الموثق وراجع الصلاحية قبل القبول. لا تمنح الدعوة صلاحية دفع أو موافقة قانونية. تنتهي صلاحية الدعوة خلال ٧٢ ساعة.\n\n${link}` }), signal: AbortSignal.timeout(10000), cache: "no-store"
});
      if (res.ok) { const value = await res.json(); if (typeof value.id === "string") { outcome = "accepted"; provider = value.id; } }
      else if (res.status >= 400 && res.status < 500 && res.status !== 429) { outcome = "failed"; }
    }
  } catch { /* Unknown provider outcome must not trigger an uncorrelated replacement send. */ }
  await rpc(client, "g3_delivery_v1", { invitation, proof: proof(result.lease, outcome), lease: result.lease, outcome, provider });
}
