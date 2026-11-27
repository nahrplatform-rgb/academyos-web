import assert from 'node:assert/strict';
import { build } from 'esbuild';

const staging = 'https://staging.academy.nahr.dev';
const path = '/api/platform-commerce/billing-notification-test';
const header = 'x-academyos-billing-test';
const testKind = 'fictional-payment-failure';
const trial = { role: null, sessions: 0, authority: 0, sends: 0 };
globalThis.billingNotificationRouteFixture = trial;

const adapters = {
  'onboarding-server': `
    const trial = globalThis.billingNotificationRouteFixture;
    export class JourneyError extends Error {
      constructor(code, http) { super(code); this.code = code; this.http = http; }
    }
    export async function onboardingSession() {
      trial.sessions++;
      if (!trial.role) throw new JourneyError('denied', 401);
      return { client: trial.role };
    }
    export async function rpc(client, name, args) {
      trial.authority++;
      if (name !== 'm1_platform_list_v1' || !args.after_id) throw new Error('Unexpected authority path');
      if (client !== 'platform') throw new JourneyError('denied', 403);
      return { items: [], more: false };
    }`,
  'rate-limit': 'export const stagingRedis = () => ({ fixture: true });',
  'billing-notification-test-delivery': `
    export async function deliverFictionalBillingNotification(env, store) {
      if (env.APP_ENV !== 'staging' || !store.fixture) throw new Error('Unexpected delivery configuration');
      globalThis.billingNotificationRouteFixture.sends++;
      return { status: 'accepted', id: 'fictional-receipt' };
    }`,
};

const result = await build({
  entryPoints: [`apps/web/src/app${path}/route.ts`],
  bundle: true, platform: 'node', format: 'esm', write: false,
  plugins: [{ name: 'billing-provider-fixtures', setup(build) {
    build.onResolve({ filter: /^@\/lib\/(onboarding-server|rate-limit|billing-notification-test-delivery)$/ },
      args => ({ path: args.path.split('/').at(-1), namespace: 'billing-fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'billing-fixture' }, args => ({ contents: adapters[args.path] }));
  } }],
});
const { POST } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);

function request(origin = staging, marker = testKind, body, host = staging) {
  return new Request(`${host}${path}`, { method: 'POST', headers: { Origin: origin, [header]: marker }, body });
}

process.env.APP_ENV = 'production';
assert.equal((await POST(request())).status, 404);
process.env.APP_ENV = 'staging';
assert.equal((await POST(request(staging, testKind, undefined, 'https://other.example.test'))).status, 404);
assert.equal((await POST(request('https://other.example.test'))).status, 403);
assert.equal((await POST(request(staging, ''))).status, 403);
assert.equal((await POST(request(staging, testKind, '{"to":"other@example.test"}'))).status, 422);
assert.deepEqual([trial.sessions, trial.authority, trial.sends], [0, 0, 0]);
assert.equal((await POST(request())).status, 401);
trial.role = 'academy';
assert.equal((await POST(request())).status, 403);
assert.deepEqual([trial.sessions, trial.authority, trial.sends], [2, 1, 0]);
trial.role = 'platform';
const accepted = await POST(request());
assert.equal(accepted.status, 200);
assert.equal(accepted.headers.get('cache-control'), 'no-store');
assert.deepEqual(await accepted.json(), { status: 'accepted', id: 'fictional-receipt' });
assert.deepEqual([trial.sessions, trial.authority, trial.sends], [3, 2, 1]);
console.log('PASS billing notification route origin, body, sign-in, Platform Owner gate and receipt');
