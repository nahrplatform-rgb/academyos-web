// Actual sender, IndexedDB, Next handler, signed gateway and PostgreSQL. The
// loopback bridge substitutes Clerk, Redis, key custody and PostgREST HTTP.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {chromium} from '@playwright/test';
import {build} from 'esbuild';

const root = resolve(import.meta.dirname, '../..'), require = createRequire(import.meta.url);
const evidence = join(root, 'docs/07-handoff/evidence/offline-register-dispatch-2026-11-04.json');
const sources = [
  'apps/web/src/app/api/register-dispatch/route.ts', 'apps/web/src/lib/register-original-dispatch.ts',
  'apps/web/src/lib/local-register-repository.ts', 'apps/web/src/lib/local-register-codec.ts',
  'apps/web/src/lib/local-register-crypto.ts', 'apps/web/src/lib/register-download.ts', 'apps/web/src/lib/attendance.ts',
  'apps/web/src/lib/onboarding-server.ts', 'apps/web/src/lib/onboarding-gateway.ts', 'apps/web/src/lib/onboarding.ts',
  'scripts/offline-register/test_dispatch.mjs', 'scripts/offline-register/dispatch_bridge.py',
  'scripts/register-download/test_boundary.py', 'supabase/migrations/20261029035928_attendance_register_batch.sql',
  'supabase/migrations/20261103165604_owner_register_download_contract.sql',
  'supabase/migrations/20261104002448_owner_register_original_dispatch.sql',
];
const hashes = Object.fromEntries(await Promise.all(sources.map(async p => [p,
  createHash('sha256').update(await readFile(join(root, p))).digest('hex')])));
if (process.argv.includes('--check')) {
  const receipt = JSON.parse(await readFile(evidence, 'utf8'));
  assert.equal(receipt.passed, true);
  assert.deepEqual(receipt.hashes, hashes);
  assert.ok(receipt.checks.length >= 13);
  console.log('PASS Owner register dispatch evidence matches sources');
  process.exit(0);
}

const tmp = await mkdtemp(join(tmpdir(), 'academyos-register-dispatch-'));
const rpcName = 'x18_owner_register_dispatch_v1';
const stage = 'https://staging.academy.nahr.dev';
const state = {subject: 'user_owner', sessions: 0, limits: [], calls: [], refusedBudget: null};
const checks = [], attempts = [], metrics = {};
const pass = name => {checks.push(name);console.log('PASS ' + name);};
const realFetch = globalThis.fetch;
let pg, pgExit, browser, page, server, held;

