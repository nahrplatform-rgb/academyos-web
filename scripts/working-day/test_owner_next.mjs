// Run the fictional working day in a disposable Next, Chromium and PG17 stack.
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium, expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const evidence = join(root, 'docs/07-handoff/evidence/owner-working-day-next-2026-11-04.json');
const sources = [
  'scripts/working-day/owner_fixture.mjs', 'scripts/working-day/owner-register.tsx',
  'scripts/working-day/owner_db.py', 'scripts/working-day/test_owner_next.mjs',
  'scripts/experience-projections/test_boundary.py', 'scripts/offline-register/dispatch_bridge.py',
  ...['experience','planning','register-download','register-dispatch'].map(name => `apps/web/src/app/api/${name}/route.ts`),
  ...['workspace-runtime','workspace-shell','experience-workspace','date-planning-workspace'].map(name => `apps/web/src/components/${name}.tsx`),
  ...['workspace-read-owner','local-register-repository','local-register-crypto','local-register-codec',
    'register-download','register-download-coordinator','register-original-dispatch','onboarding-gateway','register-scope-transport'].map(name => `apps/web/src/lib/${name}.ts`),
  'apps/web/src/app/globals.css',
  'supabase/migrations/20261103165604_owner_register_download_contract.sql',
  'supabase/migrations/20261104002448_owner_register_original_dispatch.sql',
  'supabase/migrations/20261104013632_owner_register_bound_transport.sql', 'scripts/register-key/bound_fixture.py',
];
const hashes = Object.fromEntries(await Promise.all(sources.map(async path =>
  [path, createHash('sha256').update(await readFile(join(root, path))).digest('hex')])));
if (process.argv.includes('--check')) {
  const receipt = JSON.parse(await readFile(evidence, 'utf8'));
  assert.deepEqual(receipt.hashes, hashes);
  assert.equal(receipt.checks.length, 8);
  console.log('PASS working-day evidence matches tracked sources');
  process.exit(0);
}

