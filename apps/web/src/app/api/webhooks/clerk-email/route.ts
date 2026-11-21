import { handleClerkEmail } from "@/lib/clerk-email";
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from "@/lib/rate-limit";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  return handleClerkEmail(req, {
    env: process.env,
    allowed: async recipient => rateLimitAllowed(await stagingLimiter(stagingRedis(), "clerk-email", 10).limit(rateLimitSubject(recipient))),
  });
}
