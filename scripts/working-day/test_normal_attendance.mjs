// Actual ordinary Attendance, public worker, encrypted storage and canonical PG
// sender. Clerk and the provider wire are fictional; installed OS proof is separate.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtemp,mkdir,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';
import {checkOwnerDayReturn} from './owner_day_return.mjs';
import {checkOwnerQueueReturn} from './owner_queue_return.mjs';
import {checkOwnerReviewReturn,checkOwnerReviewRecovery} from './owner_review_return.mjs';
import {checkPhoneRegister} from './register_geometry.mjs';

const root=resolve(import.meta.dirname,'../..');
const output=join(root,'docs/07-handoff/evidence/ex07-normal-attendance');
const receipt=join(output,'runtime.json');
const returnCaptures=join(root,'docs/07-handoff/evidence/mp-b01-phone-register');
const queueCaptures=join(root,'docs/07-handoff/evidence/mp-b01-today-queue');
const reviewCaptures=join(root,'docs/07-handoff/evidence/mp-b01-owner-reviews');
const sources=['apps/web/src/lib/experience-format.ts','apps/web/src/lib/owner-session-navigation.ts',
  'scripts/working-day/test_normal_attendance.mjs','scripts/working-day/owner_day_return.mjs','scripts/working-day/owner_queue_return.mjs','scripts/working-day/owner_review_return.mjs','scripts/working-day/register_geometry.mjs','scripts/working-day/owner_fixture.mjs','scripts/working-day/owner_db.py',
  'apps/web/src/app/[locale]/workspace/[academy]/attendance/[event]/page.tsx',
  'apps/web/src/app/[locale]/workspace/[academy]/attendance/corrections/page.tsx',
  'apps/web/src/app/[locale]/workspace/[academy]/development/page.tsx',
  'apps/web/src/components/correction-workspace.tsx','apps/web/src/components/development-workspace.tsx',
  'apps/web/src/app/api/attendance/route.ts','apps/web/src/app/api/development/route.ts',
  'supabase/migrations/20261028153040_i4c_attendance_correction_requests.sql',
  'supabase/migrations/20261028233812_i5a_development_feedback.sql',
  ...['attendance-workspace','date-planning-workspace','experience-workspace','prepared-register-panel','prepared-register-session','prepared-workspace-startup','workspace-shell','workspace-panes','register-account-boundary'].map(n=>`apps/web/src/components/${n}.tsx`),
  ...['owner-register-pilot','register-session','local-register-repository','register-device-account','register-device-slots','register-original-dispatch','workspace-public-shell','register-download-coordinator'].map(n=>`apps/web/src/lib/${n}.ts`),
  'apps/web/public/prepared-workspace-worker.js','apps/web/public/prepared-register-worker.js','apps/web/src/app/globals.css',
  'apps/web/src/app/api/register-key/route.ts','supabase/migrations/20261106174606_owner_register_binding_conflict.sql'];
