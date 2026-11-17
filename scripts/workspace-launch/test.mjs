// Real launch component, locators, account lifecycle, startup and root worker.
// Fictional slots and private destination stubs: not private-data/authority proof.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
const root=resolve(import.meta.dirname,'../..');
const before=process.argv.includes('--before-worker');
const sources=['apps/web/src/lib/workspace-launch.ts','apps/web/src/components/workspace-launch.tsx',
 'apps/web/src/components/prepared-workspace-startup.tsx','apps/web/public/prepared-workspace-worker.js',
 'apps/web/src/lib/workspace-public-shell.ts','apps/web/src/lib/register-device-account.ts',
 'apps/web/src/lib/register-device-slots.ts','apps/web/src/lib/workspace-device-slots.ts',
 'apps/web/src/app/[locale]/page.tsx','apps/web/src/components/owner-workspace-device.tsx','apps/web/src/components/prepared-register-panel.tsx',
 'scripts/workspace-launch/test.mjs'];
const hashes=Object.fromEntries(await Promise.all(sources.map(async p=>[p,createHash('sha256').update(await readFile(resolve(root,p))).digest('hex')])));
const evidence=resolve(root,'docs/07-handoff/evidence/mp-b01-wd71-coverage/launch.json');
if(process.argv.includes('--check')){
 const saved=JSON.parse(await readFile(evidence));assert.deepEqual(saved.hashes,hashes);assert.equal(saved.passed,true);
 console.log('PASS launch receipt source fingerprints current');process.exit(0);
}
const worker=before?execFileSync('git',['show','c151f49:apps/web/public/prepared-workspace-worker.js'],{cwd:root}):await readFile(resolve(root,sources[3]));
const bundle=(await build({stdin:{contents:`
 import{createRoot}from'react-dom/client';import Startup from './apps/web/src/components/prepared-workspace-startup';
 import Launch from './apps/web/src/components/workspace-launch';
 import * as launch from './apps/web/src/lib/workspace-launch';
 import * as account from './apps/web/src/lib/register-device-account';
 import {saveWorkspaceSlot} from './apps/web/src/lib/workspace-device-slots';
 import {writeRegisterSlot} from './apps/web/src/lib/register-device-slots';
 import {prepareWorkspaceShell} from './apps/web/src/lib/workspace-public-shell';
 window.test={...launch,...account,saveWorkspaceSlot,writeRegisterSlot,prepareWorkspaceShell};
 if(window.launchSubject!==undefined)createRoot(document.querySelector('#root')).render(<Launch locale={location.pathname.slice(1)} subject={window.launchSubject} enabled={window.launchEnabled}><h1>Public welcome</h1></Launch>);
 else createRoot(document.querySelector('#root')).render(<Startup/>);
 `,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',tsconfig:resolve(root,'apps/web/tsconfig.json'),
 define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'declared-private-destination-stubs',setup(b){
 b.onResolve({filter:/^\.\/(people-workspace|experience-workspace|prepared-register-panel|prepared-register-session)$/},a=>({path:a.path,namespace:'private-stub'}));
 b.onLoad({filter:/.*/,namespace:'private-stub'},({path})=>({loader:'tsx',resolveDir:root,contents:path.includes('prepared-register-session')?'export default function Session({children}){return children;}':path.includes('prepared-register-panel')?'export default function Register(){return <h1>Fictional register destination</h1>}':'export const PeopleJourney=()=> <h1>Fictional Players destination</h1>;export const ExperienceJourney=()=> <h1>Fictional Calendar destination</h1>;'}));
 }}]})).outputFiles[0].text;
