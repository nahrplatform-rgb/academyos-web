import assert from 'node:assert/strict';
import {expect} from '@playwright/test';

export async function checkSetupShortcuts(browser, origin, context, session) {
  const results = [], gaps = [];
  const setupData = {academy_id: context.academy_id, name: context.academy_name, version: 1, complete: true,
    timezone: context.timezone, branch: {id: context.branch_id, name: context.branch_name},
    sport: {id: context.academy_id, label_en: session.sport, label_ar: session.sport_ar}};
  for (const locale of ['en','ar']) {
    const ar = locale === 'ar', t = (en, arabic) => ar ? arabic : en;
    const setup = `/${locale}/workspace/${context.academy_id}`;
    const names = {
      setup: t('Initial academy setup', 'الإعداد الأولي للأكاديمية'),
      saved: t('Initial setup saved', 'حُفظ الإعداد الأولي'),
      players: t('Open players', 'فتح اللاعبين'),
      home: t('Open academy home', 'فتح الصفحة الرئيسية للأكاديمية'),
      retry: t('Try again', 'إعادة المحاولة'),
    };
    for (const destination of ['players','home']) {
      const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
      const docs = [], calls = [], prefetches = [], errors = [];
      const release = Promise.withResolvers();
      let destinationReads = 0;
      const path = `${setup}/${destination}`;
      const endpoint = destination === 'players' ? 'people' : 'experience';
      const action = destination === 'players' ? 'list' : 'owner_home';
      const name = 'Fictional Shortcut Player';
      const heading = value => page.getByRole('heading', {name: value, exact: true});
      const destinationContent = destination === 'players'
        ? page.getByRole('button', {name, exact: true})
        : page.getByRole('button', {name: new RegExp(session.title)});
      const shortcut = page.getByRole('main').getByRole('link', {name: names[destination], exact: true});
      const record = (ok, behavior) => {if (!ok) gaps.push({locale,destination,behavior});};
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        const pathname = new URL(request.url()).pathname, headers = request.headers();
        if (request.isNavigationRequest() && request.resourceType() === 'document') docs.push(pathname);
        if (pathname.startsWith('/api/')) calls.push(request.postDataJSON()?.action ?? null);
        if (pathname === path && (headers['next-router-prefetch'] || headers['next-router-segment-prefetch'])) prefetches.push(pathname);
      });
      let original;
      await page.route('**/api/onboarding', async route => {
        const body = route.request().postDataJSON();
        if (body.action === 'setup') return route.fulfill({json: {data: setupData}});
        if (body.action === 'save') {
          original = body.op;
          return route.fulfill({status:503,json:{error:'unavailable'}});
        }
        assert.equal(body.action, 'operation');
        assert.equal(body.op, original);
        return route.fulfill({json: {data: {found: true}}});
      });
      await page.route(`**/api/${endpoint}`, async route => {
        assert.equal(route.request().postDataJSON().action, action);
        destinationReads++;
        if (destinationReads === 1) {
          await release.promise;
          if (destination === 'players') return route.fulfill({status:503,json:{error:'unavailable'}});
        }
        if (destination === 'home') return route.continue();
        return route.fulfill({json: {data: {...context, items:[{id:session.id,display_name:name,branch_name:context.branch_name}], more:false}}});
      });
      try {
        await page.goto(origin+setup);
        await expect(heading(names.saved)).toBeVisible();
        await expect(shortcut).toHaveAttribute('href', path);
        await shortcut.hover();
        // Setup has unrelated links that can start their own prefetch. The
        // budget here is only for the two destinations under test.
        assert.deepEqual(calls, ['setup']);

        let modifierDefaultAllowed;
        if (destination === 'players') {
          const edit = page.getByRole('button', {name:t('Edit branch and timezone','تعديل الفرع والمنطقة الزمنية'),exact:true});
          const branch = page.locator('#branch');
          await edit.click();
          await branch.fill('Fictional retained branch draft');
          await Promise.all([shortcut.click(), page.waitForEvent('dialog').then(async dialog => {
            record(dialog.type() === 'confirm', 'The shortcut relies on browser unload instead of the setup guard');
            await dialog.dismiss();
          })]);
          await expect(branch).toHaveValue('Fictional retained branch draft');
          assert.equal(page.url(), origin+setup);
          assert.deepEqual(calls, ['setup']);

          await page.evaluate(() => window.addEventListener('click', event => {
            // Observe Next and the app's handlers before stopping Chromium's
            // platform-specific new-tab action for this isolated measurement.
            window.__setupModifierDefaultAllowed = (event.metaKey || event.ctrlKey) && !event.defaultPrevented;
            event.preventDefault();
          }, {once:true}));
          await shortcut.click({modifiers:[process.platform==='darwin'?'Meta':'Control']});
          modifierDefaultAllowed = await page.evaluate(() => window.__setupModifierDefaultAllowed);
          record(modifierDefaultAllowed, 'The app prevents the browser’s modified-link action');
          await expect(branch).toHaveValue('Fictional retained branch draft');
          assert.equal(page.url(),origin+setup);
          assert.deepEqual(calls,['setup']);

          // An unknown save must retain its ID and remove navigable setup shortcuts.
          await page.getByRole('button',{name:t('Save branch','حفظ الفرع'),exact:true}).click();
          const reconcile = page.getByRole('button',{name:t('Check original operation','التحقق من العملية الأصلية'),exact:true});
          await expect(reconcile).toBeVisible();
          await expect(shortcut).toHaveCount(0);
          assert.deepEqual(calls,['setup','save']);
          await reconcile.click();
          await expect(shortcut).toBeVisible();
          assert.deepEqual(calls,['setup','save','operation','setup']);
          // The current reconciliation keeps the old edit visible. Leave it
          // through the explicit discard control if it is still present.
          const discard = page.getByRole('button',{name:t('Discard unsaved draft','تجاهل المسودة غير المحفوظة'),exact:true});
          if (await discard.isVisible()) await discard.click();
        }

        const internalDocs = docs.length, readStart = calls.length;
        record(prefetches.length === 0, 'Destination prepared before the shortcut was used');
        const firstRead = page.waitForRequest(`**/api/${endpoint}`);
        if (ar) await shortcut.click();
        else {await shortcut.focus(); await expect(shortcut).toBeFocused(); await page.keyboard.press('Enter');}
        await page.waitForURL(origin+path);
        await firstRead;
        await expect(heading(destination==='players'?t('Players','اللاعبون'):t('Academy operations','عمليات الأكاديمية'))).toBeVisible();
        await expect(page.getByRole('navigation',{name:t('Workspace navigation','التنقل في مساحة العمل'),exact:true})).toBeVisible();
        await expect(destinationContent).toHaveCount(0);
        record(docs.length === internalDocs, 'The shortcut starts a new browser document');
        assert.deepEqual(calls.slice(readStart),[action]);
        release.resolve();
        if (destination === 'players') {
          await expect(heading(t('Could not load players','تعذر تحميل اللاعبين'))).toBeVisible();
          await expect(destinationContent).toHaveCount(0);
          await page.getByRole('button',{name:names.retry,exact:true}).click();
        }
        await expect(destinationContent).toBeVisible();
        await page.goBack();
        await expect(heading(names.saved)).toBeVisible();
        await page.goForward();
        await expect(destinationContent).toBeVisible();
        assert.equal(page.url(),origin+path);
        assert.deepEqual(errors,[]);
        if (docs.length === internalDocs) {
          assert.deepEqual(calls.slice(readStart),destination==='players'?[action,action,'setup',action]:[action,'setup',action]);
        }
        results.push({locale,destination,calls,documents:docs.slice(internalDocs),prefetches,
          dirtyCancelled:destination==='players',originalReconciled:destination==='players',modifierDefaultAllowed});
      } finally {
        release.resolve();
        await page.close();
      }
    }
  }
  return {status:gaps.length?'failed':'passed',gaps,results};
}