const hashes=Object.fromEntries(await Promise.all(sources.map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
if(process.argv.includes('--check')){const d=JSON.parse(await readFile(receipt,'utf8'));assert.deepEqual(d.hashes,hashes);assert.equal(d.checks.length,27);console.log('PASS normal Attendance and Owner review receipt matches sources');process.exit(0);}
const temp=await mkdtemp(join(tmpdir(),'academyos-normal-attendance-'));
let fixture,context,page;
const checks=[],metrics={},errors=[];
const pass=name=>{checks.push(name);console.log('PASS '+name);};
try{
 fixture=await ownerFixture(root,join(temp,'app'),{pilot:true,reviews:true});
 const {origin,state,data,db}=fixture,[a,b]=data.events;
 const captureReturn=process.argv.includes('--record')?returnCaptures:undefined;
 if(captureReturn)await mkdir(captureReturn,{recursive:true});
 const returnBrowser=await chromium.launch();
 try{
  metrics.ownerDayReturn={browser:returnBrowser.version(),node:process.version,os:process.platform,
    cases:await checkOwnerDayReturn(fixture,returnBrowser,captureReturn)};
  if(captureReturn)await mkdir(queueCaptures,{recursive:true});
  metrics.ownerQueueReturn=await checkOwnerQueueReturn(fixture,returnBrowser,captureReturn?queueCaptures:undefined);
  pass('Today queue entry returns to the checked task or finished-work heading with retained context and one source read');
  if(captureReturn)await mkdir(reviewCaptures,{recursive:true});
  metrics.ownerReviewReturn=await checkOwnerReviewReturn(fixture,returnBrowser,captureReturn?reviewCaptures:undefined);
  pass('Today opens the exact correction or feedback with one read and restores the checked queue after review');
  metrics.ownerReviewRecovery=await checkOwnerReviewRecovery(fixture,returnBrowser);
  pass('Review reload reconciles the same original and unavailable recovery storage prevents submission');
 }finally{await returnBrowser.close();}
 const url=(scope,locale='en')=>`${origin}/${locale}/workspace/${scope.academy}/attendance/${scope.event}`;
 const button=(name,tab=page)=>tab.getByRole('button',{name,exact:true});
 const openActions=(tab=page)=>tab.locator('.register-action-menu > summary').click();
 const apiAfter=start=>state.events.slice(start);
 const settled=()=>expect(page.locator('.toolbar-actions [role=status]')).toHaveText('Online');
 async function browser(offline=false,width=1440){
  context=await chromium.launchPersistentContext(join(temp,'profile'),{viewport:{width,height:1000}});
  await context.setOffline(offline);page=context.pages()[0]??await context.newPage();
  page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 }
 async function prepare(scope,count=18){
  await page.goto(url(scope));await openActions();await button('Use a personal-device register').click();
  await page.getByLabel('This is my personal device',{exact:true}).check();
  await button('Prepare register on this device').click();
  await expect(page.getByText(`${count} / ${count} loaded from this device`,{exact:true})).toBeVisible();
  await expect(page.getByText('Ready for offline reopening',{exact:true})).toBeVisible({timeout:20000});
  await settled();
 }
 await browser();await prepare(a);
 const sourceHint=`?from=${a.day}&return=calendar`;
 const linkedAttendance=url(a)+'#'+sourceHint.slice(1);
 const calendarPath=`/en/workspace/${a.academy}/calendar`;
 await page.goto(origin+calendarPath);
 await button('Month').click();
 const calendarSelection=page.locator(`[data-occurrence="${data.program}:${a.day}"][data-state="published"]`).first();
 await calendarSelection.waitFor({state:'visible'});
 const calendarFilter=page.getByRole('searchbox',{name:'Search this loaded page',exact:true});
 await calendarFilter.fill('Fictional working-day');
 await calendarSelection.click();
 await page.getByRole('link',{name:'Open this date',exact:true}).click();
 await page.getByRole('link',{name:'Open attendance',exact:true}).click();
 await page.waitForURL(linkedAttendance);
 await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
 await settled();
 metrics.preparedPhoneRegister=await checkPhoneRegister(page,'prepared','en',captureReturn);
 await page.goto(url(a,'ar')+'#'+sourceHint.slice(1));
 await expect(page.getByText('١٨ / ١٨ محمّلون من هذا الجهاز',{exact:true})).toBeVisible();
 await expect(page.locator('.toolbar-actions [role=status]')).toHaveText('متصل');
 metrics.preparedPhoneRegister.push(...await checkPhoneRegister(page,'prepared','ar',captureReturn));
 await page.goto(linkedAttendance);
 await settled();
 const preparedBack=page.getByRole('link',{name:'Open session',exact:true});
 const preparedReturn=page.getByRole('link',{name:'Back to calendar',exact:true});
 const linkedDate=`/en/workspace/${a.academy}/programs/${data.program}/${a.day}${sourceHint}`;
 await expect(preparedBack).toHaveAttribute('href',linkedDate);
 await expect(preparedReturn).toHaveAttribute('href',calendarPath);
 const firstMark=page.locator('.register-options').first().getByRole('button',{name:'Present',exact:true});
 await firstMark.click();
 await expect(firstMark).toHaveAttribute('aria-pressed','true');
 const confirm=page.waitForEvent('dialog').then(dialog=>dialog.dismiss());
 await preparedReturn.click();
 await confirm;
 assert.equal(page.url(),linkedAttendance);
 await expect(firstMark).toHaveAttribute('aria-pressed','true');
 const preparedDeparture=state.events.length;
 const discard=page.waitForEvent('dialog').then(dialog=>dialog.accept());
 await preparedReturn.click();
 await discard;
 await page.waitForURL(origin+calendarPath);
 await expect(page.locator('.calendar-toolbar')).toHaveAttribute('aria-busy','false');
 await expect(button('Month')).toHaveAttribute('aria-pressed','true');
 await expect(calendarSelection).toHaveAttribute('aria-pressed','true');
 await expect(calendarFilter).toHaveValue('Fictional working-day');
 await expect(page.getByRole('heading',{name:'Session details',exact:true})).toBeFocused();
 assert.deepEqual(apiAfter(preparedDeparture).map(({route,action,status})=>[route,action,status]),
   [['experience','owner_calendar',200]]);
 await page.goto(linkedAttendance);
 await expect(preparedBack).toHaveAttribute('href',linkedDate);
 await settled();
 const beforeLinkedReopen=state.events.length;
 fixture.disconnect();
 await context.setOffline(true);
 const linkedOffline=await page.reload();
 assert.ok(linkedOffline.fromServiceWorker());
 assert.equal(page.url(),linkedAttendance);
 await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
 await expect(preparedBack).toHaveCount(0);
 await expect(preparedReturn).toHaveCount(0);
 assert.equal(state.events.length,beforeLinkedReopen);
 fixture.reconnect();
 await context.setOffline(false);
 await settled();
 await expect(preparedBack).toHaveAttribute('href',linkedDate);
 await expect(preparedReturn).toHaveAttribute('href',calendarPath);
 await preparedBack.click();
 await page.waitForURL(origin+linkedDate);
 await expect(button('Back to calendar')).toBeEnabled();
 metrics.ownerDayReturn.prepared={directRead:'owner_calendar',dirtyCancelPreservedChoice:true,contextRestored:true};
 metrics.ownerDayReturn.linkedOffline={players:18,apiRequests:0,workerResponse:true,sourceAfterReconnect:true};
 await page.goto(url(a));
 await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
 await settled();
 pass('One-step Owner return, exact date alternative, guarded choices and usable normal/prepared phone register in EN/AR');
 await expect(page.locator('.app-scene')).toHaveCount(1);
 await expect(page.getByRole('heading',{name:'Personal-device register',exact:true})).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Offline reopening link',exact:true})).toHaveCount(0);
 if(process.argv.includes('--record')){
  await mkdir(output,{recursive:true});
  await page.screenshot({path:join(output,'normal-en-1440-light.png'),fullPage:true});
  await button('Dark mode').click();await page.screenshot({path:join(output,'normal-en-1440-charcoal.png'),fullPage:true});
  await button('Light mode').click();
 }
 pass('One ordinary Owner Attendance shell reuses explicit personal-device preparation without an offline-mode destination');

 // Independent fictional browser: a failed key reservation must not trap the
 // normal register or invalidate the already prepared device's rows/key.
 for(const scope of [a,data.sameAcademyEvent]){
  const second=await chromium.launchPersistentContext(join(temp,`conflict-${scope.event}`),{viewport:{width:1440,height:1000}});
  try{
   const tab=second.pages()[0]??await second.newPage();
   await tab.goto(url(scope));await openActions(tab);await button('Use a personal-device register',tab).click();
   await tab.getByLabel('This is my personal device',{exact:true}).check();
   const keyStart=state.events.length;
   await button('Prepare register on this device',tab).click();
   await expect(tab.locator('main').getByRole('alert')).toHaveText('A register is already prepared on another device or for another session. Its saved work is unchanged. You can use this register online.');
   if(process.argv.includes('--record'))await tab.screenshot({path:join(output,scope.event===a.event?'binding-device-conflict-en.png':'binding-session-conflict-en.png'),fullPage:true});
   assert.equal(apiAfter(keyStart).filter(r=>r.route==='register-key').length,1);
   await expect(tab.getByText('Ready for offline reopening',{exact:true})).toHaveCount(0);
   await expect(button('Recover saved work',tab)).toHaveCount(0);
   if(scope.event===a.event){
    await tab.getByRole('link',{name:'العربية',exact:true}).click();await tab.setViewportSize({width:390,height:844});
    await expect(tab.locator('main').getByRole('alert')).toHaveText('يوجد سجل محضّر على جهاز آخر أو لتدريب آخر. يبقى عمله المحفوظ دون تغيير. يمكنك استخدام هذا السجل عبر الإنترنت.');
    assert.equal(await tab.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    if(process.argv.includes('--record'))await tab.screenshot({path:join(output,'binding-device-conflict-ar-390.png'),fullPage:true});
    await button('استخدم السجل عبر الإنترنت',tab).click();
    await expect(button('استخدم سجل الجهاز الشخصي',tab)).toBeFocused();
    await expect(tab.getByText('المحمّل: ١٨ / ١٨ · مختار غير محفوظ: ٠',{exact:true})).toBeVisible();
    await expect(tab.locator('.app-scene')).toHaveAttribute('lang','ar');
    await expect(tab.locator('.app-scene')).toHaveAttribute('dir','rtl');
    if(process.argv.includes('--record'))await tab.screenshot({path:join(output,'binding-online-return-ar-390.png'),fullPage:true});
    await tab.getByRole('link',{name:'English',exact:true}).click();await tab.setViewportSize({width:1440,height:1000});
    pass('Arabic online fallback retains the chosen language and restores keyboard focus to the preparation trigger');
   }else{
    await button('Use the online register',tab).click();
    await expect(button('Use a personal-device register',tab)).toBeFocused();
   }
   await expect(tab.getByText('Loaded: 18 / 18 · Selected, not saved: 0',{exact:true})).toBeVisible();
   const reloadStart=state.events.length;await tab.reload();
   await openActions(tab);
   await expect(button('Use a personal-device register',tab)).toBeVisible();
   assert.equal(apiAfter(reloadStart).filter(r=>r.route==='register-key').length,0);
  }finally{await second.close();}
 }
 await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
 pass('An existing event or device binding refuses key release, keeps the first prepared register intact and allows normal online use after failure and reload');

 let before=state.events.length;await page.reload();
 await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();await settled();
 const reads=apiAfter(before);assert.equal(reads.filter(r=>r.route==='attendance').length,0);
 assert.deepEqual(reads.filter(r=>r.route==='register-download').map(r=>r.action),['manifest']);
 metrics.preparedReopen={attendanceReads:0,manifestReads:1};
 pass('Prepared normal reopening avoids the old preliminary roster read and uses one unchanged manifest');

 let release,entered;
 const held=new Promise(r=>release=r),seen=new Promise(r=>entered=r);
 await page.route('**/api/register-download',async route=>{entered();await held;await route.continue();},{times:1});
 before=state.events.length;
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('online'));});
 await seen;
 const first=page.locator('.register-options').first().getByRole('button',{name:'Present',exact:true});
 await first.click();await page.getByLabel('Find a loaded player',{exact:true}).fill('لاعب');
 await page.locator('.register-person button').first().click();
 await expect(first).toHaveAttribute('aria-pressed','true');await expect(page.locator('.register-roster li')).toHaveCount(18);
 release();await settled();await expect(first).toHaveAttribute('aria-pressed','true');
 assert.equal(apiAfter(before).filter(r=>r.route==='register-download').length,1);
 pass('Paired resume signals share one held freshness check while rows, filter, selection and unsaved marks remain usable');

 page.once('dialog',d=>d.dismiss());await page.getByRole('link',{name:'Calendar',exact:true}).click();
 assert.equal(page.url(),url(a));await expect(first).toHaveAttribute('aria-pressed','true');
 before=state.events.length;fixture.disconnect();await context.setOffline(true);await page.getByLabel('Find a loaded player',{exact:true}).fill('');
 const rows=page.locator('.register-options');await expect(rows).toHaveCount(18);
 for(let i=0;i<18;i++)await rows.nth(i).getByRole('button',{name:i%2?'Absent':'Present',exact:true}).click();
 await button('Review register').click();
 await page.evaluate(()=>{const original=IDBObjectStore.prototype.add;IDBObjectStore.prototype.add=function(value,...args){if(this.name==='originals'){IDBObjectStore.prototype.add=original;this.transaction.abort();throw new Error('fixture_disk_abort');}return original.call(this,value,...args);};});
 await button('Save selected marks').click();
 await expect(page.locator('main').getByRole('alert')).toContainText('Saved work remains protected');
 await expect(page.locator('.register-options [aria-pressed=true]')).toHaveCount(18);
 await expect(page.getByText('Saved on this device · Awaiting sync',{exact:true})).toHaveCount(0);
 assert.equal(state.events.length,before);
 pass('Dirty navigation is guarded and a failed strict local commit keeps every choice without false save or transport');

 await button('Save selected marks').click();await expect(page.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
 await expect(page.getByText('Present · Saved on this device',{exact:true})).toHaveCount(9);
 await expect(page.getByText('Absent · Saved on this device',{exact:true})).toHaveCount(9);
 assert.equal(state.events.length,before);
 const cached=await page.evaluate(async()=>{const result=[];for(const name of await caches.keys()){const cache=await caches.open(name);for(const r of await cache.keys()){const u=new URL(r.url);if(!u.pathname.startsWith('/_next/static/')&&!['/prepared-workspace','/prepared-workspace/cache-pointer'].includes(u.pathname))throw new Error('private_cached_path');if(u.pathname==='/prepared-workspace'){const html=await(await cache.match(r)).text();if(/user_owner|لاعب خيالي|accounts\.dev/.test(html))throw new Error('private_shell');}result.push(u.pathname);}}return result.length;});
 metrics.cachedPublicEntries=cached;
 pass('All 18 selected marks commit locally under one original and only bounded public code is cached');

 await context.close();await browser(true,390);before=state.events.length;
 const response=await page.goto(url(a,'ar'));assert.ok(response.fromServiceWorker());
 await expect(page.getByRole('heading',{name:'حضور التدريب',exact:true})).toBeVisible();
 await expect(page.getByText('محفوظ على هذا الجهاز · بانتظار المزامنة',{exact:true})).toBeVisible();
 await expect(page.getByText('١٨ / ١٨ محمّلون من هذا الجهاز',{exact:true})).toBeVisible();
 assert.equal(state.events.length,before);metrics.offlineNormalRoute={fullBrowserRestart:true,operatingRequests:0,normalArabicUrl:true};
 const widths=[];
 for(const width of [320,360,390]){
  await page.setViewportSize({width,height:1000});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Normal Arabic register must fit phone width');
  widths.push(width);
 }
 metrics.phoneWidthsWithoutDocumentOverflow=widths;
 if(process.argv.includes('--record')){
  await page.screenshot({path:join(output,'offline-ar-390.png'),fullPage:true});
  await button('الوضع الداكن').click();await page.screenshot({path:join(output,'offline-ar-390-charcoal.png'),fullPage:true});
  await button('الوضع الفاتح').click();
 }
 pass('Actual root public worker reopens the normal Arabic Attendance URL and durable original after full browser restart with zero API calls');

 const key=`attendance:user_owner:${a.academy}:${a.event}`;
 await page.evaluate(({key,id})=>sessionStorage.setItem(key,id),{key,id:randomUUID()});await page.reload();
 await expect(page.getByText('يوجد حفظ أصلي يحتاج التحقق عبر الإنترنت قبل تسجيل حضور آخر.',{exact:true})).toBeVisible();
 await expect(page.locator('.register-roster')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'تحقق من الحفظ الأصلي عبر الإنترنت',exact:true})).toHaveAttribute('href',new URL(url(a,'ar')).pathname);
 await page.evaluate(key=>sessionStorage.removeItem(key),key);await page.reload();
 await expect(page.getByText('١٨ / ١٨ محمّلون من هذا الجهاز',{exact:true})).toBeVisible();
 pass('An old online unknown-operation locator takes precedence over prepared normal-route data and blocks replacement');

 await page.setViewportSize({width:1440,height:1000});
 const docs=[];page.on('request',r=>{if(r.isNavigationRequest()&&r.frame()===page.mainFrame())docs.push(r.url());});
 state.sessionValid=false;state.sessionRefresh='unavailable';
 const authBefore=state.sessionRefreshes,dispatchBefore=state.dispatchBodies.length;
 fixture.reconnect();await context.setOffline(false);
 await expect(page.locator('main').getByRole('alert')).toHaveText('تعذّر التحقق من تسجيل الدخول. يبقى عملك على هذا الجهاز. أعد المحاولة عند الاتصال.');
 await expect(page.getByText('محفوظ على هذا الجهاز · بانتظار المزامنة',{exact:true})).toBeVisible();
 await expect(page.locator('.register-roster li')).toHaveCount(18);
 assert.equal(state.sessionRefreshes-authBefore,1);assert.equal(state.dispatchBodies.length,dispatchBefore);assert.equal(docs.length,0);
 if(process.argv.includes('--record')){
  await page.screenshot({path:join(output,'auth-unavailable-ar-1440.png'),fullPage:true});
  await page.setViewportSize({width:390,height:1000});
  await page.screenshot({path:join(output,'auth-unavailable-ar-390.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
 }
 await page.getByLabel('البحث في اللاعبين المحمّلين',{exact:true}).fill('لاعب');
 await page.locator('.register-person button').first().click();
 assert.equal(state.sessionRefreshes-authBefore,1,'Local filter/selection must not refresh authentication');
 pass('Independent expired server session and unavailable SDK refresh preserve the pending normal task without a dispatch, false access loss or reload');

 state.sessionRefresh='signed_out';await button('أعد محاولة الحفظ الأصلي').click();
 await expect(page.locator('main').getByRole('alert')).toHaveText('سجّل الدخول للمزامنة. يبقى عملك المحفوظ على هذا الجهاز.');
 await expect(page.getByRole('link',{name:'سجّل الدخول للمتابعة',exact:true})).toHaveAttribute('href',new URL(url(a,'ar')).pathname);
 await expect(page.locator('.register-roster li')).toHaveCount(18);assert.equal(state.dispatchBodies.length,dispatchBefore);
 assert.equal(docs.length,0);
 if(process.argv.includes('--record'))await page.screenshot({path:join(output,'auth-required-ar-1440.png'),fullPage:true});
 pass('Missing ordinary sign-in has truthful focused recovery and keeps the original and local rows instead of revoking the Owner');

 state.sessionRefresh='ok';let capturedWire,attempts=0;
 const expiredThenLost=async route=>{
  attempts++;capturedWire??=route.request().postData();assert.equal(route.request().postData(),capturedWire);
  if(attempts===1){state.sessionValid=false;await route.continue();}
  else if(attempts===2){await route.fetch();await route.abort('failed');}
  else await route.continue();
 };
 await page.route('**/api/register-dispatch',expiredThenLost);
 fixture.disconnect();await context.setOffline(true);await page.reload();
 await expect(page.getByText('محفوظ على هذا الجهاز · بانتظار المزامنة',{exact:true})).toBeVisible();
 await page.getByLabel('البحث في اللاعبين المحمّلين',{exact:true}).fill('لاعب');
 await page.locator('.register-person button').first().click();
 docs.length=0; // The intentional offline reload is outside reconnect's document budget.
 state.sessionValid=false;fixture.reconnect();await context.setOffline(false);
 await expect(page.getByText('النتيجة غير معروفة · تحقّق من الحفظ الأصلي',{exact:true})).toBeVisible();
 await expect(page.locator('.toolbar-actions [role=status]')).toContainText('نتيجة الخادم غير معروفة');
 await expect(page.locator('.register-heading')).toContainText('محفوظ على هذا الجهاز · نتيجة الخادم غير معروفة');
 assert.equal(docs.length,0);
 const original=JSON.parse(capturedWire),counts=()=>db({action:'counts',...a,op:original.op});
 assert.deepEqual(await counts(),{marks:18,history:18,operations:1,audit:1});
 assert.equal(attempts,2);
 assert.deepEqual(state.events.filter(r=>r.route==='register-dispatch').map(r=>r.status),[401,200]);
 await expect(page.getByLabel('البحث في اللاعبين المحمّلين',{exact:true})).toHaveValue('لاعب');
 await expect(page.locator('.register-person button').first()).toHaveAttribute('aria-pressed','true');
 pass('A real-shaped401 permits one SDK force-refresh and identical-original retry without changing the task, operation or domain checks');
 await page.route('**/api/register-download',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'}),{times:1});
 await button('أعد محاولة الحفظ الأصلي').click();
 await expect(page.getByText('تأكد الحفظ؛ تعذّرت قراءة القائمة الأحدث. أعد القراءة وليس الحفظ.',{exact:true})).toBeVisible();
 await expect(page.locator('.register-summary')).toHaveCount(0);
 await button('أعد التحقق').click();
 await expect(page.getByText('تمت المزامنة · سجّل الخادم الحضور.',{exact:true})).toBeVisible();
 assert.deepEqual(state.dispatchBodies,[capturedWire,capturedWire,capturedWire]);
 assert.deepEqual(await counts(),{marks:18,history:18,operations:1,audit:1});
 await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(9);
 await expect(page.locator('.register-roster .attendance-status.absent')).toHaveCount(9);
 metrics.originalSync={transportAttempts:3,unauthenticatedAttempts:1,distinctOriginals:1,serverOperations:1,marks:18,history:18,audit:1,reconnectDocuments:0};
 pass('Automatic reconnect preserves the document; a lost committed reply retries byte-identical original and records exactly one canonical result');
 await page.unroute('**/api/register-dispatch',expiredThenLost);

 await page.setViewportSize({width:1440,height:1000});await prepare(b);
 state.sessionValid=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.locator('main').getByRole('alert')).toHaveText('Sign in to sync. Your saved work stays on this device.');
 await expect(page.locator('.register-roster li')).toHaveCount(18);
 state.sessionValid=true;await button('Retry current check').click();await settled();
 pass('An ordinary-route401 also preserves the prepared replica while actual authenticated role denial still masks it');
 fixture.disconnect();await context.setOffline(true);await page.locator('.register-options').first().getByRole('button',{name:'Present',exact:true}).click();
 await button('Review register').click();await button('Save selected marks').click();
 await expect(page.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
 const other=await context.newPage();await other.goto(url(b));
 await expect(other.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
 // Keep the first send held so another tab reaches the same dispatch leader.
 let releaseSend,sendEntered;const sendHold=new Promise(r=>releaseSend=r),sendSeen=new Promise(r=>sendEntered=r);
 await context.route('**/api/register-dispatch',async route=>{sendEntered();await sendHold;await route.continue();},{times:1});
 await page.route('**/api/register-download',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'}),{times:1});
 const sendCount=state.dispatchBodies.length;fixture.reconnect();await context.setOffline(false);await sendSeen;releaseSend();
 await expect(page.getByText('Save confirmed; latest register unavailable. Retry reading, not saving.',{exact:true})).toBeVisible();
 await expect(other.getByText('Saved on this device · Awaiting sync',{exact:true})).toHaveCount(0);
 assert.equal(state.dispatchBodies.length-sendCount,1);
 await button('Retry current check').click();await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(1);
 await other.close();metrics.concurrentConfirmedSends=1;
 pass('Two normal tabs share dispatch leadership; confirmed-save read failure stays confirmed and retry reads only');

 await settled();before=state.events.length;
 await page.getByLabel('Find a loaded player',{exact:true}).fill(' ');
 await page.locator('.register-person button').first().click();
 const scroll=await page.locator('.workspace-center').evaluate(el=>{el.scrollTop=240;return el.scrollTop;});
 await page.getByRole('link',{name:'العربية',exact:true}).click();await button('السجل والتصحيحات').click();
 await expect(button('تصحيح التسجيل المحفوظ')).toBeVisible();await expect(button('عرض السجل')).toBeVisible();
 const selectedName=await page.locator('.register-person button[aria-pressed=true]').innerText();
 const onlineQuery=page.getByLabel('البحث في اللاعبين المحمّلين',{exact:true});
 await onlineQuery.fill(' ');
 const onlineScroll=await page.locator('.workspace-center').evaluate(el=>{el.scrollTop=240;return el.scrollTop;});
 const rosterNode=await page.locator('.register-roster').elementHandle();assert.ok(rosterNode);
 const historyStart=state.events.length;
 let releaseHistory,historyEntered;
 const historyHold=new Promise(r=>releaseHistory=r),historySeen=new Promise(r=>historyEntered=r);
 const holdHistory=async route=>{
  if(route.request().postDataJSON().action!=='history')return route.continue();
  historyEntered();await historyHold;await route.continue();
 };
 await page.route('**/api/attendance',holdHistory);
 await button('عرض السجل').click();await historySeen;
 await expect(page.locator('.workspace-inspector').getByRole('status')).toHaveText('جارٍ تحميل السجل…');
 await expect(page.locator('.register-roster li')).toHaveCount(18);
 assert.equal(await rosterNode.evaluate(el=>el.isConnected&&el===document.querySelector('.register-roster')),true);
 await expect(onlineQuery).toHaveValue(' ');
 await expect(page.locator('.register-person button[aria-pressed=true]')).toHaveText(selectedName);
 await expect(page.locator('.workspace-inspector').getByRole('heading',{name:selectedName,exact:true})).toBeVisible();
 assert.ok(Math.abs(await page.locator('.workspace-center').evaluate(el=>el.scrollTop)-onlineScroll)<=1);
 releaseHistory();await expect(page.locator('.workspace-inspector ol li')).toHaveCount(1);
 await page.unroute('**/api/attendance',holdHistory);
 assert.equal(apiAfter(historyStart).filter(r=>r.route==='attendance'&&r.action==='history').length,1);
 assert.equal(apiAfter(historyStart).filter(r=>r.route==='attendance'&&r.action==='roster').length,0);
 pass('A held history read keeps the authorized online roster, query, player and scroll while loading and issues no roster read');

 const resumeStart=state.events.length;
 let releaseResume,resumeEntered;
 const resumeHold=new Promise(r=>releaseResume=r),resumeSeen=new Promise(r=>resumeEntered=r);
 const holdResume=async route=>{
  if(route.request().postDataJSON().action!=='roster')return route.continue();
  resumeEntered();await resumeHold;await route.continue();
 };
 await page.route('**/api/attendance',holdResume);
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'));});await resumeSeen;
 try{
  await expect(page.locator('.workspace-inspector').getByRole('status')).toHaveText('التحقق من الصلاحية والحالة المحفوظة…');
  await expect(page.locator('.register-roster li')).toHaveCount(18);
  assert.equal(await rosterNode.evaluate(el=>el.isConnected&&el===document.querySelector('.register-roster')),true);
  await expect(onlineQuery).toHaveValue(' ');await expect(page.locator('.register-person button[aria-pressed=true]')).toHaveText(selectedName);
  await expect(page.locator('.register-person button[aria-pressed=true]')).toBeDisabled();
  await expect(button('تصحيح التسجيل المحفوظ')).toBeDisabled();
  assert.ok(Math.abs(await page.locator('.workspace-center').evaluate(el=>el.scrollTop)-onlineScroll)<=1);
 }finally{releaseResume();}
 await expect(page.locator('.register-person button[aria-pressed=true]')).toBeEnabled();await page.unroute('**/api/attendance',holdResume);
 assert.equal(apiAfter(resumeStart).filter(r=>r.route==='attendance'&&r.action==='roster').length,1);
 pass('A clean canonical resume burst keeps the checked roster and context while one current signed roster read finishes');

 const authReadStart=state.events.length;state.sessionValid=false;
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.locator('main').getByRole('alert')).toContainText('سجّل الدخول مجدداً للتحقق من هذه القائمة');
 await expect(page.locator('.register-roster')).toHaveCount(0);
 state.sessionValid=true;await button('تحميل القائمة').click();await expect(page.locator('.register-roster li')).toHaveCount(18);
 assert.equal(apiAfter(authReadStart).filter(r=>r.route==='attendance'&&r.status===401).length,1);
 pass('An independently expired canonical read session masks the task without treating401asOwnerloss or retiring the prepared register');
 const localReturnStart=state.events.length;

 await button('العودة إلى الحضور').click();await expect(page.getByText('١٨ / ١٨ محمّلون من هذا الجهاز',{exact:true})).toBeVisible();
 await expect(page.getByLabel('البحث في اللاعبين المحمّلين',{exact:true})).toHaveValue(' ');
 await expect(page.locator('.register-person button').first()).toHaveAttribute('aria-pressed','true');
 assert.ok(Math.abs(await page.locator('.workspace-center').evaluate(el=>el.scrollTop)-scroll)<=1);
 await page.getByRole('link',{name:'English',exact:true}).click();await settled();
 assert.equal(state.events.slice(before,resumeStart).filter(r=>r.route==='attendance'&&r.action==='roster').length,1);
 assert.equal(apiAfter(localReturnStart).filter(r=>r.route==='attendance'&&r.action==='roster').length,0);
 assert.equal(apiAfter(localReturnStart).filter(r=>r.route==='register-key').length,0);
 pass('Saved-mark history/correction handoff uses the existing current online task and returns to the same prepared register');

 before=state.events.length;await db({action:'role',...b});await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.locator('main').getByRole('alert')).toHaveText('Access to this register changed. Check your current account and workspace. Saved work remains protected.');
 await expect(page.locator('.register-roster')).toHaveCount(0);
 assert.equal(apiAfter(before).filter(r=>r.route==='register-download').length,1);
 pass('Current Owner loss on resume masks the prepared roster and keeps the canonical refusal visible');

 const future=await db({action:'future_fixture'});await page.clock.install({time:Date.now()});await prepare(future,2);
 fixture.disconnect();await context.setOffline(true);await page.clock.fastForward(120000);
 const present=page.locator('.register-options').first().getByRole('button',{name:'Present',exact:true});await expect(present).toBeEnabled();
 await present.click();await button('Review register').click();await button('Save selected marks').click();
 await expect(page.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
 await db({action:'expire',...future});fixture.reconnect();await context.setOffline(false);
 await expect(page.getByText('Needs review · Original work retained',{exact:true})).toBeVisible();
 await expect(page.locator('.toolbar-actions [role=status]')).toContainText('Needs review');
 await expect(page.locator('.register-heading')).toContainText('Saved on this device · Needs review');
 await expect(button('Use the online register')).toHaveCount(0);
 assert.deepEqual(await db({action:'counts',...future,op:JSON.parse(state.dispatchBodies.at(-1)).op}),{marks:0,history:0,operations:0,audit:0});
 pass('A capture made while locally eligible retains its original for review when the server recording deadline expires before sync');
 pass('A retained same-session protected original cannot be bypassed through the online fallback');

 // A different provider identity must not be used to send or release an old
 // account's original. Exercise this on a still-retained original, not new work.
 const protectedId=JSON.parse(state.dispatchBodies.at(-1)).op;
 const retainedOriginal=()=>page.evaluate(async op=>{
  const request=indexedDB.open('academyos-owner-register-v1');
  const database=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  try{
   const read=database.transaction('originals').objectStore('originals').getAll();
   const rows=await new Promise((resolve,reject)=>{read.onsuccess=()=>resolve(read.result);read.onerror=()=>reject(read.error);});
   return rows.find(row=>row.op===op);
  }finally{database.close();}
 },protectedId);
 const protectedBefore=await retainedOriginal();assert.ok(protectedBefore);
 fixture.disconnect();await context.setOffline(true);await page.goto(url(a));
 await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
 state.sessionRefresh='wrong_account';const wrongBefore=state.events.length;
 fixture.reconnect();await context.setOffline(false);
 await expect(page.locator('.register-roster')).toHaveCount(0);
 await expect(page.getByText('This workspace has no prepared data on this device. Open it when connected.',{exact:true})).toBeVisible();
 assert.equal(state.events.slice(wrongBefore).filter(r=>['register-key','register-dispatch','register-download'].includes(r.route)).length,0);
 assert.deepEqual(await db({action:'counts',...future,op:JSON.parse(state.dispatchBodies.at(-1)).op}),{marks:0,history:0,operations:0,audit:0});
 assert.deepEqual(await retainedOriginal(),protectedBefore,'Account fencing must not replace or delete protected original ciphertext');
 pass('A loaded different SDK account fences the cold local task before any key release, download or original send');

 assert.deepEqual(errors,[]);assert.equal(checks.length,27);
 if(process.argv.includes('--record'))await writeFile(receipt,JSON.stringify({checks,metrics,hashes,errors,scope:'Disposable Next/Chromium/IndexedDB/current signed API/PG;fictional Clerk/provider wire;not installed or hosted proof'},null,2)+'\n');
}catch(error){if(page)console.error('Normal Attendance failed',new URL(page.url()).pathname,await page.locator('body').innerText({timeout:1200}).catch(()=>''));if(fixture)console.error('Fixture calls',fixture.state.events,'RPCs',fixture.state.rpcs);throw error;}
finally{await context?.close();await fixture?.close();await rm(temp,{recursive:true,force:true});}
