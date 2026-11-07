import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkspaceReadOwner, WorkspaceReadFailure } from './workspace-read-owner';

function fixture(subject = 'subject-A', academy = 'academy-A') {
  const calls: { path: string; init: RequestInit; resolve: (value: Response) => void; reject: (reason: unknown) => void }[] = [];
  const transport: typeof fetch = (input, init) => new Promise((resolve, reject) => {
    calls.push({ path: String(input), init: init!, resolve, reject });
  });
  return { owner: new WorkspaceReadOwner(subject, academy, transport), calls };
}
const signal = () => new AbortController().signal;
const ok = (value: unknown) => Response.json({ data: value });
const home = { action: 'owner_home' };

test('one concurrent exact read; canonical parameters and isolated consumer values', async () => {
  const { owner, calls } = fixture();
  const a = owner.read<{ items: string[] }>('owner', '/api/experience', { ...home, cursor: { day: 'day', id: 'id' } }, signal());
  const b = owner.read<{ items: string[] }>('owner', '/api/experience', { cursor: { id: 'id', day: 'day' }, ...home }, signal());
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.method, 'POST');
  assert.equal(calls[0].init.cache, 'no-store');
  assert.equal(JSON.parse(String(calls[0].init.body)).academy, 'academy-A');
  calls[0].resolve(ok({ items: ['one'] }));
  const [x, y] = await Promise.all([a, b]);
  x.items.push('local edit');
  assert.deepEqual(y.items, ['one']);
});

test('completed projections are not cached or reused as current authority', async () => {
  const { owner, calls } = fixture();
  const first = owner.read('owner', '/api/experience', home, signal());
  calls[0].resolve(ok({ revision: 1 }));
  await first;
  const second = owner.read('owner', '/api/experience', home, signal());
  assert.equal(calls.length, 2);
  calls[1].resolve(ok({ revision: 2 }));
  assert.deepEqual(await second, { revision: 2 });
});

test('a departing consumer cannot abort another consumer required read', async () => {
  const { owner, calls } = fixture();
  const controller = new AbortController();
  const a = owner.read('owner', '/api/experience', home, controller.signal);
  const rejected = assert.rejects(a, { name: 'AbortError' });
  const b = owner.read('owner', '/api/experience', home, signal());
  controller.abort();
  await rejected;
  assert.equal(calls[0].init.signal!.aborted, false);
  calls[0].resolve(ok({ current: true }));
  assert.deepEqual(await b, { current: true });
});

test('last consumer departure aborts transport; late completion cannot settle newer exact read', async () => {
  const { owner, calls } = fixture();
  const controller = new AbortController();
  const first = owner.read('owner', '/api/experience', home, controller.signal);
  const rejected = assert.rejects(first, { name: 'AbortError' });
  controller.abort();
  await rejected;
  assert.equal(calls[0].init.signal!.aborted, true);
  const current = owner.read('owner', '/api/experience', home, signal());
  calls[0].resolve(ok({ revision: 'obsolete' }));
  calls[1].resolve(ok({ revision: 'current' }));
  assert.deepEqual(await current, { revision: 'current' });
});

test('scope departure cancels every pending projection and rejects ignored transport aborts', async () => {
  const { owner, calls } = fixture();
  const a = owner.read('owner', '/api/experience', home, signal());
  const b = owner.read('owner', '/api/planning', { action: 'read', program: 'p', day: 'd' }, signal());
  const rejects = [assert.rejects(a, { name: 'AbortError' }), assert.rejects(b, { name: 'AbortError' })];
  owner.cancelAll();
  assert.ok(calls.every(c => c.init.signal!.aborted));
  calls.forEach(c => c.resolve(ok({ private: 'late' })));
  await Promise.all(rejects);
  // React StrictMode may set up this same clean, payload-free owner again.
  const fresh = owner.read('owner', '/api/experience', home, signal());
  calls.at(-1)!.resolve(ok({ fresh: true }));
  assert.deepEqual(await fresh, { fresh: true });
});

test('known denial invalidates capability peers without revoking a separate capability', async () => {
  const { owner, calls } = fixture();
  const a = owner.read('owner', '/api/experience', home, signal());
  const b = owner.read('owner', '/api/planning', { action: 'read', day: 'd' }, signal());
  const guardian = owner.read('guardian', '/api/guardians', { action: 'links' }, signal());
  const rejects = [a, b].map(p => assert.rejects(p, (e: unknown) => e instanceof WorkspaceReadFailure && e.code === 'denied'));
  calls[0].resolve(Response.json({ error: 'denied' }, { status: 403 }));
  await Promise.all(rejects);
  assert.equal(calls[1].init.signal!.aborted, true);
  assert.equal(calls[2].init.signal!.aborted, false);
  calls[1].resolve(ok({ private: 'obsolete owner row' }));
  calls[2].resolve(ok({ items: [] }));
  assert.deepEqual(await guardian, { items: [] });
});

