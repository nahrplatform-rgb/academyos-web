// Actual DatePlanningWorkspace; controlled HTTP acknowledgements and reads.
// This proves client behavior, not canonical SQL effects or hosted permissions.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export async function checkPlanningSaveFollowup({browser,origin,evidence,academy,program}) {
 const results=[];
 for(const locale of ['en','ar']) for(const outcome of ['success','read_failure','lost_reply']) {
  const ar=locale==='ar',t=(en,arText)=>ar?arText:en;
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:900}}),page=await context.newPage();
  const calls=[],errors=[],documents=[],operations=new Map();
  const initialVersion=7,scheduleVersion=3;
  let record={context:{academy_name:'Synthetic save continuity academy',branch_name:'Synthetic branch',branch_id:academy},
   program,name:'Synthetic dated plan',day:'2026-11-01',start:'17:00',end:'18:00',timezone:'Africa/Cairo',
   version:initialVersion,schedule_version:scheduleVersion,capacity:18,trainer:null,count:0,players:[],more:false};
  let releaseSave,releaseRead,saveEntered=false,readEntered=false,writes=0,following=false,failRead=outcome!=='success';
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r);
  const key=`academyos:planning:user_A:${academy}:${program}:2026-11-01`;
  const button=(en,arText)=>page.getByRole('button',{name:t(en,arText),exact:true});
  const notice=()=>page.getByRole('status').filter({hasText:t('Draft plan saved. It remains private to the Owner.','حُفظت خطة المسودة. تبقى خاصة بالمالك.')});
  const pending=()=>page.evaluate(k=>sessionStorage.getItem(k),key);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
  await page.route('**/api/planning',async route=>{
   const body=route.request().postDataJSON();calls.push(body);
   if(body.action!=='reconcile'){assert.equal(body.program,program);assert.equal(body.day,'2026-11-01');}
   if(body.action==='read'){
    if(following){following=false;readEntered=true;await readGate;if(failRead){failRead=false;await route.fulfill({status:503,json:{error:'unavailable'}});return;}}
    await route.fulfill({json:{data:record}});return;
   }
   if(body.action==='review'){
    assert.equal(body.version,initialVersion);assert.equal(body.schedule_version,scheduleVersion);assert.equal(body.capacity,23);
    await route.fulfill({json:{data:{reviewed:true,version:record.version,count:0}}});return;
   }
   if(body.action==='save'){
    assert.equal(body.version,initialVersion);assert.equal(body.schedule_version,scheduleVersion);
    assert.match(body.op,/^[0-9a-f-]{36}$/);assert.equal(operations.size,0,'no replacement save');
    saveEntered=true;await saveGate;
    writes++;record={...record,capacity:body.capacity,version:record.version+1};
    const receipt={program,day:record.day,version:record.version};operations.set(body.op,receipt);
    if(outcome==='lost_reply'){await route.abort('failed');return;}
    following=true;await route.fulfill({json:{data:receipt}});return;
   }
   if(body.action==='reconcile'){
    assert.equal(operations.size,1);assert.ok(operations.has(body.op),'reconcile the same original');
    following=true;await route.fulfill({json:{data:operations.get(body.op)}});return;
   }
   throw new Error('Unexpected planning action '+body.action);
  });
  try{
   await page.goto(`${origin}/?return=calendar&locale=${locale}`);
   await expect(button('Plan this date','تخطيط هذا التاريخ')).toBeEnabled();
   assert.deepEqual(calls.map(x=>x.action),['read'],'task has no hidden directory read');
   await button('Plan this date','تخطيط هذا التاريخ').click();
   const capacity=page.getByLabel(t('Capacity for this date','سعة هذا التاريخ'),{exact:true});
   await capacity.fill('23');await button('Review changes','مراجعة التغييرات').click();
   await page.getByRole('checkbox',{name:t('I reviewed this date and these changes.','راجعت هذا التاريخ وهذه التغييرات.'),exact:true}).check();
   const start=calls.length,saveButton=button('Save draft plan','حفظ خطة المسودة');
   await saveButton.focus();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);
   await expect(saveButton).toBeDisabled();await expect(notice()).toHaveCount(0);assert.equal(writes,0);
   await expect(page.locator('.workspace-task-body')).toContainText(t('New capacity:','السعة الجديدة:')+' 23');
   const original=await pending();assert.match(original,/^[0-9a-f-]{36}$/);
   await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
   assert.deepEqual(calls.slice(start).map(x=>x.action),['save'],'held write suppresses resume reads');
   releaseSave();
   if(outcome==='lost_reply'){
    await expect(button('Check original operation','التحقق من العملية الأصلية')).toBeVisible();
    assert.equal(await pending(),original);await expect(notice()).toHaveCount(0);assert.equal(writes,1);
    await page.reload();await expect(button('Check original operation','التحقق من العملية الأصلية')).toBeVisible();
    assert.deepEqual(calls.slice(start).map(x=>x.action),['save'],'reload does not guess a replacement or bootstrap over unknown');
    await button('Check original operation','التحقق من العملية الأصلية').click();
   }
   await expect.poll(()=>readEntered).toBe(true);await expect(notice()).toBeVisible();assert.equal(await pending(),null);
   await expect(button('Check original operation','التحقق من العملية الأصلية')).toHaveCount(0);
   await expect(button('Save draft plan','حفظ خطة المسودة')).toHaveCount(0);
   const load=button('Load saved plan','تحميل الخطة المحفوظة');await expect(load).toBeDisabled();
   const beforeSignals=calls.length;
   await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
   assert.equal(calls.length,beforeSignals,'held follow-up owns the only current read');
   await page.screenshot({path:join(evidence,`save-followup-${locale}-${outcome}-pending.png`),fullPage:true});
   releaseRead();
   if(outcome!=='success'){
    await expect(load).toBeEnabled();await expect(notice()).toBeVisible();await expect(page.getByRole('alert')).toBeVisible();
    await expect(button('Check original operation','التحقق من العملية الأصلية')).toHaveCount(0);
    await load.focus();await page.keyboard.press('Enter');
   }
   await expect(button('Plan this date','تخطيط هذا التاريخ')).toBeEnabled();await expect(notice()).toBeVisible();
   await expect(page.locator('.workspace-task-body')).toContainText('23');
   assert.equal(writes,1);assert.equal(record.version,8);assert.equal(record.schedule_version,3);
   const expected=outcome==='success'?['save','read']:outcome==='read_failure'?['save','read','read']:['save','reconcile','read','read'];
   assert.deepEqual(calls.slice(start).map(x=>x.action),expected);
   assert.equal(await pending(),null);assert.equal(documents.length,outcome==='lost_reply'?2:1);assert.deepEqual(errors,[]);
   // Reopening the editor proves the committed version, not merely a success label.
   await button('Plan this date','تخطيط هذا التاريخ').click();await expect(capacity).toHaveValue('23');
   results.push({locale,outcome,actions:expected,writes,reviewedVersion:7,savedVersion:8,scheduleVersion:3,
    confirmedBeforeRead:true,originalReconciled:outcome==='lost_reply',retryReadOnly:outcome!=='success',
    keyboardSave:true,documents:documents.length,pageErrors:errors});
  }catch(error){
   await writeFile(join(evidence,`save-followup-${locale}-${outcome}-failure.json`),JSON.stringify({error:String(error),calls,errors,focus:await page.locator(':focus').evaluateAll(xs=>xs.map(x=>({tag:x.tagName,text:x.textContent})))},null,2));
   await page.screenshot({path:join(evidence,`save-followup-${locale}-${outcome}-failure.png`),fullPage:true});throw error;
  }finally{releaseSave();releaseRead();await context.close();}
 }
 return results;
}
