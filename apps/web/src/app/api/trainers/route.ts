import { NextRequest, NextResponse } from 'next/server';
import { STAGING_AUTH_ORIGINS } from '@/lib/config';
import { onboardingSession, recipientProof, rpc, JourneyError } from '@/lib/onboarding-server';
import { GatewayError, exchangeNetworkKey } from '@/lib/onboarding-gateway';
import { trainerRequest, TrainerInputError, trainerRecipientAllowed, trainerToken } from '@/lib/trainers';
import { onboardingKey, tokenHash, uuidPattern } from '@/lib/onboarding';
import { sealInvitation, openInvitation } from '@/lib/invitation-cookie';
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from '@/lib/rate-limit';
import { dispatchTrainer } from '@/lib/trainer-delivery';
export const dynamic = 'force-dynamic';
export const maxDuration = 15;
export async function POST(req: NextRequest) {
    const start = performance.now();
    const respond = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'Server-Timing': `total;dur=${(performance.now() - start).toFixed(1)}` } });
    try {
        if (process.env.APP_ENV !== 'staging' || req.headers.get('origin') !== req.nextUrl.origin || !STAGING_AUTH_ORIGINS.includes(req.nextUrl.origin) || req.headers.get('content-type')?.split(';')[0] !== 'application/json')
            return respond({ error: 'denied' }, 403);
        if (Number(req.headers.get('content-length')) > 8192)
            return respond({ error: 'invalid' }, 413);
        const reader = req.body?.getReader();
        if (!reader)
            throw new TrainerInputError();
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            bytes += value.byteLength;
            if (bytes > 8192) {
                await reader.cancel();
                return respond({ error: 'invalid' }, 413);
            }
            chunks.push(value);
        }
        const b = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (b?.action === 'exchange') {
            const key = onboardingKey(), redis = stagingRedis();
            if (!rateLimitAllowed(await stagingLimiter(redis, 'exchange-network', 30).limit(exchangeNetworkKey(req.headers, key, process.env.VERCEL === '1'))) || !rateLimitAllowed(await stagingLimiter(redis, 'exchange-global', 300).limit('staging')))
                return respond({ error: 'limited' }, 429);
            if (Object.keys(b).sort().join(',') !== 'action,invitation,token' || typeof b.invitation !== 'string' || !uuidPattern.test(b.invitation) || typeof b.token !== 'string' || !/^[a-f0-9]{64}$/.test(b.token))
                throw new TrainerInputError();
            const res = respond({ data: { exchanged: true } });
            res.cookies.set('t4_invitation', sealInvitation(b.invitation.toLowerCase(), b.token, key), { httpOnly: true, secure: req.nextUrl.protocol === 'https:', sameSite: 'strict', path: '/api/trainers', maxAge: 900 });
            return res;
        }
        const operation = trainerRequest(b), { subject, client } = await onboardingSession();
        if (!rateLimitAllowed(await stagingLimiter(stagingRedis(), operation.mutating ? 'onboarding-entry-write' : 'onboarding-entry-read', operation.mutating ? 10 : 60).limit(rateLimitSubject(subject))))
            return respond({ error: 'limited' }, 429);
        if (b.action === 'appoint') {
            if (!trainerRecipientAllowed(operation.args.recipient as string))
                return respond({ error: 'recipient_not_authorized' }, 403);
            operation.args.token_hash = tokenHash(trainerToken(operation.args.invitation as string, onboardingKey()));
        }
        if (operation.recipient) {
            let handoff: {
                invitation: string;
                token: string;
            };
            try {
                handoff = openInvitation(req.cookies.get('t4_invitation')?.value ?? '', onboardingKey());
            }
            catch {
                throw new TrainerInputError();
            }
            Object.assign(operation.args, handoff, { proof: await recipientProof(subject, handoff.invitation, handoff.token) });
        }
        const data = await rpc(client, operation.rpc, operation.args);
        if (operation.dispatch)
            try {
                await dispatchTrainer(operation.dispatch);
            }
            catch { /* Durable original invitation stays queued for explicit retry. */ }
        return respond({ data });
    }
    catch (e) {
        if (e instanceof JourneyError || e instanceof GatewayError)
            return respond({ error: e.code }, e.http);
        if (e instanceof TrainerInputError || e instanceof SyntaxError)
            return respond({ error: 'invalid' }, 422);
        return respond({ error: 'unavailable' }, 503);
    }
}
