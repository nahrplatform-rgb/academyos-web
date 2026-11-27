import { STAGING_ORIGIN } from "@/lib/config";
import { deliverFictionalBillingNotification } from "@/lib/billing-notification-test-delivery";
import { GatewayError } from "@/lib/onboarding-gateway";
import { JourneyError, onboardingSession, rpc } from "@/lib/onboarding-server";
import { stagingRedis } from "@/lib/rate-limit";

const headers = { "Cache-Control": "no-store" };
export const maxDuration = 45;

export async function POST(request: Request) {
  if (process.env.APP_ENV !== "staging" || new URL(request.url).origin !== STAGING_ORIGIN)
    return new Response(null, { status: 404, headers });
  if (request.headers.get("origin") !== STAGING_ORIGIN ||
      request.headers.get("x-academyos-billing-test") !== "fictional-payment-failure")
    return new Response(null, { status: 403, headers });
  if (request.body) return new Response(null, { status: 422, headers });

  try {
    const { client } = await onboardingSession();
    // The existing RPC requires an active Platform Owner grant at the database.
    await rpc(client, "m1_platform_list_v1", { after_id: "ffffffff-ffff-ffff-ffff-ffffffffffff" });
    const result = await deliverFictionalBillingNotification(process.env, stagingRedis());
    return Response.json(result, { status: result.status === "accepted" ? 200 : 409, headers });
  } catch (error) {
    if (error instanceof JourneyError || error instanceof GatewayError)
      return Response.json({ status: error.code }, { status: error.http, headers });
    return Response.json({ status: "unavailable" }, { status: 503, headers });
  }
}
