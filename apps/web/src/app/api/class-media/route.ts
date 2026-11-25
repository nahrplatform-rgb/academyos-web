import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { GatewayError } from '@/lib/onboarding-gateway';
import { uuidPattern } from '@/lib/onboarding';
import { JourneyError, rpc } from '@/lib/onboarding-server';
import { classMediaSession } from '@/lib/class-media-session';
import { STAGING_ORIGIN } from '@/lib/config';
import { classMediaLimits } from '@/lib/class-media-limits';
import { HostedClassMediaStore, hostedParts, type HostedPart } from '@/lib/class-media-hosted-store';
import { ClassMediaObjectConflict, HostedClassMediaOperations } from '@/lib/class-media-hosted-ops';
import {
  ClassMediaStorageConflict, classMediaItemDirectory, classMediaVariantsExist, getClassMediaVariant,
  localClassMediaRoot, putClassMediaVariant, removeClassMediaVariants, stagingClassMediaAcademy, withClassMediaItem,
} from '@/lib/class-media-store';
import { ClassMediaVariantError, readClassMediaBytes, readClassMediaVariant } from '@/lib/class-media-variant';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;
const headers = {
  'Cache-Control': 'private, no-store',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  Vary: 'Cookie',
};
const writes = new Set(['reserve', 'finalize', 'tag', 'consent', 'publish', 'withdraw', 'delete']);
const bodyLimit = 4096;
class InvalidRequest extends Error {}
type Client = Awaited<ReturnType<typeof classMediaSession>>['client'];
type Receipt = { id: string; state: string };
type Scope = { client: Client; base: string; hosted?: undefined; store?: undefined; academy?: undefined } |
  { client: Client; base?: undefined; hosted: HostedClassMediaOperations; store: HostedClassMediaStore; academy: string };

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers });
}

function uuid(value: unknown) {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new InvalidRequest();
  return value.toLowerCase();
}

function failure(error: unknown) {
  if (error instanceof JourneyError || error instanceof GatewayError) return json({ error: error.code }, error.http);
  if (error instanceof ClassMediaVariantError) {
    return json({ error: error.code === 'too_large' ? 'too_large' : 'invalid' }, error.code === 'too_large' ? 413 : 422);
  }
  if (error instanceof InvalidRequest || error instanceof SyntaxError) return json({ error: 'invalid' }, 422);
  if (error instanceof ClassMediaStorageConflict || error instanceof ClassMediaObjectConflict) return json({ error: 'conflict' }, 409);
  return json({ error: 'unavailable' }, 503);
}

async function scope(request: NextRequest): Promise<Scope> {
  const academy = stagingClassMediaAcademy();
  const origin = academy ? STAGING_ORIGIN : process.env.ACADEMY_CLASS_MEDIA_LOCAL_ORIGIN;
  // Next canonicalizes 127.0.0.1 to localhost in nextUrl. Browser Origin retains the address used to open the app.
  const requestOrigin = origin?.replace(/^http:\/\/127\.0\.0\.1(?=[:/]|$)/, 'http://localhost');
  if (request.nextUrl.origin !== requestOrigin || (!academy && (request.nextUrl.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(request.nextUrl.hostname))) ||
    ['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site') ?? '') ||
    (request.method !== 'GET' && request.headers.get('origin') !== origin) ||
    (request.headers.has('origin') && request.headers.get('origin') !== origin)) throw new JourneyError('denied', 403);
  if (academy) {
    const actor = await classMediaSession(true);
    const store = new HostedClassMediaStore(actor);
    return { client: actor.client, store, hosted: new HostedClassMediaOperations(store, (name, args) => rpc(actor.client, name, args)), academy };
  }
  const base = await localClassMediaRoot();
  if (!base) throw new JourneyError('denied', 403);
  const { client } = await classMediaSession(false);
  return { base, client };
}

