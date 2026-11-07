// Actual route/protocol/repository + real Chromium/IDB + disposable PG17.
// Only identity, key custody, rate backend and PostgREST transport are fixtures.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import {createInterface} from 'node:readline';
import {createHash, randomBytes, randomUUID} from 'node:crypto';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';

const root = resolve(import.meta.dirname, '../..'), require = createRequire(import.meta.url);
const sources = ['apps/web/src/lib/register-download.ts', 'apps/web/src/lib/register-download-coordinator.ts',
  'apps/web/src/app/api/register-download/route.ts', 'apps/web/src/lib/local-register-repository.ts',
  'apps/web/src/lib/local-register-codec.ts', 'apps/web/src/lib/local-register-crypto.ts',
  'apps/web/src/lib/onboarding-gateway.ts', 'scripts/register-download/test_browser.mjs',
  'scripts/register-download/bridge.py', 'scripts/register-key/bound_fixture.py',
  'apps/web/src/lib/register-scope-transport.ts', 'supabase/migrations/20261104013632_owner_register_bound_transport.sql', 'scripts/register-download/test_boundary.py',
  'supabase/migrations/20261103165604_owner_register_download_contract.sql'];
const evidence = join(root, 'docs/07-handoff/evidence/register-download-browser.json');
const hashes = Object.fromEntries(await Promise.all(sources.map(async p => [p,
  createHash('sha256').update(await readFile(join(root, p))).digest('hex')])));
if (process.argv.includes('--check')) {
  const r = JSON.parse(await readFile(evidence, 'utf8'));
  assert.deepEqual(r.hashes, hashes); assert.equal(r.passed, true);
  assert.ok(r.checks.length >= 15 && r.checks.every(c => c.status === 'passed'));
  const db = JSON.parse(await readFile(join(root, 'docs/07-handoff/evidence/register-download-database.json')));
  assert.equal(db.passed, true);
  for (const [p, hash] of Object.entries(db.hashes)) assert.equal(createHash('sha256').update(await readFile(join(root, p))).digest('hex'), hash);
  console.log('PASS download browser and PG receipts match source; private enablement/hosted/security remain open');
  process.exit(0);
}
const temp = await mkdtemp(join(tmpdir(), 'academyos-register-download-'));
const checks = [], metrics = {}, requests = [], errors = [], external = [];
const pass = text => checks.push({case: text, status: 'passed'});
const bridge = spawn('python3', ['-u', join(root, 'scripts/register-download/bridge.py')], {stdio: ['pipe', 'pipe', 'pipe']});
let bridgeError = '', sequence = 0;
bridge.stderr.on('data', b => {bridgeError = (bridgeError + b).slice(-3000);});
const pending = new Map();
let readyResolve, readyReject;
const ready = new Promise((a,b) => {readyResolve=a;readyReject=b;});
const lines = createInterface({input: bridge.stdout});
lines.on('line', line => {
  const v = JSON.parse(line);
  if (v.ready) readyResolve();
  else {const p = pending.get(v.id); pending.delete(v.id); if (v.error) p?.reject(new Error(v.error+':'+p?.action)); else p?.resolve(v.data);}
});
bridge.on('exit', code => {
  if (code) {const e = new Error('Disposable PG bridge failed: ' + bridgeError);readyReject(e);for(const p of pending.values())p.reject(e);}
});
const db = (command) => new Promise((resolve,reject) => {
  const id = ++sequence;pending.set(id,{resolve,reject,action:command.action});bridge.stdin.write(JSON.stringify({...command,id})+'\n');
});
const adapters = {
  state: `export const state={session:0,rpcCalls:0,limits:[],who:'user_owner',rate:{success:true},execute:null};`,
  server: `import {state}from'test:state';export class JourneyError extends Error{constructor(code,http){super(code);this.code=code;this.http=http}}export async function onboardingSession(){state.session++;return{subject:state.who,client:{}}}export async function rpc(c,name,args){state.rpcCalls++;if(name!=='x20_register_download_v1')throw new Error('Unexpected RPC');try{return await state.execute(args,state.who)}catch{throw new JourneyError('denied',403)}}`,
  limiter: `import{state}from'test:state';export const stagingRedis=()=>({});export const rateLimitSubject=s=>s;export const rateLimitAllowed=r=>r.success&&r.reason!=='timeout';export function stagingLimiter(r,p,n){return{limit:async()=>{state.limits.push({prefix:p,limit:n});if(state.rate==='throw')throw new Error('Unavailable');return state.rate}}}`,
};
const api = (await build({stdin: {contents: `export{POST}from'${root}/apps/web/src/app/api/register-download/route.ts';export{NextRequest}from'next/server';export{state}from'test:state';`,resolveDir:root},
  bundle:true,write:false,format:'esm',platform:'node',packages:'external',plugins:[{name:'explicit-fixtures',setup(b){
    b.onResolve({filter:/^test:state$/},()=>({path:'state',namespace:'fixture'}));
    for(const [path,name]of[['@/lib/onboarding-server','server'],['@/lib/rate-limit','limiter']])b.onResolve({filter:new RegExp('^'+path+'$')},()=>({path:name,namespace:'fixture'}));
    b.onResolve({filter:/^next\/server$/},()=>({path:require.resolve('next/server'),external:true}));
    b.onLoad({filter:/.*/,namespace:'fixture'},v=>({contents:adapters[v.path],loader:'js'}));
  }}]})).outputFiles[0].text;
