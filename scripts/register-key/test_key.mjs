// Real Next handler, Supabase SDK, signed gateway, crypto and PG17.
// Clerk session, limiter responses and PostgREST transport are isolated adapters.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {pilotCases} from './pilot_cases.mjs';

const root = resolve(import.meta.dirname,'../..'), require = createRequire(import.meta.url);
const evidence = join(root,'docs/07-handoff/evidence/owner-register-key-2026-11-04.json');
const sources = [
  'apps/web/src/app/api/register-key/route.ts', 'apps/web/src/lib/register-key-server.ts',
  'apps/web/src/lib/onboarding-server.ts', 'apps/web/src/lib/onboarding-gateway.ts',
  'apps/web/src/lib/onboarding.ts', 'apps/web/src/lib/local-register-repository.ts',
  'supabase/migrations/20261104012057_owner_register_key_custody.sql',
  'scripts/register-key/key_bridge.py', 'scripts/register-key/test_key.mjs', 'scripts/register-key/bound_fixture.py',
  'scripts/offline-register/dispatch_bridge.py', 'scripts/register-key/pilot_cases.mjs',
  'apps/web/src/app/api/register-download/route.ts', 'apps/web/src/app/api/register-dispatch/route.ts',
  'apps/web/src/lib/owner-register-pilot.ts', 'apps/web/src/lib/register-scope-transport.ts',
  'apps/web/src/lib/register-download-coordinator.ts', 'apps/web/src/lib/register-original-dispatch.ts',
  'supabase/migrations/20261104013632_owner_register_bound_transport.sql',
  'supabase/migrations/20261106174606_owner_register_binding_conflict.sql',
];
const hashes = Object.fromEntries(await Promise.all(sources.map(async file=>[file,
  createHash('sha256').update(await readFile(join(root,file))).digest('hex')])));
if (process.argv.includes('--check')) {
  const receipt = JSON.parse(await readFile(evidence,'utf8'));
  assert.deepEqual(receipt.hashes,hashes);
  assert.equal(receipt.checks.length,18);
  console.log('PASS EX-09 key receipt source fingerprints');
  process.exit(0);
}

