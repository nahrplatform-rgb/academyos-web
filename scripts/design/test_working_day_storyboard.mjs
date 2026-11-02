import {chromium, expect} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const root=resolve(import.meta.dirname,'../..');
const html=await readFile(resolve(root,'design/working-day-pilot/index.html'),'utf8');
const out=resolve(root,'docs/07-handoff/evidence/working-day-pilot-2026-11-02');
const server=createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(html)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch();
const page=await browser.newPage();const errors=[],external=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(!r.url().startsWith(origin))external.push(r.url())});
try {
 for(const locale of ['en','ar'])for(const width of [320,390,900,1440]){
  await page.setViewportSize({width,height:1000});await page.goto(origin);
  if(locale==='ar')await page.locator('#language').click();
  assert.equal(await page.locator('html').getAttribute('lang'),locale);
  for(const state of ['cold','warm','aged','offline','dirty','unknown','confirmed','denied','storage']){
   await page.locator('#scenario').selectOption(state);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${locale}/${width}/${state} overflow`);
   if(state==='dirty'){
    await page.locator('#draft-name').fill('Fictional name / اسم تجريبي');
    await page.locator('#actions button').first().click();
    await expect(page.locator('#draft-name')).toHaveValue('Fictional name / اسم تجريبي');
    await page.locator('#calendar').click();
    await expect(page.locator('#draft-name')).toHaveValue('Fictional name / اسم تجريبي');
   }
   if(state==='unknown'){
    await expect(page.locator('#actions button').last()).toBeDisabled();
    await page.locator('#actions button').first().click();
    await expect(page.locator('#actions button')).toHaveCount(1);
    await expect(page.locator('#actions button')).toBeDisabled();
   }
   if(state==='storage')await expect(page.locator('#actions button')).toBeDisabled();
   if(['cold','aged','offline','confirmed'].includes(state)){
    await page.locator('#actions button').first().click();
    if(state==='offline')await expect(page.locator('#scenario')).toHaveValue('cold');
    else await expect(page.locator('#actions button')).toHaveCount(0);
   }
   if(state==='denied')await expect(page.locator('#task')).toBeEmpty();
   checks.push(`${locale}/${width}/${state}`);
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(origin);
 await page.locator('#scenario').selectOption('warm');await mkdir(out,{recursive:true});
 await page.screenshot({path:resolve(out,'storyboard-en-desktop.png'),fullPage:true});
 await page.locator('#language').click();await page.setViewportSize({width:390,height:1000});
 await page.screenshot({path:resolve(out,'storyboard-ar-phone.png'),fullPage:true});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await writeFile(resolve(out,'storyboard-checks.json'),JSON.stringify({scope:'Fictional proposed-state storyboard only; not product/API/DB/hosted/security proof',htmlSha256:createHash('sha256').update(html).digest('hex'),checks,errors,external,operatingRequests:0,status:'passed'},null,2)+'\n');
 console.log(`PASS ${checks.length} fictional locale/viewport/state cases; no external requests`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
