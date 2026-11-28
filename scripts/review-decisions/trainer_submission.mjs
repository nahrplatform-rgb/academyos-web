// Actual product components with controlled fictional HTTP; no hosted or SQL proof.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

export async function checkTrainerSubmission({browser,origin,out,kind}) {
 const baseline=process.env.TRAINER_SUBMISSION_BASELINE==='1';if(baseline&&!process.env.TRAINER_SUBMISSION_REFERENCE)throw Error('Baseline requires exact reference source');
 const cases=[],a='00000000-0000-4000-8000-000000000001',ev='00000000-0000-4000-8000-000000000002',player='00000000-0000-4000-8000-000000000004',id='00000000-0000-4000-8000-000000000005';
 const correction=kind==='correction';
 for(const locale of ['en','ar'])for(const command of correction?['request']:['save','submit'])for(const outcome of ['success','detail503','list503','lost','denied']) {
  if(process.env.TRAINER_SUBMISSION_OUTCOME&&outcome!==process.env.TRAINER_SUBMISSION_OUTCOME)continue;
  const ar=locale==='ar',t=(en,arabic)=>ar?arabic:en;
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await context.newPage();
  const calls=[],errors=[],ops=new Map();let writes=0,following=false,failed=false,saveEntered=false,readEntered=false,releaseSave,releaseRead;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r);
  const fields={strengths:'Synthetic strength',focus:'Synthetic focus',next:'Synthetic practice',private:'PRIVATE_STAFF_TEXT'};
  const key=correction?`corrections:v1:user_A:${a}`:`development:v1:user_A:${a}`;
  const original=()=>page.evaluate(k=>sessionStorage.getItem(k),key);
  const button=(en,arabic)=>page.getByRole('button',{name:t(en,arabic),exact:true});
  const unknown=()=>button('Check original operation','التحقق من العملية الأصلية');
  const retry=()=>page.getByRole('button',{name:t('Retry current view',correction?'إعادة تحميل العرض':'إعادة تحميل العرض الحالي'),exact:true}).last();
  const saveAction=correction?'correction_submit':'command',detailAction=correction?'correction_detail':'detail',listAction=correction?'correction_list':'roster',reconcileAction=correction?'correction_reconcile':'operation';
  const projection={name:'Synthetic Program',branch:'Main Demo Branch',timezone:'Africa/Cairo'};
  let data=correction?{event:ev,player,name:'Alex Demo',owner:false,self:true,current:'present',version:7,open:true,projection,starts_at:'2026-11-01T17:00:00Z',ends_at:'2026-11-01T18:00:00Z',closes_at:'2026-11-02T18:00:00Z',existing:null}
   :{event:ev,player,id,name:'Alex Demo',owner:false,self:true,state:'draft',version:7,revision:3,fields:{strengths:'Old strength',focus:'Old focus',next:'Old practice',private:'Old private'},language:'en',publication:null,author_current:true,internal_reason:null,title:'Synthetic Program',branch:'Main Demo Branch',sport:'Football',timezone:'Africa/Cairo',starts_at:'2026-11-01T17:00:00Z',ends_at:'2026-11-01T18:00:00Z',ended:true};
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));document.dispatchEvent(new Event('visibilitychange'));});
  await page.route(correction?'**/api/attendance':'**/api/development',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,a);
   const reply=data=>route.fulfill({json:{data}});
   if(body.action==='context')return reply({role:'trainer'});
   if(body.action==='sessions')return reply({items:[{id:ev,title:'Synthetic Program',starts_at:data.starts_at,ends_at:data.ends_at,timezone:'Africa/Cairo',sport:'Football',branch:'Main Demo Branch'}],more:false});
   if([detailAction,listAction,'correction_context'].includes(body.action)) {
    if(body.action===detailAction){assert.equal(body.event,ev);if(correction)assert.equal(body.request,data.id);else assert.equal(body.player,player);}
    if(following){readEntered=true;await readGate;
     const failAt=outcome==='list503'?listAction:detailAction;
     if(!failed&&outcome!=='success'&&body.action===failAt){failed=true;following=false;return route.fulfill({status:outcome==='denied'?403:503,json:{error:outcome==='denied'?'denied':'unavailable'}});}
    }
    if(body.action==='correction_context'){const {id:requestId,state,before,proposed,base,reason,decision_reason,created_at,...current}=data;return reply(current);}
    if(body.action===listAction)return reply(correction?{owner:false,items:data.id?[{...data,before_status:'present',base_version:7}]:[],more:false}:{items:[{id:player,name:'Alex Demo',state:data.state,version:data.version,available:true}],more:false});
    return reply(data);
   }
   if(body.action===saveAction){
    assert.equal(body.event,ev);assert.equal(body.player,player);assert.equal(body.version,7);
    if(correction)assert.equal(body.reason,'Fictional request');else{assert.equal(body.command,command);assert.deepEqual(body.fields,fields);assert.equal(body.language,ar?'ar':'en');assert.equal(body.reason,'');}
    assert.equal(ops.size,0);saveEntered=true;await saveGate;writes++;
    const op=correction?body.op:body.operation;
    data=correction?{...data,id:op,state:'pending',before:'present',proposed:'absent',base:7,reason:'Fictional request',decision_reason:null,created_at:'2026-11-01T17:15:00Z',existing:op}:{...data,state:command==='save'?'draft':'submitted',version:8,fields,language:body.language};
    const result=correction?{request:op,event:ev,player,state:'pending'}:{id,event:ev,player,state:data.state,version:8,revision:3,operation:op};ops.set(op,result);
    if(outcome==='lost')return route.abort();following=true;return reply(result);
   }
   if(body.action===reconcileAction){const op=correction?body.op:body.operation;assert.ok(ops.has(op));assert.equal(body.event,ev);following=true;return reply(ops.get(op));}
   throw Error('Unexpected Trainer '+kind+' action '+body.action);
  });
  try {
   await page.goto(`${origin}/?locale=${locale}`);
   if(correction){await button('Request correction','طلب تصحيح').click();await page.getByRole('textbox',{name:t('Request reason','سبب الطلب'),exact:true}).fill('Fictional request');await button('Review exact change','مراجعة التغيير المحدد').click();await page.getByRole('checkbox').check();}
   else {
    await page.getByRole('button').filter({hasText:'Synthetic Program'}).click();await page.getByRole('button').filter({hasText:'Alex Demo'}).click();
    await button('Continue draft','متابعة المسودة').click();
    for(const [name,key]of [[t('Strengths','نقاط القوة'),'strengths'],[t('Improvement focus','محور التحسين'),'focus'],[t('Next steps','الخطوات القادمة'),'next'],[t('Private staff note — never shared with families','ملاحظة خاصة للطاقم — لا تُعرض للأسرة'),'private']])await page.getByRole('textbox',{name:new RegExp('^'+name)}).fill(fields[key]);
    await page.getByRole('combobox',{name:t('Content language','لغة الملاحظات'),exact:true}).selectOption(ar?'ar':'en');
    if(command==='submit')await button('Review submission','مراجعة الإرسال').click();
   }
   const confirm=correction?button('Submit request','إرسال الطلب'):command==='save'?button('Save draft','حفظ المسودة'):button('Submit for Owner review','إرسال لمراجعة المالك');
   const start=calls.length;await confirm.focus();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);
   if(correction){await expect(confirm).toHaveCount(0);await expect(unknown()).toBeDisabled();}else await expect(confirm).toBeDisabled();
   assert.equal(writes,0);const pending=JSON.parse(await original()),op=correction?pending.op:pending.operation;assert.equal(pending.event,ev);if(!correction)assert.equal(pending.player,player);assert.ok(!JSON.stringify(pending).includes('Synthetic'));assert.ok(!JSON.stringify(pending).includes('Fictional'));
   await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[saveAction]);releaseSave();
   if(outcome==='lost'){await expect(unknown()).toBeEnabled();assert.deepEqual(JSON.parse(await original()),pending);await page.reload();await expect(unknown()).toBeEnabled();await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[saveAction]);await unknown().focus();await page.keyboard.press('Enter');}
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await original(),null);assert.equal(writes,1);await expect(unknown()).toHaveCount(0);
   const loading=correction?t('Save confirmed. Loading the current result…','تأكد الحفظ. جارٍ تحميل النتيجة الحالية…'):t('Operation confirmed. Reloading the current saved result.','تأكدت العملية. جارٍ تحميل النتيجة المحفوظة الحالية.');
   const failure=correction?t('Save confirmed; reading failed. Retry reading, not saving.','تأكد الحفظ؛ فشلت القراءة. أعد القراءة وليس الحفظ.'):t('Save confirmed; the current read failed. Reload before continuing.','تأكد الحفظ وفشلت القراءة الحالية. أعد التحميل قبل المتابعة.');
   await expect(page.getByText(loading,{exact:true}).first()).toBeVisible();await expect(page.getByText(failure,{exact:true})).toHaveCount(0);
   const held=calls.length;await signals();assert.equal(calls.length,held);releaseRead();
   if(outcome==='denied') {await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('body')).not.toContainText('Alex Demo');await expect(page.locator('body')).not.toContainText('PRIVATE_STAFF_TEXT');await expect(unknown()).toHaveCount(0);}
   else {
    if(outcome!=='success'){await expect(page.getByText(failure,{exact:true}).first()).toBeVisible();await expect(retry()).toBeEnabled();if(ar)await page.screenshot({path:join(out,`trainer-${kind}-${command}-${outcome}-ar.png`),fullPage:true});await retry().focus();await expect(retry()).toBeFocused();await page.keyboard.press('Enter');if(baseline&&correction){await expect.poll(()=>calls.slice(start).some(c=>c.action==='correction_context')).toBe(true);if(calls.slice(start).some(c=>c.action==='correction_context')){cases.push({locale,command,outcome,gap:'Retry reads player context instead of confirmed request',actions:calls.slice(start).map(c=>c.action),writes});continue;}}}
    await expect(page.getByText('Alex Demo',{exact:true}).first()).toBeVisible();
    if(correction){await expect(page.locator('main')).toContainText(t('Waiting for the Owner. Attendance remains unchanged.','بانتظار المالك. لم يتغير الحضور.'));await expect(button('Submit request','إرسال الطلب')).toHaveCount(0);}
    else {await expect(page.locator('main')).toContainText(command==='save'?t('Draft','مسودة'):t('Awaiting Owner review','بانتظار مراجعة المالك'));await expect(button('Save draft','حفظ المسودة')).toHaveCount(0);await expect(page.locator('main')).toContainText('Synthetic strength');}
    await expect(page.getByText(failure,{exact:true})).toHaveCount(0);
   }
   const after=[detailAction,...(outcome==='lost'&&!correction?[]:[listAction])];
   const expected=[saveAction,...(outcome==='lost'?[reconcileAction]:[])];
   if(outcome==='success')expected.push(...after);else if(outcome==='denied')expected.push(detailAction);else if(outcome==='list503')expected.push(detailAction,listAction,detailAction,listAction);else expected.push(detailAction,...after);
   await expect.poll(()=>calls.slice(start).map(c=>c.action)).toEqual(expected);
   assert.equal(writes,1);assert.equal(ops.size,1);assert.equal(await original(),null);assert.deepEqual(errors,[]);
   if(correction){assert.equal(data.current,'present');assert.equal(data.version,7);assert.equal(data.state,'pending');}else{assert.equal(data.version,8);assert.equal(data.publication,null);assert.deepEqual(data.fields,fields);}
   cases.push({locale,command,outcome,actions:expected,writes,current:correction?data.current:undefined,version:data.version,state:data.state,errors});
  }catch(e){await writeFile(join(out,`trainer-${kind}-${command}-${locale}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await context.close();}
 }
 if(baseline)assert.ok(cases.some(c=>c.gap));
 return {kind,baseline,cases,scope:'Actual product Trainer components; fictional identity/HTTP. Not SQL persistence/audit, hosted authority, route return or family projection proof.'};
}