try {
  const adapters = {
    clerk: `export async function auth(){const s=globalThis.dispatchFixture;s.sessions++;
      return {userId:s.subject,getToken:async()=>s.subject?'synthetic-token':null};}
      export async function clerkClient(){throw new Error('Unexpected provider directory call');}`,
    limiter: `export const stagingRedis=()=>({}),rateLimitSubject=s=>s;
      export function rateLimitAllowed(r){return r.success&&r.reason!=='timeout';}
      export function stagingLimiter(_redis,prefix,limit){return{limit:async subject=>{
        const s=globalThis.dispatchFixture;s.limits.push({prefix,limit,subject});
        return s.refusedBudget===prefix?{success:true,reason:'timeout'}:{success:true};
      }}}`,
    serverOnly: '',
  };
  const output = await build({
    stdin: {contents: `export{POST}from'./apps/web/src/app/api/register-dispatch/route.ts';
      export{signProof}from'./apps/web/src/lib/onboarding.ts';export{NextRequest}from'next/server';`, resolveDir:root},
    bundle:true, platform:'node', format:'esm', write:false, packages:'external',
    plugins:[{name:'provider-fixtures',setup(b){
      b.onResolve({filter:/^(next\/server|@supabase\/supabase-js)$/},v=>({path:require.resolve(v.path),external:true}));
      b.onResolve({filter:/^@clerk\/nextjs\/server$/},()=>({path:'clerk',namespace:'fixture'}));
      b.onResolve({filter:/^(\.\/rate-limit|@\/lib\/rate-limit)$/},()=>({path:'limiter',namespace:'fixture'}));
      b.onResolve({filter:/^server-only$/},()=>({path:'serverOnly',namespace:'fixture'}));
      b.onLoad({filter:/.*/,namespace:'fixture'},v=>({contents:adapters[v.path],loader:'js'}));
    }}],
  });
  const moduleFile = join(tmp, 'route.mjs');
  await writeFile(moduleFile, output.outputFiles[0].text);
  const {POST, NextRequest, signProof} = await import(pathToFileURL(moduleFile));
  globalThis.dispatchFixture = state;
  const key = 'a'.repeat(64);
  Object.assign(process.env,{APP_ENV:'staging',ONBOARDING_PROOF_KEY:key,
    NEXT_PUBLIC_SUPABASE_URL:'https://snpphkenmvmhpjstbeul.supabase.co',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'synthetic-publishable-key'});
  delete process.env.LOCAL_REGISTER_DISPATCH_ENABLED;

  pg = spawn('python3', ['-u',join(root,'scripts/offline-register/dispatch_bridge.py')], {stdio:['pipe','pipe','inherit']});
  const pending = new Map();
  let sequence = 0, ready;
  const started = new Promise(resolve => {ready = resolve;});
  pgExit = new Promise(resolve => pg.once('close', code => {
    for (const request of pending.values()) request.reject(new Error(`PG fixture exited (${code})`));
    resolve(code);
  }));
  createInterface({input:pg.stdout}).on('line',line=>{
    const reply = JSON.parse(line);
    if (reply.ready) {ready();return;}
    const request = pending.get(reply.id);
    pending.delete(reply.id);
    if (reply.error) request.reject(new Error(reply.error));
    else request.resolve(reply.value);
  });
  await Promise.race([started,pgExit.then(code=>{throw new Error(`PG setup exited (${code})`);})]);
  const db = request => new Promise((resolve,reject)=>{
    const id = ++sequence;pending.set(id,{resolve,reject});
    pg.stdin.write(JSON.stringify({...request,id})+'\n');
  });
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, process.env.NEXT_PUBLIC_SUPABASE_URL);
    assert.equal(url.pathname, '/rest/v1/rpc/' + rpcName);
    assert.equal(init.method, 'POST');
    const proof = new Headers(init.headers).get('x-academyos-gateway');
    const subject = JSON.parse(proof).subject;
    state.calls.push({subject});
    const result = await db({action:'rpc',args:JSON.parse(init.body),subject,proof});
    return result.error ? Response.json({code:result.error,message:'Fixture refusal'},
      {status:result.error==='42501'?403:409}) : Response.json(result.data);
  };
  const request = (body, subject='user_owner', origin=stage) => POST(new NextRequest(stage+'/api/register-dispatch',{
    method:'POST',headers:{origin,'content-type':'application/json','x-academyos-original-subject':subject},body,
  }));
  const sample = {action:'register',academy:randomUUID(),event:randomUUID(),op:randomUUID(),
    captured_at:'2026-11-04T00:00:00.123Z',marks:[{player:randomUUID(),status:'present',version:0}]};
  assert.equal((await request(JSON.stringify(sample))).status,503);
  assert.equal(state.sessions,0);
  process.env.LOCAL_REGISTER_DISPATCH_ENABLED = 'true';
  assert.equal((await request(JSON.stringify(sample),'user_owner','https://foreign.example')).status,403);
  for (const body of [{...sample,action:'reconcile'},{...sample,role:'owner'},{...sample,marks:[]},
    {...sample,padding:'x'.repeat(131072)}]) assert.ok([413,422].includes((await request(JSON.stringify(body))).status));
  assert.equal(state.sessions,0);assert.equal(state.calls.length,0);
  assert.equal(await db({action:'acl'}),'f');
  pass('Closed default, foreign origin, invalid/oversized packets and anonymous RPC permission all fail before an operating call');

  const entry = await build({
    stdin:{contents:`
      import{openLocalRegister}from'./apps/web/src/lib/local-register-repository.ts';
      import{registerOriginalDispatch}from'./apps/web/src/lib/register-original-dispatch.ts';
      window.openFixture=async(scope,ticket)=>{
        window.repo=await openLocalRegister(scope);
        if(ticket)await window.repo.activate(ticket,await window.repo.beginActivation());
        window.scopeLifetime=new AbortController();
        window.send=registerOriginalDispatch(window.repo,window.scopeLifetime.signal);
      };
      window.abortNextOriginalWrite=()=>{
        const old=IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put=function(...args){
          if(this.name==='originals'){
            IDBObjectStore.prototype.put=old;this.transaction.abort();throw new Error('injected_disk_abort');
          }
          return old.apply(this,args);
        };
      };
      window.ready=true;`,resolveDir:root},
    bundle:true,platform:'browser',format:'esm',write:false,
  });
  let fault = null;
  server = createServer(async (req,res) => {
    if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><script type="module" src="/test.js"></script>');return;}
    if(req.url==='/test.js'){res.setHeader('content-type','text/javascript');res.end(entry.outputFiles[0].text);return;}
    if(req.url!=='/api/register-dispatch'){res.writeHead(404).end();return;}
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const wire = Buffer.concat(chunks).toString('utf8');
    const attempt = {wire,requestBytes:Buffer.byteLength(wire),responseBytes:0};
    attempts.push(attempt);
    const outcome = await request(wire,req.headers['x-academyos-original-subject']);
    const body = await outcome.text();
    attempt.responseBytes = Buffer.byteLength(body);
    const mode = fault;fault=null;
    if(mode==='drop'){
      // Once headers and part of the response arrive, Chrome cannot transparently
      // replay the connection as it may when a socket closes before any reply.
      res.writeHead(outcome.status,{'content-type':'application/json','content-length':Buffer.byteLength(body)});
      res.write(body.slice(0,8),()=>setImmediate(()=>res.destroy()));
      return;
    }
    if(mode==='hold'){
      await new Promise(resolve=>{held={release:resolve};});
      held=null;
    }
    res.writeHead(outcome.status,{'content-type':'application/json','cache-control':outcome.headers.get('cache-control')});
    if(mode==='forged')res.end(JSON.stringify({data:{...JSON.parse(body).data,count:999}}));
    else if(mode==='oversized')res.end('x'.repeat(2048));
    else res.end(body);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  async function launch(){
    browser=await chromium.launchPersistentContext(join(tmp,'profile'),{headless:true});
    page=browser.pages()[0];await page.goto(origin);await page.waitForFunction(()=>window.ready);
  }
  await launch();
  const call=(method,...args)=>page.evaluate(({method,args})=>window.repo[method](...args),{method,args});
  const send=event=>page.evaluate(event=>window.send(event),event);
  const open=(scope,ticket)=>page.evaluate(({scope,ticket})=>window.openFixture(scope,ticket),{scope,ticket});
  async function fixture(subject='user_owner',size=18){
    const {academy,event,manifest,pages,complete}=await db({action:'fixture',size});
    const scope={namespace:randomUUID(),environment:'staging',subject,academy,
      device:'fictional_device',epoch:'fields_v1',capability:'owner-register-v1'};
    const binding=JSON.stringify([1,scope.environment,subject,academy,scope.device,scope.epoch,scope.capability,scope.namespace]);
    const ticket={binding,keyId:'test_recovery',material:randomBytes(32).toString('base64'),verifiedAt:Date.now()};
    await open(scope,ticket);
    const transfer=randomUUID();
    await call('beginImport',event,transfer,manifest);
    let after=null;
    for(const page of pages){
      await call('appendPage',event,transfer,after,page.roster,page);
      after=page.receipt.payload.cursor;
    }
    await call('finalizeTransfer',event,transfer,complete);
    const packet={action:'register',academy,event,op:randomUUID(),captured_at:manifest.header.server_now,
      marks:pages.flatMap(p=>p.roster.players.map((player,i)=>({player:player.id,status:i%2?'absent':'present',version:0})))};
    return {scope,ticket,packet,academy,event,op:packet.op};
  }
  const capture=async f=>{
    await call('captureRegister',f.packet);
    return (await call('readOriginal',f.op)).wire;
  };
  const original=f=>call('readOriginal',f.op);
  const counts=f=>db({action:'counts',academy:f.academy,event:f.event,op:f.op});
  const empty={marks:0,history:0,operations:0,audit:0};
  const heldReply=async f=>{
    fault='hold';
    await page.evaluate(event=>{window.result=window.send(event).catch(e=>({error:e.message}));},f.event);
    for(let i=0;!held&&i<500;i++)await new Promise(resolve=>setTimeout(resolve,10));
    assert.ok(held,'Expected held server reply');
  };
  const result=()=>page.evaluate(()=>window.result);

  const first=await fixture();
  await browser.setOffline(true);
  const wire=await capture(first);
  assert.equal((await original(first)).state,'pending');
  assert.equal(attempts.length,0);
  await browser.setOffline(false);
  fault='drop';
  assert.deepEqual(await send(first.event),{kind:'unknown'});
  assert.equal((await original(first)).state,'unknown');
  assert.deepEqual(await counts(first),{marks:18,history:18,operations:1,audit:1});
  await browser.close();await launch();await open(first.scope);
  assert.equal((await call('readActiveOriginal',first.event)).wire,wire);
  const start=performance.now();
  assert.deepEqual(await send(first.event),{kind:'confirmed'});
  metrics.replayMs=performance.now()-start;
  assert.deepEqual(attempts.map(a=>a.wire),[wire,wire]);
  assert.deepEqual(state.limits.map(x=>x.prefix),['attendance-entry-write','attendance-write','attendance-entry-write','attendance-write']);
  assert.ok(state.limits.every(x=>x.limit===60));
  assert.deepEqual(await counts(first),{marks:18,history:18,operations:1,audit:1});
  assert.equal((await original(first)).state,'confirmed');
  const view=await call('readPage',first.event);
  assert.equal(view.header.saved,0);assert.equal(view.needsCurrentRead,true);
  assert.deepEqual(await send(first.event),{kind:'none'});assert.equal(attempts.length,2);
  metrics.lostReply={httpAttempts:2,signedRpcs:2,requestBytes:attempts[0].requestBytes,receiptBytes:attempts[1].responseBytes};
  pass('Offline capture and lost reply survive browser process restart; exact replay records one 18-player batch and invalidates the old roster without reloading it');

  const failed=await fixture();await capture(failed);
  await page.evaluate(()=>window.abortNextOriginalWrite());
  const before=attempts.length;
  await assert.rejects(send(failed.event),/injected_disk_abort/);
  assert.equal(attempts.length,before);assert.equal((await original(failed)).state,'pending');
  await heldReply(failed);assert.equal((await original(failed)).state,'unknown');
  await page.evaluate(()=>window.abortNextOriginalWrite());held.release();
  assert.match((await result()).error,/injected_disk_abort/);
  assert.equal((await original(failed)).state,'unknown');
  assert.equal((await call('readPage',failed.event)).needsCurrentRead,false);
  assert.deepEqual(await send(failed.event),{kind:'confirmed'});
  assert.deepEqual(await counts(failed),{marks:18,history:18,operations:1,audit:1});
  pass('A failed pre-send disk commit stops transport and a failed receipt commit preserves the exact recoverable Unknown original');

  const bad=await fixture();await capture(bad);
  for(const mode of ['forged','oversized']){
    fault=mode;assert.deepEqual(await send(bad.event),{kind:'unknown'});
    assert.equal((await original(bad)).state,'unknown');
  }
  assert.deepEqual(await send(bad.event),{kind:'confirmed'});
  assert.deepEqual(await counts(bad),{marks:18,history:18,operations:1,audit:1});
  pass('A wrong-count or oversized reply cannot settle; a later correlated receipt confirms the same operation');

  const other=await fixture();await capture(other);
  await db({action:'switch_owner',academy:other.academy,subject:'user_other_owner'});
  state.subject='user_other_owner';
  const callCount=state.calls.length;
  assert.deepEqual(await send(other.event),{kind:'unknown'});
  assert.equal(state.calls.length,callCount);
  assert.deepEqual(await counts(other),empty);
  state.subject=null;assert.deepEqual(await send(other.event),{kind:'unknown'});
  assert.equal(state.calls.length,callCount);state.subject='user_owner';
  await db({action:'switch_owner',academy:other.academy,subject:'user_owner'});
  assert.deepEqual(await send(other.event),{kind:'confirmed'});
  pass('Another current Owner and a missing session cannot dispatch this account’s original; the original account can recover');

  const trainer=await fixture('user_trainer');await capture(trainer);
  state.subject='user_trainer';
  assert.deepEqual(await send(trainer.event),{kind:'needs_review',refusal:'denied'});
  assert.deepEqual(await counts(trainer),empty);state.subject='user_owner';
  pass('A signed request from the eligible assigned Trainer is refused by the new current Owner gate');

  for(const [action,refusal]of [['role','denied'],['withdraw','denied'],['expire','deadline'],['cancel','conflict'],['mark','conflict']]){
    const f=await fixture(),savedWire=await capture(f);
    await db({action,academy:f.academy,event:f.event,op:f.op,player:f.packet.marks[0].player});
    assert.deepEqual(await send(f.event),{kind:'needs_review',refusal});
    const count=attempts.length;
    assert.deepEqual(await send(f.event),{kind:'needs_review',refusal});
    assert.equal(attempts.length,count);assert.equal((await original(f)).wire,savedWire);
    assert.equal((await counts(f)).audit,0);
    assert.equal((await counts(f)).marks,action==='mark'?1:0);
    pass(`Server ${action} retains the original for ${refusal} review and creates no batch side effects or repeat request`);
  }

  const foreign=await db({action:'foreign_owner'});
  state.subject='user_other_owner';
  assert.equal((await request(JSON.stringify({...sample,academy:foreign,event:first.event}),state.subject)).status,403);
  const replayArgs = {a:first.academy,ev:first.event,marks:first.packet.marks,
    captured_at:first.packet.captured_at,op:first.op,expected_subject:'user_owner'};
  assert.equal((await db({action:'rpc',subject:'user_owner',args:replayArgs})).error,'42501');
  const proof = JSON.stringify(signProof('gateway','POST:/rpc/'+rpcName,'user_owner',[],key));
  assert.equal((await db({action:'rpc',subject:'user_owner',proof,
    args:{...replayArgs,expected_subject:'user_other_owner'}})).error,'42501');
  state.subject='user_owner';
  pass('Database wrapper refuses a foreign academy, unsigned caller and signed Owner with a mismatched original account');

  const limited=await fixture();await capture(limited);
  const limitedCalls=state.calls.length;
  for(const bucket of ['attendance-entry-write','attendance-write']){
    state.refusedBudget=bucket;assert.deepEqual(await send(limited.event),{kind:'unknown'});
    assert.equal(state.calls.length,limitedCalls);
  }
  state.refusedBudget=null;
  assert.deepEqual(await counts(limited),empty);
  pass('Both write budgets fail closed on timeout and preserve the same original for deliberate retry');

  const cancelled=await fixture();await capture(cancelled);
  await heldReply(cancelled);
  const coalesced=await page.evaluate(event=>window.send(event)===window.send(event),cancelled.event);
  assert.equal(coalesced,true);
  await page.evaluate(()=>window.scopeLifetime.abort());held.release();
  assert.ok((await result()).error);assert.equal((await original(cancelled)).state,'unknown');
  assert.deepEqual(await counts(cancelled),{marks:18,history:18,operations:1,audit:1});
  pass('Overlapping calls coalesce, and departing scope refuses a late acknowledgement after a real commit');

  const logout=await fixture();await capture(logout);
  await heldReply(logout);
  await call('quarantine','logout');
  await call('activate',logout.ticket,await call('beginActivation'));
  held.release();assert.match((await result()).error,/scope_changed/);
  assert.equal((await original(logout)).state,'unknown');
  assert.deepEqual(await send(logout.event),{kind:'confirmed'});
  assert.deepEqual(await counts(logout),{marks:18,history:18,operations:1,audit:1});
  pass('Logout and same-account reactivation fence the previous receipt; recovery works after read replicas were removed');

  const concurrent=await fixture(),concurrentWire=await capture(concurrent);
  const beforeRace=attempts.length;
  await heldReply(concurrent);
  const tab=await browser.newPage();
  await tab.goto(origin);await tab.waitForFunction(()=>window.ready);
  await tab.evaluate(scope=>window.openFixture(scope),concurrent.scope);
  assert.deepEqual(await tab.evaluate(event=>window.send(event),concurrent.event),{kind:'confirmed'});
  held.release();
  assert.deepEqual(await result(),{kind:'confirmed'});
  assert.deepEqual(attempts.slice(beforeRace).map(a=>a.wire),[concurrentWire,concurrentWire]);
  assert.deepEqual(await counts(concurrent),{marks:18,history:18,operations:1,audit:1});
  await tab.close();
  pass('Two tabs replaying the same Unknown original accept one durable receipt with one database effect');

  const large=await fixture('user_owner',1000);await capture(large);
  const largeStart=performance.now();
  assert.deepEqual(await send(large.event),{kind:'confirmed'});
  metrics.fullRegister={httpAttempts:1,requestBytes:attempts.at(-1).requestBytes,
    receiptBytes:attempts.at(-1).responseBytes,elapsedMs:performance.now()-largeStart};
  assert.deepEqual(await counts(large),{marks:1000,history:1000,operations:1,audit:1});
  pass('The complete 1000-mark register settles through one POST with a bounded count receipt');

  await writeFile(evidence,JSON.stringify({passed:true,hashes,checks,metrics,environment:{
    node:process.version,platform:process.platform,architecture:process.arch,browser:browser.browser().version(),
    scope:'Loopback actual Next handler, Supabase SDK and signed gateway, disposable PG17, persistent Chromium. Fictional Clerk, limiter, key custody and PostgREST bridge. No hosted or physical-device verification.',
  }},null,2)+'\n');
} finally {
  held?.release();
  await browser?.close();
  if(server?.listening)await new Promise(resolve=>server.close(resolve));
  globalThis.fetch=realFetch;
  if(pg){pg.stdin.end(JSON.stringify({action:'close'})+'\n');await pgExit;}
  await rm(tmp,{recursive:true,force:true});
}
