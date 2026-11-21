import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,expect} from '@playwright/test';
import manifest from '../../apps/web/src/app/manifest.ts';

const labels={
  en:{device:'Device',approve:'Use this personal device',ready:'Online',checking:'Checking for changes',
    month:'Month',week:'Week',date:'Go to date',denied:'Access is no longer available. Choose your current workspace.'},
  ar:{device:'الجهاز',approve:'استخدم هذا الجهاز الشخصي',ready:'متصل',checking:'جارٍ التحقّق من التغييرات',
    month:'شهر',week:'أسبوع',date:'انتقل إلى تاريخ',denied:'لم تعد الصلاحية متاحة. اختر مساحة عملك الحالية.'},
};

export async function installedCalendarAssets(root) {
  const name='AcademyOS Disposable Calendar Test';
  const app={...manifest(),name,short_name:name};
  const assets=new Map([
    [app.start_url,['text/html',`<!doctype html><title>${name}</title><link rel="manifest" href="/manifest.webmanifest"><h1>${name}</h1>`]],
    ['/manifest.webmanifest',['application/manifest+json',JSON.stringify(app)]],
  ]);
  for(const icon of app.icons)assets.set(icon.src,[icon.type,await readFile(join(root,'apps/web/public',icon.src))]);
  return {
    app,
    serve(req,res){
      const asset=assets.get(req.url);
      if(!asset)return false;
      res.writeHead(200,{'content-type':asset[0]}).end(asset[1]);
      return true;
    },
  };
}

async function windowFor(browser,session,page) {
  const target=await browser.newCDPSession(page);
  try {
    const {targetInfo}=await target.send('Target.getTargetInfo');
    return await session.send('Browser.getWindowForTarget',{targetId:targetInfo.targetId});
  } finally {await target.detach();}
}

