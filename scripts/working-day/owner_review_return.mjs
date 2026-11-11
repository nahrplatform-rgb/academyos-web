import assert from 'node:assert/strict';
import {join} from 'node:path';
import {expect} from '@playwright/test';

const labels = {
  en:{width:1440,height:900,home:'Academy operations',search:'Search this loaded page',back:'Back to Today',
    correction:'Review decision',decisionReason:'Decision reason',review:'Review exact change',
    acknowledge:'I reviewed this player, session and consequence.',confirmDecision:'Confirm decision',
    correctionSaved:'Saved. Current result shown.',changes:'Request changes',reason:'Internal reason',
    confirmReturn:'Confirm return',developmentSaved:'Operation confirmed. The current saved result is shown.'},
  ar:{width:390,height:844,home:'عمليات الأكاديمية',search:'البحث في هذه الصفحة المحملة',back:'العودة إلى اليوم',
    correction:'مراجعة القرار',decisionReason:'سبب القرار',review:'مراجعة التغيير المحدد',
    acknowledge:'راجعت اللاعب والتدريب والنتيجة.',confirmDecision:'تأكيد القرار',
    correctionSaved:'حُفظ. النتيجة الحالية معروضة.',changes:'طلب تعديلات',reason:'سبب داخلي',
    confirmReturn:'تأكيد الإعادة',developmentSaved:'تأكدت العملية. تُعرض النتيجة المحفوظة الحالية.'},
};
const cases = [
  {kind:'correction',locale:'en',resolved:false},
  {kind:'correction',locale:'ar',resolved:true},
  ...['en','ar'].flatMap(locale=>[false,true].map(resolved=>({kind:'development',locale,resolved}))),
];

