import test from "node:test";
import assert from "node:assert/strict";
import { DATABASE_ORIGIN, exchangeNetworkKey, gatewayFetch, gatewayRequest, GatewayError } from "./onboarding-gateway";
import { signProof } from "./onboarding";
import { createClient } from "@supabase/supabase-js";
import { rateLimitAllowed } from "./rate-limit";
const key = "a".repeat(64);
const url = (name: string) => `${DATABASE_ORIGIN}/rest/v1/rpc/${name}`;
const post = (body: unknown = {}) => ({ method: "POST", body: JSON.stringify(body) });

test("gateway exhaust/timeout/unavailable never signs or sends a database call", async () => {
  let signed = 0, sent = 0;
  const send: typeof fetch = async () => { sent++; return Response.json({}); };
  for (const result of [{success:false}, {success:true,reason:"timeout"}]) {
    const call = gatewayFetch("user_A", () => { signed++; return key; }, async () => rateLimitAllowed(result), send);
    await assert.rejects(call(url("m1_setup_v1"), post()), e => e instanceof GatewayError && e.http === 429);
  }
  const unavailable = gatewayFetch("user_A", () => { signed++; return key; }, async () => { throw new Error("Redis unavailable"); }, send);
  await assert.rejects(unavailable(url("m1_setup_v1"), post()));
  assert.equal(signed, 0); assert.equal(sent, 0);
});

test("gateway spends the right actor budget and signs only outbound subject/method/path", async () => {
  const budgets: boolean[] = [];
  const seen: { headers: Headers; path: string; redirect: RequestRedirect | undefined }[] = [];
  const call = gatewayFetch("user_A", () => key, async mutating => { budgets.push(mutating); return true; }, async (input, init) => {
    seen.push({headers:new Headers(init?.headers),path:new URL(String(input)).pathname,redirect:init?.redirect});
    return Response.json({version:3});
  });
  for (const [name, args] of [["m1_setup_v1",{}],["m1_invitation_v1",{accept_op:null}],["m1_invitation_v1",{accept_op:"operation"}],["m1_save_setup_v1",{}],["bootstrap_identity_v1",{}],["my_academy_memberships_v1",{}]] as const) {
    const response = await call(url(name), {...post(args), headers:{authorization:"Bearer synthetic", "x-academyos-gateway":"caller forged"}});
    assert.deepEqual(await response.json(), {version:3});
    assert.equal(response.headers.has("x-academyos-gateway"), false);
  }
  assert.deepEqual(budgets,[false,false,true,true,true,false]);
  for (const {headers,path,redirect} of seen) {
    const proof = JSON.parse(headers.get("x-academyos-gateway")!);
    assert.deepEqual(proof, signProof("gateway", `POST:${path.replace('/rest/v1','')}`, "user_A", [], key, proof.issued));
    assert.equal(headers.get("authorization"), "Bearer synthetic"); assert.equal(redirect,"error");
    assert.notEqual(proof.signature,signProof("gateway",proof.target,"user_B",[],key,proof.issued).signature);
    assert.notEqual(proof.signature,signProof("recipient",proof.target,"user_A",[],key,proof.issued).signature);
  }
});

test("gateway refuses alternative origins, query calls, methods and unknown RPCs before budget", async () => {
  let counted = 0;
  const call = gatewayFetch("user_A", () => key, async () => { counted++; return true; });
  for (const [address,init] of [["https://attacker.example/rest/v1/rpc/m1_setup_v1",post()], [url("m1_setup_v1")+"?a=other",post()], [url("m1_setup_v1"),{method:"GET"}], [url("other_function"),post()]] as const) {
    await assert.rejects(call(address,init), GatewayError);
  }
  assert.equal(counted,0);
  assert.equal(gatewayRequest(url("m1_operation_v1"),post()).mutating,false);
});

test("exchange network budget uses only the hosted trusted IP; local ignores spoofed headers", () => {
  const a = new Headers({"x-vercel-forwarded-for":"192.0.2.1","x-forwarded-for":"203.0.113.2"});
  const b = new Headers({"x-vercel-forwarded-for":"192.0.2.1","x-forwarded-for":"203.0.113.99"});
  assert.equal(exchangeNetworkKey(a,key,true),exchangeNetworkKey(b,key,true));
  assert.match(exchangeNetworkKey(a,key,true),/^[a-f0-9]{64}$/);
  assert.notEqual(exchangeNetworkKey(a,key,true),exchangeNetworkKey(a,"b".repeat(64),true));
  for (const ip of [null,"", "192.0.2.1, 203.0.113.1", "not-an-ip"]) {
    assert.throws(() => exchangeNetworkKey(ip === null ? new Headers() : new Headers({"x-vercel-forwarded-for":ip}),key,true), GatewayError);
  }
  assert.equal(exchangeNetworkKey(a,key,false),exchangeNetworkKey(new Headers(),key,false));
});


test("actual Supabase transport preserves gateway denial and expected POST path", async () => {
  const denied = createClient(DATABASE_ORIGIN, "synthetic-publishable-key", {
    accessToken: async () => "synthetic-user-token",
    global: { fetch: gatewayFetch("user_A", () => key, async () => false) },
  });
  await assert.rejects(async () => await denied.rpc("m1_setup_v1", {a:"synthetic"}).throwOnError(), e => e instanceof GatewayError && e.http === 429);
  let sent = 0;
  const allowed = createClient(DATABASE_ORIGIN, "synthetic-publishable-key", {
    accessToken: async () => "synthetic-user-token",
    global: { fetch: gatewayFetch("user_A", () => key, async () => true, async (input,init) => {
      assert.equal(gatewayRequest(input,init).target,"POST:/rpc/m1_setup_v1");
      assert.equal(new Headers(init?.headers).get("authorization"),"Bearer synthetic-user-token");
      sent++; return Response.json({version:3});
    }) },
  });
  assert.deepEqual((await allowed.rpc("m1_setup_v1", {a:"synthetic"}).throwOnError()).data,{version:3});
  assert.equal(sent,1);
});

 test("attendance gateway forwards the exact reviewed target to budget selection", async () => {
 let seen = "";
 const call = gatewayFetch("user_A", () => "a".repeat(64), async (write, target) => { assert.equal(write,true); seen=target; return false; }, async () => { throw new Error("Must not send"); });
 await assert.rejects(call("https://snpphkenmvmhpjstbeul.supabase.co/rest/v1/rpc/a10_mark_v1", {method:"POST"}));
 assert.equal(seen,"POST:/rpc/a10_mark_v1");
 });