async function readJson(request: NextRequest) {
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') throw new InvalidRequest();
  if (Number(request.headers.get('content-length')) > bodyLimit) throw new ClassMediaVariantError('too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new InvalidRequest();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > bodyLimit) {
        await reader.cancel().catch(() => {});
        throw new ClassMediaVariantError('too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks, length).toString('utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InvalidRequest();
  return value as Record<string, unknown>;
}

function checkKeys(input: Record<string, unknown>, ...keys: string[]) {
  if (Object.keys(input).some(key => !['academy', 'event', 'action', ...keys].includes(key))) throw new InvalidRequest();
}

function query(client: Client, a: string, e: string, mode: string, target: string | null = null) {
  return rpc(client, 'x25_query_v1', { a, e, mode, target });
}

function command(client: Client, a: string, e: string, op: string, act: string, payload: Record<string, unknown> = {}) {
  return rpc(client, 'x25_command_v1', { a, e, op, act, payload });
}

function authorizeAcademy(scope: Scope, academy: string) {
  if (scope.academy && academy !== scope.academy) throw new JourneyError('denied', 403);
}

function binaryScope(request: NextRequest, allowParts: boolean) {
  const params = request.nextUrl.searchParams;
  const expected = ['academy', 'event', 'item', 'variant'];
  if ([...params.keys()].length !== expected.length || expected.some(key => params.getAll(key).length !== 1)) throw new InvalidRequest();
  const variant = params.get('variant');
  if (variant !== 'main' && variant !== 'thumbnail' &&
      !(allowParts && hostedParts.includes(variant as HostedPart))) throw new InvalidRequest();
  return { a: uuid(params.get('academy')), e: uuid(params.get('event')), item: uuid(params.get('item')),
    variant: variant as 'main' | 'thumbnail' | HostedPart };
}

export async function PUT(request: NextRequest) {
  try {
    const access = await scope(request);
    const { a, e, item, variant } = binaryScope(request, Boolean(access.hosted));
    authorizeAcademy(access, a);
    const stream = request.body;
    if (!stream) throw new InvalidRequest();
    if (access.hosted) {
      const ids = { a, e, item };
      await query(access.client, a, e, 'upload', item);
      if (variant === 'main' || variant === 'thumbnail') {
        const image = await readClassMediaVariant(stream, variant);
        await access.hosted.put(ids, variant, image.body, image.type);
        return json({ data: { id: item, variant, bytes: image.body.byteLength } });
      }
      const type = request.headers.get('content-type');
      if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new InvalidRequest();
      const bytes = await readClassMediaBytes(stream, classMediaLimits.hostedPartBytes);
      await access.hosted.put(ids, variant, bytes, type);
      return json({ data: { id: item, variant, bytes: bytes.length } });
    }
    if (variant !== 'main' && variant !== 'thumbnail') throw new InvalidRequest();
    const directory = classMediaItemDirectory(access.base, a, e, item);
    return await withClassMediaItem(directory, async () => {
      await query(access.client, a, e, 'upload', item);
      const validated = await readClassMediaVariant(stream, variant);
      await putClassMediaVariant(directory, variant, validated.body);
      return json({ data: { id: item, variant, bytes: validated.body.byteLength } });
    });
  } catch (error) {
    return failure(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const access = await scope(request);
    const { a, e, item, variant } = binaryScope(request, false);
    if (variant !== 'main' && variant !== 'thumbnail') throw new InvalidRequest();
    authorizeAcademy(access, a);
    await query(access.client, a, e, 'read', item);
    const body = access.hosted ? await access.store.get({ a, e, item }, variant) :
      await getClassMediaVariant(classMediaItemDirectory(access.base, a, e, item), variant);
    if (!body) return json({ error: 'unavailable' }, 404);
    const type = body[0] === 0xff ? 'image/jpeg' : body[0] === 0x89 ? 'image/png' : 'image/webp';
    let offset = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        const next = Math.min(offset + 256 * 1024, body.length);
        controller.enqueue(new Uint8Array(body.subarray(offset, next)));
        offset = next;
        if (offset === body.length) controller.close();
      },
    });
    return new Response(stream, {
      headers: { ...headers, 'Content-Type': type, 'Content-Length': String(body.byteLength) },
    });
  } catch (error) {
    return failure(error);
  }
}

async function removeItem(access: Scope, a: string, e: string, item: string, operation: string) {
  const { client } = access;
  const remove = async () => {
    const previous = await query(client, a, e, 'recover', operation) as Receipt | { missing: true };
    if (!('missing' in previous) && previous.id === item && previous.state === 'deleted')
      return command(client, a, e, operation, 'delete_finish', { item });
    const start = await command(client, a, e, operation, 'delete_start', { item }) as Receipt;
    if (start.state === 'deleted') return start;
    if (access.hosted) await access.hosted.remove({ a, e, item });
    else await removeClassMediaVariants(classMediaItemDirectory(access.base, a, e, item));
    return command(client, a, e, operation, 'delete_finish', { item });
  };
  return access.hosted ? remove() : withClassMediaItem(classMediaItemDirectory(access.base, a, e, item), remove);
}

