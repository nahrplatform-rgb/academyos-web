// Isolated browser evidence with fictional responses; no hosted authorization claim.
import {expect} from '@playwright/test';
import assert from 'node:assert/strict';

// Full Chromium headless emits trusted blur/focus for a real tab switch when
// Playwright's focus emulation is off. Some platforms keep visibility "visible".
export async function checkOwnerTabFocus(browser,origin,context,session) {
 const result=[];
 for(const view of ['home','calendar']){
  const pc=await browser.newContext({viewport:{width:1440,height:900}});
  try{
   const page=await pc.newPage(),other=await pc.newPage();
   await page.bringToFront();
   let reads=0,documents=0;
   page.on('request',req=>{
    if(req.isNavigationRequest()&&req.resourceType()==='document')documents++;
    if(new URL(req.url()).pathname==='/api/experience')reads++;
   });
   await page.goto(`${origin}/en/workspace/${context.academy_id}/${view}${view==='calendar'?`?anchor=${session.day}`:''}`);
   const row=page.locator('.experience-session');
   const search=page.getByRole('searchbox');
   await row.click();
   await search.fill('Fictional');
   await expect(search).toBeFocused();
   assert.equal(reads,1,'initial scoped read');
   for(const tab of [page,other]){
    const cdp=await pc.newCDPSession(tab);
    await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});
   }
   await page.evaluate(()=>{
    const events=[];
    window.observedReturn=events;
    for(const name of ['focus','blur'])window.addEventListener(name,event=>events.push({name,trusted:event.isTrusted}));
    document.addEventListener('visibilitychange',event=>events.push({name:document.visibilityState,trusted:event.isTrusted}));
   });
   let release;
   await page.route('**/api/experience',async route=>{
    await new Promise(resolve=>{release=resolve;});
    await route.continue();
   });
   await other.bringToFront();
   await expect.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(false);
   const otherTabVisibility=await page.evaluate(()=>document.visibilityState);
   await page.bringToFront();
   await expect.poll(()=>reads).toBe(2);
   await expect(page.locator('.experience-reload')).toBeDisabled();
   await expect(row).toBeVisible();
   await expect(row).toHaveAttribute('aria-pressed','true');
   await expect(search).toBeFocused();
   release();
   await expect(page.locator('.experience-reload')).toBeEnabled();
   const events=await page.evaluate(()=>window.observedReturn);
   assert.ok(events.some(event=>event.name==='blur'&&event.trusted),'real tab switch blurs the working tab');
   assert.ok(events.some(event=>event.name==='focus'&&event.trusted),'working tab receives a real focus event');
   assert.equal(reads,2,'one read for the native return');
   assert.equal(documents,1,'only the first navigation requests a document');
   result.push({view,otherTabVisibility,events,resumeReads:reads-1,documentTransitions:documents-1,selected:true,focusedSearch:true});
  }finally{await pc.close();}
 }
 return result;
}

