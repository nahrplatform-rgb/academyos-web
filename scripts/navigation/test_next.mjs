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
const continuityBaseline=process.env.EX02_CONTINUITY_BASELINE==='1';
const planningBaseline=process.env.EX02_PLANNING_BASELINE==='1';
const baseline=process.env.EX02_BASELINE==='1';
const root=resolve(import.meta.dirname,'../..'),fixture=await mkdtemp(join(tmpdir(),'academyos-next-routing-'));
const evidence=resolve(process.env.UI_EVIDENCE_DIR||join(tmpdir(),'academyos-ex01-next'));
const inputs=Object.fromEntries(await Promise.all(['apps/web/src/components/experience-workspace.tsx','apps/web/src/components/date-planning-workspace.tsx','apps/web/src/lib/visible-resume.ts','apps/web/src/components/program-workspace.tsx','apps/web/src/components/program-planning-workspace.tsx'].map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
await mkdir(evidence,{recursive:true});
async function put(path,body){const p=join(fixture,path);await mkdir(dirname(p),{recursive:true});await writeFile(p,body);}
await symlink(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
await put('package.json',JSON.stringify({name:'academyos-isolated-next-routing',private:true}));
await put('next.config.mjs','export default {devIndicators:false};');
await put('app/globals.css',await readFile(join(root,'apps/web/src/app/globals.css'),'utf8'));
await put('app/layout.jsx',`import './globals.css';export default function Layout({children}){return <html lang="en"><body>{children}</body></html>}`);
const clerk=`import React from 'react';export function useUser(){return {isLoaded:true,user:{id:'user_synthetic_navigation'}}}export function UserButton(){return <span>Fictional routing test account</span>}`;
const bundled=await build({stdin:{contents:`export {default as Experience} from '${root}/apps/web/src/components/experience-workspace.tsx';export {default as ProgramPlanning} from '${root}/apps/web/src/components/program-planning-workspace.tsx';export {default as Programs} from '${root}/apps/web/src/components/program-workspace.tsx';export {default as Planning} from '${root}/apps/web/src/components/date-planning-workspace.tsx';`,resolveDir:root,loader:'tsx'},tsconfig:join(root,'apps/web/tsconfig.json'),bundle:true,write:false,format:'esm',jsx:'automatic',external:['react','react/*','next/*'],banner:{js:'"use client";'},plugins:[{name:'synthetic-identity-only',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:clerk,loader:'tsx'}));}}]});
await put('product-fixture.jsx',bundled.outputFiles[0].text);
const academy='00000000-0000-4000-8000-000000000001',program='00000000-0000-4000-8000-000000000002',day='2026-11-01';
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
await put('app/api/experience/route.js',`const context=${JSON.stringify(context)},item=${JSON.stringify(session)};export async function POST(req){const b=await req.json();const data=b.action==='owner_home'?{context,as_of:'2026-11-01T12:00:00Z',panels:{today:{state:'ready',items:[item],count:1}}}:{context,as_of:'2026-11-01T12:00:00Z',from:b.from,to:b.to,total:1,items:[item],more:false,next:null};return Response.json({data});}`);
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
 assert.deepEqual(speculativeDates,[],'task links add no speculative dated-route prefetch');assert.deepEqual(errors,[]);await writeFile(join(evidence,'receipt.json'),JSON.stringify({status:'passed',runtime:process.version,baseline,planningBaseline,continuityBaseline,continuity,inputs,speculativeDatePrefetches:speculativeDates.length,scope:'actual Next production router with product components; synthetic identity/read-only API fixtures; not hosted/auth proof',results,errors},null,2));console.log('PASS actual Next production navigation EN/AR, dirty guards, selection and Back/Forward');
}catch(e){await writeFile(join(evidence,'receipt.json'),JSON.stringify({status:'failed',error:String(e),fixture},null,2));throw e;}
finally{await browser?.close();server?.kill('SIGTERM');await writeFile(join(evidence,'next-fixture.log'),log);}
