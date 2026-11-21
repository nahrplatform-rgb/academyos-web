// Real React component; synthetic identity and transport only. No product bypass.
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {checkProfileContinuity} from './profile_continuity.mjs';
import {checkChangedQuery} from './changed_query.mjs';
const root=resolve(import.meta.dirname,'../..'),reactMode=process.env.UI_REACT_MODE==='development'?'development':'production';
const adapter=`import React from 'react';let subject='user_A';const listeners=new Set();window.addEventListener('synthetic-session',e=>{subject=e.detail;listeners.forEach(f=>f());});export function useUser(){const id=React.useSyncExternalStore(f=>{listeners.add(f);return()=>listeners.delete(f)},()=>subject);return{isLoaded:!new URLSearchParams(location.search).has('authPending'),user:id?{id}:null}}export function UserButton(){return <span>Test account</span>}`;
const compiled=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/people-workspace.tsx';createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace locale="en" academy="00000000-0000-4000-8000-000000000001" initialPlayer={new URLSearchParams(location.search).get("player") ?? undefined}/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'synthetic-ui-only',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(reactMode)}});
const privateFixture=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import {PeopleJourney} from '${root}/apps/web/src/components/people-workspace.tsx';createRoot(document.getElementById('root')).render(<React.StrictMode><PeopleJourney locale="en" academy="00000000-0000-4000-8000-000000000001" subject="user_A" privateProfiles nameCorrections lifecycleTrial={new URLSearchParams(location.search).has("lifecycle")}/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'private-people-fixture',setup(b){b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react'; export default function Link(props){return <a {...props}/>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(reactMode)}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{const path=new URL(req.url,"http://127.0.0.1").pathname;res.setHeader('Content-Type',path?.endsWith('.js')?'text/javascript':'text/html');res.end(path==='/private.js'?privateFixture.outputFiles[0].text:path==='/bundle.js'?compiled.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div lang="en" dir="ltr"><div id="root"></div></div><script src="${path==='/private'?'/private.js':'/bundle.js'}"></script></html>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const academy='00000000-0000-4000-8000-000000000001',branch='00000000-0000-4000-8000-000000000002';
let players=[{id:'00000000-0000-4000-8000-000000000010',display_name:'Alex Demo',branch_name:'Main Demo Branch',contact_email:'contact@example.invalid'}],profileFails=false,revision=1,denied=false,authMissing=false,lost=false,dropBefore=false,stale=false,creates=0,hold=false,release;
players.push(...Array.from({length:17},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+200).padStart(12,'0')}`,display_name:`Fictional Player ${i+1}`,branch_name:'Main Demo Branch'})));
const receipts=new Map(),calls=[],vacatedNames=new Set();let readHold=null,releaseRead;
let privateDetails={version:0,nationalId:'000031',schoolName:'Fixture School'};
let privatePhoto={version:0,image:null};
let rosterCommitment=true;
await page.route('**/api/people',async route=>{const b=route.request().postDataJSON();calls.push(b);if(readHold===b.action)await new Promise(resolve=>{releaseRead=resolve;});if(authMissing){await route.fulfill({status:401,json:{error:'denied'}});return;}if(denied){await route.fulfill({status:403,json:{error:'denied'}});return;}let data;
 switch(b.action){
 case'archivedList':
 case'list':{
 const matching=players.filter(p=>Boolean(p.archived)===(b.action==='archivedList')&&p.id>(b.after??'')&&[p.display_name,p.alternate_name].some(name=>name?.toLowerCase().startsWith(b.query?.toLowerCase()||''))).sort((a,b)=>a.id.localeCompare(b.id));
 data={academy_name:'Synthetic A',branch_id:branch,branch_name:'Main Demo Branch',items:matching.slice(0,25).map(({contact_email,alternate_name,...p})=>p),more:matching.length>25};break;
 }
 case'candidates':data={items:players.filter(p=>p.display_name.toLowerCase()===b.name.trim().toLowerCase()).map(({contact_email,alternate_name,...p})=>p),revision:b.name.trim().toLowerCase()==='alex demo'?revision:vacatedNames.has(b.name)?2:0,more:false};break;
 case'profile':if(profileFails){await route.fulfill({status:503,json:{error:'unavailable'}});return;}data=players.find(p=>p.id===b.player);if(data)data={version:1,archived:false,...data,...(data.alternate_name?{academy_member_number:'731'}:{})};break;
 case'findMember':data={player_id:players.find(p=>p.alternate_name)?.id};break;
 case'extendedPrivateProfile':
 case'privateProfile':{
  const {nationalId,...masked}=privateDetails;
  data={...masked,nationalIdPresent:Boolean(nationalId),...(b.revealId?{nationalId}:{})};break;
 }
 case'privatePhoto':data=privatePhoto;break;
 case'savePrivatePhoto':{
  assert.equal(b.version,privatePhoto.version);
  privatePhoto={version:b.version+1,image:b.image};
  data={player_id:b.player,private_photo_version:privatePhoto.version};
  receipts.set(b.op,data);
  if(b.image){await route.abort('failed');return;}
  break;
 }
 case'saveExtendedPrivateProfile':
 case'savePrivateProfile':{
  if(b.version!==privateDetails.version){await route.fulfill({status:409,json:{error:'conflict'}});return;}
  privateDetails={...privateDetails,...b.changes,version:b.version+1};
  data={player_id:b.player,private_profile_version:privateDetails.version};receipts.set(b.op,data);
  await route.abort('failed');return;
 }
 case'setArchived':{
  const player=players.find(p=>p.id===b.player);
  assert.equal(b.version,player.version??1);
  if(b.archived&&rosterCommitment){data={player_id:b.player,commitments:true};break;}
  Object.assign(player,{archived:b.archived,version:b.version+1});
  data={player_id:b.player,archived:b.archived,lifecycle_version:player.version};
  receipts.set(b.op,data);
  if(b.archived){await route.abort('failed');return;}
  break;
 }
 case'correctNames':{
  const player=players.find(p=>p.id===b.player);
  assert.equal(b.version,player.version??1);
  vacatedNames.add(player.display_name);
  Object.assign(player,{display_name:b.name,alternate_name:b.alternateName,version:b.version+1});
  receipts.set(b.op,{player_id:b.player,name_version:player.version});
  await route.abort('failed');return;
 }
 case'create':if(dropBefore){dropBefore=false;await route.abort('failed');return;}if(hold)await new Promise(r=>{release=r;});if(stale){stale=false;await route.fulfill({status:409,json:{error:'review_required'}});return;}creates++;const p={id:`00000000-0000-4000-8000-${String(creates+100).padStart(12,'0')}`,display_name:b.name,contact_email:b.contact,alternate_name:b.alternateName,branch_name:'Main Demo Branch'};players.push(p);revision++;data={player_id:p.id,version:1};receipts.set(b.op,data);if(lost){lost=false;await route.abort('failed');return;}break;
 case'reconcile':data=receipts.get(b.op)||{cancelled:true};break;
 default:throw new Error('Unexpected action '+b.action);
 }await route.fulfill({json:{data}});
});
async function visible(name){await page.getByRole('heading',{name,exact:true}).waitFor();}
async function freshForm(name='Alex Demo'){await page.getByRole('button',{name:'Register player',exact:true}).click();await page.getByLabel('Player display name (required)',{exact:true}).fill(name);}
async function checkDirectoryReturn(url, evidence){
 denied=false;
 players=[];
 const name='First Return Demo', originalKey=`academyos:people:user_A:${academy}`;
 const empty=page.getByText('No players registered yet. Register the first fictional player.',{exact:true});
 const summary=page.locator('.directory-page-summary'), rows=page.locator('.people-directory tbody tr');
 const search=page.getByRole('textbox',{name:'Find a player by name',exact:true});
 const register=page.getByRole('button',{name:'Register player',exact:true});
 const confirmed=page.getByText('Registration saved',{exact:true});
 await page.goto(url);await expect(empty).toBeVisible();await expect(summary).toHaveText('0 players on this page');
 const saveStart=calls.length, createStart=creates;
 await freshForm(name);await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();
 await page.getByRole('button',{name:'Save registration',exact:true}).click();
 await visible(name);await expect(confirmed).toBeVisible();

 readHold='list';releaseRead=null;
 await page.getByRole('button',{name:'Back to players',exact:true}).click();
 await expect.poll(()=>typeof releaseRead).toBe('function');
 const confirmedDuringReturn=await confirmed.isVisible();
 await expect(empty).toHaveCount(0);await expect(summary).toHaveCount(0);
 authMissing=true;readHold=null;releaseRead();
 await visible('Sign-in required');
 const confirmedBehindSignIn=await confirmed.isVisible();
 await expect(rows).toHaveCount(0);await expect(empty).toHaveCount(0);await expect(summary).toHaveCount(0);
 await expect(register).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Retry current read',exact:true})).toHaveCount(0);
 const beforeLanguage=calls.length;
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 await page.setViewportSize({width:360,height:800});
 await visible('تسجيل الدخول مطلوب');
 const arabicConfirmation=await page.getByText('حُفظ التسجيل',{exact:true}).isVisible();
 await expect(page.getByRole('button',{name:'إعادة المحاولة',exact:true})).toHaveCount(1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:resolve(evidence,'confirmed-directory-sign-in-ar-360.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('link',{name:'English',exact:true}).click();
 assert.equal(calls.length,beforeLanguage);
 authMissing=false;await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(summary).toHaveText('1 player on this page');
 const savedPlayer=page.getByRole('button',{name,exact:true});await expect(savedPlayer).toBeVisible();
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 const focusAfterRetry=await savedPlayer.evaluate(el=>document.activeElement===el);
 const saveActions=calls.slice(saveStart).map(c=>c.action);
 assert.deepEqual(saveActions,['candidates','create','profile','list','list']);
 assert.equal(creates,createStart+1);
 assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),originalKey),null);

 const profileRecoveryStart=calls.length;
 await savedPlayer.click();await visible(name);
 authMissing=true;await page.getByRole('button',{name:'Refresh view',exact:true}).click();
 await visible('Sign-in required');
 authMissing=false;await page.getByRole('button',{name:'Retry loading profile',exact:true}).click();
 await visible(name);
 const afterProfileRecovery={falseEmpty:await empty.isVisible(),summary:await summary.count(),
  actions:calls.slice(profileRecoveryStart).map(c=>c.action)};
 await page.getByRole('button',{name:'Back to players',exact:true}).click();
 await expect(summary).toHaveText('1 player on this page');
 const profileReturnActions=calls.slice(profileRecoveryStart+3).map(c=>c.action);

 const fixtures=Array.from({length:30},(_,index)=>({
  id:`00000000-0000-4000-8000-${String(300+index).padStart(12,'0')}`,
  display_name:`Group Demo ${index+1}`,branch_name:'Main Demo Branch',
 }));
 players.push(...fixtures);
 await search.fill('Group Demo');await expect(rows).toHaveCount(25);
 const next=page.getByRole('button',{name:'Next page',exact:true});
 await next.click();await expect(rows).toHaveCount(5);await expect(register).toBeEnabled();
 const cursor=fixtures[24].id;
 assert.equal(calls.at(-1).after,cursor);
 const pageKeys=()=>rows.getByRole('button').allTextContents();
 const secondPage=await pageKeys();
 await search.focus();
 readHold='list';releaseRead=null;const resumeStart=calls.length;
 await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('focus'));});
 await expect.poll(()=>typeof releaseRead).toBe('function');
 await expect(rows).toHaveCount(5);await expect(search).toBeFocused();
 readHold=null;releaseRead();await expect(register).toBeEnabled();
 const resume={requests:calls.length-resumeStart,query:calls.at(-1).query,after:calls.at(-1).after??null,rows:await pageKeys()};
 const refreshStart=calls.length;readHold='list';releaseRead=null;
 await page.getByRole('button',{name:'Refresh view',exact:true}).click();
 await expect.poll(()=>typeof releaseRead).toBe('function');
 const heldRefreshRows=await pageKeys();
 denied=true;readHold=null;releaseRead();
 await visible('Access unavailable');await expect(rows).toHaveCount(0);await expect(summary).toHaveCount(0);
 const refresh={requests:calls.length-refreshStart,query:calls.at(-1).query,after:calls.at(-1).after??null,rows:heldRefreshRows};
 denied=false;
 const retryStart=calls.length;
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(rows).toHaveCount(25);await expect(search).toHaveValue('Group Demo');
 const retryAfterDenial=calls.slice(retryStart).map(c=>[c.action,c.query,c.after??null]);

 await page.getByRole('link',{name:'العربية',exact:true}).click();
 await page.getByRole('button',{name:'الصفحة التالية',exact:true}).click();await expect(rows).toHaveCount(5);
 players=players.filter(player=>player.id<=cursor);
 const emptyTailStart=calls.length;
 await page.getByRole('button',{name:'تحديث العرض',exact:true}).click();
 await expect(page.getByText('لا يوجد لاعبون في هذه الصفحة. انتقل إلى الصفحة الأولى.',{exact:true})).toBeVisible();
 await expect(page.getByText('لا يوجد لاعبون مطابقون. جرّب اسماً آخر.',{exact:true})).toHaveCount(0);
 const emptyTail=calls.slice(emptyTailStart).map(c=>[c.action,c.query,c.after??null]);
 await page.getByRole('button',{name:'الصفحة الأولى',exact:true}).click();await expect(rows).toHaveCount(25);
 assert.deepEqual(calls.slice(emptyTailStart+1).map(c=>[c.action,c.query,c.after??null]),[['list','Group Demo',null]]);
 const result={confirmedDuringReturn,confirmedBehindSignIn,arabicConfirmation,focusAfterRetry,saveActions,afterProfileRecovery,profileReturnActions,resume,refresh,retryAfterDenial,emptyTail};
 await writeFile(resolve(evidence,'directory-return.json'),JSON.stringify(result,null,2)+'\n');
 assert.deepEqual([confirmedDuringReturn,confirmedBehindSignIn,arabicConfirmation,focusAfterRetry],[true,true,true,true]);
 assert.deepEqual(afterProfileRecovery,{falseEmpty:false,summary:0,actions:['profile','profile','profile']});
 assert.deepEqual(profileReturnActions,['list']);
 assert.deepEqual(resume,{requests:1,query:'Group Demo',after:cursor,rows:secondPage});
 assert.deepEqual(refresh,{requests:1,query:'Group Demo',after:cursor,rows:secondPage});
 assert.deepEqual(retryAfterDenial,[['list','Group Demo',null]]);
 assert.deepEqual(emptyTail,[['list','Group Demo',cursor]]);
 return result;
}
const evidence=(process.env.UI_EVIDENCE_DIR||process.env.PEOPLE_REVIEW_DIR)?resolve(process.env.UI_EVIDENCE_DIR||process.env.PEOPLE_REVIEW_DIR):resolve(root,'docs/07-handoff/evidence/workflow-clarity-2026-10-25/people');await mkdir(evidence,{recursive:true});
try{
 const url=`http://127.0.0.1:${server.address().port}`;
 const searchBaseline=process.env.PEOPLE_SEARCH_BASELINE==='1';
 const continuity=searchBaseline?null:await checkProfileContinuity({browser,url,evidence:resolve(evidence,'profile-continuity'),reactMode,baseline:process.env.PEOPLE_PROFILE_BASELINE==='1',menuBaseline:process.env.PEOPLE_MENU_BASELINE==='1'});
 if(searchBaseline)console.log(JSON.stringify({changedQuery:await checkChangedQuery({browser,url,evidence,reactMode,baseline:true})}));
 else if(process.env.PEOPLE_PROFILE_ONLY==='1')console.log(JSON.stringify({profileContinuity:continuity}));
 else {
 const changedQuery=await checkChangedQuery({browser,url,evidence,reactMode});
 await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByRole('button',{name:'Register player',exact:true}).waitFor();await page.getByRole('button',{name:'Register player',exact:true}).isEnabled();
 await expect(page.locator('tbody tr')).toHaveCount(18);await page.getByLabel('Find a player by name',{exact:true}).fill('No such player');await page.getByText('No matching players. Try another name.',{exact:true}).waitFor();await page.getByRole('button',{name:'Clear search',exact:true}).click();await expect(page.locator('tbody tr')).toHaveCount(18);await page.screenshot({path:resolve(evidence,'directory-en-18.png'),fullPage:true});
 await page.getByLabel('Find a player by name',{exact:true}).fill('a');await page.getByText('Enter at least two characters to search.',{exact:true}).waitFor();await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeEnabled();assert.equal(calls.some(c=>c.action==='list'&&c.query==='a'),false);await page.getByLabel('Find a player by name',{exact:true}).fill('Alex');await expect(page.getByRole('button',{name:'Alex Demo',exact:true})).toBeVisible();await page.getByLabel('Find a player by name',{exact:true}).fill('');await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeEnabled();
 const baseline=process.env.EX02_PEOPLE_BASELINE==='1';
 async function visibleReturn(){await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(40);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(120);}
 // The last checked same-scope rows stay mounted during one bounded resume read.
 await page.locator('tbody tr').first().evaluate(el=>el.dataset.resumeProbe='directory-row');
 const heldDirectoryStart=calls.length;readHold='list';releaseRead=null;
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect.poll(()=>calls.length).toBe(heldDirectoryStart+1);
 await expect(page.locator('tbody tr')).toHaveCount(18);
 await expect(page.locator('tbody tr').first()).toHaveAttribute('data-resume-probe','directory-row');
 await expect(page.getByRole('status')).toContainText('Checking current players');
 await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeDisabled();
 await expect.poll(()=>typeof releaseRead).toBe('function');readHold=null;releaseRead();
 await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeEnabled();
 assert.equal(calls.length-heldDirectoryStart,1,'retained directory adds no check request');
 const directoryStart=calls.length;await visibleReturn();const directoryResumeReads=calls.length-directoryStart;assert.equal(directoryResumeReads,baseline?2:1,'one directory read per visible return');await expect(page.locator('tbody tr')).toHaveCount(18);
 await page.getByRole('button',{name:'Alex Demo',exact:true}).click();await expect(page.getByRole('button',{name:'Back to players',exact:true})).toBeEnabled();await expect(page.locator(':is(.workspace-inspector,.workspace-detail-dialog,.workspace-task-body) .inspector-heading h2')).toBeFocused();const heldProfileStart=calls.length;readHold='profile';releaseRead=null;
 await page.getByText('contact@example.invalid',{exact:true}).evaluate(el=>el.dataset.resumeProbe='profile-contact');
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect.poll(()=>calls.length).toBe(heldProfileStart+1);
 await expect(page.getByText('contact@example.invalid',{exact:true})).toHaveAttribute('data-resume-probe','profile-contact');
 // A secondary read may be cancelled; consequential save/unknown guards below
 // remain disabled and the same current refusal must still mask private data.
 await expect(page.getByRole('button',{name:'Back to players',exact:true})).toBeEnabled();
 await expect.poll(()=>typeof releaseRead).toBe('function');readHold=null;releaseRead();
 // Back is intentionally usable in flight. The profile's own refresh control
 // signals settlement before testing a distinct subsequent visible return.
 await expect(page.getByRole('button',{name:'Refresh view',exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'Back to players',exact:true})).toBeEnabled();
 assert.equal(calls.length-heldProfileStart,1,'retained profile adds no check request');
 const profileStart=calls.length;await visibleReturn();const profileResumeReads=calls.length-profileStart;assert.equal(profileResumeReads,baseline?2:1,'one selected-profile read per visible return');await expect(page.getByText('contact@example.invalid',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Back to players',exact:true}).click();await expect(page.getByRole('button',{name:'Alex Demo',exact:true})).toBeFocused();
 await freshForm();await page.getByLabel('Parent/guardian contact email (optional)',{exact:true}).fill('contact@example.invalid');await page.getByRole('button',{name:'Continue to duplicate review'}).click();await visible('Review possible duplicates');await expect(page.locator('.workspace-task-body .people-comparison')).toBeVisible();await expect(page.getByRole('heading',{name:'New registration',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Possible existing players',exact:true})).toBeVisible();await expect(page.locator('.workspace-detail-dialog[open]')).toHaveCount(0);await page.screenshot({path:resolve(evidence,'duplicate-comparison-en-1440.png'),fullPage:true});for(const width of [320,390,768]){await page.setViewportSize({width,height:900});await expect(page.locator('.workspace-task-body .people-comparison')).toBeVisible();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);if(width===390)await page.screenshot({path:resolve(evidence,'duplicate-comparison-en-390.png'),fullPage:true});}await page.setViewportSize({width:1440,height:1000});assert.equal(await page.getByRole('button',{name:'Review new registration',exact:true}).isEnabled(),false);
 await page.getByRole('button',{name:'Open existing profile'}).click();await visible('Player profile');assert.equal(creates,0);await page.getByRole('button',{name:'Return to registration draft'}).click();assert.equal(await page.getByLabel('Player display name (required)',{exact:true}).inputValue(),'Alex Demo');
 await page.getByRole('button',{name:'Continue to duplicate review'}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Review new registration',exact:true}).click();await visible('Confirm player registration');
 const reviewStart=calls.length,beforeResumeCreates=creates;await visibleReturn();const reviewResumeReads=calls.length-reviewStart;assert.equal(reviewResumeReads,baseline?1:0,'paired focus must not read directory after invalidating duplicate confirmation');await visible('New player draft');await expect(page.getByLabel('Player display name (required)',{exact:true})).toHaveValue('Alex Demo');assert.equal(creates,beforeResumeCreates);await page.getByRole('button',{name:'Continue to duplicate review'}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Review new registration',exact:true}).click();await visible('Confirm player registration');
 stale=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();await visible('Review possible duplicates');assert.equal(await page.getByRole('checkbox').isChecked(),false);assert.equal(creates,0);
 await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Review new registration',exact:true}).click();lost=true;hold=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();await visible('Saving… awaiting confirmation');assert.equal(await page.getByRole('button',{name:'Saving…',exact:true}).isEnabled(),false);while(!release)await new Promise(r=>setTimeout(r,10));release();hold=false;await visible('Save outcome is uncertain');const unknownCalls=calls.length;await visibleReturn();assert.equal(calls.length,unknownCalls,'visible return must not replace or refresh an unknown save');await page.getByRole('button',{name:'Check original save',exact:true}).click();await visible('Player profile');assert.equal(creates,1);assert.equal((await page.evaluate(()=>Object.values(sessionStorage))).some(x=>x.includes('contact@example.invalid')),false);
 // Shared preference changes presentation without a data request or identity change.
 const callsBeforeTheme=calls.length;
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
 await page.getByRole('button',{name:'Dark mode',exact:true}).click();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'dark');
 await page.getByRole('button',{name:'Light mode',exact:true}).click();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).colorScheme),'light');
 assert.equal(calls.length,callsBeforeTheme,'Theme switching must not retrieve or write business data');
 await page.screenshot({path:resolve(evidence,'saved-profile-en.png'),fullPage:true});
 await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await expect(page.getByRole('button',{name:'Back to players',exact:true})).toBeVisible();await page.setViewportSize({width:1440,height:1000});

 // A cancelled attempt must not leave its notice attached to a later intent.
 await page.getByRole('button',{name:'Back to players',exact:true}).click();await freshForm('Cancelled Demo');await page.getByRole('button',{name:'Continue to duplicate review'}).click();await visible('Confirm player registration');dropBefore=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();await visible('Save outcome is uncertain');await page.getByRole('button',{name:'Check original save',exact:true}).click();await visible('New player draft');const cancelledText='The original save did not commit and is now cancelled. You may register again.';await page.getByText(cancelledText,{exact:true}).waitFor();assert.equal(creates,1);
 await page.getByLabel('Player display name (required)',{exact:true}).fill('After Cancel Demo');await page.getByRole('button',{name:'Continue to duplicate review'}).click();await visible('Confirm player registration');assert.equal(await page.getByText(cancelledText,{exact:true}).count(),0);
 lost=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();await visible('Save outcome is uncertain');assert.equal(await page.getByText(cancelledText,{exact:true}).count(),0);await page.getByRole('button',{name:'Check original save',exact:true}).click();await visible('Player profile');assert.equal(creates,2);assert.equal(await page.getByText(cancelledText,{exact:true}).count(),0);
 await page.getByRole('button',{name:'Back to players',exact:true}).click();await freshForm('New Demo');await page.getByRole('link',{name:'العربية',exact:true}).click();assert.equal(await page.getByLabel('اسم عرض اللاعب (مطلوب)',{exact:true}).inputValue(),'New Demo');assert.equal(await page.locator('.app-scene').evaluate(el=>getComputedStyle(el).direction),'rtl');await page.setViewportSize({width:360,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:resolve(evidence,'draft-ar-360.png'),fullPage:true});
 await page.getByRole('button',{name:'المتابعة لمراجعة التكرار'}).click();await visible('تأكيد تسجيل اللاعب');await page.screenshot({path:resolve(evidence,'confirmation-ar-360.png'),fullPage:true});
 await page.getByRole('button',{name:'تعديل المسودة',exact:true}).click();const literalName='<img src=x onerror=alert(1)>';await page.getByLabel('اسم عرض اللاعب (مطلوب)',{exact:true}).fill(literalName);await page.getByRole('button',{name:'المتابعة لمراجعة التكرار'}).click();await visible('تأكيد تسجيل اللاعب');assert.equal(await page.getByText(literalName,{exact:true}).count(),1);assert.equal(await page.locator('img[src="x"]').count(),0);

 // Returning to review retains typed intent and invalidates approval, with no silent commit.
 const beforeReturnCreates=creates;
 await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
 await visible('مسودة لاعب جديد');assert.equal(await page.getByLabel('اسم عرض اللاعب (مطلوب)',{exact:true}).inputValue(),literalName);assert.equal(creates,beforeReturnCreates);
 await page.getByRole('link',{name:'English',exact:true}).click();await page.getByLabel('Player display name (required)',{exact:true}).fill('Confirmed Read Failure Demo');await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();await visible('Confirm player registration');
 profileFails=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();
 await page.getByText('Registration saved. The profile could not load. Try again.',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Check original save',exact:true}).count(),0,'Confirmed write must not become unknown outcome');const afterConfirmed=creates;
 await expect(page.getByRole('alert')).toHaveCount(1);
 await expect(page.getByRole('button',{name:'Retry loading profile',exact:true})).toHaveCount(1);
 await page.setViewportSize({width:1440,height:1000});
 const beforeLanguage=calls.length;
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('حُفظ التسجيل. تعذّر تحميل الملف. أعد المحاولة.');
 assert.equal(calls.length,beforeLanguage,'changing error language never repeats a confirmed registration');
 await page.getByRole('link',{name:'English',exact:true}).click();
 profileFails=false;await page.getByRole('button',{name:'Retry loading profile',exact:true}).click();await visible('Player profile');assert.equal(creates,afterConfirmed,'Read retry must not repeat confirmed registration');
 // An API401 is not role loss. Mask the checked profile without losing the
 // original actor's task; retry only its current read after authentication.
 const beforeAuth=calls.length;authMissing=true;
 await page.getByRole('button',{name:/^(Refresh view|Retry current read)$/}).click();
 await expect(page.getByRole('heading',{name:'Sign-in required',exact:true})).toBeVisible();
 await expect(page.getByText('Sign in again to check these players. Saved work stays protected.',{exact:true})).toBeVisible();
 await expect(page.getByText('contact@example.invalid',{exact:true})).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Access unavailable',exact:true})).toHaveCount(0);
 assert.deepEqual(calls.slice(beforeAuth).map(c=>c.action),['profile']);
 await page.screenshot({path:resolve(evidence,'authentication-required-en.png'),fullPage:true});
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 await expect(page.getByRole('heading',{name:'تسجيل الدخول مطلوب',exact:true})).toBeVisible();
 await expect(page.getByRole('alert')).toContainText('يبقى العمل المحفوظ محميًا.');
 await page.setViewportSize({width:360,height:800});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:resolve(evidence,'authentication-required-ar-360.png'),fullPage:true});
 await page.setViewportSize({width:1440,height:1000});
 await page.getByRole('link',{name:'English',exact:true}).click();
 assert.deepEqual(calls.slice(beforeAuth).map(c=>c.action),['profile'],'language changes do not retry a failed sign-in check');
 authMissing=false;
 await page.getByRole('button',{name:'Retry loading profile',exact:true}).click();
 await visible('Player profile');
 assert.deepEqual(calls.slice(beforeAuth).map(c=>c.action),['profile','profile']);
 assert.equal(creates,afterConfirmed);
 // Keep draft intent in the same actor's memory behind an authentication mask.
 await page.getByRole('button',{name:'Back to players',exact:true}).click();
 await freshForm('Authentication retained draft');
 await page.getByLabel('Parent/guardian contact email (optional)',{exact:true}).fill('retained@example.invalid');
 const draftAuthStart=calls.length;authMissing=true;
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page.getByRole('heading',{name:'Sign-in required',exact:true})).toBeVisible();
 await expect(page.getByLabel('Player display name (required)',{exact:true})).toHaveCount(0);
 authMissing=false;await page.getByRole('button',{name:'Try again',exact:true}).click();
 await visible('New player draft');
 assert.equal(await page.getByLabel('Player display name (required)',{exact:true}).inputValue(),'Authentication retained draft');
 assert.equal(await page.getByLabel('Parent/guardian contact email (optional)',{exact:true}).inputValue(),'retained@example.invalid');
 assert.deepEqual(calls.slice(draftAuthStart).map(c=>c.action),['list','list']);
 assert.equal(creates,afterConfirmed);
 // The original remains the sole resolution target while sign-in is missing.
 await page.getByLabel('Player display name (required)',{exact:true}).fill('Authentication original demo');
 await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();
 lost=true;await page.getByRole('button',{name:'Save registration',exact:true}).click();
 await visible('Save outcome is uncertain');
 const originalKey=`academyos:people:user_A:${academy}`;
 const original=await page.evaluate(key=>sessionStorage.getItem(key),originalKey);
 assert.match(original,/^[a-f0-9-]{36}$/i);
 const unknownAuthStart=calls.length,unknownCreates=creates;authMissing=true;
 await page.getByRole('button',{name:'Check original save',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Sign-in required',exact:true})).toBeVisible();
 assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),originalKey),original);
 await expect(page.getByRole('button',{name:'Register player',exact:true})).toHaveCount(0);
 authMissing=false;await page.getByRole('button',{name:'Check original save',exact:true}).click();
 await visible('Player profile');
 assert.equal(creates,unknownCreates);
 assert.deepEqual(calls.slice(unknownAuthStart).map(c=>c.action),['reconcile','reconcile','profile']);
 assert.ok(calls.slice(unknownAuthStart).filter(c=>c.action==='reconcile').every(c=>c.op===original));
 assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),originalKey),null);
 // A pre-commit401 still keeps its original until a canonical cancellation;
 // recovering that cancelled original restores scope before another review.
 readHold='list';releaseRead=null;
 await page.getByRole('button',{name:'Back to players',exact:true}).click();
 await expect.poll(()=>typeof releaseRead).toBe('function');
 const releaseReturningList=releaseRead;readHold=null;
 await page.getByLabel('Find a player by name',{exact:true}).fill('a');
 await expect(page.getByText('Enter at least two characters to search.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeEnabled();
 releaseReturningList();
 await freshForm('Authentication before commit demo');
 await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();
 const beforeUncommitted=creates,uncommittedStart=calls.length;authMissing=true;
 await page.getByRole('button',{name:'Save registration',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Sign-in required',exact:true})).toBeVisible();
 const uncommittedOriginal=await page.evaluate(key=>sessionStorage.getItem(key),originalKey);
 assert.match(uncommittedOriginal,/^[a-f0-9-]{36}$/i);
 assert.equal(creates,beforeUncommitted);
 authMissing=false;await page.getByRole('button',{name:'Check original save',exact:true}).click();
 await visible('New player draft');
 await expect(page.getByText('Synthetic A · Main Demo Branch',{exact:true})).toBeVisible();
 assert.equal(await page.getByLabel('Player display name (required)',{exact:true}).inputValue(),'Authentication before commit demo');
 assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),originalKey),null);
 assert.equal(creates,beforeUncommitted);
 assert.deepEqual(calls.slice(uncommittedStart).map(c=>c.action),['create','reconcile','list']);
 assert.equal(calls[uncommittedStart+1].op,uncommittedOriginal);
 assert.equal(calls.at(-1).query,'','scope recovery never sends an unsupported one-character server search');
 // A new identity remount must remove all prior actor projections and drafts.
 denied=true;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_B'})));await page.getByRole('alert').waitFor();assert.equal(await page.getByText('New Demo',{exact:true}).count(),0);assert.equal(await page.getByText('contact@example.invalid',{exact:true}).count(),0);
 // Refresh a saved profile after revocation clears it.
 denied=false;await page.evaluate(()=>window.dispatchEvent(new CustomEvent('synthetic-session',{detail:'user_A'})));await page.getByRole('button',{name:'Alex Demo',exact:true}).first().click();await visible('Player profile');denied=true;await page.getByRole('button',{name:/^(Refresh view|Retry current read)$/}).click();await page.getByRole('alert').waitFor();assert.equal(await page.getByText('contact@example.invalid',{exact:true}).count(),0);
 const priorRequests=calls.length,priorCreates=creates;
 const directoryReturn=await checkDirectoryReturn(`http://127.0.0.1:${server.address().port}`,evidence);
 const alternateStart=calls.length, displayName='ليلى عادل', alternateName='Layla Adel';
 await page.goto(url);
 await freshForm(displayName);
 await page.getByLabel('Alternate full name (optional)',{exact:true}).fill(alternateName);
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 await expect(page.getByLabel('الاسم الكامل البديل (اختياري)',{exact:true})).toHaveValue(alternateName);
 await page.getByRole('button',{name:'المتابعة لمراجعة التكرار',exact:true}).click();
 await expect(page.getByText(alternateName,{exact:true})).toBeVisible();
 lost=true;
 await page.getByRole('button',{name:'حفظ التسجيل',exact:true}).click();
 const recoverAlternate=page.getByRole('button',{name:'التحقق من الحفظ الأصلي',exact:true});
 await recoverAlternate.click();
 await visible(displayName);
 await expect(page.getByText(alternateName,{exact:true})).toBeVisible();
 const savedCalls=calls.slice(alternateStart);
 const writes=savedCalls.filter(call=>call.action==='create');
 assert.equal(writes.length,1);
 assert.equal(writes[0].name,displayName);
 assert.equal(writes[0].alternateName,alternateName);
 assert.deepEqual(savedCalls.filter(call=>call.action==='reconcile').map(call=>call.op),[writes[0].op]);
 const savedPlayer=savedCalls.find(call=>call.action==='profile').player;
 await page.getByRole('button',{name:'العودة للاعبين',exact:true}).click();
 for(const [label,query] of [['البحث عن لاعب بالاسم','ليلى'],['Find a player by name','layla']]){
  const search=page.getByRole('textbox',{name:label,exact:true});
  await search.fill(query);
  const row=page.getByRole('button',{name:displayName,exact:true});
  await expect(page.locator('.people-directory tbody tr')).toHaveCount(1);
  await row.click();
  await visible(displayName);
  await expect(page.getByText(alternateName,{exact:true})).toBeVisible();
  await expect(page.getByText(query==='ليلى'?'رقم العضوية في الأكاديمية':'Academy member number',{exact:true})).toBeVisible();
  await expect(page.locator('dd').getByText('731',{exact:true})).toBeVisible();
  assert.equal(calls.at(-1).player,savedPlayer);
  if(query==='ليلى'){
   await page.getByRole('button',{name:'العودة للاعبين',exact:true}).click();
   await page.getByRole('link',{name:'English',exact:true}).click();
   await expect(page.getByLabel('Find a player by name',{exact:true})).toHaveValue(query);
  }
 }
 assert.equal(calls.slice(alternateStart).filter(call=>call.action==='create').length,1);
 const directStart=calls.length;
 await page.goto(url+'/?player='+savedPlayer);
 await visible(displayName);
 assert.deepEqual(calls.slice(directStart).map(c=>c.action),['list','profile']);
 assert.equal(calls.at(-1).player,savedPlayer);
 await page.getByRole('button',{name:'Back to players',exact:true}).click();
 assert.equal(new URL(page.url()).searchParams.has('player'),false);
 await expect(page.getByRole('heading',{name:'Player profile',exact:true})).toHaveCount(0);
 assert.equal(calls.length,directStart+2,'Back from a linked profile reuses the checked directory');
 await page.goto(url+'/private');
 await page.getByText('Find by member ID',{exact:true}).click();
 await page.getByLabel('ID type',{exact:true}).selectOption('existing');
 await page.getByLabel('Member ID',{exact:true}).fill('001');
 await page.getByRole('button',{name:'Find player',exact:true}).click();
 await visible(displayName);
 assert.equal(calls.findLast(c=>c.action==='findMember').kind,'existing');
 const overview=page.getByRole('tab',{name:'Profile',exact:true});
 const panel=page.getByRole('tabpanel',{name:'Profile',exact:true});
 await expect(panel.getByText('Hidden',{exact:true})).toBeVisible();
 const actions=page.getByRole('tab',{name:'Actions',exact:true});
 await expect(overview).toHaveAttribute('aria-selected','true');
 const tabReads=calls.length;
 await actions.click();
 await expect(page.getByRole('link',{name:'Player QR card',exact:true})).toBeVisible();
 await overview.click();
 await expect(panel.getByText('Hidden',{exact:true})).toBeVisible();
 assert.deepEqual(calls.slice(tabReads).map(call=>call.action),['privateProfile'],'Returning to Profile refreshes private details without reloading the player');
 await overview.press('ArrowRight');
 const participation=page.getByRole('tab',{name:'Participation',exact:true});
 await expect(participation).toBeFocused();
 await participation.press('Enter');
 await expect(page.getByRole('tabpanel',{name:'Participation',exact:true})).toBeVisible();
 await overview.click();
 await expect(panel.getByText('Hidden',{exact:true})).toBeVisible();
 await expect(panel.getByLabel('School name',{exact:true})).toHaveCount(1);
 await expect(panel.getByLabel('National ID',{exact:true})).toHaveCount(0);
 await panel.getByRole('button',{name:'Reveal national ID'}).click();
 await expect(panel.getByLabel('National ID',{exact:true})).toHaveValue('000031');
 await panel.getByLabel('School name',{exact:true}).fill('Updated Fixture School');
 privateDetails={...privateDetails,version:1,schoolName:'Concurrent Fixture School'};
 await panel.getByRole('button',{name:'Save private details'}).click();
 await expect(panel.getByRole('alert')).toContainText('The profile changed');
 await panel.getByRole('button',{name:'Reload current details'}).click();
 await expect(panel.getByLabel('School name')).toHaveValue('Updated Fixture School');
 await expect(panel.getByText('Last loaded: Concurrent Fixture School')).toBeVisible();
 const privateStart=calls.length;
 await panel.getByRole('button',{name:'Save private details'}).click();
 await expect(panel.getByRole('button',{name:'Check original profile save'})).toBeVisible();
 await actions.click();
 await expect(overview).toHaveAttribute('aria-selected','true');
 await panel.getByRole('button',{name:'Check original profile save'}).click();
 await expect(panel.getByText('Private details saved.',{exact:true})).toBeVisible();
 await expect(panel.getByLabel('School name')).toHaveValue('Updated Fixture School');
 await expect(panel.getByText('Hidden',{exact:true})).toBeVisible();
 const privateWrites=calls.slice(privateStart).filter(c=>c.action==='savePrivateProfile');
 assert.equal(privateWrites.length,1);
 assert.deepEqual(calls.slice(privateStart).filter(c=>c.action==='reconcile').map(c=>c.op),[privateWrites[0].op]);
 await panel.getByRole('button',{name:'Close private details'}).click();
 await expect(overview).toBeFocused();
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 const arabicPrivate=page.getByRole('tabpanel',{name:'الملف',exact:true});
 await expect(arabicPrivate.getByLabel('اسم المدرسة')).toHaveValue('Updated Fixture School');
 await expect(arabicPrivate.getByText('مخفي',{exact:true})).toBeVisible();
 await page.setViewportSize({width:390,height:850});
 assert.equal(await arabicPrivate.evaluate(el=>el.scrollWidth<=el.clientWidth),true);
 await arabicPrivate.getByRole('button',{name:'تحميل صورة الملف',exact:true}).click();
 const sharp=(await import('sharp')).default;
 const portrait=await sharp({create:{width:32,height:32,channels:3,background:'#165c94'}}).jpeg().toBuffer();
 await arabicPrivate.getByLabel('اختر صورة',{exact:true}).setInputFiles({name:'synthetic.jpg',mimeType:'image/jpeg',buffer:portrait});
 const photoStart=calls.length;
 await arabicPrivate.getByRole('button',{name:'حفظ الصورة',exact:true}).click();
 await arabicPrivate.getByRole('button',{name:'تحقّق من حفظ الملف الأصلي',exact:true}).click();
 const rendered=arabicPrivate.getByRole('img',{name:'صورة الملف الحالية',exact:true});
 await expect(rendered).toBeVisible();
 await expect.poll(()=>rendered.evaluate(el=>el.naturalWidth)).toBe(32);
 const photoWrites=calls.slice(photoStart).filter(c=>c.action==='savePrivatePhoto');
 assert.equal(photoWrites.length,1);
 assert.equal(calls.slice(photoStart).find(c=>c.action==='reconcile').op,photoWrites[0].op);
 await arabicPrivate.getByRole('button',{name:'إزالة الصورة',exact:true}).click();
 await expect(arabicPrivate.getByLabel('اختر صورة',{exact:true})).toBeEnabled();
 await expect(rendered).toHaveCount(0);
 await arabicPrivate.getByRole('button',{name:'إغلاق البيانات الخاصة'}).click();
 await page.setViewportSize({width:1440,height:1000});
 await expect(arabicPrivate.getByText('مخفي',{exact:true})).toBeVisible();
 const denyReveal=async route=>{
  const body=route.request().postDataJSON();
  if(body.action!=='privateProfile'||!body.revealId)return route.fallback();
  calls.push(body);
  await route.fulfill({status:403,json:{error:'denied'}});
 };
 await page.route('**/api/people',denyReveal);
 await arabicPrivate.getByRole('button',{name:'إظهار الرقم القومي'}).click();
 await expect(arabicPrivate).toHaveCount(0);
 await expect(page.getByText('Updated Fixture School',{exact:true})).toHaveCount(0);
 await page.unroute('**/api/people',denyReveal);
 const correctionStart=calls.length;
 const correctedDisplay='Name Correction Match';
 players.push({id:'00000000-0000-4000-8000-000000000008',display_name:correctedDisplay,branch_name:'Main Demo Branch'});
 await page.goto(url+'/private');
 await page.getByRole('button',{name:displayName,exact:true}).click();
 const corrected=page.getByRole('button',{name:'Correct player names',exact:true});
 await corrected.click();
 const editor=page.getByRole('region',{name:'Correct player names',exact:true});
 await editor.getByLabel('Display name',{exact:true}).fill(correctedDisplay);
 await editor.getByLabel('Alternate full name (optional)',{exact:true}).fill('اسم مصحح تجريبي');
 await editor.getByRole('button',{name:'Review matching players'}).click();
 const saveNames=editor.getByRole('button',{name:'Save name correction'});
 await expect(saveNames).toBeDisabled();
 await editor.getByRole('checkbox',{name:/reviewed the matches/}).check();
 await saveNames.click();
 await expect(editor.getByRole('button',{name:'Check original name correction'})).toBeVisible();
 const [originalCorrection]=calls.slice(correctionStart).filter(c=>c.action==='correctNames');
 assert.equal(originalCorrection.player,savedPlayer);
 assert.equal(originalCorrection.version,1);
 assert.equal(originalCorrection.different,true);
 await Promise.all([
  page.waitForEvent('dialog').then(async dialog=>{
   assert.equal(dialog.type(),'beforeunload');
   await dialog.accept();
  }),
  page.reload(),
 ]);
 await page.getByRole('button',{name:correctedDisplay,exact:true}).nth(1).click();
 await expect(editor.getByRole('button',{name:'Check original name correction'})).toBeVisible();
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 const arabicNames=page.getByRole('region',{name:'تعديل أسماء اللاعب',exact:true});
 profileFails=true;
 await arabicNames.getByRole('button',{name:'تحقّق من تعديل الأسماء الأصلي'}).click();
 await expect(arabicNames.getByText('حُفظت أسماء اللاعب.',{exact:true})).toBeVisible();
 await expect(arabicNames.getByRole('alert')).toContainText('تعذّر تحميل الأسماء المحفوظة');
 profileFails=false;
 await arabicNames.getByRole('button',{name:'أعد تحميل الأسماء المحفوظة'}).click();
 await expect(arabicNames.getByRole('button',{name:'أعد تحميل الأسماء المحفوظة'})).toHaveCount(0);
 await expect(page.getByText('اسم مصحح تجريبي',{exact:true})).toBeVisible();
 await expect(page.getByText('731',{exact:true})).toBeVisible();
 const nameCalls=calls.slice(correctionStart);
 assert.equal(nameCalls.filter(c=>c.action==='correctNames').length,1);
 assert.deepEqual(nameCalls.filter(c=>c.action==='reconcile').map(c=>c.op),[originalCorrection.op]);
 assert.deepEqual(nameCalls.slice(-3).map(c=>c.action),['reconcile','profile','profile']);
 await page.getByRole('button',{name:'العودة للاعبين',exact:true}).click();
 await expect(page.getByRole('button',{name:correctedDisplay,exact:true})).toHaveCount(2);
 await page.getByRole('link',{name:'English',exact:true}).click();
 await page.goto(url+'/private?lifecycle=1');
 await page.getByRole('button',{name:correctedDisplay,exact:true}).nth(1).click();
 const dateOfBirth=page.getByLabel('Date of birth',{exact:true});
 await dateOfBirth.fill('2014-02-01');
 await page.getByLabel('Primary contact phone',{exact:true}).fill('+20 100 000 0000');
 await page.getByLabel('Emergency contact name',{exact:true}).fill('Fixture contact');
 const saveDetails=page.getByRole('button',{name:'Save private details',exact:true});
 await expect(saveDetails).toBeDisabled();
 await page.getByLabel('Emergency contact phone',{exact:true}).fill('+20 100 000 0001');
 await saveDetails.click();
 await page.getByRole('button',{name:'Check original profile save'}).click();
 await expect(dateOfBirth).toHaveValue('2014-02-01');
 await page.getByRole('tab',{name:'Actions',exact:true}).click();
 const status=page.getByRole('region',{name:'Player status',exact:true});
 await status.getByRole('button',{name:'Archive player',exact:true}).click();
 await status.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect(status.getByRole('alert')).toContainText('roster commitments');
 rosterCommitment=false;
 await status.getByRole('button',{name:'Archive player',exact:true}).click();
 await status.getByRole('button',{name:'Confirm',exact:true}).click();
 await expect(status.getByRole('button',{name:'Check original player change'})).toBeVisible();
 const originalArchive=calls.findLast(request=>request.action==='setArchived').op;
 await Promise.all([
  page.waitForEvent('dialog').then(async dialog=>{assert.equal(dialog.type(),'beforeunload');await dialog.accept();}),
  page.reload(),
 ]);
 await status.getByRole('button',{name:'Check original player change'}).click();
 await expect(status.getByRole('status')).toHaveText('Player archived.');
 assert.equal(calls.findLast(request=>request.action==='reconcile').op,originalArchive);
 await page.getByRole('button',{name:'Back to players',exact:true}).click();
 await expect(page.getByRole('button',{name:correctedDisplay,exact:true})).toHaveCount(1);
 await page.getByRole('button',{name:'Archived players',exact:true}).click();
 await page.getByRole('button',{name:correctedDisplay,exact:true}).click();
 await page.getByRole('link',{name:'العربية',exact:true}).click();
 await page.getByRole('tab',{name:'الإجراءات',exact:true}).click();
 const arabicStatus=page.getByRole('region',{name:'حالة اللاعب',exact:true});
 await arabicStatus.getByRole('button',{name:'استعادة اللاعب',exact:true}).click();
 await arabicStatus.getByRole('button',{name:'تأكيد',exact:true}).click();
 await expect(arabicStatus.getByRole('status')).toHaveText('تمت استعادة اللاعب.');
 await page.getByRole('button',{name:'العودة للاعبين',exact:true}).click();
 await expect(page.getByText('لا يوجد لاعبون مؤرشفون.',{exact:true})).toBeVisible();
 await page.getByRole('link',{name:'English',exact:true}).click();
 await freshForm(displayName);
 await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Confirm player registration',exact:true})).toBeVisible();
 await expect(page.getByRole('heading',{name:'Review possible duplicates',exact:true})).toHaveCount(0);
 await page.clock.install();
 const beforeAuthCalls=calls.length;
 await Promise.all([
  page.waitForEvent('dialog').then(async dialog=>{
   assert.equal(dialog.type(),'beforeunload');
   await dialog.accept();
  }),
  page.goto(url+'/?authPending'),
 ]);
 await page.getByRole('status').waitFor();await page.clock.fastForward(16000);await visible('Could not load sign-in');await expect(page.getByRole('button',{name:'Retry loading page',exact:true})).toBeVisible();assert.equal(calls.length,beforeAuthCalls);
 assert.deepEqual(errors,[]);await writeFile(resolve(evidence,'ui-receipt.json'),JSON.stringify({reactMode,directoryResumeReads,profileResumeReads,reviewResumeReads,cases:['Extended private fields and paired contact, blocked archive, exact archive recovery after reload, archived lookup and Arabic restore','EN review and AR same-original name correction recovery after reload, confirmed read failure, and read-only retry','EN/AR alternate name saved once, profiled and found by both names','API401 distinct from denial;EN/AR mask and one profile retry','same-account draft fields survive API401 without a create','unknown original survives401 and reconciles the same ID without a second create','held checked directory/profile stay mounted for1read;initial/denial and original guards retained','single EN/AR confirmed-write/read-failure message with1read retry','18-player scoped directory and filtered-empty recovery','central duplicate comparison at3203907681440','duplicate distinction','existing profile no create','stale duplicate review','pending submission disabled','lost-response reconciliation','old cancellation notice cleared for later intent','actor switch clears state','revoked profile cleared','EN/AR draft preservation','320/360px no overflow','dirty return retains draft and clears review','confirmed write/read failure retries read without create','XSS-shaped name is literal text','short search explains minimum; debounce fetches valid query','auth initialization timeout offers retry with zero private calls'],creates,errors,scope:'Actual React component; synthetic session and HTTP responses. Database tested separately.'},null,2)+'\n');
 console.log(JSON.stringify({peopleUi:'passed',reactMode,creates:priorCreates,errors,scopedRequests:priorRequests,directoryReturn,changedQuery}));
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
