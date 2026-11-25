import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { performance } from 'node:perf_hooks';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '../..');
const bundled = await build({
  stdin: {
    contents: "import {inspectClassMediaImage,prepareClassMediaImage} from './apps/web/src/lib/class-media-image.ts';window.classMediaTest={inspectClassMediaImage,prepareClassMediaImage};",
    resolveDir: root,
    loader: 'ts',
  },
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
});
const digest = value => createHash('sha256').update(value).digest('hex');

function makeDetailedGroup(width, height) {
  const output = Buffer.alloc(width * height * 3);
  let seed = 7321;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = ((seed >>> 24) - 128) * 0.42;
      const person = Math.floor(x / 300) % 12;
      const centerX = person * 300 + 150;
      const head = ((x - centerX) / 74) ** 2 + ((y - 840) / 113) ** 2 < 1;
      const torso = y > 940 && y < 1960 && Math.abs(x - centerX) < 108 + Math.floor((y - 940) / 20);
      const grid = (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0 ? 17 : -17;
      const offset = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel++) {
        const background = [90 + 35 * y / height, 125 + 32 * x / width, 135 + 40 * y / height][channel];
        const garment = [42 + person * 12, 48 + (person % 4) * 28, 90 + (person % 5) * 22][channel];
        const face = [190 + (person % 4) * 8, 132 + (person % 4) * 8, 103 + (person % 4) * 6][channel];
        output[offset + channel] = Math.max(0, Math.min(255, (head ? face : torso ? garment : background) + grain + (torso ? grid : 0)));
      }
    }
  }
  return output;
}

