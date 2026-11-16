// Real Owner device approval/sync lifecycle over the actual hook and storage
// utility. External storage/transport dependencies are fictional test doubles;
// the operational phases asserted here are the component's own state.
// This is not installed-device, OS quota or hosted evidence.
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..');
const evidence=resolve(process.env.UI_EVIDENCE_DIR||resolve(root,'docs/07-handoff/evidence/mp-b01-device-lifecycle'));
await mkdir(evidence,{recursive:true});

// Test doubles for external dependencies only; workspace-storage and the hook stay real.
const doubles=`let slot=null,slotListeners=new Set(),plan={kind:'current',hold:false,release:null},currentSubject='user_synthetic';const log={syncs:[],removes:[],approvals:0};
export function armRegisterAccount(subject){currentSubject=subject;return Promise.resolve('gen-'+subject)}
export function readRegisterAccount(){return {mode:'active',subject:currentSubject,generation:1}}
export function subscribeRegisterAccount(l){slotListeners.add(l);return()=>slotListeners.delete(l)}
export function readWorkspaceSlot(){return slot?{mode:slot,generation:1}:null}
export function subscribeWorkspaceSlot(_key,l){slotListeners.add(l);return()=>slotListeners.delete(l)}
export function approveWorkspaceDevice(){log.approvals++;slot='active';slotListeners.forEach(f=>f());return Promise.resolve()}
export function subscribeWorkspaceCoverage(){return()=>{}}
export function workspaceDevice({subject},generation,signal){
 return {read:async()=>null,readContext:async()=>null,readCalendar:async()=>null,
  remove:async()=>{log.removes.push(generation)},
  sync:async(month,priority,sig,onProgress)=>{log.syncs.push({month,priority,generation,subject});if(plan.hold)await new Promise(r=>plan.release=r);return {kind:plan.kind}}};
}
export function __setSlot(v){slot=v;slotListeners.forEach(f=>f())}
export function __setSubject(s){currentSubject=s;slotListeners.forEach(f=>f())}
export function __syncPlan(p){Object.assign(plan,p)}
export function __log(){return log}
export function prepareWorkspaceShell(){return Promise.resolve()}`;

