import {NextRequest, NextResponse} from 'next/server';
import {STAGING_AUTH_ORIGINS} from '@/lib/config';
import {attendanceRequest, AttendanceInputError} from '@/lib/attendance';
import {WIRE_LIMIT} from '@/lib/local-register-codec';
import {onboardingSession, rpc, JourneyError} from '@/lib/onboarding-server';
import {GatewayError} from '@/lib/onboarding-gateway';
import {rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis} from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const maxDuration = 15;

/** The private runtime gate owns enablement of this Owner-only write path. */
export async function POST(req: NextRequest) {
  const respond = (data: unknown, status = 200) => NextResponse.json(data, {status, headers: {
    'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer',
  }});
  try {
    if (process.env.APP_ENV !== 'staging' || req.headers.get('origin') !== req.nextUrl.origin ||
        !STAGING_AUTH_ORIGINS.includes(req.nextUrl.origin) ||
        req.headers.get('content-type')?.split(';')[0] !== 'application/json') return respond({error: 'denied'}, 403);
    if (process.env.LOCAL_REGISTER_DISPATCH_ENABLED !== 'true') return respond({error: 'unavailable'}, 503);
    const expectedSubject = req.headers.get('x-academyos-original-subject');
    if (!expectedSubject || !/^user_[a-zA-Z0-9_]{1,155}$/.test(expectedSubject)) return respond({error: 'invalid'}, 422);
    if (Number(req.headers.get('content-length')) > WIRE_LIMIT) return respond({error: 'invalid'}, 413);
    const reader = req.body?.getReader();
    if (!reader) return respond({error: 'invalid'}, 422);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > WIRE_LIMIT) {await reader.cancel(); return respond({error: 'invalid'}, 413);}
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (body?.action !== 'register') return respond({error: 'invalid'}, 422);
    const operation = attendanceRequest(body);
    const {subject, client} = await onboardingSession();
    if (subject !== expectedSubject) return respond({error: 'account_changed'}, 403);
    const budget = await stagingLimiter(stagingRedis(), 'attendance-entry-write', 60).limit(rateLimitSubject(subject));
    if (!rateLimitAllowed(budget)) return respond({error: 'limited'}, 429);
    const data = await rpc(client, 'x18_owner_register_dispatch_v1', {...operation.args, expected_subject: expectedSubject});
    return respond({data});
  } catch (e) {
    if (e instanceof JourneyError || e instanceof GatewayError) return respond({error: e.code}, e.http);
    if (e instanceof AttendanceInputError || e instanceof SyntaxError) return respond({error: 'invalid'}, 422);
    return respond({error: 'unavailable'}, 503);
  }
}
