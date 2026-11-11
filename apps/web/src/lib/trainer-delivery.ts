import "server-only";
import { Receiver } from "@upstash/qstash";
import { stagingJobPublisher } from "./jobs";
import { stagingEmailConfig } from "./email";
import { STAGING_ORIGIN } from "./config";
import { onboardingKey, signProof } from "./onboarding";
import { onboardingDatabase, rpc } from "./onboarding-server";
import { trainerToken, trainerRecipientAllowed } from './trainers';
export const INVITATION_CALLBACK = `${STAGING_ORIGIN}/api/jobs/trainers`;
export async function dispatchTrainer(invitation: string) {
  await stagingJobPublisher().publishJSON({ url: INVITATION_CALLBACK, body: { invitation }, headers: process.env.JOB_PROTECTION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.JOB_PROTECTION_BYPASS_SECRET } : {}, timeout: 15, retries: 4 });
}
export async function verifyTrainerDelivery(body: string, signature: string) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY, nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey || !signature) return false;
  try { return await new Receiver({ currentSigningKey, nextSigningKey }).verify({ body, signature, url: INVITATION_CALLBACK, clockTolerance: 5 }); } catch { return false; }
}
export async function deliverTrainer(invitation: string) {
  const key = onboardingKey(), client = onboardingDatabase();
  const proof = (lease: string | null, outcome: string | null) => signProof("delivery", `trainer:${invitation}:1:${lease ?? "claim"}:${outcome ?? ""}`, "user_delivery_worker", [], key);
  const result = await rpc(client, "t4_delivery_v1", { invitation, proof: proof(null, null) }) as { send: boolean; retry?: boolean; lease: string; recipient: string };
  if (result.retry) throw new Error("Delivery lease active");
  if (!result.send) return;
  let outcome = "blocked", provider: string | null = null;
  try {
    const config = stagingEmailConfig(process.env);
    if (!trainerRecipientAllowed(result.recipient) || !config.to.includes(result.recipient)) { outcome = "blocked"; }
    else {
      const token = trainerToken(invitation, key);
      // Token is a fragment: no server access log, referrer or query parameter contains it.
      const link = `${STAGING_ORIGIN}/en/trainer-invitation#${invitation}.${token}`;
      outcome = "unknown";
      const res = await fetch("https://api.resend.com/emails", {
method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": `academyos-trainer/${invitation}/1` },
        body: JSON.stringify({ from: config.from, to: result.recipient, reply_to: config.reply_to, subject: "[AcademyOS staging] Trainer appointment / دعوة مدرب", text: `Synthetic staging only. You have been offered Trainer access to your own fictional staff name, Trainer role and assigned branch only. Sign in with your intended verified email and review before accepting. No player, salary or Owner access is granted. This invitation expires in 72 hours.\n\nبيئة اختبار فقط. دعوة مدرب لعرض اسمك الوظيفي الخيالي ودور المدرب والفرع المحدد فقط. سجّل الدخول ببريدك الموثق وراجع قبل القبول. لا صلاحية للاعبين أو الراتب أو أدوات المالك. تنتهي الدعوة خلال ٧٢ ساعة.\n\n${link}` }), signal: AbortSignal.timeout(10000), cache: "no-store"
});
      if (res.ok) { const value = await res.json(); if (typeof value.id === "string") { outcome = "accepted"; provider = value.id; } }
      else if (res.status >= 400 && res.status < 500 && res.status !== 429) { outcome = "failed"; }
    }
  } catch { /* Unknown provider outcome must not trigger an uncorrelated replacement send. */ }
  await rpc(client, "t4_delivery_v1", { invitation, proof: proof(result.lease, outcome), lease: result.lease, outcome, provider });
}
