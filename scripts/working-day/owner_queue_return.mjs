import assert from 'node:assert/strict';
import {join} from 'node:path';
import {expect} from '@playwright/test';

const locales = [
  {locale:'en', width:1440, height:900, home:'Academy operations', search:'Search this loaded page',
    present:'Present', back:'Back to Today', review:'Review register', save:'Save selected marks',
    saved:'Saved. Current result shown below.', queue:'Registers needing marks', zero:'0'},
  {locale:'ar', width:390, height:844, home:'عمليات الأكاديمية', search:'البحث في هذه الصفحة المحملة',
    present:'حاضر', back:'العودة إلى اليوم', review:'مراجعة الحضور', save:'حفظ التسجيلات المختارة',
    saved:'حُفظ. النتيجة الحالية أدناه.', queue:'سجلات تحتاج حضوراً', zero:'٠'},
];

/** Exercise exact Today queue returns using independent, real synthetic registers. */
export async function checkOwnerQueueReturn(fixture, browser, captures) {
  const {origin, state, db} = fixture;
  const results = [];
  for (const test of locales) for (const resolved of [false, true]) {
    const {academy, event} = await db({action:'queue_fixture'});
    const context = await browser.newContext({viewport:{width:test.width, height:test.height}});
    try {
      const page = await context.newPage();
      const documents = [], errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents.push(request.url());
      });
      const calls = start => state.events.slice(start).map(({route, action, status}) => [route, action, status]);
      const button = name => page.getByRole('button', {name, exact:true});
      const base = `/${test.locale}/workspace/${academy}`;
      const attendance = `${base}/attendance/${event}#return=home&attendance=${event}`;
      const task = page.locator(`[data-owner-today-task="#attendance-return=${event}"]`);
      const heading = page.locator('#owner-today-attention');
      const filter = page.getByRole('searchbox', {name:test.search, exact:true});
      const position = () => page.evaluate(() => ({center:document.querySelector('.workspace-center')?.scrollTop ?? 0, document:window.scrollY}));
      await page.goto(origin + base + '/home');
      await expect(page.getByRole('heading', {name:test.home, exact:true})).toBeVisible();
      await expect(task).toHaveCount(1);
      await expect(task).toHaveAttribute('href', attendance);
      await filter.fill('queue return test');
      await task.scrollIntoViewIfNeeded();
      const beforeScroll = await position();
      const departure = state.events.length;
      await task.click();
      await expect(page.locator('.register-roster > li')).toHaveCount(18);
      await expect(page.locator('.app-scene')).toHaveAttribute('dir', test.locale === 'ar' ? 'rtl' : 'ltr');
      const handoff = calls(departure);
      assert.deepEqual(handoff, [['attendance','roster',200]]);
      const back = page.getByRole('link', {name:test.back, exact:true});
      await expect(back).toHaveAttribute('href', `${base}/home#attendance-return=${event}`);
      const marks = page.locator('.register-options');
      const first = marks.first().getByRole('button', {name:test.present, exact:true});
      await first.click();
      const decline = page.waitForEvent('dialog').then(dialog => dialog.dismiss());
      await back.click();
      await decline;
      assert.equal(page.url(), origin + attendance);
      await expect(first).toHaveAttribute('aria-pressed','true');
      let saveCalls;
      if (resolved) {
        for (let i=1; i<18; i++) await marks.nth(i).getByRole('button', {name:test.present, exact:true}).click();
        const saveStart = state.events.length;
        await button(test.review).click();
        await button(test.save).click();
        await expect(page.getByText(test.saved, {exact:true})).toBeVisible();
        await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(18);
        saveCalls = calls(saveStart);
      }
      // Hold the return's current-authority read: never restore an unchecked queue.
      let releaseReturn, returnStarted;
      const gate = new Promise(resolve => {releaseReturn=resolve;});
      const started = new Promise(resolve => {returnStarted=resolve;});
      await page.route('**/api/experience', async route => {
        if(route.request().postDataJSON()?.action==='owner_home') {
          returnStarted();
          await gate;
        }
        await route.continue();
      });
      const returnStart = state.events.length;
      if (resolved) await back.click();
      else {
        const accept = page.waitForEvent('dialog').then(dialog => dialog.accept());
        await back.click();
        await accept;
      }
      await page.waitForURL(url => url.pathname === `${base}/home`);
      await started;
      await expect(task).toHaveCount(0);
      await expect(heading).not.toBeFocused();
      releaseReturn();
      await expect(filter).toHaveValue('queue return test');
      if (resolved) {
        await expect(task).toHaveCount(0);
        const card = page.locator('.experience-task-card').filter({has:page.getByRole('heading',{name:test.queue,exact:true})});
        await expect(card.locator('.operations-task-title strong')).toHaveText(test.zero);
        await expect(heading).toBeFocused();
      } else {
        await expect(task).toBeFocused();
        await expect.poll(position).toEqual(beforeScroll);
      }
      const returned = calls(returnStart);
      assert.deepEqual(returned, [['experience','owner_home',200]]);
      assert.equal(documents.length,1);
      assert.deepEqual(errors,[]);
      const afterScroll = await position();
      const focus = await page.evaluate(() => ({id:document.activeElement?.id ?? '', task:document.activeElement?.getAttribute('data-owner-today-task')}));
      if (captures) await page.screenshot({path:join(captures,`queue-return-${test.locale}-${resolved?'resolved':'retained'}.png`)});
      results.push({locale:test.locale, width:test.width, height:test.height, resolved, handoff, saveCalls, returned,
        documents:documents.length, beforeScroll, afterScroll, focus, dirtyCancelPreservedChoice:true,
        heldReturnMasksUncheckedQueue:true});
    } finally { await context.close(); }
  }
  for(const test of locales) {
    const scope=await db({action:'queue_fixture'});
    const context=await browser.newContext({viewport:{width:test.width,height:test.height}});
    try {
      const page=await context.newPage(),documents=[],errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())documents.push(r.url());});
      const base=`/${test.locale}/workspace/${scope.academy}`;
      const task=page.locator(`[data-owner-today-task="#attendance-return=${scope.event}"]`);
      await page.goto(origin+base+'/home');
      await task.click();
      await expect(page.locator('.register-roster > li')).toHaveCount(18);
      await db({action:'role',...scope});
      const start=state.events.length;
      const deniedResponse=page.waitForResponse(response=>response.url().endsWith('/api/experience')&&
        response.request().postDataJSON()?.action==='owner_home');
      await page.getByRole('link',{name:test.back,exact:true}).click();
      assert.equal((await deniedResponse).status(),403);
      await page.waitForURL(url=>url.pathname===base+'/home');
      await expect(page.locator('main').getByRole('alert')).toBeVisible();
      await expect(task).toHaveCount(0);
      await expect(page.locator('#owner-today-attention')).toHaveCount(0);
      const returned=state.events.slice(start).map(({route,action,status})=>[route,action,status]);
      assert.deepEqual(returned,[['experience','owner_home',403]]);
      assert.equal(documents.length,1);
      assert.deepEqual(errors,[]);
      results.push({locale:test.locale,width:test.width,currentOwnerDenied:true,returned,
        documents:documents.length,privateTaskVisible:false});
    } finally { await context.close(); }
  }
  for(const takeOver of [false,true]) {
    const scope=await db({action:'queue_fixture'}),context=await browser.newContext({viewport:{width:1440,height:900}});
    try {
      const page=await context.newPage(),base=`/en/workspace/${scope.academy}`;
      const task=page.locator(`[data-owner-today-task="#attendance-return=${scope.event}"]`);
      await page.goto(origin+base+'/home');
      await task.click();
      await expect(page.locator('.register-roster > li')).toHaveCount(18);
      let release;
      const held=new Promise(resolve=>{release=resolve;});
      let begun;
      const started=new Promise(resolve=>{begun=resolve;});
      await page.route('**/api/experience',async route=>{
        if(route.request().postDataJSON()?.action==='owner_home'){begun();await held;}
        await route.continue();
      });
      if(takeOver)await page.getByRole('link',{name:'Back to Today',exact:true}).click();
      else await page.goto(origin+base+'/home');
      await started;
      const filter=page.getByRole('searchbox',{name:'Search this loaded page',exact:true});
      if(takeOver){await filter.click();await filter.fill('my next task');}
      release();
      await expect(task).toBeVisible();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await expect(task).not.toBeFocused();
      await expect(page.locator('#owner-today-attention')).not.toBeFocused();
      if(takeOver){await expect(filter).toBeFocused();await expect(filter).toHaveValue('my next task');}
      results.push({locale:'en',width:1440,unrelatedVisit:!takeOver,interactionDuringReturn:takeOver,automaticFocusSuppressed:true});
    } finally{await context.close();}
  }
  return results;
}
