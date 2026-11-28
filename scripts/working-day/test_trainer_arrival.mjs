import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { ownerFixture } from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'academyos-ex22-arrival-'));
const endpoint = '/api/trainer-compensation';
let fixture, browser;
const checks = [];
function check(name, condition, details = '') {
  assert.ok(condition, `${name}${details ? `: ${details}` : ''}`);
  checks.push(name);
}
try {
  fixture = await ownerFixture(root, temp, { compensation: true });
  browser = await chromium.launch();
  const { academy, branch: branchId, trainer, other, events } = fixture.data.compensationDays[0];
  check('fixture exposes compensation academy and trainer', Boolean(academy && trainer));

  const context = await browser.newContext();
  await context.addCookies([{ name: 'family-day-actor', value: 'user_owner', url: fixture.origin }]);
  const page = await context.newPage();
  await page.goto(`${fixture.origin}/en/workspace/${academy}/trainer-compensation`);

  async function post(payload, expected = 200) {
    const response = await page.evaluate(async ({ endpoint, payload }) => {
      const result = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: location.origin },
        body: JSON.stringify(payload),
      });
      return { status: result.status, body: await result.json() };
    }, { endpoint, payload });
    if (expected === 'status') return response;
    assert.equal(response.status, expected, JSON.stringify({ action: payload.action, response }));
    return response.body.data;
  }
  async function db(command) { return fixture.db(command); }

  const eventIds = [events.overnight.id, events.short.id, events.absent.id];
  const laterEvent = events.substitute.id;
  const stage = stage => db({ action: 'compensation_arrival_stage', stage });
  await stage('arrival');
  check('owner context exposes trainer branch', Boolean(branchId));
  const ownerContext = await post({ action: 'staff_context', academy, branch: branchId });
  check('staff context is signed and owner-scoped', Array.isArray(ownerContext.staff) && Array.isArray(ownerContext.arrivals));

  const cardCode = `aos:staff:1:${'A'.repeat(43)}`;
  const cardOp = randomUUID();
  const card = await post({ action: 'staff_card', academy, operation: cardOp,
    branch: branchId, staff: trainer, expected: null, code: cardCode });
  check('issue staff QR credential', Boolean(card?.id));
  check('same-original card operation replays', JSON.stringify(await post({ action: 'staff_card', academy, operation: cardOp,
    branch: branchId, staff: trainer, expected: null, code: cardCode })) === JSON.stringify(card));
  await post({ action: 'staff_card', academy, operation: cardOp, branch: branchId,
    staff: trainer, expected: null, code: `aos:staff:1:${'B'.repeat(43)}` }, 409);
  check('same-original card operation rejects changed intent', true);

  const staffed = await post({ action: 'staff_context', academy, branch: branchId });
  check('issued credential appears in owner context', staffed.staff.some(item => item.id === trainer && item.card === card.id));

  await page.goto(`${fixture.origin}/en/workspace/${academy}/attendance/scan?day=2026-11-15`);
  const panel = page.getByRole('region', { name: 'Trainer attendance' });
  await expect(panel.getByLabel('Trainer QR code')).toBeEnabled();
  await page.getByRole('button', { name: 'Open scanner', exact: true }).click();
  await page.getByLabel('Card code fallback').fill(cardCode);
  const [capture] = await Promise.all([
    page.waitForResponse(response => response.url().endsWith(endpoint) && response.request().postDataJSON()?.action === 'staff_arrival'),
    page.getByRole('button', { name: 'Read card code', exact: true }).click(),
  ]);
  assert.equal(capture.status(), 200);
  const scan = (await capture.json()).data;
  await expect(panel.getByText('Trainer operation confirmed.')).toBeVisible();
  const phone = await context.newPage();
  await phone.setViewportSize({ width: 390, height: 844 });
  await phone.goto(`${fixture.origin}/ar/workspace/${academy}/attendance/scan?day=2026-11-15`);
  const offlineCode = phone.getByRole('region', { name: 'حضور المدربين' }).getByLabel('رمز المدرب');
  await expect(offlineCode).toBeEnabled();
  await offlineCode.fill(cardCode);
  await context.setOffline(true);
  try {
    await expect(phone.getByText('تسجيل وصول المدرب غير متاح دون اتصال.')).toBeVisible();
    await expect(phone.getByRole('button', { name: 'امسح بطاقة المدرب' })).toBeDisabled();
    await expect(phone.getByText('تم تأكيد عملية المدرب.')).toHaveCount(0);
  } finally {
    await context.setOffline(false);
    await phone.close();
  }
  assert.deepEqual(scan.candidates.map(slot => slot.id), eventIds);
  check('16:55 scan records the three contiguous 17:00–19:00 sessions', Boolean(scan.arrival));
  const verify = { action: 'staff_verify', academy, branch: branchId, arrival: scan.arrival,
    reason: 'Synthetic substitute coverage', coverage: eventIds.map((event, i) => ({ event, staff: i === 2 ? other : trainer, version: 0 })) };
  await post({ ...verify, operation: randomUUID() }, 409);
  check('arrival does not confirm future coverage', true);
  const recoveryOp = randomUUID();
  let committedRecovery;
  await page.route('**/api/trainer-compensation', async route => {
    if (route.request().postDataJSON()?.action !== 'staff_arrival') return route.continue();
    const upstream = await route.fetch();
    committedRecovery = (await upstream.json()).data;
    await route.abort('failed');
  });
  const lost = await page.evaluate(async ({ endpoint, academy, branch, code, operation }) => {
    try {
      await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', origin: location.origin },
        body: JSON.stringify({ academy, action: 'staff_arrival', operation, branch, code, event: null }) });
      return false;
    } catch { return true; }
  }, { endpoint, academy, branch: branchId, code: cardCode, operation: recoveryOp });
  await page.unroute('**/api/trainer-compensation');
  check('lost QR reply is observable as a transport failure', lost && Boolean(committedRecovery?.arrival));
  const recovered = await post({ action: 'operation', academy, operation: recoveryOp });
  assert.deepEqual(recovered, committedRecovery);
  check('same-original QR arrival recovers after lost reply without creating a second arrival', recovered.arrival === scan.arrival);

  await stage('complete');
  const verifyOps = [randomUUID(), randomUUID()];
  const attempts = await Promise.all(verifyOps.map(operation => post({ ...verify, operation }, 'status')));
  assert.deepEqual(attempts.map(result => result.status).sort(), [200, 409]);
  const winner = attempts.findIndex(result => result.status === 200);
  const verifyOp = verifyOps[winner];
  check('completed coverage commits once under concurrent confirmation', attempts[winner].body.data?.action === 'staff_verify');
  const reviewed = await post({ action: 'staff_context', academy, branch: branchId });
  assert.deepEqual(reviewed.arrivals.find(item => item.id === scan.arrival).candidates.map(x => [x.actual, x.coverageVersion]),
    [[trainer, 1], [trainer, 1], [other, 1]]);
  await post({ ...verify, operation: randomUUID() }, 409);
  check('stale coverage version is refused', true);
  const audit = await db({ action: 'compensation_audit', academy, operation: verifyOp });
  assert.deepEqual(audit, { lines: 0, payouts: 0, operations: 1, audits: 1 });
  for (const [staff, rate, total] of [[trainer, 10000, 20000], [other, 12000, 12000]]) {
    await post({ action: 'terms', academy, operation: randomUUID(), staff, start: '2026-11-01',
      basis: 'session', rate, fixed: 0, frequency: 'month' });
    await post({ action: 'prepare', academy, operation: randomUUID(), staff, period: '2026-11-15' });
    const context = await post({ action: 'context', academy, view: 'owner', staff, period: '2026-11-15' });
    assert.equal(context.run.total, total);
  }
  check('verified coverage pays 200.00 and 120.00 to the actual Trainers', true);

  await stage('later');
  const manualOp = randomUUID();
  const manual = await post({ action: 'staff_arrival', academy, operation: manualOp,
    branch: branchId, staff: trainer, event: laterEvent,
    reason: 'Synthetic missed scan recovery' });
  check('manual arrival records an arrival', Boolean(manual?.arrival) && manual?.candidates?.length === 1);
  check('same-original manual arrival replays', JSON.stringify(await post({ action: 'staff_arrival', academy, operation: manualOp,
    branch: branchId, staff: trainer, event: laterEvent,
    reason: 'Synthetic missed scan recovery' })) === JSON.stringify(manual));
  await post({ action: 'staff_arrival', academy, operation: manualOp, branch: branchId,
    staff: trainer, event: events.overnight.id, reason: 'Changed original' }, 409);
  check('same-original arrival rejects changed intent', true);
  await stage('cancel');
  await post({ action: 'staff_verify', academy, operation: randomUUID(), branch: branchId,
    arrival: manual.arrival, coverage: [{ event: laterEvent, staff: trainer, version: 0 }] }, 409);
  check('cancellation after arrival refuses coverage', true);

  const revokeOp = randomUUID();
  await post({ action: 'staff_card', academy, operation: revokeOp, branch: branchId,
    staff: trainer, expected: card.id, code: null });
  check('revoke staff QR credential', true);
  const revokedContext = await post({ action: 'staff_context', academy, branch: branchId });
  check('revoked credential disappears from context', revokedContext.staff.some(item => item.id === trainer && item.card === null));
  await post({ action: 'staff_arrival', academy, operation: randomUUID(), branch: branchId,
    code: cardCode }, 403);
  check('revoked QR credential cannot capture', true);

  const pay = fixture.data.compensationDays[1];
  const payCommand = (action, fields) => post({ action, academy: pay.academy, operation: randomUUID(), ...fields });
  for (const [staff, basis, rate, total] of [[pay.trainer, 'fixed', 0, 70000], [pay.other, 'hybrid', 12000, 82000]]) {
    await payCommand('terms', { staff, start: '2026-11-16', end: '2026-11-22',
      basis, rate, fixed: 70000, fixedUnit: 'week', frequency: 'week' });
    if (basis === 'hybrid') {
      const event = pay.events.substitute.id;
      await payCommand('coverage', { event, staff, status: 'present', version: 0 });
      await payCommand('extra', { event, staff, reason: 'Synthetic eligible extra' });
    }
    await payCommand('prepare', { staff, period: '2026-11-20' });
    const result = await post({ action: 'context', academy: pay.academy, view: 'owner', staff, period: '2026-11-20' });
    assert.equal(result.run.total, total);
    assert.equal(result.run.lines.filter(line => line.event !== null).length, basis === 'hybrid' ? 1 : 0);
  }
  check('missing scan leaves 700.00 fixed pay; one verified hybrid extra yields 820.00', true);

  console.log(JSON.stringify({
    status: 'PASS',
    checks,
    limits: ['Physical camera and same-register player QR readback are separate checks.']
  }, null, 2));
  await context.close();
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, { recursive: true, force: true });
}
