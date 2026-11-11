import assert from 'node:assert/strict';
import {join} from 'node:path';
import {expect} from '@playwright/test';
import {checkPhoneRegister} from './register_geometry.mjs';

const cases = [
  {
    locale: 'en', width: 1440, source: 'calendar',
    homeHeading: 'Academy operations', openCalendar: 'Open calendar', month: 'Month', date: 'Go to date',
    search: 'Search this loaded page', details: 'Session details', openDate: 'Open this date',
    attendance: 'Open attendance', actions: 'Session actions', backSession: 'Back to session',
    direct: 'Back to calendar', present: 'Present', backSource: 'Back to calendar',
  },
  {
    locale: 'ar', width: 390, source: 'home',
    homeHeading: 'عمليات الأكاديمية', search: 'البحث في هذه الصفحة المحملة',
    details: 'تفاصيل التدريب', openDate: 'فتح هذا التاريخ', attendance: 'فتح الحضور',
    actions: 'إجراءات التدريب', backSession: 'الرجوع إلى التدريب', present: 'حاضر',
    direct: 'العودة إلى اليوم', backSource: 'العودة إلى رئيسية الأكاديمية',
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
      const direct = link(test.direct);
      await expect(direct).toHaveAttribute('href', `${base}/${source}`);
      const handoff = calls(departure);
      assert.deepEqual(handoff, [['planning', 'read', 200], ['attendance', 'roster', 200]]);
      if (captures&&width>=768) await page.screenshot({path: join(captures, `attendance-${locale}-${width}.png`)});
      const phone = await checkPhoneRegister(page,'canonical',locale,captures);
      const actions=page.locator('.register-action-menu > summary');
      await expect(actions).toHaveText(test.actions);
      await actions.click();
      await expect(link(test.backSession)).toHaveAttribute('href',dated+hint);
      await link(test.backSession).focus();
      await page.keyboard.press('Escape');
      await expect(actions).toBeFocused();
      await expect(link(test.backSession)).toBeHidden();
      let datedRead;
      if(locale==='en'){
        await actions.click();
        const datedStart=state.events.length;
        await link(test.backSession).click();
        await expect(button(test.backSource)).toBeEnabled();
        datedRead=calls(datedStart);
        assert.deepEqual(datedRead,[['planning','read',200]]);
        await link(test.attendance).click();
        await expect(direct).toBeEnabled();
      }
      const firstMark=page.locator('.register-options').first().getByRole('button',{name:test.present,exact:true});
      await firstMark.click();
      const stay=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());
      await direct.click();
      await stay;
      assert.equal(page.url(),origin+attendance+fragment);
      await expect(firstMark).toHaveAttribute('aria-pressed','true');
      const returnStart = state.events.length;
      const discard=page.waitForEvent('dialog').then(dialog=>dialog.accept());
      await direct.click();
      await discard;
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
      assert.deepEqual(returned, [['experience', `owner_${source}`, 200]]);
      assert.equal(documents.length, 1);
      results.push({locale, width, source, players: 18, documents: documents.length,
        handoff, returned, datedRead, dirtyCancelPreservedChoice:true, sourceRestored:true, sourceScroll, phone});
      if (locale === 'en') {
        await page.goto(origin + attendance + '#return=home&return=%2Fplatform&from=invalid');
        await expect(direct).toHaveCount(0);
        await actions.click();
        await expect(link(test.backSession)).toHaveAttribute('href', dated);
      }
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  }
  return results;
}
