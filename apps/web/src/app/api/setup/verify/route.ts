import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { randomUUID } from "node:crypto";
import { STAGING_ORIGIN } from "@/lib/config";
import { SETUP_CALLBACK, stagingJobPublisher } from "@/lib/jobs";
import {
  rateLimitAllowed,
  rateLimitSubject,
  stagingLimiter,
  stagingRedis,
} from "@/lib/rate-limit";
import { SETUP_ERROR } from "@/lib/telemetry";

async function setupUser() {
  if (
    process.env.SERVICE_SETUP_ENABLED !== "true" ||
    process.env.APP_ENV !== "staging"
  )
    return null;
  return (await auth()).userId;
}

export async function POST(request: Request) {
  const userId = await setupUser();
  if (!userId) return new Response(null, { status: 404 });
  if (request.headers.get("origin") !== STAGING_ORIGIN)
    return new Response(null, { status: 403 });
  try {
    const redis = stagingRedis();
    const allowed = await stagingLimiter(redis, "setup").limit(
      rateLimitSubject(userId),
    );
    if (!rateLimitAllowed(allowed))
      return new Response(null, {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    const ping = await redis.ping();
    const id = randomUUID();
    const limiter = stagingLimiter(redis, "synthetic-check", 2);
    const first = await limiter.limit(id);
    const second = await limiter.limit(id);
    const third = await limiter.limit(id);
    const throttling =
      rateLimitAllowed(first) && rateLimitAllowed(second) && !third.success;
    const error = new Error(SETUP_ERROR);
    error.name = "AcademyOSServerSetupError";
    const eventId = process.env.SENTRY_DSN
      ? Sentry.captureException(error)
      : null;
    const flushed = eventId ? await Sentry.flush(3000) : false;
    let job: "pending-automation-key" | "published" | "unavailable" =
      "pending-automation-key";
    if (process.env.JOB_PROTECTION_BYPASS_SECRET) {
      try {
        await stagingJobPublisher().publishJSON({
          url: SETUP_CALLBACK,
          body: { kind: "setup.verify", id },
          headers: {
            "x-vercel-protection-bypass":
              process.env.JOB_PROTECTION_BYPASS_SECRET,
          },
          retries: 2,
          timeout: 10,
        });
        job = "published";
      } catch {
        job = "unavailable";
      }
    }
    return Response.json(
      {
        redis: ping === "PONG",
        throttling,
        sentry: { eventId, flushed },
        job,
        receipt: id,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "A staging service check failed; no academy data was changed." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request) {
  if (!(await setupUser())) return new Response(null, { status: 404 });
  const receipt = new URL(request.url).searchParams.get("receipt") ?? "";
  if (!/^[a-f0-9-]{36}$/.test(receipt))
    return new Response(null, { status: 400 });
  try {
    return Response.json(
      {
        received:
          (await stagingRedis().get(
            `academyos:staging:setup-receipt:${receipt}`,
          )) === "received",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return new Response(null, { status: 503 });
  }
}
