import { sealInvitation, openInvitation } from "@/lib/invitation-cookie";
import { NextRequest, NextResponse } from "next/server";
import { onboardingSession, recipientProof, rpc, JourneyError } from "@/lib/onboarding-server";
import { invitationToken, onboardingKey, tokenHash, uuidPattern } from "@/lib/onboarding";
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from "@/lib/rate-limit";
import { dispatchInvitation } from "@/lib/onboarding-delivery";
import { STAGING_AUTH_ORIGINS } from "@/lib/config";
export const dynamic = "force-dynamic";
function response(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } }); }
function id(x: unknown) { if (typeof x !== "string" || !uuidPattern.test(x)) throw new JourneyError("invalid", 422); return x.toLowerCase(); }
function text(x: unknown, max = 160) { if (typeof x !== "string" || !x.trim() || x.trim().length > max) throw new JourneyError("invalid", 422); return x.trim(); }
export async function POST(req: NextRequest) {
  const started = performance.now();
  let phase = "request", phaseStarted = started;
  const timings: string[] = [];
  function enterPhase(next: string) {
    const now = performance.now();
    timings.push(`${phase};dur=${(now - phaseStarted).toFixed(1)}`);
    phase = next; phaseStarted = now;
  }
  function finish(data: unknown, status = 200) {
    const now = performance.now(), res = response(data, status);
    res.headers.set("Server-Timing", [...timings, `${phase};dur=${(now - phaseStarted).toFixed(1)}`, `total;dur=${(now - started).toFixed(1)}`].join(", "));
    return res;
  }
  try {
    const origin = req.headers.get("origin");
    if (!origin || !STAGING_AUTH_ORIGINS.includes(origin) || origin !== req.nextUrl.origin || req.headers.get("content-type")?.split(";")[0] !== "application/json") throw new JourneyError("denied", 403);
    if (Number(req.headers.get("content-length")) > 16384) throw new JourneyError("invalid", 413);
    const reader = req.body?.getReader(); if (!reader) throw new JourneyError("invalid", 422);
    let raw = ""; const decoder = new TextDecoder(); let bytes = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 16384) { await reader.cancel(); throw new JourneyError("invalid", 413); } raw += decoder.decode(value, { stream: true }); }
    const b = JSON.parse(raw); if (!b || typeof b !== "object" || Array.isArray(b)) throw new JourneyError("invalid", 422);
    if (b.action === "exchange") {
      const value = sealInvitation(id(b.invitation), text(b.token, 64), onboardingKey());
      const res = finish({ data: { exchanged: true } });
      res.cookies.set("m1_invitation", value, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "strict", path: "/api/onboarding", maxAge: 900 });
      return res;
    }
    enterPhase("session");
    const { subject, client } = await onboardingSession();
    enterPhase("rate-limit");
    const mutating = ["create", "accept", "save", "revoke", "reissue", "retry"].includes(b.action);
    const limit = await stagingLimiter(stagingRedis(), mutating ? "onboarding-write" : "onboarding-read", mutating ? 10 : 60).limit(rateLimitSubject(subject));
    if (!rateLimitAllowed(limit)) throw new JourneyError("limited", 429);
    enterPhase("operation");
    let data: unknown;
    switch (b.action) {
      case "context": data = await rpc(client, "m1_context_v1", { after_id: b.after ? id(b.after) : null }); break;
      case "platform": data = await rpc(client, "m1_platform_list_v1", { after_id: b.after ? id(b.after) : null }); break;
      case "setup": data = await rpc(client, "m1_setup_v1", { a: id(b.academy) }); break;
      case "operation": data = await rpc(client, "m1_operation_v1", { op: id(b.op) }); break;
      case "create": {
        const invitation = id(b.invitation), email = text(b.email, 254).toLowerCase();
        if (!/^[^\s,@]+@[^\s,@]+\.[^\s,@]+$/.test(email)) throw new JourneyError("invalid", 422);
        const token = invitationToken(invitation, 1, onboardingKey());
        data = await rpc(client, "m1_create_v1", { op: id(b.op), invitation_id: invitation, academy_name: text(b.name), recipient: email, token_hash: tokenHash(token) });
        // The durable invitation remains queued if publication fails. Explicit retry repairs it.
        try { await dispatchInvitation(invitation, 1); } catch { }
        break;
      }
      case "review": case "accept": {
        const key = onboardingKey();
        let handoff: { invitation: string; token: string };
        try { handoff = openInvitation(req.cookies.get("m1_invitation")?.value ?? "", key); } catch { throw new JourneyError("invalid", 422); }
        const { invitation, token } = handoff;
        if (!/^[a-f0-9]{64}$/.test(token)) throw new JourneyError("invalid", 422);
        data = await rpc(client, "m1_invitation_v1", { invitation_id: invitation, token, proof: await recipientProof(subject, invitation, token), accept_op: b.action === "accept" ? id(b.op) : null }); break;
      }
      case "save": {
        if (!Number.isSafeInteger(b.version) || b.version < 0 || !["branch", "sport", "complete"].includes(b.step) || !b.fields || Array.isArray(b.fields) || typeof b.fields !== "object") throw new JourneyError("invalid", 422);
        data = await rpc(client, "m1_save_setup_v1", { a: id(b.academy), op: id(b.op), expected_version: b.version, step: b.step, fields: b.fields }); break;
      }
      case "revoke": case "reissue": case "retry": {
        const invitation = id(b.invitation); if (!Number.isSafeInteger(b.generation) || b.generation < 1) throw new JourneyError("invalid", 422);
        data = await rpc(client, "m1_manage_invitation_v1", { invitation_id: invitation, op: id(b.op), expected_generation: b.generation, act: b.action, token_hash: b.action === "reissue" ? tokenHash(invitationToken(invitation, b.generation + 1, onboardingKey())) : null });
        if (b.action !== "revoke") try { await dispatchInvitation(invitation, b.generation + (b.action === "reissue" ? 1 : 0)); } catch { }
        break;
      }
      default: throw new JourneyError("invalid", 422);
    }
    return finish({ data });
  } catch (e) { if (e instanceof JourneyError) return finish({ error: e.code }, e.http); if (e instanceof SyntaxError) return finish({ error: "invalid" }, 422); console.error("onboarding.unavailable", { phase }); return finish({ error: "unavailable" }, 503); }
}
