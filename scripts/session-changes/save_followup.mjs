// Actual SessionChangeWorkspace with held fictional HTTP. Database effects are tested separately.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkSessionChangeFollowup({browser,origin,out,baseline=false}){
 const cases=[],gaps=[],academy='00000000-0000-4000-8000-000000000001',program='00000000-0000-4000-8000-000000000002',head='00000000-0000-4000-8000-000000000003',player='00000000-0000-4000-8000-000000000004',day='2026-11-01';
 for(const locale of ['en','ar'])for(const kind of ['move','cancel'])for(const outcome of ['success','read_failure','lost_reply','denied_read']){
  const ar=locale==='ar',t=(en,a)=>ar?a:en;
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await context.newPage();
  const calls=[],errors=[],ops=new Map(),key=`session-change:user_A:${academy}:${program}:${day}`;
  let data={plan:{context:{academy_name:'Synthetic Academy',branch_name:'Main Demo Branch'},name:'Synthetic Program',program,day,scheduled_day:day,start:'17:00',end:'18:00',timezone:'Africa/Cairo',version:7,schedule_version:3,capacity:18,count:1,trainer:{id:head,name:'Casey Demo'},published:false,canceled:false,players:[{id:player,name:'Taylor Demo'}]},head,history:[],more:false};
  let saveEntered=false,readEntered=false,following=false,failed=false,writes=0,releaseSave,releaseRead;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r);
  const b=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true}),ins=page.locator(':is(.workspace-inspector,.workspace-detail-dialog,.workspace-task-body)');
  const original=()=>page.evaluate(k=>sessionStorage.getItem(k),key),retry=()=>b('Load current date','تحميل التاريخ الحالي'),unknown=()=>b('Check original operation','التحقق من العملية الأصلية');
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  const snapshot=()=>({original:day,date:data.plan.scheduled_day,start:data.plan.start,end:data.plan.end,canceled:data.plan.canceled,schedule_version:data.plan.schedule_version,plan_version:data.plan.version,head:data.head});
  const changed=before=>({...before,date:kind==='move'?'2026-11-03':day,start:kind==='move'?'18:00':'17:00',end:kind==='move'?'19:00':'18:00',canceled:kind==='cancel'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/session-changes',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,academy);
   const reply=data=>route.fulfill({json:{data}});
   if(body.action==='reconcile'){assert.ok(ops.has(body.op));following=true;return reply(ops.get(body.op));}
   assert.equal(body.program,program);assert.equal(body.day,day);
   if(body.action==='read'){
    if(following){readEntered=true;await readGate;following=false;
     if(outcome!=='success'&&!failed){failed=true;return route.fulfill({status:outcome==='denied_read'?403:503,json:{error:outcome==='denied_read'?'denied':'unavailable'}});}
    }return reply(data);
   }
   assert.equal(body.kind,kind);assert.equal(body.version,7);assert.equal(body.schedule_version,3);assert.equal(body.head,head);assert.equal(body.reason,'Synthetic exact reason');
   assert.equal(body.date,kind==='move'?'2026-11-03':null);assert.equal(body.start,kind==='move'?'18:00':null);assert.equal(body.end,kind==='move'?'19:00':null);
   const before=snapshot(),after=changed(before);
   if(body.action==='review')return reply({reviewed:true,before,after,reason:body.reason});
   assert.equal(body.action,'save');assert.equal(ops.size,0);saveEntered=true;await saveGate;
   writes++;data={...data,plan:{...data.plan,scheduled_day:after.date,start:after.start,end:after.end,canceled:after.canceled,version:8,schedule_version:4},head:body.op,history:[{id:body.op,kind,reason:body.reason,before_state:before,after_state:{...after,schedule_version:4,plan_version:8,head:body.op},created_at:'2026-10-28T12:00:00Z'}]};
   ops.set(body.op,{changed:true});if(outcome==='lost_reply')return route.abort('failed');following=true;return reply({changed:true});
  });
  try{
   await page.goto(`${origin}/?locale=${locale}`);const startControl=kind==='move'?b('Move this date','نقل هذا التاريخ'):b('Cancel this date','إلغاء هذا التاريخ');await startControl.click();
   if(kind==='move'){await page.getByLabel(t('New date','التاريخ الجديد'),{exact:true}).fill('2026-11-03');await page.getByLabel(t('Start time','وقت البداية'),{exact:true}).fill('18:00');await page.getByLabel(t('End time — same day','وقت النهاية — اليوم نفسه'),{exact:true}).fill('19:00');}
   await page.getByLabel(t('Reason','السبب'),{exact:true}).fill('Synthetic exact reason');await b('Review change','مراجعة التغيير').click();await expect(ins).toContainText('Casey Demo');await expect(ins).toContainText('Taylor Demo');await expect(ins).toContainText('18');
   await page.getByRole('checkbox').check();assert.deepEqual(calls.map(c=>c.action),['read','review']);
   const confirm=kind==='move'?b('Confirm move','تأكيد النقل'):b('Confirm cancellation','تأكيد الإلغاء');
   const start=calls.length;await confirm.focus();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);await expect(confirm).toBeDisabled();assert.equal(writes,0);
   const op=await original();assert.match(op,/^[a-f0-9-]{36}$/);assert.equal(await page.getByText(t('Change saved. Current state and history follow.','حُفظ التغيير. الحالة الحالية والسجل أدناه.'),{exact:true}).count(),0);
   await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),['save']);releaseSave();
   if(outcome==='lost_reply'){
    await expect(unknown()).toBeEnabled();assert.equal(await original(),op);page.once('dialog',d=>d.accept());await page.reload();await expect(unknown()).toBeEnabled();assert.equal(await original(),op);
    // Existing bootstrap makes one current scoped read; it cannot settle or replace the original.
    assert.deepEqual(calls.slice(start).map(c=>c.action),['save','read']);await unknown().focus();await page.keyboard.press('Enter');
   }
   await expect.poll(()=>readEntered).toBe(true);await expect(unknown()).toHaveCount(0);assert.equal(await original(),null);assert.equal(writes,1);
   await expect(ins.getByRole('status').filter({hasText:t('Change','التغيير')})).toBeVisible();await expect(page.getByRole('alert')).toHaveCount(0);
   const heldCalls=calls.length;await signals();assert.equal(calls.length,heldCalls);await expect(retry()).toBeDisabled();
   releaseRead();
   let conflictingFailure=false;
   if(outcome==='denied_read'){
    await expect(page.getByRole('alert').first()).toBeVisible();await expect(page.getByText('Casey Demo',{exact:true})).toHaveCount(0);await expect(page.getByText('Taylor Demo',{exact:true})).toHaveCount(0);await expect(ins).not.toContainText('Synthetic exact reason');await expect(unknown()).toHaveCount(0);await expect(retry()).toHaveCount(0);
   }else{
    if(outcome!=='success'){
     await expect(retry()).toBeEnabled();await expect(confirm).toHaveCount(0);
     conflictingFailure=await page.getByRole('alert').filter({hasText:t('No success is assumed.','لا يُفترض نجاح العملية.')}).count()>0;
     if(conflictingFailure)gaps.push({locale,kind,outcome,phase:'confirmed-read-failure',gap:'confirmed-save-beside-no-success-assumed'});
     if(!baseline)await expect(ins.getByRole('status').filter({hasText:t('Change confirmed; the current read failed. Load the current date, not save again.','تأكد التغيير؛ فشلت القراءة الحالية. حمّل التاريخ الحالي ولا تحفظ مجدداً.')})).toBeVisible();
     if(outcome==='lost_reply')await page.screenshot({path:join(out,`session-change-${locale}-${kind}-confirmed-read-failed.png`),fullPage:true});
     await retry().focus();await page.keyboard.press('Enter');
    }
    await expect(ins).toContainText(kind==='move'?t('Moved','نُقل'):t('Canceled','أُلغي'));await expect(ins).toContainText('Synthetic exact reason');await expect(page.locator('main')).toContainText('Casey Demo');await expect(page.getByRole('alert')).toHaveCount(0);
    assert.equal(data.plan.day,day);assert.equal(data.plan.scheduled_day,kind==='move'?'2026-11-03':day);assert.equal(data.plan.version,8);assert.equal(data.plan.schedule_version,4);assert.equal(data.plan.capacity,18);assert.equal(data.plan.players[0].id,player);assert.equal(data.history.length,1);
    if(kind==='cancel')await expect(b('Move this date','نقل هذا التاريخ')).toBeDisabled();
   }
   const expected=outcome==='lost_reply'?['save','read','reconcile','read','read']:outcome==='read_failure'?['save','read','read']:['save','read'];assert.deepEqual(calls.slice(start).map(c=>c.action),expected);assert.equal(writes,1);assert.equal(ops.size,1);assert.equal(await original(),null);assert.deepEqual(errors,[]);
   cases.push({locale,kind,outcome,original:op,reviewedPlanVersion:7,reviewedScheduleVersion:3,resultPlanVersion:8,resultScheduleVersion:4,actions:expected,writes,conflictingFailure,errors});
  }catch(e){await writeFile(join(out,`session-change-${locale}-${kind}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await context.close();}
 }
 if(!baseline)assert.deepEqual(gaps,[]);
 return {baseline,cases,gaps,scope:'Actual product React; fictional Owner/HTTP, not routed return, live identity or database atomicity proof.'};
}
