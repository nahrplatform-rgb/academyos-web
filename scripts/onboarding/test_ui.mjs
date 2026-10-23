// Real React UI with synthetic transport/identity adapters. No product route or auth bypass.
// This verifies interaction/reflow/recovery only, never API or database authorization.
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..');
const adapter=`import React from 'react';
let subject=new URLSearchParams(location.search).has('signedOut')?null:'user_synthetic';
const listeners=new Set();window.addEventListener('synthetic-session',e=>{subject=e.detail;listeners.forEach(fn=>fn());});
export function useUser(){const id=React.useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>subject);return {isLoaded:true,isSignedIn:!!id,user:id?{id}:null};}
export function UserButton(){return <button>Test account</button>;}
export function SignInButton({children,forceRedirectUrl,signUpForceRedirectUrl}){return <span data-auth="sign-in" data-return={forceRedirectUrl} data-transfer-return={signUpForceRedirectUrl}>{children}</span>;}
export function SignUpButton({children,forceRedirectUrl,signInForceRedirectUrl}){return <span data-auth="sign-up" data-return={forceRedirectUrl} data-transfer-return={signInForceRedirectUrl}>{children}</span>;}`;
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/onboarding-workspace.tsx';const p=new URLSearchParams(location.search);createRoot(document.getElementById('root')).render(<Workspace locale={p.get('locale')||'en'} mode={p.get('mode')||'context'} academy={p.get('academy')||undefined}/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'test-only-adapters',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':'"production"'}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(3194,'127.0.0.1',r));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let admitted=false,accepted=false,delivery='queued',lost=false,conflict=false,revoked=false;
let holdExchange=false,failExchange=false,releaseExchange,heldExchange;
let holdSetup=false,releaseSetup,setupEntered,switched=false;
const a='00000000-0000-4000-8000-000000000001',iv='00000000-0000-4000-8000-000000000002';
let setup={academy_id:a,name:'Synthetic Academy A',version:0,complete:false,timezone:null,branch:null,sport:null};
const receipts=new Map();
await page.route('**/api/onboarding',async route=>{
 const b=route.request().postDataJSON();let data;
 if(revoked&&['setup','save','operation'].includes(b.action)){await route.fulfill({status:403,json:{error:'denied'}});return;}
 switch(b.action){
 case'context':data={platform:true,memberships:accepted?[{membership_id:iv,academy_id:a,academy_name:setup.name,role:'owner'}]:[],more:false};break;
 case'platform':data={items:admitted?[{id:a,name:setup.name,setup_complete:setup.complete,invitation_id:iv,generation:1,expires_at:'2026-10-25T12:00:00Z',revoked:false,redeemed_at:accepted?'2026-10-22T12:00:00Z':null,delivery,attempts:0}]:[],more:false};break;
 case'create':admitted=true;data={academy_id:a,invitation_id:iv,generation:1};break;
 case'exchange':
  if(holdExchange){heldExchange=true;await new Promise(r=>{releaseExchange=r;});}
  if(failExchange){await route.fulfill({status:422,json:{error:'invalid'}});return;}
  data={exchanged:true};break;
 case'review':data={academy_id:a,name:setup.name,accepted};break;
 case'accept':accepted=true;data={academy_id:a,name:setup.name,accepted:true};break;
 case'setup':
  data=structuredClone(switched?{...setup,name:'Synthetic Academy B',branch:{id:iv,name:'Branch B'},sport:{id:iv,label_en:'Sport B',label_ar:'رياضة ب'}}:setup);
  if(holdSetup){holdSetup=false;await new Promise(r=>{releaseSetup=r;setupEntered();});}
  break;
 case'save':
  if(conflict){conflict=false;await route.fulfill({status:409,json:{error:'conflict'}});return;}
  if(b.step==='branch'){setup.branch={id:iv,name:b.fields.name};setup.timezone=b.fields.timezone;setup.complete=false;}
  if(b.step==='sport'){setup.sport={id:iv,...b.fields};setup.complete=false;}
  if(b.step==='complete')setup.complete=true;
  setup.version++;data=setup;break;
 case'operation':data={found:receipts.has(b.op),result:receipts.get(b.op)};break;
 default:await route.fulfill({status:422,json:{error:'invalid'}});return;
 }
 if(b.op)receipts.set(b.op,structuredClone(data));
 if(lost&&b.action==='save'){lost=false;await route.abort();return;}
 await route.fulfill({json:{data}});
});
try{
 for(const locale of ['en','ar']){
  await page.setViewportSize({width:360,height:780});
  holdExchange=true;heldExchange=false;failExchange=false;
  await page.goto(`http://127.0.0.1:3194/?mode=invitation&signedOut=1&locale=${locale}#${iv}.${'b'.repeat(64)}`);
  const create=page.getByRole('button',{name:locale==='en'?'Create account':'إنشاء حساب',exact:true});
  const signin=page.getByRole('button',{name:locale==='en'?'Sign in':'تسجيل الدخول',exact:true});
  await create.waitFor();assert.equal(await create.isDisabled(),true);assert.equal(await signin.isDisabled(),true);
  await page.waitForFunction(()=>!location.hash);assert.equal(heldExchange,true);holdExchange=false;releaseExchange();
  await page.waitForFunction(()=>!document.querySelector('[data-auth="sign-up"] button').disabled);
  for(const kind of ['sign-in','sign-up']){const auth=page.locator(`[data-auth="${kind}"]`);assert.equal(await auth.getAttribute('data-return'),`/${locale}/invitation`);assert.equal(await auth.getAttribute('data-transfer-return'),`/${locale}/invitation`);}
  assert.equal(await page.getByRole('button',{name:locale==='en'?'Accept owner appointment':'قبول التعيين مالكاً',exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 failExchange=true;
 await page.goto(`http://127.0.0.1:3194/?mode=invitation&signedOut=1#${iv}.${'b'.repeat(64)}`);
 await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).isDisabled(),true);failExchange=false;
 await page.goto('http://127.0.0.1:3194/?mode=context&signedOut=1');
 await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).count(),0);
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:3194/?mode=platform');
 await page.getByLabel('Academy name',{exact:true}).fill('Synthetic Academy A');await page.getByLabel('Intended owner email',{exact:true}).fill('owner@academy.example');await page.getByRole('button',{name:'Review appointment',exact:true}).click();await page.getByRole('button',{name:'Create and invite owner',exact:true}).click();await page.getByText('Owner acceptance pending',{exact:true}).waitFor();
 await page.goto('http://127.0.0.1:3194/?mode=invitation#'+iv+'.'+'b'.repeat(64));await page.getByRole('button',{name:'Accept owner appointment',exact:true}).click();await page.getByRole('link',{name:'Enter setup workspace',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');
 await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}`);
 await page.getByRole('button',{name:'Edit branch and timezone',exact:true}).click();await page.getByLabel('Branch name',{exact:true}).fill('Branch A');await page.getByLabel('Find a timezone or city',{exact:true}).fill('Cairo');await page.getByLabel('Academy timezone (IANA)',{exact:true}).selectOption('Africa/Cairo');await page.getByLabel('Find a timezone or city',{exact:true}).fill('No such timezone');await page.getByText('No matching timezone. Your selection has not changed.',{exact:true}).waitFor();assert.equal(await page.getByLabel('Academy timezone (IANA)',{exact:true}).inputValue(),'Africa/Cairo');
 lost=true;await page.getByRole('button',{name:'Save branch',exact:true}).click();await page.getByRole('button',{name:'Check status',exact:true}).click();await page.getByText('The original operation was committed once.',{exact:true}).waitFor();assert.equal(setup.version,1);assert.equal(setup.timezone,'Africa/Cairo');
 await page.getByRole('button',{name:'Edit sport',exact:true}).click();await page.getByLabel('Sport label — English',{exact:true}).fill('Synthetic Sport');await page.getByLabel('Sport label — Arabic',{exact:true}).fill('رياضة اختبار');
 conflict=true;await page.getByRole('button',{name:'Save sport',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByLabel('Sport label — English',{exact:true}).inputValue(),'Synthetic Sport');await page.getByRole('button',{name:'Refresh saved state',exact:true}).click();await page.getByRole('button',{name:'Save sport',exact:true}).click();
 await page.getByRole('button',{name:'Complete initial setup',exact:true}).click();await page.getByRole('heading',{name:'Initial setup saved',exact:true}).waitFor();assert.equal(setup.version,3);
 await page.reload();await page.getByRole('heading',{name:'Initial setup saved',exact:true}).waitFor();
 for(const locale of ['en','ar']){
  await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}&locale=${locale}`);await page.getByRole('button',{name:locale==='ar'?'تعديل الرياضة':'Edit sport',exact:true}).waitFor();
  await page.evaluate(ar=>{document.documentElement.dir=ar?'rtl':'ltr';},locale==='ar');
  await page.setViewportSize({width:360,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 revoked=true;await page.getByRole('button',{name:'تحديث الحالة المحفوظة',exact:true}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('listitem').filter({hasText:'Branch A'}).count(),0);
 revoked=false;switched=false;
 await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}`);
 await page.getByRole('listitem').filter({hasText:'Branch A'}).waitFor();
 await page.getByRole('button',{name:'Edit branch and timezone',exact:true}).click();await page.getByLabel('Branch name',{exact:true}).fill('Unsaved private A draft');
 holdSetup=true;const entered=new Promise(r=>{setupEntered=r;});
 await page.getByRole('button',{name:'Refresh saved state',exact:true}).click();
 await entered;
 switched=true;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_synthetic_b'})));
 await page.getByRole('listitem').filter({hasText:'Branch B'}).waitFor();
 const delayedResponse=page.waitForResponse(r=>r.url().endsWith('/api/onboarding')&&r.request().postDataJSON().action==='setup');releaseSetup();
 await (await delayedResponse).finished();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.equal(await page.getByRole('listitem').filter({hasText:'Branch A'}).count(),0);assert.equal(await page.locator('input[value="Unsaved private A draft"]').count(),0);
 await page.getByRole('button',{name:'Edit branch and timezone',exact:true}).click();assert.equal(await page.getByLabel('Branch name',{exact:true}).inputValue(),'Branch B');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ui:'passed',path:'create → invitation → accept → setup → lost-response reconcile → conflict → complete → refresh',authEntry:'EN/AR sign-in and create-account return/transfer props, pending handoff disabled, failed handoff recovery',phone:'EN/AR 360px no overflow',revocation:'private setup removed after denial',identityRace:'delayed A response and unsaved A draft excluded after B identity change',scope:'synthetic transport/identity; not hosted security evidence'}));
}finally{await browser.close();await new Promise(r=>server.close(r));}
