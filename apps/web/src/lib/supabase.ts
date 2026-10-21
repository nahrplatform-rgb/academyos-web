import "server-only";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { loadMemberships, type MembershipResult } from "./memberships";
export async function currentMemberships(): Promise<MembershipResult> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || url !== "https://snpphkenmvmhpjstbeul.supabase.co")
    return { status: "unavailable" };
  const session = await auth();
  if (!session.userId) return { status: "unavailable" };
  const token = await session.getToken();
  if (!token) return { status: "unavailable" };
  const client = createClient(url, key, {
    accessToken: async () => token,
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        }),
    },
  });
  return loadMemberships(client);
}
