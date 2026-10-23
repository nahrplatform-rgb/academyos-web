import { createHash, createHmac } from "node:crypto";

export const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function onboardingKey(env: Record<string, string | undefined> = process.env) {
  const key = env.ONBOARDING_PROOF_KEY;
  if (env.APP_ENV !== "staging" || !key || !/^[a-f0-9]{64}$/.test(key))
    throw new Error("Onboarding is not configured");
  return key;
}
export function invitationToken(id: string, generation: number, key: string) {
  if (!uuidPattern.test(id) || !Number.isSafeInteger(generation) || generation < 1)
    throw new Error("Invalid invitation");
  return createHmac("sha256", key).update(`invitation:v1:${id.toLowerCase()}:${generation}`).digest("hex");
}
export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function signProof(purpose: "recipient" | "delivery" | "gateway", target: string, subject: string, emails: string[], key: string, issued = Math.floor(Date.now() / 1000)) {
  if (!/^user_[a-zA-Z0-9_]+$/.test(subject) || [purpose, target, subject, ...emails].some(v => /[\n\r,]/.test(v)))
    throw new Error("Invalid proof fields");
  const values = [...new Set(emails.map(x => x.toLowerCase()))].sort().join(",");
  return {
    purpose, target, subject, emails: values, issued,
    signature: createHmac("sha256", key).update([purpose, target, subject, String(issued), values].join("\n")).digest("hex")
  };
}
export function verifiedEmails(user: { emailAddresses: { emailAddress: string; verification: { status: string } | null }[] }) {
  return user.emailAddresses.filter(e => e.verification?.status === "verified")
    .map(e => e.emailAddress.toLowerCase()).filter(e => /^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(e)).slice(0, 10);
}
export type OnboardingError = "denied" | "invalid" | "conflict" | "unavailable" | "limited";
export function databaseError(code?: string): OnboardingError {
  if (code === "42501") return "denied";
  if (["PT409", "40001", "23505"].includes(code ?? "")) return "conflict";
  if (["22023", "22P02", "23514"].includes(code ?? "")) return "invalid";
  return "unavailable";
}
