import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium,expect} from '@playwright/test';
import manifest from '../../apps/web/src/app/manifest.ts';

const labels={
  en:{device:'Device',approve:'Use this personal device',ready:'Online',checking:'Checking for changes',
    search:'Find a player by name',back:'Back to players',full:'Open full profile',
    summary:'Player summary on this device',privateField:'Not included in this summary',
    denied:'These player records are unavailable to this account. Choose an available workspace.'},
  ar:{device:'الجهاز',approve:'استخدم هذا الجهاز الشخصي',ready:'متصل',checking:'جارٍ التحقّق من التغييرات',
    search:'البحث عن لاعب بالاسم',back:'العودة للاعبين',full:'فتح الملف الكامل',
    summary:'ملخص اللاعب على هذا الجهاز',privateField:'غير متاح في هذا الملخص',
    denied:'لا تتوفر سجلات اللاعبين لهذا الحساب. اختر مساحة عمل متاحة.'},
};

export async function installedPlayersAssets(root) {
  const name='AcademyOS Disposable Players Test';
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

function holdReply(setInterceptor,action) {
  const gate=Promise.withResolvers();
  let captured=false;
  const reply={status:null,released:false,release(){setInterceptor(undefined);gate.resolve();}};
  setInterceptor(async(call,invoke)=>{
    if(captured||call.action!==action)return invoke();
    captured=true;
    const response=await invoke();
    reply.status=response.status;
    await gate.promise;
    reply.released=true;
    return response;
  });
  return reply;
}

async function checkPlayers({page,session,windowId,locale,fixture,ui,db,transferCalls,rpcCalls,setIntercept,setPeopleIntercept}) {
  const text=labels[locale];
  const t=expect.configure({timeout:10000});
  const summary=page.locator('[data-connection-menu] > summary');
  const rows=page.locator('tbody tr');
  const search=page.getByRole('textbox',{name:text.search,exact:true});
  const button=name=>page.getByRole('button',{name,exact:true});
  const selectedHeading=name=>page.getByRole('heading',{name,exact:true});
  const contact=page.getByText(fixture.profile.contact,{exact:true});
  const peopleCalls=()=>ui.calls.filter(call=>call.path==='/api/people').map(call=>call.action);
  const errors=[];
  let documents=0;
  const operatingRequests=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{
    if(request.isNavigationRequest()&&request.resourceType()==='document')documents++;
    if(new URL(request.url()).pathname==='/api/people')operatingRequests.push(request.postDataJSON()?.action);
  });
  await t(page.locator('html')).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
  await page.getByText(text.device,{exact:true}).click();
  await button(text.approve).click();
  await t(summary).toHaveText(text.ready,{timeout:30000});
  await t.poll(()=>page.evaluate(async()=>Boolean(await window.inspectPreparedPeople()))).toBe(true);
  await t(rows).toHaveCount(25);
  const alias=page.getByText(fixture.profile.alternateName,{exact:true});
  const seed={requests:operatingRequests.length,transfers:transferCalls.length};
  await search.fill(fixture.profile.alternateName);
  await t(rows).toHaveCount(0);
  assert.deepEqual(operatingRequests.slice(seed.requests),[]);
  const online=locale==='ar'?'ابحث بكل الأسماء عبر الإنترنت':'Search all names online';
  const downloaded=locale==='ar'?'استخدم قائمة اللاعبين المنزّلة':'Use downloaded directory';
  await button(online).click();
  await t(rows).toHaveCount(1);
  await t(button(fixture.profile.name)).toBeVisible();
  await t(alias).toHaveCount(0);
  assert.deepEqual(operatingRequests.slice(seed.requests),['list']);
  assert.equal(transferCalls.length,seed.transfers);
  await button(downloaded).click();
  await t(rows).toHaveCount(25);
  assert.deepEqual(operatingRequests.slice(seed.requests),['list']);
  const start={operating:operatingRequests.length,people:peopleCalls().length,transfers:transferCalls.length,documents};
  const filter='Synthetic';
  await search.fill('no matching synthetic player');
  await t(rows).toHaveCount(0);
  await search.fill(filter);
  await t(rows).toHaveCount(25);
  await search.evaluate(input=>{input.focus({preventScroll:true});input.setSelectionRange(2,6);});
  await page.locator('.workspace-center').evaluate(center=>{center.scrollTop=300;});
  assert.deepEqual(operatingRequests.slice(start.operating),[],'covered local filtering starts no People requests');
  assert.deepEqual(peopleCalls().slice(start.people),[],'covered local filtering reaches no People handler');
  assert.equal(transferCalls.length,start.transfers,'covered local filtering starts no transfer');
  const snapshot=()=>page.evaluate(()=>{
    const input=document.querySelector('#player-search');
    return {filter:input?.value,focused:document.activeElement===input,
      range:[input?.selectionStart,input?.selectionEnd],scroll:document.querySelector('.workspace-center')?.scrollTop??0,
      selected:document.querySelector('tbody tr.selected button')?.textContent??null,
      rows:document.querySelectorAll('tbody tr').length,document:performance.timeOrigin};
  });
  const resume=async()=>{
    await session.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'minimized'}});
    await t.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(false);
    await session.send('Browser.setWindowBounds',{windowId,bounds:{windowState:'normal'}});
    await page.bringToFront();
    await t.poll(()=>page.evaluate(()=>document.hasFocus())).toBe(true);
  };
  async function checkPreparedReturn(before) {
    const initialTransfers=transferCalls.length;
    const initialRpcs=rpcCalls.length;
    const reply=holdReply(setIntercept,'manifest');
    try {
      await resume();
      await t(summary).toHaveText(text.checking);
      await t.poll(()=>reply.status).toBe(200);
      assert.equal(reply.released,false);
      assert.deepEqual(await snapshot(),before,'the held freshness response preserves the checked view');
      if(before.selected)await t(selectedHeading(before.selected)).toBeVisible();
      reply.release();
      await t(summary).toHaveText(text.ready);
      assert.deepEqual(await snapshot(),before,'the completed freshness response preserves the checked view');
      assert.deepEqual(transferCalls.slice(initialTransfers).map(call=>call.action),['manifest']);
      assert.deepEqual(rpcCalls.slice(initialRpcs).map(call=>call.rpc),['x21_workspace_transfer_v1']);
    } finally {reply.release();}
  }
  const before=await snapshot();
  assert.equal(before.filter,filter);
  assert.ok(before.focused&&before.scroll>0,'meaningful search focus and scroll are required before return');
  assert.deepEqual(before.range,[2,6]);
  await checkPreparedReturn(before);

  await search.fill(fixture.profile.name);
  await t(rows).toHaveCount(1);
  await button(fixture.profile.name).click();
  await t(selectedHeading(fixture.profile.name)).toBeVisible();
  await t(page.getByText(text.summary,{exact:true})).toBeVisible();
  await t(page.getByText(text.privateField,{exact:true})).toBeVisible();
  await t(contact).toHaveCount(0);
  await t(alias).toHaveCount(0);
  const selected=await snapshot();
  assert.equal(selected.selected,fixture.profile.name);
  await checkPreparedReturn(selected);
  assert.deepEqual(operatingRequests.slice(start.operating),[],'covered returns and summary require no People requests');
  assert.deepEqual(peopleCalls().slice(start.people),[]);

  const fullRpcs=rpcCalls.length;
  await button(text.full).click();
  await t(contact).toBeVisible();
  await t(alias).toBeVisible();
  assert.deepEqual(operatingRequests.slice(start.operating),['profile']);
  assert.deepEqual(rpcCalls.slice(fullRpcs).map(call=>call.rpc),['i2_profile_v1']);

  const older=holdReply(setPeopleIntercept,'profile');
  try {
    const [pending]=await Promise.all([page.waitForRequest(request=>
      new URL(request.url()).pathname==='/api/people'&&request.postDataJSON()?.action==='profile'),resume()]);
    await t.poll(()=>older.status).toBe(200);
    assert.equal(pending.postDataJSON().player,fixture.profile.id);
    assert.equal(older.released,false);
    await button(text.back).click();
    await search.fill('Synthetic player');
    await t(rows).toHaveCount(25);
    const other=rows.locator('button').first();
    const otherName=await other.innerText();
    await other.click();
    await t(selectedHeading(otherName)).toBeVisible();
    await t(contact).toHaveCount(0);
    await t.poll(()=>pending.failure()?.errorText).toBe('net::ERR_ABORTED');
    await t(summary).toHaveText(text.ready);

    await db({action:'suspend',academy:fixture.academy});
    const [denial]=await Promise.all([page.waitForResponse(response=>new URL(response.url()).pathname==='/api/people'&&
      response.status()===403&&response.request().postDataJSON()?.action==='profile'),button(text.full).click()]);
    assert.notEqual(denial.request().postDataJSON().player,fixture.profile.id);
    await t(page.getByRole('alert')).toContainText(text.denied);
    await t(rows).toHaveCount(0);
    await t(selectedHeading(otherName)).toHaveCount(0);
    await t(contact).toHaveCount(0);
    const slotKey=`academyos.workspace-slot.v1:user_owner:${fixture.academy}`;
    await t.poll(()=>page.evaluate(key=>localStorage.getItem(key),slotKey)).toBeNull();
    older.release();
    await t.poll(()=>older.released).toBe(true);
    await resume();
    await t(page.getByRole('alert')).toContainText(text.denied);
    await t(rows).toHaveCount(0);
    await t(contact).toHaveCount(0);
    assert.deepEqual(operatingRequests.slice(start.operating),['profile','profile','profile']);
    assert.deepEqual(peopleCalls().slice(start.people),['profile','profile','profile']);
  } finally {older.release();}
  const documentTransitions=documents-start.documents;
  assert.equal(documentTransitions,0);
  assert.equal(await page.evaluate(()=>performance.timeOrigin),before.document);
  assert.deepEqual(errors,[]);
  return {locale,retained:{filter:before.filter,focused:before.focused,range:before.range,scroll:before.scroll,rows:before.rows},
    alternateName:{downloadedMatches:0,onlineMatches:1,onlineReads:1,transfers:0,fullProfileOnly:true},
    coveredFiltering:{operatingReads:0,transfers:0},resumeActions:{directory:['manifest'],summary:['manifest']},
    selectedSummaryRetained:true,fullProfile:{operatingActions:peopleCalls().slice(start.people),currentDenial:403,
      privateContactMasked:true,obsoleteSuccessReleased:true,obsoleteRequestAborted:true,retiredSlot:true,
      noBackgroundRetryAfterDenial:true},documentTransitions};
}

