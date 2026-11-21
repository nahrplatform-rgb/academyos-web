// Production Next routes and handlers, with isolated fictional actors and signed PG17 RPCs.
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium, expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'academyos-family-day-'));
const dayChecks = [];
let fixture, browser;
try {
  fixture = await ownerFixture(root, temp, {reviews: true, familyDay: true});
  browser = await chromium.launch();
  for (const [index, locale] of ['en', 'ar'].entries()) {
    const {academy, event, child, link, siblingLink, unrostered, staff} = fixture.data.familyDays[index];
    const base = `${fixture.origin}/${locale}/workspace/${academy}`;
    const t = (en, ar) => locale === 'ar' ? ar : en;
    const privateNote = 'FICTIONAL PRIVATE STAFF NOTE';
    const returnReason = 'FICTIONAL PRIVATE RETURN REASON';
    const correctionReason = 'FICTIONAL PRIVATE REQUEST REASON';
    const decisionReason = 'FICTIONAL PRIVATE DECISION REASON';
    const withdrawalReason = 'FICTIONAL PRIVATE WITHDRAWAL REASON';
    const first = t('Fictional first-touch strengths', 'نقاط قوة خيالية في اللمسة الأولى');
    const revised = t('Fictional passing strengths', 'نقاط قوة خيالية في التمرير');
    const amended = t('Fictional amended strengths', 'نقاط قوة خيالية بعد التعديل');
    const privateValues = [privateNote, returnReason, correctionReason, decisionReason, withdrawalReason];
    async function actor(role) {
      const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
      await context.addCookies([{name: 'family-day-actor', value: 'user_' + role, url: fixture.origin}]);
      return context.newPage();
    }
    const trainer = await actor('trainer');
    const owner = await actor('owner');
    const guardian = await actor('guardian');
    const errors = [];
    for (const page of [trainer, owner, guardian]) page.on('pageerror', error => errors.push(error.message));
    const button = (page, en, ar) => page.getByRole('button', {name: t(en, ar), exact: true});
    const nav = (page, en, ar) => page.locator('nav:visible').getByRole('link', {name: t(en, ar), exact: true});
    const pane = page => page.locator('.workspace-inspector');
    const body = page => page.locator('main');
    const ref = `event=${event}&player=${child}`;
    const details = `${base}/development?${ref}`;
    const family = `${base}/guardian`;
    async function api(page, route, payload, expected = 200) {
      const reply = await page.request.post(`${fixture.origin}/api/${route}`, {
        headers: {origin: fixture.origin}, data: {academy, ...payload},
      });
      const data = await reply.json();
      assert.equal(reply.status(), expected, JSON.stringify({route, action: payload.action, data}));
      return data;
    }
    async function command(page, route, action, click) {
      const result = page.waitForResponse(response => new URL(response.url()).pathname === '/api/' + route
        && (route === 'development' ? response.request().postDataJSON()?.command : response.request().postDataJSON()?.action) === action);
      await click.click();
      const response = await result;
      const data = await response.json();
      assert.ok(response.ok() && data.data && !data.data.error, JSON.stringify(data));
      return data.data;
    }
    async function fillFeedback(strengths) {
      const fields = trainer.locator('.development-workspace textarea');
      await expect(fields).toHaveCount(4);
      await fields.nth(0).fill(strengths);
      await fields.nth(1).fill(t('Fictional improvement focus', 'محور تحسين خيالي'));
      await fields.nth(2).fill(t('Fictional next practice', 'تدريب خيالي قادم'));
      await fields.nth(3).fill(privateNote);
    }
    async function submitFeedback() {
      await button(trainer, 'Review submission', 'مراجعة الإرسال').click();
      return command(trainer, 'development', 'submit', button(trainer, 'Submit for Owner review', 'إرسال لمراجعة المالك'));
    }
    async function followOwnerFeedback() {
      await owner.goto(base + '/home');
      await owner.getByRole('link', {name: t('Review submitted feedback', 'مراجعة الملاحظات المقدمة')}).click();
      await expect(owner).toHaveURL(url => url.pathname.endsWith('/development') && url.searchParams.get('player') === child);
    }
    async function publish() {
      await followOwnerFeedback();
      await button(owner, 'Review publication', 'مراجعة النشر').click();
      return command(owner, 'development', 'publish', button(owner, 'Confirm publication', 'تأكيد النشر'));
    }
    async function familyFeedback() {
      await guardian.goto(family + '/home?link=' + link);
      const latest = guardian.locator('.experience-task-card').filter({
        has: guardian.getByRole('heading', {name: t('Latest published feedback', 'آخر ملاحظات منشورة'), exact: true}),
      }).filter({has: guardian.getByRole('link', {name: t('Open details', 'فتح التفاصيل'), exact: true})});
      await latest.getByRole('link', {name: t('Open details', 'فتح التفاصيل'), exact: true}).click();
      await expect(guardian).toHaveURL(url => url.pathname.endsWith('/guardian/development') && url.searchParams.get('link') === link);
    }
    function privateFieldsAbsent(value) {
      const serialized = JSON.stringify(value);
      for (const privateValue of [...privateValues, staff]) assert.ok(!serialized.includes(privateValue));
      for (const key of ['private', 'internal_reason', 'actor', 'author', 'publisher', 'reviewer', 'history']) {
        assert.ok(!serialized.includes(`"${key}":`), key);
      }
    }
    const pass = name => { dayChecks.push(`${locale} ${name}`); console.log(`PASS ${dayChecks.at(-1)}`); };

    // Enter Trainer Today, open assigned feedback, then resume the exact saved draft from Today.
    await trainer.goto(base + '/trainer/home');
    await expect(trainer.getByRole('heading', {name: t('Tasks and reviews', 'المهام والمراجعات'), exact: true})).toBeVisible();
    await trainer.goto(details);
    await button(trainer, 'Write feedback', 'كتابة الملاحظات').click();
    await fillFeedback(first);
    const draft = await command(trainer, 'development', 'save', button(trainer, 'Save draft', 'حفظ المسودة'));
    await trainer.goto(base + '/trainer/home');
    await trainer.getByRole('link', {name: t('Continue feedback', 'متابعة الملاحظات'), exact: true}).click();
    await expect(trainer).toHaveURL(url => url.searchParams.get('event') === event && url.searchParams.get('player') === child);
    await button(trainer, 'Continue draft', 'متابعة المسودة').click();
    await expect(trainer.locator('.development-workspace textarea').first()).toHaveValue(first);
    const submission = await submitFeedback();
    assert.equal(submission.id, draft.id);
    const assessment = submission.id;
    assert.equal((await api(guardian, 'development', {action: 'family_list', link})).data.items.length, 0);
    await api(trainer, 'development', {action: 'detail', event, player: unrostered}, 403);
    const unrelated = await actor('other_owner');
    await api(unrelated, 'development', {action: 'detail', event, player: child}, 403);
    await unrelated.context().close();
    pass('Trainer Today resumes the assigned draft and rejects out-of-scope feedback');

    await followOwnerFeedback();
    await expect(body(owner)).toContainText(privateNote);
    await button(owner, 'Request changes', 'طلب تعديلات').click();
    await owner.locator('.development-workspace textarea').fill(returnReason);
    await command(owner, 'development', 'return', button(owner, 'Confirm return', 'تأكيد الإعادة'));
    await trainer.goto(base + '/trainer/home');
    await trainer.getByRole('link', {name: t('Continue feedback', 'متابعة الملاحظات'), exact: true}).click();
    await expect(body(trainer)).toContainText(returnReason);
    await button(trainer, 'Continue draft', 'متابعة المسودة').click();
    await fillFeedback(revised);
    await submitFeedback();
    await publish();
    await familyFeedback();
    await expect(pane(guardian)).toContainText(revised);
    await expect(pane(guardian)).not.toContainText(privateNote);
    const current = await api(guardian, 'development', {action: 'family_detail', link, assessment});
    assert.deepEqual(Object.keys(current.data.fields).sort(), ['focus', 'next', 'strengths']);
    privateFieldsAbsent(current);
    assert.equal((await api(guardian, 'development', {action: 'family_list', link: siblingLink})).data.items.length, 0);
    await api(guardian, 'development', {action: 'family_detail', link: siblingLink, assessment}, 403);
    await api(guardian, 'development', {action: 'detail', event, player: child}, 403);
    pass('different Owner returns and publishes only three public fields to the linked child');

    // Switch explicitly from the sibling and follow the actual sidebar links.
    await guardian.goto(family + '/home?link=' + siblingLink);
    const homePicker = guardian.locator('.experience-player-picker select');
    await expect(homePicker).toHaveValue(siblingLink);
    await expect(body(guardian)).not.toContainText(revised);
    await homePicker.selectOption(link);
    await expect(nav(guardian, 'Calendar', 'التقويم')).toHaveAttribute('href', new RegExp(`link=${link}$`));
    await nav(guardian, 'Calendar', 'التقويم').click();
    await expect(guardian.locator('.experience-player-picker select')).toHaveValue(link);
    await guardian.locator('button[data-occurrence]').click();
    await guardian.getByRole('link', {name: t('Open player training', 'فتح تدريبات اللاعب')}).click();
    await expect(guardian).toHaveURL(url => url.searchParams.get('link') === link && url.searchParams.get('event') === event);
    await expect(pane(guardian)).toContainText(t('Present', 'حاضر'));
    await nav(guardian, 'Development', 'التطور').click();
    await expect(guardian).toHaveURL(url => url.pathname.endsWith('/guardian/development') && url.searchParams.get('link') === link);
    await expect(guardian.getByRole('heading', {name: t('Published feedback', 'ملاحظات منشورة'), exact: true})).toBeVisible();
    await expect(body(guardian)).not.toContainText('Fictional second child');
    await nav(guardian, 'Home', 'الرئيسية').click();
    await expect(guardian.locator('.experience-player-picker select')).toHaveValue(link);
    await api(guardian, 'guardian-training', {action: 'detail', link: siblingLink, event}, 403);
    pass('Guardian navigation keeps selected-child Calendar, Attendance, Progress, and Home');

    await trainer.goto(`${base}/attendance/corrections?${ref}`);
    await button(trainer, 'Request correction', 'طلب تصحيح').click();
    await trainer.locator('.correction-workspace textarea, .workspace-inspector textarea').fill(correctionReason);
    await button(trainer, 'Review exact change', 'مراجعة التغيير المحدد').click();
    await trainer.getByRole('checkbox', {name: t('I reviewed this player, session and consequence.', 'راجعت اللاعب والتدريب والنتيجة.')}).check();
    const request = await command(trainer, 'attendance', 'correction_submit', button(trainer, 'Submit request', 'إرسال الطلب'));
    await expect(pane(trainer)).toContainText(t('Waiting for the Owner. Attendance remains unchanged.', 'بانتظار المالك. لم يتغير الحضور.'));
    await nav(trainer, 'Today', 'اليوم').click();
    await expect(trainer).toHaveURL(base + '/trainer/home');
    await trainer.getByRole('link', {name: t('Review requested correction', 'مراجعة التصحيح المطلوب'), exact: true}).click();
    await expect(trainer).toHaveURL(url => url.searchParams.get('request') === request.request);
    await expect(body(trainer)).toContainText(correctionReason);
    await expect(body(trainer)).not.toContainText(t('Review decision', 'مراجعة القرار'));
    await owner.goto(base + '/home');
    await owner.getByRole('link', {name: t('Review requested correction', 'مراجعة التصحيح المطلوب'), exact: true}).click();
    await button(owner, 'Review decision', 'مراجعة القرار').click();
    await owner.locator('.workspace-inspector textarea, .workspace-task-body textarea').fill(decisionReason);
    await button(owner, 'Review exact change', 'مراجعة التغيير المحدد').click();
    await owner.getByRole('checkbox', {name: t('I reviewed this player, session and consequence.', 'راجعت اللاعب والتدريب والنتيجة.')}).check();
    await command(owner, 'attendance', 'correction_decide', button(owner, 'Confirm decision', 'تأكيد القرار'));
    await guardian.goto(`${family}/training?link=${link}&event=${event}&from=${fixture.data.familyDays[index].day}`);
    await expect(pane(guardian)).toContainText(t('Absent', 'غائب'));
    const attendance = await api(guardian, 'guardian-training', {action: 'detail', link, event});
    assert.equal(attendance.data.item.status, 'absent');
    assert.equal(attendance.data.item.corrected, true);
    privateFieldsAbsent(attendance);
    await api(guardian, 'attendance', {action: 'correction_detail', event, request: request.request}, 403);
    pass('Trainer resumes the exact pending request, Owner decides, Guardian sees only corrected attendance');

    await trainer.goto(details);
    await command(trainer, 'development', 'amend', button(trainer, 'Propose an amendment', 'اقتراح تعديل'));
    await button(trainer, 'Continue draft', 'متابعة المسودة').click();
    await fillFeedback(amended);
    await submitFeedback();
    await familyFeedback();
    await expect(pane(guardian)).toContainText(revised);
    await expect(pane(guardian)).not.toContainText(amended);
    await publish();
    await button(guardian, 'Refresh view', 'تحديث العرض').click();
    await expect(pane(guardian)).toContainText(amended);
    await owner.goto(details);
    await button(owner, 'Withdraw publication', 'سحب المنشور').click();
    await owner.locator('.development-workspace textarea').fill(withdrawalReason);
    await command(owner, 'development', 'withdraw', button(owner, 'Confirm withdrawal', 'تأكيد السحب'));
    await button(guardian, 'Refresh view', 'تحديث العرض').click();
    await expect(guardian.getByRole('heading', {name: t('Nothing to show in this selection', 'لا توجد نتائج ضمن هذا الاختيار')})).toBeVisible();
    await expect(body(guardian)).not.toContainText(amended);
    await expect(nav(guardian, 'Calendar', 'التقويم')).toHaveAttribute('href', new RegExp(`link=${link}$`));
    await api(guardian, 'development', {action: 'family_detail', link, assessment}, 403);
    const history = await api(owner, 'development', {action: 'history', event, player: child});
    assert.equal(history.data.items[0].reason, withdrawalReason);
    assert.deepEqual(await fixture.db({action: 'family_day_audit', assessment}),
      {publications: 2, submissions: 3, currentPublication: null});
    assert.deepEqual(errors, []);
    pass('prior publication survives amendment review and withdrawal clears family view while retaining history');
    for (const page of [trainer, owner, guardian]) await page.context().close();
  }
  assert.equal(dayChecks.length, 10);
  console.log('PASS EX-20: 10 connected EN/AR verifications on one local production build');
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, {recursive: true, force: true});
}
