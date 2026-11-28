import "server-only";
import { onboardingSession } from "./onboarding-server";
import { loadMemberships, type MembershipResult } from "./memberships";
export async function currentMemberships(): Promise<MembershipResult> {
  try {
    const { client } = await onboardingSession();
    return await loadMemberships(client);
  } catch { return { status: "unavailable" }; }
}
