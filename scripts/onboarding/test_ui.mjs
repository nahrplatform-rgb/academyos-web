// Real React UI with synthetic transport/identity adapters. No product route or auth bypass.
// This verifies interaction/reflow/recovery only, never API or database authorization.
import { build } from 'esbuild';
import { chromium, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..');
const reactMode=process.env.UI_REACT_MODE==='development'?'development':'production';
const adapter=`import React from 'react';
let subject=new URLSearchParams(location.search).has('signedOut')?null:'user_synthetic';
const listeners=new Set();window.addEventListener('synthetic-session',e=>{subject=e.detail;listeners.forEach(fn=>fn());});
export function useUser(){const id=React.useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},()=>subject);return {isLoaded:true,isSignedIn:!!id,user:id?{id}:null};}
export function UserButton(){return <button>Test account</button>;}
export function SignInButton({children,forceRedirectUrl,signUpForceRedirectUrl}){return <span data-auth="sign-in" data-return={forceRedirectUrl} data-transfer-return={signUpForceRedirectUrl}>{children}</span>;}
export function SignUpButton({children,forceRedirectUrl,signInForceRedirectUrl}){return <span data-auth="sign-up" data-return={forceRedirectUrl} data-transfer-return={signInForceRedirectUrl}>{children}</span>;}`;
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/onboarding-workspace.tsx';const p=new URLSearchParams(location.search);createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace locale={p.get('locale')||'en'} mode={p.get('mode')||'context'} academy={p.get('academy')||undefined}/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'test-only-adapters',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(reactMode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="${new URL(req.url,'http://localhost').searchParams.get('locale')==='ar'?'ar':'en'}" dir="${new URL(req.url,'http://localhost').searchParams.get('locale')==='ar'?'rtl':'ltr'}"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(3194,'127.0.0.1',r));
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
// Optional review artifacts use only this harness's fixed synthetic fixture.
const reviewDir=process.env.UI_REVIEW_DIR?resolve(process.env.UI_REVIEW_DIR):null;
const reviewFrames=[];
if(reviewDir)await mkdir(reviewDir,{recursive:true});
async function captureReview(name,title,description){
 if(!reviewDir)return;
 await page.screenshot({path:resolve(reviewDir,name+'.png'),fullPage:true});
 reviewFrames.push({name,title,description});
}
let admitted=false,accepted=false,delivery='queued',lost=false,conflict=false,revoked=false;
let loseCreateReply=false,createCalls=0;
let extraAcademy=false,secondRevoked=false,platformDenied=false,platformReads=0;const invitationChanges=[];
const secondId='00000000-0000-4000-8000-000000000003';
let holdExchange=false,failExchange=false,releaseExchange,heldExchange;
let exchangeCommitted=true,reviewBeforeExchange=0,reviewCalls=0,exchangeCalls=0;
let holdSetup=false,releaseSetup,setupEntered,switched=false;
let holdSave=false,releaseSave,saveCalls=0;
const a='00000000-0000-4000-8000-000000000001',iv='00000000-0000-4000-8000-000000000002';
let setup={academy_id:a,name:'Synthetic Academy A',version:0,complete:false,timezone:null,branch:null,sport:null};
const receipts=new Map();
await page.route('**/api/onboarding',async route=>{
 const b=route.request().postDataJSON();let data;
 if(platformDenied&&b.action==='platform'){await route.fulfill({status:403,json:{error:'denied'}});return;}
 if(revoked&&['setup','save','operation'].includes(b.action)){await route.fulfill({status:403,json:{error:'denied'}});return;}
 switch(b.action){
 case'context':data={platform:true,memberships:accepted?[{membership_id:iv,academy_id:a,academy_name:setup.name,role:'owner'}]:[],more:false};break;
 case'platform':platformReads++;data={items:admitted?[{id:a,name:setup.name,setup_complete:setup.complete,invitation_id:iv,generation:1,expires_at:'2026-10-25T12:00:00Z',revoked:false,redeemed_at:accepted?'2026-10-22T12:00:00Z':null,delivery,attempts:0}]:[],more:false};break;
 case'reissue':invitationChanges.push(structuredClone(b));data={reissued:true};break;
 case'create':createCalls++;admitted=true;data={academy_id:a,invitation_id:iv,generation:1};break;
 case'exchange':
  exchangeCalls++;
  if(holdExchange){heldExchange=true;await new Promise(r=>{releaseExchange=r;});}
  if(failExchange){await route.fulfill({status:422,json:{error:'invalid'}});return;}
  exchangeCommitted=true;data={exchanged:true};break;
 case'review':
  reviewCalls++;
  if(!exchangeCommitted){reviewBeforeExchange++;await route.fulfill({status:422,json:{error:'invalid'}});return;}
  data={academy_id:a,name:setup.name,accepted};break;
 case'accept':accepted=true;data={academy_id:a,name:setup.name,accepted:true};break;
 case'setup':
  data=structuredClone(switched?{...setup,name:'Synthetic Academy B',branch:{id:iv,name:'Branch B'},sport:{id:iv,label_en:'Sport B',label_ar:'رياضة ب'}}:setup);
  if(holdSetup){holdSetup=false;await new Promise(r=>{releaseSetup=r;setupEntered();});}
  break;
 case'save':
  saveCalls++;if(holdSave)await new Promise(resolve=>{releaseSave=resolve;});
  if(conflict){conflict=false;await route.fulfill({status:409,json:{error:'conflict'}});return;}
  if(b.step==='branch'){setup.branch={id:iv,name:b.fields.name};setup.timezone=b.fields.timezone;setup.complete=false;}
  if(b.step==='sport'){setup.sport={id:iv,...b.fields};setup.complete=false;}
  if(b.step==='complete')setup.complete=true;
  setup.version++;data=setup;break;
 case'operation':data={found:receipts.has(b.op),result:receipts.get(b.op)};break;
 default:await route.fulfill({status:422,json:{error:'invalid'}});return;
 }
 if(b.action==='platform'&&extraAcademy)data.items.push({id:secondId,name:'Synthetic Academy B',setup_complete:false,invitation_id:secondId,generation:7,expires_at:'2026-10-25T12:00:00Z',revoked:secondRevoked,redeemed_at:null,delivery:'unknown',attempts:0});
 if(b.op)receipts.set(b.op,structuredClone(data));
 if(loseCreateReply&&b.action==='create'){loseCreateReply=false;await route.abort();return;}
 if(lost&&b.action==='save'){lost=false;await route.abort();return;}
 await route.fulfill({json:{data}});
});
try{
 // Identity resolution cannot outrun the outstanding encrypted-cookie exchange.
 holdExchange=true;exchangeCommitted=false;
 const handoffStarted=page.waitForRequest(r=>r.url().endsWith('/api/onboarding')&&r.postDataJSON().action==='exchange');
 await page.goto(`http://127.0.0.1:3194/?mode=invitation&signedOut=1#${iv}.${'b'.repeat(64)}`);
 await handoffStarted;await page.getByRole('button',{name:'Create account',exact:true}).waitFor();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_synthetic_b'})));
 await page.getByRole('button',{name:'Test account',exact:true}).waitFor();
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const earlyReviews=reviewBeforeExchange;
 const exchangeFinished=page.waitForResponse(r=>r.url().endsWith('/api/onboarding')&&r.request().postDataJSON().action==='exchange');
 holdExchange=false;releaseExchange();await (await exchangeFinished).finished();
 assert.equal(earlyReviews,0,'Invitation review must wait for cookie exchange across identity resolution');
 await page.getByRole('button',{name:'Accept owner appointment',exact:true}).waitFor();
 assert.equal(reviewCalls,1);assert.equal(exchangeCalls,1);assert.equal(new URL(page.url()).hash,'');
 // A failed handoff stays failed after identity resolution, without review or grant.
 holdExchange=true;exchangeCommitted=false;failExchange=true;reviewCalls=0;
 const failedHandoffStarted=page.waitForRequest(r=>r.url().endsWith('/api/onboarding')&&r.postDataJSON().action==='exchange');
 await page.goto(`http://127.0.0.1:3194/?mode=invitation&signedOut=1#${iv}.${'b'.repeat(64)}`);
 await failedHandoffStarted;await page.getByRole('button',{name:'Create account',exact:true}).waitFor();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_synthetic_b'})));
 await page.getByRole('button',{name:'Test account',exact:true}).waitFor();holdExchange=false;releaseExchange();
 await page.getByRole('alert').waitFor();assert.equal(reviewCalls,0);assert.equal(await page.getByRole('button',{name:'Accept owner appointment',exact:true}).count(),0);
 failExchange=false;exchangeCommitted=true;
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
 for (const locale of ['en','ar']) for(const width of [320,390,768,1440]) {
  const ar=locale==='ar';await page.setViewportSize({width,height:900});
  await page.goto(`http://127.0.0.1:3194/?mode=platform&locale=${locale}`);
  await page.getByRole('button',{name:ar?'إنشاء أكاديمية اختبار':'Create a synthetic academy',exact:true}).click();
  await expect(page.locator('.workspace-task .admission-create')).toBeVisible();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:ar?'العودة إلى قائمة الأكاديميات':'Back to academy list',exact:true}).click();
  await expect(page.getByRole('button',{name:ar?'إنشاء أكاديمية اختبار':'Create a synthetic academy',exact:true})).toBeFocused();
 }
 failExchange=true;
 await page.goto(`http://127.0.0.1:3194/?mode=invitation&signedOut=1#${iv}.${'b'.repeat(64)}`);
 await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).isDisabled(),true);failExchange=false;
 await page.goto('http://127.0.0.1:3194/?mode=context&signedOut=1');
 await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).count(),0);
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:3194/?mode=platform');
 await captureReview('01-admission','1. Platform Owner — academy admission','The real admission form, before creating the synthetic academy.');
 await page.getByRole('button',{name:'Create a synthetic academy',exact:true}).click();
 assert.equal(await page.locator('.workspace-task .admission-create').count(),1,'Creation is a central task rather than a narrow inspector');
 await page.getByLabel('Academy name',{exact:true}).fill('Synthetic Academy A');await page.getByLabel('Intended owner email',{exact:true}).fill('owner@academy.example');await page.getByRole('button',{name:'Review appointment',exact:true}).click();await captureReview('02-appointment-review','2. Review the owner appointment','Confirm the academy and intended recipient before creation.');loseCreateReply=true;await page.getByRole('button',{name:'Create and invite owner',exact:true}).click();
 await page.getByRole('button',{name:'Check original operation',exact:true}).click();
 await page.getByText('The original operation was committed once.',{exact:true}).waitFor();
 await page.getByText('Owner acceptance pending',{exact:true}).waitFor();
 assert.equal(createCalls,1,'Lost creation reply reconciles without a second academy');
 assert.equal(await page.locator('.admission-create').count(),0,'Confirmed original creation exits its unsaved form');await captureReview('03-invitation-pending','3. Invitation pending','Creation has returned in the synthetic transport; the owner has not accepted. Queued delivery is not inbox confirmation.');
 // I1 inspection must not fetch or dispatch an invitation change by itself.
 extraAcademy=true;
 await page.reload();await page.getByRole('button',{name:'Synthetic Academy B — view details',exact:true}).waitFor();
 // Regression for the reported detached title/refresh and cramped tablet columns.
 for (const width of [1440,926,360]) {
  await page.setViewportSize({width,height:900});
  const layout=await page.locator('.workspace-center').evaluate(el=>{const center=el.getBoundingClientRect(),h=el.querySelector('h1').getBoundingClientRect(),bar=el.querySelector('.task-header').getBoundingClientRect();return{padding:h.top-center.top,headerOwnsTitle:h.top>=bar.top&&h.bottom<=bar.bottom,overflow:document.documentElement.scrollWidth>innerWidth};});
  assert.ok(layout.padding>=16,'Title belongs inside padded workspace');assert.equal(layout.headerOwnsTitle,true);assert.equal(layout.overflow,false);
  if(width===926)assert.equal(await page.locator(':is(.workspace-inspector,.workspace-detail-dialog,.workspace-task-body)').isVisible(),false,'Tablet directory gets full task width before selection');
  await captureReview('clarity-admission-'+width,'Admission at '+width+'px','Aligned task title/refresh and directory-first layout.');
 }
 await page.setViewportSize({width:1440,height:1000});
 const readsBeforeInspection=platformReads;
 const rowB=page.getByRole('button',{name:'Synthetic Academy B — view details',exact:true});
 await rowB.focus();await page.keyboard.press('Enter');
 await page.locator('#admission-detail-heading').waitFor();
 await expect(page.locator('#admission-detail-heading')).toBeFocused();
 // Reparenting the selected detail into/out of the responsive dialog must retain its exact heading focus.
 await page.setViewportSize({width:926,height:900});
 await expect(page.getByRole('dialog',{name:'Academy details',exact:true})).toBeVisible();
 await expect(page.locator('#admission-detail-heading')).toBeFocused();
 await page.setViewportSize({width:1440,height:1000});
 await expect(page.getByRole('dialog',{name:'Academy details',exact:true})).toHaveCount(0);
 await expect(page.locator('#admission-detail-heading')).toBeFocused();
 await captureReview('16-admission-desktop','16. Desktop — loaded list and academy details','Explicit row inspection adds zero retrieval and keeps invitation changes in the named academy context.');
 assert.equal(platformReads,readsBeforeInspection,'Inspection adds zero data reads');
 assert.equal(invitationChanges.length,0,'Inspection is not an invitation mutation');
 const detail=page.getByRole('complementary',{name:'Synthetic Academy B',exact:true});
 await detail.getByText('Unknown; review before replacement',{exact:true}).waitFor();
 assert.equal(await detail.getByRole('button',{name:'Retry pending delivery',exact:true}).count(),0,'Unknown outcome cannot offer blind delivery retry');
 // Focused review is cancellable without changing the invitation; modal focus cannot escape.
 for (const width of [1440,390]) {
  await page.setViewportSize({width,height:900});
  const trigger=page.getByRole('button',{name:'Review new invitation',exact:true});
  await trigger.click();
  const modal=page.getByRole('dialog',{name:'Invitation change review',exact:true});
  await expect(modal).toBeVisible();
  await page.keyboard.press('Tab');
  assert.equal(await modal.evaluate(el=>el.contains(document.activeElement)),true,'Focus stays in invitation review');
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(trigger).toBeFocused();
  assert.equal(invitationChanges.length,0,'Escape never changes an invitation');
 }
 await page.setViewportSize({width:1440,height:1000});
 await detail.getByRole('button',{name:'Review new invitation',exact:true}).click();
 await captureReview('17-invitation-modal','17. Invitation change confirmation','Native focused review identifies the academy, exact consequence and retained recipient.');
 await page.getByRole('region',{name:'Invitation change review',exact:true}).getByText(/Synthetic Academy B/).waitFor();
 assert.equal(await page.getByRole('heading',{name:'Confirm invitation change',exact:true}).evaluate(el=>el===document.activeElement),true,'Invitation review receives keyboard focus');
 assert.equal(invitationChanges.length,0,'Review alone never commits');
 await page.getByRole('button',{name:'Confirm change',exact:true}).click();
 await page.getByText('Operation confirmed. Saved progress is shown below.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Synthetic Academy B — view details',exact:true}).waitFor();
 assert.equal(invitationChanges.length,1);assert.equal(invitationChanges[0].invitation,secondId);assert.equal(invitationChanges[0].generation,7);
 for(const locale of ['en','ar']){
  const ar=locale==='ar';secondRevoked=true;
  await page.setViewportSize({width:360,height:900});
  await page.goto(`http://127.0.0.1:3194/?mode=platform&locale=${locale}`);
  const row=page.getByRole('button',{name:ar?'Synthetic Academy B — عرض التفاصيل':'Synthetic Academy B — view details',exact:true});await row.waitFor();
  await row.focus();await page.keyboard.press('Enter');
  const panel=page.getByRole('complementary',{name:'Synthetic Academy B',exact:true});await panel.waitFor();
  assert.equal(await page.locator('.admission-create').isVisible(),false,'Phone inspection is one task; creation form is not active');
  assert.equal(await panel.getByRole('button',{name:ar?'مراجعة إلغاء الدعوة':'Review withdrawal',exact:true}).count(),0,'Revoked invitation does not offer withdrawal');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await captureReview(ar?'15-admission-ar-phone':'14-admission-en-phone',ar?'15. Arabic phone — academy details':'14. English phone — academy details','Actual I1 details use only the current loaded projection. Revoked/unknown states do not offer blind retry.');
  await page.getByRole('button',{name:ar?'العودة إلى قائمة الأكاديميات':'Back to academy list',exact:true}).click();
  await page.waitForFunction(()=>document.activeElement?.classList.contains('admission-open')&&document.activeElement.textContent.includes('Synthetic Academy B'));
  assert.equal(await row.evaluate(el=>el===document.activeElement),true,'Back returns keyboard focus to the inspected row');
  assert.equal(await page.getByRole('button',{name:ar?'إنشاء أكاديمية اختبار':'Create a synthetic academy',exact:true}).isVisible(),true,'Back restores directory creation action');
 }
 // Current denial must clear the selected platform projection too.
 await page.getByRole('button',{name:'Synthetic Academy B — عرض التفاصيل',exact:true}).click();
 platformDenied=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('alert').waitFor();
 assert.equal(await page.locator('#admission-details').count(),0);assert.equal(await page.getByRole('button',{name:/Synthetic Academy B/}).count(),0);
 platformDenied=false;accepted=true;
 await page.goto('http://127.0.0.1:3194/?mode=platform');
 await page.getByRole('button',{name:'Synthetic Academy A — view details',exact:true}).click();
 const redeemed=page.getByRole('complementary',{name:'Synthetic Academy A',exact:true});await redeemed.waitFor();
 assert.equal(await redeemed.getByRole('button',{name:/Review withdrawal|Review new invitation|Retry pending delivery/}).count(),0,'Redeemed invitations have no pending-invitation actions');
 accepted=false;extraAcademy=false;secondRevoked=false;
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:3194/?mode=invitation#'+iv+'.'+'b'.repeat(64));await page.getByRole('button',{name:'Accept owner appointment',exact:true}).waitFor();await captureReview('04-owner-invitation','4. Invited Academy Owner — review invitation','The real invitation view after simulated identity and handoff. Actual Clerk sign-up and email verification are not represented by this adapter.');await page.getByRole('button',{name:'Accept owner appointment',exact:true}).click();await page.getByRole('link',{name:'Enter setup workspace',exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');
 await page.goto('http://127.0.0.1:3194/?mode=context');await page.getByRole('link',{name:'Open academy',exact:true}).waitFor();await captureReview('05-workspace','5. Choose the academy workspace','The synthetic test identity has both platform and owner capabilities; real accounts only see their authorized contexts.');
 await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}`);
 await page.getByRole('button',{name:'Edit branch and timezone',exact:true}).click();await page.getByLabel('Branch name',{exact:true}).fill('Branch A');await page.getByLabel('Find a timezone or city',{exact:true}).fill('Cairo');await page.getByLabel('Academy timezone (IANA)',{exact:true}).selectOption('Africa/Cairo');await page.getByLabel('Find a timezone or city',{exact:true}).fill('No such timezone');await page.getByText('No matching timezone. Your selection has not changed.',{exact:true}).waitFor();assert.equal(await page.getByLabel('Academy timezone (IANA)',{exact:true}).inputValue(),'Africa/Cairo');
 await captureReview('06-branch-timezone','6. Branch and timezone draft','A real native timezone selector, with the chosen IANA value retained even when the search has no matches.');lost=true;await page.getByRole('button',{name:'Save branch',exact:true}).click();await page.getByRole('button',{name:'Check original operation',exact:true}).waitFor();await captureReview('07-unknown','7. Interrupted response — reconcile first','The test transport drops the response after committing its synthetic operation. The screen offers a status check before another save.');await page.getByRole('button',{name:'Check original operation',exact:true}).click();await page.getByText('The original operation was committed once.',{exact:true}).waitFor();assert.equal(setup.version,1);assert.equal(setup.timezone,'Africa/Cairo');
 await page.getByRole('button',{name:'Edit sport',exact:true}).click();await page.getByLabel('Sport label — English',{exact:true}).fill('Synthetic Sport');await page.getByLabel('Sport label — Arabic',{exact:true}).fill('رياضة اختبار');
 await captureReview('08-sport','8. Sport draft — English and Arabic','Review both sport labels before saving.');conflict=true;await page.getByRole('button',{name:'Save sport',exact:true}).click();await page.getByRole('alert').waitFor();await captureReview('09-conflict','9. Version conflict — preserve the draft','The test returns a conflict. The draft remains available while the saved state can be refreshed.');assert.equal(await page.getByLabel('Sport label — English',{exact:true}).inputValue(),'Synthetic Sport');await page.getByRole('button',{name:/^(Refresh view|Retry current read|Recheck current state)$/}).click();await page.getByRole('button',{name:'Save sport',exact:true}).click();
 await page.getByRole('button',{name:'Complete initial setup',exact:true}).waitFor();await captureReview('10-complete-review','10. Confirm initial setup','Review the branch, bilingual sport and timezone before completing setup.');await page.getByRole('button',{name:'Complete initial setup',exact:true}).click();await page.getByRole('heading',{name:'Initial setup saved',exact:true}).waitFor();assert.equal(setup.version,3);
 await page.reload();await page.getByRole('heading',{name:'Initial setup saved',exact:true}).waitFor();await captureReview('11-saved','11. Initial setup saved','The real confirmation view after reload. In this harness the saved fixture exists only in the running test process. Operational activation remains pending.');
 // Keyboard-only form traversal/activation on the real shared components.
 // Synthetic adapters control save timing; no product or auth bypass is added.
 const keyboardProfiles=[];
 async function tabTo(target){
  for(let count=0;count<40;count++){
   if(await target.evaluate(element=>element===document.activeElement))return;
   await page.keyboard.press('Tab');
  }
  assert.fail('Keyboard traversal did not reach the named target');
 }
 for(const locale of ['en','ar'])for(const width of [360,1440]){
  const ar=locale==='ar',label=(en,arabic)=>ar?arabic:en;
  await page.setViewportSize({width,height:900});
  await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}&locale=${locale}`);
  const edit=page.getByRole('button',{name:label('Edit branch and timezone','تعديل الفرع والمنطقة الزمنية'),exact:true});await edit.waitFor();
  assert.equal(await page.getByRole('main').count(),1,'Shared shell must expose exactly one main landmark');
  assert.equal(await page.getByRole('link',{name:label('Skip to content','انتقل إلى المحتوى'),exact:true}).getAttribute('href'),'#main');
  if(width<1280)await page.getByRole('button',{name:label('Menu','القائمة'),exact:true}).click();
  assert.equal(await page.getByRole('navigation',{name:label('Workspace navigation','التنقل في مساحة العمل'),exact:true}).count(),1);
  if(width<1280){await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:label('Menu','القائمة'),exact:true})).toBeFocused();}
  if(width<=720)for(const target of await page.locator('.toolbar-actions>a:visible,.brand:visible,.workspace-sidebar nav a:visible').all()){
   const size=await target.boundingBox();assert.ok(size&&size.height>=44&&size.width>=44,'Phone shell links must retain 44px touch targets');
  }
  await tabTo(edit);await page.keyboard.press('Enter');
  const branch=page.getByLabel(label('Branch name','اسم الفرع'),{exact:true});await branch.waitFor();await tabTo(branch);
  const callsBefore=saveCalls,versionBefore=setup.version;
  await page.keyboard.press('ControlOrMeta+A');await page.keyboard.press('Backspace');await page.keyboard.press('Enter');
  assert.equal(await branch.evaluate(element=>element===document.activeElement&&element.matches(':invalid')),true);
  assert.equal(saveCalls,callsBefore,'Native invalid branch must not dispatch a save');
  assert.equal(await branch.evaluate(element=>parseFloat(getComputedStyle(element).outlineWidth)>=2),true,'Keyboard field focus must remain visible');
  await page.keyboard.type('Branch A');
  const search=page.getByLabel(label('Find a timezone or city','البحث عن منطقة زمنية أو مدينة'),{exact:true});await tabTo(search);await page.keyboard.type('No such timezone');
  await page.getByText(label('No matching timezone. Your selection has not changed.','لا توجد نتائج مطابقة. لم يتغير اختيارك.'),{exact:true}).waitFor();
  const timezone=page.getByLabel(label('Academy timezone (IANA)','المنطقة الزمنية للأكاديمية (IANA)'),{exact:true});
  assert.equal(await timezone.inputValue(),'Africa/Cairo');await tabTo(timezone);
  // Arrange the native select value with the supported driver. Popup keyboard
  // operation is a separate real-browser/device check, not claimed here.
  await timezone.selectOption('');
  assert.equal(await timezone.inputValue(),'');
  const save=page.getByRole('button',{name:label('Save branch','حفظ الفرع'),exact:true});await tabTo(save);await page.keyboard.press('Enter');
  assert.equal(await timezone.evaluate(element=>element===document.activeElement&&element.matches(':invalid')),true);
  assert.equal(saveCalls,callsBefore,'Native invalid timezone must not dispatch a save');
  await tabTo(search);await page.keyboard.press('ControlOrMeta+A');await page.keyboard.press('Backspace');await page.keyboard.type('Cairo');
  await timezone.selectOption('Africa/Cairo');assert.equal(await timezone.inputValue(),'Africa/Cairo');
  assert.equal(await timezone.evaluate(element=>!!document.getElementById(element.getAttribute('aria-describedby'))?.textContent.trim()),true);
  for(const control of await page.locator('.journey-card form input,.journey-card form select,.journey-card form button').all()){
   const size=await control.boundingBox();
   if(width<=720){
    assert.ok(size&&size.height>=44&&size.width>=44,'Phone form target must retain the 44px touch target');
   }else{
    const tag=await control.evaluate(element=>element.tagName);
    assert.ok(['INPUT','SELECT','BUTTON'].includes(tag));
    assert.ok(size&&size.height>=44&&size.height<=56&&size.width>=44,'Charcoal desktop form controls retain readable 44–56px targets');
   }
  }
  await tabTo(save);holdSave=true;await page.keyboard.press('Enter');
  await page.getByText(label('Saving… waiting for confirmation.','جارٍ الحفظ… بانتظار التأكيد.'),{exact:true}).waitFor();
  assert.equal(await save.isDisabled(),true);assert.equal(setup.version,versionBefore,'Pending save is not committed success');
  await page.keyboard.press('Enter');await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(saveCalls,callsBefore+1,'Repeated Enter while pending must not create a second submission');
  holdSave=false;releaseSave();await page.getByText(label('Operation confirmed. Saved progress is shown below.','تم تأكيد العملية. يظهر التقدم المحفوظ أدناه.'),{exact:true}).waitFor();
  const title=page.getByRole('heading',{level:1});await page.waitForFunction(()=>document.activeElement?.tagName==='H1');
  assert.equal(await title.evaluate(element=>element===document.activeElement),true);assert.equal(setup.version,versionBefore+1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  keyboardProfiles.push({locale,width,invalidSubmissions:0,pendingSubmissions:1,confirmedVersionIncrement:1});
 }
 // Leave the fixture complete via its normal action for later recovery cases.
 await page.getByRole('button',{name:'إكمال الإعداد الأولي',exact:true}).click();await page.getByRole('heading',{name:'حُفظ الإعداد الأولي',exact:true}).waitFor();
 for(const locale of ['en','ar']){
  await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}&locale=${locale}`);await page.getByRole('button',{name:locale==='ar'?'تعديل الرياضة':'Edit sport',exact:true}).waitFor();
  await page.evaluate(ar=>{document.documentElement.dir=ar?'rtl':'ltr';},locale==='ar');
  await page.setViewportSize({width:360,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 await captureReview('12-ar-phone','12. Arabic phone — completed setup','The same setup confirmation in Arabic/RTL at a 360px CSS viewport.');
 revoked=true;await page.getByRole('button',{name:/^(تحديث العرض|إعادة محاولة قراءة الحالة|إعادة التحقق من الحالة)$/}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByRole('listitem').filter({hasText:'Branch A'}).count(),0);
 await captureReview('13-access-denied','13. Access removed — private content cleared','A simulated permission denial clears the previously displayed branch/sport.');
 revoked=false;switched=false;
 await page.goto(`http://127.0.0.1:3194/?mode=setup&academy=${a}`);
 await page.getByRole('listitem').filter({hasText:'Branch A'}).waitFor();
 await page.getByRole('button',{name:'Edit branch and timezone',exact:true}).click();await page.getByLabel('Branch name',{exact:true}).fill('Unsaved private A draft');
 holdSetup=true;const entered=new Promise(r=>{setupEntered=r;});
 await page.getByRole('button',{name:/^(Refresh view|Retry current read|Recheck current state)$/}).click();
 await entered;
 switched=true;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_synthetic_b'})));
 await page.getByRole('listitem').filter({hasText:'Branch B'}).waitFor();
 const delayedResponse=page.waitForResponse(r=>r.url().endsWith('/api/onboarding')&&r.request().postDataJSON().action==='setup');releaseSetup();
 await (await delayedResponse).finished();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 assert.equal(await page.getByRole('listitem').filter({hasText:'Branch A'}).count(),0);assert.equal(await page.locator('input[value="Unsaved private A draft"]').count(),0);
 await page.getByRole('button',{name:'Edit branch and timezone',exact:true}).click();assert.equal(await page.getByLabel('Branch name',{exact:true}).inputValue(),'Branch B');
 assert.deepEqual(errors,[]);
 const report={ui:'passed',reactMode,browserVersion:browser.version(),harnessSha256:createHash('sha256').update(await readFile(import.meta.filename)).digest('hex'),implementationSha256:Object.fromEntries(await Promise.all(['src/components/onboarding-workspace.tsx','src/components/admission-directory.tsx','src/components/timezone-select.tsx','src/components/workspace-shell.tsx','src/components/ui/controls.tsx','src/app/globals.css','src/lib/timezones.json'].map(async path=>[path,createHash('sha256').update(await readFile(root+'/apps/web/'+path)).digest('hex')]))),handoffRace:'zero early reviews; one exchange across identity resolution; failed exchange stays failed',path:'create → invitation → accept → setup → lost-response reconcile → conflict → complete → refresh',admission:'central EN/AR creation 320/390/768/1440; native review Escape/contained focus/trigger restore; lost-create receipt closes form without second create; two loaded rows; zero-read keyboard inspection; target invitation/generation; review focus; phone back focus; unknown/revoked/redeemed actions; current denial clears details',authEntry:'EN/AR sign-in and create-account return/transfer props, pending handoff disabled, failed handoff recovery',phone:'EN/AR 360px no overflow',keyboardProfiles,keyboardScope:'Tab/Enter, required focus, visible outline, labeled timezone values via driver, Charcoal 44–56px desktop/44px phone form controls, one pending submit, confirmed heading focus; native popup/screen reader not verified',revocation:'private setup removed after denial',identityRace:'delayed A response and unsaved A draft excluded after B identity change',scope:'synthetic transport/identity; not hosted security evidence'};
 if(process.env.UI_EVIDENCE_PATH)await writeFile(process.env.UI_EVIDENCE_PATH,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
 if(reviewDir){
  reviewFrames.sort((a,b)=>a.name.localeCompare(b.name));
  const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const nav=reviewFrames.map(frame=>`<a href="#${frame.name}">${escape(frame.title)}</a>`).join('');
  const frames=reviewFrames.map(frame=>`<section id="${frame.name}"><h2>${escape(frame.title)}</h2><p>${escape(frame.description)}</p><a href="${frame.name}.png" target="_blank"><img src="${frame.name}.png" alt="${escape(frame.title)}" loading="lazy"></a><a href="#top">Back to steps</a></section>`).join('');
  await writeFile(resolve(reviewDir,'index.html'),`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AcademyOS M1 — actual component review</title><style>body{margin:0;background:#eff3f9;color:#172941;font:16px/1.5 system-ui}main{max-width:1180px;margin:auto;padding:24px}header,section{background:white;border:1px solid #cbd5e1;border-radius:8px;padding:20px;margin-bottom:24px}nav{display:grid;gap:8px}a{color:#075bea}section{scroll-margin-top:16px}img{display:block;max-width:100%;height:auto;border:1px solid #cbd5e1;margin:16px 0}aside{border-inline-start:4px solid #075bea;padding:12px;background:#e8f0ff}</style><main><header id="top"><h1>AcademyOS M1: create → invite → accept → set up</h1><aside>Read-only review of actual app components in the current Charcoal spectrum design. Screenshots use fixed synthetic identity/transport adapters. This is not staging and does not send email, create real accounts or persist hosted records.</aside><p>Follow the steps below. Click an image for its full resolution. This gallery has no product actions. Review of this visual source is separate from hosted verification and full M1 acceptance.</p><nav aria-label="Journey review steps">${nav}</nav></header>${frames}</main></html>`,{flag:'wx'});
  await writeFile(resolve(reviewDir,'source-and-test-receipt.json'),JSON.stringify({...report,reviewFrames},null,2)+'\n',{flag:'wx'});
 }
 console.log(JSON.stringify(report));
}finally{await browser.close();await new Promise(r=>server.close(r));}
