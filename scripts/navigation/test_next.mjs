// Isolated real Next production routing over actual product components.
// Identity and API data are fictional adapters; this is not hosted authorization proof.
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {mkdtemp,mkdir,writeFile,readFile,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,relative,dirname,join} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const localControlsBaseline=process.env.EX02_LOCAL_CONTROLS_BASELINE==='1';
const continuityBaseline=process.env.EX02_CONTINUITY_BASELINE==='1';
const planningBaseline=process.env.EX02_PLANNING_BASELINE==='1';
const baseline=process.env.EX02_BASELINE==='1';
const measureShell=process.env.EX02_SHELL_MEASURE==='1';
const measureReadOwner=process.env.EX02_READ_OWNER_MEASURE==='1';
const measureColdCalendar=process.env.EX04_COLD_MEASURE==='1';
const root=resolve(import.meta.dirname,'../..'),fixture=await mkdtemp(join(tmpdir(),'academyos-next-routing-'));
const evidence=resolve(process.env.UI_EVIDENCE_DIR||join(tmpdir(),'academyos-ex01-next'));
const inputs=Object.fromEntries(await Promise.all(['apps/web/src/components/workspace-shell.tsx','apps/web/src/components/workspace-layout.tsx','apps/web/src/components/workspace-runtime.tsx','apps/web/src/lib/workspace-read-owner.ts','apps/web/src/app/[locale]/workspace/[academy]/layout.tsx','apps/web/src/app/layout.tsx','apps/web/src/components/experience-workspace.tsx','apps/web/src/components/date-planning-workspace.tsx','apps/web/src/lib/visible-resume.ts','apps/web/src/components/program-workspace.tsx','apps/web/src/components/program-planning-workspace.tsx'].map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
await mkdir(evidence,{recursive:true});
async function put(path,body){const p=join(fixture,path);await mkdir(dirname(p),{recursive:true});await writeFile(p,body);}
await symlink(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
await put('package.json',JSON.stringify({name:'academyos-isolated-next-routing',private:true}));
await put('next.config.mjs','export default {devIndicators:false};');
await put('app/globals.css',await readFile(join(root,'apps/web/src/app/globals.css'),'utf8'));
await put('app/layout.jsx',`import './globals.css';export default function Layout({children}){return <html lang="en"><body>{children}</body></html>}`);
const clerk=(measureShell||measureReadOwner)?`import React from 'react';let loaded=true,subject='user_synthetic_navigation';const listeners=new Set();if(typeof window!=='undefined')window.addEventListener('fixture-identity',e=>{loaded=e.detail!==false;if(typeof e.detail==='string')subject=e.detail;listeners.forEach(f=>f())});export function useUser(){const id=React.useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>loaded?subject:null,()=>subject);return {isLoaded:id!==null,user:id?{id}:undefined}}export function UserButton(){return <span>Fictional identity provider</span>}`:`import React from 'react';export function useUser(){return {isLoaded:true,user:{id:'user_synthetic_navigation'}}}export function UserButton(){return <span>Fictional routing test account</span>}`;
const bundled=await build({stdin:{contents:`export {default as Runtime} from '${root}/apps/web/src/components/workspace-runtime.tsx';export {default as Experience} from '${root}/apps/web/src/components/experience-workspace.tsx';export {default as ProgramPlanning} from '${root}/apps/web/src/components/program-planning-workspace.tsx';export {default as Programs} from '${root}/apps/web/src/components/program-workspace.tsx';export {default as Planning} from '${root}/apps/web/src/components/date-planning-workspace.tsx';`,resolveDir:root,loader:'tsx'},tsconfig:join(root,'apps/web/tsconfig.json'),bundle:true,write:false,format:'esm',jsx:'automatic',external:['react','react/*','next/*'],banner:{js:'"use client";'},plugins:[{name:'synthetic-identity-only',setup(b){if(measureShell)b.onLoad({filter:/workspace-shell\.tsx$/},async args=>{let source=await readFile(args.path,'utf8');source=source.replace('import { useRef,','import { useEffect, useRef,');source=source.replace('export default function WorkspaceShell(props:Props){','export default function WorkspaceShell(props:Props){useEffect(()=>{const counts=window.__shellProbe??={mounts:0,unmounts:0};counts.mounts++;return()=>{counts.unmounts++;};},[]);');return {contents:source,loader:'tsx',resolveDir:dirname(args.path)};});if(measureReadOwner)b.onLoad({filter:/workspace-runtime\.tsx$/},async args=>{let source=await readFile(args.path,'utf8');source=source.replace('  const owner = useMemo',`  useEffect(()=>{const p=window.__readOwnerProbe??={mounts:0,unmounts:0};p.mounts++;return()=>{p.unmounts++;};},[]);\n  const owner = useMemo`);return {contents:source,loader:'tsx',resolveDir:dirname(args.path)};});b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:clerk,loader:'tsx'}));}}]});
await put('product-fixture.jsx',bundled.outputFiles[0].text);
const academy='00000000-0000-4000-8000-000000000001',program='00000000-0000-4000-8000-000000000002',day='2026-11-01';
{
 const path='app/[locale]/workspace/[academy]/layout.tsx',imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 const actual=await readFile(join(root,'apps/web/src/app/[locale]/workspace/[academy]/layout.tsx'),'utf8');
 await put(path,actual.replace("import WorkspaceRuntime from '@/components/workspace-runtime';",`import {Runtime as WorkspaceRuntime} from '${imp}';`).replace("import { uuidPattern } from '@/lib/onboarding';",`const uuidPattern=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;`));
}
if(measureReadOwner){
 const path='app/[locale]/workspace/[academy]/read-probe/page.jsx',imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {Experience} from '${imp}';export default async function Page({params}){const p=await params;return <><Experience locale={p.locale} academy={p.academy} role="owner"/><Experience locale={p.locale} academy={p.academy} role="owner"/></>}`);
}

for(const view of ['home','calendar']){
 const path=`app/[locale]/workspace/[academy]/${view}/page.jsx`,imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {Experience} from '${imp}';export default async function Page({params,searchParams}){const p=await params,q=await searchParams;return <Experience locale={p.locale} academy={p.academy} role="owner" calendar={${view==='calendar'}} anchor={q.anchor}/>}`);
}
{
 const path='app/[locale]/workspace/[academy]/programs/[program]/[day]/page.jsx',imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {Planning} from '${imp}';export default async function Page({params,searchParams}){const p=await params,q=await searchParams;return <Planning locale={p.locale} academy={p.academy} program={p.program} day={p.day} from={q.from} returnTo={q.return==='calendar'?'calendar':q.return==='home'?'home':undefined}/>}`);
}
for(const suffix of ['','/[program]']){
 const path=`app/[locale]/workspace/[academy]/programs${suffix}/page.jsx`,imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {Programs} from '${imp}';export default async function Page({params}){const p=await params;return <Programs locale={p.locale} academy={p.academy} initialProgram={p.program}/>}`);
}
{
 const path='app/[locale]/workspace/[academy]/programs/[program]/plan/page.jsx',imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {ProgramPlanning} from '${imp}';export default async function Page({params}){const p=await params;return <ProgramPlanning locale={p.locale} academy={p.academy} program={p.program}/>}`);
}
const context={academy_id:academy,academy_name:'Fictional Routing Academy',branch_name:'Main Demo Branch',branch_id:academy,timezone:'Africa/Cairo',today:day};
const session={id:program,program,day,date:day,starts_at:day+'T15:00:00Z',ends_at:day+'T16:00:00Z',title:'Fictional Routing Session',branch:'Main Demo Branch',sport:'Football',sport_ar:'كرة القدم',timezone:'Africa/Cairo',state:'draft',published:false,capacity:18,roster_count:0};
await put('app/api/experience/route.js',`const context=${JSON.stringify(context)},item=${JSON.stringify(session)};export async function POST(req){const b=await req.json();const first=b.action==='owner_current_calendar'?'${day}':b.from,last=b.action==='owner_current_calendar'?(b.view==='month'?'2026-12-12':'2026-11-07'):b.to;const data=b.action==='owner_home'?{context,as_of:'2026-11-01T12:00:00Z',panels:{today:{state:'ready',items:[item],count:1}}}:{context,as_of:'2026-11-01T12:00:00Z',anchor:'${day}',from:first,to:last,total:1,items:[item],more:false,next:null};return Response.json({data});}`);
await put('app/api/planning/route.js',`const context=${JSON.stringify(context)};export async function POST(req){const b=await req.json();if(!['read','dates'].includes(b.action))return Response.json({error:'test_read_only'},{status:403});const data=b.action==='read'?{context,program:'${program}',name:'Fictional Routing Session',day:'${day}',start:'17:00',end:'18:00',timezone:'Africa/Cairo',version:0,schedule_version:1,capacity:null,trainer:null,count:0,players:[],more:false}:{items:[],more:false};return Response.json({data});}`);
const programRecord={id:program,definition:{name:'Fictional Routing Program',from:day,to:day,rules:[{day:0,start:'17:00',end:'18:00'}]},timezone:'Africa/Cairo',state:'ready',completed:1,prepared:1,version:1,context_version:1,total:1,windows:1,failure:null,failure_date:null};
await put('app/api/programs/route.js',`const context=${JSON.stringify({...context,sport_name:'Football',sport_name_ar:'كرة القدم',version:1})},program=${JSON.stringify(programRecord)};export async function POST(req){const b=await req.json();if(!['list','read'].includes(b.action))return Response.json({error:'test_read_only'},{status:403});return Response.json({data:b.action==='list'?{context,items:[program],more:false}:{context,program,dates:[{date:'${day}',start:'17:00',end:'18:00',utcStart:'${day}T15:00:00Z',utcEnd:'${day}T16:00:00Z'}]}});}`);
await put('app/api/program-planning/route.js',`const context=${JSON.stringify({...context,sport_name:'Football',sport_name_ar:'كرة القدم',version:1})},program=${JSON.stringify(programRecord)};export async function POST(req){const b=await req.json();if(!['context','list'].includes(b.action))return Response.json({error:'test_read_only'},{status:403});return Response.json({data:b.action==='context'?{context,program,dates:[{date:'${day}'}]}:{items:[],more:false}});}`);
const next=join(root,'node_modules/next/dist/bin/next');let log='';
async function run(args){const child=spawn(process.execPath,[next,...args],{cwd:fixture,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});child.stdout.on('data',s=>log+=s);child.stderr.on('data',s=>log+=s);return new Promise((resolve,reject)=>child.on('close',c=>c===0?resolve():reject(new Error(`Next ${args[0]} exited ${c}`))));}
let server,browser;
try{
 await run(['build','--webpack']);
 const socket=createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));const origin=`http://127.0.0.1:${port}`;
 server=spawn(process.execPath,[next,'start','--port',String(port),'--hostname','127.0.0.1'],{cwd:fixture,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1'}});server.stdout.on('data',s=>log+=s);server.stderr.on('data',s=>log+=s);
 let ready=false;for(let i=0;i<100;i++){try{if((await fetch(origin+'/en/workspace/'+academy+'/home')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}assert.ok(ready,'isolated Next server ready');
 browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],documents=[],results=[],speculativeDates=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(new URL(r.url()).pathname.includes('/programs/')&&r.headers()['next-router-prefetch']==='1')speculativeDates.push(new URL(r.url()).pathname);});page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(new URL(r.url()).pathname)});
 // Cold-entry diagnosis uses actual product reads and a deterministic transport
 // delay. These fictional failures are not hosted permission or SQL evidence.
 if(measureColdCalendar){
  const cold=[];
  for(const locale of ['en','ar'])for(const scenario of ['cold','hint','invalid-hint','stored-period','cold-month','current-failure','explicit-failure','setup-required','leave-during-current']){
   const ar=locale==='ar',pc=await browser.newContext({viewport:{width:1440,height:1000}}),p=await pc.newPage(),events=[],pageErrors=[];
   p.on('pageerror',e=>pageErrors.push(e.message));
   const cacheKey=`academyos:experience:user_synthetic_navigation:${academy}:owner:calendar`;
   if(scenario==='stored-period'||scenario==='cold-month')await pc.addInitScript(({cacheKey,scenario})=>sessionStorage.setItem(cacheKey,JSON.stringify({from:scenario==='stored-period'?'2026-11-08':'',view:scenario==='cold-month'?'month':'week',filter:'',selection:null,position:{center:0,document:0}})),{cacheKey,scenario});
   let releaseHome,homeStarted,fail=true;const startedHome=new Promise(r=>homeStarted=r);
   await p.route('**/api/experience',async route=>{
    const body=route.request().postDataJSON(),event={action:body.action,from:body.from??null,to:body.to??null,started:Math.round(performance.now())};events.push(event);
    if(scenario==='leave-during-current'&&body.action==='owner_current_calendar'){homeStarted();await new Promise(r=>releaseHome=r);event.releasedAfterDeparture=true;await route.fulfill({json:{data:{context,as_of:'2026-11-01T12:00:00Z',panels:{}}}}).catch(()=>{});return;}
    await new Promise(r=>setTimeout(r,250));
    if(fail&&((scenario==='current-failure'&&body.action==='owner_current_calendar')||(scenario==='explicit-failure'&&body.action==='owner_calendar'))){event.status=503;await route.fulfill({status:503,json:{error:'unavailable'}});return;}
    if(scenario==='setup-required'){event.status=200;await route.fulfill({json:{data:{context:{...context,setup_required:true},as_of:'2026-11-01T12:00:00Z',setup_required:true}}});return;}
    event.status=200;await route.continue();
   });
   const url=`${origin}/${locale}/workspace/${academy}/calendar${['hint','explicit-failure'].includes(scenario)?'?anchor=2026-11-01':scenario==='invalid-hint'?'?anchor=2026-02-30':''}`,begin=performance.now();
   await p.goto(url);
   if(scenario==='leave-during-current'){
    await startedHome;await p.goto('about:blank');releaseHome();await expect.poll(()=>events[0].releasedAfterDeparture).toBe(true);assert.deepEqual(events.map(x=>x.action),['owner_current_calendar']);
    cold.push({locale,scenario,events,scope:'departure releases held fixture response; no database cancellation claim'});await pc.close();continue;
   }
   if(scenario==='current-failure'||scenario==='explicit-failure'){
    await expect(p.getByRole('alert').filter({hasText:ar?'هذا العرض غير متاح':'This view is unavailable'})).toBeVisible();await expect(p.locator('.experience-session')).toHaveCount(0);
    const failedActions=events.map(x=>x.action);assert.deepEqual(failedActions,scenario==='current-failure'?['owner_current_calendar']:['owner_calendar']);
    await writeFile(join(evidence,`cold-failure-${locale}-${scenario}.txt`),await p.locator('body').innerText());await p.screenshot({path:join(evidence,`cold-failure-${locale}-${scenario}.png`),fullPage:true});fail=false;await p.getByRole('button',{name:ar?'العودة للفترة الحالية':'Return to the current period',exact:true}).click();await expect(p.locator('.experience-session')).toHaveCount(1);
    assert.deepEqual(events.map(x=>x.action),[...failedActions,'owner_current_calendar']);cold.push({locale,scenario,failedActions,recoveryActions:events.slice(failedActions.length).map(x=>x.action),events,privateRowsOnFailure:0});
   }else if(scenario==='setup-required'){
    await expect(p.getByRole('heading',{name:ar?'أكمل إعداد الأكاديمية':'Finish academy setup',exact:true})).toBeVisible();await expect(p.locator('.experience-session')).toHaveCount(0);assert.deepEqual(events.map(x=>x.action),['owner_current_calendar']);cold.push({locale,scenario,events});
   }else{
    await expect(p.locator('.experience-session')).toHaveCount(1);await expect(p.getByRole('button',{name:ar?'الفترة التالية':'Next period',exact:true})).toBeEnabled();
    const actionableMs=Math.round(performance.now()-begin),expected=['hint','stored-period'].includes(scenario)?['owner_calendar']:['owner_current_calendar'];assert.deepEqual(events.map(x=>x.action),expected);
    if(expected.length===2)assert.ok(events[1].started-events[0].started>=250,'Calendar is serially dependent on delayed Home response');
    const first=scenario==='stored-period'?'2026-11-08':day;if(expected[0]==='owner_calendar'){assert.equal(events.at(-1).from,first);assert.equal(events.at(-1).to,scenario==='stored-period'?'2026-11-14':'2026-11-07');}else{assert.equal(events.at(-1).from,null);assert.equal(events.at(-1).to,null);}
    await expect(p.getByLabel(ar?'انتقل إلى تاريخ':'Go to date',{exact:true})).toHaveValue(first);
    // Resolved anchor application must not start a second request. A real period change must.
    await p.getByRole('button',{name:ar?'الفترة التالية':'Next period',exact:true}).click();await expect(p.getByRole('button',{name:ar?'الفترة التالية':'Next period',exact:true})).toBeEnabled();assert.equal(events.length,2);assert.equal(events[1].action,'owner_calendar');
    cold.push({locale,scenario,initialActions:events.slice(0,1).map(x=>x.action),events,actionableMs,syntheticDelayPerReadMs:250});
   }
   assert.deepEqual(pageErrors,[]);await pc.close();
  }
  await writeFile(join(evidence,'cold-calendar.json'),JSON.stringify({status:'passed',inputs,scope:'actual Next production components; fictional Owner identity/read-only API; controlled 250ms transport delay; no hosted latency, SQL, service cost or backend cancellation proof',cases:cold},null,2));
 }
 // Diagnostic-only source instrumentation: no production counters, SDK
 // network interception, credentials or provider behavior are fabricated.
 if(measureShell){
  const shellResults=[];
  for(const locale of ['en','ar']){
   const ar=locale==='ar',pc=await browser.newContext(),p=await pc.newPage(),requests=[],docs=[];
   p.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')docs.push(new URL(r.url()).pathname);if(r.url().includes('/api/'))requests.push(r.postDataJSON()?.action)});
   const base=`${origin}/${locale}/workspace/${academy}`,steps=[];
   async function snapshot(step){await p.locator('.app-scene').waitFor();const state=await p.evaluate(()=>({counts:{...window.__shellProbe},documentMarker:window.__shellDocument,identityShell:!!document.querySelector('.public-task'),shellCount:document.querySelectorAll('.app-scene').length}));steps.push({step,...state,documents:docs.length,requests:[...requests]});}
   await p.goto(base+'/home');await expect(p.locator('.experience-session')).toHaveCount(1);await p.evaluate(()=>window.__shellDocument='same-document');await snapshot('home');
   await p.getByRole('link',{name:ar?'فتح التقويم':'Open calendar',exact:true}).click();await expect(p.locator('.experience-session')).toHaveCount(1);await p.waitForURL(/\/calendar/);await expect(p.getByRole('heading',{name:ar?'تقويم التدريب':'Training calendar',exact:true})).toBeVisible();await expect.poll(()=>requests.length).toBe(2);await expect(p.locator('.experience-session')).toHaveCount(1);await snapshot('calendar');
   await p.locator('.experience-session').click();await p.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).click();await expect(p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true})).toBeEnabled();await snapshot('date');
   const before=p.url(),beforeFocus=requests.length;await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>requests.length).toBe(beforeFocus+1);await expect(p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true})).toBeEnabled();await snapshot('date-focus');
   await p.getByRole('link',{name:ar?'English':'العربية',exact:true}).click();await expect(p.getByRole('heading',{name:ar?'Draft dates':'تواريخ المسودات',exact:true})).toBeVisible();assert.equal(p.url(),before);await snapshot('local-language');
   await p.getByRole('button',{name:ar?'Back to calendar':'العودة إلى التقويم',exact:true}).click();await expect(p.locator('.experience-session')).toHaveCount(1);await expect.poll(()=>requests.length).toBe(5);await expect(p.getByRole('heading',{name:ar?'Training calendar':'تقويم التدريب',exact:true})).toBeVisible();await snapshot('calendar-return');
   assert.deepEqual(steps.map(s=>s.counts.mounts),[1,2,3,3,3,4],'route changes remount;focus and local locale retain the current shell');
   const steady=steps.at(-1).counts.mounts;await p.evaluate(()=>window.dispatchEvent(new CustomEvent('fixture-identity',{detail:false})));await expect(p.locator('.public-task')).toBeVisible();await snapshot('forced-identity-pending');
   await p.evaluate(()=>window.dispatchEvent(new CustomEvent('fixture-identity',{detail:true})));await expect(p.locator('.experience-session')).toHaveCount(1);await snapshot('identity-ready');
   assert.equal(steps[3].counts.mounts,steps[2].counts.mounts,'same dated focus does not remount shell');assert.equal(steps[4].counts.mounts,steps[2].counts.mounts,'local locale does not remount shell');assert.equal(steps.at(-1).counts.mounts,steady+2,'forced identity pending replaces private shell and returns with fresh projection');
   assert.ok(steps.every(s=>s.documents===1&&s.documentMarker==='same-document'&&s.shellCount===1),'shell replacement is not a document reload or duplicated shell');
   shellResults.push({locale,steps});await pc.close();
  }
  await writeFile(join(evidence,'shell-identity.json'),JSON.stringify({scope:'actual Next production routes/product shell;diagnostic-only useEffect mount counters;fictional reactive identity;forced pending tests mechanism only;no Clerk FAPI/BAPI/token/provider measurements',inputs,shellResults},null,2));
 }

 if(measureReadOwner){
  const cases=[];
  for(const locale of ['en','ar']){
   const ar=locale==='ar',pc=await browser.newContext({viewport:{width:1440,height:1000}}),p=await pc.newPage(),reads=[],docs=[],faults=[];
   p.on('pageerror',e=>faults.push(e.message));p.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')docs.push(new URL(r.url()).pathname);if(r.url().includes('/api/'))reads.push(r.postDataJSON()?.action)});
   const base=`${origin}/${locale}/workspace/${academy}`,steps=[];
   async function ready(label){const calendar=new URL(p.url()).pathname.endsWith('/calendar');const name=calendar?(ar?'تحديث':'Refresh'):(ar?'إعادة تحميل العرض الحالي':'Reload current view');await expect(p.getByRole('button',{name,exact:true})).toBeEnabled();await expect(p.getByRole('status')).toHaveCount(0);await expect(p.locator('.experience-session')).toHaveCount(1);steps.push({label,reads:[...reads],documents:docs.length,owner:await p.evaluate(()=>({...window.__readOwnerProbe}))});}
   await p.goto(base+'/home');await ready('home');
   await p.getByRole('link',{name:ar?'فتح التقويم':'Open calendar',exact:true}).click();await p.waitForURL(/\/calendar/);await expect(p.getByRole('heading',{name:ar?'تقويم التدريب':'Training calendar',exact:true})).toBeVisible();await ready('calendar');
   await p.locator('.experience-session').click();await p.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).click();await expect(p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true})).toBeEnabled();steps.push({label:'date',reads:[...reads],documents:docs.length,owner:await p.evaluate(()=>({...window.__readOwnerProbe}))});
   await p.getByRole('button',{name:ar?'العودة إلى التقويم':'Back to calendar',exact:true}).click();await p.waitForURL(/\/calendar/);await ready('return');
   assert.ok(steps.every(s=>s.owner.mounts===1&&s.owner.unmounts===0&&s.documents===1),'one workspace owner survives task navigation;no document or auth bootstrap');
   assert.deepEqual(reads,['owner_home','owner_calendar','read','owner_calendar'],'Home link carries its existing validated period hint');
   await p.evaluate(()=>window.dispatchEvent(new CustomEvent('fixture-identity',{detail:false})));await expect(p.locator('.public-task')).toBeVisible();assert.equal(await p.locator('.experience-session').count(),0,'uncertain identity masks old private views');
   await expect.poll(()=>p.evaluate(()=>window.__readOwnerProbe.unmounts)).toBe(1);
   await p.evaluate(()=>window.dispatchEvent(new CustomEvent('fixture-identity',{detail:'user_second_synthetic'})));await ready('different-subject');assert.equal(steps.at(-1).owner.mounts,2);assert.equal(reads.length,5,'new identity checks current data once');
   const before=reads.length;await p.getByRole('button',{name:ar?'تحديث':'Refresh',exact:true}).click();await ready('explicit-current-read');assert.equal(reads.length,before+1,'settled read is never a freshness/authority cache');
   await p.screenshot({path:join(evidence,`read-owner-calendar-${locale}.png`),fullPage:true});
   // Controlled same-resource consumers,not an allegation that current user routes render two tasks.
   await p.goto(base+'/read-probe');await expect(p.locator('.experience-session')).toHaveCount(2);assert.equal(reads.length,before+2,'two concurrent actual consumers share one current transport');
   assert.deepEqual(faults,[]);cases.push({locale,steps,controlledTwoConsumersReadStarts:1,errors:faults});await pc.close();
  }
  await writeFile(join(evidence,'workspace-read-owner.json'),JSON.stringify({status:'passed',inputs,scope:'actual Next production layout/client components;fictional identity and read-only API;no hosted Clerk/DB/cost proof;no private disk or settled-result cache',cases},null,2));
 }
 // Clean Owner resume retains the checked task while current actions stay gated.
 // Required first/failed/changed-authority reads retain their separate fences.
 const localControls=[];
 for(const view of ['home','calendar']){
  const pc=await browser.newContext({viewport:{width:1440,height:1000}}),p=await pc.newPage();let hold=false,release;const calls=[];
  await p.route('**/api/experience',async route=>{calls.push(route.request().postDataJSON().action);if(hold)await new Promise(r=>{release=r;});await route.continue();});
  const url=`${origin}/en/workspace/${academy}/${view}${view==='calendar'?'?anchor='+day:''}`;
  await p.goto(url);await expect(p.locator('.experience-session')).toHaveCount(1);
  await p.locator('.experience-session').evaluate(el=>{el.dataset.resumeProbe='original';});
  const input=p.getByRole('searchbox',{name:'Search this loaded page',exact:true});await input.fill('Fictional');
  await input.evaluate(el=>{el.dataset.continuityProbe='original';});hold=true;const before=calls.length;
  await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>calls.length).toBe(before+1);await expect(p.locator('.experience-session')).toHaveCount(localControlsBaseline?0:1);
  if(!localControlsBaseline){await expect(p.locator('.experience-session')).toHaveAttribute('data-resume-probe','original');await expect(p.locator('.experience-reload')).toBeDisabled();}
  const inputRetained=await input.count()===1;
  assert.equal(inputRetained,!localControlsBaseline,'local search stays mounted during clean Owner resume');
  if(!localControlsBaseline){assert.equal(await input.getAttribute('data-continuity-probe'),'original');assert.equal(await input.evaluate(el=>el===document.activeElement),true);await input.press('End');await input.pressSequentially(' Routing');await expect(input).toHaveValue('Fictional Routing');}
  const beforeLanguage=p.url();await p.getByRole('link',{name:'العربية',exact:true}).click();await expect(p.getByRole('heading',{name:view==='calendar'?'تقويم التدريب':'عمليات الأكاديمية',exact:true})).toBeVisible();
  const languageChangedUrl=p.url()!==beforeLanguage;if(!localControlsBaseline)assert.equal(languageChangedUrl,false,'local locale control adds no hash/router navigation');
  assert.equal(calls.length,before+1,'typing/locale adds no business read');await p.screenshot({path:join(evidence,`local-controls-${view}.png`),fullPage:true});hold=false;release();await expect(p.locator('.experience-reload')).toBeEnabled();await expect(p.locator('.experience-session')).toHaveCount(1);
  localControls.push({view,inputRetained,languageChangedUrl,readStarts:calls.length-before,privateRowsMasked:localControlsBaseline,checkedRowsRetained:!localControlsBaseline});await pc.close();
 }
 {
  const pc=await browser.newContext(),p=await pc.newPage();let hold=false,release;const calls=[];
  await p.route('**/api/planning',async route=>{calls.push(route.request().postDataJSON().action);if(hold)await new Promise(r=>{release=r;});await route.continue();});
  const url=`${origin}/en/workspace/${academy}/programs/${program}/${day}?return=calendar`;
  await p.goto(url);await expect(p.getByRole('button',{name:'Plan this date',exact:true})).toBeEnabled();hold=true;
  const before=calls.length;await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>calls.length).toBe(before+1);await expect(p.getByRole('button',{name:'Plan this date',exact:true})).toBeDisabled();
  await p.getByRole('link',{name:'العربية',exact:true}).click();if(!localControlsBaseline)await expect(p.getByRole('heading',{name:'تواريخ المسودات',exact:true})).toBeVisible();const accepted=await p.getByRole('heading',{name:'تواريخ المسودات',exact:true}).isVisible();
  assert.equal(accepted,!localControlsBaseline,'single locale click during held dated read');await p.getByRole('link',{name:localControlsBaseline?'Today':'اليوم',exact:true}).click();assert.equal(p.url(),url,'busy authority check still blocks leaving the dated task');assert.equal(calls.length,before+1);hold=false;release();await expect(p.getByRole('button',{name:localControlsBaseline?'Plan this date':'تخطيط هذا التاريخ',exact:true})).toBeEnabled();
  localControls.push({view:'dated',singleLocaleClickAccepted:accepted,readStarts:calls.length-before});await pc.close();
 }
 // Controlled wait ownership, separate from native/hosted performance.
 const continuity=[];
 for(const locale of ['en','ar']){
  const ar=locale==='ar',probeContext=await browser.newContext({viewport:{width:1440,height:1000}}),p=await probeContext.newPage();
  const requests=[];let releaseDates,datesStarted=false;
  await p.route('**/api/experience',async route=>{requests.push(route.request().postDataJSON().action);await new Promise(r=>setTimeout(r,250));await route.continue();});
  await p.route('**/api/planning',async route=>{const action=route.request().postDataJSON().action;requests.push(action);if(action==='dates'){datesStarted=true;await new Promise(r=>{releaseDates=r;});}await route.continue();});
  const base=`${origin}/${locale}/workspace/${academy}`;
  await p.goto(base+'/home');await expect(p.locator('.experience-session')).toHaveCount(1);requests.length=0;
  if(!continuityBaseline)assert.match(await p.getByRole('link',{name:ar?'التقويم':'Calendar',exact:true}).getAttribute('href'),/\?anchor=2026-11-01$/,'canonical side menu preserves the reviewed date hint');
  const begin=performance.now();await p.getByRole('link',{name:ar?'فتح التقويم':'Open calendar',exact:true}).click();await p.waitForURL(/\/calendar/);await expect(p.locator('.experience-session')).toHaveCount(1);
  const calendarMs=performance.now()-begin,calendarRequests=[...requests];
  assert.deepEqual(calendarRequests,continuityBaseline?['owner_home','owner_calendar']:['owner_calendar'],'known Home branch day avoids a redundant Home dependency');
  await p.locator('.experience-session').click();requests.length=0;
  await p.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).click();await p.waitForURL(/\/programs\//);
  const planButton=p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true});await expect(planButton).toBeVisible();
  if(continuityBaseline){await expect(planButton).toBeDisabled();assert.equal(datesStarted,true);releaseDates();}
  await expect(planButton).toBeEnabled();assert.deepEqual(requests,continuityBaseline?['read','dates']:['read'],'task return route needs selected plan only');
  await p.screenshot({path:join(evidence,`continuity-date-${locale}.png`),fullPage:true});
  continuity.push({locale,calendarRequests,calendarActionableMs:Math.round(calendarMs),syntheticDelayPerExperienceReadMs:250,planningRequests:[...requests],planBlockedByHiddenDirectory:continuityBaseline});await probeContext.close();
 }
 // A visible return followed by focus is one current-authority check, even
 // when the first read completes before the second browser signal arrives.
 const datedResume=[];
 for(const locale of ['en','ar']){
  const ar=locale==='ar',pc=await browser.newContext(),p=await pc.newPage(),calls=[];
  await p.route('**/api/planning',async route=>{calls.push(route.request().postDataJSON().action);await route.continue();});
  await p.goto(`${origin}/${locale}/workspace/${academy}/programs/${program}/${day}?return=calendar`);
  const plan=()=>p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true});await expect(plan()).toBeEnabled();
  await p.evaluate(()=>{window.__resumeVisibility='visible';Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>window.__resumeVisibility});});
  const visible=()=>p.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.__resumeVisibility='hidden';document.dispatchEvent(new Event('visibilitychange'));window.__resumeVisibility='visible';document.dispatchEvent(new Event('visibilitychange'));});
  const before=calls.length;await visible();await expect.poll(()=>calls.length).toBe(before+1);await expect(plan()).toBeEnabled();
  await p.waitForTimeout(40);await p.evaluate(()=>window.dispatchEvent(new Event('focus')));
  // A bounded observation window measures event pairing, never a product TTL.
  await p.waitForTimeout(80);const paired=calls.length-before;
  assert.equal(paired,process.env.EX02_DATED_RESUME_BASELINE==='1'?2:1,'one visible/focus return owns one dated read');
  await plan().click();const capacity=p.getByLabel(ar?'سعة هذا التاريخ':'Capacity for this date',{exact:true});await capacity.fill('7');
  const dirtyBefore=calls.length;await visible();await expect.poll(()=>calls.length).toBe(dirtyBefore+1);await expect(capacity).toBeEnabled();await p.waitForTimeout(40);await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await p.waitForTimeout(80);
  await expect(capacity).toHaveValue('7');const dirtyPaired=calls.length-dirtyBefore;assert.equal(dirtyPaired,process.env.EX02_DATED_RESUME_BASELINE==='1'?2:1);
  const fresh=calls.length;await p.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));});await expect.poll(()=>calls.length).toBe(fresh+1);await expect(capacity).toHaveValue('7');
  datedResume.push({locale,pairedReads:paired,dirtyPairedReads:dirtyPaired,retainedCapacity:'7',distinctReturnReads:calls.length-fresh});await pc.close();
 }
 await writeFile(join(evidence,'dated-resume.json'),JSON.stringify({scope:'actual Next production;fictional identity/read-only planning APIs;40ms separated browser signals',datedResume},null,2));
 // Long-list task return: current selection alone does not prove return position.
 const returnPositions=[];
 for(const locale of ['en','ar'])for(const width of [1440,390]){
  const ar=locale==='ar',pc=await browser.newContext({viewport:{width,height:900}}),p=await pc.newPage();
  let reads=0,hold=false,release,phase='full';
  const items=Array.from({length:40},(_,i)=>({...session,program:i===39?program:`00000000-0000-4000-8000-${String(i+100).padStart(12,'0')}`,id:i===39?program:`00000000-0000-4000-8000-${String(i+100).padStart(12,'0')}`,title:`Fictional Routing Session ${i+1}`}));
  await p.route('**/api/experience',async route=>{reads++;const body=route.request().postDataJSON();if(hold)await new Promise(r=>{release=r;});if(phase==='denied')return route.fulfill({status:403,json:{error:'denied'}});const current=phase==='short'?items.slice(0,3):items;await route.fulfill({json:{data:{context,as_of:'2026-11-01T12:00:00Z',from:body.from,to:body.to,total:current.length,items:current,more:false,next:null}}});});
  const base=`${origin}/${locale}/workspace/${academy}`;
  await p.goto(base+'/calendar?anchor='+day);await expect(p.locator('.experience-session')).toHaveCount(40);
  await p.locator('.experience-session').last().click();
  const position=()=>p.evaluate(()=>({center:document.querySelector('.workspace-center').scrollTop,document:window.scrollY}));
  const before=await position();
  // Router/browser scroll handling may run before the domain unmounts. Force
  // that ordering at link activation instead of relying on a fast local route.
  if(process.env.EX02_RETURN_BASELINE!=='1')await p.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).evaluate(el=>el.addEventListener('click',()=>{document.querySelector('.workspace-center').scrollTop=0;window.scrollTo(0,0);},{once:true}));
  await p.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).click();await p.waitForURL(/\/programs\//);
  await expect(p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true})).toBeEnabled();
  await p.getByRole('button',{name:ar?'العودة إلى التقويم':'Back to calendar',exact:true}).click();
  await expect(p.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);
  if(process.env.EX02_RETURN_BASELINE!=='1')await expect.poll(position).toEqual(before);
  const after=await position();returnPositions.push({locale,width,before,after,reads});
  if(process.env.EX02_RETURN_BASELINE!=='1')assert.ok(Math.abs(after.center-before.center)<=1&&Math.abs(after.document-before.document)<=1,'date return preserves long-list position');
  assert.equal(reads,2,'initial and returned Calendar each own one read');
  if(process.env.EX02_RETURN_BASELINE!=='1'){
   await p.goBack();await expect(p.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true})).toBeEnabled();
   hold=true;await p.goForward();await expect.poll(()=>reads).toBe(3);await expect(p.locator('.experience-session')).toHaveCount(0);
   await expect(p.getByText('Fictional Routing Academy',{exact:true})).toHaveCount(0);hold=false;release();
   await expect.poll(position).toEqual(before);await expect(p.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);
   const saved=await p.evaluate(()=>JSON.parse(sessionStorage.getItem(Object.keys(sessionStorage).find(k=>k.startsWith('academyos:experience:')))));
   assert.deepEqual(Object.keys(saved).sort(),['attendanceTask','filter','from','position','selection','view'],'navigation store contains only safe context');
   assert.equal(saved.attendanceTask,null,'Calendar never carries an Owner Today attendance task');
   assert.ok(!JSON.stringify(saved).includes('Fictional Routing'),'no private projection persisted');
   phase='short';await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(p.locator('.experience-session')).toHaveCount(3);
   const shortened=await position();assert.ok(shortened.center<before.center||shortened.document<before.document,'current shorter result naturally clamps');
   phase='denied';await p.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(p.locator('.workspace-content [role=alert]')).toHaveText(ar?'لم تعد الصلاحية متاحة. اختر مساحة عملك الحالية.':'Access is no longer available. Choose your current workspace.');await expect(p.locator('.experience-session')).toHaveCount(0);await expect(p.locator('dialog[open]')).toHaveCount(0);
   assert.equal(reads,5,'history/short/denied changes add only their deliberate current read');
   Object.assign(returnPositions.at(-1),{historyRestored:true,heldPrivateMask:true,shortened,denied:true,totalReads:reads});
  }
  await pc.close();
 }
 await writeFile(join(evidence,'return-positions.json'),JSON.stringify({scope:'actual Next production;fictional40-row Calendar;read-only APIs',returnPositions},null,2));
 for(const locale of ['en','ar']){
  const ar=locale==='ar',base=`${origin}/${locale}/workspace/${academy}`;
  await page.goto(base+'/home');await expect(page.locator('.experience-session')).toHaveCount(1);
  await page.evaluate(()=>window.__routingMarker='same-document');const before=documents.length;
  const calendarUrl=await page.getByRole('link',{name:ar?'فتح التقويم':'Open calendar',exact:true}).getAttribute('href');await page.getByRole('link',{name:ar?'فتح التقويم':'Open calendar',exact:true}).click();await page.waitForURL(origin+calendarUrl);await expect(page.locator('.experience-session')).toHaveCount(1);
  await page.locator('.experience-session').click();
  await page.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).click();await page.waitForURL(/\/programs\//);
  const back=()=>page.getByRole('button',{name:ar?'العودة إلى التقويم':'Back to calendar',exact:true});
  await expect(page.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:ar?'تخطيط هذا التاريخ':'Plan this date',exact:true}).click();
  page.once('dialog',d=>d.dismiss());const dirtyUrl=page.url();await back().click();assert.equal(page.url(),dirtyUrl,'dismissed dirty exit stays on task');
  page.once('dialog',d=>d.accept());await back().click();await page.waitForURL(base+'/calendar');
  await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);
  await page.goBack();await expect(back()).toBeVisible();await page.goForward();await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);
  assert.equal(documents.length,before,'normal task navigation/guarded return/history adds no document loads');assert.equal(await page.evaluate(()=>window.__routingMarker),'same-document','same browser document survives');
  const popupReady=page.context().waitForEvent('page');
  await page.getByRole('link',{name:ar?'فتح هذا التاريخ':'Open this date',exact:true}).click({button:'middle'});
  const popup=await popupReady;await popup.waitForURL(new RegExp('/programs/'+program+'/'+day));await popup.waitForLoadState('domcontentloaded');assert.ok(popup.url().includes('/programs/'),'modified task link opens destination separately');await popup.close();assert.equal(page.url(),base+'/calendar','modifier navigation preserves original task');await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);
  await page.screenshot({path:join(evidence,`next-calendar-${locale}.png`),fullPage:true});results.push({locale,documentLoadsForTaskLoop:documents.length-before,dirtyCancel:true,modifierNewTab:true,selectedIdRestored:true,browserBackForward:true});
 }
 for(const locale of ['en','ar']){
  const ar=locale==='ar',base=`${origin}/${locale}/workspace/${academy}`;
  await page.goto(base+'/programs');await page.getByRole('button',{name:'Fictional Routing Program',exact:true}).click();
  await expect(page.locator('.program-dates')).toBeVisible();await page.evaluate(()=>window.__routingMarker='program-document');
  if(!baseline){
   const popupReady=page.context().waitForEvent('page');await page.getByRole('link',{name:ar?'فحص هذا التاريخ':'Inspect this date',exact:true}).click({button:'middle'});
   const popup=await popupReady;await popup.waitForURL(new RegExp('/programs/'+program+'/'+day));await popup.close();assert.equal(page.url(),base+'/programs','program middle-click retains current task');
  }
  const before=documents.length;await page.getByRole('link',{name:ar?'فحص هذا التاريخ':'Inspect this date',exact:true}).click();await page.waitForURL(/\/programs\/[^/]+\/2026-11-01/);
  assert.equal(documents.length-before,baseline?1:0,'Programs dated link document count');
  assert.equal(await page.evaluate(()=>window.__routingMarker),baseline?undefined:'program-document');
  results.push({locale,programTaskDocuments:documents.length-before,baseline});
  await page.goto(base+'/programs');await page.getByRole('button',{name:ar?'برنامج جديد':'New program',exact:true}).click();
  await page.getByLabel(ar?'اسم البرنامج الخيالي':'Fictional program name',{exact:true}).fill('Retained navigation draft');
  page.once('dialog',d=>d.dismiss());await page.getByRole('link',{name:ar?'اليوم':'Today',exact:true}).click();
  assert.equal(page.url(),base+'/programs');await expect(page.getByLabel(ar?'اسم البرنامج الخيالي':'Fictional program name',{exact:true})).toHaveValue('Retained navigation draft');
  page.once('dialog',d=>d.accept());const exitBefore=documents.length;await page.getByRole('link',{name:ar?'اليوم':'Today',exact:true}).click();await page.waitForURL(base+'/home');await expect(page.locator('.experience-session')).toHaveCount(1);
  assert.equal(documents.length-exitBefore,baseline?1:0,'confirmed draft exit document count');
 }
 for(const locale of ['en','ar']){
  const ar=locale==='ar',base=`${origin}/${locale}/workspace/${academy}`,url=base+'/programs/'+program+'/plan';
  await page.goto(url);const back=()=>page.getByRole('link',{name:ar?'العودة للبرامج':'Back to programs',exact:true});await expect(back()).toBeVisible();
  if(!planningBaseline){const opened=page.context().waitForEvent('page');await back().click({button:'middle'});const other=await opened;await other.waitForURL(base+'/programs');await other.close();assert.equal(page.url(),url,'planning new-tab keeps the current task');}
  await page.evaluate(()=>window.__planningMarker='same-document');const before=documents.length;
  await back().click();await page.waitForURL(base+'/programs');await expect(page.getByRole('button',{name:'Fictional Routing Program',exact:true})).toBeVisible();
  assert.equal(documents.length-before,planningBaseline?1:0,'planning clean return document count');
  assert.equal(await page.evaluate(()=>window.__planningMarker),planningBaseline?undefined:'same-document');
  await page.goto(url);await page.getByRole('button',{name:ar?'مقترح جديد':'New proposal',exact:true}).first().click();
  const capacity=page.getByRole('spinbutton',{name:ar?'السعة':'Capacity',exact:true});await capacity.fill('7');
  const today=()=>page.getByRole('link',{name:ar?'اليوم':'Today',exact:true});page.once('dialog',d=>d.dismiss());await today().click();assert.equal(page.url(),url);await expect(capacity).toHaveValue('7');
  const leaveBefore=documents.length;page.once('dialog',d=>d.accept());await today().click();await page.waitForURL(base+'/home');await expect(page.locator('.experience-session')).toHaveCount(1);assert.equal(documents.length-leaveBefore,planningBaseline?1:0,'planning confirmed dirty exit document count');
  results.push({locale,planningCleanDocuments:planningBaseline?1:0,planningConfirmedDirtyDocuments:documents.length-leaveBefore,dirtyCancel:true,planningBaseline});
 }
 assert.deepEqual(speculativeDates,[],'task links add no speculative dated-route prefetch');assert.deepEqual(errors,[]);await writeFile(join(evidence,'receipt.json'),JSON.stringify({status:'passed',runtime:process.version,baseline,planningBaseline,continuityBaseline,continuity,localControlsBaseline,localControls,inputs,speculativeDatePrefetches:speculativeDates.length,scope:'actual Next production router with product components; synthetic identity/read-only API fixtures; not hosted/auth proof',results,errors},null,2));console.log('PASS actual Next production navigation EN/AR, dirty guards, selection and Back/Forward');
}catch(e){await writeFile(join(evidence,'receipt.json'),JSON.stringify({status:'failed',error:String(e),fixture},null,2));throw e;}
finally{await browser?.close();server?.kill('SIGTERM');await writeFile(join(evidence,'next-fixture.log'),log);}
