import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { databaseError, onboardingKey, signProof, tokenHash, verifiedEmails } from "./onboarding";

export class JourneyError extends Error {
  constructor(public code: string, public http = 503) { super(code); }
}
export function onboardingDatabase(token?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url !== "https://snpphkenmvmhpjstbeul.supabase.co" || !key) throw new JourneyError("unavailable");
  return createClient(url, key, {
accessToken: token ? async () => token : undefined,
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }) }
});
}
export async function onboardingSession() {
  const session = await auth();
  if (!session.userId) throw new JourneyError("denied", 401);
  const token = await session.getToken();
  if (!token) throw new JourneyError("denied", 401);
  return { subject: session.userId, client: onboardingDatabase(token) };
}
export async function rpc(client: ReturnType<typeof onboardingDatabase>, name: string, args: Record<string, unknown> = {}) {
  const { data, error } = await client.rpc(name, args);
  if (error) { const code = databaseError(error.code); throw new JourneyError(code, code === "denied" ? 403 : code === "conflict" ? 409 : code === "invalid" ? 422 : 503); }
  if (data === null || Buffer.byteLength(JSON.stringify(data), "utf8") > 32768) throw new JourneyError("unavailable");
  return data;
}
export async function recipientProof(subject: string, id: string, token: string) {
  const user = await (await clerkClient()).users.getUser(subject);
  if (user.id !== subject) throw new JourneyError("denied", 403);
  return signProof("recipient", `${id}:${tokenHash(token)}`, subject, verifiedEmails(user), onboardingKey());
}
