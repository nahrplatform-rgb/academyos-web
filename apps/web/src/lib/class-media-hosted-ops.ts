import { randomUUID } from 'node:crypto';
import {
  classMediaDigest, ClassMediaProviderError, hostedParts, type HostedClassMediaStore, type HostedSlot,
} from './class-media-hosted-store';
import { classMediaLimits } from './class-media-limits';
import { validateClassMediaVariant } from './class-media-variant';

type VariantReceipt = {
  variant: HostedSlot;
  state: 'pending' | 'ready' | 'closed' | 'removed';
  attempt: string;
  digest: string;
  bytes: number;
};
type VariantReply = VariantReceipt & { write?: boolean };
type Scope = { a: string; e: string; item: string };

export class ClassMediaObjectConflict extends Error {}

export class HostedClassMediaOperations {
  constructor(
    private readonly storage: HostedClassMediaStore,
    private readonly rpc: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  ) {}

  private call(ids: Scope, phase: string, row?: Partial<VariantReceipt>) {
    return this.rpc('x25_variant_v1', {
      ...ids, phase, variant: row?.variant ?? null, digest: row?.digest ?? null,
      bytes: row?.bytes ?? null, attempt: row?.attempt ?? null,
    });
  }

  initialize(ids: Scope) { return this.call(ids, 'init'); }

  private async inspect(ids: Scope) {
    const data = await this.call(ids, 'inspect') as { variants?: unknown };
    if (!Array.isArray(data?.variants)) throw new ClassMediaProviderError();
    return data.variants as VariantReceipt[];
  }

  private async verifiedBody(ids: Scope, row: VariantReceipt) {
    const body = await this.storage.get(ids, row.variant);
    if (!body || body.length !== row.bytes || classMediaDigest(body) !== row.digest) {
      throw new ClassMediaProviderError();
    }
    return body;
  }

  async put(ids: Scope, variant: HostedSlot, body: Buffer, type: string) {
    await this.initialize(ids);
    const row = { variant, digest: classMediaDigest(body), bytes: body.length, attempt: randomUUID() };
    const receipt = await this.call(ids, 'begin', row) as VariantReply;
    if (receipt.state === 'removed') return;
    if (receipt.state === 'ready') return;
    if (receipt.state !== 'pending' || !receipt.attempt) throw new ClassMediaProviderError();
    const attempt = { ...row, attempt: receipt.attempt, state: 'pending' as const };
    if (receipt.write) {
      try {
        await this.storage.put(ids, variant, body, type);
      } catch (error) {
        if (error instanceof ClassMediaProviderError && error.definiteRejection) {
          await this.call(ids, 'close', attempt);
        }
        throw error;
      }
    }
    await this.verifiedBody(ids, attempt);
    await this.call(ids, 'complete', attempt);
  }

  async assemble(ids: Scope, bytes: number, digest: string) {
    await this.initialize(ids);
    const rows = await this.inspect(ids);
    const main = rows.find(row => row.variant === 'main' && row.state === 'ready');
    if (main) {
      if (main.bytes !== bytes || main.digest !== digest) throw new ClassMediaObjectConflict();
    } else {
      const count = Math.ceil(bytes / classMediaLimits.hostedPartBytes);
      const parts: Buffer[] = [];
      for (const slot of hostedParts.slice(0, count)) {
        const row = rows.find(item => item.variant === slot && item.state === 'ready');
        if (!row) throw new ClassMediaObjectConflict();
        parts.push(await this.verifiedBody(ids, row));
      }
      const body = Buffer.concat(parts);
      if (body.length !== bytes || classMediaDigest(body) !== digest) throw new ClassMediaObjectConflict();
      const image = await validateClassMediaVariant(body, 'main');
      await this.put(ids, 'main', image.body, image.type);
    }
    await this.removeKnown(ids, rows.filter(row => row.variant.startsWith('part-')));
  }

  private async removeKnown(ids: Scope, rows: VariantReceipt[]) {
    for (const row of rows) {
      if (row.state === 'removed' || row.state === 'closed') continue;
      if (row.state === 'pending') {
        // An uncertain PUT can still arrive. Only positive readback closes it.
        await this.verifiedBody(ids, row);
        await this.call(ids, 'complete', row);
      }
      await this.storage.remove(ids, row.variant);
      const proof = await this.rpc('x25_storage_exists_v1', { ...ids, variant: row.variant });
      if (proof !== false) throw new ClassMediaProviderError();
      await this.call(ids, 'remove', row);
    }
  }

  async remove(ids: Scope) { await this.removeKnown(ids, await this.inspect(ids)); }
}
