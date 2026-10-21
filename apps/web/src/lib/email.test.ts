import { test } from "node:test";
import assert from "node:assert/strict";
import { sendStagingSetupEmail, stagingEmailConfig } from "./email";

const env = {
  APP_ENV: "staging",
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "re_fixture",
  EMAIL_FROM: "AcademyOS Staging <notifications@notify.academy.nahr.dev>",
  EMAIL_REPLY_TO: "support@nahr.dev",
  EMAIL_ALLOWED_RECIPIENTS: "test@example.test",
  VERCEL_GIT_COMMIT_SHA: "a".repeat(40),
};

test("staging email refuses unrestricted recipients and unapproved senders", () => {
  for (const changes of [
    { EMAIL_ALLOWED_RECIPIENTS: "" },
    { EMAIL_ALLOWED_RECIPIENTS: "a@example.test,b@example.test" },
    { EMAIL_FROM: "someone@wrong.example" },
    { APP_ENV: "production" },
  ])
    assert.throws(() => stagingEmailConfig({ ...env, ...changes }));
});

test("retries keep one provider idempotency key and cannot inject recipients", async () => {
  const seen: RequestInit[] = [];
  const transport: typeof fetch = async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    seen.push(options!);
    return Response.json({ id: "synthetic-email-id" });
  };
  await sendStagingSetupEmail(env, transport);
  await sendStagingSetupEmail(env, transport);
  assert.equal(
    new Headers(seen[0].headers).get("Idempotency-Key"),
    new Headers(seen[1].headers).get("Idempotency-Key"),
  );
  assert.deepEqual(JSON.parse(seen[0].body as string).to, [
    "test@example.test",
  ]);
});
