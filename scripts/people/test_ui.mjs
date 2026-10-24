// Real React component; synthetic identity and transport only. No product bypass.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),reactMode=process.env.UI_REACT_MODE==='development'?'development':'production';
const adapter=`import React from 'react';let subject='user_A';const listeners=new Set();window.addEventListener('synthetic-session',e=>{subject=e.detail;listeners.forEach(f=>f());});export function useUser(){const id=React.useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>subject);return{isLoaded:true,user:id?{id}:null}}export function UserButton(){return <span>Test account</span>}`;
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/people-workspace.tsx';createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace locale="en" academy="00000000-0000-4000-8000-000000000001"/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'synthetic-ui-only',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(reactMode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const academy='00000000-0000-4000-8000-000000000001',branch='00000000-0000-4000-8000-000000000002';
let players=[{id:'00000000-0000-4000-8000-000000000010',display_name:'Alex Demo',branch_name:'Main Demo Branch',contact_email:'contact@example.invalid'}],revision=1,denied=false,lost=false,stale=false,creates=0,hold=false,release;
const receipts=new Map(),calls=[];
await page.route('**/api/people',async route=>{const b=route.request().postDataJSON();calls.push(b);if(denied){await route.fulfill({status:403,json:{error:'denied'}});return;}let data;
 switch(b.action){
 case'list':data={academy_name:'Synthetic A',branch_id:branch,branch_name:'Main Demo Branch',items:players.filter(p=>p.display_name.toLowerCase().startsWith(b.query?.toLowerCase()||'')).map(({contact_email,...p})=>p),more:false};break;
 case'candidates':data={items:players.filter(p=>p.display_name.toLowerCase()===b.name.trim().toLowerCase()).map(({contact_email,...p})=>p),revision:b.name.trim().toLowerCase()==='alex demo'?revision:0,more:false};break;
 case'profile':data=players.find(p=>p.id===b.player);break;
 case'create':if(hold)await new Promise(r=>{release=r;});if(stale){stale=false;await route.fulfill({status:409,json:{error:'review_required'}});return;}creates++;const p={id:`00000000-0000-4000-8000-${String(creates+100).padStart(12,'0')}`,display_name:b.name,contact_email:b.contact,branch_name:'Main Demo Branch'};players.push(p);revision++;data={player_id:p.id,version:1};receipts.set(b.op,data);if(lost){lost=false;await route.abort('failed');return;}break;
 case'reconcile':data=receipts.get(b.op)||{cancelled:true};break;
 default:throw new Error('Unexpected action '+b.action);
 }await route.fulfill({json:{data}});
});
async function visible(name){await page.getByRole('heading',{name,exact:true}).waitFor();}
async function freshForm(name='Alex Demo'){await page.getByRole('button',{name:'Register player',exact:true}).click();await page.getByLabel('Player display name (required)',{exact:true}).fill(name);}
const evidence=resolve(root,'docs/07-handoff/evidence/i2a-local-2026-10-24');await mkdir(evidence,{recursive:true});
try{
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByRole('button',{name:'Register player',exact:true}).waitFor();await page.getByRole('button',{name:'Register player',exact:true}).isEnabled();
 await freshForm();await page.getByLabel('Parent/guardian contact email (optional)',{exact:true}).fill('contact@example.invalid');await page.getByRole('button',{name:'Continue to duplicate review'}).click();await visible('Review possible duplicates');assert.equal(await page.getByRole('button',{name:'Review new registration',exact:true}).isEnabled(),false);
 await page.getByRole('button',{name:'Open existing profile'}).click();await visible('Player profile');assert.equal(creates,0);await page.getByRole('button',{name:'Return to registration draft'}).click();assert.equal(await page.getByLabel('Player display name (required)',{exact:true}).inputValue(),'Alex Demo');
 await page.getByRole('button',{name:'Continue to duplicate review'}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Review new registration',exact:true}).click();await visible('Confirm player registration');
 stale=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();await visible('Review possible duplicates');assert.equal(await page.getByRole('checkbox').isChecked(),false);assert.equal(creates,0);
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Review new registration',exact:true}).click();lost=true;hold=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();await visible('Saving… awaiting confirmation');assert.equal(await page.getByRole('button',{name:'Saving…',exact:true}).isEnabled(),false);while(!release)await new Promise(r=>setTimeout(r,10));release();hold=false;await visible('Save outcome is uncertain');await page.getByRole('button',{name:'Check original save',exact:true}).click();await visible('Player profile');assert.equal(creates,1);assert.equal((await page.evaluate(()=>Object.values(sessionStorage))).some(x=>x.includes('contact@example.invalid')),false);
 await page.screenshot({path:resolve(evidence,'saved-profile-en.png'),fullPage:true});
 await page.getByRole('button',{name:'Back to players',exact:true}).click();await freshForm('New Demo');await page.getByRole('link',{name:'العربية',exact:true}).click();assert.equal(await page.getByLabel('اسم عرض اللاعب (مطلوب)',{exact:true}).inputValue(),'New Demo');await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:resolve(evidence,'draft-ar-360.png'),fullPage:true});
 await page.getByRole('button',{name:'المتابعة لمراجعة التكرار'}).click();await visible('تأكيد تسجيل اللاعب');await page.screenshot({path:resolve(evidence,'confirmation-ar-360.png'),fullPage:true});
 // A new identity remount must remove all prior actor projections and drafts.
 denied=true;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_B'})));await page.getByRole('alert').waitFor();assert.equal(await page.getByText('New Demo',{exact:true}).count(),0);assert.equal(await page.getByText('contact@example.invalid',{exact:true}).count(),0);
 // Refresh a saved profile after revocation clears it.
 denied=false;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_A'})));await page.getByRole('button',{name:'Alex Demo',exact:true}).first().click();await visible('Player profile');denied=true;await page.getByRole('button',{name:'Refresh saved state',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByText('contact@example.invalid',{exact:true}).count(),0);
 assert.deepEqual(errors,[]);await writeFile(resolve(evidence,'ui-receipt.json'),JSON.stringify({reactMode,cases:['duplicate distinction','existing profile no create','stale duplicate review','pending submission disabled','lost-response reconciliation','actor switch clears state','revoked profile cleared','EN/AR draft preservation','360px no overflow'],creates,errors,scope:'Actual React component; synthetic session and HTTP responses. Database tested separately.'},null,2)+'\n');
 console.log(JSON.stringify({peopleUi:'passed',reactMode,creates,errors,scopedRequests:calls.length}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
