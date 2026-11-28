import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../app/manifest';

test('staging PWA identity uses the public locale bootstrap and non-private assets', () => {
  const value = manifest();
  assert.equal(value.id, '/en');
  assert.equal(value.start_url, '/en');
  assert.equal(value.scope, '/');
  assert.equal(value.display, 'standalone');
  assert.equal(value.name, 'AcademyOS Staging');
  assert.deepEqual(value.icons, [
    { src: '/icons/academyos-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icons/academyos-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icons/academyos-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icons/academyos-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ]);
  for (const icon of value.icons ?? []) assert.equal(existsSync(resolve(process.cwd(), 'public', icon.src.slice(1))), true, icon.src);
  assert.equal(existsSync(resolve(process.cwd(), 'src/app/apple-icon.png')), true);
});
