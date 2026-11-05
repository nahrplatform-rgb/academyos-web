// Actual Next attendance entry, public startup worker and account cleanup.
// Clerk session and PostgREST link are fictional. The handlers and PG are real.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';

const root=resolve(import.meta.dirname,'../..');
const evidence=join(root,'docs/07-handoff/evidence/owner-register-workspace-2026-11-04.json');
const sources=[
  'scripts/working-day/test_owner_startup.mjs','scripts/working-day/owner_fixture.mjs','scripts/working-day/owner_db.py',
  'apps/web/next.config.ts','apps/web/public/prepared-register-worker.js','apps/web/src/app/layout.tsx',
  'apps/web/src/app/[locale]/layout.tsx','apps/web/src/app/prepared-register/page.tsx',
  'apps/web/src/app/[locale]/workspace/[academy]/attendance/[event]/page.tsx',
  ...['attendance-workspace','workspace-shell','prepared-register-panel','prepared-register-startup','register-account-context','register-account-boundary']
    .map(name=>`apps/web/src/components/${name}.tsx`),
  ...['owner-register-pilot','register-device-account','register-device-slots','register-public-shell','local-register-repository','config',
    'workspace-device-slots','local-workspace-repository']
    .map(name=>`apps/web/src/lib/${name}.ts`),
  'supabase/migrations/20261104013632_owner_register_bound_transport.sql',
];
const hashes=Object.fromEntries(await Promise.all(sources.map(async file=>[file,
  createHash('sha256').update(await readFile(join(root,file))).digest('hex')])));