export async function checkOwnerTabResume(browser, origin, context, session) {
 const cases=[], gaps=[];
 for(const view of ['home','calendar']) for(const locale of ['en','ar']) {
  const pc=await browser.newContext({viewport:{width:1440,height:600}}), page=await pc.newPage();
  let reads=0, status=200, held=false, release; const documents=[], errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
  const items=Array.from({length:view==='home'?5:30},(_,i)=>({...session,id:`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,program:`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,title:`Fictional session ${i+1}`}));
  await page.route('**/api/experience',async route=>{
   const body=route.request().postDataJSON(); reads++;
   if(held) await new Promise(r=>{release=r;});
   if(status!==200) return route.fulfill({status,json:{error:status===403?'denied':'unavailable'}});
   const panels=Object.fromEntries(['unfinished_programs','private_publication_reviews','corrections','feedback_reviews','invitations','incomplete_attendance'].map(key=>[key,{state:'ready',count:0}]));
   const data=view==='home'?{context,as_of:'2026-11-01T12:00:00Z',panels:{...panels,today:{state:'ready',count:items.length,items,more:false}}}:{context,as_of:'2026-11-01T12:00:00Z',anchor:'2026-11-01',from:body.from,to:body.to,total:items.length,items,more:false,next:null};
   await route.fulfill({json:{data}});
  });
  try {
   await page.goto(`${origin}/${locale}/workspace/${context.academy_id}/${view}${view==='calendar'?'?anchor=2026-11-01':''}`);
   const rows=page.locator('.experience-session'), search=page.locator('input[type=search]');
   await expect(rows).toHaveCount(items.length);
   if(view==='calendar'){
    await page.getByRole('button',{name:locale==='ar'?'شهر':'Month',exact:true}).click();
    await expect(page.locator('.operations-month-board')).toBeVisible();
   }
   await search.fill('Fictional'); await rows.first().click();
   await expect(page.locator('.operations-inspection')).toBeVisible();
   await expect(rows.first()).toHaveAttribute('aria-pressed','true');
   await search.evaluate(el=>{el.focus({preventScroll:true});el.setSelectionRange(2,6);});
   await page.locator('.workspace-center').evaluate(el=>{el.scrollTop=400;});
   const snap=()=>page.evaluate(()=>{
    const search=document.querySelector('input[type=search]');
    const active=document.activeElement;
    return {
     scroll:document.querySelector('.workspace-center').scrollTop, windowY:window.scrollY,
     focus:active===search?'search':active?.matches('.experience-reload')?'refresh':active?.tagName,
     filter:search?.value??null, range:search?[search.selectionStart,search.selectionEnd]:null,
     selected:document.querySelector('[data-occurrence][aria-pressed="true"]')?.getAttribute('data-occurrence')??null,
     period:document.querySelector('input[type=date]')?.value??null, month:Boolean(document.querySelector('.operations-month-board')),
     rows:document.querySelectorAll('.experience-session').length,
    };
   });
   const before=await snap(); assert.ok(before.scroll>0||before.windowY>0,`${view} ${locale}: meaningful scroll`);
   const docCount=documents.length;
   const resume=async()=>{await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});};
   const pairedFocus=async()=>{await page.waitForTimeout(150);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));};
   let start=reads; held=true; await resume(); await expect.poll(()=>reads).toBe(start+1);
   await expect(rows).toHaveCount(items.length); await expect(rows.first()).toHaveAttribute('aria-pressed','true');
   const during=await snap(); assert.equal(during.filter,before.filter);assert.equal(during.focus,'search');assert.equal(during.scroll,before.scroll);
   held=false;release();await expect(page.locator('.experience-reload')).toBeEnabled();await expect(rows).toHaveCount(items.length);
   await pairedFocus();
   const after=await snap(); assert.equal(reads,start+1,'paired focus after settle adds no read');assert.deepEqual(after,before,'successful resume preserves checked state');assert.equal(documents.length,docCount);
   status=503;held=true;start=reads;await resume();await expect.poll(()=>reads).toBe(start+1);await pairedFocus();await expect(rows).toHaveCount(items.length);assert.equal((await snap()).selected,before.selected);
   held=false;release();await expect(page.locator('main p[role="alert"]')).toBeVisible();await expect(rows).toHaveCount(0);assert.equal(reads,start+1);
   const failed=await snap();status=200;start=reads;
   const refresh=page.locator('.experience-reload');
   await refresh.focus();
   await page.keyboard.press('Enter');
   await expect(rows).toHaveCount(items.length);await expect(rows.first()).toHaveAttribute('aria-pressed','true');await expect.poll(()=>reads).toBe(start+1);
   await expect(refresh).toBeEnabled();
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const recovered=await snap();
   assert.equal(recovered.filter,before.filter);assert.equal(recovered.selected,before.selected);
   assert.equal(recovered.period,before.period);assert.equal(recovered.month,before.month);assert.equal(documents.length,docCount);
   if(failed.focus!=='refresh'||JSON.stringify(recovered)!==JSON.stringify(before)) gaps.push({view,locale,kind:'503-retry-position-or-focus',before,failed,recovered});
   status=403;start=reads;await resume();await expect.poll(()=>reads).toBe(start+1);await pairedFocus();await expect(page.locator('main p[role="alert"]')).toBeVisible();await expect(rows).toHaveCount(0);await expect(page.locator('.operations-inspection')).toHaveCount(0);await page.waitForTimeout(200);assert.equal(reads,start+1,'denial causes no speculative recovery');assert.equal(documents.length,docCount);assert.deepEqual(errors,[]);
   const storedSelection=await page.evaluate(({academy,view})=>
    JSON.parse(sessionStorage.getItem(`academyos:experience:user_synthetic_navigation:${academy}:owner:${view}`)).selection,
    {academy:context.academy_id,view});
   assert.equal(storedSelection,null,'known denial clears the saved selection');
   cases.push({view,locale,viewport:'1440×600',before,during,after,failed,recovered,denied:await snap(),documentTransitions:documents.length-docCount,pairedReads:1});
  } finally { await pc.close(); }
 }
 const phoneContext=await browser.newContext({viewport:{width:390,height:720},isMobile:true,hasTouch:true});
 const phone=await phoneContext.newPage();
 try {
  const calls=[];
  let nextStatus=200, release;
  let waitForReply=false;
  await phone.route('**/api/experience',async route=>{
   const {action,from,to}=route.request().postDataJSON();
   const status=nextStatus;
   calls.push({action,status});
   if(waitForReply)await new Promise(resolve=>{release=resolve;});
   await route.fulfill(status===200
    ?{json:{data:{context,as_of:'2026-11-01T12:00:00Z',from,to,items:[session],total:1,more:false,next:null}}}
    :{status,json:{error:'unavailable'}});
  });
  await phone.goto(`${origin}/ar/workspace/${context.academy_id}/calendar?anchor=${session.day}`);
  const dialog=phone.getByRole('dialog',{name:'تفاصيل التدريب'});
  const details=phone.locator('.operations-inspection');
  const row=phone.locator('.experience-session');
  const reload=phone.locator('.experience-reload');
  await row.click();
  await expect(dialog).toBeVisible();
  nextStatus=503;
  waitForReply=true;
  await phone.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect.poll(()=>calls.length).toBe(2);
  await expect(details).toBeVisible();
  const destination=dialog.getByRole('link',{name:'فتح هذا التاريخ'});
  await expect(destination).toHaveAttribute('aria-disabled','true');
  await phone.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  waitForReply=false;
  release();
  await expect(phone.locator('main p[role="alert"]')).toBeVisible();
  await expect(dialog).toBeHidden();
  await expect(details).toHaveCount(0);
  await expect(row).toHaveCount(0);
  nextStatus=200;
  waitForReply=true;
  await reload.click();
  await expect.poll(()=>calls.length).toBe(3);
  await expect(reload).toBeDisabled();
  await phone.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const prematureDialog=await dialog.isVisible();
  await expect(details).toHaveCount(0);
  waitForReply=false;
  release();
  await expect(dialog).toBeVisible();
  await expect(details).toContainText(session.title);
  await expect(destination).toHaveAttribute('aria-disabled','false');
  await expect(row).toHaveAttribute('aria-pressed','true');
  assert.deepEqual(calls.map(call=>call.action),['owner_calendar','owner_calendar','owner_calendar']);
  if(prematureDialog)gaps.push({view:'calendar',locale:'ar',kind:'selected-dialog-reopens-before-retry-authority'});
  cases.push({view:'calendar',locale:'ar',viewport:'390×720',dialogDuringCheck:true,dialogOnFailure:false,
   dialogWhileRetry:prematureDialog,dialogAfterCurrentResult:true,calls});
 } finally {await phoneContext.close();}
 return {cases,gaps};
}
