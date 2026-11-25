import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { startClassMediaFixture } from './local-fixture.mjs';

const tmp = await mkdtemp(join(tmpdir(), 'academyos-ex25-object-contract-'));
let fixture;
try {
  fixture = await startClassMediaFixture(tmp, { hosted: true });
  const { academy, foreign, players, events } = fixture.data;
  const event = events[0].id;
  const origin = fixture.origin;
  const headers = subject => ({ origin, cookie: 'media-actor=' + subject });
  const post = (fields, subject = 'user_owner', a = academy) =>
    fetch(origin + '/api/class-media', { method: 'POST', headers: { ...headers(subject), 'content-type': 'application/json' },
      body: JSON.stringify({ academy: a, event, ...fields }) });
  async function command(fields, status, subject) {
    const response = await post(fields.action === 'assemble' ? fields : { operation: randomUUID(), ...fields }, subject);
    const result = await response.json();
    assert.equal(response.status, status, JSON.stringify({ fields, result, storage: fixture.providerCalls.slice(-3) }));
    return result.data;
  }
  const item = (await command({ action: 'reserve' }, 200)).id;
  const url = variant => origin + '/api/class-media?' + new URLSearchParams({ academy, event, item, variant });
  const put = async (variant, bytes, status) => {
    const response = await fetch(url(variant), { method: 'PUT', headers: { ...headers('user_owner'), 'content-type': 'image/jpeg' }, body: bytes });
    assert.equal(response.status, status, JSON.stringify({ variant, reply: await response.text(), storage: fixture.providerCalls.slice(-3) }));
  };

  const width = 2560, height = 1920;
  const noise = Buffer.alloc(width * height * 3);
  let state = 237835;
  for (let offset = 0; offset < noise.length; offset++) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    noise[offset] = state >>> 24;
  }
  const pipeline = sharp(noise, { raw: { width, height, channels: 3 } });
  const large = await pipeline.clone().jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
  const thumb = await pipeline.clone().resize({ width: 384 }).jpeg({ quality: 85 }).toBuffer();
  assert(large.length > 4_500_000 && large.length <= 10_000_000);
  const digest = createHash('sha256').update(large).digest('hex');
  fixture.loseProviderReply();
  await put('part-0', large.subarray(0, 4_000_000), 503);
  await put('part-0', large.subarray(0, 4_000_000), 200);
  assert.equal(fixture.providerCalls.filter(call => call.method === 'POST' && call.name.endsWith('/part-0')).length, 1);
  for (let start = 4_000_000, part = 1; start < large.length; start += 4_000_000, part++) {
    await put('part-' + part, large.subarray(start, start + 4_000_000), 200);
  }
  await command({ action: 'assemble', item, bytes: large.length, digest: '0'.repeat(64) }, 409);
  await command({ action: 'assemble', item, bytes: large.length, digest }, 200);
  await put('part-0', large.subarray(0, 4_000_000), 200);
  await command({ action: 'assemble', item, bytes: large.length, digest }, 200);
  await put('thumbnail', thumb, 200);
  await command({ action: 'finalize', item }, 200);
  assert.equal(fixture.objects.size, 2);
  assert(![...fixture.objects.keys()].some(name => name.includes('/part-')));
  for (const variant of ['main', 'thumbnail']) {
    const result = await fetch(url(variant), { headers: headers('user_manager') });
    assert.equal(result.status, 200);
    assert.equal(result.headers.get('cache-control'), 'private, no-store');
    assert(Buffer.from(await result.arrayBuffer()).equals(variant === 'main' ? large : thumb));
  }
  for (const name of fixture.objects.keys()) {
    const allowed = await fixture.db({ action: 'storage', name, method: 'GET', subject: 'user_owner', proof: '{}' });
    assert.equal(allowed, false, 'direct Storage access was possible without server proof');
  }
  assert.equal((await post({ action: 'context' }, 'user_owner', foreign)).status, 403);
  assert.equal((await fetch(url('part-0'), { headers: headers('user_owner') })).status, 422);
  await command({ action: 'tag', item, players, confirmed: true }, 200);
  for (const player of players) await command({ action: 'consent', item, player, allowed: true }, 200);
  await command({ action: 'publish', item }, 200);
  await command({ action: 'withdraw', item }, 200);
  for (const variant of ['main', 'thumbnail']) {
    assert.equal((await fetch(url(variant), { headers: headers('user_owner') })).status, 403);
  }
  await command({ action: 'delete', item }, 200);
  assert.equal(fixture.objects.size, 0);
  assert.equal((await fixture.db({ action: 'counts', item })).deleted, 1);
  console.log(JSON.stringify({ result: 'passed', bytes: large.length, source: 'real app route and Storage RLS, disposable PostgreSQL, simulated Storage HTTP', confirmedProviderWrites: fixture.providerCalls.filter(x => x.method === 'POST' && x.allowed).length }));
} finally {
  await fixture?.close();
  await rm(tmp, { recursive: true, force: true });
}
