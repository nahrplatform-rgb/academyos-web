import assert from 'node:assert/strict';
import {expect} from '@playwright/test';

export async function checkOwnerEntry(browser, origin, context, session) {
  const {academy_id: academy, academy_name: academyName, branch_name: branch, timezone} = context;
  const permitted = {data: {platform: false, more: false, memberships: [
    {membership_id: '00000000-0000-4000-8000-000000000003', academy_id: academy, academy_name: academyName, role: 'owner'},
  ]}};
  const results = [], gaps = [];
  for (const locale of ['en', 'ar']) {
    const ar = locale === 'ar', chooser = `/${locale}/workspace`, today = `${chooser}/${academy}/home`;
    const w = (en, arabic) => ar ? arabic : en;
    const noMembership = w('No active academy membership.', 'لا توجد عضوية أكاديمية نشطة.');
    const lookupGuidance = w('We couldn’t check your workspaces. Try again.', 'تعذر التحقق من مساحات عملك. حاول مرة أخرى.');
    for (const scenario of ['permitted', 'no-membership', 'platform-only', 'unavailable', 'interrupted', 'denied']) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
      const calls = [], documents = [], prefetches = [], errors = [];
      const start = performance.now();
      const evidence = {locale, scenario, calls, documents, prefetches};
      const note = (ok, behavior) => {if (!ok) gaps.push({locale, scenario, behavior});};
      const hold = Promise.withResolvers();
      const retryHold = Promise.withResolvers();
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        const path = new URL(request.url()).pathname;
        const headers = request.headers();
        if (request.isNavigationRequest() && request.resourceType() === 'document') documents.push(path);
        if ((headers['next-router-prefetch'] || headers['next-router-segment-prefetch']) && (path === today || path.includes('/platform'))) prefetches.push(path);
        if (path.startsWith('/api/')) calls.push({path, action: request.postDataJSON()?.action ?? null});
      });
      let reads = 0;
      await page.route('**/api/onboarding', async route => {
        const ordinal = ++reads;
        if (ordinal === 1) await hold.promise;
        if (ordinal === 2 && ['unavailable','interrupted'].includes(scenario)) await retryHold.promise;
        if (ordinal > 1 || scenario === 'permitted') return route.fulfill({json: permitted});
        if (scenario === 'interrupted') return route.abort('failed');
        if (scenario === 'denied') return route.fulfill({status: 401, json: {error: 'denied'}});
        if (scenario === 'unavailable') return route.fulfill({status: 503, json: {error: 'unavailable'}});
        return route.fulfill({json: {data: {platform: scenario === 'platform-only', more: false, memberships: []}}});
      });
      const main = page.getByRole('main');
      const heading = main.getByRole('heading', {name: w('Choose your workspace', 'اختر مساحتك'), exact: true});
      const open = main.getByRole('link', {name: w('Open academy', 'فتح الأكاديمية'), exact: true});
      const platform = main.getByRole('link', {name: w('Open Platform workspace', 'فتح مساحة المنصة'), exact: true});
      const empty = main.getByText(noMembership, {exact: false});
      try {
        const firstRead = page.waitForRequest('**/api/onboarding');
        await Promise.all([page.goto(origin + chooser), firstRead]);
        await expect(heading).toBeVisible();
        await expect(main.getByRole('heading', {name: w('Checking access and saved progress', 'جارٍ التحقق من الصلاحيات والتقدم المحفوظ')})).toBeVisible();
        await expect(open).toHaveCount(0);
        await expect(empty).toHaveCount(0);
        hold.resolve();
        if (scenario === 'permitted') {
          await expect(open).toHaveAttribute('href', today);
          await expect(open.locator('..')).toContainText(`${academyName} · ${w('Academy Owner', 'مالك الأكاديمية')}`);
          await open.hover();
          await page.waitForLoadState('networkidle');
          assert.deepEqual(calls.map(call => call.action), ['context']);
          note(prefetches.length === 0, 'The chooser prepares a protected destination before selection');
          if (ar) await open.click();
          else {await open.focus(); await expect(open).toBeFocused(); await page.keyboard.press('Enter');}
          await page.waitForURL(origin + today);
          await expect(main.getByRole('heading', {name: w('Academy operations', 'عمليات الأكاديمية')})).toBeVisible();
          await expect(main.getByRole('button', {name: new RegExp(session.title)})).toBeVisible();
          await expect(main.getByText(branch, {exact: true}).first()).toBeVisible();
          await expect(main.getByText(timezone, {exact: true})).toBeVisible();
          await expect(main.getByRole('link', {name: w('Open calendar', 'فتح التقويم'), exact: true})).toHaveAttribute('href', `${chooser}/${academy}/calendar?anchor=${context.today}`);
          await expect(page.locator('.app-scene')).toHaveAttribute('dir', ar ? 'rtl' : 'ltr');
          evidence.usefulTodayMs = Math.round(performance.now() - start);
          const switcher = page.getByRole('link', {name: w('Switch workspace', 'تبديل مساحة العمل'), exact: true});
          await switcher.click();
          await page.waitForURL(origin + chooser);
          await expect(open).toBeVisible();
          await page.goBack();
          await page.waitForURL(origin + today);
          await expect(main.getByRole('button', {name: new RegExp(session.title)})).toBeVisible();
          await page.goForward();
          await page.waitForURL(origin + chooser);
          await expect(open).toBeVisible();
          assert.deepEqual(calls.map(call => call.action), ['context','owner_home','context','owner_home','context']);
        } else if (scenario === 'no-membership' || scenario === 'platform-only') {
          if (scenario === 'no-membership') await expect(empty).toBeVisible();
          else {
            await expect(platform).toHaveAttribute('href', `/${locale}/platform`);
            note(await empty.count() === 0, 'A Platform Owner without academy roles sees invitation instructions');
          }
          await expect(main.getByRole('alert')).toHaveCount(0);
          await expect(open).toHaveCount(0);
          assert.deepEqual(calls.map(call => call.action), ['context']);
        } else {
          const alert = main.getByRole('alert');
          await expect(alert).toBeVisible();
          evidence.alert = await alert.innerText();
          await expect(empty).toHaveCount(0);
          await expect(open).toHaveCount(0);
          assert.deepEqual(calls.map(call => call.action), ['context']);
          if (scenario === 'denied') {
            await expect(alert).toContainText(w('Access is unavailable for this account.', 'الصلاحية غير متاحة لهذا الحساب.'));
          } else {
            note(evidence.alert === lookupGuidance, 'A failed chooser read lacks its own recovery wording');
            const retry = main.getByRole('button', {name: w(/^(Retry current read|Try again)$/, /^(إعادة محاولة قراءة الحالة|حاول مرة أخرى)$/)});
            await retry.focus();
            await expect(retry).toBeFocused();
            await page.keyboard.press('Enter');
            await expect(main.getByRole('heading', {name: w('Checking access and saved progress', 'جارٍ التحقق من الصلاحيات والتقدم المحفوظ')})).toBeVisible();
            const stayedFocused = await page.evaluate(() => document.activeElement?.matches('main .read-toolbar button[aria-disabled="true"]') ?? false);
            note(stayedFocused, 'Retry loses keyboard focus during the read');
            await page.keyboard.press('Enter');
            await expect(open).toHaveCount(0);
            retryHold.resolve();
            await expect(open).toBeVisible();
            await expect(alert).toHaveCount(0);
            evidence.focusRetained = stayedFocused && await page.evaluate(() => document.activeElement?.matches('main .read-toolbar button') ?? false);
            note(!stayedFocused || evidence.focusRetained, 'Retry loses keyboard focus when the read succeeds');
            assert.deepEqual(calls.map(call => call.action), ['context','context']);
          }
        }
        assert.deepEqual(documents, [chooser]);
        assert.deepEqual(errors, []);
        results.push(evidence);
      } finally {
        hold.resolve(); retryHold.resolve();
        await page.close();
      }
    }
  }
  return {status: gaps.length ? 'failed' : 'passed', gaps, results};
}
