// Local production-mode update. --installed uses a disposable desktop app window.
// --lost-reply starts the update with an original that committed without a reply.
// --unsaved keeps two reviewed choices open without creating an original.
// --interrupted-assets cuts a required public download before retrying preparation.
// --rollback retires prepared Attendance while keeping the offline workspace.
// --unsupported-store opens an Attendance database newer than the app supports.
// All account, provider and database data are fictional.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {once} from 'node:events';
import {cp,mkdtemp,readFile,rm,symlink,writeFile} from 'node:fs/promises';
import {createServer,request} from 'node:http';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {chromium,expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';
import {configureRollbackBuild,raiseFixtureAttendanceVersion,rollbackBuildEnvironment,rollbackPlayer,rollbackStorage,seedRollbackWorkspace} from './attendance_rollback_fixture.mjs';

const root=resolve(import.meta.dirname,'../..');
const installed=process.argv.includes('--installed');
const loseReply=process.argv.includes('--lost-reply');
const unsaved=process.argv.includes('--unsaved');
const interruptAssets=process.argv.includes('--interrupted-assets');
const rollback=process.argv.includes('--rollback');
const unsupportedStore=process.argv.includes('--unsupported-store');
const preparedWorkspace=rollback||unsupportedStore;
assert.ok([loseReply,unsaved,interruptAssets,rollback,unsupportedStore].filter(Boolean).length<=1,
  'Choose one Attendance update scenario at a time');
const temp=await mkdtemp(join(tmpdir(),'academyos-attendance-update-'));
const aDir=join(temp,'a'),bDir=join(temp,'b');
const next=join(root,'node_modules/next/dist/bin/next');
const workerPath='/prepared-workspace-worker.js';
const shellPath='/prepared-workspace';
const pointer='/prepared-workspace/cache-pointer';
const cachePrefix='academyos-workspace-public-v1:';
const index=cachePrefix+'index';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const installPath='/attendance-test-install';
const installAssets=new Map();
let fixture,browser,proxy,origin,bOrigin,rollbackOrigin,page;
let installedApp;
let phase=preparedWorkspace?'b':'a';
let lostReplyStatus;
const appProcesses=[];
const held=new Set();
const requestFailures=[];
const env={PATH:process.env.PATH,HOME:process.env.HOME,NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'};

async function fixtureManifest(){
  const {default:manifest}=await import('../../apps/web/src/app/manifest.ts');
  const name='AcademyOS Disposable Attendance Test';
  const app={...manifest(),name,short_name:name};
  installAssets.set(installPath,['text/html',`<!doctype html><title>${name}</title><link rel="manifest" href="/manifest.webmanifest"><h1>${name}</h1>`]);
  installAssets.set('/manifest.webmanifest',['application/manifest+json',JSON.stringify(app)]);
  for(const {src} of app.icons){
    installAssets.set(src,['image/png',await readFile(join(root,'apps/web/public',src))]);
  }
  return app;
}

async function windowId(session,tab){
  const target=await browser.newCDPSession(tab);
  try {
    const {targetInfo}=await target.send('Target.getTargetInfo');
    return (await session.send('Browser.getWindowForTarget',{targetId:targetInfo.targetId})).windowId;
  } finally {
    await target.detach();
  }
}

async function launchInstalled(url){
  const {session,manifestId,ordinaryWindow}=installedApp;
  const previous=new Set(browser.pages());
  const {targetId}=await session.send('PWA.launch',url?{manifestId,url}:{manifestId});
  const {windowId:launchWindow}=await session.send('Browser.getWindowForTarget',{targetId});
  assert.notEqual(launchWindow,ordinaryWindow,'The installed app must open its own window');
  let standalone;
  // Chrome may also expose a temporary page while opening the app window.
  await expect.poll(async()=>{
    for(const candidate of browser.pages()){
      if(previous.has(candidate)||candidate.isClosed())continue;
      const matches=await candidate.evaluate(()=>matchMedia('(display-mode: standalone)').matches).catch(()=>false);
      if(matches&&await windowId(session,candidate)===launchWindow){standalone=candidate;return true;}
    }
    return false;
  },{timeout:12000,message:'Expected a newly launched standalone app window'}).toBe(true);
  return standalone;
}

function setInstalledConnection(session,offline){
  return session.send('Network.overrideNetworkState',{
    offline,latency:0,downloadThroughput:-1,uploadThroughput:-1,
  });
}

async function buildB(){
  await cp(aDir,bDir,{recursive:true,filter:path=>!['.next','node_modules','next-env.d.ts'].includes(path.slice(aDir.length+1).split('/')[0])});
  await symlink(join(root,'node_modules'),join(bDir,'node_modules'),'dir');
  const layout=join(bDir,'app/layout.jsx');
  const source=await readFile(layout,'utf8');
  assert.ok(source.includes('<body>'));
  await writeFile(layout,source.replace('<body>','<body data-fixture-release="b">'));
  const worker=join(bDir,'public',workerPath.slice(1));
  const aBytes=await readFile(worker,'utf8');
  // A diagnostic-only worker marker proves which live controller answered.
  const bBytes=aBytes+"\nself.addEventListener('message',event=>{if(event.data==='fixture-release')event.ports[0]?.postMessage('b');});\n";
  await writeFile(worker,bBytes);
  if(preparedWorkspace)await configureRollbackBuild(root,bDir);
  const buildEnvironment=preparedWorkspace?rollbackBuildEnvironment(env,true):env;
  const build=spawn(process.execPath,[next,'build','--webpack'],{cwd:bDir,env:buildEnvironment,stdio:['ignore','pipe','pipe']});
  let log='';
  for(const stream of [build.stdout,build.stderr])stream.on('data',chunk=>{log+=chunk;});
  assert.equal((await once(build,'close'))[0],0,log.slice(-4500));
  const ids=await Promise.all([aDir,bDir].map(dir=>readFile(join(dir,'.next/BUILD_ID'),'utf8').then(value=>value.trim())));
  assert.notEqual(...ids,'No build replacement occurred');
  bOrigin=await serveBuild(buildEnvironment);
  if(rollback)rollbackOrigin=await serveBuild(rollbackBuildEnvironment(env,false));
  return {ids,workerHashes:[digest(aBytes),digest(bBytes)]};
}

async function serveBuild(environment){
  const app=spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port','0'],
    {cwd:bDir,env:environment,stdio:['ignore','pipe','pipe']});
  appProcesses.push({app,exit:once(app,'exit')});
  let startLog='';
  app.stderr.on('data',chunk=>{startLog+=chunk;});
  return new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('Build B did not start: '+startLog)),15000);
    app.once('exit',code=>{clearTimeout(timer);reject(Error('Build B exited: '+code+' '+startLog));});
    app.stdout.on('data',chunk=>{
      startLog+=chunk;
      const match=startLog.match(/Local:\s+(http:\/\/127\.0\.0\.1:[1-9]\d*)/);
      if(match&&startLog.includes('Ready')){clearTimeout(timer);done(match[1]);}
    });
  });
}