/** Actual signed synthetic reviews; each case owns a fresh fixture and browser context. */
export async function checkOwnerReviewReturn(fixture,browser,captures) {
  const {origin,state,db}=fixture,results=[];
  for(const scenario of cases) {
    const {kind,locale,resolved}=scenario, t=labels[locale];
    const {academy,event,player,id}=await db({action:'review_fixture',kind});
    const context=await browser.newContext({viewport:{width:t.width,height:t.height}});
    try {
      const page=await context.newPage(),documents=[],errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())documents.push(request.url());});
      const calls=start=>state.events.slice(start).map(({route,action,status})=>[route,action,status]);
      const button=name=>page.getByRole('button',{name,exact:true});
      const base=`/${locale}/workspace/${academy}`, marker=`#${kind}-return=${id}`;
      const destination=kind==='correction'
        ? `${base}/attendance/corrections?event=${event}&request=${id}#review-from-today=${id}`
        : `${base}/development?event=${event}&player=${player}#review-from-today=${id}`;
      const task=page.locator(`[data-owner-today-task="${marker}"]`);
      const filter=page.getByRole('searchbox',{name:t.search,exact:true});
      const position=()=>page.evaluate(()=>({center:document.querySelector('.workspace-center')?.scrollTop??0,document:window.scrollY}));
      await page.goto(origin+base+'/home');
      await expect(page.getByRole('heading',{name:t.home,exact:true})).toBeVisible();
      await expect(task).toHaveCount(1);
      await expect(task).toHaveAttribute('href',destination);
      await filter.fill('review return test');
      await task.scrollIntoViewIfNeeded();
      const beforeScroll=await position(),entryStart=state.events.length;
      await task.click();
      await expect(button(kind==='correction'?t.correction:t.changes)).toBeVisible();
      const entry=calls(entryStart);
      assert.deepEqual(entry,[[kind==='correction'?'attendance':'development',kind==='correction'?'correction_detail':'detail',200]]);
      const back=page.getByRole('link',{name:t.back,exact:true});
      await expect(back).toHaveAttribute('href',base+'/home'+marker);
      if(locale==='ar'){
        await page.setViewportSize({width:320,height:t.height});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
        await page.setViewportSize({width:t.width,height:t.height});
      }
      if(captures&&!resolved)await page.screenshot({path:join(captures,`review-task-${kind}-${locale}.png`)});
      let decision;
      if(kind==='correction') {
        await button(t.correction).click();
        await page.getByRole('textbox',{name:t.decisionReason,exact:true}).fill('Synthetic review reason');
      } else {
        await button(t.changes).click();
        await page.getByRole('textbox',{name:t.reason,exact:true}).fill('Synthetic review reason');
      }
      if(!resolved) {
        const decline=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());
        await back.click();await decline;
        assert.equal(page.url(),origin+destination);
        await expect(page.getByRole('textbox',{name:kind==='correction'?t.decisionReason:t.reason,exact:true})).toHaveValue('Synthetic review reason');
      } else {
        const start=state.events.length;
        if(kind==='correction') {
          await button(t.review).click();
          await page.getByLabel(t.acknowledge,{exact:true}).check();
          await button(t.confirmDecision).click();
          await expect(page.getByText(t.correctionSaved,{exact:true})).toBeVisible();
        } else {
          await button(t.confirmReturn).click();
          await expect(page.getByText(t.developmentSaved,{exact:true})).toBeVisible();
        }
        decision=calls(start);
        assert.deepEqual(decision,kind==='correction'
          ? [['attendance','correction_decide',200],['attendance','correction_detail',200]]
          : [['development','command',200],['development','detail',200]]);
      }
      const returnStart=state.events.length;
      if(resolved) await back.click();
      else {
        const accept=page.waitForEvent('dialog').then(dialog=>dialog.accept());
        await back.click();await accept;
      }
      await page.waitForURL(url=>url.pathname===base+'/home');
      await expect(filter).toHaveValue('review return test');
      if(resolved) {
        await expect(task).toHaveCount(0);
        await expect(page.locator('#owner-today-attention')).toBeFocused();
      } else {
        await expect(task).toBeFocused();
        await expect.poll(position).toEqual(beforeScroll);
      }
      const returned=calls(returnStart);
      assert.deepEqual(returned,[['experience','owner_home',200]]);
      assert.equal(documents.length,1);
      assert.deepEqual(errors,[]);
      const afterScroll=await position();
      const focus=await page.evaluate(()=>({id:document.activeElement?.id??'',task:document.activeElement?.getAttribute('data-owner-today-task')}));
      if(captures)await page.screenshot({path:join(captures,`review-return-${kind}-${locale}-${resolved?'resolved':'retained'}.png`)});
      results.push({kind,locale,width:t.width,height:t.height,resolved,entry,decision,returned,
        documents:documents.length,beforeScroll,afterScroll,focus,dirtyCancelPreserved:!resolved});
    } finally {await context.close();}
  }
  return results;
}

