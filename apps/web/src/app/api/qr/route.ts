import { NextRequest, NextResponse } from 'next/server';
import { STAGING_AUTH_ORIGINS } from '@/lib/config';
import { onboardingSession, rpc, JourneyError } from '@/lib/onboarding-server';
import { GatewayError } from '@/lib/onboarding-gateway';
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from '@/lib/rate-limit';
import { qrRequest, QrInputError } from '@/lib/qr-attendance';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export async function POST(req: NextRequest) {
    const start = performance.now();
    function respond(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Server-Timing': `total;dur=${(performance.now() - start).toFixed(1)}` } }); }
    try {
        if (process.env.APP_ENV !== 'staging' || req.headers.get('origin') !== req.nextUrl.origin || !STAGING_AUTH_ORIGINS.includes(req.nextUrl.origin) || req.headers.get('content-type')?.split(';')[0] !== 'application/json')
            return respond({ error: 'denied' }, 403);
        const { subject, client } = await onboardingSession();
        // Bound streamed bytes, including requests without a content-length header.
        if (Number(req.headers.get('content-length')) > 8192)
            return respond({ error: 'invalid' }, 413);
        const reader = req.body?.getReader();
        if (!reader)
            throw new QrInputError();
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            size += value.byteLength;
            if (size > 8192) {
                await reader.cancel();
                return respond({ error: 'invalid' }, 413);
            }
            chunks.push(value);
        }
        const operation = qrRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        if (!rateLimitAllowed(await stagingLimiter(stagingRedis(), operation.mutating ? 'attendance-entry-write' : 'onboarding-entry-read', 60).limit(rateLimitSubject(subject))))
            return respond({ error: 'limited' }, 429);
        return respond({ data: await rpc(client, operation.rpc, operation.args) });
    }
    catch (e) {
        if (e instanceof JourneyError || e instanceof GatewayError)
            return respond({ error: e.code }, e.http);
        if (e instanceof QrInputError || e instanceof SyntaxError)
            return respond({ error: 'invalid' }, 422);
        return respond({ error: 'unavailable' }, 503);
    }
}