async function assetToInterrupt(){
  const shell=await fetch(bOrigin+shellPath);
  assert.equal(shell.status,200);
  assert.equal(shell.headers.get('x-academyos-public-shell'),'workspace-v1');
  const html=await shell.text();
  assert.ok(html.includes('data-fixture-release="b"'));
  const scripts=Array.from(html.matchAll(/<script\b([^>]*)>/gi),match=>match[1])
    .filter(attributes=>!/\bnomodule\b/i.test(attributes))
    .map(attributes=>attributes.match(/\ssrc="(\/_next\/static\/[a-zA-Z0-9_./-]+\.js)"/)?.[1])
    .filter(path=>path&&!path.includes('..'));
  assert.ok(scripts.length>1,'The failed download must follow earlier required scripts');
  const path=scripts.at(-1);
  const response=await fetch(bOrigin+path);
  assert.equal(response.status,200);
  const contentType=response.headers.get('content-type');
  assert.ok(contentType);
  const bytes=Buffer.from(await response.arrayBuffer());
  assert.ok(bytes.length>1);
  return {path,contentType,fullLength:bytes.length,partial:bytes.subarray(0,Math.min(1024,Math.floor(bytes.length/2)))};
}

const original=async()=>page.evaluate(async()=>{
  const opening=indexedDB.open('academyos-owner-register-v1');
  const db=await new Promise((ok,no)=>{opening.onsuccess=()=>ok(opening.result);opening.onerror=()=>no(opening.error);});
  try{
    const read=db.transaction('originals').objectStore('originals').getAll();
    const rows=await new Promise((ok,no)=>{read.onsuccess=()=>ok(read.result);read.onerror=()=>no(read.error);});
    return Promise.all(rows.map(async({protected:record,...row})=>{
      const envelopes=await Promise.all([record.payload,record.wrapped].map(async({iv,cipher})=>{
        const bytes=new Uint8Array(iv.byteLength+cipher.byteLength);
        bytes.set(iv);bytes.set(new Uint8Array(cipher),iv.byteLength);
        return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)));
      }));
      return {...row,envelopes};
    }));
  }finally{db.close();}
});
const cacheState=()=>page.evaluate(async({cachePrefix,index,pointer,shellPath})=>{
  const ref=await (await (await caches.open(index)).match(pointer)).json();
  const get=async name=>name?await (await (await caches.open(name)).match(shellPath)).text():null;
  const active=await get(ref.current),previous=await get(ref.previous);
  const generations=(await caches.keys()).filter(name=>name.startsWith(cachePrefix)&&name!==index).sort();
  return {...ref,generations,isB:active.includes('data-fixture-release="b"'),previousIsB:previous?.includes('data-fixture-release="b"')??null};
},{cachePrefix,index,pointer,shellPath});

