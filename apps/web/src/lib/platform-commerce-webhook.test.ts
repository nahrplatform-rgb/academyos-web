import assert from 'node:assert/strict';
import test from 'node:test';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/platform-commerce-webhook/route';

test('disabled payment providers refuse callbacks without reading their bodies', async () => {
  for (const provider of ['paymob', 'whop', 'unknown', '']) {
    const request = new NextRequest(
      `http://localhost:3000/api/platform-commerce-webhook?provider=${provider}`,
      { method: 'POST', body: '{"reference":"synthetic"}' },
    );
    const response = await POST(request);
    const configuredProviderName = provider === 'paymob' || provider === 'whop';
    assert.equal(response.status, configuredProviderName ? 503 : 400);
    assert.deepEqual(await response.json(), {
      error: configuredProviderName ? 'provider_not_configured' : 'invalid_provider',
    });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(request.bodyUsed, false);
  }
});
