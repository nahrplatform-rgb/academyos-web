import { test } from "node:test";
import assert from "node:assert/strict";
import { validateStaging, authenticationConfigured, offlineRegisterPilotEnabled, ownerWorkspaceEnabled } from "./config";
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


test("prepared-register entry requires the whole staging pilot gate", () => {
  const enabled = {APP_ENV:"staging", LOCAL_REGISTER_PILOT_ENABLED:"true",
    LOCAL_REGISTER_KEY_ENABLED:"true", LOCAL_REGISTER_TRANSFER_ENABLED:"true",
    LOCAL_REGISTER_DISPATCH_ENABLED:"true", LOCAL_REGISTER_WRAP_KEY_V1:"b".repeat(64),
    ONBOARDING_PROOF_KEY:"a".repeat(64)};
  assert.equal(offlineRegisterPilotEnabled(enabled),true);
  for (const field of Object.keys(enabled).filter(field=>field!=="ONBOARDING_PROOF_KEY")) {
    assert.equal(offlineRegisterPilotEnabled({...enabled,[field]:undefined}),false);
  }
  assert.equal(offlineRegisterPilotEnabled({...enabled,APP_ENV:"production"}),false);
  assert.equal(offlineRegisterPilotEnabled({...enabled,LOCAL_REGISTER_WRAP_KEY_V1:enabled.ONBOARDING_PROOF_KEY}),false);
});

test("normal Owner workspace requires its separate staging gate and wrapping root", () => {
  const enabled = {
    APP_ENV: "staging",
    OWNER_WORKSPACE_PILOT_ENABLED: "true",
    OWNER_WORKSPACE_TRANSFER_ENABLED: "true",
    LOCAL_OWNER_WORKSPACE_KEY_ENABLED: "true",
    LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1: "c".repeat(64),
    LOCAL_REGISTER_WRAP_KEY_V1: "b".repeat(64),
    ONBOARDING_PROOF_KEY: "a".repeat(64),
  };
  assert.equal(ownerWorkspaceEnabled(enabled), true);
  for (const field of ["APP_ENV", "OWNER_WORKSPACE_PILOT_ENABLED", "OWNER_WORKSPACE_TRANSFER_ENABLED",
    "LOCAL_OWNER_WORKSPACE_KEY_ENABLED", "LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1"]) {
    assert.equal(ownerWorkspaceEnabled({...enabled, [field]: undefined}), false);
  }
  for (const root of [enabled.LOCAL_REGISTER_WRAP_KEY_V1, enabled.ONBOARDING_PROOF_KEY, "malformed"]) {
    assert.equal(ownerWorkspaceEnabled({...enabled, LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1: root}), false);
  }
  assert.equal(ownerWorkspaceEnabled({...enabled, APP_ENV: "production"}), false);
});
