// Synthetic review QA only. Does not open staging, real account cookies or app storage.
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),dir=resolve(root,'design/offline-register-preview');
const html=await readFile(resolve(dir,'index.html'),'utf8'),manifest=JSON.parse(await readFile(resolve(dir,'manifest.json'),'utf8'));
const images=join(tmpdir(),'academyos-offline-register-preview');await mkdir(images,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'academyos-register-review-profile-'));
const checks=[],errors=[],external=[],layouts=[];let context;
const originServer=createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'"});res.end(html)});
await new Promise(r=>originServer.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${originServer.address().port}`;
const record=(name,details={})=>{checks.push({name,status:'passed',...details});console.log('PASS '+name)};
const state=p=>p.evaluate(()=>window.offlineRegisterReview?.state);
async function launch(){context=await chromium.launchPersistentContext(profile,{viewport:{width:1440,height:1000},reducedMotion:'reduce'});context.on('page',listen);for(const p of context.pages())listen(p);return context.pages()[0]??await context.newPage()}
function listen(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.type()+': '+m.text())});p.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url())});p.on('dialog',d=>d.accept())}
async function idle(p){await expect.poll(async()=>Boolean((await state(p))?.replica||await p.locator('#owner-login').isVisible()||await p.locator('#recover').isVisible()||await p.locator('#other-login').isVisible()||await p.locator('#prepare').isVisible()||await p.getByRole('heading',{name:'Access is no longer available',exact:true}).isVisible())).toBe(true);await expect.poll(async()=>!(await state(p)).busy).toBe(true)}
async function options(p){if(await p.locator('#review-options').isHidden())await p.locator('#review-toggle').click()}
async function scenario(p,kind){await options(p);await p.locator('#scenario').selectOption(kind);await p.locator('#apply-scenario').click();await expect.poll(async()=>!(await state(p)).busy).toBe(true)}
async function reset(p){await options(p);await p.locator('#reset').click();await p.locator('#dialog-confirm').click();await expect(p.locator('.roster .player')).toHaveCount(18);await expect.poll(async()=>!(await state(p)).busy).toBe(true)}
async function choose(p,id,status='present'){await p.locator(`#player-${id}-${status}`).click()}
async function save(p){await p.locator('#review-save').click();await expect(p.locator('#dialog')).toBeVisible();await expect(p.locator('#dialog-body')).toContainText('local save');await p.locator('#dialog-confirm').click();await expect(p.locator('#dialog')).not.toBeVisible()}
async function work(p){return p.evaluate(async()=>{const r=indexedDB.open('academyos-offline-register-review-v1');const db=await new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});const read=s=>new Promise((res,rej)=>{const r=db.transaction(s).objectStore(s).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});const result={};for(const s of ['replicas','work','projection','fixture','serverReceipts','control'])result[s]=await read(s);db.close();return result})}
async function currentWork(p){return (await work(p)).work.find(r=>r.key==='review:owner-a:academy-a')?.value}
async function markState(p,expected){await expect.poll(async()=>(await currentWork(p))?.state).toBe(expected);await expect.poll(async()=>!(await state(p)).busy).toBe(true)}
try{
  let p=await launch();await p.goto(origin);await idle(p);
  await expect(p).toHaveTitle('AcademyOS · Offline register review');await expect(p.locator('h1')).toHaveText('Session register');await expect(p.locator('.roster .player')).toHaveCount(18);await expect(p.locator('#review-warning')).toContainText('Nothing is encrypted');
  record('Page identity, meaningful 18-player roster and explicit fictional/security boundaries');
  await choose(p,'01');await choose(p,'02','absent');await expect(p.locator('#unsaved-count')).toHaveText('2');assert.equal((await work(p)).work.length,0);
  await p.locator('[data-nav=pending]').click();await expect(p.locator('#dialog')).toBeVisible();await p.locator('#dialog-cancel').press('Escape');await expect(p.locator('#unsaved-count')).toHaveText('2');assert.equal(await p.evaluate(()=>document.activeElement.dataset.nav),'pending');
  record('Unsaved choices are distinct from durable work; dirty navigation and Escape preserve choices/focus');
  await scenario(p,'disk-abort');await save(p);await expect(p.locator('#notice')).toContainText('Nothing was saved');assert.equal((await work(p)).work.length,0);assert.equal((await work(p)).projection.length,0);await expect(p.locator('#unsaved-count')).toHaveText('2');
  record('Real IndexedDB abort rolls back both intent and local projection; choices remain unsaved');
  await scenario(p,'normal');await context.setOffline(true);await save(p);await markState(p,'pending');await context.setOffline(false);let w=await currentWork(p);const id=w.packet.id,bytes=w.bytes;
  assert.equal(w.packet.marks.length,2);assert.equal((await work(p)).projection[0].value.operationId,id);assert.equal((await work(p)).fixture[0].value.appliedBatches,0);await expect(p.locator('[data-save-state=pending]')).toContainText('Saved on this device');
  record('Network-disabled local save commits exact packet, original ID, base versions and projection together; zero simulated server writes',{marks:2});
  await context.close();p=await launch();await p.goto(origin);await idle(p);assert.equal((await currentWork(p)).packet.id,id);assert.equal((await currentWork(p)).bytes,bytes);await p.locator('[data-nav=pending]').click();await expect(p.locator('[data-save-state=pending]')).toBeVisible();
  record('Actual browser process restart retains the same complete original save, not a new operation');
  await p.locator('#connection').click();await markState(p,'confirmed');w=await currentWork(p);assert.equal(w.packet.id,id);assert.equal((await work(p)).fixture[0].value.appliedBatches,1);assert.equal((await work(p)).projection.length,0);assert.equal(w.receipt.marks.length,2);
  await p.locator('#go-register').click();await expect(p.locator('#row-player-01 .saved-mark')).toHaveText('Present');await expect(p.locator('#row-player-02 .saved-mark')).toHaveText('Absent');await expect(p.locator('#row-player-03 .player-status')).toHaveText('Not recorded');
  await p.locator('#row-player-18 [data-correction]').click();await expect(p.locator('#dialog-body')).toContainText('cannot be overwritten');await p.locator('#dialog-cancel').click();
  record('Reconnect confirms the whole selected batch; unselected stays Unmarked; saved marks use existing corrections');
  await reset(p);await choose(p,'01');await choose(p,'02');await save(p);await scenario(p,'conflict');await p.locator('#connection').click();await markState(p,'review');w=await currentWork(p);assert.equal(w.packet.marks.length,2);assert.equal(w.current.find(r=>r.id==='player-01').status,'absent');let f=(await work(p)).fixture[0].value;assert.equal(f.appliedBatches,0);assert.equal(f.rows.find(r=>r.id==='player-02').status,'unmarked');await expect(p.locator('.compare').first()).toContainText('Your saved choice');
  record('One competing player mark refuses the entire batch and retains Base/Local/Current comparison');
  await reset(p);await choose(p,'01');await save(p);await scenario(p,'roster');await p.locator('#connection').click();await markState(p,'review');assert.equal((await work(p)).fixture[0].value.appliedBatches,0);
  record('Changed roster version blocks upload, preserving the immutable original packet');
  await reset(p);await choose(p,'01');await save(p);await scenario(p,'withdrawn');await p.locator('#connection').click();await markState(p,'review');assert.equal((await work(p)).fixture[0].value.appliedBatches,0);
  record('Withdrawn publication blocks the whole upload without removing local work');
  await reset(p);await choose(p,'01');await save(p);await scenario(p,'receipt-disk-abort');await p.locator('#connection').click();await markState(p,'unknown');assert.equal((await work(p)).projection.length,1);assert.equal((await work(p)).fixture[0].value.appliedBatches,1);await scenario(p,'normal');await p.locator('#sync').click();await markState(p,'confirmed');assert.equal((await work(p)).fixture[0].value.appliedBatches,1);
  record('Real receipt transaction abort retains local intent/projection; original receipt recovers one server effect');
  await reset(p);await scenario(p,'clock-skew');await choose(p,'01');await save(p);await scenario(p,'expired');await p.locator('#connection').click();await markState(p,'review');assert.equal((await currentWork(p)).reason,'deadline');assert.equal((await work(p)).fixture[0].value.appliedBatches,0);await expect(p.locator('[data-save-state=review]')).toContainText('does not extend');
  record('Future device timestamp cannot extend the existing server recording deadline');
  await reset(p);await choose(p,'01');await save(p);let unknownID=(await currentWork(p)).packet.id;await scenario(p,'lost-reply');await p.locator('#connection').click();await markState(p,'unknown');assert.equal((await work(p)).fixture[0].value.appliedBatches,1);await p.locator('#go-register').click();await expect(p.locator('#player-02-present')).toBeDisabled();await p.reload();await expect.poll(async()=>(await currentWork(p))?.state).toBe('confirmed');assert.equal((await currentWork(p)).packet.id,unknownID);assert.equal((await work(p)).fixture[0].value.appliedBatches,1);
  record('Committed reply loss blocks replacements; reload reconciles the original receipt with one effect');
  await reset(p);await choose(p,'01');await save(p);unknownID=(await currentWork(p)).packet.id;await scenario(p,'offline-transfer');await p.locator('#connection').click();await markState(p,'unknown');await scenario(p,'normal');await p.locator('#sync').click();await markState(p,'confirmed');assert.equal((await currentWork(p)).packet.id,unknownID);assert.equal((await work(p)).fixture[0].value.appliedBatches,1);
  record('No-receipt unknown upload retries exact original ID and bytes, without generating a replacement');
  await reset(p);await choose(p,'01');await save(p);await scenario(p,'bad-receipt');await p.locator('#connection').click();await markState(p,'unknown');await p.locator('#sync').click();await markState(p,'confirmed');assert.equal((await work(p)).fixture[0].value.appliedBatches,1);
  record('Mismatched receipt never confirms local work; exact original outcome recovers without another effect');
  await reset(p);await choose(p,'01');await save(p);const protectedID=(await currentWork(p)).packet.id;await p.locator('#account').click();await expect(p.locator('#dialog-body')).toContainText('Pending saved edits');await p.locator('#dialog-confirm').click();await expect(p.locator('#owner-login')).toBeVisible();assert.equal((await work(p)).replicas.length,0);assert.equal((await work(p)).projection.length,0);assert.equal((await currentWork(p)).quarantined,true);
  await p.locator('#other-login').click();await expect(p.locator('#content')).toContainText('Different account');await expect(p.locator('#content')).not.toContainText('Alex Demo');assert.equal(await p.locator('#sync').count(),0);await p.reload();await expect(p.locator('#content')).toContainText('Different account');await p.locator('#original-account').click();await expect(p.locator('#recover')).toBeVisible();await p.locator('#recover').click();await expect(p.locator('[data-save-state=pending]')).toBeVisible();assert.equal((await currentWork(p)).packet.id,protectedID);assert.equal((await work(p)).replicas.length,0);
  record('Logout removes replicas but retains pending identity; foreign account cannot open/send; original account recovers',{security:'UI/scope simulation only; fictional unencrypted DB is not confidentiality proof'});
  await options(p);await p.locator('#cleanup').click();await p.locator('#dialog-confirm').click();await expect(p.locator('#recover')).toBeVisible();assert.equal((await currentWork(p)).packet.id,protectedID);await p.locator('#recover').click();await p.locator('#connection').click();await markState(p,'confirmed');
  record('Explicit simulated 30-day cleanup preserves pending work separately; recovered original can synchronize');
  await reset(p);await choose(p,'01');await save(p);await scenario(p,'revoked');await p.locator('#connection').click();await expect(p.locator('#content')).toContainText('Access is no longer available');assert.equal((await currentWork(p)).quarantined,true);assert.equal((await work(p)).replicas.length,0);await expect(p.locator('#content')).not.toContainText('Alex Demo');await p.reload();await expect(p.locator('#content')).toContainText('Access is no longer available');assert.equal(await p.locator('#recover').count(),0);
  record('Known denial hides rows, stops upload and survives reload; same-account login cannot restore access');
  await reset(p);await choose(p,'01');await save(p);const peer=await context.newPage();await peer.goto(origin);await idle(peer);
  await Promise.all([p.locator('#connection').click(),peer.locator('#connection').click()]);await markState(p,'confirmed');assert.equal((await work(p)).fixture[0].value.appliedBatches,1);await peer.close();
  record('Two tabs reconnect using a per-scope Web Lock and idempotent receipt; one recorded batch');
  await reset(p);await choose(p,'01','absent');await p.locator('#player-02-present').focus();const editingPeer=await context.newPage();await editingPeer.goto(origin);await idle(editingPeer);await choose(editingPeer,'01');await save(editingPeer);await expect(p.locator('#retained-choices')).toBeVisible();assert.equal((await state(p)).draft['player-01'],'absent');await p.locator('#retained-choices').click();await expect(p.locator('#dialog-body')).toContainText('Absent');await p.locator('#dialog-cancel').click();await editingPeer.locator('#connection').click();await markState(p,'confirmed');await expect(p.locator('#retained-choices')).toBeVisible();await expect(p.locator('#review-save')).toBeDisabled();assert.equal((await state(p)).draft['player-01'],'absent');await editingPeer.close();
  record('Quiet cross-tab capture/confirmation retains dirty input; stale choices cannot overwrite the saved mark');
  await reset(p);for(let i=1;i<=17;i++)await choose(p,String(i).padStart(2,'0'),i%3===0?'absent':'present');await save(p);assert.equal((await currentWork(p)).packet.marks.length,17);await p.locator('#connection').click();await markState(p,'confirmed');assert.equal((await currentWork(p)).receipt.marks.length,17);assert.equal((await work(p)).fixture[0].value.rows.filter(r=>r.status==='unmarked').length,0);
  record('Complete 18-player register saves all 17 new marks together and preserves the existing saved mark');
  await reset(p);await choose(p,'01');await choose(p,'02','absent');if(await p.locator('#review-options').isVisible())await p.locator('#review-toggle').click();await p.evaluate(()=>window.scrollTo(0,0));await p.screenshot({path:join(images,'desktop-en-unsaved.png')});
  for(const locale of ['en','ar']){
    if((await state(p)).locale!==locale)await p.locator('#language').click();await expect(p.locator('html')).toHaveAttribute('lang',locale);
    for(const width of [320,360,390,768,1280,1440])for(const mode of ['dark','light']){
      if((await state(p)).theme!==mode)await p.locator('#theme').click();await expect(p.locator('html')).toHaveAttribute('data-theme',mode);await p.setViewportSize({width,height:1000});
      assert.equal(await p.locator('html').getAttribute('dir'),locale==='ar'?'rtl':'ltr');
      assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${locale}/${width}/${mode} horizontal overflow`);
      const boxes=await p.locator('.choices button').evaluateAll(buttons=>buttons.filter(b=>!b.disabled).map(b=>({height:b.getBoundingClientRect().height,width:b.getBoundingClientRect().width})));
      assert.ok(boxes.every(b=>b.height>=44&&b.width>=44));
      layouts.push({locale,width,mode,noHorizontalOverflow:true,markTargetsAtLeast44:true});
    }
  }
  await p.setViewportSize({width:390,height:844});if((await state(p)).theme!=='dark')await p.locator('#theme').click();await expect(p.locator('html')).toHaveAttribute('data-theme','dark');await p.locator('.session').scrollIntoViewIfNeeded();await p.screenshot({path:join(images,'phone-ar-unsaved.png')});
  await p.locator('#review-save').click();await expect(p.locator('#dialog-body')).toContainText('حفظ محلي');await p.locator('#dialog-cancel').press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.closest('dialog')!==null),true);await p.keyboard.press('Escape');await expect(p.locator('#dialog')).not.toBeVisible();await expect(p.locator('#review-save')).toBeFocused();
  record('24 EN/AR dark/light viewport combinations fit 320–1440px; labelled targets, RTL and native-dialog focus return',{layouts:layouts.length});
  if((await state(p)).locale!=='en')await p.locator('#language').click();await p.setViewportSize({width:720,height:500});await expect(p.locator('.roster')).toBeVisible();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  record('200%-equivalent 1440px reflow leaves register usable without page horizontal scrolling',{limit:'Viewport equivalent only; physical browser zoom and mobile keyboard not claimed'});
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);assert.deepEqual((await state(p)).audit.filter(e=>e.kind==='ui-error'),[]);
  record('No app console errors, framework overlay, external asset/API requests or swallowed UI errors');
  const receipt={date:new Date().toISOString(),scope:'Fictional local-storage and server simulation; no private runtime/security/hosted/physical proof',browserPath:'Browser plugin not available; regular isolated Playwright QA',htmlSha256:createHash('sha256').update(html).digest('hex'),sourceHashes:manifest.sources,checks,layouts,errors,externalRequests:external.length,capturesOutsideGit:images,limitations:['Unencrypted fictional IndexedDB, simulated accounts and server','No Clerk/API/SQL/provider traffic or security confidentiality proof','No service worker, offline cold launch or closed-app background guarantee','No physical-device/keyboard/zoom/screen-reader/eviction/key-migration proof','No production or privileged access change']};
  receipt.harnessSha256=createHash('sha256').update(await readFile(new URL(import.meta.url))).digest('hex');
  await mkdir(resolve(dir,'evidence'),{recursive:true});await writeFile(resolve(dir,'evidence/checks.json'),JSON.stringify(receipt,null,2)+'\n');console.log(`PASS ${checks.length} checks / ${layouts.length} layouts; images ${images}`);
}finally{await context?.close();await new Promise(r=>originServer.close(r));await rm(profile,{recursive:true,force:true})}
