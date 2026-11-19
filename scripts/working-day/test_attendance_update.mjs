// Local production-mode update. --installed uses a disposable desktop app window.
// --lost-reply starts the update with an original that committed without a reply.
// --unsaved keeps two reviewed choices open without creating an original.
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

const root=resolve(import.meta.dirname,'../..');
const installed=process.argv.includes('--installed');
const loseReply=process.argv.includes('--lost-reply');
const unsaved=process.argv.includes('--unsaved');
assert.ok(!(loseReply&&unsaved),'Choose either --lost-reply or --unsaved');
const temp=await mkdtemp(join(tmpdir(),'academyos-attendance-update-'));
const aDir=join(temp,'a'),bDir=join(temp,'b');
const next=join(root,'node_modules/next/dist/bin/next');
const workerPath='/prepared-workspace-worker.js';
const shellPath='/prepared-workspace';
const pointer='/prepared-workspace/cache-pointer';
const index='academyos-workspace-public-v1:index';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const installPath='/attendance-test-install';
const installAssets=new Map();
let fixture,browser,appB,appBExit,proxy,origin,bOrigin,page;
let installedApp;
let phase='a';
let lostReplyStatus;
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
  const build=spawn(process.execPath,[next,'build','--webpack'],{cwd:bDir,env,stdio:['ignore','pipe','pipe']});
  let log='';
  for(const stream of [build.stdout,build.stderr])stream.on('data',chunk=>{log+=chunk;});
  assert.equal((await once(build,'close'))[0],0,log.slice(-4500));
  const ids=await Promise.all([aDir,bDir].map(dir=>readFile(join(dir,'.next/BUILD_ID'),'utf8').then(value=>value.trim())));
  assert.notEqual(...ids,'No build replacement occurred');
  appB=spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port','0'],{cwd:bDir,env,stdio:['ignore','pipe','pipe']});
  appBExit=once(appB,'exit');
  let startLog='';
  appB.stderr.on('data',chunk=>{startLog+=chunk;});
  bOrigin=await new Promise((done,reject)=>{
    const timer=setTimeout(()=>reject(Error('Build B did not start: '+startLog)),15000);
    appB.once('exit',code=>{clearTimeout(timer);reject(Error('Build B exited: '+code+' '+startLog));});
    appB.stdout.on('data',chunk=>{
      startLog+=chunk;
      const match=startLog.match(/Local:\s+(http:\/\/127\.0\.0\.1:[1-9]\d*)/);
      if(match&&startLog.includes('Ready')){clearTimeout(timer);done(match[1]);}
    });
  });
  return {ids,workerHashes:[digest(aBytes),digest(bBytes)]};
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
const cacheState=()=>page.evaluate(async({index,pointer,shellPath})=>{
  const ref=await (await (await caches.open(index)).match(pointer)).json();
  const get=async name=>name?await (await (await caches.open(name)).match(shellPath)).text():null;
  const active=await get(ref.current),previous=await get(ref.previous);
  return {...ref,isB:active.includes('data-fixture-release="b"'),previousIsB:previous?.includes('data-fixture-release="b"')??null};
},{index,pointer,shellPath});

async function activateUpdate(builds,firstCache){
  const oldDocument=await page.evaluate(()=>performance.timeOrigin);
  const navigations=[];
  const onNavigation=frame=>{if(frame===page.mainFrame())navigations.push(frame.url());};
  page.on('framenavigated',onNavigation);
  try{
    phase='update';
    await browser.setOffline(false);
    assert.equal(digest(await (await fetch(origin+workerPath)).text()),builds.workerHashes[1]);
    await page.evaluate(async()=>{
      const reg=await navigator.serviceWorker.ready;
      const old=navigator.serviceWorker.controller;
      if(!old||!reg.active)throw Error('Expected build A to control the open document');
      let check;
      const changed=new Promise(ok=>{check=()=>{if(navigator.serviceWorker.controller!==old)ok();};navigator.serviceWorker.addEventListener('controllerchange',check);});
      let timer;
      try{
        await Promise.race([(async()=>{
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
          const ask=data=>new Promise(ok=>{
            const channel=new MessageChannel();
            channel.port1.onmessage=event=>{channel.port1.close();ok(event.data);};
            worker.postMessage(data,[channel.port2]);
          });
          if(await ask('fixture-release')!=='b')throw Error('Expected build B controller');
          if(await ask({type:'prepare-workspace-public-shell',route:location.pathname})!=='ready')throw Error('Expected build B public assets to be staged');
        })(),new Promise((_,no)=>{timer=setTimeout(()=>no(Error('Worker activation or shell preparation timed out')),25000);})]);
      }finally{clearTimeout(timer);navigator.serviceWorker.removeEventListener('controllerchange',check);}
    });
    const secondCache=await cacheState();
    assert.equal(secondCache.isB,true);
    assert.notEqual(secondCache.revision,firstCache.revision);
    assert.equal(secondCache.previous,firstCache.current);
    assert.equal(secondCache.previousIsB,false);
    assert.deepEqual(navigations,[]);
    assert.equal(await page.evaluate(()=>performance.timeOrigin),oldDocument);
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
    const secondCache=await activateUpdate(builds,firstCache);
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

async function run(){
  const manifest=installed?await fixtureManifest():null;
  fixture=await ownerFixture(root,aDir,{pilot:true});
  const builds=await buildB();
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
    const asset=installAssets.get(url.pathname);
    if(asset){res.writeHead(200,{'content-type':asset[0]}).end(asset[1]);return;}
    if(api&&req.headers.origin!==origin){res.writeHead(403).end();return;}
    const onA=api||phase==='a';
    const upstream=request(new URL(url.pathname+url.search,onA?fixture.origin:bOrigin),{
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
    if(installedApp){
      await old.close();
      page=await launchInstalled();
      await page.waitForURL(url,{timeout:12000});
      const timing=await page.evaluate(()=>{
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
  };
  assert.equal(digest(await (await fetch(origin+workerPath)).text()),builds.workerHashes[0]);
  await page.goto(url);
  await page.locator('.register-action-menu > summary').click();
  await button('Use a personal-device register').click();
  await page.getByLabel('This is my personal device',{exact:true}).check();
  await button('Prepare register on this device').click();
  await expect(page.getByText('Ready for offline reopening',{exact:true})).toBeVisible({timeout:20000});
  const firstCache=await cacheState();
  assert.equal(firstCache.isB,false);
  if(unsaved){
    await checkUnsavedUpdate(builds,firstCache,scope);
    return;
  }
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

  const secondCache=await activateUpdate(builds,firstCache);
  await expectUnconfirmed();
  assert.deepEqual(await original(),rows);
  assert.deepEqual(await counts(),beforeUpdate);
  assert.deepEqual(fixture.state.dispatchBodies,earlierWires);
  console.log('PASS build B activates in the open window, stages its public shell, and retains build A and the unchanged original without a reload');

  await assertOffline();
  await cold('b');
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
    if(appB?.exitCode===null)appB.kill();
    await appBExit;
    await fixture?.close();
    await rm(temp,{recursive:true,force:true});
  }
}
