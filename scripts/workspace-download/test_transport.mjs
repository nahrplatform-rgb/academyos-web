// Actual Next handler -> Supabase SDK -> signed gateway -> disposable PostgreSQL17.
// Only Clerk, Redis and the PostgREST wire are substituted. No hosted requests.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile, mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const root=resolve(import.meta.dirname,'../..'), require=createRequire(import.meta.url);
const directory=process.env.WORKSPACE_TRANSFER_EVIDENCE_DIR ?? join(root,'docs/07-handoff/evidence/ex13b-workspace-transfer');
const evidence=join(directory,'transport.json');
const inputs=[
  'apps/web/src/app/api/workspace-download/route.ts','apps/web/src/lib/workspace-download.ts',
  'apps/web/src/app/api/workspace-key/route.ts','apps/web/src/lib/workspace-key-server.ts',
  'apps/web/src/lib/local-workspace-codec.ts','apps/web/src/lib/local-workspace-repository.ts',
  'apps/web/src/lib/local-register-crypto.ts',
  'apps/web/src/lib/onboarding-server.ts','apps/web/src/lib/onboarding-gateway.ts','apps/web/src/lib/onboarding.ts',
  'apps/web/src/lib/config.ts','apps/web/src/lib/experience-format.ts','apps/web/src/lib/local-register-codec.ts',
  'supabase/migrations/20261105003702_owner_workspace_transfer_contract.sql',
  'scripts/workspace-download/test_transport.mjs','scripts/workspace-download/bridge.py',
  'scripts/workspace-download/test_boundary.py',
];
const hashes=Object.fromEntries(await Promise.all(inputs.map(async name=>[name,
  createHash('sha256').update(await readFile(join(root,name))).digest('hex')])));
if(process.argv.includes('--check')){
  const receipt=JSON.parse(await readFile(evidence,'utf8'));
  assert.equal(receipt.passed,true);assert.deepEqual(receipt.hashes,hashes);
  assert.ok(receipt.checks.length>=18);
  const databaseReceipt=JSON.parse(await readFile(join(directory,'database.json'),'utf8'));
  assert.equal(databaseReceipt.passed,true);assert.ok(databaseReceipt.tests>=21);
  for(const [name,hash]of Object.entries(databaseReceipt.sources))assert.equal(hashes[name],hash);
  console.log('PASS workspace transfer transport evidence matches current sources');
  process.exit(0);
}

const tmp=await mkdtemp(join(tmpdir(),'academyos-workspace-transfer-'));
const rpcName='x21_workspace_transfer_v1', stage='https://staging.academy.nahr.dev';
const database='https://snpphkenmvmhpjstbeul.supabase.co';
const state={subject:'user_owner',sessions:0,limits:[],calls:[],refusedBudget:null};
const checks=[],metrics={};
const pass=name=>{checks.push(name);console.log('PASS '+name);};
const realFetch=globalThis.fetch;
const env=Object.fromEntries(['APP_ENV','ONBOARDING_PROOF_KEY','NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','OWNER_WORKSPACE_TRANSFER_ENABLED','LOCAL_OWNER_WORKSPACE_KEY_ENABLED',
  'LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1'].map(k=>[k,process.env[k]]));
