// Actual People React component with synthetic identity and controlled transport.
// Run independently of the root Next build: node scripts/people/registration_focus.mjs
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..'),baseline=process.argv.includes('--baseline');
let component=await readFile(root+'/apps/web/src/components/people-workspace.tsx','utf8');
if(baseline){
 const effectStart=component.indexOf('    useEffect(() => {\n        const pending=directoryFocus.current;');
 const effectEnd=component.indexOf('    useEffect(() => { if (!',effectStart);
 assert.ok(effectStart>=0&&effectEnd>effectStart,'baseline patch locates the focus effect');
 component=component.slice(0,effectStart)+component.slice(effectEnd);
 const start=component.indexOf('    function reloadReturnedDirectory() {'),end=component.indexOf('    function closeProfile()',start);
 assert.ok(start>=0&&end>start,'baseline patch locates the return handler');
 component=component.slice(0,start)+`    function restoreDirectoryFocus(ticket=directoryTicket.current) {\n        requestAnimationFrame(() => {if(active.current&&ticket===directoryTicket.current)(profileOpeners.current.get(profileId)??searchInput.current)?.focus();});\n    }\n    function reloadReturnedDirectory() {\n        const read=loadDirectory(undefined,null,false,!localRows);const ticket=directoryTicket.current;void read.then(()=>restoreDirectoryFocus(ticket));\n    }\n`+component.slice(end);
 component=component.replace('else directoryFocus.current={ticket:directoryTicket.current,player:profileId};','else restoreDirectoryFocus();');
}
const bundle=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/people-workspace.tsx';createRoot(document.getElementById('root')).render(<React.StrictMode><Workspace locale="en" academy="00000000-0000-4000-8000-000000000001"/></React.StrictMode>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',plugins:[{name:'synthetic',setup(b){b.onLoad({filter:/people-workspace\.tsx$/},()=>({contents:component,loader:'tsx',resolveDir:root+'/apps/web/src/components'}));b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'test'}));b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='clerk'?`export function useUser(){return{isLoaded:true,user:{id:'synthetic'}}}export function UserButton(){return null}`:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));}}],define:{'process.env.NODE_ENV':JSON.stringify(process.env.UI_REACT_MODE==='development'?'development':'production')}});
const css=await readFile(root+'/apps/web/src/app/globals.css','utf8');
const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:`<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch(),context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const existing='00000000-0000-4000-8000-000000000010',created='00000000-0000-4000-8000-000000000011',name='Alex Demo',contact='new@example.invalid';
let rows=[{id:existing,display_name:name,branch_name:'Main',contact_email:'old@example.invalid'}],hold=false,release=null,calls=[];
await page.route('**/api/people',async route=>{const body=route.request().postDataJSON();calls.push(body);let data;
 if(body.action==='list'){if(hold)await new Promise(r=>{release=r;});data={academy_name:'Synthetic',branch_id:'00000000-0000-4000-8000-000000000002',branch_name:'Main',items:rows.filter(p=>p.display_name.toLowerCase().startsWith((body.query||'').toLowerCase())),more:false};}
 else if(body.action==='candidates')data={items:rows.filter(p=>p.display_name===body.name),revision:1,more:false};
 else if(body.action==='create'){rows.push({id:created,display_name:name,branch_name:'Main',contact_email:contact});data={player_id:created,version:1};}
 else if(body.action==='profile')data=rows.find(p=>p.id===body.player);
 else throw new Error(`Unexpected action ${body.action}`);
 await route.fulfill({json:{data}});
});
try{
 const url=`http://127.0.0.1:${server.address().port}`;
 const button=(label)=>page.getByRole('button',{name:label,exact:true});
 async function saveDuplicate(){
 rows=[{id:existing,display_name:name,branch_name:'Main',contact_email:'old@example.invalid'}];await page.goto(url);
 await expect(button('Register player')).toBeEnabled();
 await button('Register player').click();await page.getByLabel('Player display name (required)',{exact:true}).fill(name);await page.locator('#contact-email').fill(contact);
 await button('Continue to duplicate review').click();await page.getByRole('checkbox',{name:/different fictional person/}).check();await button('Review new registration').click();await button('Save registration').click();await expect(page.getByText(contact,{exact:true})).toBeVisible();
 }
 await saveDuplicate();
 hold=true;await button('Back to players').click();await expect.poll(()=>typeof release).toBe('function');
 // Deliver the animation callback as soon as it is requested, before React can
 // commit the async response. This models a frame preceding a delayed commit.
 await page.evaluate(()=>{window.focusSchedule=[];const original=window.requestAnimationFrame;window.requestAnimationFrame=callback=>{window.requestAnimationFrame=original;window.focusSchedule.push({rows:document.querySelectorAll('.people-directory tbody tr').length});queueMicrotask(()=>callback(performance.now()));return 1;};});
 hold=false;release();await expect(page.locator('.people-directory tbody tr')).toHaveCount(2);
 const buttons=page.locator('.people-directory tbody tr').getByRole('button',{name,exact:true});
 if(baseline){
  await expect(buttons.and(page.locator(':focus'))).toHaveCount(0);
  const schedule=await page.evaluate(()=>window.focusSchedule);assert.deepEqual(schedule,[{rows:1}]);
  await expect(page.locator('#player-search')).toBeFocused();
  console.log(JSON.stringify({baseline:true,frameBeforeCommit:schedule,focusedRegisteredPlayer:false}));
 }else{
 await expect(buttons.and(page.locator(':focus'))).toHaveCount(1);
 await page.keyboard.press('Enter');await expect(page.getByText(contact,{exact:true})).toBeVisible();
 assert.equal(calls.at(-1).player,created,'focused row is the newly registered player');
 const actions=calls.map(c=>c.action);
 await saveDuplicate();hold=true;release=null;await button('Back to players').click();await expect.poll(()=>typeof release).toBe('function');
 const search=page.locator('#player-search');await search.focus();hold=false;release();await expect(page.locator('.people-directory tbody tr')).toHaveCount(2);await expect(search).toBeFocused();
 await saveDuplicate();hold=true;release=null;await button('Back to players').click();await expect.poll(()=>typeof release).toBe('function');
 rows=rows.filter(p=>p.id!==created);hold=false;release();await expect(page.locator('.people-directory tbody tr')).toHaveCount(1);await expect(search).toBeFocused();
 await saveDuplicate();hold=true;release=null;await button('Back to players').click();await expect.poll(()=>typeof release).toBe('function');
 const oldRelease=release;hold=false;await search.fill('No match');await expect(page.getByText('No matching players. Try another name.',{exact:true})).toBeVisible();oldRelease();
 await expect(search).toBeFocused();await expect(page.locator('.people-directory tbody tr')).toHaveCount(0);
 console.log(JSON.stringify({focusSchedule:await page.evaluate(()=>window.focusSchedule),actions,focusedRegisteredPlayer:true,userFocusPreserved:true,missingPlayerFallsBackToSearch:true,changedSearchSupersedesReturn:true}));
 }
}finally{await context.close();await browser.close();await new Promise(r=>server.close(r));}