const temp = await mkdtemp(join(tmpdir(), 'academyos-working-day-'));
const checks = [], metrics = {};
const pass = name => {checks.push(name);console.log('PASS '+name);};
let fixture, browser, page;
try {
  fixture = await ownerFixture(root, join(temp, 'app'));
  const {origin, data, state, db, paths, registerPaths} = fixture;
  const [first, second] = data.events;
  const base = `/en/workspace/${data.academy}`, firstPath = registerPaths[0], secondPath = registerPaths[3];
  const counts = (event, op = randomUUID()) => db({action:'counts', academy:data.events.find(item=>item.event===event).academy, event, op});
  const noWrites = {marks:0,history:0,operations:0,audit:0};
  const errors = [], external = [];
  const now = () => performance.now();
  const measure = (key, start) => {metrics[key] = Math.round(now()-start);};
  const button = name => page.getByRole('button',{name,exact:true});
  const link = name => page.getByRole('link',{name,exact:true});
  const slice = start => state.events.slice(start).map(({route,action,status}) => [route,action,status]);
  const download = [['register-download','manifest',200],['register-download','page',200],['register-download','complete',200]];
  async function openBrowser(offline = false, width = 1440) {
    browser = await chromium.launchPersistentContext(join(temp,'profile'), {viewport:{width,height:900}, locale:'en-GB'});
    await browser.setOffline(offline);
    page = browser.pages()[0] ?? await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {if(/^https?:/.test(request.url())&&!request.url().startsWith(origin+'/')) external.push(new URL(request.url()).origin);});
  }
  await openBrowser();
  metrics.profile = {node:process.version, os:process.platform, architecture:process.arch,
    browser:browser.browser()?.version() ?? await page.evaluate(()=>navigator.userAgent),
    desktopWidth:1440, arabicWidth:390, network:'unthrottled loopback', samples:1};
  metrics.fixtures = {dates:data.dates, registers:data.events.length, roster:data.players};
  assert.equal(data.dates,40);
  assert.equal(data.players,18);
  const documents = [];
  page.on('request', r => {if (r.isNavigationRequest() && r.frame() === page.mainFrame()) documents.push(r.url());});
  let start = now();
  await page.goto(origin+base+'/home');
  await expect(page.getByRole('heading',{name:'Today at your academy'})).toBeVisible();
  await expect(page.locator('.experience-session').filter({hasText:'Published'}).first()).toBeVisible();
  await expect(link('Open calendar')).toBeVisible();
  await expect.poll(() => state.events.some(e=>e.route==='experience'&&e.status===200)).toBe(true);
  measure('homeMs',start);
  start=now();
  const calendarHref = await link('Open calendar').getAttribute('href');
  await link('Open calendar').click();
  await page.waitForURL(origin+calendarHref);
  const published = page.locator(`[data-occurrence="${data.program}:${first.day}"]`).filter({hasText:'Published'});
  await expect(published).toBeVisible({timeout:10000});
  const period = await page.getByLabel('First visible date',{exact:true}).inputValue();
  measure('calendarMs',start);
  start=now();
  await published.click();
  await link('Open this date').click();
  await page.waitForURL('**/programs/**');
  await expect(link('Open attendance')).toHaveAttribute('href',firstPath);
  measure('dateMs',start);
  await button('Back to calendar').click();
  await page.waitForURL(url=>url.pathname===base+'/calendar');
  await expect(published).toHaveAttribute('aria-pressed','true');
  await expect(page.getByLabel('First visible date',{exact:true})).toHaveValue(period);
  await link('Open this date').click();
  await expect(link('Open attendance')).toHaveAttribute('href',firstPath);
  const beforeEntry=state.events.length;
  await link('Open attendance').click();
  await expect(button('Prepare register on this device')).toBeEnabled();
  assert.equal(state.events.length,beforeEntry);
  assert.equal(documents.length,1);
  metrics.onlineEntry = slice(0);
  assert.deepEqual(metrics.onlineEntry,[
    ['experience','owner_home',200],['experience','owner_calendar',200],['planning','read',200],
    ['experience','owner_calendar',200],['planning','read',200],
  ]);
  pass('Actual Owner Home, Calendar and dated planning reach the fixture register in one document');

  let before=state.events.length;
  start=now();
  await button('Prepare register on this device').click();
  await expect(page.getByText('18 / 18 players prepared · 0 recorded at last check')).toBeVisible();
  measure('firstPrepareMs',start);
  assert.deepEqual(slice(before),[['fixture-key',null,200],...download]);
  before=state.events.length;
  await button('Check download').click();
  await expect(page.getByText('Download is current')).toBeVisible();
  assert.deepEqual(slice(before),[download[0]]);
  pass('First prepare completes all 18 rows; unchanged check only reads the manifest');

  const cached = await page.evaluate(async () => {
    await navigator.serviceWorker.register('/owner-fixture-sw.js');
    const registration=await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
    }
    const keys=await caches.keys();
    const cache=await caches.open(keys[0]);
    const requests=await cache.keys();
    const html=await (await cache.match(location.pathname)).text();
    return {paths:requests.map(r=>new URL(r.url).pathname).sort(), hasRoster:html.includes('لاعب خيالي'), scope:registration.scope};
  });
  assert.deepEqual(cached.paths,[...paths].sort());
  assert.equal(cached.scope,origin+'/');
  assert.equal(cached.hasRoster,false);
  before=state.events.length;
  await browser.setOffline(true);
  await expect.poll(()=>page.evaluate(()=>navigator.onLine)).toBe(false);
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.getByText('18 / 18 players prepared · 0 recorded at last check')).toBeVisible();
  const rows=page.getByRole('group').filter({has:button('Present')});
  await expect(rows).toHaveCount(18);
  start=now();
  for(let i=0;i<18;i++) await rows.nth(i).getByRole('button',{name:i%2?'Absent':'Present',exact:true}).click();
  page.once('dialog', dialog => dialog.dismiss());
  await link('Back to calendar').click();
  assert.equal(page.url(),origin+firstPath);
  await expect(page.locator('.register-options [aria-pressed=true]')).toHaveCount(18);
  await button('Review register').click();
  await expect(page.getByRole('dialog').locator('li')).toHaveCount(18);
  await page.keyboard.press('Escape');
  await expect(button('Review register')).toBeFocused();
  await button('Review register').click();
  await button('Save on this device').click();
  await expect(page.getByText('Saved on this device · Awaiting sync')).toBeVisible();
  measure('selectReviewSaveMs',start);
  assert.equal(state.events.length,before);
  assert.deepEqual(await counts(first.event),noWrites);
  metrics.offlinePostRequests = 0;
  pass('Offline reopen and atomic 18-mark local save make zero requests and zero server writes');

  await browser.close();
  start=now();
  await openBrowser(true);
  const reopened=await page.goto(origin+firstPath);
  assert.ok(reopened.fromServiceWorker());
  await expect(page.getByText('18 selected marks retained')).toBeVisible();
  measure('offlineRestartMs',start);
  assert.equal(state.events.length,before);
  pass('Full Chromium restart reopens the fixture shell and encrypted original offline');

  let committedStatus;
  const drop = async route => {
    committedStatus = (await route.fetch({maxRetries:0})).status();
    await route.abort('failed');
  };
  await page.route('**/api/register-dispatch',drop,{times:1});
  await browser.setOffline(false);
  await expect(page.getByText('Outcome not yet known')).toBeVisible({timeout:25000});
  assert.equal(committedStatus,200);
  assert.equal(state.dispatchBodies.length,1);
  const original=JSON.parse(state.dispatchBodies[0]);
  const written={marks:18,history:18,operations:1,audit:1};
  assert.deepEqual(await counts(first.event,original.op),written);
  start=now();
  await button('Sync original').click();
  await expect(page.getByText('Server recorded the register')).toBeVisible();
  measure('originalReplayMs',start);
  assert.deepEqual(state.dispatchBodies,[state.dispatchBodies[0],state.dispatchBodies[0]]);
  assert.deepEqual(await counts(first.event,original.op),written);
  assert.deepEqual(slice(before),[['register-dispatch','register',200],['register-dispatch','register',200]]);
  metrics.replay = {exactWire:true, ...written};
  pass('Reconnect lost reply retains the unknown original; exact retry leaves one 18-mark commit');

  before=state.events.length;
  await expect(page.getByText('Check download to refresh server marks.')).toBeVisible();
  await button('Check download').click();
  await expect(page.getByText('18 / 18 players prepared · 18 recorded at last check')).toBeVisible();
  assert.deepEqual(slice(before),download);
  pass('Confirmed save invalidates only its prepared register; bounded refresh shows confirmed marks');

  await page.setViewportSize({width:390,height:844});
  await page.goto(origin+secondPath);
  before=state.events.length;
  await button('حضّر السجل على هذا الجهاز').click();
  const arabic = page.getByRole('group').filter({has:button('حاضر')});
  await expect(arabic).toHaveCount(18);
  await expect(page.locator('.attendance-theme')).toHaveAttribute('dir','rtl');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
  assert.deepEqual(slice(before),[['fixture-key',null,200],...download]);
  await browser.setOffline(true);
  await arabic.first().getByRole('button',{name:'حاضر',exact:true}).click();
  await button('مراجعة الحضور').click();
  await button('حفظ على هذا الجهاز').click();
  await expect(page.getByText('محفوظ على هذا الجهاز · بانتظار المزامنة')).toBeVisible();
  assert.ok(await db({action:'expire', academy:second.academy,event:second.event}));
  await browser.setOffline(false);
  await expect(page.getByText('تحتاج مراجعة',{exact:true})).toBeVisible();
  assert.deepEqual(await counts(second.event,JSON.parse(state.dispatchBodies[2]).op),noWrites);
  pass('Arabic phone-width flow retains deadline refusal without writing attendance');

  await button('تسجيل الخروج ومسح التنزيلات').click();
  await expect(page.getByText('أزيلت التنزيلات. العمل المحفوظ محمي.')).toBeVisible();
  await expect(page.getByRole('region',{name:'السجل المنزّل'})).toHaveCount(0);
  await page.reload();
  await expect(button('استعادة العمل المحفوظ')).toBeEnabled();
  state.subject='user_other_owner';
  await button('استعادة العمل المحفوظ').click();
  await expect(page.locator('main').getByRole('alert')).toHaveText('الحساب الأصلي مطلوب');
  await expect(page.getByRole('region',{name:'العمل المحفوظ'})).toHaveCount(0);
  state.subject='user_owner';
  await button('استعادة العمل المحفوظ').click();
  await expect(page.getByText('1 علامات مختارة محفوظة')).toBeVisible();
  await expect(page.getByText('تحتاج مراجعة',{exact:true})).toBeVisible();
  await expect(page.getByRole('region',{name:'السجل المنزّل'})).toHaveCount(0);
  assert.equal(state.dispatchBodies.length,3);
  assert.deepEqual(external,[]);
  assert.deepEqual(errors,[]);
  pass('Logout removes prepared rows; only the original fictional account recovers pending work');

  metrics.postRequests = state.events;
  metrics.rpcCount = state.rpcs.length;
  metrics.logicalRateChecks = state.limits.length;
  metrics.cacheEntries = cached.paths.length;
  metrics.requestBytes = state.events.reduce((total,event)=>total+event.requestBytes,0);
  metrics.responseBytes = state.events.reduce((total,event)=>total+event.responseBytes,0);
  const receipt = {checks, metrics, hashes};
  if (process.argv.includes('--record')) await writeFile(evidence,JSON.stringify(receipt,null,2)+'\n');
  console.log(JSON.stringify(metrics,null,2));
} catch(error) {
  if (page) console.error('Fixture browser failure at',new URL(page.url()).pathname, await page.locator('main').innerText({timeout:1000}).catch(()=>''));
  if (fixture) console.error('Observed requests',fixture.state.events, 'RPCs',fixture.state.rpcs);
  throw error;
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp,{recursive:true,force:true});
}
