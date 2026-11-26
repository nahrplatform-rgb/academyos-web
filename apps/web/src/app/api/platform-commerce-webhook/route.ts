import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function respond(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  if (provider !== 'paymob' && provider !== 'whop') return respond({ error: 'invalid_provider' }, 400);

  const body = await request.text();
  let payload: unknown;
  try { payload = JSON.parse(body); } catch { return respond({ error: 'invalid_payload' }, 400); }

  console.log(`Webhook received from ${provider}:`, JSON.stringify(payload).slice(0, 500));

  return respond({ received: true, provider });
}
