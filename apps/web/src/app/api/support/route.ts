import { NextRequest, NextResponse } from 'next/server';
import { STAGING_AUTH_ORIGINS } from '@/lib/config';
import { GatewayError } from '@/lib/onboarding-gateway';
import { JourneyError, onboardingSession, rpc } from '@/lib/onboarding-server';
import { rateLimitAllowed, rateLimitSubject, stagingLimiter, stagingRedis } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 15;

const requestLimit = 4096;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mutations = new Set(['create_ticket', 'reply', 'resolve', 'reopen']);

class SupportInputError extends Error {}

function respond(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.APP_ENV !== 'staging' || request.headers.get('origin') !== request.nextUrl.origin ||
        !STAGING_AUTH_ORIGINS.includes(request.nextUrl.origin) || request.headers.get('content-type')?.split(';')[0] !== 'application/json')
      return respond({ error: 'denied' }, 403);

    const { subject, client } = await onboardingSession();
    if (Number(request.headers.get('content-length')) > requestLimit) return respond({ error: 'invalid' }, 413);
    const reader = request.body?.getReader();
    if (!reader) throw new SupportInputError();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > requestLimit) { await reader.cancel(); return respond({ error: 'invalid' }, 413); }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const action = body?.action;
    const academyId = String(body?.academy_id ?? '').trim();
    if (!uuid.test(academyId)) throw new SupportInputError();

    const mutating = mutations.has(action);
    if (!rateLimitAllowed(await stagingLimiter(stagingRedis(), mutating ? 'onboarding-entry-write' : 'onboarding-entry-read', 60).limit(rateLimitSubject(subject))))
      return respond({ error: 'limited' }, 429);

    const id = (value: unknown) => {
      const text = String(value ?? '');
      if (!uuid.test(text)) throw new SupportInputError();
      return text;
    };
    const text = (value: unknown, max: number) => {
      const trimmed = String(value ?? '').trim();
      if (!trimmed || trimmed.length > max) throw new SupportInputError();
      return trimmed;
    };
    const version = (value: unknown) => {
      const n = Number(value);
      if (!Number.isSafeInteger(n) || n < 1) throw new SupportInputError();
      return n;
    };

    let result: unknown;
    if (action === 'list_tickets') {
      result = await rpc(client, 'support_list_tickets_v1', { a: academyId });
    } else if (action === 'list_messages') {
      result = await rpc(client, 'support_list_messages_v1', { a: academyId, t: id(body?.ticket_id) });
    } else if (action === 'create_ticket') {
      result = await rpc(client, 'support_create_ticket_v1', {
        a: academyId, p_subject: text(body?.subject, 200), p_message: text(body?.message, 4000), op: id(body?.op),
      });
    } else if (action === 'reply') {
      result = await rpc(client, 'support_reply_v1', {
        a: academyId, t: id(body?.ticket_id), p_message: text(body?.message, 4000), op: id(body?.op),
      });
    } else if (action === 'resolve') {
      result = await rpc(client, 'support_resolve_v1', {
        a: academyId, t: id(body?.ticket_id), p_expected_version: version(body?.version), op: id(body?.op),
      });
    } else if (action === 'reopen') {
      result = await rpc(client, 'support_reopen_v1', {
        a: academyId, t: id(body?.ticket_id), p_expected_version: version(body?.version), op: id(body?.op),
      });
    } else if (action === 'reconcile') {
      result = await rpc(client, 'support_operation_v1', { a: academyId, op: id(body?.op) });
    } else {
      throw new SupportInputError();
    }

    // The RPCs report expected refusals as data so the caller can preserve input.
    const outcome = result as { error?: string };
    if (outcome?.error === 'conflict') return respond({ error: 'conflict' }, 409);
    if (outcome?.error === 'stale') return respond({ error: 'stale', data: result }, 409);
    if (outcome?.error === 'not_found') return respond({ error: 'not_found', data: result }, 404);
    return respond({ data: result });
  } catch (e) {
    if (e instanceof JourneyError || e instanceof GatewayError) return respond({ error: e.code }, e.http);
    if (e instanceof SupportInputError || e instanceof SyntaxError) return respond({ error: 'invalid' }, 422);
    return respond({ error: 'unavailable' }, 503);
  }
}