async function prepareUpdate(builds,firstCache,{activate=true,expected='ready'}={}){
  const oldDocument=await page.evaluate(()=>performance.timeOrigin);
  const navigations=[];
  const onNavigation=frame=>{if(frame===page.mainFrame())navigations.push(frame.url());};
  page.on('framenavigated',onNavigation);
  try{
    phase='update';
    await browser.setOffline(false);
    assert.equal(digest(await (await fetch(origin+workerPath)).text()),builds.workerHashes[1]);
    const outcome=await page.evaluate(async activate=>{
      const reg=await navigator.serviceWorker.ready;
      const old=navigator.serviceWorker.controller;
      if(!old||!reg.active)throw Error('Expected a worker to control the open document');
      let check;
      async function activateNewWorker(){
        const changed=new Promise(ok=>{
          check=()=>{if(navigator.serviceWorker.controller!==old)ok();};
          navigator.serviceWorker.addEventListener('controllerchange',check);
        });
        const updated=await reg.update();
        await changed;
        const worker=navigator.serviceWorker.controller;
        // clients.claim() can deliver controllerchange during activation.
        await new Promise((ok,no)=>{
          const state=()=>{
            if(worker.state==='activated'||worker.state==='redundant'){
              worker.removeEventListener('statechange',state);
              if(worker.state==='activated')ok();else no(Error('New controller became redundant'));
            }
          };
          worker.addEventListener('statechange',state);state();
        });
        if(worker!==updated.active||worker===old)throw Error('Expected a newly activated controller');
      }
      let timer;
      try{
        return await Promise.race([(async()=>{
          if(activate)await activateNewWorker();
          const worker=navigator.serviceWorker.controller;
          if(worker!==reg.active||worker?.state!=='activated')throw Error('Expected the active worker to control the open document');
          const ask=data=>new Promise(ok=>{
            const channel=new MessageChannel();
            channel.port1.onmessage=event=>{channel.port1.close();ok(event.data);};
            worker.postMessage(data,[channel.port2]);
          });
          if(await ask('fixture-release')!=='b')throw Error('Expected build B controller');
          return ask({type:'prepare-workspace-public-shell',route:location.pathname});
        })(),new Promise((_,no)=>{timer=setTimeout(()=>no(Error('Worker activation or shell preparation timed out')),25000);})]);
      }finally{clearTimeout(timer);if(check)navigator.serviceWorker.removeEventListener('controllerchange',check);}
    },activate);
    assert.equal(outcome,expected,'Unexpected result from public-shell preparation');
    assert.deepEqual(navigations,[]);
    assert.equal(await page.evaluate(()=>performance.timeOrigin),oldDocument);
    const secondCache=await cacheState();
    if(expected==='unavailable'){
      assert.deepEqual(secondCache,firstCache,'A partial build must leave the last complete cache in place');
      return secondCache;
    }
    assert.equal(secondCache.isB,true);
    assert.notEqual(secondCache.revision,firstCache.revision);
    assert.equal(secondCache.previous,firstCache.current);
    assert.equal(secondCache.previousIsB,false);
    return secondCache;
  }finally{page.off('framenavigated',onNavigation);}
}

async function checkUnsavedUpdate(builds,firstCache,scope){
  const saveAttempts=[];
  const observeSave=request=>{
    const url=new URL(request.url());
    if(url.origin!==origin||request.method()!=='POST')return;
    if(url.pathname==='/api/register-dispatch')saveAttempts.push('dispatch');
    if(url.pathname==='/api/attendance'){
      const action=request.postDataJSON()?.action;
      if(['mark','register','reconcile'].includes(action))saveAttempts.push(action);
    }
  };
  const counts=async()=>{
    // No operation ID exists yet. Use only the event-wide counts.
    const {marks,history,operations}=await fixture.db({action:'counts',...scope,op:scope.event});
    return {marks,history,operations};
  };
  browser.on('request',observeSave);
  try{
    const roster=page.locator('.register-roster li');
    const choices=[];
    const reviewRows=[];
    for(const [index,status] of ['Present','Absent'].entries()){
      const group=roster.nth(index).getByRole('group');
      const choice=group.getByRole('button',{name:status,exact:true});
      await choice.click();
      choices.push(choice);
      const player=await group.getAttribute('aria-label');
      assert.ok(player);
      reviewRows.push(`${player} · ${status}`);
    }
    const review=page.getByRole('button',{name:'Review register',exact:true});
    const dialog=page.getByRole('dialog',{name:'Save selected marks on this device?'});
    const back=dialog.getByRole('button',{name:'Back to editing',exact:true});
    const save=dialog.getByRole('button',{name:'Save selected marks',exact:true});
    await review.press('Enter');
    await expect(dialog.getByRole('listitem')).toHaveText(reviewRows);
    await expect(back).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(save).toBeFocused();
    assert.deepEqual(await original(),[]);
    const serverBefore=await counts();
    assert.deepEqual(serverBefore,{marks:0,history:0,operations:0});

    const route=page.url();
    const oldDocument=await page.evaluate(()=>performance.timeOrigin);
    const oldWindow=installedApp?await windowId(installedApp.session,page):null;
    const secondCache=await prepareUpdate(builds,firstCache);
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('listitem')).toHaveText(reviewRows);
    await expect(save).toBeFocused();
    assert.equal(await page.locator('body').getAttribute('data-fixture-release'),null);
    if(installedApp)assert.equal(await windowId(installedApp.session,page),oldWindow);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(review).toBeFocused();

    async function cancelExit(prompt){
      const result={type:prompt.type(),message:prompt.message()};
      await prompt.dismiss();
      return result;
    }
    const calendar=page.getByRole('link',{name:'Calendar',exact:true});
    const [prompt]=await Promise.all([
      page.waitForEvent('dialog',{timeout:5000}).then(cancelExit),
      calendar.press('Enter'),
    ]);
    assert.deepEqual(prompt,{type:'confirm',message:'Discard unsaved attendance choices?'});
    assert.equal(page.url(),route);
    assert.equal(await page.evaluate(()=>performance.timeOrigin),oldDocument);
    for(const choice of choices)await expect(choice).toHaveAttribute('aria-pressed','true');
    await review.press('Enter');
    await expect(dialog.getByRole('listitem')).toHaveText(reviewRows);
    const originals=await original();
    const serverAfter=await counts();
    assert.deepEqual(originals,[]);
    assert.deepEqual(saveAttempts,[]);
    assert.deepEqual(fixture.state.dispatchBodies,[]);
    assert.deepEqual(serverAfter,serverBefore);
    console.log('PASS build B activates without reloading or changing the two reviewed choices or focused control');
    console.log('PASS cancelling the Calendar exit retains both choices without an original, save attempt or database change');
    console.log(JSON.stringify({builds,cacheRevisions:[firstCache.revision,secondCache.revision],
      client:installed?'installed standalone':'browser tab',platform:process.platform,
      browser:browser.browser()?.version(),node:process.version,locale:'en',
      reviewedChoices:reviewRows.length,documentUnchanged:true,reviewFocusRetained:true,
      reviewFocusRestoredOnEscape:true,calendarExitCancelled:true,saveAttempts:saveAttempts.length,
      protectedOriginals:originals.length,dispatches:fixture.state.dispatchBodies.length,
      serverBefore,serverAfter}));
  }finally{browser.off('request',observeSave);}
}

