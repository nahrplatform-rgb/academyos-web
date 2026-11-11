import assert from 'node:assert/strict';
import {join} from 'node:path';
import {expect} from '@playwright/test';

const labels={
 en:{width:1440,height:900,home:'Academy operations',search:'Search this loaded page',back:'Back to Today',browse:'Browse preparations',review:'Review exact visibility changes',ack:'I reviewed the changes, exceptions and exact audience.',cancel:'Cancel preparation'},
 ar:{width:390,height:844,home:'عمليات الأكاديمية',search:'البحث في هذه الصفحة المحملة',back:'العودة إلى اليوم',browse:'استعراض التجهيزات',review:'مراجعة تغييرات الظهور المحددة',resume:'استئناف فحص التواريخ',cancel:'إلغاء التجهيز',cancelled:'أُلغي التجهيز. لم يتغير الظهور.'},
};
const cases=[
 {locale:'en',state:'ready',completed:false},
 {locale:'ar',state:'preparing',completed:false},
 {locale:'ar',state:'preparing',completed:true},
];

/** Signed synthetic saved-publication returns, each with a fresh disposable academy. */
export async function checkOwnerPublicationReturn(fixture,browser,captures){
 const {origin,state,db}=fixture,results=[];
 for(const scenario of cases){
  const {locale,completed}=scenario,t=labels[locale];
  const {academy,program,job}=await db({action:'publication_fixture',state:scenario.state});
  const context=await browser.newContext({viewport:{width:t.width,height:t.height}});
  try{
   const page=await context.newPage(),documents=[],errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())documents.push(request.url());});
   const calls=start=>state.events.slice(start).map(({route,action,status})=>[route,action,status]);
   const button=name=>page.getByRole('button',{name,exact:true});
   const base=`/${locale}/workspace/${academy}`,marker=`#publication-return=${job}`;
   const destination=`${base}/programs/${program}/publish?job=${job}#review-from-today=${job}`;
   const task=page.locator(`[data-owner-today-task="${marker}"]`);
   const filter=page.getByRole('searchbox',{name:t.search,exact:true});
   const position=()=>page.evaluate(()=>({center:document.querySelector('.workspace-center')?.scrollTop??0,document:window.scrollY}));
   await page.goto(origin+base+'/home');
   await expect(page.getByRole('heading',{name:t.home,exact:true})).toBeVisible();
   await expect(task).toHaveCount(1);
   await expect(task).toHaveAttribute('href',destination);
   await filter.fill('publication return test');
   await task.scrollIntoViewIfNeeded();
   const beforeScroll=await position(),entryStart=state.events.length;
   await task.click();
   await expect(page.getByRole('heading',{name:t.review,exact:true})).toBeVisible();
   const entry=calls(entryStart);
   assert.deepEqual(entry,[['publication','read',200]]);
   const back=page.getByRole('link',{name:t.back,exact:true});
   await expect(back).toHaveAttribute('href',base+'/home'+marker);
   await expect(page.getByRole('link',{name:t.browse,exact:true})).toBeVisible();
   if(scenario.state==='ready'){
    await expect(page.getByLabel(t.ack,{exact:true})).toBeEnabled();
    await expect(page.getByRole('button',{name:/^Publish \d+ dates together$/})).toBeDisabled();
   }else{
    await expect(button(t.resume)).toBeEnabled();
    assert.equal(await button(t.resume).evaluate(el=>Boolean(el.compareDocumentPosition(
      document.querySelector('.review-date-inspection'))&Node.DOCUMENT_POSITION_FOLLOWING)),true);
   }
   if(locale==='ar'){
    await page.setViewportSize({width:320,height:t.height});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.setViewportSize({width:t.width,height:t.height});
   }
   if(captures&&!completed)await page.screenshot({path:join(captures,`publication-task-${locale}.png`)});
   let decision=[];
   if(completed){
    const declined=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());
    const noChangeStart=state.events.length;
    await button(t.cancel).click();await declined;
    assert.deepEqual(calls(noChangeStart),[]);
    await expect(button(t.resume)).toBeEnabled();
    const accepted=page.waitForEvent('dialog').then(dialog=>dialog.accept());
    const start=state.events.length;
    await button(t.cancel).click();await accepted;
    await expect(page.getByText(t.cancelled,{exact:true})).toBeVisible();
    decision=calls(start);
    assert.deepEqual(decision,[['publication','change',200],['publication','read',200]]);
   }
   const returnStart=state.events.length;
   await back.click();
   await page.waitForURL(url=>url.pathname===base+'/home');
   await expect(filter).toHaveValue('publication return test');
   if(completed){
    await expect(task).toHaveCount(0);
    await expect(page.locator('#owner-today-attention')).toBeFocused();
   }else{
    await expect(task).toBeFocused();
    await expect.poll(position).toEqual(beforeScroll);
   }
   const returned=calls(returnStart);
   assert.deepEqual(returned,[['experience','owner_home',200]]);
   assert.equal(documents.length,1);
   assert.deepEqual(errors,[]);
   const afterScroll=await position();
   const focus=await page.evaluate(()=>({id:document.activeElement?.id??'',task:document.activeElement?.getAttribute('data-owner-today-task')}));
   if(captures)await page.screenshot({path:join(captures,`publication-return-${locale}-${completed?'completed':'retained'}.png`)});
   results.push({...scenario,entry,decision,returned,documents:documents.length,beforeScroll,afterScroll,focus});
  }finally{await context.close();}
 }
 return results;
}

