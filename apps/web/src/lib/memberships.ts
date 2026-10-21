export type Membership = {
  membership_id: string;
  academy_id: string;
  academy_name: string;
  role: string;
};
export type MembershipResult =
  | { status: "ready"; memberships: Membership[] }
  | { status: "unavailable" };
export async function loadMemberships(client: {
  rpc: (name: string) => PromiseLike<{ data: unknown; error: unknown }>;
}): Promise<MembershipResult> {
  try {
    const boot = await client.rpc("bootstrap_identity_v1");
    if (boot.error) return { status: "unavailable" };
    const result = await client.rpc("my_academy_memberships_v1");
    if (result.error || !Array.isArray(result.data))
      return { status: "unavailable" };
    const roles = ["owner", "manager", "trainer", "guardian", "player"];
    if (
      !result.data.every(
        (m) =>
          m &&
          [m.membership_id, m.academy_id, m.academy_name].every(
            (v) => typeof v === "string",
          ) &&
          roles.includes(m.role),
      )
    )
      return { status: "unavailable" };
    return { status: "ready", memberships: result.data };
  } catch {
    return { status: "unavailable" };
  }
}
