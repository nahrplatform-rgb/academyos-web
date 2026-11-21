// Actual Attendance component with fictional HTTP; SQL/hosted proof stays separate.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkAttendanceFollowup({browser,origin,out,baseline=false}){
 const cases=[],gaps=[],id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 for(const locale of ['en','ar'])for(const command of ['register','mark'])for(const outcome of ['success','read503','lost','denied']){
  const ar=locale==='ar',t=(en,a)=>ar?a:en,ctx=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await ctx.newPage();
  const calls=[],errors=[],ops=new Map();let writes=0,following=false,failed=false,saveEntered=false,readEntered=false,releaseSave,releaseRead;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r),key=`attendance:user_A:${id(1)}:${id(2)}`;
  let data={event:id(2),program:id(3),day:'2026-11-01',scheduled_day:'2026-11-01',starts_at:'2026-11-01T17:00:00Z',ends_at:'2026-11-01T18:00:00Z',closes_at:'2026-11-02T18:00:00Z',server_now:'2026-11-01T17:15:00Z',projection:{name:'Synthetic Program',branch:'Main Demo Branch',timezone:'Africa/Cairo'},owner:command==='mark',open:true,count:2,saved:command==='mark'?1:0,players:[{id:id(4),name:'Alex Demo',status:command==='mark'?'present':null,version:command==='mark'?7:0},{id:id(5),name:'Sam Demo',status:null,version:0}],more:false,protected:command==='mark'};
  const button=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true}),unknown=()=>button('Check original save','التحقق من الحفظ الأصلي');
  const stored=()=>page.evaluate(k=>sessionStorage.getItem(k),key),signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));document.dispatchEvent(new Event('visibilitychange'));});
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/api/attendance',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,id(1));assert.equal(body.event,id(2));const reply=data=>route.fulfill({json:{data}});
   if(body.action==='roster'){
    if(following){readEntered=true;await readGate;if(!failed&&outcome!=='success'){failed=true;following=false;return route.fulfill({status:outcome==='denied'?403:503,json:{error:outcome==='denied'?'denied':'unavailable'}});}}
    return reply(data);
   }
   if(body.action==='reconcile'){assert.ok(ops.has(body.op));following=true;return reply(ops.get(body.op));}
   assert.equal(body.action,command);assert.equal(writes,0);assert.ok(Number.isFinite(Date.parse(body.captured_at)));
   if(command==='register')assert.deepEqual(body.marks,[{player:id(4),status:'present',version:0},{player:id(5),status:'absent',version:0}]);
   else{assert.equal(body.player,id(4));assert.equal(body.status,'absent');assert.equal(body.version,7);assert.equal(body.reason,'Synthetic correction');}
   saveEntered=true;await saveGate;writes++;data={...data,saved:command==='register'?2:1,protected:true,players:data.players.map((p,i)=>command==='mark'&&i===1?p:{...p,status:command==='mark'||i===1?'absent':'present',version:p.version+1})};
   const result=command==='register'?{kind:'register',event:id(2),op:body.op,count:2}:{event:id(2),player:id(4),status:'absent',version:8};ops.set(body.op,result);if(outcome==='lost')return route.abort();following=true;return reply(result);
  });
  try{
   await page.goto(`${origin}/?locale=${locale}`);await expect(button('Alex Demo','Alex Demo')).toBeVisible();
   if(command==='register'){
    for(const [name,en,a]of [['Alex Demo','Present','حاضر'],['Sam Demo','Absent','غائب']])await page.getByRole('group',{name,exact:true}).getByRole('button',{name:t(en,a),exact:true}).click();
    await button('Review register','مراجعة الحضور').click();
   }else{
    await button('Alex Demo','Alex Demo').click();await button('Correct saved mark','تصحيح التسجيل المحفوظ').click();await page.getByLabel(t('Reason for correction','سبب التصحيح'),{exact:true}).fill('Synthetic correction');await page.locator('form').getByRole('button',{name:t('Review attendance','مراجعة الحضور'),exact:true}).click();await page.getByRole('checkbox').check();
   }
   const confirm=command==='register'?button('Save selected marks','حفظ التسجيلات المختارة'):button('Confirm attendance','تأكيد الحضور');
   const start=calls.length;await confirm.focus();await expect(confirm).toBeFocused();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);assert.equal(writes,0);
   await expect(confirm).toHaveCount(0);await expect(unknown()).toBeDisabled();
   const op=await stored();assert.match(op,/^[a-f0-9-]{36}$/);await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[command]);releaseSave();
   if(outcome==='lost'){await expect(unknown()).toBeEnabled();assert.equal(await stored(),op);await page.reload();await expect(unknown()).toBeEnabled();assert.equal(await stored(),op);const n=calls.length;await signals();assert.equal(calls.length,n);await unknown().focus();await expect(unknown()).toBeFocused();await page.keyboard.press('Enter');}
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await stored(),null);assert.equal(writes,1);await expect(unknown()).toHaveCount(0);
   const loading=t('Save confirmed. Loading the current register…','تأكد الحفظ. جارٍ تحميل القائمة الحالية…'),failure=t('Save confirmed; result read unavailable. Retry reading, not saving.','تأكد الحفظ؛ تعذرت قراءة النتيجة. أعد القراءة وليس الحفظ.');
   const premature=await page.getByText(failure,{exact:true}).count()>0;
   if(baseline){assert.ok(premature);gaps.push({locale,command,outcome,prematureReadFailure:true});}else{await expect(page.getByText(loading,{exact:true}).first()).toBeVisible();await expect(page.getByText(failure,{exact:true})).toHaveCount(0);}
   const held=calls.length;await signals();assert.equal(calls.length,held);releaseRead();
   if(outcome==='denied'){await expect(page.getByRole('alert').first()).toContainText(t('Access unavailable','الصلاحية غير متاحة'));await expect(page.locator('body')).not.toContainText('Alex Demo');await expect(unknown()).toHaveCount(0);}
   else{
    if(outcome!=='success'){await expect(page.getByText(failure,{exact:true}).first()).toBeVisible();const retry=button('Load roster','تحميل القائمة').or(button('Retry roster','إعادة تحميل القائمة')).filter({visible:true}).last();await retry.focus();await expect(retry).toBeFocused();await page.keyboard.press('Enter');}
    await expect(button('Alex Demo','Alex Demo')).toBeVisible();await expect(page.getByText(t('Saved. Current result shown below.','حُفظ. النتيجة الحالية أدناه.'),{exact:true}).first()).toBeVisible();
   }
   const expected=[command,...(outcome==='lost'?['roster','reconcile']:[]),'roster',...(['read503','lost'].includes(outcome)?['roster']:[])];await expect.poll(()=>calls.slice(start).map(c=>c.action)).toEqual(expected);assert.equal(writes,1);assert.equal(ops.size,1);assert.equal(await stored(),null);assert.deepEqual(errors,[]);
   cases.push({locale,command,outcome,actions:expected,writes,versions:data.players.map(p=>p.version),errors});
  }catch(e){await writeFile(join(out,`attendance-${command}-${locale}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await ctx.close();}
 }
 return {cases,gaps,baseline,scope:'Actual canonical online Attendance component; fictional identity/HTTP. Not database atomicity, private prepared-register or hosted proof.'};
}