export async function POST(request: NextRequest) {
  try {
    const access = await scope(request);
    const { client } = access;
    const input = await readJson(request);
    const a = uuid(input.academy);
    authorizeAcademy(access, a);
    const action = input.action;
    if (action === 'gallery') {
      checkKeys(input, 'after');
      if ('event' in input) throw new InvalidRequest();
      return json({ data: await rpc(client, 'x25_query_v1', {
        a, e: null, mode: action, target: input.after === undefined ? null : uuid(input.after),
      }) });
    }
    const e = uuid(input.event);
    if (action === 'context' || action === 'recover') {
      if (action === 'context') {
        checkKeys(input);
        return json({ data: await query(client, a, e, action) });
      }
      checkKeys(input, 'operation');
      return json({ data: await query(client, a, e, action, uuid(input.operation)) });
    }

    if (action === 'cleanup') {
      checkKeys(input);
      const items = await query(client, a, e, 'expired') as Array<{ id: string; operation?: string }>;
      const result = [];
      for (const item of items) {
        try {
          await removeItem(access, a, e, uuid(item.id), item.operation ? uuid(item.operation) : randomUUID());
          result.push({ id: item.id, state: 'deleted' });
        } catch {
          result.push({ id: item.id, state: 'unresolved' });
        }
      }
      const receipts = await rpc(client, 'x25_purge_receipts_v1', { a, e });
      return json({ data: { items: result, receipts } });
    }

    if (action === 'assemble') {
      checkKeys(input, 'item', 'bytes', 'digest');
      const { bytes, digest } = input;
      const item = uuid(input.item);
      if (!access.hosted || typeof bytes !== 'number' || !Number.isInteger(bytes) ||
          bytes <= classMediaLimits.hostedPartBytes || bytes > classMediaLimits.storedBytes ||
          typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) throw new InvalidRequest();
      await query(client, a, e, 'upload', item);
      await access.hosted.assemble({ a, e, item }, bytes, digest);
      return json({ data: { id: item, bytes } });
    }

    if (typeof action !== 'string' || !writes.has(action)) throw new InvalidRequest();
    const op = uuid(input.operation);
    if (action === 'reserve') {
      checkKeys(input, 'operation');
      return json({ data: await command(client, a, e, op, action) });
    }

    const item = uuid(input.item);
    if (action === 'tag') {
      checkKeys(input, 'operation', 'item', 'players', 'confirmed');
      if (!Array.isArray(input.players) || !input.players.length || input.players.length > 50 || input.confirmed !== true)
        throw new InvalidRequest();
      return json({ data: await command(client, a, e, op, action, { item, players: input.players.map(uuid), confirmed: true }) });
    }
    if (action === 'consent') {
      checkKeys(input, 'operation', 'item', 'player', 'allowed');
      if (typeof input.allowed !== 'boolean') throw new InvalidRequest();
      return json({ data: await command(client, a, e, op, action, { item, player: uuid(input.player), allowed: input.allowed }) });
    }

    checkKeys(input, 'operation', 'item');
    if (action === 'delete') return json({ data: await removeItem(access, a, e, item, op) });
    if (action === 'finalize') {
      if (op === item) throw new InvalidRequest();
      const finalize = async () => {
        const previous = await query(client, a, e, 'recover', op) as Receipt | { missing: true };
        if (!('missing' in previous) && previous.id === item && previous.state !== 'reserved')
          return command(client, a, e, op, action, { item });
        await query(client, a, e, 'upload', item);
        if (access.hosted) await access.hosted.initialize({ a, e, item });
        else if (!await classMediaVariantsExist(classMediaItemDirectory(access.base, a, e, item)))
          throw new JourneyError('review_required', 409);
        return command(client, a, e, op, action, { item });
      };
      const data = access.hosted ? await finalize() : await withClassMediaItem(classMediaItemDirectory(access.base, a, e, item), finalize);
      return json({ data });
    }
    return json({ data: await command(client, a, e, op, action, { item }) });
  } catch (error) {
    return failure(error);
  }
}
