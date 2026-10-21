import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export function stagingRedis() {
  if (
    process.env.UPSTASH_REDIS_REST_URL !==
      "https://fond-mudfish-179090.upstash.io" ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  )
    throw new Error("Staging Redis is not configured");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    retry: { retries: 0 },
    signal: () => AbortSignal.timeout(3000),
  });
}

export function stagingLimiter(redis: Redis, prefix: string, limit = 5) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, "60 s"),
    prefix: `academyos:staging:v1:${prefix}`,
    analytics: false,
    ephemeralCache: false,
    timeout: 2000,
  });
}

export function rateLimitSubject(subject: string) {
  return createHash("sha256")
    .update(`academyos:staging:${subject}`)
    .digest("hex");
}

// The SDK may return success on a timeout; writes must still fail closed.
export function rateLimitAllowed(result: {
  success: boolean;
  reason?: string;
}) {
  return result.success && result.reason !== "timeout";
}
