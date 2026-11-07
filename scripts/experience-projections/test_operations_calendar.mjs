// Actual Owner Calendar, same fictional source records as the selected studio.
// Baseline/current source comparison, not hosted identity, database or write proof.
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,relative,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..'),baseline=process.argv[2],out=resolve(process.argv[3]??resolve(tmpdir(),'academyos-operations-calendar'));
if(baseline)assert.match(baseline,/^[a-f0-9]{7,40}$/);
await mkdir(out,{recursive:true});
const {sessions:referenceSessions}=await import(pathToFileURL(resolve(root,'design/owner-design-studio-2026-11-03/data.js')));
const source=(path,ref)=>ref?Promise.resolve(execFileSync('git',['show',`${ref}:${path}`],{cwd:root,encoding:'utf8'})):readFile(resolve(root,path),'utf8');
const academy='00000000-0000-4000-8000-000000000001',context={academy_id:academy,academy_name:'Synthetic Academy',branch_name:'Cairo branch',timezone:'Africa/Cairo',today:'2026-11-03'};
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const fixtures=referenceSessions.filter(s=>s.branch==='cairo'&&s.date>='2026-11-02'&&s.date<='2026-11-08').map((s,i)=>({id:uid(i+10),program:uid(i+10),day:s.status==='moved'?'2026-10-28':s.date,date:s.date,starts_at:`${s.date}T${String(Number(s.start.slice(0,2))-2).padStart(2,'0')}${s.start.slice(2)}:00Z`,ends_at:`${s.date}T${String(Number(s.end.slice(0,2))-2).padStart(2,'0')}${s.end.slice(2)}:00Z`,title:s.en,branch:'Cairo branch',sport:'Football',sport_ar:'كرة القدم',timezone:'Africa/Cairo',state:s.status,published:s.status==='published',capacity:18,roster_count:s.roster}));
fixtures.sort((a,b)=>a.starts_at.localeCompare(b.starts_at)||a.id.localeCompare(b.id));
const adapter=`import React from'react';export function useUser(){return {isLoaded:true,user:{id:'user_calendar_fixture'}}}export function UserButton(){return <button>Fictional account</button>}`;
const report={reactMode:process.env.UI_REACT_MODE==='development'?'development':'production',scope:'Actual components with fictional identity/transport; reference dates/names/times/states reused; no hosted/DB/permission/cost percentile claim',baseline,results:[],layouts:[],cases:[]};
const browser=await chromium.launch();report.browser=browser.version();
try {
 for(const ref of baseline?[baseline,null]:[null]){
  const bundle=await build({stdin:{contents:`import React from'react';import{createRoot}from'react-dom/client';import Runtime from'${root}/apps/web/src/components/workspace-runtime.tsx';import Experience from'${root}/apps/web/src/components/experience-workspace.tsx';const p=new URLSearchParams(location.search);createRoot(document.getElementById('root')).render(<Runtime academy="${academy}"><Experience locale={p.get('locale')||'en'} academy="${academy}" role="owner" calendar anchor="2026-11-02"/></Runtime>);`,loader:'tsx',resolveDir:root},bundle:true,write:false,format:'iife',jsx:'automatic',define:{'process.env.NODE_ENV':JSON.stringify(process.env.UI_REACT_MODE==='development'?'development':'production')},plugins:[{name:'fictional-calendar',setup(b){
   b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fixture'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
   b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='clerk'?adapter:`import React from'react';export default function Link({children,prefetch,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));
   b.onLoad({filter:/\/components\/experience-workspace\.tsx$/},async a=>({contents:await source(relative(root,a.path),ref),loader:'tsx',resolveDir:resolve(a.path,'..')}));
  }}]});
  const css=await source('apps/web/src/app/globals.css',ref);
  const server=createServer(async(req,res)=>{
   if(req.url.startsWith('/reference/')){const name=req.url.split('?')[0].slice('/reference/'.length)||'index.html';if(!['index.html','app.js','data.js','studio.css','picker.css'].includes(name)){res.writeHead(404).end();return;}res.setHeader('Content-Type',extname(name)==='.js'?'text/javascript':extname(name)==='.css'?'text/css':'text/html');res.end(await readFile(resolve(root,'design/owner-design-studio-2026-11-03',name)));return;}
   res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin=`http://127.0.0.1:${server.address().port}`,page=await browser.newPage({viewport:{width:1600,height:1000}});let reads=[],scenario='normal',longNames=false,delay=0,missingProgram='';const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/experience',async route=>{
   const body=route.request().postDataJSON();reads.push({action:body.action,from:body.from,to:body.to,cursor:!!body.cursor});if(delay)await new Promise(r=>setTimeout(r,delay));
   if(scenario==='denied'||scenario==='unavailable')return route.fulfill({status:scenario==='denied'?403:503,json:{error:scenario}});
   assert.ok(['owner_calendar','owner_current_calendar'].includes(body.action),'Calendar must not fetch Home or another role');
   const from=body.from??'2026-11-02',to=body.to??'2026-11-08';
   let items=fixtures.filter(s=>s.date>=from&&s.date<=to);if(scenario==='missing')items=items.filter(s=>s.program!==missingProgram);if(scenario==='empty')items=[];
   if(scenario==='cancelled')items=items.map((s,i)=>i? s:{...s,state:'cancelled',published:false});
   if(longNames)items=items.map(s=>({...s,title:'برنامج أكاديمية تجريبية لتدريب المهارات وتطوير أداء اللاعبين '.repeat(3),branch:'الفرع التجريبي في القاهرة للاختبار'}));
   const more=scenario==='partial',next=more?{at:items.at(-1).starts_at,id:items.at(-1).id,day:items.at(-1).day,from,to}:null;
   return route.fulfill({json:{data:{context,as_of:'2026-11-03T12:00:00Z',anchor:context.today,from,to,total:items.length+(more?3:0),items:items.map(s=>({...s,cursor:{at:s.starts_at,id:s.id,day:s.day,from,to}})),more,next}}});
  });
  async function open(locale='en'){await page.goto(origin+'/?locale='+locale);await expect(page.getByRole('button',{name:/Reload current view|إعادة تحميل العرض الحالي/})).toBeEnabled();await expect(page.getByRole('status')).toHaveCount(0);}
  async function currentReady(){await expect(page.getByRole('button',{name:/Reload current view|إعادة تحميل العرض الحالي/})).toBeEnabled();await expect(page.getByRole('status')).toHaveCount(0);}
  try {
   await open();const initialReads=reads.length,start=reads.length;
   const selected=page.locator(`[data-occurrence="${fixtures[0].program}:${fixtures[0].day}"]`);await selected.click();await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveAttribute('href',new RegExp(`/programs/${fixtures[0].program}/${fixtures[0].day}\\?from=${fixtures[0].date}&return=calendar$`));
   const inspector=page.locator('.workspace-inspector');const structured=await inspector.locator('dl').count()>0;
   await page.screenshot({path:resolve(out,ref?'before-1600.png':'after-1600.png')});
   await page.getByRole('button',{name:'Back',exact:true}).click();await expect(selected).toBeFocused();await page.getByRole('searchbox').fill('Football');await expect(page.locator('.experience-session')).toHaveCount(4);
   const localReads=reads.length-start;assert.equal(localReads,0);
   await selected.click();delay=100;const beforeRefresh=reads.length;await page.getByRole('button',{name:'Reload current view',exact:true}).click();await expect(page.locator('.experience-session')).toHaveCount(0);await currentReady();await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);await expect(page.getByRole('searchbox')).toHaveValue('Football');assert.equal(reads.length-beforeRefresh,1);delay=0;
   const geometry=await page.evaluate(()=>({title:getComputedStyle(document.querySelector('h1')).fontSize,boardColumns:document.querySelector('.operations-week-board')?getComputedStyle(document.querySelector('.operations-week-board')).gridTemplateColumns.split(' ').length:null,bodyWidth:document.documentElement.scrollWidth,viewport:innerWidth,firstSessionTop:document.querySelector('.experience-session')?.getBoundingClientRect().top,firstSessionHeight:document.querySelector('.experience-session')?.getBoundingClientRect().height,navigationWidth:document.querySelector('.workspace-sidebar')?.getBoundingClientRect().width,inspectorWidth:document.querySelector('.workspace-inspector')?.getBoundingClientRect().width}));
   report.results.push({source:ref??'working-tree',componentSha256:createHash('sha256').update(await source('apps/web/src/components/experience-workspace.tsx',ref)).digest('hex'),cssSha256:createHash('sha256').update(css).digest('hex'),initialReads,localReads,recheckReads:reads.length-beforeRefresh,selectionRetained:true,searchRetained:true,rowFocusRestored:true,structuredInspector:structured,...geometry});
   if(ref)continue;
   assert.equal(geometry.boardColumns,7);assert.equal(structured,true);assert.equal(geometry.title,'25px');
   const languageStart=reads.length;await page.getByRole('link',{name:'العربية',exact:true}).click();await expect(page.getByRole('searchbox')).toHaveValue('Football');await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(1);await page.getByRole('link',{name:'English',exact:true}).click();assert.equal(reads.length,languageStart,'Local language change preserves filter/selection without an operating read');report.cases.push('In-place EN/AR language switch retains filter/selection with0 operating reads');
   await page.getByRole('button',{name:'Back',exact:true}).click();await page.getByRole('searchbox').fill('No such session');await expect(page.getByText(/No match on this page/)).toBeVisible();await page.getByRole('button',{name:'Clear search',exact:true}).click();await expect(page.locator('.experience-session')).toHaveCount(10);
   scenario='partial';await page.getByRole('button',{name:'Reload current view',exact:true}).click();await currentReady();await expect(page.getByText('No sessions on this page',{exact:true}).first()).toBeVisible();await expect(page.getByText('No sessions',{exact:true})).toHaveCount(0);scenario='normal';
   report.cases.push('Partial period days say no sessions on this page, never complete-empty; local clear search needs no read');
   const layoutWidths=[320,360,390,768,1280,1600];
   for(const locale of ['en','ar'])for(const theme of ['light','dark'])for(const width of layoutWidths){
    await page.setViewportSize({width,height:1000});await open(locale);if(theme==='dark')await page.getByRole('button',{name:locale==='ar'?'الوضع الداكن':'Dark mode',exact:true}).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${locale}/${theme}/${width} overflow`);
    await expect(page.locator('.operations-week-board')).toBeVisible();const before=reads.length;await page.locator('.experience-session').first().click();await expect(page.getByRole('link',{name:locale==='ar'?'فتح هذا التاريخ':'Open this date',exact:true})).toBeVisible();await page.getByRole('button',{name:locale==='ar'?'رجوع':'Back',exact:true}).click();await expect(page.locator('.experience-session').first()).toBeFocused();assert.equal(reads.length,before);
    if(width<768)for(const target of await page.locator('.operations-calendar-toolbar button').all()){const size=await target.boundingBox();assert.ok(size.width>=44&&size.height>=48,`Phone control target ${size.width}x${size.height}`);}
    report.layouts.push({locale,theme,width,overflow:false,selectionAndBackZeroReads:true,views:['week','month']});
    if((width===390||width===1600)&&(theme==='light'||locale==='ar'))await page.screenshot({path:resolve(out,`${locale}-${theme}-${width}.png`)});
    const viewStart=reads.length;await page.getByRole('button',{name:locale==='ar'?'شهر':'Month',exact:true}).click();await currentReady();await expect(page.locator('.calendar-day')).toHaveCount(42);assert.equal(reads.length-viewStart,1,'View change has one bounded read');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Month ${locale}/${theme}/${width} overflow`);await page.getByRole('button',{name:locale==='ar'?'أسبوع':'Week',exact:true}).click();await currentReady();
   }
   longNames=true;await page.setViewportSize({width:320,height:900});await open('ar');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Long Arabic at320');await page.screenshot({path:resolve(out,'ar-long-320.png')});longNames=false;
   await page.setViewportSize({width:1600,height:1000});await open();await page.getByRole('button',{name:'Month',exact:true}).click();await currentReady();await expect(page.locator('.calendar-day')).toHaveCount(42);assert.ok(reads.at(-1).to>reads.at(-1).from);await page.screenshot({path:resolve(out,'en-month-1600.png')});await page.getByRole('button',{name:'Week',exact:true}).click();await currentReady();
   const moved=fixtures.find(s=>s.state==='moved');await page.locator(`[data-occurrence="${moved.program}:${moved.day}"]`).click();await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveAttribute('href',new RegExp(`/programs/${moved.program}/2026-10-28\\?from=2026-11-07&return=calendar$`));await page.getByRole('button',{name:'Back',exact:true}).click();
   scenario='cancelled';await page.getByRole('button',{name:'Reload current view',exact:true}).click();await currentReady();await page.locator('.experience-session').first().click();await expect(page.getByText('Cancelled. Retained history stays available to the Owner.',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Back',exact:true}).click();scenario='normal';await page.getByRole('button',{name:'Reload current view',exact:true}).click();await currentReady();
   report.cases.push('Moved session preserves original occurrence route and effective-date hint; cancelled context has no operating date link; phone control targets >=44x48');
   missingProgram=(await page.locator('.experience-session').first().getAttribute('data-occurrence')).split(':')[0];await page.locator('.experience-session').first().click();scenario='missing';await page.getByRole('button',{name:'Reload current view',exact:true}).click();await currentReady();await expect(page.locator('.experience-session[aria-pressed="true"]')).toHaveCount(0);await expect(page.getByRole('link',{name:'Open this date',exact:true})).toHaveCount(0);
   scenario='denied';await page.getByRole('button',{name:'Reload current view',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Access is no longer available');await expect(page.locator('.experience-session')).toHaveCount(0);
   scenario='unavailable';await open();await expect(page.getByRole('alert')).toContainText('unavailable');await expect(page.getByText('No sessions in this selection.',{exact:true})).toHaveCount(0);
   scenario='empty';await open();await expect(page.getByText('No sessions in this selection.',{exact:true})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
   report.cases.push('42-cell bounded month; lost selection disappears after current read; denied clears; unavailable differs from confirmed empty; long Arabic320');
   await page.goto(origin+'/reference/index.html?v=2&lang=en#calendar');await expect(page.locator('.week-board')).toBeVisible();await page.locator('[data-session="s4"]').click();await page.screenshot({path:resolve(out,'reference-en-1600.png')});
   assert.deepEqual(errors,[]);
  } finally {await page.close();await new Promise(r=>server.close(r));}
 }
 await writeFile(resolve(out,'ui.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:true,comparison:report.results,layoutCases:report.layouts.length,cases:report.cases}));
} finally {await browser.close();}
