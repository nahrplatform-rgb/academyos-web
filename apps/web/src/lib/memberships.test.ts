import { test } from "node:test";
import assert from "node:assert/strict";
import { loadMemberships } from "./memberships";
test("bootstrap failure never becomes an empty membership", async () => {
  assert.deepEqual(
    await loadMemberships({ rpc: async () => ({ data: null, error: {} }) }),
    { status: "unavailable" },
  );
});
test("verified empty membership is distinct from outage", async () => {
  assert.deepEqual(
    await loadMemberships({
      rpc: async (name) => ({
        data: name.startsWith("bootstrap") ? "id" : [],
        error: null,
      }),
    }),
    { status: "ready", memberships: [] },
  );
});
test("invalid payload and network failures fail closed", async () => {
  for (const rpc of [
    async () => {
      throw Error("network");
    },
    async () => ({ data: [{ role: "admin" }], error: null }),
  ])
    assert.deepEqual(await loadMemberships({ rpc }), { status: "unavailable" });
});
