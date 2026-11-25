import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { link, mkdtemp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { arch, platform, tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { createFixtures } from './fixtures.mjs';
import { startClassMediaFixture } from './local-fixture.mjs';

const temp = await mkdtemp(join(tmpdir(), 'academyos-ex25-'));
const evidence = { checks: [], workload: {} };
const verified = name => { evidence.checks.push(name); process.stdout.write('PASS ' + name + '\n'); };
let fixture, browser;
try {
  fixture = await startClassMediaFixture(temp);
  const samples = await createFixtures(join(temp, 'photos'));
  browser = await chromium.launch();
  const { academy, foreign, players, events, program } = fixture.data;
  const { origin } = fixture;
  evidence.environment = { node: process.version, browser: browser.version(), platform: platform(), arch: arch() };
  const pageFor = async (actor, narrow = false) => {
    const context = await browser.newContext(narrow ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 1440, height: 900 } });
    if (actor) await context.addCookies([{ name: 'media-actor', value: actor, url: origin }]);
    const page = await context.newPage();
    page.on('pageerror', error => console.error(error));
    return page;
  };
  const en = await pageFor('user_owner');
  const ar = await pageFor('user_owner', true);
  const manager = await pageFor('user_manager');
  const gallery = (page, event, locale = 'en') => page.goto(origin + '/' + locale + '/workspace/' + academy + '/class-media/' + event.id);
  const input = page => page.locator('input[type=file]');
  const section = page => page.locator('section').filter({ has: page.getByRole('heading', { name: /^(Class gallery|معرض الحصة)$/ }) }).last();
  const cards = page => section(page).locator('ul > li');
  const button = (page, name) => page.getByRole('button', { name, exact: true });
  const directory = (event, item) => join(fixture.storage, academy, event.id, item);
  const url = (event, item, variant, a = academy) => origin + '/api/class-media?' + new URLSearchParams({ academy: a, event: event.id, item, variant });
  const post = (page, event, data, a = academy) => page.request.post(origin + '/api/class-media', { headers: { origin }, data: { academy: a, event: event.id, ...data } });
  const action = async (page, event, fields, wanted = 200) => {
    const response = await post(page, event, { operation: randomUUID(), ...fields });
    const json = await response.json();
    assert.equal(response.status(), wanted, JSON.stringify({ fields, json }));
    return json.data;
  };
  const context = async (page, event) => {
    const response = await post(page, event, { action: 'context' });
    const json = await response.json();
    assert.equal(response.status(), 200, JSON.stringify(json));
    return json.data;
  };
  const bytesAt = async (page, linkUrl, expected) => {
    const result = await page.request.get(linkUrl);
    assert.equal(result.status(), expected, linkUrl);
    if (expected === 200) {
      assert.equal(result.headers()['cache-control'], 'private, no-store');
      assert.equal(result.headers()['cross-origin-resource-policy'], 'same-origin');
    }
    return (await result.body()).length;
  };
  const readBoth = async (page, event, item, expected, a = academy) => {
    for (const variant of ['main', 'thumbnail']) await bytesAt(page, url(event, item, variant, a), expected);
  };

  const first = events[0];
  await gallery(en, first);
  await expect(input(en)).toBeEnabled();
  const variants = [];
  let failedThumbnail = false;
  let interruptedItem, interruptedOperation, retryItem;
  await en.route('**/api/class-media*', async route => {
    const req = route.request();
    const query = new URL(req.url()).searchParams;
    if (req.method() === 'PUT' && query.get('variant') === 'thumbnail' && variants.length === 1) {
      variants.push(query.get('item'));
      retryItem = query.get('item');
      failedThumbnail = true;
      return route.abort('failed');
    }
    if (req.method() === 'PUT' && query.get('variant') === 'main') variants.push(query.get('item'));
    if (req.method() === 'POST' && req.postDataJSON().action === 'finalize' && variants.length > 2 && !interruptedItem) {
      const upstream = await route.fetch();
      assert.equal(upstream.status(), 200, await upstream.text());
      interruptedItem = req.postDataJSON().item;
      interruptedOperation = req.postDataJSON().operation;
      return route.abort('failed');
    }
    return route.continue();
  });
  await input(en).setInputFiles([samples.phone.path, samples.camera.path, samples.broken.path, samples.heic.path, samples.png.path, samples.webp.path]);
  await expect(en.getByText('Export this HEIC image as JPEG, then select it again.')).toBeVisible();
  await expect(en.getByText('This image is incomplete or invalid.')).toBeVisible();
  await expect(en.getByRole('button', { name: 'Upload photo', exact: true })).toHaveCount(4);
  const prep = en.locator('img[src^="blob:"]');
  await expect(prep).toHaveCount(4);
  await button(en, 'Upload ready photos').click();
  await expect(button(en, 'Check original operation')).toBeEnabled({ timeout: 30000 });
  assert(failedThumbnail && interruptedItem);
  assert.equal((await context(en, first)).items.length, 1);
  assert.deepEqual(await readdir(directory(first, interruptedItem)), ['main', 'thumbnail']);
  assert.deepEqual(await readdir(directory(first, retryItem)), ['main']);
  await en.unroute('**/api/class-media*');
  await en.reload();
  await button(en, 'Check original operation').click();
  await expect(en.getByText('Original operation confirmed.', { exact: true })).toBeVisible();
  const recovered = await post(en, first, { action: 'recover', operation: interruptedOperation });
  assert.equal((await recovered.json()).data.id, interruptedItem);
  assert.deepEqual(await fixture.db({ action: 'counts', item: interruptedItem }), { rows: 1, finalized: 1, deleted: 0 });
  await input(en).setInputFiles(samples.phone.path);
  await button(en, 'Upload photo').click();
  await expect(cards(en)).toHaveCount(2, { timeout: 30000 });
  assert.deepEqual(await fixture.db({ action: 'counts', item: retryItem }), { rows: 1, finalized: 1, deleted: 0 });
  assert.deepEqual(await readdir(directory(first, retryItem)), ['main', 'thumbnail']);
  verified('Mixed batch with corrupt and HEIC fallback, per-file failure, successful sibling, original recovery after reload and retry only the incomplete item');

  const firstItem = cards(en).filter({ has: en.locator('img[src*="' + interruptedItem + '"]') });
  await expect(firstItem).toHaveCount(1);
  await firstItem.getByRole('checkbox', { name: 'Fictional Player One' }).check();
  await firstItem.getByRole('checkbox', { name: 'Fictional Player Two' }).check();
  await firstItem.getByRole('checkbox', { name: 'I confirmed every player shown in this photo.' }).check();
  await button(firstItem, 'Save shown players').click();
  await expect(firstItem.getByRole('button', { name: 'Record fictional consent' })).toHaveCount(2);
  await action(en, first, { action: 'publish', item: interruptedItem }, 409);
  await firstItem.getByRole('button', { name: 'Record fictional consent' }).first().click();
  await expect(firstItem.getByRole('button', { name: 'Record fictional consent' })).toHaveCount(1);
  await action(en, first, { action: 'publish', item: interruptedItem }, 409);
  await button(firstItem, 'Record fictional consent').click();
  await button(firstItem, 'Publish to class staff').click();
  await expect(button(firstItem, 'Withdraw photo')).toBeVisible();
  await gallery(manager, first);
  await expect(input(manager)).toBeEnabled();
  await expect(manager.getByRole('link', { name: 'Back to workspaces', exact: true })).toHaveAttribute('href', '/en/workspace');
  await expect(manager.getByRole('link', { name: 'Back to class', exact: true })).toHaveCount(0);
  await expect(button(manager, 'Delete photo')).toHaveCount(0);
  for (const actionName of ['publish', 'withdraw', 'delete']) await action(manager, first, { action: actionName, item: interruptedItem }, 403);
  await readBoth(manager, first, interruptedItem, 200);
  const managerView = await context(manager, first);
  assert.deepEqual(managerView.players, []);
  assert.deepEqual(managerView.items.find(item => item.id === interruptedItem).consented, []);
  await readBoth(en, first, interruptedItem, 200);
  for (const role of ['user_guardian', 'user_trainer', 'user_unassigned', 'user_other_owner', null]) {
    const unrelated = await pageFor(role);
    const expected = role ? 403 : 401;
    await readBoth(unrelated, first, interruptedItem, expected);
    await unrelated.context().close();
  }
  await readBoth(en, first, interruptedItem, 403, foreign);
  await readBoth(en, events[1], interruptedItem, 403);
  await fixture.db({ action: 'membership', academy, state: 'suspended' });
  await readBoth(manager, first, interruptedItem, 403);
  await fixture.db({ action: 'membership', academy, state: 'active' });
  await readBoth(manager, first, interruptedItem, 200);
  await firstItem.getByRole('button', { name: 'Withdraw consent', exact: true }).first().click();
  await expect(button(firstItem, 'Withdraw photo')).toHaveCount(0);
  await readBoth(manager, first, interruptedItem, 403);
  await readBoth(en, first, interruptedItem, 403);
  await button(en, 'Delete photo').last().waitFor();
  const withdrawn = cards(en).filter({ hasText: 'Withdrawn' });
  await button(withdrawn, 'Delete photo').click();
  await expect(withdrawn).toHaveCount(0);
  assert.deepEqual(await readdir(directory(first, interruptedItem)), []);
  assert.deepEqual(await fixture.db({ action: 'counts', item: interruptedItem }), { rows: 1, finalized: 1, deleted: 1 });
  verified('Publication requires consent for both pictured players, old URLs deny both variants after current membership or consent loss, and deletion removes both objects');

  const second = events[1];
  await gallery(ar, second, 'ar');
  await expect(input(ar)).toBeEnabled();
  assert.equal(await ar.locator('html').getAttribute('dir'), 'rtl');
  await input(ar).setInputFiles([samples.png.path, samples.webp.path]);
  await expect(ar.getByRole('button', { name: 'رفع الصورة', exact: true })).toHaveCount(2);
  await button(ar, 'رفع الصور الجاهزة').tap();
  await expect(cards(ar)).toHaveCount(2);
  const card = cards(ar).first();
  await card.getByRole('checkbox', { name: 'Fictional Player One' }).check();
  await card.getByRole('checkbox', { name: 'تحققت من جميع اللاعبين الظاهرين في هذه الصورة.' }).check();
  await button(card, 'حفظ اللاعبين الظاهرين').tap();
  await button(card, 'تسجيل موافقة تجريبية').tap();
  await button(card, 'نشر لموظفي الحصة').tap();
  await button(card, 'فتح الصورة').tap();
  const opened = ar.getByRole('dialog').getByRole('img');
  await expect.poll(() => opened.evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
  await button(ar, 'إغلاق الصورة').tap();
  await button(card, 'سحب الصورة').tap();
  const returned = ar.getByRole('link', { name: 'العودة إلى الحصة', exact: true });
  await returned.tap();
  await expect(ar).toHaveURL(origin + '/ar/workspace/' + academy + '/programs/' + program + '/' + second.day);
  await expect(ar.getByText('Fictional Player One', { exact: true })).toBeVisible();
  await expect(ar.locator('html')).toHaveAttribute('dir', 'rtl');
  await ar.getByRole('link', { name: 'صور الحصة', exact: true }).tap();
  await expect(ar).toHaveURL(origin + '/ar/workspace/' + academy + '/class-media/' + second.id);
  verified('Arabic narrow touch upload, tag, consent, publish, full image, withdraw and exact class return');

  const clock = instant => fixture.db({ action: 'clock', instant });
  await clock('2026-11-25T08:00:00+00:00');
  const third = events[2];
  await gallery(manager, third);
  await input(manager).setInputFiles(samples.suitable.path);
  await button(manager, 'Upload ready photos').click();
  await expect(cards(manager)).toHaveCount(1);
  const [managerItem] = (await context(manager, third)).items;
  await readBoth(manager, third, managerItem.id, 200);
  await readBoth(en, third, managerItem.id, 200);
  const reserve = await action(en, third, { action: 'reserve' });
  const put = (bytes, variant) => en.request.put(url(third, reserve.id, variant), { headers: { origin, 'content-type': 'application/octet-stream' }, data: bytes, timeout: 30000 });
  const exact = await put(Buffer.alloc(10_000_000), 'main');
  assert.equal(exact.status(), 422);
  assert.equal((await exact.json()).error, 'invalid');
  const oversized = await put(Buffer.alloc(10_000_001), 'main');
  assert.equal(oversized.status(), 413);
  const smallCap = await put(Buffer.alloc(262_145), 'thumbnail');
  assert.equal(smallCap.status(), 413);
  verified('Assigned Manager can upload a draft, exact main byte ceiling precedes decoding and thumbnails have an independent cap');

  const clean = async (event) => {
    const result = await post(en, event, { action: 'cleanup' });
    assert.equal(result.status(), 200, await result.text());
    return (await result.json()).data;
  };
  const cleanupContains = (response, item) => response.items.some(entry => entry.id === item && entry.state === 'deleted');
  await clock('2026-11-26T07:59:59+00:00');
  assert(!cleanupContains(await clean(third), reserve.id));
  await clock('2026-11-26T08:00:00+00:00');
  await gallery(en, third);
  await button(en, 'Clean up expired media').click();
  await expect(en.getByText('Expired media and receipts checked.', { exact: true })).toBeVisible();
  assert.equal((await fixture.db({ action: 'counts', item: reserve.id })).deleted, 1);
  await clock('2026-12-02T07:59:59+00:00');
  await readBoth(en, third, managerItem.id, 200);
  await clock('2026-12-02T08:00:00+00:00');
  await readBoth(en, third, managerItem.id, 403);
  assert(cleanupContains(await clean(third), managerItem.id));
  assert.deepEqual(await readdir(directory(third, managerItem.id)), []);
  await clock('2027-03-04T08:00:00+00:00');
  const retirement = await clean(third);
  assert(retirement.receipts.audit > 0);
  assert.equal((await fixture.db({ action: 'counts', item: reserve.id })).deleted, 0);
  verified('24-hour reservation and seven-day draft boundaries, physical cleanup and 90-day receipt expiry');

  // The review replay captures the connected states above. The workload is measured by the standalone run.
  if (!process.env.ACADEMY_REVIEW_CAPTURE) {
    await clock('2027-04-01T08:00:00+00:00');
    const sources = await mkdir(join(temp, 'workload')).then(() => join(temp, 'workload'));
    const files = [];
    for (const [index, sample] of [samples.phone, samples.camera, samples.suitable, samples.png, samples.webp, samples.phone, samples.camera, samples.suitable, samples.png, samples.webp].entries()) {
      const destination = join(sources, 'sample-' + index + sample.path.slice(sample.path.lastIndexOf('.')));
      await link(sample.path, destination);
      files.push(destination);
    }
    let storedMain = 0, storedThumbnails = 0, firstView = 0, fullViews = 0;
    const start = performance.now();
    for (const event of events) {
      const before = new Set((await context(en, event)).items.map(item => item.id));
      await gallery(en, event);
      await expect(input(en)).toBeEnabled();
      if (event === events[0]) {
        await input(en).setInputFiles([...files, samples.suitable.path]);
        await expect(en.getByText('Keep at most 10 prepared photos at a time. Upload or clear a selection first.', { exact: true })).toBeVisible();
      }
      await input(en).setInputFiles(files);
      await expect(en.getByRole('button', { name: 'Upload photo', exact: true })).toHaveCount(10, { timeout: 60000 });
      if (event === first) {
        await input(en).setInputFiles(samples.suitable.path);
        await expect(en.getByRole('alert')).toContainText('Keep at most 10 prepared photos at a time');
      }
      await button(en, 'Upload ready photos').click();
      await expect(cards(en)).toHaveCount(before.size + 10, { timeout: 60000 });
      await expect(en.locator('img[src^="blob:"]')).toHaveCount(0);
      const ids = (await context(en, event)).items.map(item => item.id).filter(id => !before.has(id));
      assert.equal(ids.length, 10);
      for (const id of ids) {
        assert.deepEqual(await readdir(directory(event, id)), ['main', 'thumbnail']);
      }
      let incoming = [];
      const collect = response => {
        if (response.request().method() !== 'GET' || !response.url().startsWith(origin + '/api/class-media?')) return;
        const query = new URL(response.url()).searchParams;
        incoming.push({ id: query.get('item'), variant: query.get('variant'), response });
      };
      en.on('response', collect);
      await en.reload();
      await expect(cards(en)).toHaveCount(before.size + 10);
      await expect.poll(() => incoming.filter(entry => ids.includes(entry.id)).length).toBe(10);
      assert(incoming.every(entry => entry.variant === 'thumbnail'));
      for (const id of ids) {
        const path = directory(event, id);
        const [thumb, main] = await Promise.all([stat(join(path, 'thumbnail')), stat(join(path, 'main'))]);
        storedMain += main.size;
        storedThumbnails += thumb.size;
        const entry = incoming.find(candidate => candidate.id === id);
        assert.equal(entry.response.status(), 200);
        const delivered = (await entry.response.body()).length;
        assert.equal(delivered, thumb.size);
        firstView += delivered;
      }
      const chosen = cards(en).filter({ has: en.locator('img[src*="' + ids[0] + '"]') });
      await button(chosen, 'Open photo').click();
      await expect.poll(() => incoming.filter(entry => entry.variant === 'main').length).toBe(1);
      const mainResponse = incoming.find(entry => entry.variant === 'main').response;
      assert.equal(mainResponse.status(), 200);
      fullViews += (await mainResponse.body()).length;
      await button(en, 'Close photo').click();
      en.off('response', collect);
      if (event === events[0]) {
        await action(en, event, { action: 'tag', item: ids[0], players: [players[0]], confirmed: true });
        await action(en, event, { action: 'consent', item: ids[0], player: players[0], allowed: true });
        await action(en, event, { action: 'publish', item: ids[0] });
        evidence.workload.publishedSample = ids[0];
      }
      console.log('Measured class batch', event.day);
    }
    const published = evidence.workload.publishedSample;
    await clock('2027-05-01T07:59:59+00:00');
    await readBoth(en, first, published, 200);
    await clock('2027-05-01T08:00:00+00:00');
    await readBoth(en, first, published, 403);
    assert(cleanupContains(await clean(first), published));
    assert.deepEqual(await readdir(directory(first, published)), []);
    evidence.workload = { classes: 10, photos: 100, objects: 200, storedMain, storedThumbnails, totalStored: storedMain + storedThumbnails, firstViewThumbnailBodies: firstView, tenOpenedMainBodies: fullViews, elapsedMs: Math.round(performance.now() - start) };
    verified('Ten classes of ten, 100 thumbnails before ten selected full downloads, and 30-day publication expiry');
  }
  if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence, null, 2));
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, { recursive: true, force: true });
}