async function reopen(destination,onlinePhase){
  await page.close();
  if(onlinePhase){
    phase=onlinePhase;
    await browser.setOffline(false);
  }
  if(installedApp)page=await launchInstalled(destination);
  else{
    page=await browser.newPage();
    await page.goto(destination);
  }
  await page.waitForURL(destination,{timeout:12000});
}

async function checkCachedDocument(){
  await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(1);
  const timing=await page.evaluate(()=>{
    const [entry]=performance.getEntriesByType('navigation');
    return {workerStart:entry.workerStart,transferSize:entry.transferSize};
  });
  assert.ok(timing.workerStart>0);
  assert.equal(timing.transferSize,0);
  return timing;
}

async function checkUnsupportedStore({builds,firstCache,scope,url,assertOffline,rows,counts,zero}){
  const roster=()=>page.locator('.register-roster li');
  const pendingMessage='Saved on this device · Awaiting sync';
  const unavailableMessage='The device register is unavailable. Saved work remains protected.';
  const playersUrl=origin+`/en/workspace/${scope.academy}/players`;
  await reopen(url);
  await checkCachedDocument();
  await expect(page.getByText(pendingMessage,{exact:true})).toBeVisible();
  await expect(roster()).toHaveCount(18);
  const before=await rollbackStorage(page,scope);
  assert.equal(before.databaseVersion,1);
  assert.equal(before.register.mode,'active');
  assert.equal(before.workspace.mode,'active');
  const olderOpenError=await raiseFixtureAttendanceVersion(page);
  const retained={...before,databaseVersion:2};
  assert.deepEqual(await rollbackStorage(page,scope),retained);
  assert.deepEqual(await original(),rows);

  async function checkUnavailable(){
    await expect(page.getByRole('alert').filter({hasText:unavailableMessage})).toBeVisible();
    await expect(roster()).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Review register',exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Use the online register',exact:true})).toHaveCount(0);
    await expect(page.getByText('Synced · Server recorded the register.',{exact:true})).toHaveCount(0);
    assert.deepEqual(await rollbackStorage(page,scope),retained);
    assert.deepEqual(await original(),rows);
  }

  const start=fixture.state.events.length;
  const apiAttempts=[];
  const observeApi=request=>{
    const url=new URL(request.url());
    if(url.origin===origin&&url.pathname.startsWith('/api/'))apiAttempts.push(url.pathname);
  };
  browser.on('request',observeApi);
  try{
    await reopen(url,'b');
    await expect(page.locator('body')).toHaveAttribute('data-fixture-release','b');
    await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(0);
    await checkUnavailable();
    assert.deepEqual(await counts(),zero);
    console.log('PASS signed-in Attendance refuses the newer database without offering a replacement save');

    await assertOffline();
    await reopen(url);
    const attendanceTiming=await checkCachedDocument();
    await checkUnavailable();
    await reopen(playersUrl);
    const playersTiming=await checkCachedDocument();
    await expect(page.getByRole('heading',{name:'Players',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:rollbackPlayer,exact:true})).toBeVisible();
    assert.deepEqual(await cacheState(),firstCache);
    assert.deepEqual(await rollbackStorage(page,scope),retained);
    assert.deepEqual(await original(),rows);
    assert.deepEqual(apiAttempts,[]);
    assert.equal(fixture.state.events.length,start);
    assert.equal(fixture.state.dispatchBodies.length,0);
    const serverAfter=await counts();
    assert.deepEqual(serverAfter,zero);
    console.log('PASS offline Attendance stays masked, Players reopens, and the encrypted original stays intact');
    console.log(JSON.stringify({builds,shellRevision:firstCache.revision,locale:'en',
      client:installed?'installed standalone':'browser tab',platform:process.platform,
      browser:browser.browser()?.version(),node:process.version,
      databaseVersionBefore:before.databaseVersion,databaseVersionAfter:retained.databaseVersion,olderOpenError,
      registerRowsPreserved:retained.rosterRows,onlineRegisterMasked:true,offlineRegisterMasked:true,
      workspacePreserved:true,originalUnchanged:true,publicShellRetained:true,attendanceTiming,playersTiming,
      apiAttempts:apiAttempts.length,dispatches:fixture.state.dispatchBodies.length,serverAfter}));
  }finally{browser.off('request',observeApi);}
}

