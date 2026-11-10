import assert from 'node:assert/strict';
import {join} from 'node:path';
import {expect} from '@playwright/test';

const cases = [
  {
    locale: 'en', width: 1440, source: 'calendar',
    homeHeading: 'Academy operations', openCalendar: 'Open calendar', month: 'Month', date: 'Go to date',
    search: 'Search this loaded page', details: 'Session details', openDate: 'Open this date',
    attendance: 'Open attendance', backSession: 'Back to session', backSource: 'Back to calendar',
  },
  {
    locale: 'ar', width: 390, source: 'home',
    homeHeading: 'عمليات الأكاديمية', search: 'البحث في هذه الصفحة المحملة',
    details: 'تفاصيل التدريب', openDate: 'فتح هذا التاريخ', attendance: 'فتح الحضور',
    backSession: 'الرجوع إلى التدريب', backSource: 'العودة إلى رئيسية الأكاديمية',
  },
];

/** Real Owner reads over the signed fixture, with a fresh browser context per locale. */
export async function checkOwnerDayReturn(fixture, browser, captures) {
  const {origin, state, data} = fixture;
  const {day, event} = data.events[0];
  const results = [];
  for (const test of cases) {
    const {locale, width, source} = test;
    const context = await browser.newContext({viewport: {width, height: width < 768 ? 844 : 900}});
    try {
      const page = await context.newPage();
      const documents = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url());
      });
      const button = name => page.getByRole('button', {name, exact: true});
      const link = name => page.getByRole('link', {name, exact: true});
      const calls = start => state.events.slice(start).map(({route, action, status}) => [route, action, status]);
      const base = `/${locale}/workspace/${data.academy}`;
      const dated = `${base}/programs/${data.program}/${day}`;
      const attendance = `${base}/attendance/${event}`;
      const hint = `?from=${day}&return=${source}`;
      const fragment = '#' + hint.slice(1);
      const selected = page.locator(`[data-occurrence="${data.program}:${day}"][data-state="published"]`).first();
      const position = () => page.evaluate(() => [
        document.querySelector('.workspace-center')?.scrollTop ?? 0, window.scrollY,
      ]);
      await page.goto(origin + base + '/home');
      await expect(page.getByRole('heading', {name: test.homeHeading, exact: true})).toBeVisible();
      let date;
      if (source === 'calendar') {
        await link(test.openCalendar).click();
        await expect(selected).toBeVisible();
        await button(test.month).click();
        await expect(button(test.month)).toBeEnabled();
        date = await page.getByLabel(test.date, {exact: true}).inputValue();
      }
      const filter = 'Fictional working-day';
      await expect(selected).toBeVisible();
      await page.getByRole('searchbox', {name: test.search, exact: true}).fill(filter);
      await selected.click();
      const openDate = link(test.openDate);
      await expect(openDate).toHaveAttribute('href', dated + hint);
      await openDate.scrollIntoViewIfNeeded();
      if (source === 'calendar') {
        await page.locator('.workspace-center').evaluate(pane => { pane.scrollTop = 96; });
        await expect.poll(async () => (await position())[0]).toBe(96);
      }
      const sourceScroll = await position();
      const departure = state.events.length;
      await openDate.click();
      await expect(link(test.attendance)).toHaveAttribute('href', attendance + fragment);
      await link(test.attendance).click();
      await expect(page.locator('.register-roster > li')).toHaveCount(18);
      await expect(page.locator('.app-scene')).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
      await expect(link(test.backSession)).toHaveAttribute('href', dated + hint);
      const handoff = calls(departure);
      assert.deepEqual(handoff, [['planning', 'read', 200], ['attendance', 'roster', 200]]);
      if (captures) await page.screenshot({path: join(captures, `attendance-${locale}-${width}.png`)});
      const returnStart = state.events.length;
      await link(test.backSession).click();
      await expect(link(test.attendance)).toBeVisible();
      await button(test.backSource).click();
      await page.waitForURL(url => url.pathname === `${base}/${source}`);
      await expect(selected).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByRole('searchbox', {name: test.search, exact: true})).toHaveValue(filter);
      if (date) {
        await expect(button(test.month)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByLabel(test.date, {exact: true})).toHaveValue(date);
      }
      await expect(page.getByRole('heading', {name: test.details, exact: true})).toBeFocused();
      await expect.poll(position).toEqual(sourceScroll);
      if (captures) await page.screenshot({path: join(captures, `returned-${locale}-${width}.png`)});
      const returned = calls(returnStart);
      assert.deepEqual(returned, [['planning', 'read', 200], ['experience', `owner_${source}`, 200]]);
      assert.equal(documents.length, 1);
      results.push({locale, width, source, players: 18, documents: documents.length,
        handoff, returned, sourceRestored: true, sourceScroll});
      if (locale === 'en') {
        await page.goto(origin + attendance + '#return=home&return=%2Fplatform&from=invalid');
        await expect(link(test.backSession)).toHaveAttribute('href', dated);
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
  return results;
}
