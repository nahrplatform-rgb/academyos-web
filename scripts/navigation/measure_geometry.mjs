// Diagnostic only: actual Experience/shell/panes/CSS with fictional identity and
// bounded, held reads. Not hosted authorization or a performance percentile test.
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const out=resolve(process.env.UI_EVIDENCE_DIR||join(tmpdir(),'academyos-ex02-geometry'));
await mkdir(out,{recursive:true});
const sources=['apps/web/src/components/experience-workspace.tsx','apps/web/src/components/workspace-panes.tsx','apps/web/src/components/workspace-shell.tsx','apps/web/src/app/globals.css'];
const inputs=Object.fromEntries(await Promise.all(sources.map(async name=>[name,createHash('sha256').update(await readFile(join(root,name))).digest('hex')])));
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Experience from '${root}/apps/web/src/components/experience-workspace.tsx';createRoot(document.getElementById('root')).render(<Experience locale={new URLSearchParams(location.search).get('locale')} academy="00000000-0000-4000-8000-000000000001" role="owner" calendar={new URLSearchParams(location.search).get('view')!=='home'} anchor="2026-11-01"/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fictional-identity-and-link',setup(b){
 b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'identity',namespace:'test'}));
 b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));
 b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='identity'?`export function useUser(){return {isLoaded:true,user:{id:'user_geometry_fixture'}}}export function UserButton(){return null;}`:`import React from 'react';export default function Link({prefetch,children,...props}){return <a {...props}>{children}</a>}`,resolveDir:root,loader:'tsx'}));
}}]});
const css=await readFile(join(root,sources[3]),'utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;const results=[],errors=[];
try{
 browser=await chromium.launch();
 for(const view of ['home','calendar'])for(const locale of ['en','ar'])for(const width of [1440,1024,390,360,320]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));let held=false,release,phase='full',reads=0;
  await page.route('**/api/experience',async route=>{
   reads++;const body=route.request().postDataJSON();if(held)await new Promise(r=>{release=r;});
   if(['denied','unavailable'].includes(phase))return route.fulfill({status:phase==='denied'?403:503,json:{error:phase}});
   const items=Array.from({length:phase==='short'?3:40},(_,i)=>{const id=`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`;return {id,program:id,day:'2026-11-01',date:'2026-11-01',starts_at:'2026-11-01T15:00:00Z',ends_at:'2026-11-01T16:00:00Z',title:`Fictional session ${i+1}`,branch:'Fictional branch',sport:'Football',sport_ar:'كرة القدم',timezone:'Africa/Cairo',state:'draft',published:false,capacity:18,roster_count:0};});
   const context={academy_id:'00000000-0000-4000-8000-000000000001',academy_name:'Fictional geometry academy',timezone:'Africa/Cairo',today:'2026-11-01'};
   const panels=Object.fromEntries(['unfinished_programs','private_publication_reviews','corrections','feedback_reviews','invitations','incomplete_attendance'].map(key=>[key,{state:'ready',count:1}]));
   const data=view==='home'?{context,as_of:'2026-11-01T12:00:00Z',panels:{...panels,today:{state:'ready',count:Math.min(items.length,5),items:items.slice(0,5),more:false}}}:{context,as_of:'2026-11-01T12:00:00Z',from:body.from,to:body.to,total:items.length,items,more:false,next:null};
   await route.fulfill({json:{data}});
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/?locale=${locale}&view=${view}`);
  await expect(page.locator('.experience-session')).toHaveCount(view==='home'?5:40);
  await page.locator('.workspace-center').evaluate(el=>{el.dataset.geometryProbe='same-center';el.scrollTop=600;if(getComputedStyle(el).overflowY==='visible')window.scrollTo(0,600);});
  async function snapshot(){return page.evaluate(()=>{const el=document.querySelector('.workspace-center'),input=document.querySelector('input[type=search]');return {sameCenter:el.dataset.geometryProbe==='same-center',scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,overflowY:getComputedStyle(el).overflowY,windowY:window.scrollY,documentHeight:document.documentElement.scrollHeight,inputY:input?.getBoundingClientRect().top,privateRows:document.querySelectorAll('.experience-session').length,blocks:Object.fromEntries(['.task-header','.task-header>div','.experience-reload','.task-header>div>p:last-child','.experience-task-grid','.calendar-toolbar','.experience-sessions>header','.experience-sessions>p'].map(selector=>{const node=document.querySelector(selector),rect=node?.getBoundingClientRect();return [selector,rect?{top:rect.top,height:rect.height,marginTop:getComputedStyle(node).marginTop,marginBottom:getComputedStyle(node).marginBottom}:null]}))};});}
  const before=await snapshot();const start=reads;held=true;
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect.poll(()=>reads).toBe(start+1);await expect(page.locator('.experience-session')).toHaveCount(0);
  const during=await snapshot();
  await expect(page.locator('.experience-task-card')).toHaveCount(0);
  await expect(page.getByText('Fictional geometry academy',{exact:true})).toHaveCount(0);
  if(process.env.EX02_HEADER_BASELINE!=='1'){assert.ok(Math.abs(during.inputY-before.inputY)<=1,`loaded-page search does not move while private context/counts are checked (${view} ${locale} ${width}: ${before.inputY} → ${during.inputY})`);assert.ok(Math.abs(during.blocks['.experience-reload'].top-before.blocks['.experience-reload'].top)<=1,'disabled reload stays in its original position');}assert.ok(during.sameCenter,'same center DOM node; no shell-remount inference');
  if(process.env.EX02_GEOMETRY_BASELINE!=='1'){
   const status=page.getByRole('status');await expect(status).toHaveCount(1);
   const bounds=await status.boundingBox();assert.ok(bounds&&bounds.y>=0&&bounds.y+bounds.height<=900,'checking feedback stays in view at the retained scroll position');assert.ok(await status.evaluate(el=>{const r=el.getBoundingClientRect(),front=document.elementFromPoint(r.left+Math.min(16,r.width/2),r.top+r.height/2);return front===el||el.contains(front);}), 'checking feedback is not occluded by the sticky toolbar');
  }
  if(width===1440||width===320)await page.screenshot({path:join(out,`${view}-${locale}${width===320?'-320':''}-masked.png`),fullPage:width!==320});
  held=false;release();await expect(page.locator('.experience-session')).toHaveCount(view==='home'?5:40);const after=await snapshot();
  if(process.env.EX02_GEOMETRY_BASELINE!=='1'){
   assert.equal(during.scrollTop,before.scrollTop,'pending read preserves center scroll without private rows');
   assert.equal(during.windowY,before.windowY,'pending read preserves phone document scroll');
   assert.equal(after.scrollTop,before.scrollTop,'same-size completed result retains center scroll');
   assert.equal(after.windowY,before.windowY,'same-size completed result retains phone document scroll');
  }
  // A genuinely shorter current result needs separate treatment from a temporary
  // loading gap: never preserve a stale/private record merely to fill geometry.
  phase='short';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.locator('.experience-session')).toHaveCount(3);const shortened=await snapshot();
  assert.equal(reads-start,2,'one read per deliberate revalidation; geometry probing starts no reads');
  assert.ok(shortened.scrollHeight<before.scrollHeight,'genuinely shorter results release the temporary reservation');
  const failures=[];
  for(const failure of ['unavailable','denied']){
   phase=failure;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
   await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.experience-session')).toHaveCount(0);
   const result=await snapshot();assert.ok(result.scrollHeight<before.scrollHeight,'failure releases geometry; no stale result retained');
   failures.push({failure,...result});
  }
  assert.equal(reads-start,4,'no automatic retry or geometry-triggered read after failures');
  results.push({view,locale,width,before,during,after,shortened,failures,revalidationReads:reads-start,temporaryClamp:before.scrollTop>during.scrollTop+1||before.windowY>during.windowY+1});
  await context.close();
 }
 assert.deepEqual(errors,[]);
 await writeFile(join(out,'receipt.json'),JSON.stringify({status:'measured',runtime:process.version,inputs,scope:'actual production components/CSS; fictional bounded Home and40-row Calendar; native hosted not inferred',results,errors},null,2));
 console.log(JSON.stringify({status:'measured',cases:results.length,temporaryClampCases:results.filter(x=>x.temporaryClamp).length,evidence:out}));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
