import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { signProof } from "./onboarding";

export const DATABASE_ORIGIN = "https://snpphkenmvmhpjstbeul.supabase.co";
const reads = new Set(["m1_context_v1", "m1_platform_list_v1", "m1_setup_v1", "m1_operation_v1", "my_academy_memberships_v1", "i2_people_v1", "i2_candidates_v1", "i2_profile_v1", "g3_owner_list_v1", "g3_links_v1", "t4_owner_list_v1", "t4_profile_v1", "p5_list_v1", "p5_preview_v1", "p5_read_v1", "p5_dates_v1", "q6_read_v1", "q6_candidates_v1", "q6_review_v1", "q6_review_v2", "r7_list_v1", "r7_read_v1", "s8_read_v1", "s8_jobs_v1", "s8_owner_dates_v1", "s8_schedule_v1", "s8_roster_v1", "t9_read_v1", "t9_review_v1", "a10_roster_v1", "a10_history_v1", "b11_links_v1", "b11_schedule_v1", "b11_detail_v1", "c12_context_v1", "c12_list_v1", "c12_detail_v1", "c12_history_v1"]);
const writes = new Set(["m1_create_v1", "m1_save_setup_v1", "m1_manage_invitation_v1", "bootstrap_identity_v1", "i2_register_v1", "i2_operation_v1", "g3_command_v1", "g3_operation_v1", "t4_command_v1", "t4_operation_v1", "p5_create_v1", "p5_step_v1", "p5_operation_v1", "q6_save_v1", "q6_save_v2", "q6_operation_v1", "r7_create_v1", "r7_change_v1", "r7_operation_v1", "s8_create_v1", "s8_change_v1", "s8_operation_v1", "t9_save_v1", "t9_operation_v1", "a10_mark_v1", "a10_operation_v1", "c12_submit_v1", "c12_decide_v1", "c12_operation_v1"]);
export class GatewayError extends Error {
  constructor(public code: "denied" | "limited" | "unavailable", public http: number) { super(code); }
}
export function gatewayRequest(input: string | URL | Request, init?: RequestInit) {
  const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
  const method = init?.method?.toUpperCase() ?? (input instanceof Request ? input.method : "GET");
  if (url.origin !== DATABASE_ORIGIN || url.search || method !== "POST" || !url.pathname.startsWith("/rest/v1/rpc/")) throw new GatewayError("denied", 403);
  const name = url.pathname.slice("/rest/v1/rpc/".length);
  let mutating = writes.has(name);
  if (name === "m1_invitation_v1" || name === "g3_invitation_v1" || name === "t4_invitation_v1") {
    if (typeof init?.body !== "string") throw new GatewayError("denied", 403);
    const args = JSON.parse(init.body);
    mutating = (name === "g3_invitation_v1" || name === "t4_invitation_v1") ? args.act !== "review" : args.accept_op !== null && args.accept_op !== undefined;
  } else if (!mutating && !reads.has(name)) throw new GatewayError("denied", 403);
  return { target: `${method}:/rpc/${name}`, mutating };
}

// Server-only caller supplies the key getter and shared external limiter. No
// proof is minted when the limiter denies, times out or throws.
export function gatewayFetch(subject: string, key: () => string, allowed: (mutating: boolean, target: string) => Promise<boolean>, send: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const { target, mutating } = gatewayRequest(input, init);
    if (!await allowed(mutating, target)) throw new GatewayError("limited", 429);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set("x-academyos-gateway", JSON.stringify(signProof("gateway", target, subject, [], key())));
    return send(input, { ...init, headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(10000) });
  };
}

export function exchangeNetworkKey(headers: Headers, key: string, hosted: boolean) {
  const ip = hosted ? headers.get("x-vercel-forwarded-for") : "local-development";
  if (!ip || (hosted && !isIP(ip))) throw new GatewayError("unavailable", 503);
  return createHmac("sha256", key).update(`exchange-network:v1:${ip.toLowerCase()}`).digest("hex");
}
