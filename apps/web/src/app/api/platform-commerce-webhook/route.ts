import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

function respond(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider');
  if (provider !== 'paymob' && provider !== 'whop') return respond({ error: 'invalid_provider' }, 400);

  return respond({ error: 'provider_not_configured' }, 503);
}
