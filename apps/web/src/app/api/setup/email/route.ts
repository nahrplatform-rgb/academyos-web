import { auth } from "@clerk/nextjs/server";
import { STAGING_ORIGIN } from "@/lib/config";
import { sendStagingSetupEmail } from "@/lib/email";
import {
  rateLimitAllowed,
  rateLimitSubject,
  stagingLimiter,
  stagingRedis,
} from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (
    process.env.SERVICE_SETUP_ENABLED !== "true" ||
    process.env.APP_ENV !== "staging"
  )
    return new Response(null, { status: 404 });
  const { userId } = await auth();
  if (!userId) return new Response(null, { status: 401 });
  if (request.headers.get("origin") !== STAGING_ORIGIN)
    return new Response(null, { status: 403 });
  try {
    const limited = await stagingLimiter(
      stagingRedis(),
      "setup-email",
      1,
    ).limit(rateLimitSubject(userId));
    if (!rateLimitAllowed(limited)) return new Response(null, { status: 429 });
    return Response.json(await sendStagingSetupEmail(process.env), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ accepted: false }, { status: 503 });
  }
}
