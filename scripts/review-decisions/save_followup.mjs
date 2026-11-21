// Actual correction/development React; controlled HTTP is not SQL or hosted authority proof.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkReviewSaveFollowup({browser,origin,out,kind,baseline=false}){
 const cases=[],gaps=[],a='00000000-0000-4000-8000-000000000001',ev='00000000-0000-4000-8000-000000000002',player='00000000-0000-4000-8000-000000000004',id='00000000-0000-4000-8000-000000000005';
 for(const locale of ['en','ar'])for(const decision of kind==='correction'?['approved','rejected']:['publish','return'])for(const outcome of ['success','read_failure','lost_reply','denied_read']){
  const ar=locale==='ar',t=(en,a)=>ar?a:en,correction=kind==='correction';
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:900}}),page=await context.newPage();
  const calls=[],errors=[],ops=new Map();let writes=0,following=false,failed=false,saveEntered=false,readEntered=false,releaseSave,releaseRead;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r);
  const key=correction?`corrections:v1:user_A:${a}`:`development:v1:user_A:${a}`;
  const original=()=>page.evaluate(k=>sessionStorage.getItem(k),key);
  const button=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true});
  const unknown=()=>button('Check original operation','التحقق من العملية الأصلية');
  const retry=()=>button('Retry current view',correction?'إعادة تحميل العرض':'إعادة تحميل العرض الحالي');
  const readAction=correction?'correction_detail':'detail',saveAction=correction?'correction_decide':'command',reconcileAction=correction?'correction_reconcile':'operation';
  const fields={strengths:'Synthetic strength',focus:'Synthetic focus',next:'Synthetic practice',private:'PRIVATE_STAFF_TEXT'};
  let data=correction?{event:ev,player,name:'Alex Demo',owner:true,self:false,current:'present',version:7,open:true,projection:{name:'Synthetic Program',branch:'Main Demo Branch',timezone:'Africa/Cairo'},starts_at:'2026-11-01T17:00:00Z',ends_at:'2026-11-01T18:00:00Z',closes_at:'2026-11-02T18:00:00Z',id,state:'pending',before:'present',proposed:'absent',base:7,reason:'Fictional request',decision_reason:null,created_at:'2026-11-01T17:15:00Z'}:{event:ev,player,id,name:'Alex Demo',owner:true,self:false,state:'submitted',version:7,revision:3,fields,language:'en',publication:null,author_current:true,internal_reason:null,title:'Synthetic Program',branch:'Main Demo Branch',sport:'Football',timezone:'Africa/Cairo',starts_at:'2026-11-01T17:00:00Z',ends_at:'2026-11-01T18:00:00Z',ended:true};
  page.on('pageerror',e=>errors.push(e.message));
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  await page.route(correction?'**/api/attendance':'**/api/development',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,a);assert.equal(body.event,ev);
   const reply=data=>route.fulfill({json:{data}});
   if(body.action===readAction){
    if(correction)assert.equal(body.request,id);else assert.equal(body.player,player);
    if(following){readEntered=true;await readGate;following=false;
     if(outcome!=='success'&&!failed){failed=true;return route.fulfill({status:outcome==='denied_read'?403:503,json:{error:outcome==='denied_read'?'denied':'unavailable'}});}
    }return reply(data);
   }
   if(body.action===saveAction){
    if(correction){assert.equal(body.request,id);assert.equal(body.choice,decision);assert.equal(body.reason,'Fictional decision');}
    else{assert.equal(body.player,player);assert.equal(body.version,7);assert.equal(body.command,decision);assert.deepEqual(body.fields,{});assert.equal(body.reason,decision==='return'?'Fictional decision':'');}
    assert.equal(ops.size,0);saveEntered=true;await saveGate;writes++;
    data=correction?{...data,state:decision,current:decision==='approved'?'absent':'present',version:decision==='approved'?8:7,decision_reason:'Fictional decision'}:{...data,state:decision==='publish'?'published':'returned',version:8,revision:decision==='return'?4:3,internal_reason:decision==='return'?'Fictional decision':null,publication:decision==='publish'?{id,revision:3,created_at:'2026-11-01T19:00:00Z'}:null};
    const op=correction?body.op:body.operation,result=correction?{request:id,event:ev,player,state:decision}:{id,event:ev,player,state:data.state,version:8,revision:data.revision,operation:op};ops.set(op,result);
    if(outcome==='lost_reply')return route.abort('failed');following=true;return reply(result);
   }
   if(body.action===reconcileAction){const op=correction?body.op:body.operation;assert.ok(ops.has(op));following=true;return reply(ops.get(op));}
   if(body.action===(correction?'correction_history':'history'))return reply({items:correction?[{id,kind:'requested',reason:'Fictional request',created_at:'2026-11-01T17:15:00Z'},{id:ev,kind:decision,reason:'Fictional decision',created_at:'2026-11-01T19:00:00Z'}]:[{version:8,revision:data.revision,kind:decision,reason:decision==='return'?'Fictional decision':null,created_at:'2026-11-01T19:00:00Z'}],more:false});
   throw Error('Unexpected '+kind+' action '+body.action);
  });
  try{
   await page.goto(`${origin}/?locale=${locale}&request=${id}&event=${ev}&player=${player}#review-from-today=${id}`);
   if(correction){await button('Review decision','مراجعة القرار').click();await page.getByRole('combobox',{name:t('Decision','القرار'),exact:true}).selectOption(decision);await page.getByRole('textbox',{name:t('Decision reason','سبب القرار'),exact:true}).fill('Fictional decision');await button('Review exact change','مراجعة التغيير المحدد').click();await page.getByRole('checkbox').check();}
   else if(decision==='publish')await button('Review publication','مراجعة النشر').click();
   else{await button('Request changes','طلب تعديلات').click();await page.getByRole('textbox',{name:t('Internal reason','سبب داخلي'),exact:true}).fill('Fictional decision');}
   assert.deepEqual(calls.map(c=>c.action),[readAction]);
   const confirm=correction?button('Confirm decision','تأكيد القرار'):decision==='publish'?button('Confirm publication','تأكيد النشر'):button('Confirm return','تأكيد الإعادة');
   const start=calls.length;await confirm.focus();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);if(correction){await expect(confirm).toHaveCount(0);await expect(unknown()).toBeDisabled();}else await expect(confirm).toBeDisabled();assert.equal(writes,0);
   const pending=JSON.parse(await original()),op=correction?pending.op:pending.operation;assert.match(op,/^[a-f0-9-]{36}$/);assert.equal(pending.event,ev);if(!correction)assert.equal(pending.player,player);assert.equal(await original().then(s=>s.includes('Fictional')),false);
   await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[saveAction]);releaseSave();
   if(outcome==='lost_reply'){await expect(unknown()).toBeEnabled();assert.deepEqual(JSON.parse(await original()),pending);page.once('dialog',d=>d.accept());await page.reload();await expect(unknown()).toBeEnabled();assert.deepEqual(calls.slice(start).map(c=>c.action),[saveAction]);await unknown().focus();await page.keyboard.press('Enter');}
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await original(),null);assert.equal(writes,1);await expect(unknown()).toHaveCount(0);
   const failureText=correction?t('Save confirmed; reading failed. Retry reading, not saving.','تأكد الحفظ؛ فشلت القراءة. أعد القراءة وليس الحفظ.'):t('Save confirmed; the current read failed. Reload before continuing.','تأكد الحفظ وفشلت القراءة الحالية. أعد التحميل قبل المتابعة.');
   const prematureFailure=await page.getByText(failureText,{exact:true}).count()>0;
   if(prematureFailure)gaps.push({kind,locale,decision,outcome,phase:'held-result',gap:'read-failure-before-read-completes'});
   const confirmed=correction?t('Save confirmed. Loading the current result…','تأكد الحفظ. جارٍ تحميل النتيجة الحالية…'):t('Operation confirmed. Reloading the current saved result.','تأكدت العملية. جارٍ تحميل النتيجة المحفوظة الحالية.');await expect(page.getByText(confirmed,{exact:true})).toBeVisible();
   const heldCalls=calls.length;await signals();assert.equal(calls.length,heldCalls);
   if(outcome==='lost_reply')await page.screenshot({path:join(out,`${kind}-${locale}-${decision}-held.png`),fullPage:true});releaseRead();
   if(outcome==='denied_read'){await expect(page.getByRole('alert')).toBeVisible();await expect(page.getByText('Alex Demo',{exact:true})).toHaveCount(0);await expect(page.getByText('PRIVATE_STAFF_TEXT',{exact:true})).toHaveCount(0);await expect(retry()).toHaveCount(0);}
   else{
    if(outcome!=='success'){await expect(page.getByText(failureText,{exact:true})).toBeVisible();await expect(retry()).toBeEnabled();await expect(confirm).toHaveCount(0);await retry().focus();await page.keyboard.press('Enter');}
    await expect(page.getByText('Alex Demo',{exact:true})).toBeVisible();await expect(confirm).toHaveCount(0);await expect(page.getByText(failureText,{exact:true})).toHaveCount(0);
    const stateText=correction?(decision==='approved'?t('Approved','موافق عليه'):t('Rejected','مرفوض')):decision==='publish'?t('Published','منشور'):t('Changes requested','مطلوب تعديل');await expect(page.locator('main')).toContainText(stateText);
   }
   const expected=[saveAction,...(outcome==='lost_reply'?[reconcileAction]:[]),readAction,...(['read_failure','lost_reply'].includes(outcome)?[readAction]:[])];assert.deepEqual(calls.slice(start).map(c=>c.action),expected);
   if(outcome!=='denied_read'){
    await button(correction?'Request history':'Internal revision history',correction?'سجل الطلب':'سجل الإصدارات الداخلي').click();await expect(page.locator('ol li')).toHaveCount(correction?2:1);
    if(correction||decision==='return')await expect(page.locator('ol')).toContainText('Fictional decision');
   }
   assert.equal(writes,1);assert.equal(ops.size,1);assert.equal(await original(),null);assert.deepEqual(errors,[]);
   cases.push({locale,decision,outcome,original:op,reviewedVersion:7,resultVersion:data.version,actions:expected,writes,prematureFailure,errors});
  }catch(e){await writeFile(join(out,`${kind}-${locale}-${decision}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await context.close();}
 }
 if(!baseline)assert.deepEqual(gaps,[]);
 return {kind,baseline,cases,gaps,scope:'Actual product React; fictional current-owner/different-author HTTP. Not hosted identity, SQL effects or route-return proof.'};
}
