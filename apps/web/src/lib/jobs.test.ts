import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { isSetupJob, SETUP_CALLBACK, verifyJob } from "./jobs";

const keys = {
  currentSigningKey: "synthetic-current-signing-key",
  nextSigningKey: "synthetic-next-signing-key",
};
const body = JSON.stringify({
  kind: "setup.verify",
  id: "00000000-0000-4000-8000-000000000001",
});
function signature(
  key: string,
  url = SETUP_CALLBACK,
  expiry = Math.floor(Date.now() / 1000) + 120,
) {
  const head = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "Upstash",
      sub: url,
      exp: expiry,
      nbf: 0,
      body: createHash("sha256").update(body).digest("base64url"),
    }),
  ).toString("base64url");
  return `${head}.${payload}.${createHmac("sha256", key).update(`${head}.${payload}`).digest("base64url")}`;
}

test("QStash accepts only signed, unexpired, body- and URL-bound deliveries with rotation", async () => {
  assert.equal(
    await verifyJob(body, signature(keys.currentSigningKey), keys),
    true,
  );
  assert.equal(
    await verifyJob(body, signature(keys.nextSigningKey), keys),
    true,
  );
  assert.equal(
    await verifyJob(body + " ", signature(keys.currentSigningKey), keys),
    false,
  );
  assert.equal(
    await verifyJob(
      body,
      signature(keys.currentSigningKey, "https://wrong.example"),
      keys,
    ),
    false,
  );
  assert.equal(
    await verifyJob(
      body,
      signature(keys.currentSigningKey, SETUP_CALLBACK, 1),
      keys,
    ),
    false,
  );
  assert.equal(await verifyJob(body, "", keys), false);
  assert.equal(await verifyJob(body, signature("wrong-key"), keys), false);
});

test("the setup callback rejects arbitrary business jobs and extra payloads", () => {
  assert.equal(isSetupJob(JSON.parse(body)), true);
  assert.equal(
    isSetupJob({ ...JSON.parse(body), email: "private@example.test" }),
    false,
  );
  assert.equal(isSetupJob({ kind: "academy.invite", id: "x" }), false);
  assert.equal(isSetupJob(null), false);
});
