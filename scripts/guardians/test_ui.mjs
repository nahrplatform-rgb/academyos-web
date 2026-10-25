// Actual React component and shared controls; synthetic session/HTTP adapters only.
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),mode=process.env.UI_REACT_MODE==='development'?'development':'production';
const academy='00000000-0000-4000-8000-000000000001',player='00000000-0000-4000-8000-000000000002';
const adapter=`import React from 'react';let subject='user_A';const listeners=new Set();window.addEventListener('synthetic-session',e=>{subject=e.detail;listeners.forEach(f=>f());});export function useUser(){const id=React.useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>subject);return{isLoaded:!new URLSearchParams(location.search).has('authPending'),isSignedIn:!!id,user:id?{id}:null}}export function UserButton(){return <span>Test account</span>}export function SignInButton({children}){return children}export function SignUpButton({children}){return children}`;
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/guardian-workspace.tsx';const mode=new URLSearchParams(location.search).get('mode')||'owner';createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace locale="en" mode={mode} {...(mode==='invitation'?{}:{academy:'${academy}',player:'${player}'})}/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'synthetic-ui-only',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(mode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),url=`http://127.0.0.1:${server.address().port}`;
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let appointments=[],active=false,denied=false,unavailable=false,lost=false,drop=false,hold=false,release,creates=0,accepts=0,ends=0;
const calls=[],receipts=new Map(),person={id:player,display_name:'Alex Demo',branch_name:'Main Demo Branch'};
await page.route('**/api/guardians',async route=>{const b=route.request().postDataJSON();calls.push(b);if(unavailable){await route.fulfill({status:503,json:{error:'unavailable'}});return;}if(denied){await route.fulfill({status:403,json:{error:'denied'}});return;}let data;
 if(['appoint','accept','end','revoke','retry'].includes(b.action)&&drop){drop=false;await route.abort('failed');return;}
 if(hold&&['appoint','accept','end'].includes(b.action))await new Promise(r=>{release=r;});
 switch(b.action){
 case'owner-list':data={player:person,items:appointments.map(v=>({...v,recipient:b.inspect===v.id?'guardian@example.invalid':'g***@example.invalid'})),more:false};break;
 case'appoint':creates++;appointments=[{id:b.invitation,recipient:b.email,state:'pending',version:1,delivery:'queued',expires_at:'2026-10-28T12:00:00Z'}];data={invitation_id:b.invitation,state:'pending',version:1};break;
 case'operation':case'reconcile-accept':data=receipts.get(b.op)||{cancelled:true};break;
 case'exchange':data={exchanged:true};break;
 case'review':data={...person,academy_id:academy,state:active?'accepted':'pending'};break;
 case'accept':accepts++;active=true;appointments=appointments.map(v=>({...v,state:'accepted',version:2}));data={accepted:true,academy_id:academy,link_id:player};break;
 case'links':data={items:active?[person]:[],more:false};break;
 case'end':ends++;active=false;appointments=appointments.map(v=>({...v,state:'ended',version:3}));data={state:'ended'};break;
 default:throw new Error('Unexpected action '+b.action);
 }
 if(b.op&&!['operation','reconcile-accept'].includes(b.action))receipts.set(b.op,data);
 if(lost&&['appoint','accept','end'].includes(b.action)){lost=false;await route.abort('failed');return;}
 await route.fulfill({json:{data}});
});
const evidence=resolve(root,`docs/07-handoff/evidence/i2b-local-2026-10-25/${mode}`);await mkdir(evidence,{recursive:true});
const button=name=>page.getByRole('button',{name,exact:true});
async function prepare(){await page.getByLabel('Intended test recipient email',{exact:true}).fill('guardian@example.invalid');await expect(button('Review appointment')).toBeDisabled();await page.getByRole('checkbox').check();await button('Review appointment').click();await expect(button('Confirm appointment')).toBeVisible();}
try{
 await page.goto(url);await expect(button('Review appointment')).toBeDisabled();
 await page.getByLabel('Intended test recipient email',{exact:true}).fill('guardian@example.invalid');await page.getByRole('checkbox').check();
 const dialogs=[];page.on('dialog',async dialog=>{dialogs.push(dialog.message());await dialog.dismiss();});
 await page.getByRole('link',{name:'العربية',exact:true}).click();await expect(page.getByRole('heading',{name:'دعوات أولياء الأمور',exact:true})).toBeVisible();assert.equal(await page.getByLabel('بريد مستلم الاختبار المقصود',{exact:true}).inputValue(),'guardian@example.invalid');assert.equal(await page.getByRole('checkbox').isChecked(),true);assert.deepEqual(dialogs,[]);
 await page.getByRole('link',{name:'English',exact:true}).click();await page.getByLabel('Intended test recipient email',{exact:true}).fill('');await prepare();lost=true;hold=true;await button('Confirm appointment').click();await expect(button('Awaiting confirmation…')).toBeDisabled();assert.equal(creates,0);while(!release)await new Promise(r=>setTimeout(r,10));release();hold=false;await expect(button('Reconcile original operation')).toBeVisible();assert.equal(creates,1);await button('Reconcile original operation').click();await expect(page.getByText('Awaiting recipient acceptance',{exact:false})).toBeVisible();assert.equal(creates,1);
 await button('Inspect exact recipient').click();await expect(page.getByText('guardian@example.invalid',{exact:true})).toBeVisible();
 // A cancelled write permits a fresh reviewed intent and removes old notice.
 await prepare();drop=true;await button('Confirm appointment').click();await button('Reconcile original operation').click();await expect(page.getByText('The original operation was cancelled before commit. Review before starting again.',{exact:true})).toBeVisible();await prepare();assert.equal(await page.getByText('The original operation was cancelled before commit. Review before starting again.',{exact:true}).count(),0);await button('Back to review').click();
 await page.goto(url+'/?mode=invitation#'+player+'.'+'a'.repeat(64));await expect(button('Review acceptance')).toBeVisible();assert.equal(new URL(page.url()).hash,'');assert.equal(calls.filter(x=>x.action==='exchange').length,1);await button('Review acceptance').click();await button('Accept guardian appointment').click();await expect(page.getByRole('link',{name:'Open linked players',exact:true})).toBeVisible();assert.equal(accepts,1);
 await page.goto(url+'/?mode=guardian');await expect(page.getByRole('heading',{name:'Alex Demo',exact:true})).toBeVisible();assert.equal(await page.getByText('guardian@example.invalid',{exact:true}).count(),0);assert.equal(await page.getByText('Sam Example',{exact:true}).count(),0);await page.screenshot({path:resolve(evidence,'linked-player-en.png'),fullPage:true});
 await page.getByRole('link',{name:'العربية',exact:true}).click();await expect(page.getByRole('heading',{name:'اللاعبون المرتبطون بك',exact:true})).toBeVisible();assert.equal(await page.locator('.app-scene').evaluate(el=>getComputedStyle(el).direction),'rtl');await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:resolve(evidence,'linked-player-ar-360.png'),fullPage:true});
 unavailable=true;await button('تحديث الحالة المحفوظة').click();await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('لا توجد ارتباطات معتمدة نشطة في هذه الصفحة. تواصل مع مالك الأكاديمية إذا توقعت صلاحية.',{exact:true}).count(),0);assert.equal(await page.getByText('Alex Demo',{exact:true}).count(),0);unavailable=false;await button('تحديث الحالة المحفوظة').click();await expect(page.getByRole('heading',{name:'Alex Demo',exact:true})).toBeVisible();
 denied=true;await button('تحديث الحالة المحفوظة').click();await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('Alex Demo',{exact:true}).count(),0);
 denied=false;await page.goto(url);await button('End link').click();await page.getByLabel('Fictional test reason',{exact:true}).fill('Synthetic test ended');await button('Review ending access').click();await button('Confirm this operation').click();await expect(page.getByText('Link ended',{exact:false})).toBeVisible();assert.equal(ends,1);
 await page.goto(url+'/?mode=guardian');await expect(page.getByText('No active approved player links on this page. Contact your academy Owner if you expected access.',{exact:true})).toBeVisible();assert.equal(await page.getByText('Alex Demo',{exact:true}).count(),0);
 active=true;await button('Refresh saved state').click();await expect(page.getByRole('heading',{name:'Alex Demo',exact:true})).toBeVisible();denied=true;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_B'})));await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('Alex Demo',{exact:true}).count(),0);
 assert.equal((await page.evaluate(()=>Object.values(sessionStorage))).some(x=>/guardian@|Alex|Synthetic/.test(x)),false);
 assert.deepEqual(errors,[]);
 await writeFile(resolve(evidence,'ui-receipt.json'),JSON.stringify({reactMode:mode,creates,accepts,ends,errors,cases:['explicit Owner confirmation','language switch preserves draft without discard dialog','pending submit disabled','commit response loss and recovery','pre-send cancellation fence','stale cancellation notice reset','explicit exact-recipient inspection','fragment removed once in StrictMode','recipient acceptance','minimal guardian projection','EN/AR360px no overflow','end access empty state','unavailable read never implies empty family','denial clears player','identity switch clears private projection','opaque operation-only session storage'],scope:'Actual React/shared controls; synthetic session and transport. Separate SQL tests enforce actual policy.'},null,2)+'\n');
 console.log(JSON.stringify({guardianUi:'passed',reactMode:mode,creates,accepts,ends,errors}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
