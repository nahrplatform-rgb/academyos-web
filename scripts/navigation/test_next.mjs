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
const root=resolve(import.meta.dirname,'../..'),fixture=await mkdtemp(join(tmpdir(),'academyos-next-routing-'));
const evidence=resolve(process.env.UI_EVIDENCE_DIR||join(tmpdir(),'academyos-ex01-next'));
const inputs=Object.fromEntries(await Promise.all(['apps/web/src/components/experience-workspace.tsx','apps/web/src/components/date-planning-workspace.tsx','apps/web/src/lib/visible-resume.ts'].map(async p=>[p,createHash('sha256').update(await readFile(join(root,p))).digest('hex')])));
await mkdir(evidence,{recursive:true});
async function put(path,body){const p=join(fixture,path);await mkdir(dirname(p),{recursive:true});await writeFile(p,body);}
await symlink(join(root,'node_modules'),join(fixture,'node_modules'),'dir');
await put('package.json',JSON.stringify({name:'academyos-isolated-next-routing',private:true}));
await put('next.config.mjs','export default {devIndicators:false};');
await put('app/globals.css',await readFile(join(root,'apps/web/src/app/globals.css'),'utf8'));
await put('app/layout.jsx',`import './globals.css';export default function Layout({children}){return <html lang="en"><body>{children}</body></html>}`);
const clerk=`import React from 'react';export function useUser(){return {isLoaded:true,user:{id:'user_synthetic_navigation'}}}export function UserButton(){return <span>Fictional routing test account</span>}`;
const bundled=await build({stdin:{contents:`export {default as Experience} from '${root}/apps/web/src/components/experience-workspace.tsx';export {default as Planning} from '${root}/apps/web/src/components/date-planning-workspace.tsx';`,resolveDir:root,loader:'tsx'},tsconfig:join(root,'apps/web/tsconfig.json'),bundle:true,write:false,format:'esm',jsx:'automatic',external:['react','react/*','next/*'],banner:{js:'"use client";'},plugins:[{name:'synthetic-identity-only',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:clerk,loader:'tsx'}));}}]});
await put('product-fixture.jsx',bundled.outputFiles[0].text);
const academy='00000000-0000-4000-8000-000000000001',program='00000000-0000-4000-8000-000000000002',day='2026-11-01';
for(const view of ['home','calendar']){
 const path=`app/[locale]/workspace/[academy]/${view}/page.jsx`,imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {Experience} from '${imp}';export default async function Page({params}){const p=await params;return <Experience locale={p.locale} academy={p.academy} role="owner" calendar={${view==='calendar'}}/>}`);
}
{
 const path='app/[locale]/workspace/[academy]/programs/[program]/[day]/page.jsx',imp='./'+relative(dirname(join(fixture,path)),join(fixture,'product-fixture.jsx'));
 await put(path,`import {Planning} from '${imp}';export default async function Page({params,searchParams}){const p=await params,q=await searchParams;return <Planning locale={p.locale} academy={p.academy} program={p.program} day={p.day} from={q.from} returnTo={q.return==='calendar'?'calendar':q.return==='home'?'home':undefined}/>}`);
}
const context={academy_id:academy,academy_name:'Fictional Routing Academy',branch_name:'Main Demo Branch',branch_id:academy,timezone:'Africa/Cairo',today:day};
const session={id:program,program,day,date:day,starts_at:day+'T15:00:00Z',ends_at:day+'T16:00:00Z',title:'Fictional Routing Session',branch:'Main Demo Branch',sport:'Football',sport_ar:'كرة القدم',timezone:'Africa/Cairo',state:'draft',published:false,capacity:18,roster_count:0};
await put('app/api/experience/route.js',`const context=${JSON.stringify(context)},item=${JSON.stringify(session)};export async function POST(req){const b=await req.json();const data=b.action==='owner_home'?{context,as_of:'2026-11-01T12:00:00Z',panels:{today:{state:'ready',items:[item],count:1}}}:{context,as_of:'2026-11-01T12:00:00Z',from:b.from,to:b.to,total:1,items:[item],more:false,next:null};return Response.json({data});}`);
await put('app/api/planning/route.js',`const context=${JSON.stringify(context)};export async function POST(req){const b=await req.json();if(!['read','dates'].includes(b.action))return Response.json({error:'test_read_only'},{status:403});const data=b.action==='read'?{context,program:'${program}',name:'Fictional Routing Session',day:'${day}',start:'17:00',end:'18:00',timezone:'Africa/Cairo',version:0,schedule_version:1,capacity:null,trainer:null,count:0,players:[],more:false}:{items:[],more:false};return Response.json({data});}`);
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
 for(const locale of ['en','ar']){
  const ar=locale==='ar',base=`${origin}/${locale}/workspace/${academy}`;
  await page.goto(base+'/home');await expect(page.locator('.experience-session')).toHaveCount(1);
  await page.evaluate(()=>window.__routingMarker='same-document');const before=documents.length;
  await page.getByRole('link',{name:ar?'فتح التقويم':'Open calendar',exact:true}).click();await page.waitForURL(base+'/calendar');await expect(page.locator('.experience-session')).toHaveCount(1);
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
 assert.deepEqual(speculativeDates,[],'task links add no speculative dated-route prefetch');assert.deepEqual(errors,[]);await writeFile(join(evidence,'receipt.json'),JSON.stringify({status:'passed',runtime:process.version,inputs,speculativeDatePrefetches:speculativeDates.length,scope:'actual Next production router with product components; synthetic identity/read-only API fixtures; not hosted/auth proof',results,errors},null,2));console.log('PASS actual Next production navigation EN/AR, dirty guards, selection and Back/Forward');
}catch(e){await writeFile(join(evidence,'receipt.json'),JSON.stringify({status:'failed',error:String(e),fixture},null,2));throw e;}
finally{await browser?.close();server?.kill('SIGTERM');await writeFile(join(evidence,'next-fixture.log'),log);}
