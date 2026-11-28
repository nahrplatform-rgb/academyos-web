import { createHash } from 'node:crypto';
import { classMediaLimits } from './class-media-limits';
import { readClassMediaBytes } from './class-media-variant';
import { DATABASE_ORIGIN } from './onboarding-gateway';
import { onboardingKey, signProof, uuidPattern } from './onboarding';

export const hostedParts = ['part-0', 'part-1', 'part-2'] as const;
export type HostedPart = typeof hostedParts[number];
export type HostedSlot = 'main' | 'thumbnail' | HostedPart;

export class ClassMediaProviderError extends Error {
  constructor(public readonly definiteRejection = false) {
    super('Private media storage is unavailable');
  }
}

export function classMediaDigest(body: Buffer) {
  return createHash('sha256').update(body).digest('hex');
}

export function hostedSlotLimit(slot: HostedSlot) {
  if (slot === 'main') return classMediaLimits.storedBytes;
  return slot === 'thumbnail' ? classMediaLimits.thumbnailBytes : classMediaLimits.hostedPartBytes;
}

export class HostedClassMediaStore {
  constructor(
    private readonly actor: { subject: string; token: string; key: string },
    private readonly send: typeof fetch = fetch,
  ) {}

  private async request(method: 'GET' | 'POST' | 'DELETE', ids: { a: string; e: string; item: string }, slot: HostedSlot, data?: { body: Buffer; type: string }) {
    const { a, e, item } = ids;
    if (![a, e, item].every(id => uuidPattern.test(id))) throw new TypeError('Invalid class media identity');
    const object = `synthetic-class-media/v1/${a}/${e}/${item}/${slot}`;
    const signed = signProof('gateway', 'class-media-storage:' + method + ':' + object, this.actor.subject, [], onboardingKey());
    const url = `${DATABASE_ORIGIN}/storage/v1/object/${method === 'GET' ? 'authenticated/' : ''}academy-media/${object}`;
    return this.send(url, {
      method, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000),
      headers: {
        apikey: this.actor.key,
        authorization: 'Bearer ' + this.actor.token,
        'x-academyos-class-media': JSON.stringify(signed),
        ...(data ? { 'content-type': data.type, 'cache-control': 'no-store', 'x-upsert': 'false' } : {}),
      },
      ...(data ? { body: new Uint8Array(data.body) } : {}),
    });
  }

  async get(ids: { a: string; e: string; item: string }, slot: HostedSlot) {
    const response = await this.request('GET', ids, slot);
    if (response.status === 400 || response.status === 404) {
      const error = await response.json().catch(() => null);
      if (response.status === 404 || (String(error?.statusCode) === '404' && error?.error === 'not_found')) return null;
    }
    if (!response.ok || !response.body) throw new ClassMediaProviderError();
    return readClassMediaBytes(response.body, hostedSlotLimit(slot));
  }

  async put(ids: { a: string; e: string; item: string }, slot: HostedSlot, body: Buffer, type: string) {
    const response = await this.request('POST', ids, slot, { body, type });
    if (!response.ok) {
      const problem = await response.json().catch(() => null);
      const code = typeof problem?.error === 'string' ? problem.error : '';
      // A duplicate or ambiguous provider result retains the durable attempt.
      const refused = [401, 403, 413, 415].includes(response.status) ||
        (response.status === 400 && ['InvalidMimeType', 'EntityTooLarge', 'Unauthorized'].includes(code));
      throw new ClassMediaProviderError(refused);
    }
    await response.body?.cancel();
  }

  async remove(ids: { a: string; e: string; item: string }, slot: HostedSlot) {
    const response = await this.request('DELETE', ids, slot);
    if (!response.ok && response.status !== 400 && response.status !== 404) throw new ClassMediaProviderError();
    await response.body?.cancel();
    if (await this.get(ids, slot)) throw new ClassMediaProviderError();
  }
}
