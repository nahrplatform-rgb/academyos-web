import { NextRequest, NextResponse } from "next/server";
import { deliverGuardian, verifyGuardianDelivery } from "@/lib/guardian-delivery";
import { uuidPattern } from "@/lib/onboarding";
export async function POST(req: NextRequest) {
  if (Number(req.headers.get("content-length")) > 2048) return new NextResponse(null, { status: 413 });
  // QStash callbacks contain only safe operation identifiers, never email or invitation secret.
  const reader = req.body?.getReader(); if (!reader) return new NextResponse(null, { status: 422 });
  let body = "", size = 0; const decoder = new TextDecoder();
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 2048) { await reader.cancel(); return new NextResponse(null, { status: 413 }); } body += decoder.decode(value, { stream: true }); }
  if (!await verifyGuardianDelivery(body, req.headers.get("upstash-signature") ?? "")) return new NextResponse(null, { status: 401 });
  try {
const b = JSON.parse(body); if (!b || typeof b !== "object" || Array.isArray(b) || Object.keys(b).sort().join(",") !== "invitation" || !uuidPattern.test(b.invitation)) return new NextResponse(null, { status: 422 });
    await deliverGuardian(b.invitation); return NextResponse.json({ acknowledged: true });
  } catch (e) { if (e instanceof SyntaxError) return new NextResponse(null, { status: 422 }); return NextResponse.json({ error: "unavailable" }, { status: 503 }); }
}
