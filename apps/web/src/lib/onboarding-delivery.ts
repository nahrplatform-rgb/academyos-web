import "server-only";
import { Receiver } from "@upstash/qstash";
import { stagingJobPublisher } from "./jobs";
import { stagingEmailConfig } from "./email";
import { STAGING_ORIGIN } from "./config";
import { invitationToken, onboardingKey, signProof } from "./onboarding";
import { onboardingDatabase, rpc } from "./onboarding-server";
export const INVITATION_CALLBACK = `${STAGING_ORIGIN}/api/jobs/invitations`;
export async function dispatchInvitation(invitation: string, generation: number) {
  await stagingJobPublisher().publishJSON({ url: INVITATION_CALLBACK, body: { invitation, generation }, headers: process.env.JOB_PROTECTION_BYPASS_SECRET ? { "x-vercel-protection-bypass": process.env.JOB_PROTECTION_BYPASS_SECRET } : {}, timeout: 15, retries: 4 });
}
export async function verifyInvitationDelivery(body: string, signature: string) {
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY, nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey || !signature) return false;
  try { return await new Receiver({ currentSigningKey, nextSigningKey }).verify({ body, signature, url: INVITATION_CALLBACK, clockTolerance: 5 }); } catch { return false; }
}
export async function deliverInvitation(invitation: string, generation: number) {
  const key = onboardingKey(), client = onboardingDatabase();
  const proof = (lease: string | null, outcome: string | null) => signProof("delivery", `${invitation}:${generation}:${lease ?? "claim"}:${outcome ?? ""}`, "user_delivery_worker", [], key);
  const result = await rpc(client, "m1_delivery_v1", { invitation_id: invitation, generation, proof: proof(null, null) }) as { send: boolean; retry?: boolean; lease: string; recipient: string };
  if (result.retry) throw new Error("Delivery lease active");
  if (!result.send) return;
  let outcome = "blocked", provider: string | null = null;
  try {
    const config = stagingEmailConfig(process.env);
    if (!config.to.includes(result.recipient)) { outcome = "blocked"; }
    else {
      const token = invitationToken(invitation, generation, key);
      // Token is a fragment: no server access log, referrer or query parameter contains it.
      const link = `${STAGING_ORIGIN}/en/invitation#${invitation}.${token}`;
      outcome = "unknown";
      const res = await fetch("https://api.resend.com/emails", {
method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": `academyos-owner/${invitation}/${generation}` },
        body: JSON.stringify({ from: config.from, to: result.recipient, reply_to: config.reply_to, subject: "[AcademyOS staging] Academy Owner invitation / دعوة مالك الأكاديمية", text: `Synthetic staging only. You have been invited as Academy Owner. Sign in with your intended verified email and review the academy before accepting. This invitation expires in 72 hours.\n\nبيئة اختبار فقط. تمت دعوتك بصفة مالك الأكاديمية. سجّل الدخول بالبريد الموثق المقصود وراجع الأكاديمية قبل القبول. تنتهي صلاحية الدعوة خلال ٧٢ ساعة.\n\n${link}` }), signal: AbortSignal.timeout(10000), cache: "no-store"
});
      if (res.ok) { const value = await res.json(); if (typeof value.id === "string") { outcome = "accepted"; provider = value.id; } }
      else if (res.status >= 400 && res.status < 500 && res.status !== 429) { outcome = "failed"; }
    }
  } catch { /* Unknown provider outcome must not trigger an uncorrelated replacement send. */ }
  await rpc(client, "m1_delivery_v1", { invitation_id: invitation, generation, proof: proof(result.lease, outcome), lease: result.lease, outcome, provider });
}
