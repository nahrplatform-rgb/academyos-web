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
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/trainer-workspace.tsx';const mode=new URLSearchParams(location.search).get('mode')||'owner';createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace locale="en" mode={mode} {...(mode==='invitation'?{}:{academy:'${academy}',branch:'${player}'})}/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'synthetic-ui-only',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/navigation$/},()=>({path:'navigation',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='navigation'?`export function useRouter(){return{push:(url)=>{location.href=url}}}`:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(mode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}}),url=`http://127.0.0.1:${server.address().port}`;
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let appointments=[],active=false,denied=false,unavailable=false,lost=false,drop=false,hold=false,release,creates=0,accepts=0,ends=0;
const calls=[],receipts=new Map(),person={display_name:'Casey Demo',role:'trainer',branch_name:'Main Demo Branch'};
await page.route('**/api/trainers',async route=>{const b=route.request().postDataJSON();calls.push(b);if(unavailable){await route.fulfill({status:503,json:{error:'unavailable'}});return;}if(denied){await route.fulfill({status:403,json:{error:'denied'}});return;}let data;
 if(['appoint','accept','end','revoke','retry'].includes(b.action)&&drop){drop=false;await route.abort('failed');return;}
 if(hold&&['appoint','accept','end'].includes(b.action))await new Promise(r=>{release=r;});
 switch(b.action){
 case'owner-list':data={branch:{branch_id:player,branch_name:person.branch_name},items:appointments.map(v=>({...v,recipient:b.inspect===v.id?'trainer@example.invalid':'g***@example.invalid'})),more:false};break;
 case'appoint':creates++;appointments=[{...person,id:b.invitation,recipient:b.email,state:'pending',version:1,delivery:'queued',expires_at:'2026-10-28T12:00:00Z'}];data={invitation_id:b.invitation,state:'pending',version:1};break;
 case'operation':case'reconcile-accept':data=receipts.get(b.op)||{cancelled:true};break;
 case'exchange':data={exchanged:true};break;
 case'review':data={...person,academy_id:academy,state:active?'accepted':'pending'};break;
 case'accept':accepts++;active=true;appointments=appointments.map(v=>({...v,state:'accepted',version:2}));data={accepted:true,academy_id:academy,link_id:player};break;
 case'profile':if(!active){await route.fulfill({status:403,json:{error:'denied'}});return;}data=person;break;
 case'end':ends++;active=false;appointments=appointments.map(v=>({...v,state:'ended',version:3}));data={state:'ended'};break;
 default:throw new Error('Unexpected action '+b.action);
 }
 if(b.op&&!['operation','reconcile-accept'].includes(b.action))receipts.set(b.op,data);
 if(lost&&['appoint','accept','end'].includes(b.action)){lost=false;await route.abort('failed');return;}
 await route.fulfill({json:{data}});
});
const evidence=resolve(root,`docs/07-handoff/evidence/workflow-clarity-2026-10-25/trainers/${mode}`);await mkdir(evidence,{recursive:true});
const button=name=>page.getByRole('button',{name:name==='Refresh saved state'?/^(Refresh view|Retry current read)$/:name==='تحديث الحالة المحفوظة'?/^(تحديث العرض|إعادة محاولة قراءة الحالة)$/:name,exact:true});
try{
 await page.goto(url);await expect(button('Invite trainer')).toBeVisible();assert.equal(await page.getByLabel('Fictional staff name',{exact:true}).count(),0,'Directory first; no unsolicited form');await button('Invite trainer').click();await expect(page.getByRole('heading',{name:'Invite a fictional trainer',exact:true})).toBeVisible();
 await page.getByLabel('Fictional staff name',{exact:true}).fill('Casey Demo');await page.getByLabel('Intended test recipient email',{exact:true}).fill('trainer@example.invalid');
 await expect(button('Review appointment')).toBeDisabled();await page.getByLabel('I explicitly approve this fictional Trainer appointment in this branch.',{exact:true}).check();await button('Review appointment').click();
 await expect(page.getByRole('heading',{name:'Review the exact access',exact:true})).toBeVisible();await expect(page.getByText('Casey Demo · Main Demo Branch',{exact:true})).toBeVisible();await page.screenshot({path:resolve(evidence,'owner-review-en.png'),fullPage:true});
 hold=true;lost=true;await button('Confirm appointment').click();await expect(button('Awaiting confirmation…')).toBeDisabled();release();hold=false;
 await expect(button('Check original operation')).toBeVisible();await button('Check original operation').click();await expect(page.getByText('Awaiting recipient acceptance',{exact:false})).toBeVisible();assert.equal(creates,1);
 await button('Inspect exact recipient').click();await expect(page.getByText('trainer@example.invalid',{exact:true})).toBeVisible();
 await page.goto(url+'/?mode=invitation#00000000-0000-4000-8000-000000000010.'+'a'.repeat(64));await expect(button('Review acceptance')).toBeVisible();assert.equal(await page.evaluate(()=>location.hash),'');assert.equal(calls.filter(b=>b.action==='exchange').length,1);
 await button('Review acceptance').click();await button('Accept Trainer appointment').click();await expect(page.getByRole('link',{name:'Open staff profile',exact:true})).toBeVisible();assert.equal(accepts,1);
 await page.goto(url+'/?mode=trainer');await expect(page.getByRole('heading',{name:'Casey Demo',exact:true})).toBeVisible();assert.equal(await page.getByText('trainer@example.invalid',{exact:true}).count(),0);await page.screenshot({path:resolve(evidence,'staff-profile-en.png'),fullPage:true});
 await page.getByRole('link',{name:'العربية',exact:true}).click();await expect(page.getByRole('heading',{name:'ملفك الوظيفي',exact:true})).toBeVisible();assert.equal(await page.locator('.app-scene').evaluate(el=>getComputedStyle(el).direction),'rtl');await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:resolve(evidence,'staff-profile-ar-360.png'),fullPage:true});
 await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Arabic 320px detail reflows');await page.setViewportSize({width:720,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Reflow at half desktop width');await page.setViewportSize({width:360,height:800});

 unavailable=true;await button('تحديث الحالة المحفوظة').click();await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('Casey Demo',{exact:true}).count(),0);unavailable=false;
 await button('تحديث الحالة المحفوظة').click();await expect(page.getByRole('heading',{name:'Casey Demo',exact:true})).toBeVisible();
 denied=true;await button('تحديث الحالة المحفوظة').click();await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('Casey Demo',{exact:true}).count(),0);denied=false;
 await page.goto(url);await button('End appointment').click();await page.getByLabel('Fictional test reason',{exact:true}).fill('Fictional appointment completed');await button('Review ending access').click();await button('Confirm this operation').click();await expect(page.getByText('Trainer appointment ended',{exact:false})).toBeVisible();assert.equal(ends,1);
 await page.goto(url+'/?mode=trainer');await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('Casey Demo',{exact:true}).count(),0);
 active=true;await button('Refresh saved state').click();await expect(page.getByRole('heading',{name:'Casey Demo',exact:true})).toBeVisible();denied=true;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_B'})));await expect(page.getByRole('alert')).toBeVisible();assert.equal(await page.getByText('Casey Demo',{exact:true}).count(),0);
 assert.equal((await page.evaluate(()=>Object.values(sessionStorage))).some(x=>/trainer@|Casey|Fictional/.test(x)),false);assert.deepEqual(errors,[]);

 denied=false;await page.setViewportSize({width:1440,height:1000});await page.goto(url);await button('Invite trainer').click();
 await page.getByLabel('Intended test recipient email',{exact:true}).fill('draft@example.invalid');
 const readsBefore=calls.filter(b=>b.action==='owner-list').length;
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
 await expect(page.getByLabel('Intended test recipient email',{exact:true})).toHaveValue('draft@example.invalid');
 assert.equal(calls.filter(b=>b.action==='owner-list').length,readsBefore,'Returning to draft preserves intent without duplicate reads');
 assert.equal(await page.locator('.workspace-panes').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,'Desktop central workspace and inspector remain separate');

 await page.setViewportSize({width:926,height:900});await expect(page.getByLabel('Intended test recipient email',{exact:true})).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await button('Back').click();await expect(button('Invite trainer')).toBeFocused();assert.equal(await page.getByLabel('Intended test recipient email',{exact:true}).count(),0);
 await button('Invite trainer').click();await expect(page.getByLabel('Intended test recipient email',{exact:true})).toHaveValue('draft@example.invalid');
 await page.screenshot({path:resolve(evidence,'draft-tablet-926.png'),fullPage:true});
 const receipt={reactMode:mode,creates,accepts,ends,errors,cases:['required name/email/explicit branch scope approval','exact review','pending disabled','lost result original reconciliation','exact private recipient inspection','fragment removed once in StrictMode','explicit recipient acceptance','own staff projection without email','EN/AR360 no overflow','read failure hides profile','denial clears profile','end denies next read','identity switch clears private projection','opaque operation-only recovery storage'],scope:'Actual component and shared controls; synthetic session and HTTP adapters. SQL tests separately enforce real data boundary.'};
 await writeFile(resolve(evidence,'ui-receipt.json'),JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({trainerUi:'passed',...receipt}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
