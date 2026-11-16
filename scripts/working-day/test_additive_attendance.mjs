// Real ordinary routes and worker over fictional identity/provider and disposable PG.
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {mkdir,mkdtemp,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';

const root=resolve(import.meta.dirname,'../..');
const receipt=join(root,'docs/07-handoff/evidence/ex07-additive-attendance.json');
const sources=[
 'scripts/working-day/test_additive_attendance.mjs','scripts/working-day/owner_fixture.mjs','scripts/working-day/owner_db.py',
 'scripts/register-key/bound_fixture.py','scripts/offline-register/dispatch_bridge.py',
 ...['register-download','attendance-register','experience-projections','development','qr-attendance','corrections','guardian-training','guardians','attendance','session-changes','publication','program-planning','planning','programs','trainers','people','onboarding'].map(n=>`scripts/${n}/test_boundary.py`),
 'package-lock.json','apps/web/src/app/globals.css','apps/web/src/app/[locale]/workspace/[academy]/layout.tsx',
 'apps/web/src/app/prepared-workspace/page.tsx','apps/web/src/app/prepared-register/page.tsx',
 'apps/web/src/app/[locale]/workspace/[academy]/attendance/[event]/page.tsx',
 ...['attendance-workspace','prepared-register-panel','prepared-register-session','prepared-workspace-startup','register-account-boundary','workspace-shell','workspace-panes'].map(n=>`apps/web/src/components/${n}.tsx`),
 ...['owner-register-pilot','register-device-slots','register-device-account','local-register-repository','register-original-dispatch','register-scope-transport','register-session','register-download-coordinator','register-key-server','workspace-public-shell'].map(n=>`apps/web/src/lib/${n}.ts`),
 ...['register-key','register-download','register-dispatch','attendance'].map(n=>`apps/web/src/app/api/${n}/route.ts`),
 'apps/web/public/prepared-workspace-worker.js','apps/web/public/prepared-register-worker.js'];
async function sourceHashes(){
 const sql = (await Promise.all(['supabase/migrations','supabase/tests'].map(async dir=>
  (await readdir(join(root,dir))).filter(name=>name.endsWith('.sql')).map(name=>`${dir}/${name}`)))).flat();
 return Object.fromEntries(await Promise.all([...sources,...sql.sort()].map(async path=>
  [path,createHash('sha256').update(await readFile(join(root,path))).digest('hex')])));
}
const record=process.argv.includes('--record');
const hashes=record||process.argv.includes('--check')?await sourceHashes():undefined;
if(process.argv.includes('--check')) {
 const data=JSON.parse(await readFile(receipt,'utf8'));assert.deepEqual(data.hashes,hashes);assert.equal(data.checks.length,4);
 console.log('PASS additive Attendance receipt matches sources');process.exit(0);
}
const temp=await mkdtemp(join(tmpdir(),'academyos-additive-attendance-'));
let fixture,context,page;
const checks=[];let attempts;const pass=name=>{checks.push(name);console.log('PASS '+name);};
try {
 fixture=await ownerFixture(root,join(temp,'app'),{pilot:true,multiScope:true});
 const {origin,state,data,db}=fixture,first=data.events[0],second=data.sameAcademyEvent;
 assert.equal(first.academy,second.academy);assert.notEqual(first.event,second.event);
 const url=(s,locale='en')=>`${origin}/${locale}/workspace/${s.academy}/attendance/${s.event}`;
 const button=(name,tab=page)=>tab.getByRole('button',{name,exact:true});
 async function browser(offline=false) {
  context=await chromium.launchPersistentContext(join(temp,'profile'),{viewport:{width:1200,height:900}});
  await context.setOffline(offline);page=context.pages()[0]??await context.newPage();page.setDefaultTimeout(15000);
 }
 async function prepare(scope) {
  await page.goto(url(scope));await page.locator('.register-action-menu > summary').click();
  await button('Use a personal-device register').click();await page.getByLabel('This is my personal device',{exact:true}).check();
  await button('Prepare register on this device').click();
  await expect(page.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
  await expect(page.getByText('Ready for offline reopening',{exact:true})).toBeVisible({timeout:20000});
 }
 async function save(status) {
  await expect(page.locator('.register-roster li')).toHaveCount(18);
  await page.locator('.register-options').first().getByRole('button',{name:status,exact:true}).click();
  await button('Review register').click();await button('Save selected marks').click();
  await expect(page.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
 }
 async function originals() {
  return page.evaluate(async()=>{
   const request=indexedDB.open('academyos-owner-register-v1');
   const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
   try {const r=db.transaction('originals').objectStore('originals').getAll();return await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
   finally {db.close();}
  });
 }
 await browser();await prepare(first);
 fixture.disconnect();await context.setOffline(true);await save('Present');
 const firstRow=(await originals()).find(row=>row.event===first.event);assert.ok(firstRow);
 // Refuse transport while preparing the next event, keeping the first original unresolved.
 const refused=[];
 await context.route('**/api/register-dispatch',async route=>{refused.push(route.request().postData());await route.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'});});
 fixture.reconnect();await context.setOffline(false);
 await expect.poll(()=>refused.length).toBeGreaterThan(0);
 assert.equal(JSON.parse(refused[0]).op,firstRow.op);
 await prepare(second);
 assert.ok((await originals()).some(row=>row.event===first.event&&row.op===firstRow.op));
 fixture.disconnect();await context.setOffline(true);await save('Absent');
 const rows=await originals(),a=rows.find(row=>row.event===first.event),b=rows.find(row=>row.event===second.event);
 assert.ok(a&&b);assert.notEqual(a.namespace,b.namespace);assert.notEqual(a.op,b.op);
 const zero={marks:0,history:0,operations:0,audit:0};
 assert.deepEqual(await db({action:'counts',...first,op:a.op}),zero);assert.deepEqual(await db({action:'counts',...second,op:b.op}),zero);
 pass('Preparing another event preserves the first pending original and creates an independent second original');

 await context.close();await browser(true);const before=state.events.length;
 for(const [scope,locale] of [[first,'en'],[second,'ar']]) {
  const response=await page.goto(url(scope,locale));assert.ok(response?.fromServiceWorker());
  assert.equal(new URL(page.url()).pathname,new URL(url(scope,locale)).pathname);
  await expect(page.getByRole('heading',{name:locale==='en'?'Session attendance':'حضور التدريب',exact:true})).toBeVisible();
  await expect(page.getByText(locale==='en'?'18 / 18 loaded from this device':'١٨ / ١٨ محمّلون من هذا الجهاز',{exact:true})).toBeVisible();
  await expect(page.locator('.register-roster li')).toHaveCount(18);
  await expect(page.getByText('لاعب خيالي للاختبار في الأكاديمية 1',{exact:true})).toBeVisible();
 }
 assert.equal(state.events.length,before);
 const reopened=await originals();assert.deepEqual(reopened.find(row=>row.op===a.op),a);assert.deepEqual(reopened.find(row=>row.op===b.op),b);
 pass('Both exact normal URLs reopen from the worker offline with the same protected originals and roster');

 // Open both scopes before reconnect so each real mounted sender can resume.
 const one=await context.newPage();const response=await one.goto(url(first));assert.ok(response?.fromServiceWorker());
 await expect(one.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
 const sent=[];
 await context.route('**/api/register-dispatch',async route=>{sent.push(route.request().postData());await route.continue();});
 fixture.reconnect();await context.setOffline(false);
 const once={marks:1,history:1,operations:1,audit:1};
 await expect.poll(()=>db({action:'counts',...first,op:a.op}),{timeout:30000}).toEqual(once);
 await expect.poll(()=>db({action:'counts',...second,op:b.op}),{timeout:30000}).toEqual(once);
 const firstSent=sent.filter(wire=>JSON.parse(wire).op===a.op),secondSent=sent.filter(wire=>JSON.parse(wire).op===b.op);
 assert.ok(firstSent.length&&secondSent.length);assert.ok(firstSent.every(wire=>wire===refused[0]));
 assert.ok(secondSent.every(wire=>wire===secondSent[0]));
 await expect(one.locator('.register-roster .attendance-status.present')).toHaveCount(1);
 await expect(page.locator('.register-roster .attendance-status.absent')).toHaveCount(1);
 attempts={refusedFirst:refused.length,first:firstSent.length,second:secondSent.length};
 pass('Reconnect sends the original operation IDs with byte-identical retries and exactly one committed effect per event');

 await one.reload();await page.reload();
 await expect(one.getByRole('heading',{name:'Session attendance',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'حضور التدريب',exact:true})).toBeVisible();
 await expect(one.locator('.register-roster .attendance-status.present')).toHaveCount(1);
 await expect(page.locator('.register-roster .attendance-status.absent')).toHaveCount(1);
 assert.deepEqual(await db({action:'counts',...first,op:a.op}),once);assert.deepEqual(await db({action:'counts',...second,op:b.op}),once);
 pass('English and Arabic ordinary routes reopen their own saved marks without duplicate server effects');
 assert.equal(checks.length,4);
 const evidence={status:'passed',completed:new Date().toISOString(),checks,attempts,committedPerEvent:once,scope:'Disposable Next/Chromium/IndexedDB and signed API/PG; fictional identity/provider; not hosted or installed-device proof'};
 if(process.env.UI_EVIDENCE_DIR){await mkdir(process.env.UI_EVIDENCE_DIR,{recursive:true});await writeFile(join(process.env.UI_EVIDENCE_DIR,'receipt.json'),JSON.stringify(evidence,null,2)+'\n');}
 if(record)await writeFile(receipt,JSON.stringify({...evidence,hashes},null,2)+'\n');
} catch(error) {
 if(process.env.UI_EVIDENCE_DIR&&page){await mkdir(process.env.UI_EVIDENCE_DIR,{recursive:true});await page.screenshot({path:join(process.env.UI_EVIDENCE_DIR,'failure.png')}).catch(()=>{});}
 throw error;
} finally {await context?.close();await fixture?.close();await rm(temp,{recursive:true,force:true});}
