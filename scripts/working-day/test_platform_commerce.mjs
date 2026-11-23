import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, expect } from '@playwright/test';
import { ownerFixture } from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'academyos-ex23-'));
const endpoint = '/api/platform-commerce';
let fixture, browser;
try {
  fixture = await ownerFixture(root, temp, { commerce: true });
  browser = await chromium.launch();
  async function actor(subject) {
    const context = await browser.newContext();
    await context.addCookies([{ name: 'family-day-actor', value: subject, url: fixture.origin }]);
    return context.newPage();
  }
  const platform = await actor('user_platform');
  const ownerPrimary = await actor('user_owner');
  const ownerSecondary = await actor('user_other_owner');
  async function onboardingAction(page, action, trigger, expected = 200) {
    const [response] = await Promise.all([
      page.waitForResponse(response => new URL(response.url()).pathname === '/api/onboarding' &&
        response.request().postDataJSON()?.action === action),
      trigger(),
    ]);
    const result = await response.json();
    assert.equal(response.status(), expected, JSON.stringify({ action, result }));
    return result.data;
  }
  const clickOnboarding = (page, action, control) => onboardingAction(page, action, () => control.click());

  for (const [index, { locale, existing }] of [
    { locale: 'en', existing: false },
    { locale: 'ar', existing: false },
    { locale: 'en', existing: true },
  ].entries()) {
    let academy = fixture.data.commerceAcademies[0];
    const setDay = day => fixture.db({ action: 'commerce_clock', day, academy });
    const ownerSubject = locale === 'ar' ? 'user_other_owner' : 'user_owner';
    const owner = locale === 'ar' ? ownerSecondary : ownerPrimary;
    const outsider = locale === 'ar' ? ownerPrimary : ownerSecondary;
    const t = (en, ar) => locale === 'ar' ? ar : en;
    const button = (page, en, ar) => page.getByRole('button', { name: t(en, ar), exact: true });
    const field = (page, en, ar) => page.getByLabel(t(en, ar), { exact: true });
    const combo = (page, en, ar) => page.getByRole('combobox', { name: t(en, ar), exact: true });
    const platformRoute = `${fixture.origin}/${locale}/platform/commerce`;
    const waitAction = (page, action) => page.waitForResponse(response => new URL(response.url()).pathname === endpoint &&
      response.request().postDataJSON()?.action === action);
    async function click(page, action, control) {
      const [response] = await Promise.all([waitAction(page, action), control.click()]);
      assert.equal(response.status(), 200, JSON.stringify(await response.json()));
    }
    const state = (page, en, ar) => expect(page.locator('main.journey-card')).toContainText(t(en, ar));
    await setDay('2026-11-01');
    if (!existing) {
      await platform.goto(`${fixture.origin}/${locale}/platform`);
      await button(platform, 'Create a synthetic academy', 'إنشاء أكاديمية اختبار').click();
      await field(platform, 'Academy name', 'اسم الأكاديمية').fill(`Fictional commerce academy ${locale}`);
      await field(platform, 'Intended owner email', 'بريد المالك المقصود').fill(
        locale === 'ar' ? 'other@academy.example' : 'owner@academy.example');
      await button(platform, 'Review appointment', 'مراجعة التعيين').click();
      const invite = await clickOnboarding(platform, 'create',
        button(platform, 'Create and invite owner', 'إنشاء ودعوة المالك'));
      academy = invite.academy_id;
      await expect(platform.locator('.admission-layout')).toContainText(t('Owner acceptance pending', 'بانتظار قبول المالك'));
      const token = createHmac('sha256', 'a'.repeat(64))
        .update(`invitation:v1:${invite.invitation_id}:${invite.generation}`).digest('hex');
      const wrongOwner = await actor(locale === 'ar' ? 'user_owner' : 'user_other_owner');
      await onboardingAction(wrongOwner, 'review', () =>
        wrongOwner.goto(`${fixture.origin}/${locale}/invitation#${invite.invitation_id}.${token}`), 403);
      await expect(wrongOwner.getByRole('alert').filter({ hasText: t('Access is unavailable for this account.', 'الصلاحية غير متاحة لهذا الحساب.') }))
        .toContainText(t('Access is unavailable for this account.', 'الصلاحية غير متاحة لهذا الحساب.'));
      await wrongOwner.context().close();
      await owner.goto(`${fixture.origin}/${locale}/invitation#${invite.invitation_id}.${token}`);
      await clickOnboarding(owner, 'accept', button(owner, 'Accept owner appointment', 'قبول تعيين المالك'));
      await clickOnboarding(owner, 'setup',
        owner.getByRole('link', { name: t('Enter setup workspace', 'دخول مساحة الإعداد'), exact: true }));
      await button(owner, 'Edit branch and timezone', 'تعديل الفرع والمنطقة الزمنية').click();
      await field(owner, 'Branch name', 'اسم الفرع').fill('Fictional commerce branch');
      await field(owner, 'Academy timezone (IANA)', 'المنطقة الزمنية للأكاديمية (IANA)').selectOption('Africa/Cairo');
      await clickOnboarding(owner, 'save', button(owner, 'Save branch', 'حفظ الفرع'));
      await button(owner, 'Edit sport', 'تعديل الرياضة').click();
      await field(owner, 'Sport label — English', 'اسم الرياضة — الإنجليزية').fill('Synthetic sport');
      await field(owner, 'Sport label — Arabic', 'اسم الرياضة — العربية').fill('رياضة اختبار');
      await clickOnboarding(owner, 'save', button(owner, 'Save sport', 'حفظ الرياضة'));
      await clickOnboarding(owner, 'save', button(owner, 'Complete initial setup', 'إكمال الإعداد الأولي'));
      await expect(owner.getByRole('heading', { name: t('Initial setup saved', 'حُفظ الإعداد الأولي'), exact: true })).toBeVisible();
    }
    const ownerRoute = `${fixture.origin}/${locale}/workspace/${academy}/platform-plan`;
    await platform.goto(platformRoute);
    if (!index) await click(platform, 'publish_plan', button(platform, 'Publish fictional plan', 'نشر الخطة الافتراضية'));
    const academies = platform.getByRole('combobox', {name:t('Academy','الأكاديمية'),exact:true});
    await expect(academies).toHaveCount(1);
    await academies.selectOption(academy);
    await expect(combo(platform, 'Plan version', 'إصدار الخطة')).toBeVisible();
    await combo(platform, 'Plan version', 'إصدار الخطة').selectOption({ index: 1 });
    await field(platform, 'Trial start', 'بداية الفترة التجريبية').fill('2026-11-01');
    await click(platform, 'assign', button(platform, 'Assign plan', 'تعيين الخطة'));
    const quota = await fixture.db({ action: 'commerce_program_quota', academy, subject: ownerSubject });
    assert.equal(quota.limitBlocked, true);
    assert.equal(quota.total, 2);
    await owner.goto(ownerRoute);
    await state(owner, 'Status: Trial', 'الحالة: تجريبية');
    await state(owner, '2026-11-01 – 2026-11-14', '2026-11-01 – 2026-11-14');
    await setDay('2026-11-15');
    await click(platform, 'issue', button(platform, 'Issue invoice', 'إصدار الفاتورة'));
    await setDay('2026-11-21');
    await owner.reload();
    await state(owner, 'Status: Due', 'الحالة: مستحقة');
    await setDay('2026-11-22');
    await owner.reload();
    await state(owner, 'Status: Grace period', 'الحالة: فترة السماح');
    await setDay('2026-11-28');
    await owner.reload();
    await state(owner, 'Status: Grace period', 'الحالة: فترة السماح');
    await setDay('2026-11-29');
    await owner.reload();
    await state(owner, 'Status: Restricted', 'الحالة: مقيدة');
    const restricted = await fixture.db({ action: 'commerce_restriction_checks', academy, subject: ownerSubject });
    assert.equal(restricted.registrationBlocked, true);
    assert.equal(restricted.publicationBlocked, existing ? true : null);
    assert.equal(restricted.playersAfter, restricted.playersBefore);
    if (existing) assert.equal(restricted.existingAttendanceReadable, true);
    await outsider.goto(ownerRoute);
    await expect(outsider.locator('main.journey-card').getByRole('alert')).toContainText(t('Access is unavailable', 'الصلاحية غير متاحة'));
    await expect(outsider.getByText('1000.00', { exact: false })).toHaveCount(0);

    await field(owner, 'Bank reference', 'المرجع البنكي').fill('Fictional first claim');
    await click(owner, 'claim', button(owner, 'Submit claim', 'تقديم الطلب'));
    await state(owner, 'Your payment claim is awaiting review.', 'طلب الدفع قيد المراجعة.');
    await expect(button(owner, 'Submit claim', 'تقديم الطلب')).toHaveCount(0);
    await state(owner, 'Balance: 1000.00', 'المتبقي: 1000.00');
    async function review(decision, reason) {
      await platform.reload();
      const academies = platform.getByRole('combobox', {name:t('Academy','الأكاديمية'),exact:true});
      await expect(academies).toHaveCount(1);
      await academies.selectOption(academy);
      await expect(combo(platform, 'Claim to review', 'الطلب المراد مراجعته')).toBeVisible();
      await combo(platform, 'Claim to review', 'الطلب المراد مراجعته').selectOption({ index: 1 });
      await combo(platform, 'Decision', 'القرار').selectOption(decision);
      await field(platform, 'Review reason', 'سبب المراجعة').fill(reason);
      await field(platform, 'I reviewed this fictional claim', 'راجعت طلب الدفع الافتراضي').check();
    }
    await review('rejected', 'Reference did not match');
    await click(platform, 'review', button(platform, 'Confirm review', 'تأكيد المراجعة'));
    await owner.reload();
    await state(owner, 'Status: Restricted', 'الحالة: مقيدة');
    await state(owner, 'Reference did not match', 'Reference did not match');
    await field(owner, 'Bank reference', 'المرجع البنكي').fill('Fictional corrected claim');
    let original, committed, sends = 0;
    const loseReply = async route => {
      const body = route.request().postDataJSON();
      if (body.action !== 'claim') return route.continue();
      sends++;
      original = body.operation;
      const upstream = await route.fetch({ maxRetries: 0 });
      assert.equal(upstream.status(), 200);
      committed = (await upstream.json()).data;
      await route.abort('failed');
    };
    await owner.route(`**${endpoint}`, loseReply);
    await button(owner, 'Submit claim', 'تقديم الطلب').click();
    await expect(owner.locator('main.journey-card').getByRole('alert')).toContainText(t('outcome is unknown', 'النتيجة غير معروفة'));
    await owner.reload();
    const [recovered] = await Promise.all([waitAction(owner, 'operation'), button(owner, 'Check original operation', 'تحقق من العملية الأصلية').click()]);
    assert.equal(recovered.request().postDataJSON().operation, original);
    assert.deepEqual((await recovered.json()).data, committed);
    assert.equal(sends, 1);
    await owner.unroute(`**${endpoint}`, loseReply);
    await state(owner, 'Your payment claim is awaiting review.', 'طلب الدفع قيد المراجعة.');
    await expect(button(owner, 'Submit claim', 'تقديم الطلب')).toHaveCount(0);
    await review('accepted', 'Verified full fictional bank payment');
    await click(platform, 'review', button(platform, 'Confirm review', 'تأكيد المراجعة'));
    await owner.reload();
    await state(owner, 'Status: Active', 'الحالة: نشطة');
    const restoredRegistration = await fixture.db({ action: 'commerce_registration_probe', academy, subject: ownerSubject });
    assert.equal(restoredRegistration.allowed, true);
    assert.equal(restoredRegistration.total, restricted.playersBefore + 1);
    await state(owner, 'Balance: 0.00', 'المتبقي: 0.00');
    await expect(owner.getByText(t('Your payment claim is awaiting review.', 'طلب الدفع قيد المراجعة.'), { exact: false })).toHaveCount(0);
    assert.deepEqual(await fixture.db({ action: 'commerce_audit', academy }), { settlements: 1, approvals: 2 });
    await setDay('2026-12-15');
    await owner.reload();
    await state(owner, 'Status: Restricted', 'الحالة: مقيدة');
    console.log(`PASS ${locale} ${existing ? 'existing academy and Attendance' : 'admission and setup'} through billing and settlement`);
  }
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp, { recursive: true, force: true });
}
