import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Fictional Chromium profile, actual handlers and disposable database only.
export async function additiveCases({browser,origin,db,api,calls,pass,state,result,owner}) {
  const previousFlag=process.env.LOCAL_REGISTER_MULTI_SCOPE_ENABLED;
  const context=await browser.newContext();
  const input=f=>({subject:owner,academy:f.academy,event:f.event});
  const get=(page,method,...args)=>page.evaluate(({method,args})=>window.pilot[method](...args),{method,args});
  async function load(page) {await page.goto(origin);await page.waitForFunction(()=>typeof window.openPilot==='function');}
  async function select(page,f) {await page.evaluate(value=>window.openPilot(value),input(f));}
  async function capture(page) {
    const {page:local}=await get(page,'read');
    const op=randomUUID();
    await get(page,'capture',op,local.header.server_now,[{player:local.players[0].id,status:'present',version:0}]);
    return op;
  }
  const counts=(f,op)=>db({action:'counts',...f,op});
  const zero={marks:0,history:0,operations:0,audit:0};
  const once={marks:1,history:1,operations:1,audit:1};
  try {
    process.env.LOCAL_REGISTER_MULTI_SCOPE_ENABLED='false';
    const first=await db({action:'make'}), page=await context.newPage();
    await load(page);await select(page,first);
    assert.equal(await get(page,'prepare'),'prepared');
    const locator=await page.evaluate(({owner,first})=>{
      const old=`academyos.register-slot.v1:${owner}:${first.academy}`;
      const modern=`academyos.register-slot.v2:${owner}:${first.academy}:${first.event}`;
      const bytes=localStorage.getItem(modern);
      if(!bytes||localStorage.getItem(old)!==null)throw new Error('Expected only fictional v2 locator');
      localStorage.setItem(old,bytes);localStorage.removeItem(modern);
      return bytes;
    },{owner,first});
    const legacySlot=JSON.parse(locator);
    const original=await capture(page), wire=(await get(page,'read')).original.wire;
    assert.equal(JSON.parse(wire).op,original);
    const legacy=await db({action:'inspect',...first});
    const recover={action:'recover',...input(first),device:legacySlot.device,namespace:legacySlot.namespace};
    const oldKey=(await result(recover)).ticket.material;
    process.env.LOCAL_REGISTER_MULTI_SCOPE_ENABLED='true';
    assert.equal((await result(recover)).ticket.material,oldKey);
    const second=await db({action:'second',...first});
    assert.equal(second.academy,first.academy);assert.notEqual(second.event,first.event);
    const other=await context.newPage();await load(other);await select(other,second);
    assert.equal(await get(other,'prepare'),'prepared');
    const secondSlot=await other.evaluate(({owner,second})=>JSON.parse(localStorage.getItem(`academyos.register-slot.v2:${owner}:${second.academy}:${second.event}`)),{owner,second});
    assert.notEqual(secondSlot.namespace,legacySlot.namespace);
    assert.equal(await page.evaluate(({owner,first})=>localStorage.getItem(`academyos.register-slot.v1:${owner}:${first.academy}`),{owner,first}),locator);
    assert.equal((await get(page,'read')).original.wire,wire);
    assert.deepEqual(await db({action:'inspect',...first}),legacy);
    pass('Legacy key and pending original survive a second event preparation');

    const secondOp=await capture(other), secondWire=(await get(other,'read')).original.wire;
    assert.equal(JSON.parse(secondWire).op,secondOp);assert.notEqual(secondWire,wire);
    await page.close();await other.close();
    const one=await context.newPage(),two=await context.newPage();
    await load(one);await load(two);await context.setOffline(true);
    await select(one,first);await select(two,second);
    assert.equal((await get(one,'read')).original.wire,wire);
    assert.equal((await get(two,'read')).original.wire,secondWire);
    assert.deepEqual(await counts(first,original),zero);assert.deepEqual(await counts(second,secondOp),zero);
    pass('Both independently saved originals reopen offline with unchanged operation IDs');

    await context.setOffline(false);
    await one.route('**/api/register-dispatch',async route=>{
      assert.equal((await route.fetch({maxRetries:0})).status(),200);await route.abort('failed');
    },{times:1});
    const before=calls.length;
    assert.deepEqual(await get(one,'sync'),{kind:'unknown'});
    assert.equal((await get(one,'read')).original.wire,wire);
    assert.deepEqual(await get(one,'sync'),{kind:'confirmed'});
    const sent=calls.slice(before).filter(call=>call.path==='/api/register-dispatch');
    assert.equal(sent.length,2);assert.equal(sent[0].body,sent[1].body);assert.equal(sent[0].body,wire);
    assert.deepEqual(await get(two,'sync'),{kind:'confirmed'});
    assert.deepEqual(await counts(first,original),once);assert.deepEqual(await counts(second,secondOp),once);
    pass('Lost reply replays original bytes once and both event saves apply exactly once');

    const device=randomUUID(), command={action:'prepare',...input(second),device};
    const [grant,retry]=await Promise.all([result(command),result(command)]);
    assert.equal(grant.scope.namespace,retry.scope.namespace);assert.equal(grant.ticket.material,retry.ticket.material);
    assert.notEqual(grant.scope.namespace,secondSlot.namespace);
    const ownScope=await db({action:'inspect_v2',...second,device});
    assert.equal(ownScope.rows,1);assert.equal(ownScope.audit,1);assert.ok(ownScope.fingerprint);
    const snapshot=await db({action:'inspect_v2',...second});
    const forbidden=[
      {...command,action:'recover',namespace:randomUUID()},
      {...command,action:'recover',namespace:secondSlot.namespace},
      {...command,action:'recover',device:randomUUID(),namespace:grant.scope.namespace},
      {...command,action:'recover',event:first.event,namespace:grant.scope.namespace},
      {...command,action:'recover',academy:randomUUID(),namespace:grant.scope.namespace},
    ];
    const call=async body=>api('/api/register-key',JSON.stringify(body));
    for(const bad of forbidden) assert.equal((await call(bad)).status,403);
    for(const subject of ['user_trainer','user_other']) {
      state.subject=subject;
      assert.equal((await call({...command,action:'recover',subject,namespace:grant.scope.namespace})).status,403);
    }
    state.subject=owner;
    const unsigned=await db({action:'rpc',target:'x23_owner_register_key_v2',subject:owner,proof:'{}',
      args:{a:second.academy,ev:second.event,device,expected_subject:owner,act:'recover',
        ns:grant.scope.namespace,envelope:null}});
    assert.equal(unsigned.error,'42501');
    assert.deepEqual(await db({action:'inspect_v2',...second}),snapshot);
    assert.deepEqual(await db({action:'inspect',...first}),legacy);
    pass('Concurrent new installation reuses one scope and foreign recovery attempts are refused');

    assert.deepEqual(await db({action:'acl_v2'}),{rls:true,anon_rpc:false,authenticated_table:false,
      authenticated_insert:false,primary_key:['subject','academy_id','event_id','device_id'],unique_scope:true});
    const fresh=await db({action:'make'});
    const freshCommand={action:'prepare',...input(fresh),device:randomUUID()};
    const freshGrant=await result(freshCommand);
    const freshSnapshot=await db({action:'inspect_v2',...fresh});
    assert.equal(freshSnapshot.rows,1);assert.equal(freshSnapshot.audit,1);assert.ok(freshSnapshot.fingerprint);
    const exact={...freshCommand,action:'recover',namespace:freshGrant.scope.namespace};
    await db({action:'suspend',...fresh});
    assert.equal((await call(exact)).status,403);
    await db({action:'restore',...fresh});
    assert.equal((await result(exact)).ticket.material,freshGrant.ticket.material);
    await db({action:'withdraw',...fresh});
    assert.equal((await call(freshCommand)).status,403);
    assert.equal((await result(exact)).ticket.material,freshGrant.ticket.material);
    assert.deepEqual(await db({action:'inspect_v2',...fresh}),freshSnapshot);
    assert.deepEqual(await db({action:'inspect_v2',...second}),snapshot);
    assert.deepEqual(await db({action:'inspect',...first}),legacy);
    pass('New registry access controls and suspended or withdrawn recovery preserve existing keys');
  } finally {
    state.subject=owner;
    if(previousFlag===undefined)delete process.env.LOCAL_REGISTER_MULTI_SCOPE_ENABLED;
    else process.env.LOCAL_REGISTER_MULTI_SCOPE_ENABLED=previousFlag;
    await context.close();
  }
}