const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';
import{__syncPlan,__log,__setSubject}from'@/lib/workspace-device';
import{useOwnerWorkspaceDevice,WorkspaceDeviceTools}from'${root}/apps/web/src/components/owner-workspace-device.tsx';
window.__syncPlan=__syncPlan;window.__deviceLog=__log;
function useSubject(){const[s,set]=React.useState('user_synthetic');React.useEffect(()=>{const f=e=>set(e.detail);window.addEventListener('synthetic-subject',f);return()=>window.removeEventListener('synthetic-subject',f);},[]);return s;}
function Mount({subject,academy}){
 const device=useOwnerWorkspaceDevice({subject,academy,priority:'people',prepared:true});
 React.useEffect(()=>{window.__actualMounts=(window.__actualMounts??0)+1;},[]);
 React.useEffect(()=>{window.__device={phase:device.phase,storage:device.storage??null,approved:device.approved,offline:device.offline};window.__deviceMounts=(window.__deviceMounts??0)+1;},[device.phase,device.storage,device.approved,device.offline]);
 return <div><WorkspaceDeviceTools device={device} locale="en" verified={true}/><button onClick={()=>void device.approve()}>Approve device</button></div>;
}
function App(){const subject=useSubject();const[academy,setAcademy]=React.useState('00000000-0000-4000-8000-000000000001');React.useEffect(()=>{const f=e=>setAcademy(e.detail);window.addEventListener('synthetic-academy',f);return()=>window.removeEventListener('synthetic-academy',f);},[]);return <Mount key={subject+':'+academy} subject={subject} academy={academy}/>}
const appRoot=createRoot(document.getElementById('root'));
appRoot.render(<App/>);
window.__unmount=()=>{appRoot.render(null);delete window.__device;};
window.__changeSubject=s=>{__setSubject(s);window.dispatchEvent(new CustomEvent('synthetic-subject',{detail:s}));};
window.__changeAcademy=a=>window.dispatchEvent(new CustomEvent('synthetic-academy',{detail:a}));`,resolveDir:root,loader:'tsx'},tsconfig:resolve(root,'apps/web/tsconfig.json'),bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'device-doubles',setup(b){
 b.onResolve({filter:/^@\/lib\/(register-device-account|workspace-device-slots|workspace-device|workspace-public-shell)$/},()=>({path:'doubles',namespace:'test'}));
 b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:doubles,loader:'tsx'}));
 // Disposable regression variant: the old awaited-persistence ordering, active
 // only when the page sets globalThis.__oldAwaitPersistence before approving.
 b.onLoad({filter:/owner-workspace-device\.tsx$/},async args=>{let source=await readFile(args.path,'utf8');
  const detach='void requestWorkspaceStoragePersistence()';const gate='setProgress(undefined);setPhase(\'preparing\');';
  if(!source.includes(detach)||!source.includes(gate))throw new Error('device negative-control injection point missing from owner-workspace-device.tsx');
  source=source.replace(detach,'const persistencePromise=requestWorkspaceStoragePersistence()');
  source=source.replace(gate,"if(globalThis.__oldAwaitPersistence)await persistencePromise;setProgress(undefined);setPhase('preparing');");
  return {contents:source,loader:'tsx',resolveDir:dirname(args.path)};});
}}]});

const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch();
// Controllable navigator.storage: persist() returns a deferred the test settles.
const initScript=()=>{
 let persistedValue=false,pending=null;
 const calls={persist:0};
 Object.defineProperty(navigator,'storage',{configurable:true,value:{
  persisted:async()=>persistedValue,
  estimate:async()=>({usage:2048,quota:8192}),
  persist:async()=>{calls.persist++;return new Promise((res,rej)=>{pending={res,rej};});}
 }});
 window.__storage={
  setPersisted:v=>{persistedValue=v},
  resolvePersist:v=>{const p=pending;pending=null;p&&p.res(v)},
  rejectPersist:()=>{const p=pending;pending=null;p&&p.rej(new Error('storage refused'))},
  calls,
 };
};
const errors=[];
try{
 const page=await browser.newPage();
 await page.addInitScript(initScript);
 page.on('pageerror',e=>errors.push(e.message));
 const state=async()=>page.evaluate(()=>window.__device);
 const url=`http://127.0.0.1:${server.address().port}`;
 async function open(){await page.goto(url);await expect.poll(()=>page.evaluate(()=>Boolean(window.__device))).toBe(true);}
 const deviceButton=()=>page.getByRole('button',{name:'Approve device',exact:true});
 const phase=()=>expect.poll(()=>state().then(s=>s.phase));

 // Case A: persistence stays pending while the sync effect reaches Ready; the
 // late reply updates advisory storage and never overwrites the phase.
 await open();
 assert.deepEqual(await state(),{phase:'preparing',storage:null,approved:false,offline:false},'unapproved device waits without operational state');
 await deviceButton().click();
 await phase().toBe('ready');
 await expect.poll(()=>state().then(s=>s.storage&&s.storage.persistence)).toBe('not-granted','advisory inspect result while persistence is still pending');
 const caseA=await state();
 assert.equal(caseA.approved,true);
 assert.equal(await page.evaluate(()=>window.__storage.calls.persist),1,'approval requested persistence once');
 await page.evaluate(()=>{window.__storage.setPersisted(true);window.__storage.resolvePersist(true);});
 await expect.poll(()=>state().then(s=>s.storage.persistence)).toBe('granted');
 assert.equal((await state()).phase,'ready','late persistence reply must not overwrite the Ready phase');

 // Case B: persistence request rejects; advisory status becomes unavailable and the phase stays Ready.
 await open();
 await deviceButton().click();
 await phase().toBe('ready');
 await page.evaluate(()=>window.__storage.rejectPersist());
 await expect.poll(()=>state().then(s=>s.storage.persistence)).toBe('unavailable');
 assert.equal((await state()).phase,'ready');

 // Case C: persistence resolves false; truthful not-granted status and Ready phase.
 await open();
 await deviceButton().click();
 await phase().toBe('ready');
 await page.evaluate(()=>window.__storage.resolvePersist(false));
 await expect.poll(()=>state().then(s=>s.storage.persistence)).toBe('not-granted');
 assert.equal((await state()).phase,'ready');

 // Case D: unsupported StorageManager (no persist/estimate); advisory label, Ready phase.
 await open();
 await page.evaluate(()=>{Object.defineProperty(navigator,'storage',{configurable:true,value:{persisted:async()=>undefined}});});
 await deviceButton().click();
 await phase().toBe('ready');
 await expect.poll(()=>state().then(s=>s.storage.persistence)).toBe('unsupported');

 // Case E: sync reports denied; the operational phase becomes denied.
 await open();
 await page.evaluate(()=>window.__syncPlan({kind:'denied'}));
 await deviceButton().click();
 await phase().toBe('denied');
 await page.screenshot({path:resolve(evidence,'device-denied.png'),fullPage:true});

 // Case F: account change while persistence is pending. The new mount owns its
 // own state; the old mount's late reply cannot update visible state.
 await open();
 await deviceButton().click();
 await phase().toBe('ready');
 await page.evaluate(()=>window.__changeSubject('user_second'));
 await expect.poll(()=>page.evaluate(()=>window.__deviceMounts)).toBeGreaterThan(1);
 const mountsBefore=await page.evaluate(()=>window.__deviceMounts);
 await expect.poll(()=>state().then(s=>s.storage&&s.storage.persistence)).toBe('not-granted','new account view owns its advisory inspect result');
 await page.evaluate(()=>{window.__storage.setPersisted(true);window.__storage.resolvePersist(true);});
 await page.waitForTimeout(150);
 assert.equal((await state()).storage.persistence,'not-granted','the released stale reply must not reach the new account view');
 assert.equal((await state()).phase,'ready');
 assert.equal(await page.evaluate(()=>window.__deviceMounts),mountsBefore);

 // Academy change uses the same subject:academy remount key as WorkspaceRuntime.
 await open();
 await deviceButton().click();
 await phase().toBe('ready');
 const academyMountsBefore=await page.evaluate(()=>window.__actualMounts);
 await page.evaluate(()=>window.__changeAcademy('00000000-0000-4000-8000-000000000002'));
 await expect.poll(()=>page.evaluate(()=>window.__actualMounts)).toBe(academyMountsBefore+1);
 await expect.poll(()=>state().then(s=>s.storage&&s.storage.persistence)).toBe('not-granted');
 await page.evaluate(()=>{window.__storage.setPersisted(true);window.__storage.resolvePersist(true);});
 await page.waitForTimeout(150);
 assert.equal((await state()).storage.persistence,'not-granted','old academy late reply does not update the new mount');
 assert.equal((await state()).phase,'ready');
 assert.equal(await page.evaluate(()=>window.__actualMounts),academyMountsBefore+1);

 // Case G: unmount while persistence is pending; the reply settles after removal.
 await open();
 await deviceButton().click();
 await phase().toBe('ready');
 await page.evaluate(()=>window.__unmount());
 assert.equal(await page.evaluate(()=>window.__device),undefined);
 await page.evaluate(()=>{window.__storage.setPersisted(true);window.__storage.resolvePersist(true);});
 await page.waitForTimeout(100);
 assert.deepEqual(errors,[],'no page errors captured after unmount and late reply');

 // Case H (negative control): the disposable old-ordering variant must fail the
 // Case A assertion — the late reply overwrites Ready with Preparing.
 await open();
 await page.evaluate(()=>{globalThis.__oldAwaitPersistence=true;});
 await deviceButton().click();
 await phase().toBe('ready');
 await page.evaluate(()=>{window.__storage.setPersisted(true);window.__storage.resolvePersist(true);});
 await phase().toBe('preparing');
 await expect.poll(()=>state().then(s=>s.phase)).toBe('preparing','negative control: old awaited ordering reproduces the Ready overwrite');
 await page.screenshot({path:resolve(evidence,'device-old-ordering.png'),fullPage:true});

 assert.deepEqual(errors,[]);
 const log=await page.evaluate(()=>window.__deviceLog());
 await writeFile(resolve(evidence,'receipt.json'),JSON.stringify({status:'passed',scope:'real hook component and real workspace-storage utility; fictional slot/account/sync doubles and controllable navigator.storage; not installed-device, OS quota, hosted or Owner acceptance evidence',cases:{lateReadyBeforePersistence:caseA,persistenceRejected:'unavailable status, Ready kept',persistenceRefused:'not-granted status, Ready kept',unsupportedApis:'unsupported status, Ready kept',deniedSync:'denied phase',accountChange:'new mount owns state; stale released reply did not update it',academyChange:'subject:academy key remounted; old academy late reply did not update visible state',unmount:'no page errors captured after unmount and late reply; callback attempts were not observed',negativeControl:'old awaited ordering overwrote Ready with Preparing and was detected'},syncs:log.syncs,removes:log.removes,approvals:log.approvals,errors},null,2)+'\n');
 console.log('PASS device approval/sync lifecycle');
}catch(error){await writeFile(resolve(evidence,'receipt.json'),JSON.stringify({status:'failed',error:String(error),errors},null,2)+'\n');throw error;}
finally{await browser.close();await new Promise(r=>server.close(r));}