await writeFile(join(temp,'api.mjs'),api);
const {POST,NextRequest,state} = await import(pathToFileURL(join(temp,'api.mjs')));
const env = {APP_ENV: process.env.APP_ENV, LOCAL_REGISTER_TRANSFER_ENABLED: process.env.LOCAL_REGISTER_TRANSFER_ENABLED};
const browserEntry = `import{openLocalRegister,LOCAL_REGISTER_DATABASE}from'./apps/web/src/lib/local-register-repository.ts';
import{registerDownloadCoordinator}from'./apps/web/src/lib/register-download-coordinator.ts';import*as protocol from'./apps/web/src/lib/register-download.ts';
import{registerScopeHeaders}from'./apps/web/src/lib/register-scope-transport.ts';
window.protocol=protocol;window.repos={};window.scopes={};window.owners={};window.credentialCalls=0;
const no=()=>{window.credentialCalls++;throw new Error('Credentials forbidden')};Object.defineProperty(navigator,'credentials',{value:{create:no,get:no}});
window.open=async(s,ticket)=>{const r=await openLocalRegister(s);window.repos[s.namespace]=r;window.scopes[s.namespace]=s;if(ticket){const a=await r.beginActivation();await r.activate({...ticket,binding:a.binding},a)}};
window.call=async(ns,name,...args)=>window.repos[ns][name](...args);
window.owner=(ns,a)=>{const c=new AbortController();const o=registerDownloadCoordinator(window.repos[ns],a,async(command,signal)=>{const r=await fetch('/api/register-download',{method:'POST',headers:{'content-type':'application/json',...registerScopeHeaders(window.scopes[ns])},body:JSON.stringify(command),signal});if(!r.ok)throw new Error('http_'+r.status);return(await r.json()).data},c.signal);window.owners[ns]={c,...o}};
window.prepare=ns=>window.owners[ns].prepare(window.events[ns]);window.events={};
window.raw=async(work)=>{const q=indexedDB.open(LOCAL_REGISTER_DATABASE);const d=await new Promise((a,b)=>{q.onsuccess=()=>a(q.result);q.onerror=()=>b(q.error)});try{return await work(d)}finally{d.close()}};
window.removeStaged=async(ns,event,transfer)=>window.raw(d=>new Promise((a,b)=>{const t=d.transaction('rows','readwrite'),s=t.objectStore('rows'),q=s.openCursor(IDBKeyRange.bound([ns,event,transfer],[ns,event,transfer,[]]));q.onsuccess=()=>{if(q.result)q.result.delete()};t.oncomplete=a;t.onabort=()=>b(t.error)}));
window.abortHead=()=>{const old=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='heads'){IDBObjectStore.prototype.put=old;this.transaction.abort();throw new Error('Injected head abort')}return old.apply(this,args)}};
window.inspect=async()=>window.raw(d=>new Promise((a,b)=>{const t=d.transaction(['heads','imports','rows']);const result={};for(const name of ['heads','imports','rows']){const q=t.objectStore(name).getAll();q.onsuccess=()=>{result[name]=q.result}}t.oncomplete=()=>a(JSON.stringify(result));t.onabort=()=>b(t.error)}));
window.started=true;`;
const bundle = (await build({stdin:{contents:browserEntry,resolveDir:root},bundle:true,write:false,format:'esm',platform:'browser'})).outputFiles[0].text;
let holdComplete = false, blocked = null, failPageAt = 0, markBeforeComplete = null;
const server = createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  if(req.url==='/'||req.url==='/adapter.js'){res.setHeader('Content-Type',req.url==='/'?'text/html':'text/javascript');res.end(req.url==='/'?'<!doctype html><html lang="en"><meta charset="utf-8"><title>Fictional download test</title><script type="module" src="/adapter.js"></script></html>':bundle);return}
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return}
  if(req.url!=='/api/register-download'||req.method!=='POST'){res.writeHead(404);res.end();return}
  let text='';for await(const b of req)text+=b;
  const command=JSON.parse(text),entry={action:command.action,bytes:0,status:null,ms:0};requests.push(entry);
  const start=performance.now();
  if(failPageAt&&command.action==='page'&&!--failPageAt){res.writeHead(503);res.end('{}');entry.status=503;return}
  if(markBeforeComplete&&command.action==='complete'){const f=markBeforeComplete;markBeforeComplete=null;await db({action:'mark',...f})}
  const response=await POST(new NextRequest('https://staging.academy.nahr.dev/api/register-download',{method:'POST',headers:{origin:'https://staging.academy.nahr.dev','content-type':'application/json',
    'x-academyos-register-namespace':req.headers['x-academyos-register-namespace'],
    'x-academyos-register-device':req.headers['x-academyos-register-device'],
    'x-academyos-original-subject':req.headers['x-academyos-original-subject']},body:text}));
  const body=await response.text();entry.bytes=Buffer.byteLength(body);entry.status=response.status;entry.ms=performance.now()-start;
  if(holdComplete&&command.action==='complete'){blocked={res,body,status:response.status};return}
  res.writeHead(response.status,{'content-type':'application/json'});res.end(body);
});
let browser, context, page;
const waitComplete=async()=>{const deadline=Date.now()+15000;while(!blocked){if(Date.now()>deadline)throw new Error('No completion: '+JSON.stringify(await page.evaluate(()=>window.result)));await new Promise(a=>setTimeout(a,10))}};
const release=()=>{if(blocked){blocked.res.writeHead(blocked.status,{'content-type':'application/json'});blocked.res.end(blocked.body);blocked=null}holdComplete=false;};
try{
  await ready;
  state.execute=(args,who)=>db({action:'rpc',args,who});
  process.env.APP_ENV='staging';delete process.env.LOCAL_REGISTER_TRANSFER_ENABLED;
  const sample={action:'manifest',academy:randomUUID(),event:randomUUID(),expected:null,after:null};
  const send=(body,headers={})=>POST(new NextRequest('https://staging.academy.nahr.dev/api/register-download',{method:'POST',headers:{origin:'https://staging.academy.nahr.dev','content-type':'application/json','x-academyos-register-namespace':randomUUID(),
    'x-academyos-register-device':randomUUID(),'x-academyos-original-subject':'user_owner',...headers},body:JSON.stringify(body)}));
  let response=await send(sample);assert.equal(response.status,503);assert.equal(state.session,0);assert.equal(state.rpcCalls,0);
  pass('Default-closed API makes zero session/RPC calls; same-origin/no-store boundary retained');
  process.env.LOCAL_REGISTER_TRANSFER_ENABLED='true';
  for(const body of [{...sample,role:'owner'},{...sample,action:'save'},{...sample,after:randomUUID()},{...sample,huge:'x'.repeat(5000)}]){
    response=await send(body);assert.ok([413,422].includes(response.status));assert.equal(state.session,0);assert.equal(state.rpcCalls,0);
  }
  response=await send(sample,{origin:'https://foreign.example'});assert.equal(response.status,403);
  for(const rate of [{success:false},{success:true,reason:'timeout'},'throw']){state.rate=rate;response=await send(sample);assert.equal(response.status,rate==='throw'?503:429);assert.equal(state.rpcCalls,0)}
  assert.ok(state.limits.every(x=>x.prefix==='onboarding-entry-read'&&x.limit===60));state.rate={success:true};
  pass('Invalid/oversize/forged-scope bodies, foreign origin and exhausted/timed-out/unavailable limiter never reach the database');
  await new Promise(a=>server.listen(0,'127.0.0.1',a));const origin=`http://127.0.0.1:${server.address().port}`;
  browser=await chromium.launch();context=await browser.newContext();page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url())});
  const startPage=async()=>{await page.goto(origin);await page.waitForFunction(()=>window.started)};
  await startPage();
  const open=async(f,ns=randomUUID())=>{
    const scope={namespace:ns,environment:'staging',subject:'user_owner',academy:f.academy,device:randomUUID(),epoch:'fields_v1',capability:'owner-register-v1'};
    assert.equal(await db({action:'slot',...scope,event:f.event}),true);
    await page.evaluate(async({s,t,e})=>{await window.open(s,t);window.events[s.namespace]=e;window.owner(s.namespace,s.academy)},
      {s:scope,t:{keyId:'fictional_fixed_recovery',material:randomBytes(32).toString('base64'),verifiedAt:Date.now()},e:f.event});return scope;
  };
  const call=(s,name,...args)=>page.evaluate(({ns,name,args})=>window.call(ns,name,...args),{ns:s.namespace,name,args});
  const prepare=s=>page.evaluate(ns=>window.prepare(ns),s.namespace);
  const rejection=async(fn,pattern)=>{await assert.rejects(fn,pattern)};
  const fixture=size=>db({action:'fixture',size});
  const main=await fixture(60),s=await open(main);
  holdComplete=true;
  await page.evaluate(ns=>{window.result=window.prepare(ns).then(v=>({v}),e=>({error:e.message}))},s.namespace);
  await waitComplete();
  assert.equal((await call(s,'importStatus',main.event)).seen,60);
  await rejection(()=>call(s,'readPage',main.event),/not_downloaded/);
  pass('Final data page remains encrypted staging; complete row count alone never opens a register');
  release();assert.equal((await page.evaluate(()=>window.result)).v.kind,'prepared');
  const first=await call(s,'readPage',main.event);assert.equal(first.players.length,50);assert.equal(first.more,true);assert.equal(first.coherence,'verified-transfer');
  assert.equal((await call(s,'readPage',main.event,first.players.at(-1).id)).players.length,10);
  pass('Actual manifest/pages/completion through route and PG produce one authenticated local generation with bounded 50-row reads');
  let before=requests.length;assert.equal((await prepare(s)).kind,'unchanged');assert.deepEqual(requests.slice(before).map(r=>r.action),['manifest']);
  pass('Unchanged complete generation costs one current manifest and zero roster pages/completion requests');
  before=requests.length;
  await page.evaluate(async ns=>{const a=window.prepare(ns),b=window.prepare(ns);if(a!==b)throw new Error('Not coalesced');await Promise.all([a,b])},s.namespace);
  assert.equal(requests.length-before,1);pass('Two same-owner consumers coalesce into one transport without a settled private query cache');
  const wire={action:'register',academy:main.academy,event:main.event,op:randomUUID(),captured_at:first.header.server_now,
    marks:[{player:first.players[1].id,status:'present',version:0}]};
  await call(s,'captureRegister',wire);await call(s,'beginOriginal',wire.op);const original=await call(s,'readOriginal',wire.op);
  await db({action:'mark',...main});holdComplete=true;
  await page.evaluate(ns=>{window.result=window.prepare(ns).then(v=>({v}),e=>({error:e.message}))},s.namespace);
  await waitComplete();
  await page.evaluate(()=>window.abortHead());release();assert.match((await page.evaluate(()=>window.result)).error,/Injected head abort/);
  assert.equal((await call(s,'readPage',main.event)).header.saved,0);assert.equal((await call(s,'readOriginal',wire.op)).wire,original.wire);
  pass('Failed final transaction preserves previous complete coverage and exact unknown original intent; no fake saved totals');
  assert.equal((await prepare(s)).kind,'prepared');assert.equal((await call(s,'readPage',main.event)).header.saved,1);
  assert.equal((await call(s,'readOriginal',wire.op)).state,'unknown');
  pass('Retry after failed head commit reissues checked prefix and completes without replacing or cancelling an unknown attendance operation');
  const interrupted=await fixture(60),si=await open(interrupted);failPageAt=2;
  await rejection(()=>prepare(si),/http_503/);assert.equal((await call(si,'transferCheckpoint',interrupted.event)).receipt.payload.seen,50);
  await page.reload();await page.waitForFunction(()=>window.started);
  await page.evaluate(async({s,e})=>{await window.open(s);window.events[s.namespace]=e;window.owner(s.namespace,s.academy)},{s:si,e:interrupted.event});
  assert.equal((await prepare(si)).kind,'prepared');
  pass('Refresh/restart resumes encrypted cursor/receipt using automatic stored keys; no credential or per-page unlock call');
  const changed=await fixture(60),sc=await open(changed);holdComplete=true;
  await page.evaluate(ns=>{window.result=window.prepare(ns).then(v=>({v}),e=>({error:e.message}))},sc.namespace);
  await waitComplete();
  // The completion response was already checked; a subsequent mutation is a
  // later synchronization change, not a claim of instantaneous invalidation.
  release();assert.equal((await page.evaluate(()=>window.result)).v.kind,'prepared');
  await db({action:'mark',...changed});
  assert.equal((await prepare(sc)).kind,'prepared');assert.equal((await call(sc,'readPage',changed.event)).header.saved,1);
  pass('A later server mark changes the whole revision and replaces only read coverage; no claim of instant revocation from a receipt');
  const shifting=await fixture(60),ss=await open(shifting);markBeforeComplete=shifting;
  await rejection(()=>prepare(ss),/download_changed/);await rejection(()=>call(ss,'readPage',shifting.event),/not_downloaded/);
  assert.equal((await call(ss,'transferCheckpoint',shifting.event)).receipt.payload.seen,60);
  await rejection(()=>prepare(ss),/download_changed/);
  pass('Source changed after all data pages refuses completion and keeps staged evidence; next attempt never silently rebases the staged revision');
  const denied=await fixture(2),sd=await open(denied);await prepare(sd);await db({action:'revoke',academy:denied.academy});
  await rejection(()=>prepare(sd),/http_403/);assert.equal((await call(sd,'readPage',denied.event)).coherence,'verified-transfer');
  // Quarantine belongs to the actual authority/lifecycle caller, never to a
  // generic network error. Prove it fences/removes reads when known denial is applied.
  await call(sd,'quarantine','known_denial');await rejection(()=>call(sd,'readPage',denied.event),/account_verification_required/);
  pass('Current server revocation denies transport; explicit known-denial quarantine removes read access without treating an outage as denial');
  const corrupt=await fixture(60),sk=await open(corrupt);holdComplete=true;
  await page.evaluate(ns=>{window.result=window.prepare(ns).then(v=>({v}),e=>({error:e.message}))},sk.namespace);
  await waitComplete();
  const cp=await call(sk,'transferCheckpoint',corrupt.event);
  await page.evaluate(({ns,e,t})=>window.removeStaged(ns,e,t),{ns:sk.namespace,e:corrupt.event,t:cp.transfer});release();
  assert.match((await page.evaluate(()=>window.result)).error,/download_disk_coverage|import_changed/);
  await rejection(()=>call(sk,'readPage',corrupt.event),/not_downloaded/);
  pass('Missing actual staged ciphertext fails final bounded re-hash/count check; receipt counters cannot fabricate disk completeness');
  const cancelled=await fixture(60),sx=await open(cancelled);holdComplete=true;
  await page.evaluate(ns=>{window.result=window.prepare(ns).then(v=>({v}),e=>({error:e.message}))},sx.namespace);
  await waitComplete();
  await page.evaluate(ns=>window.owners[ns].c.abort(),sx.namespace);release();
  assert.ok((await page.evaluate(()=>window.result)).error);await rejection(()=>call(sx,'readPage',cancelled.event),/not_downloaded/);
  pass('Scope cancellation after server completion but before delivery refuses late local activation; no claim that database execution was cancelled');
  const racing=await fixture(60),sr=await open(racing);const tab=await context.newPage();await tab.goto(origin);await tab.waitForFunction(()=>window.started);
  await tab.evaluate(async({s,e})=>{await window.open(s);window.events[s.namespace]=e;window.owner(s.namespace,s.academy)},{s:sr,e:racing.event});
  const racingManifest=await page.evaluate(async ({f,s})=>{const r=await fetch('/api/register-download',{method:'POST',headers:{'content-type':'application/json','x-academyos-register-namespace':s.namespace,'x-academyos-register-device':s.device,'x-academyos-original-subject':s.subject},body:JSON.stringify({action:'manifest',academy:f.academy,event:f.event,expected:null,after:null})});if(!r.ok)throw new Error('Manifest refused');return(await r.json()).data},{f:racing,s:sr});
  // Hold the winning staged import open. Scheduling must not turn this into
  // two legitimate sequential preparations on a fast/slow CI machine.
  const races=await Promise.allSettled([call(sr,'beginImport',racing.event,'racing_first',racingManifest),
    tab.evaluate(({ns,e,m})=>window.call(ns,'beginImport',e,'racing_second',m),{ns:sr.namespace,e:racing.event,m:racingManifest})]);
  assert.equal(races.filter(r=>r.status==='fulfilled').length,1);assert.equal(races.filter(r=>r.status==='rejected').length,1);
  await prepare(sr);assert.equal((await call(sr,'readPage',racing.event)).coherence,'verified-transfer');await tab.close();
  pass('Two actual tabs sharing a namespace cannot race two imports into an acknowledged generation; one succeeds and the other retains an explicit CAS failure');
  const fencing=await fixture(60),sf=await open(fencing);await prepare(sf);const basis=await call(sf,'readPage',fencing.event);await db({action:'mark',...fencing});holdComplete=true;
  await page.evaluate(ns=>{window.result=window.prepare(ns).then(v=>({v}),e=>({error:e.message}))},sf.namespace);await waitComplete();
  const local={action:'register',academy:fencing.academy,event:fencing.event,op:randomUUID(),captured_at:basis.header.server_now,marks:[{player:basis.players[1].id,status:'absent',version:0}]};
  await call(sf,'captureRegister',local);release();assert.match((await page.evaluate(()=>window.result)).error,/import_basis_changed/);
  assert.equal((await call(sf,'readPage',fencing.event)).header.saved,0);assert.equal((await call(sf,'readOriginal',local.op)).state,'pending');
  pass('A new local register captured during download fences older transfer activation and preserves both original input and previous coverage');
  const empty=await fixture(0),se=await open(empty);before=requests.length;await prepare(se);
  assert.deepEqual(requests.slice(before).map(r=>r.action),['manifest','complete']);assert.equal((await call(se,'readPage',empty.event)).header.count,0);
  pass('Empty roster needs current manifest plus completion and remains distinct from not downloaded');
  const large=await fixture(1000),sl=await open(large);metrics.baseline1000=await db({action:'baseline',...large});before=requests.length;let start=performance.now();await prepare(sl);metrics.prepare1000Ms=performance.now()-start;
  const slice=requests.slice(before);assert.equal(slice.filter(r=>r.action==='page').length,20);assert.equal(slice.length,22);assert.ok(slice.every(r=>r.bytes<32768&&r.status===200));
  metrics.prepare1000={requests:slice.length,pages:20,bytes:slice.reduce((n,r)=>n+r.bytes,0),maxResponseBytes:Math.max(...slice.map(r=>r.bytes))};
  let rows=0,after=null;start=performance.now();do{const r=await call(sl,'readPage',large.event,after);rows+=r.players.length;after=r.more?r.players.at(-1).id:null}while(after);assert.equal(rows,1000);metrics.localRead1000Ms=performance.now()-start;
  metrics.manifestExplain=await db({action:'explain',...large,namespace:sl.namespace,device:sl.device});
  before=requests.length;await prepare(sl);metrics.unchanged1000={requests:requests.length-before,bytes:requests.at(-1).bytes,ms:requests.at(-1).ms};
  pass('1000 Unicode players use 22 bounded requests, complete authenticated disk coverage and 20 bounded local reads; unchanged repeat uses one manifest');
  const vectors=JSON.parse(await readFile(join(root,'docs/07-handoff/evidence/register-download-vectors.json')));
  const actual=await page.evaluate(async v=>{const p=window.protocol,h=await p.downloadHeaderHash(v.academy,v.header),s=await p.downloadSeed(h),a=await p.downloadChain(s,v.players);return{head:h,seed:s,acc:a,revision:await p.downloadRoot(h,a)}},vectors);
  for(const k of ['head','seed','acc','revision'])assert.equal(actual[k],vectors[k]);pass('Actual PostgreSQL and browser hashes agree for Arabic, CJK, emoji, combining characters and delimiter/escape input');
  const raw=await page.evaluate(()=>window.inspect());assert.equal(/Synthetic second|界|captured_at|"signature"/.test(raw),false);
  assert.equal(await page.evaluate(()=>window.credentialCalls),0);assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  pass('Download names, signed receipts and attendance original payloads are absent from raw metadata; zero credential APIs/external browser requests');
  await writeFile(evidence,JSON.stringify({passed:true,hashes,checks,metrics,scope:'Actual route with fictional identity/rate/PostgREST adapters -> disposable PG17 -> real Chromium WebCrypto/IndexedDB/coordinator. Local timings include fixture bridge/psql startup, not hosted percentiles, Clerk/key custody/provider quotas or independent security. No product caller, hosted migration, enablement or promotion.'},null,2)+'\n');
  console.log(JSON.stringify({passed:true,cases:checks.length,metrics}));
}catch(error){console.error('Completed cases:',checks.map(c=>c.case));throw error;}finally{
  release();await context?.close();await browser?.close();await new Promise(a=>server.listening?server.close(a):a());
  lines.close();bridge.stdin.end(JSON.stringify({action:'close',id:++sequence})+'\n');
  await new Promise(a=>{if(bridge.exitCode!==null)a();else bridge.once('exit',a)});
  for(const[k,v]of Object.entries(env))if(v===undefined)delete process.env[k];else process.env[k]=v;
  await rm(temp,{recursive:true,force:true});
}