async function checkCalendar({page,session,windowId,locale,fixture,ui,db,transferCalls,rpcCalls,setIntercept}) {
  const text=labels[locale];
  const t=expect.configure({timeout:10000});
  const summary=page.locator('[data-connection-menu] > summary');
  const rows=page.locator('[data-occurrence]');
  const search=page.getByRole('searchbox');
  const date=page.getByLabel(text.date,{exact:true});
  const button=name=>page.getByRole('button',{name,exact:true});
  const inspector=page.locator('.operations-inspection');
  const errors=[];
  let documents=0,operatingRequests=0;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{
    if(request.isNavigationRequest()&&request.resourceType()==='document')documents++;
    if(new URL(request.url()).pathname==='/api/experience')operatingRequests++;
  });
  await t(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
  await page.getByText(text.device,{exact:true}).click();
  await button(text.approve).click();
  await t(summary).toHaveText(text.ready,{timeout:30000});
  await t(rows.first()).toBeVisible();
  await button(text.month).click();
  await date.fill('2099-11-08');
  const title=(await rows.first().locator('.session-name strong').innerText()).trim();
  const filter=title.slice(0,3);
  assert.ok(filter.length>=3);
  const filterStart={operating:ui.calls.length,transfers:transferCalls.length};
  await search.fill('no matching synthetic session');
  await t(rows).toHaveCount(0);
  await search.fill(filter);
  await t(rows.first()).toBeVisible();
  await rows.first().click();
  await t(inspector).toContainText(title);
  await search.evaluate(input=>{input.focus({preventScroll:true});input.setSelectionRange(1,3);});
  await page.locator('.workspace-center').evaluate(center=>{center.scrollTop=300;});
  assert.equal(ui.calls.length,filterStart.operating,'covered local filter makes no operating read');
  assert.equal(transferCalls.length,filterStart.transfers,'covered local filter makes no transfer');

  const snapshot=()=>page.evaluate(()=>{
    const input=document.querySelector('input[type=search]');
    return {period:document.querySelector('input[type=date]')?.value,
      month:Boolean(document.querySelector('.operations-month-board')),
      filter:input?.value,focused:document.activeElement===input,
      range:[input?.selectionStart,input?.selectionEnd],scroll:document.querySelector('.workspace-center').scrollTop,
      selected:document.querySelector('[data-occurrence][aria-pressed="true"]')?.getAttribute('data-occurrence')??null,
      rows:document.querySelectorAll('[data-occurrence]').length,document:performance.timeOrigin};
  });
  const before=await snapshot();
  assert.equal(before.period,'2099-11-08');assert.ok(before.month&&before.focused&&before.scroll>0&&before.selected);
  assert.deepEqual(before.range,[1,3]);
  await page.evaluate(()=>{
    window.calendarReturnEvents=[];
    for(const type of ['focus','blur'])window.addEventListener(type,event=>{
      window.calendarReturnEvents.push({type,trusted:event.isTrusted,visibility:document.visibilityState});
    });
    document.addEventListener('visibilitychange',event=>{
      window.calendarReturnEvents.push({type:'visibilitychange',trusted:event.isTrusted,visibility:document.visibilityState});
    });
  });
  const resume=async()=>{
    await session.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}});
    await t.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(false);
    await session.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});
    await page.bringToFront();
    await t.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(true);
  };
  let hold;
  let release;
  const manifests=[];
  setIntercept(async(call,invoke,command)=>{
    if(call.action!=='manifest')return invoke();
    const gate=hold;
    hold=undefined;
    const manifest={month:command.month,status:null,released:false};
    manifests.push(manifest);
    const result=await invoke();
    manifest.status=result.status;
    if(gate)await gate.promise;
    manifest.released=true;
    return result;
  });
  const holdNext=()=>{
    hold=Promise.withResolvers();
    release=hold.resolve;
  };
  const documentsBefore=documents;
  const operatingBefore=operatingRequests;
  const transfersBefore=transferCalls.length;
  const rpcsBefore=rpcCalls.length;
  try {
    holdNext();
    await resume();
    await t(summary).toHaveText(text.checking);
    await t.poll(()=>manifests[0]?.status).toBe(200);
    assert.equal(manifests[0].released,false);
    assert.deepEqual(await snapshot(),before,'held signed refresh preserves the complete Calendar view');
    release();
    await t(summary).toHaveText(text.ready);
    assert.deepEqual(await snapshot(),before,'completed refresh keeps the complete Calendar view');
    for(const control of [date,button(text.week),button(text.month)])await t(control).toBeEnabled();
    const resumeActions=transferCalls.slice(transfersBefore).map(call=>call.action);
    assert.deepEqual(resumeActions,['manifest']);
    assert.deepEqual(rpcCalls.slice(rpcsBefore).map(call=>call.rpc),['x21_workspace_transfer_v1']);
    const returnEvents=await page.evaluate(()=>window.calendarReturnEvents);
    assert.ok(returnEvents.some(event=>event.type==='blur'&&event.trusted));
    assert.ok(returnEvents.some(event=>event.type==='focus'&&event.trusted));
    assert.equal(ui.calls.length,filterStart.operating);

    // A new return supersedes a real older reply while the Owner has moved to
    // another covered week. A real revision change proves which result won.
    holdNext();
    const [obsoleteRequest]=await Promise.all([page.waitForRequest(request=>
      new URL(request.url()).pathname==='/api/workspace-download'&&request.postDataJSON()?.action==='manifest'),resume()]);
    await t.poll(()=>manifests[1]?.status).toBe(200);
    await button(text.week).click();
    await date.fill('2099-11-15');
    await t(date).toHaveValue('2099-11-15');
    await t(rows.first()).toBeVisible();
    await db({action:'calendar_change',program:fixture.program});
    await search.fill('Synthetic changed title');
    await t(rows).toHaveCount(0);
    await resume();
    await t.poll(()=>manifests[2]?.status).toBe(200);
    await t(summary).toHaveText(text.ready);
    await t(rows.first()).toContainText('Synthetic changed title');
    await t.poll(()=>obsoleteRequest.failure()?.errorText).toBe('net::ERR_ABORTED');
    assert.equal(manifests[1].released,false);
    const current=await snapshot();
    assert.equal(current.period,'2099-11-15');assert.equal(current.month,false);
    assert.equal(current.filter,'Synthetic changed title');assert.ok(current.rows>0);
    release();
    await t.poll(()=>manifests[1].released).toBe(true);
    assert.deepEqual(await snapshot(),current,'the released obsolete response cannot replace the newer covered week');

    await rows.first().click();
    await t(inspector).toContainText('Synthetic changed title');
    await db({action:'suspend',academy:fixture.academy});
    holdNext();
    await resume();
    await t.poll(()=>manifests[3]?.status).toBe(403);
    assert.equal(manifests[3].released,false);
    await t(inspector).toContainText('Synthetic changed title');
    release();
    await t(page.getByRole('alert')).toHaveText(text.denied);
    await t(rows).toHaveCount(0);
    await t(inspector).toHaveCount(0);
    await t(page.getByText('Synthetic changed title',{exact:true})).toHaveCount(0);
    const slotKey=`academyos.workspace-slot.v1:user_owner:${fixture.academy}`;
    await t.poll(()=>page.evaluate(key=>localStorage.getItem(key),slotKey)).toBeNull();
    assert.equal(operatingRequests,operatingBefore,'known denial must retire coverage without falling back to Calendar reads');
    assert.deepEqual(manifests.map(item=>[item.month,item.status]),[
      ['2099-11-01',200],['2099-11-01',200],['2099-11-01',200],['2099-11-01',403],
    ]);
    const documentTransitions=documents-documentsBefore;
    assert.equal(documentTransitions,0);
    assert.equal(await page.evaluate(()=>performance.timeOrigin),before.document);
    assert.deepEqual(errors,[]);
    return {locale,returnEvents,retained:{date:before.period,month:before.month,filter:before.filter,
      selection:true,focused:before.focused,range:before.range,scroll:before.scroll,rows:before.rows},
      resumeActions,coveredFiltering:{operatingReads:0,transfers:0},
      obsolete:{cancelled:obsoleteRequest.failure().errorText,currentWeek:current.period,changedRevisionVisible:true,oldReplyReleased:true},
      denial:{status:403,rows:0,inspector:false,retiredSlot:true},documentTransitions,
      operatingReads:operatingRequests-operatingBefore};
  } finally {release?.();setIntercept(undefined);}
}

