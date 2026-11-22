import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { ownerFixture } from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'academyos-ex22-'));
const endpoint = '/api/trainer-compensation';
const month = '2026-11';
let fixture, browser;
try {
  fixture = await ownerFixture(root, temp, { compensation: true });
  browser = await chromium.launch();
  for (const [index, locale] of ['en', 'ar'].entries()) {
    const { academy, trainer, other, events } = fixture.data.compensationDays[index];
    const foreign = fixture.data.compensationDays[1 - index];
    const t = (en, ar) => locale === 'ar' ? ar : en;
    const workspace = `${fixture.origin}/${locale}/workspace/${academy}`;
    async function actor(subject) {
      const context = await browser.newContext();
      await context.addCookies([{ name: 'family-day-actor', value: subject, url: fixture.origin }]);
      return context.newPage();
    }
    const owner = await actor('user_owner');
    const earner = await actor('user_trainer');
    const otherTrainer = await actor('user_other_trainer');
    const manager = await actor('user_manager');
    const outsider = await actor('user_other_owner');
    const button = (page, en, ar) => page.getByRole('button', { name: t(en, ar), exact: true });
    const field = (page, en, ar) => page.getByLabel(t(en, ar), { exact: true });
    const combo = (page, en, ar) => page.getByRole('combobox', { name: t(en, ar), exact: true });
    const idle = page => expect(page.getByText(t('Loading or saving…', 'جارٍ التحميل أو الحفظ…'), { exact: true })).toBeHidden();
    const main = page => page.locator('main.journey-card');
    const commandBody = (action, fields, operation = randomUUID()) => ({ action, operation, ...fields });

    async function call(page, fields, expected = 200, subjectAcademy = academy) {
      const response = await page.request.post(fixture.origin + endpoint, {
        headers: { origin: fixture.origin }, data: { academy: subjectAcademy, ...fields },
      });
      const result = await response.json();
      assert.equal(response.status(), expected, JSON.stringify({ action: fields.action, result }));
      return result.data;
    }
    function waitAction(page, action) {
      return page.waitForResponse(response => new URL(response.url()).pathname === endpoint &&
        response.request().postDataJSON()?.action === action);
    }
    async function clickCommand(page, action, control, expected = 200) {
      const [response] = await Promise.all([waitAction(page, action), control.click()]);
      const result = await response.json();
      assert.equal(response.status(), expected, JSON.stringify({ action, result }));
      await idle(page);
      return result.data;
    }
    async function recoverLostReply(action, control) {
      let original, committed, sends = 0;
      const intercept = async route => {
        const payload = route.request().postDataJSON();
        if (payload?.action !== action) return route.continue();
        sends++;
        original = payload;
        const upstream = await route.fetch({ maxRetries: 0 });
        const result = await upstream.json();
        assert.equal(upstream.status(), 200, JSON.stringify(result));
        assert.ok(result.data?.id);
        committed = result.data;
        await route.abort('failed');
      };
      await owner.route(`**${endpoint}`, intercept);
      await control.click();
      await expect(main(owner).getByRole('alert')).toContainText(t('outcome is unknown', 'النتيجة غير معروفة'));
      await owner.reload();
      const [recovered] = await Promise.all([
        waitAction(owner, 'operation'), button(owner, 'Check original operation', 'تحقق من العملية الأصلية').click(),
      ]);
      assert.equal(recovered.request().postDataJSON().operation, original.operation);
      assert.deepEqual((await recovered.json()).data, committed);
      await expect(main(owner)).toContainText(t('Original operation confirmed.', 'تم تأكيد العملية الأصلية.'));
      assert.equal(sends, 1);
      await owner.unroute(`**${endpoint}`, intercept);
      return original;
    }
    const context = (page, view, staff, scope) => call(page, { action: 'context', view, month, ...(staff ? { staff } : {}) }, 200, scope);
    async function chooseMonth(page) {
      await idle(page);
      const control = field(page, 'Month', 'الشهر');
      if (await control.inputValue() !== month) await control.fill(month);
      await idle(page);
    }
    async function selectTrainer() {
      await chooseMonth(owner);
      await combo(owner, 'Trainer', 'المدرب').selectOption(trainer);
      await expect(button(owner, 'Prepare earnings', 'تجهيز المستحقات')).toBeEnabled();
    }

    await owner.goto(`${workspace}/home`);
    await owner.getByRole('link', { name: t('Trainer earnings', 'مستحقات المدربين'), exact: true }).click();
    await expect(owner).toHaveURL(`${workspace}/trainer-compensation`);
    await selectTrainer();
    await call(earner, { action: 'context', view: 'owner', month }, 403);
    await call(earner, { action: 'context', view: 'trainer', month, staff: other }, 422);
    await call(outsider, { action: 'context', view: 'owner', month }, 403);
    assert.equal((await context(earner, 'trainer')).run, null);

    for (const [start, rate] of [['2026-11-01', '100'], ['2026-11-16', '120']]) {
      await field(owner, 'Effective from', 'ساري من').fill(start);
      await field(owner, 'Session rate', 'أجر الجلسة').fill(rate);
      await clickCommand(owner, 'terms', button(owner, 'Save terms', 'حفظ شروط العقد'));
    }
    const coverageForm = day => owner.locator('article').filter({ has: owner.getByRole('heading', { name: new RegExp(day) }) });
    const cancelled = coverageForm(events.cancelled.day);
    await expect(cancelled.getByRole('button', { name: t('Save attendance', 'حفظ الحضور') })).toBeDisabled();
    await call(owner, commandBody('coverage', { event: foreign.events.overnight.id, staff: trainer, status: 'present', version: 0 }), 403);
    const missingOriginal = randomUUID();
    assert.equal((await call(owner, commandBody('operation', {}, missingOriginal))).cancelled, true);
    await call(owner, commandBody('prepare', { staff: trainer, month }, missingOriginal), 409);
    await clickCommand(owner, 'prepare', button(owner, 'Prepare earnings', 'تجهيز المستحقات'), 409);

    for (const [key, status] of [['overnight', 'present'], ['short', 'present'], ['substitute', 'present'], ['absent', 'absent']]) {
      const form = coverageForm(events[key].day);
      await form.getByRole('combobox', { name: t('Attendance status', 'حالة الحضور'), exact: true }).selectOption(status);
      if (status === 'present') await form.getByRole('combobox', { name: t('Actual trainer', 'المدرب الفعلي'), exact: true }).selectOption(trainer);
      await clickCommand(owner, 'coverage', form.getByRole('button', { name: t('Save attendance', 'حفظ الحضور'), exact: true }));
    }
    const preparation = await recoverLostReply('prepare', button(owner, 'Prepare earnings', 'تجهيز المستحقات'));
    await selectTrainer();
    assert.deepEqual(await fixture.db({ action: 'compensation_audit', academy, operation: preparation.operation }),
      { lines: 3, payouts: 0, operations: 1, audits: 1 });
    let snapshot = await context(owner, 'owner', trainer);
    assert.equal(snapshot.run.total, 34000);
    assert.deepEqual(snapshot.run.lines.map(line => [line.day, line.amount, line.start]), [
      ['2026-11-15', 10000, '2026-11-01'], ['2026-11-18', 12000, '2026-11-16'], ['2026-11-20', 12000, '2026-11-16'],
    ]);
    assert.equal(snapshot.events.find(event => event.id === events.substitute.id).assigned, other);
    assert.equal(snapshot.events.find(event => event.id === events.substitute.id).coverage.staff, trainer);
    assert.equal((await context(earner, 'trainer')).run, null, 'prepared draft must stay private');
    const approval = { run: snapshot.run.id, review: snapshot.run.review, reason: 'Owner verified the sources' };
    for (const page of [earner, otherTrainer, manager, outsider]) await call(page, commandBody('approve', approval), 403);
    await call(owner, commandBody('coverage', { event: events.overnight.id, staff: trainer, status: 'present', version: 1 }));
    await call(owner, commandBody('approve', approval), 409);
    await owner.reload();
    await selectTrainer();
    await expect(main(owner)).toContainText(t('Attendance changed. Prepare earnings again before approval.', 'تغيّر الحضور. أعد تجهيز المستحقات قبل الاعتماد.'));

    await clickCommand(owner, 'prepare', button(owner, 'Prepare earnings', 'تجهيز المستحقات'));
    snapshot = await context(owner, 'owner', trainer);
    assert.equal(snapshot.run.total, 34000);
    assert.notEqual(snapshot.run.review, approval.review);
    await field(owner, 'Approval reason', 'سبب الاعتماد').fill(approval.reason);
    const approveControl = button(owner, 'Approve earnings', 'اعتماد المستحقات');
    let firstApproval;
    if (locale === 'ar') {
      const concurrent = owner.request.post(fixture.origin + endpoint, {
        headers: { origin: fixture.origin }, data: { academy, ...commandBody('approve', { ...approval, review: snapshot.run.review }) },
      });
      const [response, competitor] = await Promise.all([waitAction(owner, 'approve'), concurrent, approveControl.click()]);
      assert.deepEqual([response.status(), competitor.status()].sort(), [200, 409]);
      firstApproval = (response.ok() ? response.request().postDataJSON() : null);
      await owner.reload();
      await selectTrainer();
    } else {
      firstApproval = await recoverLostReply('approve', approveControl);
      await selectTrainer();
    }
    if (firstApproval) {
      assert.equal((await call(owner, firstApproval)).id, snapshot.run.id);
      assert.deepEqual(await fixture.db({ action: 'compensation_audit', academy, operation: firstApproval.operation }),
        { lines: 3, payouts: 0, operations: 1, audits: 1 });
    }
    await call(owner, commandBody('approve', { ...approval, review: snapshot.run.review }), 409);
    const approved = (await context(owner, 'owner', trainer)).run;
    assert.equal(approved.approved, 34000);
    assert.equal(approved.payable, 34000);

    await earner.goto(`${workspace}/trainer/home`);
    await earner.getByRole('link', { name: t('My earnings', 'مستحقاتي'), exact: true }).click();
    await expect(earner).toHaveURL(`${workspace}/trainer/compensation`);
    await chooseMonth(earner);
    await expect(main(earner)).toContainText('340.00');
    await combo(earner, 'Earning line', 'بند المستحقات').selectOption(approved.lines[0].id);
    await field(earner, 'Correction reason', 'سبب التصحيح').fill('Fictional coverage clarification');
    const request = await clickCommand(earner, 'request', button(earner, 'Request correction', 'طلب تصحيح'));
    await call(otherTrainer, commandBody('request', { line: approved.lines[0].id, reason: 'Foreign line' }), 403);
    assert.equal((await context(otherTrainer, 'trainer')).run, null);
    await call(earner, { action: 'context', view: 'trainer', month }, 403, fixture.data.otherAcademy);

    await field(owner, 'Payout amount', 'مبلغ الدفعة').fill('200');
    await field(owner, 'Payout date', 'تاريخ الدفع').fill('2026-11-21');
    await combo(owner, 'Payout method', 'طريقة الدفع').selectOption('bank');
    await owner.getByRole('checkbox', { name: t('I verified this fictional payout', 'تحققت من هذه الدفعة الافتراضية') }).check();
    await expect(button(owner, 'Record payout', 'تسجيل الدفعة')).toBeDisabled();
    await field(owner, 'Payout reference', 'مرجع الدفعة').fill('Fictional internal bank reference');
    const original = await recoverLostReply('payout', button(owner, 'Record payout', 'تسجيل الدفعة'));
    await selectTrainer();
    await call(owner, { ...original, amount: original.amount + 1 }, 409);
    assert.deepEqual(await fixture.db({ action: 'compensation_audit', academy, operation: original.operation }),
      { lines: 3, payouts: 1, operations: 1, audits: 1 });
    let posted = (await context(owner, 'owner', trainer)).run;
    assert.deepEqual([posted.approved, posted.payable, posted.payouts[0].amount], [34000, 14000, 20000]);
    await call(owner, commandBody('payout', { run: posted.id, amount: 14001, method: 'cash', date: '2026-11-21' }), 409);

    await owner.reload();
    await selectTrainer();
    await combo(owner, 'Earning line', 'بند المستحقات').selectOption(posted.lines[0].id);
    await combo(owner, 'Correction request', 'طلب التصحيح').selectOption(request.id);
    await field(owner, 'Correction amount', 'مبلغ التصحيح').fill('-20');
    await field(owner, 'Correction reason', 'سبب التصحيح').fill('Fictional internal reason');
    await clickCommand(owner, 'adjust', button(owner, 'Post correction', 'ترحيل التصحيح'));
    posted = (await context(owner, 'owner', trainer)).run;
    assert.deepEqual([posted.total, posted.approved, posted.payable], [34000, 32000, 12000]);
    assert.deepEqual(posted.lines, approved.lines, 'posted earning history stays immutable');
    assert.equal(posted.requests[0].status, 'resolved');
    const statement = await context(earner, 'trainer');
    assert.equal(statement.run.approved, statement.run.payable + statement.run.payouts.reduce((sum, p) => sum + p.amount, 0));
    assert.doesNotMatch(JSON.stringify(statement), /Fictional internal|Owner verified the sources/);
    await earner.reload();
    await chooseMonth(earner);
    await expect(main(earner)).toContainText('120.00');
    await fixture.db({ action: 'compensation_end_trainer', academy });
    await call(earner, { action: 'context', view: 'trainer', month }, 403);
    await earner.reload();
    await expect(main(earner).getByRole('alert')).toBeVisible();
    await expect(main(earner)).not.toContainText('320.00');
    console.log(`PASS ${locale} EX-22 verified attendance, effective terms, approval, payout recovery, correction and private statement`);
    await Promise.all([owner, earner, otherTrainer, manager, outsider].map(page => page.context().close()));
  }
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, { recursive: true, force: true });
}