if(process.argv.includes('--check')){
  const receipt=JSON.parse(await readFile(evidence,'utf8'));
  assert.deepEqual(receipt.hashes,hashes);assert.equal(receipt.checks.length,8);
  console.log('PASS Owner workspace startup evidence matches sources');
  process.exit(0);
}
const temp=await mkdtemp(join(tmpdir(),'academyos-owner-startup-'));
let fixture,context,page;
const checks=[], metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
try {
  fixture=await ownerFixture(root,join(temp,'app'),{pilot:true});
  const {origin,state,data}=fixture;
  const [a,b]=data.events;
  const url=(scope,locale='en')=>`${origin}/${locale}/workspace/${scope.academy}/attendance/${scope.event}`;
  const accountKey='academyos.register-account.v1';
  const slotStem='academyos.register-slot.v1:user_owner:';
  async function browser(offline=false){
    context=await chromium.launchPersistentContext(join(temp,'profile'),{viewport:{width:1200,height:900}});
    await context.setOffline(offline);
    return context.pages()[0]??context.newPage();
  }
  function button(name,tab=page){return tab.getByRole('button',{name,exact:true});}
  async function recordMark(tab=page){
    await tab.getByRole('group').filter({has:button('Present',tab)}).first().getByRole('button',{name:'Present',exact:true}).click();
    await button('Review register',tab).click();
    await button('Save on this device',tab).click();
    await expect(tab.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
  }
  async function prepare(scope,tab=page){
    await tab.goto(url(scope));
    await button('Use a personal-device register',tab).click();
    const prepare=button('Prepare register on this device',tab);
    await expect(prepare).toBeDisabled();
    await tab.getByLabel('This is my personal device',{exact:true}).check();
    const before=state.events.length;
    await prepare.click();
    await expect(tab.getByText('18 / 18 loaded from this device',{exact:true})).toBeVisible();
    assert.deepEqual(state.events.slice(before).map(x=>x.route),['register-key','register-download','register-download','register-download']);
    await expect(tab.getByRole('link',{name:'Offline reopening link',exact:true})).toBeVisible({timeout:20000});
  }

  page=await browser();
  await page.goto(url(a));
  await expect(button('Use a personal-device register')).toBeVisible();
  const before=state.events.length;
  await button('Use a personal-device register').click();
  await button('Use the online register').click();
  await expect(page.getByRole('heading',{name:'Session attendance',exact:true})).toBeVisible();
  assert.equal(state.events.length,before);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),accountKey),null);
  assert.equal(await page.evaluate(async()=>Boolean(await navigator.serviceWorker.getRegistration('/prepared-register'))),false);
  pass('Authorized Owner can choose the online path without key, download, locator or worker preparation');

  await prepare(a);
  await recordMark();
  await prepare(b);
  const cache=await page.evaluate(async()=>{
    const keys=await caches.keys(), paths=[];
    let privateDocument=false;
    for(const key of keys){
      const cache=await caches.open(key);
      for(const request of await cache.keys()){
        const url=new URL(request.url);paths.push(url.pathname);
        if(url.pathname==='/prepared-register'){
          const html=await (await cache.match(request)).text();
          privateDocument||=/user_owner|لاعب خيالي|Synthetic second|accounts\.dev/.test(html);
        }
      }
    }
    return {paths,privateDocument};
  });
  assert.equal(cache.privateDocument,false);
  assert.ok(cache.paths.includes('/prepared-register'));
  assert.ok(cache.paths.every(path=>path==='/prepared-register'||path==='/prepared-register/cache-pointer'||path.startsWith('/_next/static/')));
  metrics.cachedPublicEntries=cache.paths.length;
  pass('Explicit personal-device choice uses four scoped requests and caches only a public shell and its static assets');

  await context.close();
  page=await browser(true);
  const recorded=state.events.length, start=performance.now();
  const response=await page.goto(origin+'/prepared-register#ar');
  assert.ok(response.fromServiceWorker());
  await expect(page.getByRole('heading',{name:'سجل الحضور المحضّر'})).toBeVisible();
  await expect(page.getByText('18 / 18 محمّلون من هذا الجهاز',{exact:true})).toBeVisible();
  assert.equal(state.events.length,recorded);
  metrics.offlineProcessReopenMs=Math.round(performance.now()-start);
  pass('Actual public worker reopens the latest prepared Arabic register after a full browser restart with zero API calls');

  const present=page.getByRole('group').filter({has:button('حاضر')}).first().getByRole('button',{name:'حاضر',exact:true});
  await present.click();
  await context.setOffline(false);
  await expect(page.getByText(/عاد الاتصال/)).toBeVisible();
  await expect(present).toHaveAttribute('aria-pressed','true');
  const online=await context.newPage();
  await online.goto(origin+'/prepared-register#ar');
  await expect(online.getByText(/افتح مساحة العمل بعد الاتصال/)).toBeVisible();
  await expect(online.getByText('18 / 18 محمّلون من هذا الجهاز',{exact:true})).toHaveCount(0);
  await button('راجع الحضور').click();
  await button('احفظ على هذا الجهاز').click();
  await expect(page.getByText('محفوظ على هذا الجهاز · بانتظار المزامنة',{exact:true})).toBeVisible();
  assert.equal(state.events.length,recorded);
  pass('Reconnect preserves unsaved choices in the open offline task, while direct online startup exposes no prepared rows');

  await online.goto(url(a));
  await expect(online.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
  await online.evaluate(()=>{
    const old=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(value,...args){
      if(this.name==='control'&&value.mode==='quarantined'){
        IDBObjectStore.prototype.put=old;this.transaction.abort();throw new Error('test_cleanup_failure');
      }
      return old.call(this,value,...args);
    };
  });
  const signOutBefore=state.events.filter(x=>x.route==='fixture-signout').length;
  await online.getByText('Account',{exact:true}).click();
  await button('Sign out',online).click();
  await expect(online.locator('main').getByRole('alert')).toHaveText('Downloads could not be cleared. Pending work remains protected.');
  await expect(page.getByText('18 / 18 محمّلون من هذا الجهاز',{exact:true})).toHaveCount(0);
  assert.equal(state.events.filter(x=>x.route==='fixture-signout').length,signOutBefore);
  assert.equal(await online.evaluate(key=>JSON.parse(localStorage.getItem(key)).mode,accountKey),'ending');

  let clean;
  await online.route('**/api/fixture-signout',async route=>{
    clean=await online.evaluate(async stem=>{
      const opening=indexedDB.open('academyos-owner-register-v1');
      const db=await new Promise((resolve,reject)=>{opening.onsuccess=()=>resolve(opening.result);opening.onerror=()=>reject(opening.error);});
      try {
        const t=db.transaction(['rows','originals','keys']), modes=Object.keys(localStorage).filter(key=>key.startsWith(stem))
          .map(key=>JSON.parse(localStorage.getItem(key)).mode);
        const counts=await Promise.all(['rows','originals','keys'].map(name=>new Promise((resolve,reject)=>{
          const request=t.objectStore(name).count();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
        })));
        return {modes,counts};
      } finally {db.close();}
    },slotStem);
    await route.continue();
  });
  await button('Retry cleanup',online).click();
  await expect(online.getByRole('heading',{name:'Fictional signed-out landing'})).toBeVisible();
  assert.deepEqual(clean,{modes:['sealed','sealed'],counts:[0,2,2]});
  assert.equal(state.events.filter(x=>x.route==='fixture-signout').length,signOutBefore+1);
  pass('Account-wide logout masks another tab, retries a failed cleanup and clears both replicas before Clerk sign-out');

  state.subject='user_other_owner';
  await online.evaluate(()=>{
    sessionStorage.removeItem('fixture-signed-out');sessionStorage.setItem('fixture-subject','user_other_owner');
  });
  const keyBefore=state.events.filter(x=>x.route==='register-key').length;
  await online.goto(url(a));
  await expect(online.getByText('Reopen the workspace to verify your current account.',{exact:true})).toBeVisible();
  assert.equal(state.events.filter(x=>x.route==='register-key').length,keyBefore);
  pass('A mismatched Clerk account and protected-route principal cannot open or recover the device register');

  state.subject='user_owner';
  await online.evaluate(()=>sessionStorage.removeItem('fixture-subject'));
  await online.goto(url(a));
  await button('Recover saved work',online).click();
  await expect(online.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
  await expect(online.getByText('18 / 18 loaded from this device',{exact:true})).toHaveCount(0);
  await online.goto(url(b));
  await button('Recover saved work',online).click();
  await expect(online.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
  await expect(online.getByText('18 / 18 loaded from this device',{exact:true})).toHaveCount(0);
  pass('Normal same-account sign-in recovers both pending originals without restoring cleared downloads');
  const future=await fixture.db({action:'future_fixture'});
  const boundary=await context.newPage();
  await boundary.clock.install({time:Date.now()});
  await boundary.goto(url(future));
  await button('Use a personal-device register',boundary).click();
  await boundary.getByLabel('This is my personal device',{exact:true}).check();
  await button('Prepare register on this device',boundary).click();
  await expect(boundary.getByRole('link',{name:'Offline reopening link',exact:true})).toBeVisible({timeout:20000});
  const localOnly=state.events.length;
  await context.setOffline(true);
  await boundary.goto(origin+'/prepared-register');
  const choice=boundary.getByRole('group').first().getByRole('button',{name:'Present',exact:true});
  await expect(choice).toBeDisabled();
  await boundary.clock.fastForward(120000);
  await expect(choice).toBeEnabled();
  await choice.click();
  await boundary.clock.fastForward(26*3600000);
  await expect(choice).toBeDisabled();
  await expect(choice).toHaveAttribute('aria-pressed','true');
  await expect(button('Review register',boundary)).toBeDisabled();
  await expect(boundary.getByText('The recording window has closed. Unsaved choices are retained.')).toBeVisible();
  assert.equal(state.events.length,localOnly);
  pass('Future-prepared offline UI opens at start and closes at deadline without network or losing unsaved choices');
  if(process.argv.includes('--record'))await writeFile(evidence,JSON.stringify({checks,metrics,hashes},null,2)+'\n');
} catch(error) {
  if(page) console.error('Fixture failed at',new URL(page.url()).pathname,await page.locator('body').innerText({timeout:1500}).catch(()=>''));
  if(fixture) console.error('Fixture calls',fixture.state.events,'RPCs',fixture.state.rpcs);
  throw error;
} finally {
  await context?.close();
  await fixture?.close();
  await rm(temp,{recursive:true,force:true});
}
