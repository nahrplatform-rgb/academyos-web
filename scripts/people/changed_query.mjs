import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {expect} from '@playwright/test';

// The real React component with fictional transport; not provider or database proof.
export async function checkChangedQuery({browser,url,evidence,reactMode,baseline=false}) {
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 const calls=[],pending=[],errors=[];
 const rows=['Alex Demo','Avery Demo','Morgan Demo'].map((display_name,i)=>({id:`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,display_name,branch_name:'Demo Branch'}));
 let holdQuery=null,denyQuery=null;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/people',async route=>{
  const body=route.request().postDataJSON();calls.push(body);
  assert.equal(body.action,'list');
  let status=body.query===denyQuery?403:200;
  let finish;
  if(body.query===holdQuery){
   holdQuery=null;
   const done=new Promise(resolve=>{finish=resolve;});
   status=await new Promise(release=>pending.push({body,release,done}));
  }
  try {
   if(status!==200)await route.fulfill({status,json:{error:'denied'}});
   else await route.fulfill({json:{data:{academy_name:'Synthetic A',branch_id:'00000000-0000-4000-8000-000000000002',branch_name:'Demo Branch',items:rows.filter(r=>r.display_name.toLowerCase().startsWith((body.query||'').toLowerCase())),more:false}}});
  } catch(e) { if(!/closed|disposed|abort|handled/i.test(String(e)))throw e; }
  finally {finish?.();}
 });
 const input=()=>page.locator('#player-search'), list=()=>page.locator('.people-directory tbody tr');
 const requests=()=>calls.filter(c=>c.action==='list');
 async function hold(query){holdQuery=query;const before=pending.length;await input().fill(query);await expect.poll(()=>pending.length).toBe(before+1);return pending.at(-1);}
 async function noOverflow(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
 await mkdir(evidence,{recursive:true});
 try {
  await page.goto(url);await expect(list()).toHaveCount(3);
  await list().first().evaluate(el=>el.dataset.queryProbe='original');
  const start=requests().length,first=await hold('Alex');
  const heldRows=await list().count();
  const observed={rows:heldRows,originalMounted:heldRows?await list().first().getAttribute('data-query-probe'):null,
   countVisible:await page.locator('.directory-page-summary:visible').count(),loadingVisible:await page.getByText('Loading players…',{exact:true}).isVisible(),
   clearEnabled:await page.getByRole('button',{name:'Clear search',exact:true}).isEnabled(),
   focus:await input().evaluate(el=>document.activeElement===el),requests:requests().slice(start).map(c=>({query:c.query,after:c.after??null}))};
  await page.screenshot({path:resolve(evidence,baseline?'changed-query-before-en.png':'changed-query-held-en.png'),fullPage:true});
  if(baseline){
   first.release(200);await first.done;await expect(list()).toHaveCount(1);
   const shortStart=requests().length;await input().fill('A');
   const shortLoading=await page.getByText('Loading players…',{exact:true}).isVisible();
   await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeEnabled();
   const result={baseline:true,reactMode,held:observed,short:{loadingVisible:shortLoading,countVisible:await page.locator('.directory-page-summary:visible').count(),requests:requests().length-shortStart},scope:'Actual React, synthetic held HTTP response'};
   await writeFile(resolve(evidence,'changed-query-before.json'),JSON.stringify(result,null,2)+'\n');return result;
  }
  assert.equal(observed.rows,3);assert.equal(observed.originalMounted,'original');assert.equal(observed.countVisible,0);assert.equal(observed.loadingVisible,false);assert.equal(observed.clearEnabled,true);assert.equal(observed.focus,true);
  await expect(page.getByRole('status').filter({hasText:'Updating results… Showing previous results.'})).toBeVisible();
  for(const button of await list().locator('button').all())await expect(button).toBeDisabled();
  assert.deepEqual(observed.requests,[{query:'Alex',after:null}]);
  await input().fill('Morgan');await expect(list()).toHaveCount(1);await expect(page.getByRole('button',{name:'Morgan Demo',exact:true})).toBeEnabled();
  first.release(403);await first.done;await expect(page.getByRole('button',{name:'Morgan Demo',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Access unavailable',exact:true})).toHaveCount(0);
  assert.deepEqual(requests().slice(start).map(c=>c.query),['Alex','Morgan']);
  const equivalentStart=requests().length;await input().fill('Ｍorgan　');
  await page.waitForTimeout(350);assert.equal(requests().length,equivalentStart);
  await expect(page.getByRole('button',{name:'Morgan Demo',exact:true})).toBeEnabled();
  const shortStart=requests().length;await input().fill('M');
  await expect(page.getByText('Enter at least two characters to search.',{exact:true})).toBeVisible();
  await expect(page.getByText('Loading players…',{exact:true})).toHaveCount(0);
  await expect(list()).toHaveCount(0);await expect(input()).toBeFocused();
  await expect(page.locator('.directory-page-summary')).toHaveCount(0);
  await page.waitForTimeout(600);assert.equal(requests().length,shortStart);
  await input().fill('Morgan');await expect.poll(()=>requests().length).toBe(shortStart+1);await expect(page.getByRole('button',{name:'Morgan Demo',exact:true})).toBeEnabled();
  await page.setViewportSize({width:360,height:800});await page.getByRole('link',{name:'العربية',exact:true}).click();
  const clearStart=requests().length,second=await hold('Avery');
  await expect(page.getByRole('status').filter({hasText:'جارٍ تحديث النتائج… تُعرض النتائج السابقة.'})).toBeVisible();
  await expect(input()).toBeFocused();await noOverflow();
  await page.screenshot({path:resolve(evidence,'changed-query-held-ar-360.png'),fullPage:true});
  await page.getByRole('button',{name:'مسح البحث',exact:true}).click();await expect(list()).toHaveCount(3);await expect(input()).toBeFocused();
  second.release(403);await second.done;await expect(list()).toHaveCount(3);
  const clearCalls=requests().slice(clearStart);assert.deepEqual(clearCalls.map(c=>c.query),['Avery','']);
  assert.ok(clearCalls[1].after==null,'clear requests the first page without a cursor');
  const deniedStart=requests().length;
  denyQuery='Avery';await input().fill('Avery');await expect(page.getByRole('heading',{name:'الصلاحية غير متاحة',exact:true})).toBeVisible();await expect(list()).toHaveCount(0);
  assert.deepEqual(requests().slice(deniedStart).map(c=>c.query),['Avery']);
  assert.deepEqual(errors,[]);
  const result={baseline:false,reactMode,held:observed,short:{loadingVisible:false,countVisible:0,requests:0},clear:clearCalls.map(c=>({query:c.query,after:c.after??null})),checks:['held checked rows remain mounted, disabled and scoped without count or full loading','obsolete refusal cannot replace newer query','equivalent normalized input sends no request','one-character guidance sends no request or false count','Arabic 360 clear cancels pending search and requests blank first page','current 403 masks private rows'],scope:'Actual React/Chromium with synthetic HTTP transport; not provider, database or hosted proof'};
  await writeFile(resolve(evidence,`changed-query-${reactMode}.json`),JSON.stringify(result,null,2)+'\n');return result;
 } finally {for(const item of pending)item.release(200);await context.close();}
}
