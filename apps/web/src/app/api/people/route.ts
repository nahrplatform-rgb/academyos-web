import { NextRequest, NextResponse } from 'next/server';
import { STAGING_AUTH_ORIGINS } from '@/lib/config';
import { onboardingSession, rpc, JourneyError } from '@/lib/onboarding-server';
import { GatewayError } from '@/lib/onboarding-gateway';
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from '@/lib/rate-limit';
import { peopleRequest, PeopleInputError } from '@/lib/people';
import { normalizePlayerPhoto, photoRequestLimit } from '@/lib/player-photo';
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
        const photoUpload = req.headers.get('x-academyos-photo-upload') === '1';
        const trial = process.env.PLAYER_PRIVATE_PROFILE_TRIAL === 'true';
        if (photoUpload && !trial) return respond({ error: 'denied' }, 403);
        const limit = photoUpload ? photoRequestLimit : 4096;
        if (Number(req.headers.get('content-length')) > limit)
            return respond({ error: 'invalid' }, 413);
        const reader = req.body?.getReader();
        if (!reader)
            throw new PeopleInputError();
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            size += value.byteLength;
            if (size > limit) {
                await reader.cancel();
                return respond({ error: 'invalid' }, 413);
            }
            chunks.push(value);
        }
        const operation = peopleRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        if (['i2_private_profile_v1', 'i2_save_private_profile_v1', 'i2_find_member_v1',
            'i2_private_photo_v1','i2_save_private_photo_v1'].includes(operation.rpc) &&
            !trial) return respond({ error: 'denied' }, 403);
        if (photoUpload && operation.rpc !== 'i2_save_private_photo_v1') return respond({ error: 'invalid' }, 422);
        if (!rateLimitAllowed(await stagingLimiter(stagingRedis(), operation.mutating ? 'onboarding-entry-write' : 'onboarding-entry-read', operation.mutating ? 10 : 60).limit(rateLimitSubject(subject))))
            return respond({ error: 'limited' }, 429);
        if (operation.rpc === 'i2_save_private_photo_v1' && typeof operation.args.photo_base64 === 'string')
            operation.args.photo_base64 = await normalizePlayerPhoto(operation.args.photo_base64);
        return respond({ data: await rpc(client, operation.rpc, operation.args) });
    }
    catch (e) {
        if (e instanceof JourneyError || e instanceof GatewayError)
            return respond({ error: e.code }, e.http);
        if (e instanceof PeopleInputError || e instanceof SyntaxError)
            return respond({ error: 'invalid' }, 422);
        return respond({ error: 'unavailable' }, 503);
    }
}
