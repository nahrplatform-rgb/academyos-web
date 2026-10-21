import { isSetupJob, verifyJob } from "@/lib/jobs";
import { stagingRedis } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (
    process.env.SERVICE_SETUP_ENABLED !== "true" ||
    process.env.APP_ENV !== "staging"
  )
    return new Response(null, { status: 404 });
  const signature = request.headers.get("upstash-signature") ?? "";
  if (!signature) return new Response(null, { status: 401 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024)
    return new Response(null, { status: 413 });
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (reader) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 1024) {
      await reader.cancel();
      return new Response(null, { status: 413 });
    }
    chunks.push(part.value);
  }
  const body = Buffer.concat(chunks).toString("utf8");
  if (!(await verifyJob(body, signature)))
    return new Response(null, { status: 401 });
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }
  if (!isSetupJob(payload)) return new Response(null, { status: 400 });
  // An idempotent synthetic receipt, never a business operation or authorization grant.
  try {
    await stagingRedis().set(
      `academyos:staging:setup-receipt:${payload.id}`,
      "received",
      { nx: true, ex: 3600 },
    );
    return Response.json({ received: true });
  } catch {
    return new Response(null, { status: 503 });
  }
}