let connected=true,launchSubject,launchEnabled=true;const requests=[];
const html=(launch=false)=>`<!doctype html><div id="academyos-public-workspace-shell"><div id="root"></div></div><script>${!launch||launchSubject===undefined?'':`window.launchSubject=${JSON.stringify(launchSubject)};window.launchEnabled=${launchEnabled};`}</script><script src="/_next/static/launch.js"></script>`;
const server=createServer((req,res)=>{
 if(!connected){req.socket.destroy();return;}
 requests.push({path:req.url,cookie:!!req.headers.cookie,authorization:!!req.headers.authorization});
 // Keep this launch-only fixture from modeling protected online reentry; that
 // separate behavior runs in the connected normal-workspace suite.
 if(req.method==='HEAD'&&req.url==='/prepared-workspace')return res.writeHead(503).end();
 if(req.url==='/prepared-workspace-worker.js')return res.writeHead(200,{'content-type':'application/javascript'}).end(worker);
 if(req.url==='/_next/static/launch.js')return res.writeHead(200,{'content-type':'application/javascript'}).end(bundle);
 if(req.url==='/prepared-workspace')return res.writeHead(200,{'content-type':'text/html','x-academyos-public-shell':'workspace-v1'}).end(html());
 if(/^\/(en|ar)\/workspace$/.test(req.url))return res.writeHead(200,{'content-type':'text/html'}).end('<h1>Fictional protected chooser</h1>');
 res.writeHead(200,{'content-type':'text/html'}).end(html(/^\/(en|ar)$/.test(req.url)));
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch(),context=await browser.newContext();let page=await context.newPage();
const academy='00000000-0000-4000-8000-000000000001',event='00000000-0000-4000-8000-000000000002';
const players=`/en/workspace/${academy}/players`,calendar=`/ar/workspace/${academy}/calendar?anchor=2099-11-01`,attendance=`/ar/workspace/${academy}/attendance/${event}`;
const checks=[],pass=name=>{checks.push(name);console.log('PASS '+name);};
const online=async()=>{connected=true;await context.setOffline(false);};
const offline=async()=>{connected=false;await context.setOffline(true);};
const openLaunch=async(path,target)=>{
 await page.goto(origin+path).catch(e=>{if(!String(e).includes('ERR_ABORTED'))throw e;});
 if(target)await page.waitForURL(origin+target);
};
try{
 await page.goto(origin+players);await page.waitForFunction(()=>window.test);
 await page.evaluate(async({academy})=>{
  const t=window.test;await t.armRegisterAccount('user_launch');
  t.saveWorkspaceSlot({subject:'user_launch',academy},{device:crypto.randomUUID(),namespace:crypto.randomUUID(),generation:crypto.randomUUID(),mode:'active'});
  await t.prepareWorkspaceShell();
 },{academy});
 assert.equal(await page.evaluate(()=>window.test.readWorkspaceLaunch()),players);
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.close();page=await context.newPage();
 await offline();
 if(before){
  await assert.rejects(page.goto(origin+'/en'),/ERR_INTERNET_DISCONNECTED|ERR_FAILED/);
  pass('Before-worker negative control cannot launch cached workspace from manifest /en');
 }else{
  await openLaunch('/en',players);await expect(page.getByRole('heading',{name:'Fictional Players destination'})).toBeVisible();
  pass('Closed tab -> offline /en -> remembered Players through actual root worker/startup');
  await online();await page.goto(origin+calendar);
  await page.evaluate(()=>window.test.rememberWorkspaceLaunch('user_launch'));await offline();
  await openLaunch('/en',calendar);await expect(page.getByRole('heading',{name:'Fictional Calendar destination'})).toBeVisible();
  pass('English manifest entry restores Arabic Calendar and validated anchor');
  await online();await page.goto(origin+attendance);
  await page.evaluate(({academy,event})=>{
   window.test.writeRegisterSlot('user_launch',academy,{event,device:crypto.randomUUID(),namespace:crypto.randomUUID(),generation:1,mode:'active'});
   window.test.rememberWorkspaceLaunch('user_launch');
   sessionStorage.setItem('attendance:user_launch:'+academy+':'+event,'00000000-0000-4000-8000-000000000003');
  },{academy,event});
  await offline();await openLaunch('/en',attendance);
  await expect(page.getByText('يوجد حفظ أصلي يحتاج التحقق عبر الإنترنت قبل تسجيل حضور آخر.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Fictional register destination'})).toHaveCount(0);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('attendance:user_launch:'+location.pathname.split('/')[3]+':'+location.pathname.split('/')[5])),'00000000-0000-4000-8000-000000000003');
  pass('Launch to Attendance keeps same-tab original fenced and unchanged');
  await online();await page.goto(origin+players);await page.evaluate(()=>window.test.rememberWorkspaceLaunch('user_launch'));
  const valid=await page.evaluate(()=>localStorage.getItem(window.test.WORKSPACE_LAUNCH_KEY));
  for(const change of [
   {subject:'user_other'},{generation:'00000000-0000-4000-8000-000000000099'},
   {path:'https://evil.invalid/'},{path:'//evil.invalid/'},{path:'/en/platform'},
   {path:players+'?x=1'},{path:players+'#private'},
   {path:calendar.replace('2099-11-01','2099-02-31')},{path:calendar+'&x=1'},
   {extra:true},{slot:{namespace:'00000000-0000-4000-8000-000000000099',generation:1}}
  ]){
   assert.equal(await page.evaluate(({valid,change})=>{localStorage.setItem(window.test.WORKSPACE_LAUNCH_KEY,JSON.stringify({...JSON.parse(valid),...change}));return window.test.readWorkspaceLaunch();},{valid,change}),null);
  }
  pass('Wrong account/generation, unsafe URL, uncovered route, invalid date/query and changed slot are rejected');
  for(const kind of ['empty','corrupt','ending','slot-cleaning','slot-missing','changed-generation']){
   await online();await page.goto(origin+players);
   await page.evaluate(({valid,kind,academy})=>{
    localStorage.setItem(window.test.WORKSPACE_LAUNCH_KEY,valid);
    const key='academyos.register-account.v1',a=JSON.parse(localStorage.getItem(key));
    a.mode='active';localStorage.setItem(key,JSON.stringify(a));
    const s='academyos.workspace-slot.v1:user_launch:'+academy;
    if(kind==='empty')localStorage.removeItem(window.test.WORKSPACE_LAUNCH_KEY);
    if(kind==='corrupt')localStorage.setItem(window.test.WORKSPACE_LAUNCH_KEY,'{');
    if(kind==='ending'){a.mode='ending';localStorage.setItem(key,JSON.stringify(a));}
    if(kind==='changed-generation'){a.generation=crypto.randomUUID();localStorage.setItem(key,JSON.stringify(a));}
    if(kind==='slot-cleaning'){const slot=JSON.parse(localStorage.getItem(s));slot.mode='cleaning';localStorage.setItem(s,JSON.stringify(slot));}
    if(kind==='slot-missing')localStorage.removeItem(s);
   },{valid,kind,academy});
   await offline();await openLaunch('/ar');
   await expect(page.getByRole('link',{name:'تسجيل الدخول عند الاتصال'})).toBeVisible();
   assert.equal(new URL(page.url()).pathname,'/ar');
   assert.equal(await page.locator('.public-task').getAttribute('dir'),'rtl');
  }
  pass('Empty/corrupt/ending/retired/removed/stale stores stay on explicit Arabic public boundary without private destination');
  await online();await page.goto(origin+players);
  await page.evaluate(({valid,academy})=>{
   const saved=JSON.parse(valid);
   localStorage.setItem('academyos.register-account.v1',JSON.stringify({subject:saved.subject,generation:saved.generation,mode:'active',selection:null}));
   window.test.saveWorkspaceSlot({subject:saved.subject,academy},{...saved.slot,device:crypto.randomUUID(),mode:'active'});
   localStorage.setItem(window.test.WORKSPACE_LAUNCH_KEY,valid);
  },{valid,academy});
  launchSubject='user_launch';await openLaunch('/en',players);
  pass('Matching currently authenticated subject resumes its validated prepared destination online');
  await online();launchSubject=null;await page.goto(origin+'/en');await expect(page.getByRole('heading',{name:'Public welcome'})).toBeVisible();
  launchSubject='user_other';await openLaunch('/en','/en/workspace');await expect(page.getByRole('heading',{name:'Fictional protected chooser'})).toBeVisible();
  launchSubject='user_launch';launchEnabled=false;await page.goto(origin+'/en');await expect(page.getByRole('heading',{name:'Public welcome'})).toBeVisible();
  pass('No current authenticated subject stays public; different current subject uses normal chooser; disabled capability never resumes');
  await page.evaluate(async({academy,event})=>{
   // These locators refer to fictional stores only. The real cleanup lifecycle
   // is exercised without fabricating a repository behind those locators.
   localStorage.removeItem('academyos.workspace-slot.v1:user_launch:'+academy);
   localStorage.removeItem('academyos.register-slot.v2:user_launch:'+academy+':'+event);
   await window.test.clearRegisterAccount('user_launch');
  },{academy,event});
  assert.equal(await page.evaluate(()=>localStorage.getItem(window.test.WORKSPACE_LAUNCH_KEY)),null);
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('attendance:user_launch:'+ '00000000-0000-4000-8000-000000000001'+':00000000-0000-4000-8000-000000000002')),'00000000-0000-4000-8000-000000000003');
  pass('Account cleanup removes disposable launch metadata without erasing the original-operation reference');
  const cached=await page.evaluate(async()=>{const result=[];for(const name of await caches.keys())for(const r of await(await caches.open(name)).keys())result.push(new URL(r.url).pathname);return result;});
  assert.ok(cached.every(p=>['/prepared-workspace/cache-pointer','/prepared-workspace','/_next/static/launch.js'].includes(p)));
  assert.ok(requests.every(r=>!r.cookie&&!r.authorization));
  assert.ok(!requests.some(r=>r.path.startsWith('/api/')));
  pass('Cache stores only public shell/static assets; isolated launch performs zero operating API requests');
  await mkdir(resolve(evidence,'..'),{recursive:true});
  await writeFile(evidence,JSON.stringify({date:new Date().toISOString(),passed:true,scope:'Isolated Chromium with actual launch/account/slot/startup/worker sources; private component stubs, no hosted/installed/data authority proof',browser:browser.version(),node:process.version,checks,hashes},null,2)+'\n');
 }
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
