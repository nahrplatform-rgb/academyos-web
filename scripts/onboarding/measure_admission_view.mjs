// Compare actual baseline/current React components with the same fictional read adapter.
// No product route, real identity, operating write, or hosted authorization is used.
import {build} from 'esbuild';
import {chromium, expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve, relative} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const baseline=process.argv[2], output=process.argv[3];
assert.match(baseline??'',/^[a-f0-9]{7,40}$/,'Supply a verified baseline commit and output path');
const source=async(path,ref)=>ref?execFileSync('git',['show',`${ref}:${path}`],{cwd:root,encoding:'utf8'}):readFile(resolve(root,path),'utf8');
const adapter=`import React from 'react';export function useUser(){return {isLoaded:true,isSignedIn:true,user:{id:'user_fixture'}}}export function UserButton(){return <button>Fixture account</button>}export function SignInButton({children}){return children}export function SignUpButton({children}){return children}`;
const results=[];
const browser=await chromium.launch();
try{
 for(const ref of [baseline,null]){
  const bundle=await build({stdin:{contents:`import React from 'react';import{createRoot}from'react-dom/client';import Workspace from '${root}/apps/web/src/components/onboarding-workspace.tsx';createRoot(document.getElementById('root')).render(<Workspace locale="en" mode="platform"/>);`,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'fictional-measurement',setup(b){
   b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fixture'}));
   b.onResolve({filter:/^next\/link$/},()=>({path:'link',namespace:'fixture'}));
   b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='clerk'?adapter:`import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}`,loader:'tsx',resolveDir:root}));
   b.onLoad({filter:/\/components\/(onboarding-workspace|admission-directory)\.tsx$/},async a=>({contents:await source(relative(root,a.path),ref),loader:'tsx',resolveDir:resolve(a.path,'..')}));
  }}]});
  const css=await source('apps/web/src/app/globals.css',ref);
  const server=createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/bundle.js'?'text/javascript':'text/html');res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="/bundle.js"></script></html>`)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  try{
   let reads=0,otherRequests=0;
   await page.route('**/api/onboarding',async route=>{
    const body=route.request().postDataJSON();
    if(body.action!=='platform'){otherRequests++;await route.fulfill({status:422,json:{error:'invalid'}});return;}
    reads++;
    await route.fulfill({json:{data:{items:['A','B'].map((label,n)=>({id:`00000000-0000-4000-8000-00000000000${n+1}`,name:`Synthetic Academy ${label}`,setup_complete:false,invitation_id:`00000000-0000-4000-8000-00000000001${n}`,generation:1,expires_at:'2026-11-08T12:00:00Z',revoked:false,redeemed_at:null,delivery:n?'unknown':'queued',attempts:0})),more:false}}});
   });
   await page.goto(`http://127.0.0.1:${server.address().port}/`);
   const row=page.getByRole('button',{name:'Synthetic Academy B — view details',exact:true});await row.waitFor();
   const initialReads=reads;
   const search=page.getByLabel('Search loaded academies',{exact:true});
   const supportsSearch=await search.count()===1;
   if(supportsSearch)await search.fill('Academy B');
   await row.click();await expect(page.locator('#admission-detail-heading')).toBeFocused();
   assert.equal(reads,initialReads,'Local selection/search is not retrieval');
   const rechecked=page.waitForResponse(r=>r.url().endsWith('/api/onboarding'));
   await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'));});
   await (await rechecked).finished();
   await page.getByRole('button',{name:'Synthetic Academy B — view details',exact:true}).waitFor();
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const selectedAfter=await page.locator('#admission-detail-heading').count()===1;
   const titlePx=await page.locator('h1').evaluate(el=>getComputedStyle(el).fontSize);
   const selectionFocus=await page.evaluate(()=>document.activeElement?.id==='admission-detail-heading');
   results.push({source:ref??'working-tree',bundleSha256:createHash('sha256').update(bundle.outputFiles[0].text).digest('hex'),initialReads,localInteractionReads:reads-initialReads-1,recheckReads:reads-initialReads,selectionRetained:selectedAfter,selectionHeadingFocused:selectionFocus,searchSupported:supportsSearch,searchRetained:supportsSearch?await search.inputValue()==='Academy B':null,titlePx,otherRequests});
   assert.equal(reads-initialReads,1);assert.equal(otherRequests,0);
  }finally{await page.close();await new Promise(r=>server.close(r));}
 }
 assert.equal(results[0].selectionRetained,false,'Baseline must reproduce the observed remount loss');
 assert.equal(results[1].selectionRetained,true);assert.equal(results[1].searchRetained,true);assert.equal(results[1].selectionHeadingFocused,true);
 const report={scope:'Same actual Platform components and fictional two-academy read; request/continuity counts, not service latency or hosted authority',browser:browser.version(),results};
 await writeFile(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(report));
}finally{await browser.close();}
