// Actual running local frontend. Public/locale checks do not establish login or DB proof.
import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';

const origin=new URL(process.env.LOCAL_PREVIEW_URL??'http://localhost:3000');
assert.ok(['http://localhost:3000','http://localhost:3100'].includes(origin.origin),'Use the canonical localhost development or production origin.');
const out=resolve(process.env.UI_EVIDENCE_DIR??'test-results/local-workflow/public');await mkdir(out,{recursive:true});
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1440,height:1000},recordVideo:{dir:resolve(out,'video')}});
await context.tracing.start({screenshots:true,snapshots:true,sources:false});
const page=await context.newPage(),errors=[],requests=[],results=[],screenshots=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(new URL(r.url()).origin===origin.origin)requests.push({method:r.method(),path:new URL(r.url()).pathname,type:r.resourceType()});});
let failure,traceSaved=false,videoPath=null,fence;
try{
  for(const locale of ['en','ar']){
    const started=Date.now(),response=await page.goto(new URL('/'+locale,origin).href);
    assert.equal(response?.status(),200);
    assert.equal(new URL(page.url()).origin,origin.origin,'The public entry must remain on the selected local origin.');
    assert.ok(['/'+locale,'/'+locale+'/'].includes(new URL(page.url()).pathname));
    // The real product declares language/direction on its workspace boundary;
    // the existing shared document root defaults to English.
    const workspace=page.locator('.app-scene');
    await expect(workspace).toBeVisible();await expect(workspace).toHaveAttribute('lang',locale);
    await expect(workspace).toHaveAttribute('dir',locale==='ar'?'rtl':'ltr');
    await expect(page.getByRole('heading',{level:1})).toHaveText(locale==='ar'?'أكاديميتك، في مكان واحد.':'Your academy, connected.');
    const file='public-'+locale+'.png';await page.screenshot({path:resolve(out,file),fullPage:true});screenshots.push(file);
    results.push({locale,status:response.status(),elapsedMs:Date.now()-started,
      workspaceLanguage:await workspace.getAttribute('lang'),documentLanguage:await page.locator('html').getAttribute('lang')});
  }
  await page.setViewportSize({width:390,height:844});await page.reload();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'Local public phone entry must not overflow horizontally.');
  await page.screenshot({path:resolve(out,'public-ar-phone.png'),fullPage:true});screenshots.push('public-ar-phone.png');
  const response=await page.request.get(new URL('/en/workspace',origin).href,{maxRedirects:0});
  fence={status:response.status()};
  assert.ok([302,303,307,401,403,503].includes(fence.status),'A new anonymous browser must not open the protected workspace.');
  if(fence.status===503){
    assert.equal(await response.text(),'Authentication is not configured');fence.kind='unconfigured authentication remains closed';
  }else fence.kind='anonymous access redirected or refused; signed-in flow not tested';
  // A public HTML page and Clerk redirect can succeed even when normalized
  // loopback hosts make every operating POST fail its same-origin check.
  const api=new URL('/api/onboarding',origin).href;
  const current=await page.request.post(api,{headers:{origin:origin.origin},data:{action:'context'}});
  fence.api={sameOriginStatus:current.status(),wrongOrigins:[]};
  if(fence.status===503)assert.equal(current.status(),503,'An unconfigured API stays unavailable.');
  else{
    assert.equal(current.status(),401,'The canonical anonymous POST must reach authentication, not fail the Origin boundary.');
    assert.match(current.headers()['server-timing']??'',/session;dur=/);
  }
  const other=origin.port==='3000'?'http://localhost:3100':'http://localhost:3000';
  for(const invalid of ['https://untrusted.invalid',other]){
    const denied=await page.request.post(api,{headers:{origin:invalid},data:{action:'context'}});
    assert.equal(denied.status(),403,'Untrusted or other-port origins remain refused.');
    assert.deepEqual(await denied.json(),{error:'denied'});
    fence.api.wrongOrigins.push({origin:invalid,status:denied.status()});
  }
  assert.deepEqual(errors,[]);
}catch(error){failure=error;}
try{await context.tracing.stop({path:resolve(out,'trace.zip')});traceSaved=true;}catch(error){failure??=error;}
const video=page.video();
try{await context.close();await browser.close();if(video)videoPath=await video.path();}catch(error){failure??=error;}
if(!failure&&videoPath){try{await unlink(videoPath);videoPath=null;}catch(error){failure=error;}}
await writeFile(resolve(out,'receipt.json'),JSON.stringify({status:failure?'failed':'passed',runtime:process.version,
  scope:'Actual running public EN/AR workspace boundary, desktop/phone, anonymous canonical POST reaches auth and wrong-origin refusal; no signed-in API/database/offline/hosted/Owner proof.',
  results,errors,requests,fence,...(failure?{error:String(failure)}:{}),
  capture:{trace:traceSaved?'trace.zip':null,video:videoPath?safeRelative(videoPath):null,screenshots}},null,2)+'\n',{mode:0o600});
if(failure)throw failure;
console.log('PASS local EN/AR public entry, phone layout, canonical anonymous API auth and strict wrong-origin refusal; trace/screenshots saved.');
function safeRelative(path){return path.startsWith(out+'/')?path.slice(out.length+1):'recorded-video-outside-evidence-root';}
