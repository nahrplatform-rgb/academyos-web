// EX-24 connected Support journey: real Next route handlers, real signed-gateway
// RPCs against a disposable PostgreSQL 17 fixture, and Playwright.
//
// Evidence is fixture-level. It does not prove the hosted staging deployment.
// Requires PostgreSQL 17 (same requirement as the other working-day fixtures).
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { ownerFixture } from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'academyos-ex24-connected-'));
const endpoint = '/api/support';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let fixture, browser;
try {
  fixture = await ownerFixture(root, temp, { support: true });
  browser = await chromium.launch();
  const { academies: [academy, otherAcademy], multi } = fixture.data.support;
  assert.equal(academy, fixture.data.academy);
  const origin = fixture.origin;
  const api = async (page, academyId, body, expected = 200) => {
    const response = await page.request.post(origin + endpoint, {
      headers: { origin }, data: { academy_id: academyId, ...body },
    });
    const payload = await response.json();
    assert.equal(response.status(), expected, JSON.stringify({ body, payload }));
    return payload.data;
  };
  const actor = async subject => {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'family-day-actor', value: subject, url: origin }]);
    return context.newPage();
  };

  for (const [index, locale] of ['en', 'ar'].entries()) {
    const t = (en, ar) => locale === 'ar' ? ar : en;
    // The Owner runs the English lifecycle in the first academy. The same
    // synthetic identity runs the Arabic lifecycle in the second academy, which
    // also proves each selected academy keeps its own tickets.
    const subject = index === 0 ? 'user_owner' : multi;
    const selectedAcademy = index === 0 ? academy : otherAcademy;
    const page = await actor(subject);
    const workspace = `${origin}/${locale}/workspace/${selectedAcademy}/support`;
    const button = (name, arabic) => page.getByRole('button', { name: t(name, arabic), exact: true });
    const field = (name, arabic) => page.getByLabel(t(name, arabic), { exact: true });
    const heading = text => page.getByRole('heading', { name: new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
    const action = async (name, control, expected = 200) => {
      const [response] = await Promise.all([
        page.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().postDataJSON()?.action === name),
        control.click(),
      ]);
      const payload = await response.json();
      assert.equal(response.status(), expected, JSON.stringify({ name, payload }));
      return payload.data;
    };

    // Loading and the honest empty state.
    const delay = async route => {
      if (route.request().postDataJSON()?.action === 'list_tickets') await new Promise(r => setTimeout(r, 600));
      await route.continue();
    };
    await page.route(`**${endpoint}`, delay);
    await page.goto(workspace);
    await expect(page.getByRole('status')).toContainText(t('Loading…', 'جارٍ التحميل…'));
    await expect(page.getByText(t('No support tickets yet.', 'لا توجد تذاكر دعم بعد.'), { exact: true })).toBeVisible();
    await page.unroute(`**${endpoint}`, delay);
    if (locale === 'ar') {
      const direction = await field('Subject', 'الموضوع').evaluate(el => getComputedStyle(el.closest('[dir]')).direction);
      assert.equal(direction, 'rtl', 'Arabic Support must render right-to-left');
    }

    // Create, confirm, reload and return to the saved ticket.
    const subjectText = `${locale === 'ar' ? 'تذكرة' : 'Lifecycle'} ${index} ${randomUUID().slice(0, 8)}`;
    await field('Subject', 'الموضوع').fill(subjectText);
    await field('Message', 'الرسالة').fill(t('Initial message body', 'نص الرسالة الأولى'));
    const created = await action('create_ticket', button('Create ticket', 'إنشاء تذكرة'));
    assert.match(created.ticket_id, uuid);
    assert.equal(created.status, 'open');
    await expect(heading(subjectText)).toBeFocused();
    await expect(page.getByText(t('Initial message body', 'نص الرسالة الأولى'))).toBeVisible();

    await page.reload();
    await expect(page.getByRole('button', { name: new RegExp(subjectText) })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(subjectText) }).click();
    await expect(page.getByText(t('Initial message body', 'نص الرسالة الأولى'))).toBeVisible();

    if (index === 0) {
      // Same-academy visibility: another active member sees the thread and replies.
      const peer = await actor(fixture.data.support.peer);
      await peer.goto(`${origin}/en/workspace/${academy}/support`);
      await peer.getByRole('button', { name: new RegExp(subjectText) }).click();
      await expect(peer.getByText('Initial message body')).toBeVisible();
      await peer.getByLabel('Reply', { exact: true }).fill('Peer reply body');
      const [peerResponse] = await Promise.all([
        peer.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().postDataJSON()?.action === 'reply'),
        peer.getByRole('button', { name: 'Send reply', exact: true }).click(),
      ]);
      assert.equal(peerResponse.status(), 200);
      await expect(peer.getByText('Peer reply body')).toBeVisible();
      await peer.context().close();
      await page.reload();
      await page.getByRole('button', { name: new RegExp(subjectText) }).click();
      await expect(page.getByText('Peer reply body')).toBeVisible();
    }

    // Reply, resolve and reopen with reload persistence.
    await field('Reply', 'الرد').fill(t('Owner reply body', 'نص رد المالك'));
    await action('reply', button('Send reply', 'إرسال الرد'));
    await expect(field('Reply', 'الرد')).toBeFocused();
    await expect(page.getByText(t('Owner reply body', 'نص رد المالك'))).toBeVisible();

    await action('resolve', button('Resolve', 'حل'));
    await expect(heading(t('Resolved', 'محلولة'))).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: new RegExp(subjectText) }).click();
    await expect(heading(t('Resolved', 'محلولة'))).toBeVisible();
    await expect(button('Reopen', 'إعادة فتح')).toBeVisible();

    await action('reopen', button('Reopen', 'إعادة فتح'));
    await expect(heading(t('Reopened', 'أعيد فتحها'))).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: new RegExp(subjectText) }).click();
    await expect(heading(t('Reopened', 'أعيد فتحها'))).toBeVisible();

    // Return across the real language control and back to the same saved thread.
    const alternateLocale = locale === 'ar' ? 'en' : 'ar';
    const alt = (en, ar) => alternateLocale === 'ar' ? ar : en;
    await page.getByRole('link', { name: t('العربية', 'English'), exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${alternateLocale}/workspace/${selectedAcademy}/support`));
    await expect(page.getByRole('button', { name: new RegExp(subjectText) })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(subjectText) }).click();
    await expect(page.getByRole('heading', { name: new RegExp(alt('Reopened', 'أعيد فتحها')) })).toBeVisible();
    await page.getByRole('link', { name: alt('العربية', 'English'), exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/workspace/${selectedAcademy}/support`));
    await expect(page.getByRole('button', { name: new RegExp(subjectText) })).toBeVisible();

    if (index === 0) {
      // A transport failure never reports success and keeps the original operation.
      const recoverySubject = `Recovery ${randomUUID().slice(0, 8)}`;
      let original, sends = 0;
      const intercept = async route => {
        if (route.request().postDataJSON()?.action !== 'create_ticket') return route.continue();
        sends++;
        original = route.request().postDataJSON();
        const upstream = await route.fetch({ maxRetries: 0 });
        const body = await upstream.json();
        assert.equal(upstream.status(), 200, JSON.stringify(body));
        assert.ok(body.data?.ticket_id);
        await route.abort('failed');
      };
      await page.route(`**${endpoint}`, intercept);
      await field('Subject', 'الموضوع').fill(recoverySubject);
      await field('Message', 'الرسالة').fill('Committed but response lost');
      await button('Create ticket', 'إنشاء تذكرة').click();
      await expect(page.locator('main').getByRole('alert')).toContainText(t('outcome is unknown', 'النتيجة غير معروفة'));
      await expect(heading(recoverySubject)).toHaveCount(0);
      const [reconciled] = await Promise.all([
        page.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().postDataJSON()?.action === 'reconcile'),
        button('Check original operation', 'تحقق من العملية الأصلية').click(),
      ]);
      assert.equal(reconciled.request().postDataJSON().op, original.op);
      await expect(heading(recoverySubject)).toBeFocused();
      await expect(page.getByText('Committed but response lost')).toBeVisible();
      await page.unroute(`**${endpoint}`, intercept);
      assert.equal(sends, 1, 'the original operation must be reused, not reissued as a new one');
      const recovered = (await api(page, academy, { action: 'list_tickets' }))
        .filter(item => item.subject === recoverySubject);
      assert.equal(recovered.length, 1, 'a lost response must not duplicate the ticket');

      // A provider failure shows a recoverable error, not a false success.
      const failure = async route => {
        if (route.request().postDataJSON()?.action === 'list_tickets') await route.abort('failed');
        else await route.continue();
      };
      await page.route(`**${endpoint}`, failure);
      await page.reload();
      await expect(page.locator('main').getByRole('alert')).toBeVisible();
      await page.unroute(`**${endpoint}`, failure);
      await page.reload();
      await expect(page.locator('main').getByRole('alert')).toBeHidden();

      // A non-member is refused by the server boundary and keeps the refusal visible.
      const outsider = await actor('user_platform');
      await outsider.goto(`${origin}/en/workspace/${academy}/support`);
      await expect(outsider.getByText('No support tickets yet.', { exact: true })).toBeVisible();
      const before = (await api(page, academy, { action: 'list_tickets' })).length;
      await outsider.getByLabel('Subject', { exact: true }).fill('Unauthorized ticket');
      await outsider.getByLabel('Message', { exact: true }).fill('Must not persist');
      const [refused] = await Promise.all([
        outsider.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().postDataJSON()?.action === 'create_ticket'),
        outsider.getByRole('button', { name: 'Create ticket', exact: true }).click(),
      ]);
      assert.equal(refused.status(), 403);
      await expect(outsider.locator('main').getByRole('alert')).toContainText('Access is unavailable');
      assert.equal((await api(page, academy, { action: 'list_tickets' })).length, before);
      await outsider.context().close();
    }

    console.log(`PASS ${locale} EX-24 create, reload, reply, resolve, reopen and return`);
    await page.context().close();
  }

  // One identity in two academies: distinctive tickets stay in the selected academy.
  const page = await actor(multi);
  const stamp = randomUUID().slice(0, 8);
  const firstSubject = `Cross A1 ${stamp}`;
  const secondSubject = `Cross A2 ${stamp}`;
  async function createIn(locale, academyId, subject) {
    await page.goto(`${origin}/${locale}/workspace/${academyId}/support`);
    await page.getByLabel('Subject', { exact: true }).fill(subject);
    await page.getByLabel('Message', { exact: true }).fill(`Body for ${subject}`);
    const [response] = await Promise.all([
      page.waitForResponse(r => new URL(r.url()).pathname === endpoint && r.request().postDataJSON()?.action === 'create_ticket'),
      page.getByRole('button', { name: 'Create ticket', exact: true }).click(),
    ]);
    const payload = await response.json();
    assert.equal(response.status(), 200, JSON.stringify(payload));
    return payload.data.ticket_id;
  }
  const firstId = await createIn('en', academy, firstSubject);
  const secondId = await createIn('en', otherAcademy, secondSubject);
  assert.notEqual(firstId, secondId);

  await page.reload();
  await expect(page.getByRole('button', { name: new RegExp(secondSubject) })).toBeVisible();
  assert.equal(await page.getByRole('button', { name: new RegExp(firstSubject) }).count(), 0);

  await page.goto(`${origin}/en/workspace/${academy}/support`);
  await expect(page.getByRole('button', { name: new RegExp(firstSubject) })).toBeVisible();
  assert.equal(await page.getByRole('button', { name: new RegExp(secondSubject) }).count(), 0);

  const firstList = await api(page, academy, { action: 'list_tickets' });
  const secondList = await api(page, otherAcademy, { action: 'list_tickets' });
  assert.ok(firstList.some(item => item.id === firstId));
  assert.ok(!firstList.some(item => item.id === secondId));
  assert.ok(secondList.some(item => item.id === secondId));
  assert.ok(!secondList.some(item => item.id === firstId));
  const firstMessages = await api(page, academy, { action: 'list_messages', ticket_id: firstId });
  const secondMessages = await api(page, otherAcademy, { action: 'list_messages', ticket_id: secondId });
  assert.deepEqual(firstMessages.map(message => message.body), [`Body for ${firstSubject}`]);
  assert.deepEqual(secondMessages.map(message => message.body), [`Body for ${secondSubject}`]);
  await page.context().close();

  console.log('PASS EX-24 one identity switching academies keeps each selected academy isolated');
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, { recursive: true, force: true });
}
