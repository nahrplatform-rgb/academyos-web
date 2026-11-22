import { NextRequest, NextResponse } from 'next/server';
import { STAGING_AUTH_ORIGINS } from '@/lib/config';
import { GatewayError } from '@/lib/onboarding-gateway';
import { JourneyError, onboardingSession, rpc } from '@/lib/onboarding-server';
import { CompensationInputError, trainerCompensationRequest } from '@/lib/trainer-compensation';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

const requestLimit = 4096;

function respond(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (process.env.APP_ENV !== 'staging' || request.headers.get('origin') !== origin ||
      !STAGING_AUTH_ORIGINS.includes(origin) || request.headers.get('content-type')?.split(';')[0] !== 'application/json')
    return respond({ error: 'denied' }, 403);

  try {
    const { client } = await onboardingSession();
    if (Number(request.headers.get('content-length')) > requestLimit) return respond({ error: 'invalid' }, 413);
    const reader = request.body?.getReader();
    if (!reader) throw new CompensationInputError();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > requestLimit) {
        await reader.cancel();
        return respond({ error: 'invalid' }, 413);
      }
      chunks.push(value);
    }

    const command = trainerCompensationRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    return respond({ data: await rpc(client, command.rpc, command.args) });
  } catch (error) {
    if (error instanceof JourneyError || error instanceof GatewayError) return respond({ error: error.code }, error.http);
    if (error instanceof CompensationInputError || error instanceof SyntaxError) return respond({ error: 'invalid' }, 422);
    return respond({ error: 'unavailable' }, 503);
  }
}
