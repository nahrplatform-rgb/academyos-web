import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { databaseError, onboardingKey, signProof, tokenHash, verifiedEmails } from "./onboarding";

import { gatewayFetch, GatewayError } from "./onboarding-gateway";
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from "./rate-limit";

export class JourneyError extends Error {
  constructor(public code: string, public http = 503) { super(code); }
}
export function onboardingDatabase(token?: string, subject?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url !== "https://snpphkenmvmhpjstbeul.supabase.co" || !key) throw new JourneyError("unavailable");
  if (Boolean(token) !== Boolean(subject)) throw new JourneyError("denied", 403);
  const transport = subject ? gatewayFetch(subject, onboardingKey, async (mutating, target) => {
    const attendanceWrite = mutating && ["POST:/rpc/a10_mark_v1", "POST:/rpc/a10_register_v1", "POST:/rpc/a10_operation_v1", "POST:/rpc/q13_capture_v1", "POST:/rpc/q13_operation_v1"].includes(target);
    const result = await stagingLimiter(stagingRedis(), attendanceWrite ? "attendance-write" : mutating ? "onboarding-write" : "onboarding-read", attendanceWrite ? 60 : mutating ? 10 : 60).limit(rateLimitSubject(subject));
    return rateLimitAllowed(result);
  }) : fetch;
  return createClient(url, key, {
accessToken: token ? async () => token : undefined,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => transport(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }) }
});
}
export async function onboardingSession() {
  const session = await auth();
  if (!session.userId) throw new JourneyError("denied", 401);
  const token = await session.getToken();
  if (!token) throw new JourneyError("denied", 401);
  return { subject: session.userId, client: onboardingDatabase(token, session.userId) };
}
export async function rpc(client: ReturnType<typeof onboardingDatabase>, name: string, args: Record<string, unknown> = {}) {
  let data: unknown, error: { code?: string } | undefined;
  try { ({ data } = await client.rpc(name, args).throwOnError()); }
  catch (cause) {
    if (cause instanceof GatewayError) throw cause;
    error = cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string" ? { code: cause.code } : {};
  }
  if (error) {
    const code = databaseError(error.code);
    // Codes only: never log provider messages, claims, tokens or input fields.
    if (code === "unavailable") console.error("onboarding.rpc_unavailable", { code: /^[A-Z0-9]{5,10}$/.test(error.code ?? "") ? error.code : "unknown" });
    throw new JourneyError(code, code === "denied" ? 403 : ["conflict", "review_required"].includes(code) ? 409 : code === "setup_required" ? 428 : code === "invalid" ? 422 : 503);
  }
  if (data === null || Buffer.byteLength(JSON.stringify(data), "utf8") > 32768) throw new JourneyError("unavailable");
  return data;
}
export async function recipientProof(subject: string, id: string, token: string) {
  const user = await (await clerkClient()).users.getUser(subject);
  if (user.id !== subject) throw new JourneyError("denied", 403);
  return signProof("recipient", `${id}:${tokenHash(token)}`, subject, verifiedEmails(user), onboardingKey());
}