test('setup denial and nested domain denial preserve their original failure codes', async () => {
  for (const code of ['denied', 'setup_required']) {
    const { owner, calls } = fixture();
    const result = owner.read('owner', '/api/experience', home, signal());
    const rejected = assert.rejects(result, (e: unknown) => e instanceof WorkspaceReadFailure && e.code === code);
    calls[0].resolve(ok({ error: code }));
    await rejected;
  }
});

test('failed reads do not retry; deliberate retry creates one new transport', async () => {
  const { owner, calls } = fixture();
  const first = owner.read('owner', '/api/experience', home, signal());
  const rejected = assert.rejects(first, (e: unknown) => e instanceof WorkspaceReadFailure && e.code === 'unavailable');
  calls[0].resolve(Response.json({ error: 'unavailable' }, { status: 503 }));
  await rejected;
  assert.equal(calls.length, 1);
  const retry = owner.read('owner', '/api/experience', home, signal());
  assert.equal(calls.length, 2);
  calls[1].resolve(ok({ ready: true }));
  await retry;
});

test('link, role, exact period and cursor remain separate read identities', async () => {
  const { owner, calls } = fixture();
  const bodies = [
    { action: 'guardian_calendar', link: 'child-A', from: 'a', to: 'b' },
    { action: 'guardian_calendar', link: 'child-B', from: 'a', to: 'b' },
    { action: 'guardian_calendar', link: 'child-A', from: 'c', to: 'd' },
    { action: 'guardian_calendar', link: 'child-A', from: 'a', to: 'b', cursor: { id: 'next' } },
  ];
  const results = bodies.map(body => owner.read('guardian', '/api/experience', body, signal()));
  results.push(owner.read('trainer', '/api/experience', { action: 'trainer_calendar', from: 'a', to: 'b' }, signal()));
  assert.equal(calls.length, 5);
  calls.forEach((c, i) => c.resolve(ok({ partition: i })));
  assert.deepEqual(await Promise.all(results), [0, 1, 2, 3, 4].map(partition => ({ partition })));
});

test('different academy and subject owners never share requests or values', async () => {
  const a = fixture('subject-A', 'academy-A'), b = fixture('subject-B', 'academy-A'), c = fixture('subject-A', 'academy-B');
  assert.equal(a.owner.matches('subject-A', 'academy-A'), true);
  assert.equal(a.owner.matches('subject-B', 'academy-A'), false);
  assert.equal(a.owner.matches('subject-A', 'academy-B'), false);
  const results = [a, b, c].map(({ owner }) => owner.read('owner', '/api/experience', home, signal()));
  [a, b, c].forEach((f, i) => { assert.equal(f.calls.length, 1); f.calls[0].resolve(ok({ namespace: i })); });
  assert.deepEqual(await Promise.all(results), [0, 1, 2].map(namespace => ({ namespace })));
});

test('writes, reviews, reconciliation, foreign routes and capability mismatches never reach shared transport', async () => {
  const { owner, calls } = fixture();
  for (const action of ['save', 'review', 'reconcile', 'publish', 'grant', 'scan', 'create']) {
    await assert.rejects(owner.read('owner', '/api/planning', { action }, signal()), WorkspaceReadFailure);
  }
  await assert.rejects(owner.read('trainer', '/api/experience', home, signal()), WorkspaceReadFailure);
  await assert.rejects(owner.read('owner', 'https://foreign.invalid/api/experience', home, signal()), WorkspaceReadFailure);
  await assert.rejects(owner.read('owner', '/api/experience', { ...home, academy: 'academy-B' }, signal()), WorkspaceReadFailure);
  assert.equal(calls.length, 0);
});

test('already aborted reads never start; malformed response fails with no retry', async () => {
  const { owner, calls } = fixture();
  const c = new AbortController(); c.abort();
  await assert.rejects(owner.read('owner', '/api/experience', home, c.signal), { name: 'AbortError' });
  assert.equal(calls.length, 0);
  const result = owner.read('owner', '/api/experience', home, signal());
  const rejected = assert.rejects(result);
  calls[0].resolve(new Response('not JSON'));
  await rejected;
  assert.equal(calls.length, 1);
});
