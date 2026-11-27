import assert from "node:assert/strict";
import { test } from "node:test";
import { deliverFictionalBillingNotification } from "./billing-notification-test-delivery";

const env = {
  APP_ENV: "staging",
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "re_fixture",
  EMAIL_FROM: "AcademyOS Staging <notifications@notify.academy.nahr.dev>",
  EMAIL_REPLY_TO: "support@nahr.dev",
  EMAIL_ALLOWED_RECIPIENTS: "nahr.platform@gmail.com",
};
const firstAttempt = Date.UTC(2026, 10, 27, 10);

function fakeStore() {
  const records = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return (records.get(key) as T | undefined) ?? null;
    },
    async set<T>(key: string, value: T, options?: { nx: true }) {
      if (!options?.nx || !records.has(key)) records.set(key, value);
    },
  };
}

test("billing test reuses the original after a lost provider reply and preserves the receipt", async () => {
  const store = fakeStore();
  const calls: { key: string | null; body: string }[] = [];
  const transport: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    calls.push({ key: new Headers(options?.headers).get("Idempotency-Key"), body: String(options?.body) });
    if (calls.length === 1) throw new Error("Response lost after acceptance");
    return Response.json({ id: "synthetic-original-receipt" });
  };
  await assert.rejects(deliverFictionalBillingNotification(env, store, transport, firstAttempt));
  const receipt = await deliverFictionalBillingNotification(env, store, transport, firstAttempt + 1000);
  assert.deepEqual(receipt, { status: "accepted", id: "synthetic-original-receipt" });
  assert.ok(calls[0].key);
  assert.deepEqual(calls[1], calls[0]);
  const payload = JSON.parse(calls[0].body);
  assert.deepEqual(payload.to, [env.EMAIL_ALLOWED_RECIPIENTS]);
  assert.match(payload.text, /fictional subscription payment/);
  assert.match(payload.text, /اشتراك افتراضي/);
  assert.deepEqual(await deliverFictionalBillingNotification(env, store, transport, firstAttempt + 86400000), receipt);
  assert.equal(calls.length, 2);
});

test("billing test refuses unapproved recipients and blocks old unknown sends", async () => {
  const store = fakeStore();
  let requests = 0;
  const transport: typeof fetch = async () => {
    requests++;
    return new Response(null, { status: 503 });
  };
  for (const overrides of [{ APP_ENV: "production" }, { EMAIL_ALLOWED_RECIPIENTS: "other@example.test" }])
    await assert.rejects(deliverFictionalBillingNotification({ ...env, ...overrides }, store, transport, firstAttempt));
  assert.equal(requests, 0);
  await assert.rejects(deliverFictionalBillingNotification(env, store, transport, firstAttempt));
  assert.deepEqual(await deliverFictionalBillingNotification(env, store, transport, firstAttempt + 43200000), { status: "review_required" });
  assert.equal(requests, 1);
});
