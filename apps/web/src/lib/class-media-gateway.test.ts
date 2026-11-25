import test from 'node:test';
import assert from 'node:assert/strict';
import { classMediaGateway } from './class-media-gateway';
import { DATABASE_ORIGIN, GatewayError, gatewayRequest } from './onboarding-gateway';

test('media transport accepts only its own RPCs and its configured database', async () => {
  const local = 'http://127.0.0.1:54321';
  const host = DATABASE_ORIGIN;
  const key = 'a'.repeat(64);
  const media = '/rest/v1/rpc/x25_command_v1';
  let sent = 0;
  const send: typeof fetch = async (_input, init) => {
    sent++;
    assert.equal(init?.redirect, 'error');
    assert.equal(new Headers(init?.headers).has('x-academyos-gateway'), true);
    return Response.json({});
  };
  for (const origin of [local, host]) {
    const scoped = classMediaGateway(origin, 'user_A', () => key, async write => write, send);
    await scoped(origin + media, { method: 'POST' });
    await assert.rejects(scoped((origin === local ? host : local) + media, { method: 'POST' }), GatewayError);
    await assert.rejects(scoped(origin + '/rest/v1/rpc/m1_setup_v1', { method: 'POST' }), GatewayError);
    await assert.rejects(scoped(origin + media + '?target=other', { method: 'POST' }), GatewayError);
  }
  assert.throws(() => classMediaGateway('https://example.invalid', 'user_A', () => key, async () => true), GatewayError);
  assert.throws(() => gatewayRequest(host + media, { method: 'POST' }), GatewayError);
  assert.equal(sent, 2);
});
