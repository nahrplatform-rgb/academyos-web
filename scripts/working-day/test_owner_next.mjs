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
  'apps/web/src/lib/experience-format.ts', 'apps/web/src/lib/owner-session-navigation.ts',
  'scripts/working-day/owner_fixture.mjs', 'scripts/working-day/owner-register.tsx',
  'scripts/working-day/owner_db.py', 'scripts/working-day/test_owner_next.mjs',
  'scripts/experience-projections/test_boundary.py', 'scripts/offline-register/dispatch_bridge.py',
  ...['experience','planning','register-download','register-dispatch'].map(name => `apps/web/src/app/api/${name}/route.ts`),
  ...['workspace-runtime','workspace-shell','experience-workspace','date-planning-workspace'].map(name => `apps/web/src/components/${name}.tsx`),
  'apps/web/src/app/api/programs/route.ts', 'apps/web/src/components/program-workspace.tsx',
  'apps/web/src/app/api/onboarding/route.ts', 'apps/web/src/components/onboarding-workspace.tsx',
  'apps/web/src/app/[locale]/workspace/page.tsx',
  'supabase/migrations/20261027004132_i3b_draft_session_planning.sql',
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
  assert.equal(receipt.checks.length, 19);
  assert.equal(receipt.metrics.secondaryPanelUnavailable,true);
  assert.deepEqual(receipt.metrics.datedPlanStorage,['QuotaExceededError','SecurityError','malformed']);
  assert.deepEqual(receipt.metrics.ownerAccess,[401,200,403,200]);
  assert.deepEqual(receipt.metrics.datedPlanReadFailure,{
    initialStatus:503, capacity:19, version:1, operations:1, audits:1,
  });
  assert.deepEqual(receipt.metrics.datedPlan, {capacity:23, operations:1, audits:1});
  assert.deepEqual(receipt.metrics.datedPlanRecovery, [
    {outcome:'precommit',originalMatched:true,operations:1,saveAudits:0,capacity:'23'},
    {outcome:'lost_reply',originalMatched:true,operations:1,saveAudits:1,capacity:'24'},
  ]);
  assert.deepEqual(receipt.metrics.datedPlanDraft, {
    refreshReads:1, retainedCapacity:'25', reopenedCapacity:'24', operations:0, saveAudits:0,
  });
  assert.deepEqual(receipt.metrics.datedPlanConflict, {
    staleVersion:2, currentVersion:3, currentCapacity:26, draftCapacity:25, operations:1, saveAudits:1,
  });
  assert.deepEqual(receipt.metrics.datedPlanSecondTab, {
    priorCapacity:26, currentCapacity:27, currentVersion:4, refreshReads:1, operations:1, saveAudits:1,
  });
  assert.deepEqual(receipt.metrics.academySwitch, {
    oldResponse:200, newResponse:200, documentNavigations:0, oldSessionRendered:false,
  });
  console.log('PASS working-day evidence matches tracked sources');
  process.exit(0);
}