export async function checkInstalledCalendar({app,base,profile,makeFixture,db,transferCalls,rpcCalls,setIntercept,pass}) {
  const browser=await chromium.launchPersistentContext(profile,{headless:false,viewport:{width:1440,height:670}});
  const session=await browser.browser().newBrowserCDPSession();
  const manifestId=new URL(app.id,base).href;
  const ordinary=browser.pages()[0];
  let installed=false;
  try {
    await ordinary.goto(base+app.start_url);
    const {windowId:ordinaryWindow}=await windowFor(browser,session,ordinary);
    await session.send('PWA.install',{manifestId,installUrlOrBundleUrl:base+app.start_url});
    installed=true;
    await session.send('PWA.changeAppUserSettings',{manifestId,displayMode:'standalone'});
    const cases=[];
    for(const locale of ['en','ar']){
      const {fixture,ui}=await makeFixture(locale);
      const url=`${base}/${locale}/workspace/${fixture.academy}/calendar?anchor=2099-11-01`;
      const {targetId}=await session.send('PWA.launch',{manifestId,url});
      const {windowId}=await session.send('Browser.getWindowForTarget',{targetId});
      assert.notEqual(windowId,ordinaryWindow,'Calendar launches in its own installed window');
      let page;
      await expect.poll(async()=>{
        page=browser.pages().find(candidate=>candidate!==ordinary&&candidate.url()===url);
        return page?await page.evaluate(()=>matchMedia('(display-mode: standalone)').matches).catch(()=>false):false;
      },{timeout:12000}).toBe(true);
      try {
        assert.equal((await windowFor(browser,session,page)).windowId,windowId);
        const cdp=await browser.newCDPSession(page);
        await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});
        cases.push(await checkCalendar({page,session,windowId,locale,fixture,ui,db,transferCalls,rpcCalls,setIntercept}));
        pass(`WD-76 ${locale} installed Owner Calendar preserves the held view, ignores an obsolete reply and masks confirmed denial`);
      } finally {await page.close();}
    }
    return {client:'installed standalone',browser:browser.browser().version(),platform:process.platform,cases};
  } finally {
    try {if(installed)await session.send('PWA.uninstall',{manifestId});}
    finally {await browser.close();}
  }
}
