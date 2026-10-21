import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStaging, authenticationConfigured } from "./config";
test("unconfigured authentication stays unavailable", () =>
  assert.equal(authenticationConfigured({}), false));
test("staging rejects production and wrong service bindings", () => {
  for (const env of [
    { APP_ENV: "production" },
    { APP_ENV: "staging", SUPABASE_PROJECT_REF: "wrong" },
    { APP_ENV: "staging", CLERK_ISSUER_URL: "https://wrong.example" },
    {
      APP_ENV: "staging",
      CLERK_SECRET_KEY: "sk_live_fixture",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_fixture",
    },
    { APP_ENV: "staging", CLERK_SECRET_KEY: "sk_test_fixture" },
    { APP_ENV: "staging", NEXT_PUBLIC_APP_URL: "https://wrong.example" },
    {
      APP_ENV: "staging",
      VERCEL_ENV: "production",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  ])
    assert.throws(() => validateStaging(env));
});
test("staging without credentials builds safely", () =>
  assert.doesNotThrow(() => validateStaging({ APP_ENV: "staging" })));