const temp = await mkdtemp(join(tmpdir(), 'academyos-working-day-'));
const checks = [], metrics = {};
const pass = name => {checks.push(name);console.log('PASS '+name);};
let fixture, browser, page;
try {
  fixture = await ownerFixture(root, join(temp, 'app'), {datedPlan:true});
  const {origin, data, state, db, paths, registerPaths} = fixture;
  const [first, second] = data.events;
  const base = `/en/workspace/${data.academy}`, firstPath = registerPaths[0], secondPath = registerPaths[3];
  const linkedPath = `${firstPath}#from=${first.day}&return=calendar`;
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
  await expect(page.getByRole('heading',{name:'Academy operations',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Today’s sessions',exact:true})).toBeVisible();
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
  const period = await page.getByLabel('Go to date',{exact:true}).inputValue();
  measure('calendarMs',start);
  start=now();
  await published.click();
  await link('Open this date').click();
  await page.waitForURL('**/programs/**');
  await expect(link('Open attendance')).toHaveAttribute('href',linkedPath);
  measure('dateMs',start);
  await button('Back to calendar').click();
  await page.waitForURL(url=>url.pathname===base+'/calendar');
  await expect(published).toHaveAttribute('aria-pressed','true');
  await expect(page.getByLabel('Go to date',{exact:true})).toHaveValue(period);
  await link('Open this date').click();
  await expect(link('Open attendance')).toHaveAttribute('href',linkedPath);
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
  assert.equal(page.url(),origin+linkedPath);
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
  const draft = await db({action:'dated_plan_fixture',academy:data.academy});
  const draftSession = page.locator(`[data-occurrence="${draft.program}:${draft.day}"]`);
  const programPath = `${base}/programs/${draft.program}`;
  const planCounts = () => db({action:'dated_plan_counts',academy:data.academy});
  const baseline = await planCounts();
  const requestStart = state.events.length;
  await page.setViewportSize({width:1440,height:900});
  await page.goto(origin+base+'/home');
  await draftSession.click();
  await expect(page.getByText('0 / —',{exact:true})).toBeVisible();
  await link('Open this date').click();
  await button('Plan this date').click();
  await page.getByLabel('Capacity for this date',{exact:true}).fill('23');
  await button('Review changes').click();
  await page.getByRole('checkbox',{name:'I reviewed this date and these changes.',exact:true}).check();
  const receiptPromise = page.waitForResponse(response =>
    new URL(response.url()).pathname==='/api/planning' &&
    response.request().postDataJSON()?.action==='save');
  await button('Save draft plan').press('Enter');
  const response = await receiptPromise;
  assert.equal(response.status(),200);
  const {data: savedPlan} = await response.json();
  assert.deepEqual([savedPlan.program,savedPlan.day,savedPlan.version],[draft.program,draft.day,1]);
  await expect(page.getByRole('status').filter({hasText:'Draft plan saved.'})).toBeVisible();
  await expect(button('Plan this date')).toBeEnabled();
  await button('Back to academy home').click();
  await expect(draftSession).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('0 / 23',{exact:true})).toBeVisible();
  await link('Open calendar').and(page.locator('.operations-calendar-link')).click();
  await draftSession.click();
  await expect(page.getByText('0 / 23',{exact:true})).toBeVisible();
  await page.goto(origin+programPath);
  await link('Inspect this date').click();
  await button('Plan this date').click();
  await expect(page.getByLabel('Capacity for this date',{exact:true})).toHaveValue('23');
  const writes = slice(requestStart).filter(([route,action])=>route==='planning'&&action==='save');
  assert.deepEqual(writes,[['planning','save',200]]);
  const after = await planCounts();
  metrics.datedPlan = {capacity:23, operations:after.operations-baseline.operations, audits:after.audits-baseline.audits};
  assert.deepEqual(metrics.datedPlan,{capacity:23, operations:1, audits:1});
  pass('WD-09 saves one private dated plan and reopens it from Today, Calendar and Program');

  metrics.datedPlanRecovery = [];
  const pathsToPlan = new URL(page.url()).pathname;
  const storageKey = `academyos:planning:user_owner:${data.academy}:${draft.program}:${draft.day}`;
  const pendingPlan = () => page.evaluate(key=>sessionStorage.getItem(key),storageKey);
  for (const outcome of ['precommit','lost_reply']) {
    const commit = outcome==='lost_reply';
    const beforeFault = await planCounts();
    const firstRequest = state.events.length;
    const planCalls = [];
    let serverReceipt;
    const interceptPlan = async route => {
      const body = route.request().postDataJSON();
      planCalls.push(body);
      if (body.action!=='save') return route.continue();
      if (commit) {
        const upstream = await route.fetch({maxRetries:0});
        serverReceipt = {status:upstream.status(), ...await upstream.json()};
      }
      await route.abort('connectionreset');
    };
    await page.route('**/api/planning',interceptPlan);
    try {
      await page.getByLabel('Capacity for this date',{exact:true}).fill('24');
      await button('Review changes').click();
      await page.getByRole('checkbox',{name:'I reviewed this date and these changes.',exact:true}).check();
      await button('Save draft plan').press('Enter');
      await expect(button('Check original operation')).toBeEnabled();
      await expect(page.getByText('Draft plan saved. It remains private to the Owner.',{exact:true})).toHaveCount(0);
      await expect(button('Save draft plan')).toHaveCount(0);
      const original = planCalls.find(call=>call.action==='save').op;
      assert.match(original,/^[0-9a-f-]{36}$/);
      assert.equal(await pendingPlan(),original);
      if (commit) {
        assert.equal(serverReceipt.status,200);
        assert.deepEqual([serverReceipt.data.program,serverReceipt.data.day,serverReceipt.data.version],
          [draft.program,draft.day,2]);
      }
      const immediately = await planCounts();
      const committed = Number(commit);
      assert.equal(immediately.operations-beforeFault.operations,committed);
      assert.equal(immediately.audits-beforeFault.audits,committed);

      await page.reload();
      await expect(button('Check original operation')).toBeEnabled();
      assert.equal(new URL(page.url()).pathname,pathsToPlan);
      assert.equal(await pendingPlan(),original);
      assert.deepEqual(planCalls.map(call=>call.action),['review','save']);
      const reconciliation = page.waitForResponse(reply=>
        new URL(reply.url()).pathname==='/api/planning' &&
        reply.request().postDataJSON()?.action==='reconcile');
      await button('Check original operation').click();
      const reply = await reconciliation;
      assert.equal(reply.status(),200);
      const {data: resolved} = await reply.json();
      assert.deepEqual(resolved,commit?serverReceipt.data:{cancelled:true});
      assert.equal(planCalls.find(call=>call.action==='reconcile').op,original);
      await expect(button('Plan this date')).toBeEnabled();
      assert.equal(await pendingPlan(),null);
      await expect(page.getByRole('status').filter({hasText:commit?'Draft plan saved.':'The original operation did not commit'})).toBeVisible();
      await button('Plan this date').click();
      const capacity = commit?'24':'23';
      await expect(page.getByLabel('Capacity for this date',{exact:true})).toHaveValue(capacity);
      assert.deepEqual(planCalls.filter(call=>call.action!=='dates').map(call=>call.action),
        ['review','save','reconcile','read']);
      const final = await planCounts();
      const operations = final.operations-beforeFault.operations;
      const saveAudits = final.audits-beforeFault.audits;
      assert.equal(operations,1);
      assert.equal(saveAudits,committed);
      assert.equal(slice(firstRequest).filter(([route,action])=>route==='planning'&&action==='save').length,committed);
      metrics.datedPlanRecovery.push({outcome,originalMatched:true,operations,saveAudits,capacity});
      pass(commit?'WD-12 reconciles the committed dated plan after its reply is lost':
        'WD-11 cancels the original dated plan after a precommit failure');
    } finally {
      await page.unroute('**/api/planning',interceptPlan);
    }
  }
  const beforeDraft = await planCounts();
  await page.goto(origin+base+'/calendar?anchor='+draft.day);
  await draftSession.click();
  await link('Open this date').click();
  await button('Plan this date').click();
  const capacityInput = page.getByLabel('Capacity for this date',{exact:true});
  await capacityInput.fill('25');
  await button('Review changes').click();
  await page.getByRole('checkbox',{name:'I reviewed this date and these changes.',exact:true}).check();
  await expect(button('Save draft plan')).toBeEnabled();
  const beforeResume = state.events.length;
  await page.evaluate(()=>{
    let visibility = 'hidden';
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>visibility});
    window.dispatchEvent(new Event('blur'));
    document.dispatchEvent(new Event('visibilitychange'));
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    delete document.visibilityState;
  });
  await expect(capacityInput).toBeEnabled();
  await expect(capacityInput).toHaveValue('25');
  await expect(page.getByText('Your choices are retained. Compare current state and review again.',{exact:true})).toBeVisible();
  await expect(button('Save draft plan')).toHaveCount(0);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  assert.deepEqual(slice(beforeResume),[['planning','read',200]]);
  assert.equal(await pendingPlan(),null);

  const datedUrl = page.url();
  async function leaveDraft(accept) {
    const decision = page.waitForEvent('dialog').then(async dialog=>{
      if (accept) await dialog.accept();
      else await dialog.dismiss();
      return {type:dialog.type(), message:dialog.message()};
    });
    await button('Back to calendar').press('Enter');
    assert.deepEqual(await decision,{type:'confirm',message:'Leave these unsaved changes?'});
  }
  await leaveDraft(false);
  assert.equal(page.url(),datedUrl);
  await expect(capacityInput).toHaveValue('25');
  assert.deepEqual(slice(beforeResume),[['planning','read',200]]);
  await leaveDraft(true);
  await expect(draftSession).toHaveAttribute('aria-pressed','true');
  await expect(page.getByText('0 / 24',{exact:true})).toBeVisible();
  await link('Open this date').click();
  await button('Plan this date').click();
  await expect(capacityInput).toHaveValue('24');
  assert.deepEqual(slice(beforeResume),[
    ['planning','read',200],['experience','owner_calendar',200],['planning','read',200],
  ]);
  assert.equal(await pendingPlan(),null);
  const afterDraft = await planCounts();
  metrics.datedPlanDraft = {
    refreshReads:1, retainedCapacity:'25', reopenedCapacity:'24',
    operations:afterDraft.operations-beforeDraft.operations, saveAudits:afterDraft.audits-beforeDraft.audits,
  };
  assert.equal(metrics.datedPlanDraft.operations,0);
  assert.equal(metrics.datedPlanDraft.saveAudits,0);
  pass('WD-14 retains dated draft choices during refresh and honors both keyboard leave decisions');

  const beforeConflict = await planCounts();
  await capacityInput.fill('25');
  await button('Review changes').click();
  const reviewAcknowledgement = page.getByRole('checkbox',{name:'I reviewed this date and these changes.',exact:true});
  await reviewAcknowledgement.check();
  const savePlanButton = button('Save draft plan');
  await expect(savePlanButton).toBeEnabled();
  const ownerChange = subject => db({action:'dated_plan_owner',academy:data.academy,subject});
  const planAPI = body => page.request.post(origin+'/api/planning', {
    headers:{Origin:origin}, data:{academy:data.academy,program:draft.program,day:draft.day,...body},
  });
  assert.equal(await ownerChange('user_other_owner'),'user_other_owner');
  try {
    assert.equal((await planAPI({action:'read'})).status(),403);
    state.subject = 'user_other_owner';
    const current = await planAPI({action:'read'});
    assert.equal(current.status(),200);
    const {data: competingPlan} = await current.json();
    assert.equal(competingPlan.version,2);
    const competing = await planAPI({
      action:'save',version:competingPlan.version,schedule_version:competingPlan.schedule_version,
      capacity:26,trainer:null,add:[],remove:[],op:randomUUID(),
    });
    assert.equal(competing.status(),200);
    const {data: committed} = await competing.json();
    assert.deepEqual([committed.program,committed.day,committed.version],[draft.program,draft.day,3]);
  } finally {
    assert.equal(await ownerChange('user_owner'),'user_owner');
    state.subject = 'user_owner';
  }
  const staleReply = page.waitForResponse(reply=>
    new URL(reply.url()).pathname==='/api/planning' &&
    reply.request().postDataJSON()?.action==='save');
  await savePlanButton.press('Enter');
  const stale = await staleReply;
  assert.equal(stale.request().postDataJSON().version,2);
  assert.deepEqual((await stale.json()).data,{error:'stale'});
  await expect(page.getByRole('alert').filter({hasText:'The date plan changed.'})).toBeVisible();
  await expect(capacityInput).toHaveValue('25');
  await expect(savePlanButton).toHaveCount(0);
  assert.equal(await pendingPlan(),null);
  await button('Compare current plan').click();
  await expect(capacityInput).toHaveValue('25');
  await button('Review changes').click();
  await expect(page.getByText('Current capacity: 26',{exact:true})).toBeVisible();
  await expect(page.getByText('New capacity: 25',{exact:true})).toBeVisible();
  await expect(reviewAcknowledgement).not.toBeChecked();
  await expect(savePlanButton).toBeDisabled();
  const afterConflict = await planCounts();
  metrics.datedPlanConflict = {
    staleVersion:2, currentVersion:3, currentCapacity:26, draftCapacity:25,
    operations:afterConflict.operations-beforeConflict.operations,
    saveAudits:afterConflict.audits-beforeConflict.audits,
  };
  assert.equal(metrics.datedPlanConflict.operations,1);
  assert.equal(metrics.datedPlanConflict.saveAudits,1);
  pass('WD-15 refuses the first Owner stale save and compares the second Owner committed plan');

  const observer = await browser.newPage();
  let releaseRefresh;
  const refreshGate = new Promise(resolve=>{releaseRefresh=resolve;});
  try {
    const observerCalls = [];
    let holdRefresh = false;
    await observer.addInitScript(()=>{
      let visibility = 'hidden';
      Object.defineProperty(document,'visibilityState',{get:()=>visibility});
      window.addEventListener('fixture-visible-return',()=>{
        visibility='visible';
        document.dispatchEvent(new Event('visibilitychange'));
      });
    });
    await observer.route('**/api/planning',async route=>{
      observerCalls.push(route.request().postDataJSON());
      if (holdRefresh) await refreshGate;
      await route.continue();
    });
    observer.on('pageerror', error=>errors.push(error.message));
    await observer.goto(datedUrl);
    const visibleCapacity = observer.locator('dt').filter({hasText:/^Capacity$/}).locator('+ dd');
    await expect(visibleCapacity).toHaveText('26');
    assert.deepEqual(observerCalls.map(call=>call.action),['read']);

    const beforeSecondTab = await planCounts();
    const latestCommit = page.waitForResponse(reply=>
      new URL(reply.url()).pathname==='/api/planning' &&
      reply.request().postDataJSON()?.action==='save');
    await button('Edit choices').click();
    await capacityInput.fill('27');
    await button('Review changes').click();
    await reviewAcknowledgement.check();
    await savePlanButton.press('Enter');
    const reply = await latestCommit;
    assert.equal(reply.status(),200);
    const {data: committed} = await reply.json();
    assert.deepEqual([committed.program,committed.day,committed.version],[draft.program,draft.day,4]);
    await expect(button('Plan this date')).toBeEnabled();
    await expect(visibleCapacity).toHaveText('26');
    assert.equal(observerCalls.length,1);

    holdRefresh = true;
    const beforeObserverRead = state.events.length;
    const refreshed = observer.waitForResponse(response=>
      new URL(response.url()).pathname==='/api/planning' &&
      response.request().postDataJSON()?.action==='read');
    await observer.evaluate(()=>window.dispatchEvent(new Event('fixture-visible-return')));
    await expect.poll(()=>observerCalls.length).toBe(2);
    assert.deepEqual(observerCalls[1],observerCalls[0]);
    assert.equal(observerCalls[1].academy,data.academy);
    assert.equal(observerCalls[1].program,draft.program);
    assert.equal(observerCalls[1].day,draft.day);
    await expect(visibleCapacity).toHaveText('26');
    releaseRefresh();
    const readReply = await refreshed;
    assert.equal(readReply.status(),200);
    const {data: updated} = await readReply.json();
    assert.equal(updated.version,4);
    await expect(visibleCapacity).toHaveText('27');
    await observer.evaluate(()=>window.dispatchEvent(new Event('focus')));
    assert.equal(observerCalls.length,2);
    assert.deepEqual(slice(beforeObserverRead),[['planning','read',200]]);
    assert.equal(observer.url(),datedUrl);
    const afterSecondTab = await planCounts();
    metrics.datedPlanSecondTab = {
      priorCapacity:26, currentCapacity:27, currentVersion:updated.version, refreshReads:observerCalls.length-1,
      operations:afterSecondTab.operations-beforeSecondTab.operations,
      saveAudits:afterSecondTab.audits-beforeSecondTab.audits,
    };
    assert.equal(metrics.datedPlanSecondTab.operations,1);
    assert.equal(metrics.datedPlanSecondTab.saveAudits,1);
    pass('WD-16 refreshes only the selected dated plan in the second tab on visibility return');
  } finally {
    releaseRefresh();
    await observer.close();
  }
  const secondAcademy = await db({action:'second_academy_fixture'});
  const secondHome = `/en/workspace/${secondAcademy.academy}/home`;
  const secondSession = page.locator(`[data-occurrence="${secondAcademy.program}:${secondAcademy.day}"]`);
  let releaseOld;
  let oldReady;
  let oldFinished;
  const oldResponse = new Promise(resolve=>{oldReady=resolve;});
  const oldGate = new Promise(resolve=>{releaseOld=resolve;});
  const oldSettled = new Promise(resolve=>{oldFinished=resolve;});
  const holdOldHome = async route=>{
    const body = route.request().postDataJSON();
    if (body.academy!==data.academy || body.action!=='owner_home') return route.continue();
    try {
      const response = await route.fetch({maxRetries:0});
      oldReady({status:response.status(), payload:await response.json()});
      await oldGate;
      await route.fulfill({response}).catch(error=>{
        if (!/cancel|invalid interception|route is already handled/i.test(String(error))) throw error;
      });
    } finally {
      oldFinished();
    }
  };
  await page.route('**/api/experience',holdOldHome);
  try {
    await page.goto(origin+base+'/home');
    const old = await Promise.race([oldResponse,oldSettled.then(()=>null)]);
    assert.equal(old?.status,200);
    assert.ok(old.payload.data.panels.today.items.some(item=>item.program===draft.program));
    const documentCount = documents.length;
    await link('Switch workspace').click();
    await page.waitForURL(origin+'/en/workspace');
    await expect(draftSession).toHaveCount(0);
    const choice = link('Open academy').and(page.locator(`a[href="${secondHome}"]`));
    await expect(choice).toBeVisible();
    const currentResponse = page.waitForResponse(response=>
      new URL(response.url()).pathname==='/api/experience' &&
      response.request().postDataJSON()?.academy===secondAcademy.academy);
    await choice.click();
    const current = await currentResponse;
    assert.equal(current.status(),200);
    await expect(secondSession).toBeVisible();
    assert.equal(page.url(),origin+secondHome);
    releaseOld();
    await oldSettled;
    await expect(secondSession).toBeVisible();
    await expect(draftSession).toHaveCount(0);
    assert.equal(page.url(),origin+secondHome);
    assert.equal(documents.length,documentCount);
    metrics.academySwitch = {
      oldResponse:old.status, newResponse:current.status(), documentNavigations:0, oldSessionRendered:false,
    };
    pass('WD-17 switches academies through the chooser while a successful old Today response is held');
  } finally {
    releaseOld();
    await page.unroute('**/api/experience',holdOldHome);
  }
  const beforeAccess = state.events.length;
  const reloadToday = button('Reload current view');
  const readToday = () => reloadToday.press('Enter');
  const accessAlert = page.locator('main').getByRole('alert');
  state.sessionValid = false;
  await readToday();
  await expect(accessAlert).toHaveText('Sign in again, then reload this view.');
  await expect(secondSession).toHaveCount(0);
  await expect(link('Open this date')).toHaveCount(0);
  state.sessionValid = true;
  await readToday();
  await expect(secondSession).toBeVisible();
  await db({action:'role',academy:secondAcademy.academy});
  await readToday();
  await expect(accessAlert).toHaveText('Access is no longer available. Choose your current workspace.');
  await expect(secondSession).toHaveCount(0);
  await expect(link('Open this date')).toHaveCount(0);
  assert.equal(await db({action:'dated_plan_owner',academy:secondAcademy.academy,subject:'user_owner'}),'user_owner');
  await readToday();
  await expect(secondSession).toBeVisible();
  const accessReads = slice(beforeAccess);
  metrics.ownerAccess = [401,200,403,200];
  assert.deepEqual(accessReads,metrics.ownerAccess.map(status=>['experience','owner_home',status]));
  pass('WD-18 masks Today on expired sign-in and revoked authority and recovers after each is restored');

  const secondPlanCounts = () => db({action:'dated_plan_counts',academy:secondAcademy.academy});
  const beforeReadFailure = await secondPlanCounts();
  await secondSession.click();
  const planStart = state.events.length;
  await page.route('**/api/planning',async route=>{
    assert.equal(route.request().postDataJSON().action,'read');
    await route.fulfill({status:503,json:{error:'unavailable'}});
  },{times:1});
  const failedRead = page.waitForResponse(response=>
    new URL(response.url()).pathname==='/api/planning' && response.status()===503);
  await link('Open this date').click();
  const failure = await failedRead;
  assert.deepEqual(failure.request().postDataJSON(),{
    academy:secondAcademy.academy, action:'read', program:secondAcademy.program, day:secondAcademy.day,
  });
  const loadSavedPlan = button('Load saved plan');
  await expect(loadSavedPlan).toBeEnabled();
  await expect(page.getByRole('alert').filter({hasText:/could not|unavailable/i})).toBeVisible();
  await expect(button('Plan this date')).toHaveCount(0);
  await expect(button('Save draft plan')).toHaveCount(0);
  assert.deepEqual(slice(planStart),[]);
  assert.deepEqual(await secondPlanCounts(),beforeReadFailure);

  await loadSavedPlan.press('Enter');
  await button('Plan this date').click();
  await capacityInput.fill('19');
  await button('Review changes').click();
  await reviewAcknowledgement.check();
  const savedAfterRetry = page.waitForResponse(response=>
    new URL(response.url()).pathname==='/api/planning' &&
    response.request().postDataJSON()?.action==='save');
  await savePlanButton.press('Enter');
  const savedReply = await savedAfterRetry;
  assert.equal(savedReply.status(),200);
  const {data: recoveredPlan} = await savedReply.json();
  assert.deepEqual([recoveredPlan.program,recoveredPlan.day,recoveredPlan.version],
    [secondAcademy.program,secondAcademy.day,1]);
  await expect(page.getByRole('status').filter({hasText:'Draft plan saved.'})).toBeVisible();
  await button('Plan this date').click();
  await expect(capacityInput).toHaveValue('19');
  assert.deepEqual(slice(planStart),[
    ['planning','read',200],['planning','review',200],['planning','save',200],['planning','read',200],
  ]);
  const afterReadFailure = await secondPlanCounts();
  metrics.datedPlanReadFailure = {
    initialStatus:failure.status(), capacity:19, version:recoveredPlan.version,
    operations:afterReadFailure.operations-beforeReadFailure.operations,
    audits:afterReadFailure.audits-beforeReadFailure.audits,
  };
  assert.equal(metrics.datedPlanReadFailure.operations,1);
  assert.equal(metrics.datedPlanReadFailure.audits,1);
  pass('WD-19 recovers the dated plan after an initial read failure before allowing a save');
  const secondPlanKey = `academyos:planning:user_owner:${secondAcademy.academy}:${secondAcademy.program}:${secondAcademy.day}`;
  await capacityInput.fill('20');
  await button('Review changes').click();
  await reviewAcknowledgement.check();
  const beforeStorage = state.events.length;
  metrics.datedPlanStorage = [];
  for (const fault of ['QuotaExceededError','SecurityError','malformed']) {
    if (fault!=='QuotaExceededError') {
      await button('Edit choices').click();
      await capacityInput.fill('21');
      await capacityInput.fill('20');
      await button('Review changes').click();
      await reviewAcknowledgement.check();
    }
    await page.evaluate(({key,fault})=>{
      const method = fault==='SecurityError'?'getItem':'setItem';
      if (fault==='malformed') sessionStorage.setItem(key,'invalid fixture reference');
      else {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function(name,...args){
          if (this===sessionStorage && name===key) {
            Storage.prototype[method]=original;
            throw new DOMException('Fixture storage failure',fault);
          }
          return original.call(this,name,...args);
        };
      }
    },{key:secondPlanKey,fault});
    await savePlanButton.press('Enter');
    await expect(page.getByRole('alert').filter({hasText:fault==='malformed'?'The recovery reference is invalid.':'Nothing was submitted.'})).toBeVisible();
    await expect(page.getByText('New capacity: 20',{exact:true})).toBeVisible();
    const stored = await page.evaluate(key=>sessionStorage.getItem(key),secondPlanKey);
    assert.equal(stored,fault==='malformed'?'invalid fixture reference':null);
    metrics.datedPlanStorage.push(fault);
  }
  assert.deepEqual(slice(beforeStorage),[['planning','review',200],['planning','review',200]]);
  assert.deepEqual(await secondPlanCounts(),afterReadFailure);
  pass('WD-20 storage refusal and malformed reference keep the review and prevent any save');

  await page.route('**/api/experience',async route=>{
    const upstream=await route.fetch();
    assert.equal(upstream.status(),200);
    const payload=await upstream.json();
    payload.data.panels.feedback_reviews={state:'unavailable'};
    await route.fulfill({response:upstream,json:payload});
  },{times:1});
  await page.goto(origin+secondHome);
  await expect(secondSession).toBeVisible();
  const feedbackPanel=page.locator('section').filter({
    has:page.getByRole('heading',{name:'Feedback awaiting review',exact:true}),
  }).last();
  await expect(feedbackPanel).toContainText(/unavailable/i);
  await secondSession.click();
  await expect(link('Open this date')).toBeVisible();
  metrics.secondaryPanelUnavailable=true;
  pass('WD-21 keeps the current session actionable with an unavailable secondary panel');
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
