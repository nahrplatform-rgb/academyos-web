import { test } from "node:test";
import assert from "node:assert/strict";
import { privateErrorEvent, SETUP_ERROR } from "./telemetry";

test("monitoring strips identity, request credentials, business payloads and free text", () => {
  const event = privateErrorEvent({
    type: undefined,
    user: { email: "private@example.test", ip_address: "127.0.0.1" },
    request: {
      url: "https://example.test/?token=secret",
      data: "private body",
      headers: { Authorization: "secret" },
    },
    breadcrumbs: [{ message: "private input" }],
    extra: { player: "private child" },
    message: "private message",
    exception: {
      values: [
        {
          type: "Error",
          value: "private child",
          stacktrace: {
            frames: [
              {
                filename:
                  "https://example.test/_next/static/chunks/app.js?token=secret",
                lineno: 2,
                vars: { password: "secret" },
                context_line: "private source",
              },
              { filename: "/Users/private-name/project/file.ts" },
            ],
          },
        },
      ],
    },
  });
  const serialized = JSON.stringify(event);
  for (const secret of [
    "private",
    "secret",
    "Authorization",
    "password",
    "Users",
  ])
    assert.equal(serialized.includes(secret), false);
  assert.equal(
    event.exception?.values?.[0].stacktrace?.frames?.[0].filename,
    "/_next/static/chunks/app.js",
  );
});

test("the fixed synthetic check remains identifiable", () => {
  assert.equal(
    privateErrorEvent({
      type: undefined,
      exception: { values: [{ value: SETUP_ERROR }] },
    }).exception?.values?.[0].value,
    SETUP_ERROR,
  );
});

test("source-map identifiers survive while private source-map URLs are scrubbed", () => {
  const debugId = "00000000-0000-4000-8000-000000000001";
  const event = privateErrorEvent({
    type: undefined,
    debug_meta: {
      images: [
        {
          type: "sourcemap",
          debug_id: debugId,
          code_file:
            "https://staging.academy.nahr.dev/_next/static/chunks/app.js?token=secret",
        },
      ],
    },
  });
  assert.deepEqual(event.debug_meta?.images, [
    {
      type: "sourcemap",
      debug_id: debugId,
      code_file: "/_next/static/chunks/app.js",
    },
  ]);
});