let pg,pgExit,db,server,browser;
try{
  const adapters={
    clerk:`export async function auth(){const s=globalThis.workspaceTransferFixture;s.sessions++;
      return{userId:s.subject,getToken:async()=>s.subject?'synthetic-token':null};}
      export async function clerkClient(){throw new Error('Unexpected provider directory lookup');}`,
    limiter:`export const stagingRedis=()=>({}),rateLimitSubject=s=>s;
      export function rateLimitAllowed(r){return r.success&&r.reason!=='timeout';}
      export function stagingLimiter(_redis,prefix,limit){return{limit:async subject=>{
        const s=globalThis.workspaceTransferFixture;s.limits.push({prefix,limit,subject});
        return s.refusedBudget===prefix?{success:true,reason:'timeout'}:{success:true};}};}`,
    serverOnly:'',
  };
  const output=await build({stdin:{contents:`export{POST}from'./apps/web/src/app/api/workspace-download/route.ts';
    export{POST as keyPost}from'./apps/web/src/app/api/workspace-key/route.ts';
    export{NextRequest}from'next/server';`,resolveDir:root},bundle:true,platform:'node',format:'esm',write:false,
    packages:'external',plugins:[{name:'isolated-provider-fixtures',setup(b){
      b.onResolve({filter:/^(next\/server|@supabase\/supabase-js)$/},v=>({path:require.resolve(v.path),external:true}));
      b.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:'clerk',namespace:'fixture'}));
      b.onResolve({filter:/^(\.\/rate-limit|@\/lib\/rate-limit)$/},()=>({path:'limiter',namespace:'fixture'}));
      b.onResolve({filter:/^server-only$/},()=>({path:'serverOnly',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},v=>({contents:adapters[v.path],loader:'js'}));
    }}]});
  const file=join(tmp,'route.mjs');await writeFile(file,output.outputFiles[0].text);
  const {POST,keyPost,NextRequest}=await import(pathToFileURL(file));
  globalThis.workspaceTransferFixture=state;
  Object.assign(process.env,{APP_ENV:'staging',ONBOARDING_PROOF_KEY:'a'.repeat(64),
    NEXT_PUBLIC_SUPABASE_URL:database,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-publishable-key'});
  delete process.env.OWNER_WORKSPACE_TRANSFER_ENABLED;

  pg=spawn('python3',['-u',join(root,'scripts/workspace-download/bridge.py')],{stdio:['pipe','pipe','inherit']});
  const pending=new Map();let sequence=0,ready;
  const started=new Promise(resolve=>{ready=resolve;});
  pgExit=new Promise(resolve=>pg.once('close',code=>{
    for(const call of pending.values())call.reject(new Error(`Disposable PG exited (${code})`));
    resolve(code);
  }));
  createInterface({input:pg.stdout}).on('line',line=>{
    const reply=JSON.parse(line);if(reply.ready){ready();return;}
    const call=pending.get(reply.id);pending.delete(reply.id);
    if(!call)throw new Error('Unexpected bridge response');
    if(reply.error)call.reject(new Error(reply.error));else call.resolve(reply.value);
  });
  await Promise.race([started,pgExit.then(code=>{throw new Error(`Disposable PG setup exited (${code})`);})]);
  db=command=>new Promise((resolve,reject)=>{
    const id=++sequence;pending.set(id,{resolve,reject});pg.stdin.write(JSON.stringify({...command,id})+'\n');
  });
  globalThis.fetch=async(input,init)=>{
    const url=new URL(String(input));assert.equal(url.origin,database);
    const target=url.pathname.replace('/rest/v1/rpc/','');
    assert.ok([rpcName,'x21_workspace_key_v1'].includes(target));assert.equal(url.search,'');
    assert.equal(init.method,'POST');assert.equal(init.cache,'no-store');
    const proof=new Headers(init.headers).get('x-academyos-gateway');
    assert.ok(proof);const subject=JSON.parse(proof).subject;
    assert.equal(subject,state.subject);
    const response=await db({action:'rpc',target,subject,proof,args:JSON.parse(init.body)});
    const result=response.error?Response.json({code:response.error,message:'Synthetic refusal'},
      {status:response.error==='42501'?403:409}):Response.json(response.data);
    state.calls.push({requestBytes:Buffer.byteLength(init.body),responseBytes:Buffer.byteLength(await result.clone().text())});
    return result;
  };
  const fixture=await db({action:'make',size:56});
  const request=(action,receipt=null,original=state.subject)=>POST(new NextRequest(stage+'/api/workspace-download',{
    method:'POST',headers:{origin:stage,'content-type':'application/json',
      'x-academyos-original-subject':original,'x-academyos-workspace-device':fixture.device,
      'x-academyos-workspace-namespace':fixture.namespace},
    body:JSON.stringify({action,academy:fixture.academy,...(receipt?{receipt}:{}),
      ...(action==='manifest'?{month:'2099-11-01'}:{})}),
  }));
  const successful=async(action,receipt)=>{
    const before={auth:state.sessions,limits:state.limits.length,calls:state.calls.length};
    const response=await request(action,receipt);assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('referrer-policy'),'no-referrer');
    assert.equal(state.sessions,before.auth+1);assert.equal(state.calls.length,before.calls+1);
    assert.deepEqual(state.limits.slice(before.limits),[
      {prefix:'onboarding-entry-read',limit:60,subject:state.subject},
      {prefix:'onboarding-read',limit:60,subject:state.subject},
    ]);
    return (await response.json()).data;
  };
  assert.equal((await request('manifest')).status,503);
  assert.equal(state.sessions,0);assert.equal(state.limits.length,0);assert.equal(state.calls.length,0);
  pass('Closed default performs zero authentication, limiter and database calls');
  process.env.OWNER_WORKSPACE_TRANSFER_ENABLED='true';
  const manifest=await successful('manifest');assert.equal(manifest.kind,'manifest');
  assert.equal(manifest.collections.length,4);
  const seed=manifest.collections.find(c=>c.id==='people').receipt;
  let receipt=seed,items=[],pages=0;
  while(true){
    const page=await successful('page',receipt);assert.equal(page.kind,'page');pages++;
    assert.ok(page.items.length<=25);items.push(...page.items);receipt=page.receipt;
    if(!page.more)break;assert.ok(pages<5,'No cycling cursor');
  }
  const complete=await successful('complete',receipt);
  assert.equal(complete.kind,'complete');assert.equal(complete.total,56);assert.equal(pages,3);
  assert.equal(new Set(items.map(i=>i.id)).size,56);
  assert.equal(state.calls.length,5);assert.equal(state.limits.length,10);
  pass('Actual SDK, gateway HMAC and PostgreSQL return one manifest, three bounded pages and a coherent completion');
  pass('Each transfer phase uses one entry budget, one gateway read budget and one RPC, independent of row count');
  metrics.initialPeople={players:56,pages,apiRequests:state.calls.length,limiterChecks:state.limits.length,
    requestBytes:state.calls.reduce((n,c)=>n+c.requestBytes,0),responseBytes:state.calls.reduce((n,c)=>n+c.responseBytes,0)};
  const unchanged=await successful('manifest');
  assert.deepEqual(unchanged.revisions,manifest.revisions);assert.equal(unchanged.scope,manifest.scope);
  const beforePages=state.calls.length;
  assert.equal(beforePages,6);
  pass('An unchanged manifest retains the collection revision and scope without fetching a dataset page');
  await db({action:'rename',academy:fixture.academy});
  const stale=await successful('page',seed);assert.equal(stale.error,'changed');assert.equal(stale.items,undefined);
  const tampered=structuredClone(seed);tampered.signature='0'.repeat(64);
  assert.equal((await request('page',tampered)).status,422);
  pass('Changed projection refuses the old chain and a modified signature is rejected by the database');
  const oldCalls=state.calls.length,oldLimits=state.limits.length;
  assert.equal((await request('manifest',null,'user_wrong')).status,403);
  assert.equal(state.calls.length,oldCalls);assert.equal(state.limits.length,oldLimits);
  state.refusedBudget='onboarding-read';
  assert.equal((await request('manifest')).status,429);assert.equal(state.calls.length,oldCalls);
  state.refusedBudget=null;
  pass('Account mismatch and a timed-out gateway budget refuse the read before PostgreSQL');
  state.subject='user_platform';assert.equal((await request('manifest')).status,403);
  state.subject='user_owner';await db({action:'suspend',academy:fixture.academy});
  assert.equal((await request('manifest')).status,403);
  pass('Current PostgreSQL authority denies a Platform-only account and a suspended Academy Owner');
  assert.ok(state.calls.every(c=>c.responseBytes<32768&&c.requestBytes<=8192));
  pass('All observed wire packets stay within the declared request and response limits');
  const work=await db({action:'make',size:1000,calendar:true,unregistered:true});
  const device=randomUUID();
  const keyRequest=(body,origin=stage)=>keyPost(new NextRequest(stage+'/api/workspace-key',{
    method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body),
  }));
  const prepare={action:'prepare',academy:work.academy,device,subject:'user_owner'};
  state.subject='user_owner';
  delete process.env.LOCAL_OWNER_WORKSPACE_KEY_ENABLED;
  let priorCalls=state.calls.length;
  assert.equal((await keyRequest(prepare)).status,503);
  assert.equal(state.calls.length,priorCalls);
  process.env.LOCAL_OWNER_WORKSPACE_KEY_ENABLED='true';
  process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1='b'.repeat(64);
  assert.equal((await keyRequest(prepare,'https://foreign.example')).status,403);
  assert.equal((await keyRequest({...prepare,role:'owner'})).status,422);
  assert.equal((await keyRequest({...prepare,subject:'user_other'})).status,403);
  assert.equal(state.calls.length,priorCalls);
  state.subject='user_platform';
  assert.equal((await keyRequest({...prepare,subject:state.subject})).status,403);
  state.subject='user_owner';
  const releases=await Promise.all([keyRequest(prepare),keyRequest(prepare)]);
  for(const response of releases){
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
  }
  const [{data:release},{data:parallel}]=await Promise.all(releases.map(response=>response.json()));
  assert.deepEqual(release.scope,parallel.scope);
  assert.equal(release.ticket.material,parallel.ticket.material);
  const recover={...prepare,action:'recover',namespace:release.scope.namespace};
  assert.equal((await keyRequest({...recover,namespace:randomUUID()})).status,403);
  const reopened=await keyRequest(recover);
  assert.equal(reopened.status,200);
  assert.equal((await reopened.json()).data.ticket.material,release.ticket.material);
  process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1='c'.repeat(64);
  assert.equal((await keyRequest(recover)).status,503);
  process.env.LOCAL_OWNER_WORKSPACE_WRAP_KEY_V1='b'.repeat(64);
  pass('Actual key route and signed database binding reuse one wrapped key and deny foreign origin, wrong actor, namespace and wrapping root');

  const transfer=async(action,receipt,month='2099-11-01')=>{
    const response=await POST(new NextRequest(stage+'/api/workspace-download',{
      method:'POST',headers:{origin:stage,'content-type':'application/json',
        'x-academyos-original-subject':release.scope.subject,'x-academyos-workspace-device':device,
        'x-academyos-workspace-namespace':release.scope.namespace},
      body:JSON.stringify({action,academy:work.academy,...(receipt?{receipt}:{month})}),
    }));
    assert.equal(response.status,200);
    return (await response.json()).data;
  };
  const client=await build({stdin:{contents:`
    import {openLocalWorkspace,LOCAL_WORKSPACE_DATABASE} from './apps/web/src/lib/local-workspace-repository';
    window.openWorkspace=async scope=>{window.repository=await openLocalWorkspace(scope)};
    window.inspectStorage=async()=>{
      const db=await new Promise((resolve,reject)=>{
        const req=indexedDB.open(LOCAL_WORKSPACE_DATABASE);
        req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
      });
      try {
        const tx=db.transaction(['control','collections','pages'],'readonly');
        const get=name=>new Promise(resolve=>{
          const req=tx.objectStore(name).getAll();
          req.onsuccess=()=>resolve(req.result);
        });
        const [control,states,pages]=await Promise.all(['control','collections','pages'].map(get));
        return {privateText:JSON.stringify([control,states,pages]).includes('Synthetic player'),
          sealed:pages.every(page=>page.cipher instanceof ArrayBuffer),keys:control.filter(c=>c.key).map(c=>c.key.extractable),
          pageCount:pages.length};
      } finally { db.close(); }
    };
    window.removePage=async(scope,collection,generation,index)=>{
      const db=await new Promise(resolve=>{
        const req=indexedDB.open(LOCAL_WORKSPACE_DATABASE);req.onsuccess=()=>resolve(req.result);
      });
      try {
        const tx=db.transaction('pages','readwrite');
        tx.objectStore('pages').delete([scope.namespace,collection,generation,index]);
        await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)});
      } finally {db.close()}
    };
  `,resolveDir:root},bundle:true,platform:'browser',write:false});
  server=createServer((req,res)=>{
    if(req.url==='/fixture.js'){
      res.setHeader('content-type','text/javascript');res.end(client.outputFiles[0].text);return;
    }
    res.setHeader('content-type','text/html');res.end('<!doctype html><script src="/fixture.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const local='http://127.0.0.1:'+server.address().port;
  const profile=join(tmp,'chromium');
  browser=await chromium.launchPersistentContext(profile);
  let tab=await browser.newPage();
  await tab.goto(local);
  const storage=(method,...args)=>tab.evaluate(([method,args])=>window.repository[method](...args),[method,args]);
  await tab.evaluate(scope=>window.openWorkspace(scope),release.scope);
  await storage('activate',release.ticket);
  await assert.rejects(storage('activate',{...release.ticket,material:Buffer.alloc(32).toString('base64')}));
  const manifest2=await transfer('manifest');
  const seedFor=(manifest,id)=>manifest.collections.find(collection=>collection.id===id).receipt;
  const peopleSeed=seedFor(manifest2,'people');
  const peopleGeneration=await storage('begin','people',peopleSeed);
  const first=await transfer('page',peopleSeed);
  const tamperedRows=structuredClone(first.items);
  tamperedRows[0].display_name='Synthetic tampered';
  await assert.rejects(storage('append','people',peopleGeneration,first.receipt,tamperedRows),/workspace_page_chain_mismatch/);
  await tab.evaluate(()=>{
    const put=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(...args){
      if(this.name==='collections'){
        IDBObjectStore.prototype.put=put;
        this.transaction.abort();
        throw new DOMException('Fictional quota failure','QuotaExceededError');
      }
      return put.apply(this,args);
    };
  });
  await assert.rejects(storage('append','people',peopleGeneration,first.receipt,first.items),/QuotaExceededError/);
  assert.equal((await storage('checkpoint','people')).receipt.payload.seen,0);
  assert.equal((await tab.evaluate(()=>window.inspectStorage())).pageCount,0);
  await storage('append','people',peopleGeneration,first.receipt,first.items);
  assert.equal(await storage('read','people'),null);
  pass('Actual row hash rejects tampering and a failed checkpoint write rolls back its encrypted page without publishing partial data');

  async function drain(collection,generation,receipt,append=true){
    let count=0;
    for(;;){
      const part=await transfer('page',receipt);
      assert.equal(part.kind,'page');
      count+=part.items.length;
      receipt=part.receipt;
      if(append) await storage('append',collection,generation,receipt,part.items);
      if(!part.more) break;
    }
    const result=await transfer('complete',receipt);
    assert.equal(result.kind,'complete');
    return {result,count};
  }
  const peer=await browser.newPage();
  await peer.goto(local);
  await peer.evaluate(scope=>window.openWorkspace(scope),release.scope);
  const second=await transfer('page',first.receipt);
  const race=await Promise.allSettled([
    storage('append','people',peopleGeneration,second.receipt,second.items),
    peer.evaluate(args=>window.repository.append(...args),['people',peopleGeneration,second.receipt,second.items]),
  ]);
  assert.equal(race.filter(result=>result.status==='fulfilled').length,1);
  await peer.close();
  assert.equal((await storage('checkpoint','people')).receipt.payload.seen,50);
  await browser.close();browser=await chromium.launchPersistentContext(profile);
  tab=await browser.newPage();await tab.goto(local);
  await tab.evaluate(scope=>window.openWorkspace(scope),release.scope);
  const cursor=await storage('checkpoint','people');
  assert.equal(cursor.generation,peopleGeneration);
  assert.equal(cursor.receipt.payload.seen,50);
  const resumed=await transfer('resume',cursor.receipt);
  assert.equal(resumed.kind,'resume');
  await storage('renew','people',peopleGeneration,resumed.receipt);
  await assert.rejects(storage('renew','people',peopleGeneration,peopleSeed),/workspace_resume_mismatch/);
  const people=await drain('people',peopleGeneration,resumed.receipt);
  assert.equal(people.count,950);
  await storage('complete','people',peopleGeneration,people.result.receipt,people.result.checked_at);
  pass('Two tabs cannot advance the same checkpoint twice and a browser process restart resumes at the saved page');

  priorCalls=state.calls.length;
  const readStart=performance.now();
  let position,found=[],scans=0,calls=0;
  do {
    const result=await storage('read','people','Synthetic player 999',position,25);
    found.push(...result.rows);
    position=result.next;scans+=result.scanned;calls++;
    assert.ok(result.scanned<=12);
  } while(position);
  assert.equal(state.calls.length,priorCalls);
  assert.equal(found.length,1);
  assert.equal(found[0].display_name,'Synthetic player 999');
  assert.equal((await storage('read','people')).count,1000);
  const disk=await tab.evaluate(()=>window.inspectStorage());
  assert.deepEqual(disk,{privateText:false,sealed:true,keys:[false],pageCount:40});
  metrics.localDirectory={rows:1000,searchSlices:calls,pagesScanned:scans,elapsedMs:performance.now()-readStart,
    operatingRequests:state.calls.length-priorCalls};
  pass('A complete 1000-player directory searches in bounded encrypted slices with zero operating requests or readable name indexes');

  const callsBeforeManifest=state.calls.length;
  const currentManifest=await transfer('manifest');
  assert.equal(await storage('refresh','people',seedFor(currentManifest,'people'),currentManifest.checked_at),true);
  assert.equal(await storage('refresh','people',seedFor(currentManifest,'people'),currentManifest.checked_at),false);
  assert.equal((await storage('read','people')).checkedAt,currentManifest.checked_at);
  assert.equal(state.calls.length,callsBeforeManifest+1);
  pass('An unchanged verified manifest refreshes completed coverage in one request with no dataset pages or replayed timestamp extension');

  const nov='calendar:2099-11',dec='calendar:2099-12';
  const novSeed=seedFor(manifest2,nov), decSeed=seedFor(manifest2,dec);
  const november=await storage('begin',nov,novSeed);
  const novRead=await drain(nov,november,novSeed);
  await storage('complete',nov,november,novRead.result.receipt,novRead.result.checked_at);
  const oldDecember=await storage('begin',dec,decSeed);
  const oldDecRead=await drain(dec,oldDecember,decSeed);
  await storage('complete',dec,oldDecember,oldDecRead.result.receipt,oldDecRead.result.checked_at);
  assert.ok((await storage('read',nov)).rows.length>0);
  assert.ok((await storage('read',dec)).rows.length>0);
  const lateNovember=await storage('begin',nov,novSeed);
  const late=await drain(nov,lateNovember,novSeed);
  await db({action:'calendar_change',program:work.program});
  const replacementSeed=seedFor(await transfer('manifest'),dec);
  const newDecember=await storage('begin',dec,replacementSeed);
  const replacement=await drain(dec,newDecember,replacementSeed);
  assert.ok((await storage('read',dec)).rows.every(row=>row.title!=='Synthetic changed title'));
  await storage('complete',dec,newDecember,replacement.result.receipt,replacement.result.checked_at);
  assert.ok((await storage('read',dec)).rows.every(row=>row.title==='Synthetic changed title'));
  assert.equal(await storage('read',nov),null);
  await assert.rejects(storage('complete',nov,lateNovember,late.result.receipt,late.result.checked_at),/workspace_obsolete_window/);
  pass('Changed Calendar publishes one verified replacement and removes older overlap while rejecting a late stale completion');

  const corrupt=await storage('begin',dec,replacementSeed);
  const corruptRead=await drain(dec,corrupt,replacementSeed);
  await tab.evaluate(args=>window.removePage(...args),[release.scope,dec,corrupt,0]);
  await assert.rejects(storage('complete',dec,corrupt,corruptRead.result.receipt,corruptRead.result.checked_at));
  assert.equal((await storage('read',dec)).count,replacement.count);
  pass('Missing staged ciphertext cannot finalize and the previous completed generation remains readable');

  await tab.evaluate(()=>{const now=Date.now();Date.now=()=>now+31*86400000});
  await storage('activate',release.ticket);
  assert.equal(await storage('read','people'),null);
  assert.equal(await storage('read',dec),null);
  pass('Thirty-day read cleanup is measured from the dataset verification and a key release cannot extend it');
  const staleTab=await browser.newPage();
  await staleTab.goto(local);
  await staleTab.evaluate(scope=>window.openWorkspace(scope),release.scope);
  // Seed a fresh Calendar generation so cleanup has ciphertext to remove.
  await tab.evaluate(()=>{delete Date.now;Date.now=()=>new Date().getTime()});
  const cleanupGeneration=await storage('begin',dec,replacementSeed);
  const cleanupRead=await drain(dec,cleanupGeneration,replacementSeed);
  await storage('complete',dec,cleanupGeneration,cleanupRead.result.receipt,cleanupRead.result.checked_at);
  await tab.evaluate(()=>{
    const remove=IDBObjectStore.prototype.delete;
    IDBObjectStore.prototype.delete=function(...args){
      if(this.name==='pages'){
        IDBObjectStore.prototype.delete=remove;
        this.transaction.abort();
        throw new Error('Fictional cleanup failure');
      }
      return remove.apply(this,args);
    };
  });
  await assert.rejects(storage('retire'),/Fictional cleanup failure/);
  const failedCleanup=await staleTab.evaluate(()=>window.inspectStorage());
  assert.equal(failedCleanup.keys.length,0);
  assert.ok(failedCleanup.pageCount>0);
  await assert.rejects(staleTab.evaluate(()=>window.repository.read('people')),/workspace_inactive/);
  await assert.rejects(staleTab.evaluate(ticket=>window.repository.activate(ticket),release.ticket),/workspace_scope_changed/);
  await staleTab.evaluate(scope=>window.openWorkspace(scope),release.scope);
  await assert.rejects(staleTab.evaluate(ticket=>window.repository.activate(ticket),release.ticket),/workspace_cleanup_required/);
  await staleTab.evaluate(()=>window.repository.retire());
  assert.deepEqual(await staleTab.evaluate(()=>window.inspectStorage()),{privateText:false,sealed:true,keys:[],pageCount:0});
  pass('Retiring the namespace removes read ciphertext and its browser key and fences late work in a second tab');
  await db({action:'suspend',academy:work.academy});
  assert.equal((await keyRequest(recover)).status,403);
  pass('A suspended Owner cannot receive workspace key material from the real signed database boundary');
  await mkdir(directory,{recursive:true});
  await writeFile(evidence,JSON.stringify({passed:true,hashes,checks,metrics,environment:{node:process.version,
    platform:process.platform,architecture:process.arch,browser:browser.browser()?.version(),scope:'Actual Next POST, Supabase SDK and signed gateway to disposable PostgreSQL17. Actual workspace key wrapping and Chromium WebCrypto/IndexedDB. Fictional Clerk, limiter and PostgREST wire. No hosted data, device or latency percentile claim.'}},null,2)+'\n');
}finally{
  await browser?.close();
  if(server?.listening) await new Promise(resolve=>server.close(resolve));
  globalThis.fetch=realFetch;delete globalThis.workspaceTransferFixture;
  if(pg&&pg.exitCode===null){
    if(db)await db({action:'close'});else pg.stdin.end();
    await pgExit;
  }
  for(const [key,value]of Object.entries(env))if(value===undefined)delete process.env[key];else process.env[key]=value;
  await rm(tmp,{recursive:true,force:true});
}
