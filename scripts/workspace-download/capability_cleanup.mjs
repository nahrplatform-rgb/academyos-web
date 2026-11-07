// Actual account boundary and both protected stores. Keys, identity and records
// are fictional. No provider, backend, service worker or server authority proof.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {join} from 'node:path';

export async function checkCapabilityCleanup(root,pass) {
  const output=await build({stdin:{contents:`
    import{useEffect}from'react';
    import{createRoot}from'react-dom/client';
    import Boundary from './apps/web/src/components/register-account-boundary';
    import{armRegisterAccount,readRegisterAccount,REGISTER_ACCOUNT_KEY}from'./apps/web/src/lib/register-device-account';
    import{openLocalRegister}from'./apps/web/src/lib/local-register-repository';
    import{openLocalWorkspace}from'./apps/web/src/lib/local-workspace-repository';
    import{writeRegisterSlot,readRegisterSlot}from'./apps/web/src/lib/register-device-slots';
    import{saveWorkspaceSlot,readWorkspaceSlot}from'./apps/web/src/lib/workspace-device-slots';
    const subject='user_owner',academy=crypto.randomUUID(),event=crypto.randomUUID();
    const context={subject,academy};
    const regScope={...context,environment:'staging',epoch:'fields_v1',device:crypto.randomUUID(),
      namespace:crypto.randomUUID(),capability:'owner-register-v1'};
    const material=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
    let register,workspace,ticket,packet;
    const root=createRoot(document.querySelector('#root'));
    function Fixture({register,workspace}){
      useEffect(()=>{window.fixtureCommit=[register,workspace]},[register,workspace]);
      return <Boundary enabled={register} workspaceEnabled={workspace} locale="en">
        <h1>Fictional signed-in task</h1>
      </Boundary>;
    }
    window.renderCapabilities=(register=true,workspace=true)=>root.render(<Fixture {...{register,workspace}}/>);
    window.seedWorkspace=async()=>{
      const scope={...context,environment:'staging',device:crypto.randomUUID(),namespace:crypto.randomUUID(),
        epoch:1,capability:'owner-workspace-v1'};
      workspace=await openLocalWorkspace(scope);
      await workspace.activate({material:material(),verifiedAt:Date.now()});
      await workspace.rememberContext('a'.repeat(64),Date.now(),{academy_id:academy,
        academy_name:'Fictional protected academy',branch_id:crypto.randomUUID(),branch_name:'Fictional branch',
        timezone:'Africa/Cairo',today:new Date().toISOString().slice(0,10)});
      saveWorkspaceSlot(context,{device:scope.device,namespace:scope.namespace,generation:crypto.randomUUID(),mode:'active'});
    };
    window.seedBoth=async()=>{
      await armRegisterAccount(subject);
      register=await openLocalRegister(regScope);
      const attempt=await register.beginActivation();
      ticket={binding:attempt.binding,material:material(),keyId:crypto.randomUUID(),verifiedAt:Date.now()};
      await register.activate(ticket,attempt);
      const now=Date.now(),day=new Date(now).toISOString().slice(0,10),player=crypto.randomUUID();
      const page={event,program:crypto.randomUUID(),day,scheduled_day:day,
        starts_at:new Date(now-1800000).toISOString(),ends_at:new Date(now+1800000).toISOString(),
        closes_at:new Date(now+88200000).toISOString(),server_now:new Date(now).toISOString(),
        projection:{name:'Fictional register',branch:'Fictional branch',timezone:'Africa/Cairo',sport:'Football',sport_ar:'كرة القدم'},
        owner:true,open:true,count:1,saved:0,protected:false,more:false,
        players:[{id:player,name:'Fictional player',status:null,version:0}]};
      const transfer=crypto.randomUUID();
      await register.beginImport(event,transfer);
      await register.appendPage(event,transfer,null,page);
      packet={action:'register',academy,event,op:crypto.randomUUID(),captured_at:page.server_now,
        marks:[{player,status:'present',version:0}]};
      await register.captureRegister(packet);
      writeRegisterSlot(subject,academy,{device:regScope.device,event,namespace:regScope.namespace,generation:1,mode:'active'});
      await window.seedWorkspace();
    };
    window.inspectCapabilities=async()=>({account:readRegisterAccount(),register:readRegisterSlot(subject,academy),
      workspace:readWorkspaceSlot(context)});
    window.readRegister=async()=>({wire:(await register.readOriginal(packet.op)).wire,
      rows:(await register.readPage(event)).players.length});
    window.readWorkspace=()=>workspace.readContext();
    window.recoverRegister=async()=>{
      const attempt=await register.beginActivation();
      await register.activate({...ticket,verifiedAt:Date.now()},attempt);
      return (await register.readOriginal(packet.op)).wire;
    };
    window.originalDigest=async()=>{
      const opening=indexedDB.open('academyos-owner-register-v1');
      const db=await new Promise((resolve,reject)=>{opening.onsuccess=()=>resolve(opening.result);opening.onerror=()=>reject(opening.error)});
      try{
        const records=await new Promise((resolve,reject)=>{
          const req=db.transaction('originals').objectStore('originals').getAll();
          req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
        });
        const text=JSON.stringify(records,(_key,value)=>value instanceof ArrayBuffer?Array.from(new Uint8Array(value)):value);
        return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))))
          .map(value=>value.toString(16).padStart(2,'0')).join('');
      }finally{db.close()}
    };
    window.failCleanup=()=>{
      const remove=IDBObjectStore.prototype.delete;
      IDBObjectStore.prototype.delete=function(...args){
        if(this.name==='pages'){
          IDBObjectStore.prototype.delete=remove;this.transaction.abort();throw new Error('fictional_cleanup_failure');
        }
        return remove.apply(this,args);
      };
    };
    window.holdAccount=()=>new Promise(held=>{
      void navigator.locks.request(REGISTER_ACCOUNT_KEY,()=>new Promise(release=>{window.releaseAccount=release;held()}));
    });
    window.drainAccount=()=>navigator.locks.request(REGISTER_ACCOUNT_KEY,()=>{});
    window.renderCapabilities();
  `,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',
    tsconfig:join(root,'apps/web/tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'fictional-clerk',setup(bundle){
      bundle.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fictional'}));
      bundle.onLoad({filter:/.*/,namespace:'fictional'},()=>({loader:'js',contents:
        "export const useUser=()=>({isLoaded:true,user:{id:'user_owner'}});export const useClerk=()=>({signOut:async()=>{window.signOutCalls=(window.signOutCalls??0)+1},openUserProfile:()=>{}});"}));
    }}]});
  const server=createServer((req,res)=>{
    res.setHeader('content-type',req.url==='/fixture.js'?'application/javascript':'text/html');
    res.end(req.url==='/fixture.js'?output.outputFiles[0].text:'<!doctype html><div id="root"></div><script src="/fixture.js"></script>');
  });
  let browser;
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    browser=await chromium.launch();
    const page=await browser.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    const task=()=>page.getByRole('heading',{name:'Fictional signed-in task',exact:true});
    await expect(task()).toBeVisible();
    await page.evaluate(()=>window.seedBoth());
    const before=await page.evaluate(()=>window.readRegister());
    const account=await page.evaluate(async()=>(await window.inspectCapabilities()).account);
    const originalDigest=await page.evaluate(()=>window.originalDigest());
    async function flags(register,workspace){
      await page.evaluate(flags=>window.renderCapabilities(...flags),[register,workspace]);
      await page.waitForFunction(flags=>JSON.stringify(window.fixtureCommit)===JSON.stringify(flags),[register,workspace]);
    }
    await page.evaluate(()=>window.holdAccount());
    await flags(true,false);
    await flags(true,true);
    await page.evaluate(async()=>{window.releaseAccount();await window.drainAccount()});
    assert.ok(await page.evaluate(()=>window.readWorkspace()));
    pass('A superseded gate-off cleanup cannot retire a newly re-enabled capability while queued behind the account lock');

    await page.evaluate(()=>window.failCleanup());
    await flags(true,false);
    await expect(page.getByRole('alert')).toHaveText('Downloads could not be cleared. Pending work remains protected.');
    assert.equal((await page.evaluate(()=>window.inspectCapabilities())).workspace.mode,'cleaning');
    await assert.rejects(page.evaluate(()=>window.readWorkspace()),/workspace_inactive/);
    assert.deepEqual(await page.evaluate(()=>window.readRegister()),before);
    assert.equal(await page.evaluate(()=>window.originalDigest()),originalDigest);
    await page.getByRole('button',{name:'Retry cleanup',exact:true}).click();
    await expect(task()).toBeVisible();
    const cleaned=await page.evaluate(()=>window.inspectCapabilities());
    assert.equal(cleaned.workspace,null);
    assert.deepEqual(cleaned.account,account);
    assert.equal(cleaned.register.mode,'active');
    assert.deepEqual(await page.evaluate(()=>window.readRegister()),before);
    assert.equal(await page.evaluate(()=>window.signOutCalls??0),0);
    pass('Workspace-only rollback masks failed cleanup, retries it and preserves the live register, exact pending original and signed-in account');

    await flags(true,true);
    await page.evaluate(()=>window.seedWorkspace());
    await page.evaluate(()=>window.failCleanup());
    await flags(true,false);
    await expect(page.getByRole('alert')).toBeVisible();
    await flags(true,true);
    await expect(task()).toBeVisible();
    assert.equal((await page.evaluate(()=>window.inspectCapabilities())).workspace,null);
    assert.deepEqual(await page.evaluate(()=>window.readRegister()),before);
    pass('Re-enabling a capability finishes its interrupted retirement before any new preparation');
    await page.evaluate(()=>window.seedWorkspace());
    const retainedContext=await page.evaluate(()=>window.readWorkspace());
    await flags(false,true);
    await expect.poll(async()=>(await page.evaluate(()=>window.inspectCapabilities())).register.mode).toBe('sealed');
    await assert.rejects(page.evaluate(()=>window.readRegister()),/account_verification_required/);
    assert.equal(await page.evaluate(()=>window.originalDigest()),originalDigest);
    assert.deepEqual(await page.evaluate(()=>window.readWorkspace()),retainedContext);
    assert.deepEqual((await page.evaluate(()=>window.inspectCapabilities())).account,account);
    await flags(true,true);
    assert.equal(await page.evaluate(()=>window.recoverRegister()),before.wire);
    assert.equal(await page.evaluate(()=>window.signOutCalls??0),0);
    assert.deepEqual(errors,[]);
    pass('Register-only rollback preserves workspace data and protected originals recover byte-identically after the register capability returns');
    return {workspaceRollbackPreservesRegister:true,registerRollbackPreservesWorkspace:true,
      pendingOriginalUnchanged:true,failedCleanupRetried:true,supersededCleanupFenced:true,providerSignOuts:0};
  } finally {
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
