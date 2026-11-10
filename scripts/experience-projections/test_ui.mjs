// Actual component with synthetic scoped read adapters; not hosted/RLS evidence.
import {build} from 'esbuild';import{chromium,expect}from'@playwright/test';import{createServer}from'node:http';import{readFile,mkdir,writeFile}from'node:fs/promises';import{resolve}from'node:path';import{tmpdir}from'node:os';import assert from'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),mode=process.env.UI_REACT_MODE==='development'?'development':'production';
const adapter=`import React from 'react';let actor='user_synthetic';const listeners=new Set();window.addEventListener('synthetic-session',e=>{actor=e.detail;listeners.forEach(f=>f());});export function useUser(){const id=React.useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>actor);return {isLoaded:true,user:id?{id}:null};}export function UserButton(){return <button>Test account</button>}`;
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Runtime from '${root}/apps/web/src/components/workspace-runtime.tsx';import Experience from '${root}/apps/web/src/components/experience-workspace.tsx';const p=new URLSearchParams(location.search);createRoot(document.getElementById('root')).render(<React.StrictMode><Runtime academy="00000000-0000-4000-8000-000000000001"><Experience locale={p.get('locale')||'en'} academy="00000000-0000-4000-8000-000000000001" role={p.get('role')||'owner'} calendar={p.has('calendar')} anchor={p.get('anchor')||undefined}/></Runtime></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'test-adapters',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,prefetch:_prefetch,...props}){return <a {...props}>{children}</a>}`,resolveDir:root,loader:'tsx'}));}}],define:{'process.env.NODE_ENV':JSON.stringify(mode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="${new URL(req.url,'http://localhost').searchParams.get('locale')==='ar'?'ar':'en'}" dir="${new URL(req.url,'http://localhost').searchParams.get('locale')==='ar'?'rtl':'ltr'}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script>`);});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const academy='00000000-0000-4000-8000-000000000001',link='00000000-0000-4000-8000-000000000002',context={academy_id:academy,academy_name:'Synthetic Academy',branch_name:'Main Demo Branch',timezone:'Africa/Cairo',today:'2026-11-01'};
let denied=false,unavailable=false,invalidCursor=false,training=true,reads=[],readDelay=0,omitFirst=false,emptyToday=false;
function rows(role,from,to){return Array.from({length:55},(_,i)=>{const id=`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,day='2026-11-01';return{id,program:id,day,date:day,starts_at:'2026-11-01T15:00:00Z',ends_at:'2026-11-01T16:00:00Z',title:`Synthetic Session ${i+1}`,branch:'Main Demo Branch',sport:'Football',sport_ar:'كرة القدم',timezone:'Africa/Cairo',state:'published',published:true,capacity:role==='guardian'?null:18,roster_count:role==='guardian'?null:18,cursor:{at:'2026-11-01T15:00:00+00:00',id,day,from,to}};});}
await page.route('**/api/guardians',route=>route.fulfill({json:{data:{items:denied?[]:[{id:link,display_name:'Alex Demo',branch_name:'Main Demo Branch'}],more:false}}}));
await page.route('**/api/experience',async route=>{const b=route.request().postDataJSON();reads.push(b);if(readDelay)await new Promise(r=>setTimeout(r,readDelay));if(invalidCursor&&b.cursor)return route.fulfill({status:422,json:{error:'invalid'}});if(denied||unavailable)return route.fulfill({status:denied?403:503,json:{error:denied?'denied':'unavailable'}});const role=b.action.split('_')[0];if(b.action.endsWith('_home'))return route.fulfill({json:{data:{context,as_of:'2026-11-01T12:00:00Z',panels:{today:{state:training?'ready':'unavailable',count:emptyToday?0:55,items:training?(emptyToday?[]:rows(role,context.today,context.today).slice(0,5)):undefined,more:!emptyToday},...(role==='owner'?{unfinished_programs:{state:'ready',count:4},feedback_reviews:{state:'ready',count:3,tasks:[{id:link,event:link,player:link,kind:'feedback'}]},incomplete_attendance:{state:'ready',count:2,tasks:[{id:link,title:'Synthetic register',kind:'attendance'}]},private_publication_reviews:{state:'ready',count:1,tasks:[{id:link,program:link,title:'publish',kind:'publication'}]}}:role==='trainer'?{feedback_drafts:{state:'ready',count:2}}:{next_session:{state:training?'ready':'unavailable',item:training?{id:link,title:'Synthetic Next Session',starts_at:'2099-11-01T15:00:00Z',ends_at:'2099-11-01T16:00:00Z',timezone:'Africa/Cairo',status:null}:null},latest_feedback:{state:'ready',item:{id:link,title:'Synthetic published feedback'}}})}}}});if(role==='guardian'&&!training)return route.fulfill({status:403,json:{error:'denied'}});if(b.action==='owner_current_calendar'){b.from=b.view==='month'?'2026-11-01':context.today;b.to=b.view==='month'?'2026-12-12':'2026-11-07';}const all=rows(role,b.from,b.to).filter((_,i)=>!omitFirst||i!==0),start=b.cursor?50:0,items=all.slice(start,start+50);return route.fulfill({json:{data:{context,as_of:'2026-11-01T12:00:00Z',anchor:context.today,from:b.from,to:b.to,total:55,items,more:start===0,next:start===0?items.at(-1).cursor:null}}});});
const out=resolve(process.env.UI_EVIDENCE_DIR??resolve(tmpdir(),'academyos-experience-projections-ui'));await mkdir(out,{recursive:true});
async function open(query=''){await page.goto(`http://127.0.0.1:${server.address().port}/?`+query);await expect(page.locator('.experience-reload')).toBeEnabled();await expect(page.getByRole('status')).toHaveCount(0);}
try{
 // A date hint selects a query, never authority or private payload reuse.
 for(const [anchor,expected] of [['2026-11-08',['owner_calendar']],['2026-02-30',['owner_current_calendar']]]){
  await page.goto(`http://127.0.0.1:${server.address().port}/?authProbe`);await expect(page.getByRole('status')).toHaveCount(0);await page.evaluate(()=>sessionStorage.clear());const start=reads.length;
  await open('calendar&anchor='+anchor);await expect(page.getByText(/55 sessions in this period/)).toBeVisible();assert.deepEqual(reads.slice(start).map(x=>x.action),expected,'civil hint/fallback request budget');
 }
 await page.evaluate(()=>sessionStorage.setItem('academyos:experience:user_synthetic:00000000-0000-4000-8000-000000000001:owner:calendar',JSON.stringify({from:'2026-12-06',view:'week',filter:'',selection:null})));
 let hintStart=reads.length;await open('calendar&anchor=2026-11-01');assert.equal(reads[hintStart].from,'2026-12-06','saved return period wins over initial hint');assert.equal(reads.length-hintStart,1);
 denied=true;await page.evaluate(()=>sessionStorage.clear());hintStart=reads.length;await open('calendar&anchor=2026-11-01');await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.locator('.experience-session').count(),0,'hint never bypasses denied current-authority read');assert.equal(reads.length-hintStart,1);denied=false;
 await open();await expect(page.getByRole('heading',{name:'Academy operations',exact:true})).toBeVisible();assert.equal(await page.locator('.experience-task-card').count(),4);assert.equal(await page.locator('.experience-session').count(),5);
 const metrics=page.getByRole('navigation',{name:'Operations summary',exact:true});
 await expect(metrics.getByRole('link',{name:/55 Sessions today/})).toHaveAttribute('href','#owner-today-schedule');
 await expect(metrics.getByRole('link',{name:/2 Registers needing marks Across the academy/})).toHaveAttribute('href','#owner-today-attention');
 const metricReads=reads.length;
 await metrics.getByRole('link',{name:/2 Registers needing marks/}).press('Enter');
 await expect(page.getByRole('heading',{name:'Needs your attention',exact:true})).toBeFocused();
 await expect(page.getByRole('link',{name:/Synthetic register Open register/})).toHaveAttribute('href',new RegExp('/attendance/'+link+'#return=home&attendance='+link+'$'));
 const attention=page.getByRole('region',{name:'Needs your attention',exact:true});
 await expect(attention.getByRole('link',{name:/Open workspace/})).toHaveCount(0);
 await expect(attention.getByRole('link',{name:'Open programs',exact:true}).first()).toHaveAttribute('href',/\/programs$/);

 assert.equal(reads.length,metricReads,'Scope links and queue rendering add no reads');
 await expect(page.locator('.operations-session').first()).toContainText('18');
 const beforeLayoutReads=reads.length;await page.locator('.layout-menu summary').click();await page.getByRole('button',{name:'Compact navigation',exact:true}).click();await expect(page.locator('.app-scene')).toHaveAttribute('data-navigation','compact');await page.getByRole('button',{name:'Reset layout',exact:true}).click();await page.locator('.layout-menu summary').click();assert.equal(reads.length,beforeLayoutReads,'Layout preferences must make no business requests');
 await page.locator('.experience-session').filter({hasText:'Synthetic Session 1'}).first().click();await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveAttribute('href',/\/programs\/.*\/2026-11-01\?from=2026-11-01&return=home$/);await page.getByRole('button',{name:'Back',exact:true}).click();await expect(page.locator('.experience-session').first()).toBeFocused();
 await open('calendar=1');await expect(page.getByText(/55 sessions in this period/)).toBeVisible();assert.equal(await page.locator('.experience-session').count(),50);
 await page.getByRole('button',{name:'More sessions',exact:true}).click();await expect(page.getByText(/5 on this page/)).toBeVisible();assert.equal(await page.locator('.experience-session').count(),5);await expect(page.getByText(/55 sessions in this period/)).toBeVisible();
 await page.getByRole('button',{name:'Previous page',exact:true}).click();await expect(page.locator('.experience-session')).toHaveCount(50);
 await page.getByRole('searchbox').fill('Not a session');await expect(page.getByText(/No match on this page/)).toBeVisible();await page.getByRole('searchbox').fill('');
 await page.locator('.experience-session').filter({hasText:'Synthetic Session 1'}).first().click();await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveAttribute('href',/&return=calendar$/);await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Month',exact:true}).click();await expect(page.locator('.calendar-day')).toHaveCount(42);assert.ok(reads.some(r=>r.from==='2026-11-01'&&r.to==='2026-12-12'));
 await page.screenshot({path:resolve(out,'owner-calendar-en-1440.png'),fullPage:true});
 await page.reload();await expect(page.locator('.calendar-day')).toHaveCount(42);assert.equal(await page.evaluate(()=>Object.entries(sessionStorage).some(([k,v])=>k.startsWith('academyos:experience:')&&v.includes('Synthetic Session'))),false,'Navigation context never stores session payloads');invalidCursor=true;await page.getByRole('button',{name:'More sessions',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await page.getByRole('button',{name:'Return to the current period',exact:true}).click();await expect(page.getByText(/55 sessions in this period/)).toBeVisible();invalidCursor=false;
 for(const role of ['owner','trainer','guardian'])for(const locale of ['en','ar'])for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});await open(`role=${role}&locale=${locale}`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${role} ${locale} ${width} overflow`);
  if(role==='owner'){await expect(page.getByRole('link',{name:locale==='ar'?'مراجعة النشر':'Review publication',exact:true})).toHaveAttribute('href',/publish\?job=/);await expect(page.getByRole('link',{name:locale==='ar'?'مراجعة الملاحظات المقدمة':'Review submitted feedback',exact:true})).toHaveAttribute('href',/development\?event=/);assert.equal(await page.getByRole('link',{name:'publish',exact:true}).count(),0);}
  if(role==='guardian'){await expect(page.getByRole('heading',{name:locale==='ar'?'التدريب القادم':'Next session',exact:true})).toBeVisible();await expect(page.getByText(locale==='ar'?'مجدول':'Scheduled',{exact:true})).toBeVisible();assert.equal(await page.getByRole('link',{name:'Open this date',exact:true}).count(),0);}
  if(width===390||width===1440)await page.screenshot({path:resolve(out,`${role}-home-${locale}-${width}.png`),fullPage:true});
 }
 for(const role of ['owner','trainer','guardian']){await page.setViewportSize({width:1440,height:1000});await open(`role=${role}`);await page.getByRole('button',{name:'Dark mode',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.screenshot({path:resolve(out,`${role}-home-en-dark-1440.png`),fullPage:true});}
 emptyToday=true;await open();
 await expect(page.getByRole('link',{name:/0 Sessions today/})).toBeVisible();
 await expect(page.getByText('No sessions in this selection.',{exact:true})).toBeVisible();
 await expect(page.getByRole('searchbox')).toBeVisible();
 emptyToday=false;unavailable=true;await open();
 await expect(page.getByRole('alert')).toContainText('This view is unavailable');
 await expect(page.locator('.operations-summary')).toHaveCount(0);
 unavailable=false;
 training=false;await open('role=guardian');await expect(page.getByText(/Training view unavailable for this link/)).toBeVisible();assert.equal(await page.locator('.experience-session').count(),0);training=true;
 unavailable=true;await page.locator('.experience-reload').click();await expect(page.getByRole('alert')).toContainText('unavailable');assert.equal(await page.locator('.experience-session').count(),0);unavailable=false;
 await open('role=trainer');denied=true;await page.locator('.experience-reload').click();await expect(page.getByRole('alert')).toContainText('Access is no longer available');assert.equal(await page.locator('.experience-session').count(),0);denied=false;
 // MP-B01: Owner-only same-scope checked content survives a bounded clean resume.
 // Initial/changed-scope/failed/denied reads keep the existing private fences.
 await open('role=owner&calendar=1');
 await expect(page.locator('.experience-session').first()).toBeVisible();
 await page.locator('.experience-session').first().click();
 const selectedKey=await page.locator('.experience-session[aria-pressed="true"]').getAttribute('data-occurrence');
 readDelay=250;const beforeResume=reads.length;
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('button',{name:'Week',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Week',exact:true})).toBeDisabled();
 await expect(page.locator('.experience-session')).toHaveCount(50);
 await expect(page.getByText('Checking for changes…',{exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveAttribute('aria-disabled','true');
 await page.waitForTimeout(40);await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
 await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveAttribute('data-occurrence',selectedKey);
 assert.equal(reads.length-beforeResume,1,'separated visible/focus and in-flight focus share one current read');
 const stored=await page.evaluate(()=>Object.entries(sessionStorage).filter(([k])=>k.startsWith('academyos:experience:')));
 assert.ok(stored.every(([,v])=>!v.includes('Synthetic Session')),'navigation persistence contains identifiers, never private sessions');
 readDelay=0;await page.reload();await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveAttribute('data-occurrence',selectedKey);
 omitFirst=true;await page.locator('.experience-reload').click();
 await expect(page.locator('.experience-reload')).toBeEnabled();
 await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(0);
 await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveCount(0);
 omitFirst=false;denied=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('alert')).toContainText('Access is no longer available');
 await expect(page.locator('.experience-session')).toHaveCount(0);denied=false;
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:null})));await expect(page.getByRole('link',{name:'Sign in',exact:true})).toBeVisible();assert.equal(await page.getByText('Synthetic Session 1',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'receipt.json'),JSON.stringify({mode,scope:'actual component with synthetic bounded read adapters; no hosted/database permission proof',cases:'EX-01: separated resume events coalesce; last checked Owner task retained only during bounded clean resume;initial/failed/denied/scope-change data fenced; selected ID restored from current projection and scoped navigation storage; missing/denied selection cleared; Owner/Trainer/Guardian home; week/month;50+5 paging authoritative55 count; filtered empty; unavailable; disabled link panel; revoked; account change; ENAR3203907681440',reads:reads.length},null,2));console.log('PASS actual role homes and calendar UI '+mode);
}finally{await browser.close();await new Promise(r=>server.close(r));}
