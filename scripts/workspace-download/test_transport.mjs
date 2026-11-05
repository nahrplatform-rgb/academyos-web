// Actual Next handler -> Supabase SDK -> signed gateway -> disposable PostgreSQL17.
// Only Clerk, Redis and the PostgREST wire are substituted. No hosted requests.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
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
  assert.ok(receipt.checks.length>=8);
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
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','OWNER_WORKSPACE_TRANSFER_ENABLED'].map(k=>[k,process.env[k]]));
let pg,pgExit,db;
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
    export{NextRequest}from'next/server';`,resolveDir:root},bundle:true,platform:'node',format:'esm',write:false,
    packages:'external',plugins:[{name:'isolated-provider-fixtures',setup(b){
      b.onResolve({filter:/^(next\/server|@supabase\/supabase-js)$/},v=>({path:require.resolve(v.path),external:true}));
      b.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:'clerk',namespace:'fixture'}));
      b.onResolve({filter:/^(\.\/rate-limit|@\/lib\/rate-limit)$/},()=>({path:'limiter',namespace:'fixture'}));
      b.onResolve({filter:/^server-only$/},()=>({path:'serverOnly',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},v=>({contents:adapters[v.path],loader:'js'}));
    }}]});
  const file=join(tmp,'route.mjs');await writeFile(file,output.outputFiles[0].text);
  const {POST,NextRequest}=await import(pathToFileURL(file));
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
    assert.equal(url.pathname,'/rest/v1/rpc/'+rpcName);assert.equal(url.search,'');
    assert.equal(init.method,'POST');assert.equal(init.cache,'no-store');
    const proof=new Headers(init.headers).get('x-academyos-gateway');
    assert.ok(proof);const subject=JSON.parse(proof).subject;
    assert.equal(subject,state.subject);
    const response=await db({action:'rpc',target:rpcName,subject,proof,args:JSON.parse(init.body)});
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
  await mkdir(directory,{recursive:true});
  await writeFile(evidence,JSON.stringify({passed:true,hashes,checks,metrics,environment:{node:process.version,
    platform:process.platform,architecture:process.arch,scope:'Actual Next POST, Supabase SDK and signed gateway to disposable PostgreSQL17. Fictional Clerk, limiter and PostgREST wire; synthetic envelope. No hosted data, real key wrapping, browser storage, device or latency percentile claim.'}},null,2)+'\n');
}finally{
  globalThis.fetch=realFetch;delete globalThis.workspaceTransferFixture;
  if(pg&&pg.exitCode===null){
    if(db)await db({action:'close'});else pg.stdin.end();
    await pgExit;
  }
  for(const [key,value]of Object.entries(env))if(value===undefined)delete process.env[key];else process.env[key]=value;
  await rm(tmp,{recursive:true,force:true});
}
