import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Real browser disk and actual registered HTTP handlers. No provider account.
export async function pilotCases({browser,origin,db,api,calls,pass,state,result,owner}) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const input = f=>({subject:owner,academy:f.academy,event:f.event});
  const get = (tab, method, ...args) => tab.evaluate(({method,args})=>window.pilot[method](...args),{method,args});
  async function open(tab,f) {
    await tab.goto(origin);
    await tab.waitForFunction(()=>typeof window.openPilot==='function');
    await tab.evaluate(input=>window.openPilot(input),input(f));
  }
  async function capture(tab) {
    const {page:local}=await get(tab,'read');
    const op=randomUUID();
    await get(tab,'capture',op,local.header.server_now,[{player:local.players[0].id,status:'present',version:0}]);
    return op;
  }
  const audit = (f,op)=>db({action:'counts',...f,op});
  const zero = {marks:0,history:0,operations:0,audit:0};

  const main=await db({action:'make'}), foreign=await db({action:'make'});
  const command={action:'prepare',device:randomUUID(),...input(main)};
  const grant=await result(command);
  const headers={'x-academyos-original-subject':owner,'x-academyos-register-device':command.device,
    'x-academyos-register-namespace':grant.scope.namespace};
  const manifest={action:'manifest',academy:main.academy,event:main.event,expected:null,after:null};
  const manifestReply=await api('/api/register-download',JSON.stringify(manifest),headers);
  assert.equal(manifestReply.status,200);
  const manifestData=(await manifestReply.json()).data;
  const mark={action:'register',academy:main.academy,event:main.event,op:randomUUID(),
    captured_at:manifestData.header.server_now,marks:[{player:randomUUID(),status:'present',version:0}]};
  assert.deepEqual(await db({action:'bound_acl'}),[false,false,false,false]);
  for (const [path,body] of [['/api/register-download',manifest],['/api/register-dispatch',mark]]) {
    assert.equal((await api(path,JSON.stringify(body))).status,422);
    for (const [changedBody,changedHeaders] of [
      [{event:foreign.event},{}],[{academy:foreign.academy},{}],
      [{},{'x-academyos-register-device':randomUUID()}],[{},{'x-academyos-register-namespace':randomUUID()}],
      [{},{'x-academyos-original-subject':'user_other_owner'}],
    ]) assert.equal((await api(path,JSON.stringify({...body,...changedBody}),{...headers,...changedHeaders})).status,403);
  }
  assert.deepEqual(await audit(main,mark.op),zero);
  pass('Registered transport denies missing, wrong event/tenant/account/device/namespace; retired RPC grants are closed');

  const work=await db({action:'make'});
  await open(page,work);
  let before=calls.length;
  assert.equal(await get(page,'prepare'),'prepared');
  assert.deepEqual(calls.slice(before).map(x=>x.path),[
    '/api/register-key','/api/register-download','/api/register-download','/api/register-download']);
  before=calls.length;
  assert.equal(await get(page,'prepare'),'unchanged');
  assert.deepEqual(calls.slice(before).map(x=>x.path),['/api/register-download']);
  await context.setOffline(true);
  const original=await capture(page);
  assert.deepEqual(await audit(work,original),zero);
  assert.equal((await get(page,'read')).original.state,'pending');
  assert.equal(calls.length,before+1);
  await context.setOffline(false);
  const savedSlot=await db({action:'inspect',...work});
  const savedWire=(await get(page,'read')).original.wire;
  const otherDevice=await browser.newContext();
  const otherPage=await otherDevice.newPage();
  try {
    await open(otherPage,work);
    await assert.rejects(get(otherPage,'prepare'),/register_binding_conflict/);
    assert.deepEqual(await db({action:'inspect',...work}),savedSlot);
    assert.equal((await get(page,'read')).original.wire,savedWire);
    assert.equal((await get(page,'read')).original.state,'pending');
    await otherPage.route('**/api/register-key',route=>route.fulfill({status:409,
      contentType:'application/json',body:JSON.stringify({error:'conflict'})}),{times:1});
    await assert.rejects(get(otherPage,'prepare'),/register_unavailable/);
    assert.deepEqual(await db({action:'inspect',...work}),savedSlot);
    assert.equal((await get(page,'read')).original.wire,savedWire);
    await get(page,'recover');
    assert.equal((await get(page,'read')).original.wire,savedWire);
    assert.deepEqual(await audit(work,original),zero);
  } finally {await otherDevice.close();}
  pass('Another browser gets only the typed binding refusal; generic 409 stays unavailable and the first original and key remain recoverable');
  await page.route('**/api/register-dispatch',async route=>{
    assert.equal((await route.fetch({maxRetries:0})).status(),200);
    await route.abort('failed');
  },{times:1});
  assert.deepEqual(await get(page,'sync'),{kind:'unknown'});
  const expected={marks:1,history:1,operations:1,audit:1};
  assert.deepEqual(await audit(work,original),expected);
  assert.deepEqual(await get(page,'sync'),{kind:'confirmed'});
  assert.deepEqual(await audit(work,original),expected);
  assert.equal(calls.at(-1).body,calls.at(-2).body);
  pass('Actual key grant and registered transfer enable offline local capture; a lost reply replays exact bytes once');

  const age=await db({action:'make'});
  await open(page,age);
  await get(page,'prepare');
  const pending=await capture(page);
  await page.evaluate(()=>{window.realNow=Date.now; Date.now=()=>window.realNow()-3600000;});
  await assert.rejects(get(page,'read'),/clock_verification_required/);
  await get(page,'recover');
  assert.equal((await get(page,'read')).original.state,'pending');
  await page.evaluate(()=>{Date.now=()=>window.realNow()+30*24*60*60*1000+3600000;});
  before=calls.length;
  await assert.rejects(get(page,'read'),/account_verification_required/);
  assert.equal(calls.length,before);
  await page.evaluate(()=>{Date.now=window.realNow;});
  await get(page,'recover');
  const afterAge=await get(page,'read');
  assert.equal(afterAge.page,null);
  assert.equal(JSON.parse(afterAge.original.wire).op,pending);
  assert.deepEqual(await audit(age,pending),zero);
  pass('Clock rollback requires online verification; 30-day expiry clears rows offline and retains the original');

  await get(page,'prepare');
  await db({action:'suspend',...age});
  await assert.rejects(get(page,'prepare'),/scope_lost/);
  await assert.rejects(get(page,'read'),/account_verification_required/);
  await assert.rejects(get(page,'recover'),/scope_lost/);
  await db({action:'restore',...age});
  await get(page,'recover');
  assert.equal(JSON.parse((await get(page,'read')).original.wire).op,pending);
  await get(page,'prepare');
  await db({action:'withdraw',...age});
  await assert.rejects(get(page,'sync'),/withdrawn/);
  await get(page,'recover');
  const withdrawn=await get(page,'read');
  assert.equal(withdrawn.page,null);
  assert.equal(JSON.parse(withdrawn.original.wire).op,pending);
  assert.equal(withdrawn.original.state,'needs_review');
  assert.deepEqual(await audit(age,pending),zero);
  pass('Membership loss masks all work until restoration; withdrawal clears read coverage while Owner recovery remains possible');

  const race=await db({action:'make'});
  await open(page,race);
  const second=await context.newPage();
  await open(second,race);
  let reached, release;
  const responseHeld=new Promise(resolve=>{reached=resolve;});
  const wait=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/register-key',async route=>{
    try {
      const upstream=await route.fetch();
      assert.equal(upstream.status(),200);
      reached();
      await wait;
      await route.fulfill({response:upstream});
    } catch {reached();}
  },{times:1});
  const late=get(page,'prepare').then(()=>null,error=>error.message);
  try {
    await Promise.race([responseHeld, new Promise((_,reject)=>{const t=setTimeout(()=>reject(new Error('No held key reply')),10000);t.unref();})]);
    await get(second,'logout');
  } finally {release();}
  assert.match(await late,/scope_changed/);
  await assert.rejects(get(page,'read'),/account_verification_required/);
  assert.equal((await db({action:'inspect',...race})).audit,1);
  await open(page,race);
  assert.equal(await get(page,'prepare'),'prepared');
  assert.equal((await db({action:'inspect',...race})).audit,1);
  pass('Cross-tab logout fences a late first key response; later preparation reuses the one server slot');

  const cleanup=await capture(page);
  await page.evaluate(()=>{
    const old=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(value,...args){
      if(this.name==='control'&&value.mode==='quarantined'){
        IDBObjectStore.prototype.put=old;this.transaction.abort();throw new Error('fixture_cleanup_abort');
      }
      return old.call(this,value,...args);
    };
  });
  await assert.rejects(get(page,'logout'),/fixture_cleanup_abort|transaction_aborted/);
  await open(page,race);
  await assert.rejects(get(page,'read'),/account_verification_required/);
  state.subject='user_other_owner';
  await assert.rejects(get(page,'recover'),/scope_lost/);
  state.subject=owner;
  await get(page,'recover');
  const recovered=await get(page,'read');
  assert.equal(recovered.page,null);
  assert.equal(JSON.parse(recovered.original.wire).op,cleanup);
  assert.deepEqual(await audit(race,cleanup),zero);
  pass('Interrupted cleanup stays masked after reopen; recovery requires the same current Owner and preserves pending bytes');
  await context.close();
  return {firstPrepareRequests:4, unchangedRequests:1, offlineReadAndCaptureRequests:0, exactReplay:true};
}