export async function checkOwnerReviewRecovery(fixture,browser) {
 const {origin,state,db}=fixture,results=[];
 for(const kind of ['correction','development']){
  const scope=await db({action:'review_fixture',kind});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try{
   const base=`/en/workspace/${scope.academy}`;
   const correction=kind==='correction';
   const routeName=correction?'attendance':'development';
   const writeAction=correction?'correction_decide':'command';
   const lookupAction=correction?'correction_reconcile':'operation';
   const key=`${correction?'corrections':'development'}:v1:user_owner:${scope.academy}`;
   const marker=`#${kind}-return=${scope.id}`;
   const stored=()=>page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)??'null'),key);
   const calls=start=>state.events.slice(start).map(({route,action,status})=>[route,action,status]);
   const button=name=>page.getByRole('button',{name,exact:true});
   await page.goto(origin+base+'/home');
   await page.locator(`[data-owner-today-task="${marker}"]`).click();
   let sent;
   await page.route(`**/api/${routeName}`,async route=>{
    const body=route.request().postDataJSON();
    if(body?.action!==writeAction)return route.continue();
    sent=body;
    const reply=await route.fetch();
    assert.equal(reply.status(),200);
    await route.abort('failed');
   });
   const before=state.events.length;
   if(correction){
    await button('Review decision').click();
    await page.getByRole('textbox',{name:'Decision reason',exact:true}).fill('Fictional original reason');
    await button('Review exact change').click();
    await page.getByLabel('I reviewed this player, session and consequence.',{exact:true}).check();
    await button('Confirm decision').click();
   }else{
    await button('Review publication').click();
    await button('Confirm publication').click();
   }
   const recover=button('Check original operation');
   await expect(recover).toBeVisible();
   await expect(page.getByRole('link',{name:'Back to Today',exact:true})).toHaveAttribute('aria-disabled','true');
   const original=correction?{op:sent.op,event:scope.event}:{operation:sent.operation,event:scope.event,player:scope.player};
   assert.deepEqual(await stored(),original,'Only opaque recovery references are stored');
   const reloadStart=state.events.length;
   page.once('dialog',dialog=>dialog.accept());
   await page.reload();
   await expect(recover).toBeVisible();
   assert.deepEqual(calls(reloadStart),[],'Reopen discovers the original before requesting a replacement task');
   assert.deepEqual(await stored(),original);
   if(!correction){
    state.sessionValid=false;
    await recover.click();
    await expect(page.locator('main').getByRole('alert')).toContainText('Sign in again');
    await expect(page.getByRole('heading',{name:'Alex Demo',exact:true})).toHaveCount(0);
    assert.deepEqual(await stored(),original);
    state.sessionValid=true;
   }
   const lookup=page.waitForRequest(request=>request.url().endsWith(`/api/${routeName}`)&&request.postDataJSON()?.action===lookupAction);
   await recover.click();
   const reconciled=(await lookup).postDataJSON();
   assert.equal(reconciled[correction?'op':'operation'],original[correction?'op':'operation']);
   await expect(page.getByText(correction?'Saved. Current result shown.':'Operation confirmed. The current saved result is shown.',{exact:true})).toBeVisible();
   assert.equal(await stored(),null);
   const trace=calls(before).filter(([route,action])=>route===routeName&&[writeAction,lookupAction].includes(action));
   assert.deepEqual(trace,correction?[[routeName,writeAction,200],[routeName,lookupAction,200]]
    :[[routeName,writeAction,200],[routeName,lookupAction,401],[routeName,lookupAction,200]]);
   await page.getByRole('link',{name:'Back to Today',exact:true}).click();
   await expect(page.locator('#owner-today-attention')).toBeFocused();
   await expect(page.locator(`[data-owner-today-task="${marker}"]`)).toHaveCount(0);
   assert.deepEqual(errors,[]);
   results.push({kind,trace,sameOriginal:true,noRequestBeforeExplicitRecovery:true,privatePayloadStored:false,
    locatorClearedAfterKnownResult:true,missingSignInRetainedOriginal:!correction});
  }finally{state.sessionValid=true;await page.close();}
 }

 const scope=await db({action:'review_fixture',kind:'development'});
 const page=await browser.newPage();
 try{
  await page.addInitScript(()=>{
   const set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(key,value){
    if(key.startsWith('development:v1:'))throw new DOMException('Fictional storage refusal','QuotaExceededError');
    return set.call(this,key,value);
   };
  });
  await page.goto(`${origin}/en/workspace/${scope.academy}/development?event=${scope.event}&player=${scope.player}`);
  await page.getByRole('button',{name:'Request changes',exact:true}).click();
  const reason=page.getByRole('textbox',{name:'Internal reason',exact:true});
  await reason.fill('Fictional work to retain');
  const start=state.events.length;
  await page.getByRole('button',{name:'Confirm return',exact:true}).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Nothing was submitted');
  await expect(reason).toHaveValue('Fictional work to retain');
  assert.equal(state.events.slice(start).filter(({route,action})=>route==='development'&&action==='command').length,0);
  await page.route('**/api/development',route=>route.request().postDataJSON()?.action==='history'
   ?route.fulfill({status:401,contentType:'text/plain',body:'Fictional expired sign-in'})
   :route.continue());
  await page.getByRole('button',{name:'Internal revision history',exact:true}).click();
  await expect(page.locator('main').getByRole('alert')).toContainText('Sign in again');
  await expect(reason).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Alex Demo',exact:true})).toHaveCount(0);
  results.push({kind:'development',storageWriteRefused:true,reasonRetained:true,commands:0,nonJsonExpiredSessionMasked:true});
 }finally{await page.close();}
 return results;
}