async function checkRollback({builds,firstCache,scope,url,assertOffline,rows,counts,zero,one}){

  const roster=()=>page.locator('.register-roster li');
  const playerUrl=origin+`/en/workspace/${scope.academy}/players`;
  const before=await rollbackStorage(page,scope);
  assert.equal(before.account.subject,'user_owner');
  assert.equal(before.account.mode,'active');
  assert.equal(before.workspace.mode,'active');
  assert.equal(before.register.mode,'active');
  assert.equal(before.rosterRows,18);
  await reopen(url);
  await checkCachedDocument();
  await expect(page.getByText('Saved on this device · Awaiting sync',{exact:true})).toBeVisible();
  await expect(roster()).toHaveCount(18);
  assert.deepEqual(await original(),rows);

  const disablingAt=fixture.state.events.length;
  await reopen(url,'rollback');
  await expect(roster()).toHaveCount(18);
  await expect.poll(async()=>(await rollbackStorage(page,scope)).register.mode).toBe('sealed');
  await page.locator('.register-action-menu > summary').click();
  await expect(page.getByRole('button',{name:'Use a personal-device register',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Recover saved work',exact:true})).toHaveCount(0);
  await expect(page.locator('.register-device-ready')).toHaveCount(0);
  const retired=await rollbackStorage(page,scope);
  assert.equal(retired.repositoryMode,'quarantined');
  assert.equal(retired.rosterRows,0);
  assert.deepEqual(retired.account,before.account);
  assert.deepEqual(retired.workspace,before.workspace);
  assert.equal(retired.register.device,before.register.device);
  assert.equal(retired.register.namespace,before.register.namespace);
  assert.deepEqual(await original(),rows);
  assert.ok(fixture.state.events.slice(disablingAt).some(call=>
    call.route==='attendance'&&call.action==='roster'&&call.status===200));
  console.log('PASS disabled prepared Attendance retires its local roster while the normal signed-in roster remains usable');

  await assertOffline();
  const offlineStart=fixture.state.events.length;
  const offlineApiAttempts=[];
  const observeOffline=request=>{
    const url=new URL(request.url());
    if(url.origin===origin&&url.pathname.startsWith('/api/'))offlineApiAttempts.push(url.pathname);
  };
  browser.on('request',observeOffline);
  await reopen(url);
  const attendanceTiming=await checkCachedDocument();
  await expect(page.getByText('This workspace has no prepared data on this device. Open it when connected.',
    {exact:true})).toBeVisible();
  await expect(roster()).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Review register',exact:true})).toHaveCount(0);
  await reopen(playerUrl);
  const playersTiming=await checkCachedDocument();
  await expect(page.getByRole('heading',{name:'Players',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:rollbackPlayer,exact:true})).toBeVisible();
  browser.off('request',observeOffline);
  assert.deepEqual(offlineApiAttempts,[]);
  assert.equal(fixture.state.events.length,offlineStart);
  assert.deepEqual(await cacheState(),firstCache);
  assert.deepEqual(await original(),rows);
  assert.deepEqual(await counts(),zero);
  assert.equal(fixture.state.dispatchBodies.length,0);
  console.log('PASS retired Attendance stays masked offline while Players reopens its prepared row and the original remains encrypted');

  const recoveryAt=fixture.state.events.length;
  await reopen(url,'b');
  const recover=page.getByRole('button',{name:'Recover saved work',exact:true});
  await expect(recover).toBeEnabled();
  await expect(roster()).toHaveCount(0);
  assert.deepEqual(await original(),rows);
  await recover.click();
  await expect(page.getByText('Synced · Server recorded the register.',{exact:true})).toBeVisible({timeout:25000});
  await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(1);
  const recovery=fixture.state.events.slice(recoveryAt);
  const keyIndex=recovery.findIndex(call=>call.route==='register-key'&&call.action==='recover'&&call.status===200);
  const dispatchIndex=recovery.findIndex(call=>call.route==='register-dispatch'&&call.status===200);
  assert.ok(keyIndex>=0&&dispatchIndex>keyIndex,'Recover the existing key before sending the original');
  assert.equal(fixture.state.dispatchBodies.length,1);
  const wire=JSON.parse(fixture.state.dispatchBodies[0]);
  assert.equal(wire.op,rows[0].op);
  assert.equal(wire.event,scope.event);
  assert.equal(wire.marks.length,1);
  assert.equal(wire.marks[0].status,'present');
  assert.deepEqual(await counts(),one);
  const restored=await rollbackStorage(page,scope);
  assert.equal(restored.register.mode,'active');
  assert.equal(restored.register.namespace,before.register.namespace);
  assert.deepEqual(restored.workspace,before.workspace);
  const [confirmed]=await original();
  assert.equal(confirmed.op,rows[0].op);
  assert.equal(confirmed.active,undefined);
  await page.reload();
  await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(1);
  assert.deepEqual(await counts(),one);
  assert.equal(fixture.state.dispatchBodies.length,1);
  console.log('PASS re-enabling prepared Attendance recovers the original operation once and live reload sends nothing further');
  console.log(JSON.stringify({builds,shellRevision:firstCache.revision,locale:'en',
    client:installed?'installed standalone':'browser tab',platform:process.platform,
    browser:browser.browser()?.version(),node:process.version,
    registerRowsBefore:before.rosterRows,registerRowsWhileDisabled:retired.rosterRows,
    registerModeWhileDisabled:retired.register.mode,repositoryModeWhileDisabled:retired.repositoryMode,
    workspacePreserved:true,originalUnchangedWhileDisabled:true,originalIdPreserved:true,
    publicShellRetained:true,attendanceTiming,playersTiming,offlineApiAttempts:offlineApiAttempts.length,
    serverBeforeRecovery:zero,serverAfterRecovery:one,dispatches:fixture.state.dispatchBodies.length,
    recoveryCalls:recovery.map(({route,action,status})=>({route,action,status}))}));
}

async function run(){
  const manifest=installed?await fixtureManifest():null;
  fixture=await ownerFixture(root,aDir,{pilot:true});
  const builds=await buildB();
  const asset=interruptAssets?await assetToInterrupt():null;
  const completedDownloads=new Set();
  let interruptDownload=Boolean(asset), interruptedDownloads=0, precedingDownloads=0;
  // Keep one browser origin across builds. API calls go through the checked
  // fixture gateway, translating only this proxy's own same-origin header.
  proxy=createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1');
    const api=url.pathname.startsWith('/api/');
    if(phase==='offline'){req.socket.destroy();return;}
    if(phase==='update'&&api){held.add(res);res.on('close',()=>held.delete(res));req.resume();return;}
    if(phase==='update'&&![workerPath,shellPath].includes(url.pathname)&&!url.pathname.startsWith('/_next/static/')){
      req.socket.destroy();return;
    }
    if(phase==='update'&&interruptDownload&&url.pathname===asset.path){
      precedingDownloads=completedDownloads.size;
      interruptedDownloads++;
      res.writeHead(200,{'content-type':asset.contentType,'content-length':asset.fullLength,'cache-control':'no-store'});
      // Start a valid response and then cut the connection before its advertised length.
      res.write(asset.partial,()=>res.destroy());
      return;
    }
    const installAsset=installAssets.get(url.pathname);
    if(installAsset){res.writeHead(200,{'content-type':installAsset[0]}).end(installAsset[1]);return;}
    if(api&&req.headers.origin!==origin){res.writeHead(403).end();return;}
    // The disabled deployment's private API gates are represented at the
    // fixture proxy. Enabled, signed Attendance commands reach PostgreSQL.
    if(phase==='rollback'&&url.pathname.startsWith('/api/register-')){
      res.writeHead(503,{'content-type':'application/json','cache-control':'no-store'}).end('{"error":"unavailable"}');
      return;
    }
    const upstreamOrigin=api||phase==='a'?fixture.origin:phase==='rollback'?rollbackOrigin:bOrigin;
    const upstream=request(new URL(url.pathname+url.search,upstreamOrigin),{
      method:req.method,headers:api?{...req.headers,origin:fixture.origin}:req.headers,
    },reply=>{
      if(loseReply&&phase==='a'&&url.pathname==='/api/register-dispatch'){
        lostReplyStatus=reply.statusCode;
        reply.once('end',()=>{
          phase='offline';
          res.destroy();
        });
        reply.resume();
        return;
      }
      res.writeHead(reply.statusCode,reply.headers);
      if(interruptAssets&&phase==='update'&&url.pathname.startsWith('/_next/static/')&&reply.statusCode===200){
        res.once('finish',()=>completedDownloads.add(url.pathname));
      }
      reply.pipe(res);
    });
    upstream.on('error',()=>{if(!res.headersSent)res.writeHead(503);res.end();});
    res.on('close',()=>upstream.destroy());
    req.pipe(upstream);
  });
  await new Promise(ok=>proxy.listen(0,'127.0.0.1',ok));
  origin=`http://127.0.0.1:${proxy.address().port}`;
  const scope=fixture.data.events[0],path=`/en/workspace/${scope.academy}/attendance/${scope.event}`;
  const url=origin+path;
  browser=await chromium.launchPersistentContext(join(temp,'profile'),{headless:!installed});
  browser.on('requestfailed',request=>{
    const pathname=new URL(request.url()).pathname;
    if(pathname.startsWith('/api/'))requestFailures.push({phase,path:pathname,error:request.failure()?.errorText});
  });
  page=browser.pages()[0];
  if(manifest){
    await page.goto(origin+installPath);
    const session=await browser.browser().newBrowserCDPSession();
    const manifestId=new URL(manifest.id,origin).href;
    const ordinaryWindow=await windowId(session,page);
    await session.send('PWA.install',{manifestId,installUrlOrBundleUrl:origin+installPath});
    installedApp={session,manifestId,ordinaryWindow};
    await session.send('PWA.changeAppUserSettings',{manifestId,displayMode:'standalone'});
    await session.send('PWA.getOsAppState',{manifestId});
    page=await launchInstalled();
    await page.waitForURL(origin+manifest.start_url);
    console.log('PASS the desktop test profile opens the manifest start URL in its installed standalone window');
  }
  const button=name=>page.getByRole('button',{name,exact:true});
  const unconfirmedMessage=loseReply?'Outcome unknown · Check the original save':'Saved on this device · Awaiting sync';
  const expectUnconfirmed=()=>expect(page.getByText(unconfirmedMessage,{exact:true})).toBeVisible();
  const assertOffline=async()=>{
    phase='offline';
    await browser.setOffline(true);
    for(const res of held)res.destroy();
    await assert.rejects(fetch(origin+shellPath));
  };
  const cold=async release=>{
    const old=page;
    let timing;
    if(installedApp){
      await old.close();
      page=await launchInstalled();
      await page.waitForURL(url,{timeout:12000});
      timing=await page.evaluate(()=>{
        const [entry]=performance.getEntriesByType('navigation');
        return {workerStart:entry.workerStart,transferSize:entry.transferSize};
      });
      assert.ok(timing.workerStart>0,'The relaunched document must come through the worker');
      assert.equal(timing.transferSize,0,'The cold app launch must use cached code');
    }else{
      page=await browser.newPage();
      await old.close();
      const response=await page.goto(url);
      assert.ok(response?.fromServiceWorker());
    }
    await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(1);
    assert.equal(await page.locator('body').getAttribute('data-fixture-release'),release);
    await expectUnconfirmed();
    await expect(button('Review register')).toBeDisabled();
    return timing;
  };
  assert.equal(digest(await (await fetch(origin+workerPath)).text()),builds.workerHashes[preparedWorkspace?1:0]);
  await page.goto(url);
  await page.locator('.register-action-menu > summary').click();
  await button('Use a personal-device register').click();
  await page.getByLabel('This is my personal device',{exact:true}).check();
  await button('Prepare register on this device').click();
  await expect(page.getByText('Ready for offline reopening',{exact:true})).toBeVisible({timeout:20000});
  const firstCache=await cacheState();
  assert.equal(firstCache.isB,preparedWorkspace);
  if(unsaved){
    await checkUnsavedUpdate(builds,firstCache,scope);
    return;
  }
  if(preparedWorkspace)await seedRollbackWorkspace(root,page,scope);
  if(!loseReply)await assertOffline();
  await page.locator('.register-options').first().getByRole('button',{name:'Present',exact:true}).click();
  await button('Review register').click();
  await button('Save selected marks').click();
  await expectUnconfirmed();
  const rows=await original();
  assert.equal(rows.length,1);
  const [row]=rows;
  assert.equal(row.event,scope.event);
  assert.deepEqual(row.active,[row.namespace,scope.event]);
  const counts=()=>fixture.db({action:'counts',...scope,op:row.op});
  const zero={marks:0,history:0,operations:0,audit:0},one={marks:1,history:1,operations:1,audit:1};
  const beforeUpdate=loseReply?one:zero;
  const earlierWires=[...fixture.state.dispatchBodies];
  assert.deepEqual(await counts(),beforeUpdate);
  assert.equal(earlierWires.length,loseReply?1:0);
  if(rollback){
    await checkRollback({builds,firstCache,scope,url,assertOffline,rows,counts,zero,one});
    return;
  }
  if(unsupportedStore){
    await checkUnsupportedStore({builds,firstCache,scope,url,assertOffline,rows,counts,zero});
    return;
  }
  if(loseReply){
    assert.equal(lostReplyStatus,200,'The canonical save must finish before dropping its reply');
    assert.equal(JSON.parse(earlierWires[0]).op,row.op);
    await assertOffline();
    console.log('PASS the server committed once while the browser retained an unknown original');
  }
  if(installedApp){
    const before=fixture.state.events.length;
    await page.close();
    page=await launchInstalled(origin+`/en/workspace/${fixture.data.otherAcademy}/calendar`);
    await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(1);
    await expect(page.getByText('This workspace has no prepared data on this device. Open it when connected.',{exact:true})).toBeVisible();
    await expect(page.locator('.register-roster, .experience-session')).toHaveCount(0);
    assert.equal(fixture.state.events.length,before);
    console.log('PASS an uncovered workspace in the installed app shows the public boundary with no operating reads');
  }
  await cold(null);
  assert.deepEqual(await original(),rows);
  console.log(loseReply?'PASS build A reopens offline with the same unknown original':
    'PASS build A reopens offline with one durably saved original and no server effect');

  let interruptedUpdate;
  if(asset){
    await prepareUpdate(builds,firstCache,{expected:'unavailable'});
    assert.ok(interruptedDownloads>0,'The worker must request the interrupted build B asset');
    assert.ok(precedingDownloads>0,'Other public assets must finish before the interruption');
    assert.ok(!completedDownloads.has(asset.path));
    await expectUnconfirmed();
    assert.deepEqual(await original(),rows);
    assert.deepEqual(await counts(),beforeUpdate);
    assert.deepEqual(fixture.state.dispatchBodies,earlierWires);
    console.log('PASS the interrupted download discards the incomplete cache without moving the active shell or touching the pending original');

    await assertOffline();
    const fallbackTiming=await cold(null);
    await expect(page.locator('.register-roster li')).toHaveCount(18);
    assert.deepEqual(await cacheState(),firstCache);
    assert.deepEqual(await original(),rows);
    const serverBeforeRetry=await counts();
    assert.deepEqual(serverBeforeRetry,beforeUpdate);
    assert.deepEqual(fixture.state.dispatchBodies,earlierWires);
    console.log('PASS a new offline window opens build A with the same pending original after build B preparation fails');
    interruptedUpdate={assetPath:asset.path,bytesBeforeCutoff:asset.partial.length,expectedBytes:asset.fullLength,
      interruptedDownloads,precedingDownloads,outcome:'unavailable',fallbackRevision:firstCache.revision,
      fallbackTiming,incompleteCacheRemoved:true,serverBeforeRetry,
      dispatchesBeforeRetry:fixture.state.dispatchBodies.length};
    interruptDownload=false;
  }
  const secondCache=await prepareUpdate(builds,firstCache,{activate:!asset});
  if(asset){
    assert.ok(completedDownloads.has(asset.path),'Retry must finish the previously interrupted asset');
    interruptedUpdate.retryCompleted=true;
  }
  await expectUnconfirmed();
  assert.deepEqual(await original(),rows);
  assert.deepEqual(await counts(),beforeUpdate);
  assert.deepEqual(fixture.state.dispatchBodies,earlierWires);
  console.log(asset?'PASS retry stages the complete build B shell and retains build A and the same original without reloading':
    'PASS build B activates in the open window, stages its public shell, and retains build A and the unchanged original without a reload');

  await assertOffline();
  const updatedTiming=await cold('b');
  if(interruptedUpdate)interruptedUpdate.updatedTiming=updatedTiming;
  assert.deepEqual(await original(),rows);
  assert.deepEqual(await counts(),beforeUpdate);
  await expect(page.locator('.register-roster li')).toHaveCount(18);
  const bDocument=await page.evaluate(()=>performance.timeOrigin);
  fixture.state.sessionValid=false;
  const reconnectStart=fixture.state.events.length;
  // A fresh standalone window may keep reporting Online while the fixture
  // origin is cut. Exercise the browser's connection signal on that window.
  const installedConnection=installedApp?await browser.newCDPSession(page):null;
  if(installedConnection){
    await setInstalledConnection(installedConnection,true);
    await expect.poll(()=>page.evaluate(()=>navigator.onLine)).toBe(false);
    await expect(page.getByText('Checking saved work…',{exact:true})).toHaveCount(0);
    await page.evaluate(()=>window.addEventListener('online',event=>{
      document.documentElement.dataset.attendanceTestOnline=String(event.isTrusted);
    },{once:true}));
  }
  const beforeReconnect=await page.evaluate(()=>({online:navigator.onLine,visibility:document.visibilityState}));
  phase='b';
  await browser.setOffline(false);
  if(installedConnection){
    await setInstalledConnection(installedConnection,false);
    await expect(page.locator('html')).toHaveAttribute('data-attendance-test-online','true');
  }
  try{
    await expect(page.getByText('Synced · Server recorded the register.',{exact:true})).toBeVisible({timeout:25000});
  }catch(error){
    const afterReconnect=await page.evaluate(()=>({online:navigator.onLine,visibility:document.visibilityState}));
    console.error(JSON.stringify({beforeReconnect,afterReconnect,requestFailures,
      reconnectCalls:fixture.state.events.slice(reconnectStart).map(({route,status})=>({route,status})),
      dispatches:fixture.state.dispatchBodies.length}));
    throw error;
  }
  assert.equal(await page.evaluate(()=>performance.timeOrigin),bDocument);
  const reconnectCalls=fixture.state.events.slice(reconnectStart);
  const dispatchIndex=reconnectCalls.findIndex(call=>call.route==='register-dispatch');
  assert.ok(dispatchIndex>0);
  const beforeSend=reconnectCalls.slice(0,dispatchIndex);
  assert.deepEqual(beforeSend.map(call=>[call.route,call.status]),[['fixture-session',200]]);
  assert.equal(reconnectCalls[dispatchIndex].status,200);
  assert.equal(fixture.state.dispatchBodies.length,earlierWires.length+1);
  const wire=fixture.state.dispatchBodies.at(-1);
  if(loseReply)assert.equal(wire,earlierWires[0],'The retry must carry the exact original wire');
  const sent=JSON.parse(wire);
  assert.equal(sent.op,row.op);
  assert.equal(sent.event,scope.event);
  assert.equal(sent.marks.length,1);
  await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(1);
  assert.deepEqual(await counts(),one);
  const confirmed=await original();
  assert.equal(confirmed.length,1);
  assert.equal(confirmed[0].op,row.op);
  assert.equal(confirmed[0].active,undefined);
  const response=await page.reload();
  assert.equal(response.status(),200);
  await expect(page.locator('body')).toHaveAttribute('data-fixture-release','b');
  await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(0);
  await expect(page.locator('.register-roster .attendance-status.present')).toHaveCount(1);
  assert.deepEqual(fixture.state.dispatchBodies,[...earlierWires,wire]);
  assert.deepEqual(await counts(),one);
  await installedConnection?.detach();
  console.log('PASS build B cold reopen and reconnect confirm one committed result for the original; live reload sends nothing further');
  console.log(JSON.stringify({builds,cacheRevisions:[firstCache.revision,secondCache.revision],
    client:installed?'installed standalone':'browser tab',platform:process.platform,
    browser:browser.browser()?.version(),node:process.version,serverBefore:beforeUpdate,serverAfter:one,
    originalStateBeforeUpdate:loseReply?'unknown':'pending',lostReplyStatus,
    originalIdPreserved:true,ciphertextUnchangedUntilSync:true,dispatches:fixture.state.dispatchBodies.length,
    ...(loseReply?{replayedOriginalBytes:true}:{}),reconnectDocuments:0,
    ...(interruptedUpdate?{interruptedUpdate}:{}),
    reconnectCalls:reconnectCalls.map(({route,action,status})=>({route,action,status}))}));
}

try{
  await run();
}finally{
  for(const res of held)res.destroy();
  try{
    if(installedApp)await installedApp.session.send('PWA.uninstall',{manifestId:installedApp.manifestId});
  }finally{
    await browser?.close();
    if(proxy?.listening)await new Promise(ok=>proxy.close(ok));
    for(const {app} of appProcesses)if(app.exitCode===null)app.kill();
    await Promise.all(appProcesses.map(({exit})=>exit));
    await fixture?.close();
    await rm(temp,{recursive:true,force:true});
  }
}