const width = 3600;
const height = 2400;
const detailRaw = makeDetailedGroup(width, height);
const group = await sharp(detailRaw, { raw: { width, height, channels: 3 } }).jpeg({ quality: 99, chromaSubsampling: '4:4:4' }).toBuffer();
const webp = await sharp(group).webp({ quality: 93 }).toBuffer();
function withSyntheticGps(jpeg) {
  const tiff = Buffer.alloc(140);
  tiff.write('II', 0, 'ascii');
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(8, 4);
  tiff.writeUInt16LE(2, 8);
  tiff.writeUInt16LE(0x0112, 10);
  tiff.writeUInt16LE(3, 12);
  tiff.writeUInt32LE(1, 14);
  tiff.writeUInt16LE(6, 18);
  tiff.writeUInt16LE(0x8825, 22);
  tiff.writeUInt16LE(4, 24);
  tiff.writeUInt32LE(1, 26);
  tiff.writeUInt32LE(38, 30);
  tiff.writeUInt16LE(4, 38);
  for (const [index, tag, type, count, value] of [
    [0, 1, 2, 2, 78], [1, 2, 5, 3, 92], [2, 3, 2, 2, 69], [3, 4, 5, 3, 116],
  ]) {
    const offset = 40 + index * 12;
    tiff.writeUInt16LE(tag, offset);
    tiff.writeUInt16LE(type, offset + 2);
    tiff.writeUInt32LE(count, offset + 4);
    tiff.writeUInt32LE(value, offset + 8);
  }
  for (let index = 0; index < 6; index++) {
    tiff.writeUInt32LE([30, 2, 0, 31, 14, 0][index], 92 + index * 8);
    tiff.writeUInt32LE(1, 96 + index * 8);
  }
  const exif = Buffer.concat([Buffer.from('Exif\0\0', 'binary'), tiff]);
  const marker = Buffer.alloc(4);
  marker.writeUInt16BE(0xffe1, 0);
  marker.writeUInt16BE(exif.length + 2, 2);
  return Buffer.concat([jpeg.subarray(0, 2), marker, exif, jpeg.subarray(2)]);
}
const rotated = withSyntheticGps(await sharp(detailRaw, { raw: { width, height, channels: 3 } }).resize(1200, 800).jpeg().toBuffer());
const originalMetadata = await sharp(rotated).metadata();
assert.equal(originalMetadata.orientation, 6);
assert.ok(originalMetadata.exif?.length);
const alpha = await sharp({ create: { width: 640, height: 480, channels: 4, background: { r: 100, g: 40, b: 180, alpha: 0.35 } } }).png().toBuffer();
let state = 83939;
const randomRaw = Buffer.alloc(4000 * 3000 * 3);
for (let i = 0; i < randomRaw.length; i++) {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  randomRaw[i] = state >>> 24;
}
const camera = await sharp(randomRaw, { raw: { width: 4000, height: 3000, channels: 3 } }).jpeg({ quality: 100, chromaSubsampling: '4:4:4' }).toBuffer();
assert.ok(camera.length > 10_000_000 && camera.length < 40_000_000);
const inputs = { group, rotated, alpha, camera, webp };
const results = new Map();
const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', 'http://localhost').pathname;
  if (path === '/bundle.js') {
    response.writeHead(200, { 'Content-Type': 'application/javascript' }).end(bundled.outputFiles[0].text);
  } else if (path.startsWith('/source/')) {
    const name = path.split('/').at(-1);
    const body = inputs[name];
    if (!body) return response.writeHead(404).end();
    response.writeHead(200, { 'Content-Type': name === 'alpha' ? 'image/png' : name === 'webp' ? 'image/webp' : 'image/jpeg' }).end(body);
  } else if (path.startsWith('/result/') && request.method === 'POST') {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    results.set(path.slice('/result/'.length), Buffer.concat(chunks));
    response.writeHead(204).end();
  } else {
    response.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><html><body><script src="/bundle.js"></script></body></html>');
  }
});
await new Promise((resolveListen, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolveListen);
});
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const measurements = await page.evaluate(async () => {
    const { inspectClassMediaImage, prepareClassMediaImage } = window.classMediaTest;
    const checksum = async blob => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())))
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    const output = {};
    for (const [name, maxEdge] of [['group', 2048], ['group', 2560], ['rotated', 2560], ['alpha', 2560], ['webp', 2560], ['camera', 2560]]) {
      const original = await (await fetch('/source/' + name)).blob();
      const before = await checksum(original);
      const started = performance.now();
      const prepared = await prepareClassMediaImage(original, { maxEdge });
      const elapsedMs = performance.now() - started;
      const after = await checksum(original);
      const label = name + '-' + maxEdge;
      await fetch('/result/' + label + '-main', { method: 'POST', body: prepared.main });
      await fetch('/result/' + label + '-thumb', { method: 'POST', body: prepared.thumbnail });
      output[label] = {
        sourceBytes: original.size, mainBytes: prepared.main.size, thumbnailBytes: prepared.thumbnail.size,
        source: prepared.source, width: prepared.width, height: prepared.height,
        thumbnailWidth: prepared.thumbnailWidth, thumbnailHeight: prepared.thumbnailHeight,
        outputType: prepared.main.type, elapsedMs: Math.round(elapsedMs), originalUnchanged: before === after,
      };
    }
    const expectCode = async (blob, code) => {
      try { await inspectClassMediaImage(blob); throw new Error('Expected ' + code); }
      catch (error) { if (error.code !== code) throw error; }
    };
    const heic = new Uint8Array(32);
    heic.set(new TextEncoder().encode('ftypheic'), 4);
    await expectCode(new Blob([heic], { type: 'image/heic' }), 'heic_requires_export');
    const avif = new Uint8Array(32);
    avif.set(new TextEncoder().encode('ftypavif'), 4);
    await expectCode(new Blob([avif], { type: 'image/avif' }), 'unsupported_type');
    await expectCode(new Blob([new Uint8Array(40_000_001)]), 'source_too_large');
    await expectCode(new Blob([new Uint8Array(128)], { type: 'image/png' }), 'unsupported_type');
    const tiny = new Uint8Array(await (await fetch('/source/alpha')).arrayBuffer());
    new DataView(tiny.buffer).setUint32(16, 8193);
    await expectCode(new Blob([tiny], { type: 'image/png' }), 'dimensions_exceeded');
    const pixelBomb = tiny.slice();
    new DataView(pixelBomb.buffer).setUint32(16, 6000);
    new DataView(pixelBomb.buffer).setUint32(20, 5000);
    await expectCode(new Blob([pixelBomb], { type: 'image/png' }), 'dimensions_exceeded');
    const edge = new Blob([await (await fetch('/source/alpha')).arrayBuffer(), new Uint8Array(40_000_000 - tiny.length)], { type: 'image/png' });
    if ((await inspectClassMediaImage(edge)).width !== 640) throw new Error('Exact source byte limit rejected');
    return output;
  });
  assert.equal(measurements['rotated-2560'].width, 800);
  assert.equal(measurements['rotated-2560'].height, 1200);
  for (const [label, entry] of Object.entries(measurements)) {
    assert.equal(entry.originalUnchanged, true);
    assert.ok(entry.mainBytes <= 10_000_000 && entry.thumbnailBytes <= 262_144);
    const main = results.get(label + '-main');
    const thumb = results.get(label + '-thumb');
    const metadata = await sharp(main).metadata();
    const thumbnail = await sharp(thumb).metadata();
    assert.equal(metadata.exif, undefined);
    assert.equal(metadata.iptc, undefined);
    assert.equal(metadata.xmp, undefined);
    assert.equal(thumbnail.exif, undefined);
  }
  assert.equal((await sharp(results.get('alpha-2560-main')).metadata()).hasAlpha, true);
  async function viewDifference(prepared) {
    const options = { raw: true, resolveWithObject: true };
    const target = await sharp(group).resize({ width: 1280, height: 853, fit: 'fill' }).removeAlpha().raw().toBuffer(options);
    const actual = await sharp(prepared).resize({ width: 1280, height: 853, fit: 'fill' }).removeAlpha().raw().toBuffer(options);
    assert.equal(actual.data.length, target.data.length);
    let absolute = 0;
    let squared = 0;
    for (let index = 0; index < target.data.length; index++) {
      const delta = actual.data[index] - target.data[index];
      absolute += Math.abs(delta);
      squared += delta * delta;
    }
    return {
      meanAbsoluteError: Number((absolute / target.data.length).toFixed(3)),
      rootMeanSquareError: Number(Math.sqrt(squared / target.data.length).toFixed(3)),
    };
  }
  measurements['group-2048'].viewAt1280 = await viewDifference(results.get('group-2048-main'));
  measurements['group-2560'].viewAt1280 = await viewDifference(results.get('group-2560-main'));
  assert.notEqual(digest(results.get('group-2048-main')), digest(results.get('group-2560-main')));
  console.log(JSON.stringify({ browser: await browser.version(), viewport: '1280 × 900 emulated desktop',
    fixture: 'procedurally generated group-style illustration with fine fabric detail and texture',
    assertions: ['JPEG, PNG, WebP inputs through browser', 'EXIF rotation and GPS fixture stripped', 'output metadata stripped',
      'transparent output retained', 'original bytes unchanged', '40,000,000-byte boundary',
      'pixel and axis limits before decoding', 'HEIC export fallback', 'oversized synthetic camera input'],
    measurements }, null, 2));
} finally {
  await browser.close();
  await new Promise(resolveClose => server.close(resolveClose));
}