export async function checkInstalledPlayers({app,base,profile,makeFixture,db,transferCalls,rpcCalls,setIntercept,setPeopleIntercept,pass}) {
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
      const url=`${base}/${locale}/workspace/${fixture.academy}/players`;
      const {targetId}=await session.send('PWA.launch',{manifestId,url});
      const {windowId}=await session.send('Browser.getWindowForTarget',{targetId});
      assert.notEqual(windowId,ordinaryWindow,'Players launches in its own installed window');
      let page;
      await expect.poll(async()=>{
        page=browser.pages().find(candidate=>candidate!==ordinary&&candidate.url()===url);
        return page?await page.evaluate(()=>matchMedia('(display-mode: standalone)').matches).catch(()=>false):false;
      },{timeout:12000}).toBe(true);
      try {
        assert.equal((await windowFor(browser,session,page)).windowId,windowId);
        const cdp=await browser.newCDPSession(page);
        await cdp.send('Emulation.setFocusEmulationEnabled',{enabled:false});
        cases.push(await checkPlayers({page,session,windowId,locale,fixture,ui,db,transferCalls,rpcCalls,setIntercept,setPeopleIntercept}));
        pass(`WD-76 ${locale} installed Owner Players retains the held directory and summary and fences full-profile denial`);
      } finally {await page.close();}
    }
    return {client:'installed standalone',browser:browser.browser().version(),platform:process.platform,cases};
  } finally {
    try {if(installed)await session.send('PWA.uninstall',{manifestId});}
    finally {await browser.close();}
  }
}
