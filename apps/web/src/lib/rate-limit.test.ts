import { test } from "node:test";
import assert from "node:assert/strict";
import { rateLimitAllowed, rateLimitSubject } from "./rate-limit";

test("a permissive Redis timeout never authorizes writes", () => {
  assert.equal(rateLimitAllowed({ success: true, reason: "timeout" }), false);
  assert.equal(rateLimitAllowed({ success: false }), false);
  assert.equal(rateLimitAllowed({ success: true }), true);
});

test("rate limit keys do not store raw Clerk subjects", () => {
  const key = rateLimitSubject("user_synthetic");
  assert.match(key, /^[a-f0-9]{64}$/);
  assert.equal(key.includes("user_synthetic"), false);
});
