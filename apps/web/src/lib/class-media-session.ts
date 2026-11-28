import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { onboardingKey } from './onboarding';
import { DATABASE_ORIGIN } from './onboarding-gateway';
import { JourneyError } from './onboarding-server';
import { classMediaGateway, localMediaDatabaseOrigin } from './class-media-gateway';
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from './rate-limit';

export async function classMediaSession(hosted: boolean) {
  const origin = hosted && process.env.NEXT_PUBLIC_SUPABASE_URL === DATABASE_ORIGIN
    ? DATABASE_ORIGIN : !hosted && localMediaDatabaseOrigin(process.env.ACADEMY_CLASS_MEDIA_DATABASE_ORIGIN);
  const key = hosted ? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY : process.env.ACADEMY_CLASS_MEDIA_DATABASE_KEY;
  const proof = process.env.ACADEMY_CLASS_MEDIA_PROOF_KEY;
  if (process.env.APP_ENV !== 'staging' || !origin || !key ||
      (!hosted && (process.env.VERCEL || !proof || !/^[0-9a-f]{64}$/.test(proof) || proof === process.env.ONBOARDING_PROOF_KEY))) {
    throw new JourneyError('denied', 403);
  }
  const session = await auth();
  if (!session.userId) throw new JourneyError('denied', 401);
  const token = await session.getToken();
  if (!token) throw new JourneyError('denied', 401);
  const subject = session.userId;
  const transport = classMediaGateway(origin, subject, hosted ? onboardingKey : () => proof!, async write => {
    if (!hosted) return true;
    return rateLimitAllowed(await stagingLimiter(stagingRedis(), write ? 'class-media-write' : 'class-media-read', 240)
      .limit(rateLimitSubject(subject)));
  });
  return {
    subject, token, key,
    client: createClient(origin, key, {
      accessToken: async () => token,
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: transport },
    }),
  };
}