const stage = 'https://staging.academy.nahr.dev';
const targets = new Set(['x19_owner_register_key_v1','x20_register_download_v1','x20_register_dispatch_v1']);
const owner = 'user_owner', key = 'a'.repeat(64);
const state = {subject:owner, hasToken:true, sessions:0, calls:0, deniedBudget:false, limits:[]};
const checks = [];
const pass = name => {checks.push(name); console.log('PASS '+name);};
const temp = await mkdtemp(join(tmpdir(),'academyos-register-key-'));
const realFetch = globalThis.fetch;
let pg, exited, server, browser;
try {
  const adapters = {
    clerk: `export async function auth(){
      const s=globalThis.keyFixture;s.sessions++;
      return {userId:s.subject,getToken:async()=>s.hasToken?'fictional-session-token':null};
    }
    export async function clerkClient(){throw new Error('Unexpected directory request');}`,
    limiter: `export const stagingRedis=()=>({}),rateLimitSubject=s=>s,
      rateLimitAllowed=r=>r.success&&r.reason!=='timeout';
      export function stagingLimiter(_,prefix,max){return{limit:async()=>{
        const s=globalThis.keyFixture;s.limits.push([prefix,max]);
        return s.deniedBudget?{success:true,reason:'timeout'}:{success:true};
      }}}`,
    serverOnly: '',
  };
  const code = await build({
    stdin:{contents:`export{POST}from'./apps/web/src/app/api/register-key/route.ts';
      export{POST as download}from'./apps/web/src/app/api/register-download/route.ts';
      export{POST as dispatch}from'./apps/web/src/app/api/register-dispatch/route.ts';
      export{NextRequest}from'next/server';`,resolveDir:root},
    bundle:true,write:false,platform:'node',format:'esm',packages:'external',
    plugins:[{name:'key-fixture',setup(b){
      b.onResolve({filter:/^(next\/server|@supabase\/supabase-js)$/},x=>({path:require.resolve(x.path),external:true}));
      b.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:'clerk',namespace:'fixture'}));
      b.onResolve({filter:/^(\.\/rate-limit|@\/lib\/rate-limit)$/},()=>({path:'limiter',namespace:'fixture'}));
      b.onResolve({filter:/^server-only$/},()=>({path:'serverOnly',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},x=>({contents:adapters[x.path],loader:'js'}));
    }}],
  });
  const entry = join(temp,'route.mjs');
  await writeFile(entry,code.outputFiles[0].text);
  const {POST,NextRequest,download,dispatch} = await import(pathToFileURL(entry));
  globalThis.keyFixture = state;
  const wrappingKey = randomBytes(32).toString('hex');
  Object.assign(process.env,{APP_ENV:'staging',ONBOARDING_PROOF_KEY:key,
    LOCAL_REGISTER_WRAP_KEY_V1:wrappingKey, NEXT_PUBLIC_SUPABASE_URL:'https://snpphkenmvmhpjstbeul.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-publishable-key'});
  delete process.env.LOCAL_REGISTER_KEY_ENABLED;

  pg = spawn('python3',['-u',join(root,'scripts/register-key/key_bridge.py')],{stdio:['pipe','pipe','inherit']});
  const pending = new Map();
  let sequence = 0, ready;
  const started = new Promise(resolve=>{ready=resolve;});
  exited = new Promise(resolve=>pg.once('close',code=>{
    for (const entry of pending.values()) entry.reject(new Error('Key fixture database exited'));
    resolve(code);
  }));
  createInterface({input:pg.stdout}).on('line',line=>{
    const message = JSON.parse(line);
    if (message.ready) {ready();return;}
    const entry=pending.get(message.id);
    pending.delete(message.id);
    if (message.error) entry.reject(new Error(message.error));
    else entry.resolve(message.value);
  });
  await Promise.race([started,exited.then(()=>{throw new Error('Key fixture database setup failed');})]);
  const db = command => new Promise((resolve,reject)=>{
    const id=++sequence;
    pending.set(id,{resolve,reject});
    pg.stdin.write(JSON.stringify({...command,id})+'\n');
  });
  let alterProof, alterReply, previous;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin,process.env.NEXT_PUBLIC_SUPABASE_URL);
    const target = url.pathname.slice('/rest/v1/rpc/'.length);
    assert.equal(url.pathname,'/rest/v1/rpc/'+target);
    assert.ok(targets.has(target));
    assert.equal(init.method,'POST');
    const headers = new Headers(init.headers);
    assert.equal(headers.get('authorization'),'Bearer fictional-session-token');
    const proof = headers.get('x-academyos-gateway');
    const args = JSON.parse(init.body);
    state.calls++;
    previous = {action:'rpc',target,args,subject:JSON.parse(proof).subject,proof};
    const result = await db({...previous,proof:alterProof ? alterProof(proof) : proof});
    return result.error ? Response.json({code:result.error,message:'Fixture refusal'},
      {status:result.error==='42501'?403:400}) : Response.json(alterReply ? alterReply(result.data) : result.data);
  };
  const call = (input,origin=stage) => POST(new NextRequest(stage+'/api/register-key',{
    method:'POST',headers:{origin,'content-type':'application/json'},
    body:typeof input==='string'?input:JSON.stringify(input),
  }));
  async function result(command) {
    const response=await call(command);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const body = await response.json();
    assert.deepEqual(Object.keys(body),['data']);
    const value=body.data;
    assert.deepEqual(Object.keys(value).sort(),['event','scope','ticket']);
    assert.equal(value.event,command.event);
    assert.deepEqual(value.scope,{environment:'staging',subject:command.subject,academy:command.academy,
      device:command.device,epoch:'fields_v1',capability:'owner-register-v1',namespace:value.scope.namespace});
    assert.deepEqual(JSON.parse(value.ticket.binding),[1,'staging',command.subject,command.academy,
      command.device,'fields_v1','owner-register-v1',value.scope.namespace]);
    assert.equal(value.ticket.keyId,'register-recovery-v1');
    assert.equal(Buffer.from(value.ticket.material,'base64').length,32);
    assert.ok(Math.abs(Date.now()-value.ticket.verifiedAt)<10000);
    return value;
  }

  const f=await db({action:'make'}), other=await db({action:'make'});
  const prepare={action:'prepare',academy:f.academy,event:f.event,device:randomUUID(),subject:owner};
  assert.equal((await call(prepare)).status,503);
  process.env.LOCAL_REGISTER_KEY_ENABLED='true';
  assert.equal((await call(prepare,'https://wrong.example')).status,403);
  for(const bad of [{...prepare,role:'owner'}, {...prepare,device:'bad'}, {...prepare,action:'recover'}, '{']) {
    assert.equal((await call(bad)).status,422);
  }
  assert.equal((await call(' '.repeat(513))).status,413);
  assert.equal(state.sessions,0);
  assert.equal(state.calls,0);
  pass('Closed default, origin, strict field shape and streamed size bounds reject before authentication');

  state.subject=null;
  assert.equal((await call(prepare)).status,401);
  state.subject=owner;
  state.hasToken=false;
  assert.equal((await call(prepare)).status,401);
  state.hasToken=true;
  state.subject='user_other';
  assert.equal((await call(prepare)).status,403);
  assert.equal(state.calls,0);
  state.subject=owner;
  state.deniedBudget=true;
  assert.equal((await call(prepare)).status,429);
  state.deniedBudget=false;
  assert.equal(state.calls,0);
  assert.deepEqual(state.limits.at(-1),['onboarding-write',10]);
  pass('Missing session or token, switched account and limiter timeout make zero database calls');

  assert.deepEqual(await db({action:'acl'}),{rls:true,anon_rpc:false,authenticated_table:false,authenticated_insert:false});
  alterProof=()=>null;
  assert.equal((await call(prepare)).status,403);
  alterProof=proof=>JSON.stringify({...JSON.parse(proof),issued:0});
  assert.equal((await call(prepare)).status,403);
  alterProof=undefined;
  assert.equal((await db({action:'inspect',academy:f.academy})).rows,0);
  pass('Direct, unsigned or stale-proof callers cannot create or release a key');

  const [first,retry]=await Promise.all([result(prepare),result(prepare)]);
  assert.equal(first.scope.namespace,retry.scope.namespace);
  assert.equal(first.ticket.material,retry.ticket.material);
  const persisted=await db({action:'inspect',academy:f.academy});
  assert.equal(persisted.rows,1);
  assert.equal(persisted.audit,1);
  assert.equal(Buffer.from(persisted.envelope,'base64url').length,60);
  assert.ok(!Buffer.from(persisted.envelope,'base64url').includes(Buffer.from(first.ticket.material,'base64')));
  const recover={...prepare,action:'recover',namespace:first.scope.namespace};
  assert.equal((await result(recover)).ticket.material,first.ticket.material);
  pass('Concurrent preparation persists one authenticated envelope, one audit row and one stable recoverable key');

  for(const wrong of [{...recover,namespace:randomUUID()},
    {...recover,academy:other.academy},
    {...prepare,event:other.event}]) assert.equal((await call(wrong)).status,403);
  state.subject='user_trainer';
  assert.equal((await call({...recover,subject:state.subject})).status,403);
  state.subject='user_other';
  assert.equal((await call({...recover,subject:state.subject})).status,403);
  state.subject=owner;
  assert.deepEqual(await db({action:'inspect',academy:f.academy}),persisted);
  pass('Wrong account, role, academy, event, browser or namespace cannot recover or replace the pilot slot');

  for (const wrong of [{...prepare,device:randomUUID()},{...recover,device:randomUUID()},
    {...recover,event:other.event}]) {
    const response=await call(wrong);
    assert.equal(response.status,409);
    assert.deepEqual(await response.json(),{error:'register_binding_conflict'});
  }
  assert.deepEqual(await db({action:'inspect',academy:f.academy}),persisted);
  assert.equal((await result(recover)).ticket.material,first.ticket.material);
  pass('Different device receives the typed binding refusal without replacing the envelope or audit; original key remains recoverable');

  for (const spoof of [{error:'register_binding_conflict',extra:true},{error:'register_binding_conflict',namespace:first.scope.namespace},
    {error:'other'},'register_binding_conflict']) {
    alterReply=()=>spoof;
    assert.equal((await call(recover)).status,503);
  }
  alterReply=undefined;
  assert.deepEqual(await db({action:'inspect',academy:f.academy}),persisted);
  pass('Malformed or extra-field binding replies fail closed rather than impersonating the typed refusal');

  const second=await result({...prepare,academy:other.academy,event:other.event});
  assert.notEqual(second.ticket.material,first.ticket.material);
  const foreign=await db({action:'inspect',academy:other.academy});
  alterReply=value=>({...value,wrapped:foreign.envelope});
  assert.equal((await call(recover)).status,503);
  alterReply=undefined;
  process.env.LOCAL_REGISTER_WRAP_KEY_V1=randomBytes(32).toString('hex');
  assert.equal((await call(recover)).status,503);
  delete process.env.LOCAL_REGISTER_WRAP_KEY_V1;
  const before=state.calls;
  assert.equal((await call(recover)).status,503);
  assert.equal(state.calls,before);
  process.env.LOCAL_REGISTER_WRAP_KEY_V1=wrappingKey;
  assert.equal((await result(recover)).ticket.material,first.ticket.material);
  assert.deepEqual(await db({action:'inspect',academy:f.academy}),persisted);
  pass('Swapped envelope, wrong wrapping root and missing configuration fail without overwriting stored work');

  assert.ok(await db({action:'suspend',academy:f.academy}));
  assert.equal((await call(recover)).status,403);
  assert.equal((await call(prepare)).status,403);
  assert.deepEqual(await db({action:'inspect',academy:f.academy}),persisted);
  assert.ok(await db({action:'restore',academy:f.academy}));
  assert.equal((await result(recover)).ticket.material,first.ticket.material);
  pass('Current Owner suspension blocks key release; verified restoration recovers the original key');

  assert.ok(await db({action:'withdraw',academy:f.academy}));
  assert.equal((await call(prepare)).status,403);
  assert.equal((await result(recover)).ticket.material,first.ticket.material);
  assert.deepEqual(await db({action:'inspect',academy:f.academy}),persisted);
  pass('Withdrawn register cannot prepare; current Owner can recover the existing pending-work key');

  assert.ok(state.limits.every(x=>x[0]==='onboarding-write'&&x[1]===10));
  const one=await db({...previous,args:{...previous.args,expected_subject:'user_other'}});
  assert.equal(one.error,'42501');
  pass('Bounded signed RPC enforces the original subject independently of the application fence');

  const calls = [];
  const handlers = {'/api/register-key':POST,'/api/register-download':download,'/api/register-dispatch':dispatch};
  const api = (path,body,headers={})=>handlers[path](new NextRequest(stage+path,{
    method:'POST',headers:{origin:stage,'content-type':'application/json',...headers},body,
  }));
  process.env.LOCAL_REGISTER_TRANSFER_ENABLED='true';
  process.env.LOCAL_REGISTER_DISPATCH_ENABLED='true';
  const browserCode = await build({stdin:{contents:`
    import {ownerRegisterPilot} from './apps/web/src/lib/owner-register-pilot';
    window.openPilot=input=>{window.lifetime=new AbortController();window.pilot=ownerRegisterPilot(input,window.lifetime.signal);};
  `,resolveDir:root},bundle:true,write:false,platform:'browser',format:'esm'});
  server=createServer(async (req,res)=>{
    if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>Fictional register lifecycle</title><script type="module" src="/pilot.js"></script>');return;}
    if(req.url==='/pilot.js'){res.setHeader('content-type','text/javascript');res.end(browserCode.outputFiles[0].text);return;}
    if(!handlers[req.url]||req.method!=='POST'){res.writeHead(404).end();return;}
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=Buffer.concat(chunks).toString('utf8');
    const headers=Object.fromEntries(Object.entries(req.headers).filter(([name])=>name.startsWith('x-academyos-')));
    const response=await api(req.url,body,headers);
    calls.push({path:req.url,body,status:response.status});
    res.writeHead(response.status,{'content-type':'application/json','cache-control':'no-store'}).end(await response.text());
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  browser=await chromium.launch();
  const lifecycle = await pilotCases({browser,origin:`http://127.0.0.1:${server.address().port}`,db,api,calls,
    pass,state,result,owner});
  const receipt={checks, hashes, measurements:{rpcAttempts:state.calls,logicalLimiterChecks:state.limits.length,
    storedEnvelopeBytes:60, browserMaterialBytes:32, lifecycle}};
  if(process.argv.includes('--record')) await writeFile(evidence,JSON.stringify(receipt,null,2)+'\n');
} finally {
  await browser?.close();
  if (server?.listening) await new Promise(resolve=>server.close(resolve));
  globalThis.fetch=realFetch;
  delete globalThis.keyFixture;
  if (pg?.exitCode===null) pg.stdin.end();
  if (exited) await exited;
  await rm(temp,{recursive:true,force:true});
}