export async function checkOwnerPublicationRecovery(fixture,browser){
 const {origin,state,db}=fixture,results=[];
 const scope=await db({action:'publication_fixture',state:'ready'});
 const base=`/en/workspace/${scope.academy}`,path=`${base}/programs/${scope.program}/publish?job=${scope.job}`;
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const calls=start=>state.events.slice(start).map(({route,action,status})=>[route,action,status]);
 const review=page.getByRole('heading',{name:labels.en.review,exact:true});
 const button=name=>page.getByRole('button',{name,exact:true});
 const notice=page.locator('.publication-layout').getByRole('alert');
 const publish=page.getByRole('button',{name:/^Publish \d+ dates together$/});
 const ack=page.getByLabel(labels.en.ack,{exact:true});
 const originalKey=`publication:user_owner:${scope.academy}:${scope.program}`;
 const stored=()=>page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)??'null'),originalKey);
 const pathPattern='**/api/publication';
 try {
  await page.goto(origin+base+'/home');
  const task=page.locator(`[data-owner-today-task="#publication-return=${scope.job}"]`);
  await task.click();
  await expect(review).toBeVisible();

  await button('Start fresh review').click();
  const from=page.getByLabel('First date',{exact:true});
  await expect(from).toBeEnabled();
  await from.fill('2099-11-08');
  const back=page.getByRole('link',{name:labels.en.back,exact:true});
  const decline=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());
  await back.click();await decline;
  await expect(from).toHaveValue('2099-11-08');
  const recheckStart=state.events.length;
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect.poll(()=>calls(recheckStart)).toEqual([['publication','context',200]]);
  await expect(from).toHaveValue('2099-11-08');
  const discard=page.waitForEvent('dialog').then(dialog=>dialog.accept());
  await back.click();await discard;
  await expect(task).toBeFocused();
  await task.click();await expect(ack).toBeEnabled();
  results.push({case:'dirty scope return and resume',resume:calls(recheckStart).slice(0,1)});

  let unblock,held=false;
  const holdRead=new Promise(resolve=>{unblock=resolve;});
  const hold=async route=>{
   if(route.request().postDataJSON().action!=='read')return route.continue();
   held=true;await holdRead;await route.continue();
  };
  await page.route(pathPattern,hold);
  const refreshStart=state.events.length;
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  try{await expect.poll(()=>held).toBe(true);await expect(review).toBeVisible();await expect(publish).toBeDisabled();}
  finally{unblock();}
  await expect(ack).toBeEnabled();
  await page.unroute(pathPattern,hold);
  assert.deepEqual(calls(refreshStart),[['publication','read',200]]);
  results.push({case:'visible resume keeps review in place',reads:calls(refreshStart)});

  await page.evaluate(key=>{
   const write=Storage.prototype.setItem;
   Storage.prototype.setItem=function(name,...args){
    if(name===key)throw new DOMException('Fixture quota','QuotaExceededError');
    return write.call(this,name,...args);
   };
   window.addEventListener('restore-publication-storage',()=>{Storage.prototype.setItem=write;},{once:true});
  },originalKey);
  const refused=state.events.length;
  await ack.check();await publish.click();
  await expect(notice).toContainText('Nothing was submitted.');
  assert.deepEqual(calls(refused),[]);
  await page.evaluate(()=>window.dispatchEvent(new Event('restore-publication-storage')));
  results.push({case:'storage refusal',sent:0});

  const originals=[];
  const drop=async route=>{
   const body=route.request().postDataJSON();
   if(body.action==='change'&&body.act==='activate'){
    originals.push(body.op);
    const response=await route.fetch();
    assert.equal(response.status(),200);
    await route.abort('failed');return;
   }
   if(body.action==='reconcile')originals.push(body.op);
   await route.continue();
  };
  await page.route(pathPattern,drop);
  const activationStart=state.events.length;
  await ack.check();await publish.click();
  const reconcile=button('Check original operation');
  await expect(reconcile).toBeEnabled();
  assert.deepEqual(calls(activationStart),[['publication','change',200]]);
  assert.equal((await stored()).op,originals[0]);
  await expect(back).toBeDisabled();
  const reopenStart=state.events.length;
  page.once('dialog',dialog=>dialog.accept());
  await page.reload();
  await expect(reconcile).toBeEnabled();
  assert.equal(new URL(page.url()).pathname,path.split('?')[0]);
  assert.deepEqual(calls(reopenStart),[]);
  state.sessionValid=false;
  await reconcile.click();
  await expect(notice).toContainText('Sign in again');
  assert.equal((await stored()).op,originals[0]);
  await expect(review).toHaveCount(0);
  state.sessionValid=true;
  await reconcile.click();
  await expect(page.getByText('All included changes committed together.',{exact:false})).toBeVisible();
  assert.deepEqual(calls(reopenStart),[['publication','reconcile',401],['publication','reconcile',200],['publication','read',200]]);
  assert.deepEqual(originals,[originals[0],originals[0],originals[0]]);
  assert.equal(await stored(),null);
  assert.deepEqual(errors,[]);
  results.push({case:'lost publication reply, refresh and same original',sent:calls(activationStart),afterReload:calls(reopenStart)});
 }finally{
  state.sessionValid=true;
  await page.close();
 }
 return results;
}
