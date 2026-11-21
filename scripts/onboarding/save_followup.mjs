import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
// Existing product handlers with fictional identity/HTTP, not provider/DB authority.
export async function checkOnboardingFollowup({browser,origin,out,baseline=false}){
 const cases=[],gaps=[],a='00000000-0000-4000-8000-000000000001',iv='00000000-0000-4000-8000-000000000002';
 for(const locale of ['en','ar'])for(const command of ['create','revoke','reissue','retry','accept','branch','sport','complete'])for(const outcome of ['success','read503','lost','denied']){
  const ar=locale==='ar',t=(en,a)=>ar?a:en,mode=['branch','sport','complete'].includes(command)?'setup':command==='accept'?'invitation':'platform';
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await context.newPage();
  const calls=[],errors=[],ops=new Map();let writes=0,following=false,failed=false,saveEntered=false,readEntered=false,releaseSave,releaseRead,admitted=command!=='create',accepted=false,revoked=false,generation=7;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r),key=`academyos:staging:m1-operation:user_synthetic:${mode}:${mode==='setup'?a:'none'}`;
  const setup={academy_id:a,name:'Synthetic Academy A',version:7,complete:false,timezone:'Africa/Cairo',branch:{id:iv,name:'Main Demo Branch'},sport:{id:iv,label_en:'Football',label_ar:'كرة القدم'}};
  const b=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true}),unknown=()=>b('Check original operation','التحقق من العملية الأصلية');
  const stored=()=>page.evaluate(k=>sessionStorage.getItem(k),key),signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));document.dispatchEvent(new Event('visibilitychange'));});
  const readAction=mode==='setup'?'setup':mode==='invitation'?'review':'platform';
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/api/onboarding',async route=>{
   const body=route.request().postDataJSON();calls.push(body);const reply=data=>route.fulfill({json:{data}});
   if(body.action==='exchange'){assert.equal(body.invitation,iv);assert.equal(body.token,'a'.repeat(64));return reply({exchanged:true});}
   if(body.action===readAction){
    if(mode==='setup')assert.equal(body.academy,a);
    if(following){readEntered=true;await readGate;following=false;if(!failed&&outcome!=='success'){failed=true;return route.fulfill({status:outcome==='denied'?403:503,json:{error:outcome==='denied'?'denied':'unavailable'}});}}
    if(mode==='setup')return reply(setup);
    if(mode==='invitation')return reply({academy_id:a,name:setup.name,accepted});
    return reply({items:admitted?[{id:a,name:setup.name,setup_complete:false,invitation_id:iv,generation,expires_at:'2099-11-01T18:00:00Z',revoked,redeemed_at:null,delivery:'queued',attempts:0}]:[],more:false});
   }
   if(body.action==='operation'){assert.ok(ops.has(body.op));following=true;return reply({found:true,result:ops.get(body.op)});}
   assert.equal(body.action,mode==='setup'?'save':command);assert.equal(writes,0);
   if(mode==='setup'){assert.equal(body.academy,a);assert.equal(body.version,7);assert.equal(body.step,command);assert.deepEqual(body.fields,command==='branch'?{name:'New Demo Branch',timezone:'Africa/Cairo'}:command==='sport'?{label_en:'Synthetic Sport',label_ar:'رياضة اختبار'}:{});}
   if(command==='create'){assert.equal(body.name,'Synthetic Academy A');assert.equal(body.email,'owner@example.invalid');assert.match(body.invitation,/^[a-f0-9-]{36}$/);}
   if(['revoke','reissue','retry'].includes(command)){assert.equal(body.invitation,iv);assert.equal(body.generation,7);}
   saveEntered=true;await saveGate;writes++;if(command==='create')admitted=true;if(command==='revoke')revoked=true;if(command==='reissue')generation++;if(command==='accept')accepted=true;
   if(mode==='setup'){setup.version++;if(command==='branch')setup.branch.name='New Demo Branch';if(command==='sport'){setup.sport.label_en='Synthetic Sport';setup.sport.label_ar='رياضة اختبار';}if(command==='complete')setup.complete=true;}
   const result=mode==='setup'?setup:command==='create'?{academy_id:a,invitation_id:iv,generation:1}:command==='accept'?{academy_id:a,name:setup.name,accepted:true}:{[command==='revoke'?'revoked':command==='reissue'?'reissued':'queued']:true};ops.set(body.op,result);if(outcome==='lost')return route.abort();following=true;return reply(result);
  });
  try{
   await page.goto(`${origin}/${locale}/${mode}${mode==='setup'?'?academy='+a:''}${command==='accept'?'#'+iv+'.'+'a'.repeat(64):''}`);
   let confirm;
   if(command==='create'){await b('Create a synthetic academy','إنشاء أكاديمية اختبار').click();await page.getByLabel(t('Academy name','اسم الأكاديمية'),{exact:true}).fill(setup.name);await page.getByLabel(t('Intended owner email','بريد المالك المقصود'),{exact:true}).fill('owner@example.invalid');await b('Review appointment','مراجعة التعيين').click();confirm=b('Create and invite owner','إنشاء ودعوة المالك');}
   else if(['revoke','reissue','retry'].includes(command)){
    await b('Synthetic Academy A — view details','Synthetic Academy A — عرض التفاصيل').click();
    if(command==='retry')confirm=b('Retry pending delivery','إعادة محاولة الإرسال المعلق');else{await b(command==='revoke'?'Review withdrawal':'Review new invitation',command==='revoke'?'مراجعة إلغاء الدعوة':'مراجعة دعوة جديدة').click();confirm=b('Confirm change','تأكيد التغيير');}
   }else if(command==='accept')confirm=b('Accept owner appointment','قبول تعيين المالك');
   else if(command==='complete')confirm=b('Complete initial setup','إكمال الإعداد الأولي');
   else if(command==='branch'){await b('Edit branch and timezone','تعديل الفرع والمنطقة الزمنية').click();await page.getByLabel(t('Branch name','اسم الفرع'),{exact:true}).fill('New Demo Branch');confirm=b('Save branch','حفظ الفرع');}
   else{await b('Edit sport','تعديل الرياضة').click();await page.getByLabel(t('Sport label — English','اسم الرياضة — الإنجليزية'),{exact:true}).fill('Synthetic Sport');await page.getByLabel(t('Sport label — Arabic','اسم الرياضة — العربية'),{exact:true}).fill('رياضة اختبار');confirm=b('Save sport','حفظ الرياضة');}
   await expect(confirm).toBeEnabled();const start=calls.length;await confirm.focus();await expect(confirm).toBeFocused();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);await expect(confirm).toBeDisabled();assert.equal(writes,0);
   const pending=JSON.parse(await stored());assert.deepEqual(Object.keys(pending).sort(),['op','started']);assert.match(pending.op,/^[a-f0-9-]{36}$/);await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[mode==='setup'?'save':command]);releaseSave();
   if(outcome==='lost'){await expect(unknown()).toBeEnabled();assert.equal(JSON.parse(await stored()).op,pending.op);await page.reload();await expect(unknown()).toBeEnabled();assert.equal(JSON.parse(await stored()).op,pending.op);const n=calls.length;await signals();assert.equal(calls.length,n);await unknown().focus();await expect(unknown()).toBeFocused();await page.keyboard.press('Enter');}
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await stored(),null);assert.equal(writes,1);await expect(unknown()).toHaveCount(0);
   const loading=t('Operation confirmed. Loading current saved progress…','تأكدت العملية. جارٍ تحميل التقدم المحفوظ الحالي…');
   const ambiguous=t('Saving… waiting for confirmation.','جارٍ الحفظ… بانتظار التأكيد.');
   const gap=await page.getByText(ambiguous,{exact:true}).count()>0;
   if(baseline){assert.ok(gap);gaps.push({locale,command,outcome,awaitingAfterConfirmation:true});}else{await expect(page.getByText(loading,{exact:true})).toBeVisible();await expect(page.getByText(ambiguous,{exact:true})).toHaveCount(0);}
   const held=calls.length;await signals();assert.equal(calls.length,held);releaseRead();
   if(outcome==='denied'){await expect(page.getByRole('alert')).toContainText(t('Access is unavailable','الصلاحية غير متاحة'));await expect(page.locator('body')).not.toContainText('Synthetic Academy A');await expect(page.locator('body')).not.toContainText('Main Demo Branch');await expect(unknown()).toHaveCount(0);}
   else{
    if(outcome!=='success'){await expect(b('Retry current read','إعادة محاولة قراءة الحالة').or(b('Try again','حاول مرة أخرى'))).toBeEnabled();if(!baseline)await expect(page.getByText(t('Operation confirmed; current progress could not be loaded. Retry reading.','تأكدت العملية؛ تعذر تحميل التقدم الحالي. أعد القراءة.'),{exact:true})).toBeVisible();const retry=b('Retry current read','إعادة محاولة قراءة الحالة').or(b('Try again','حاول مرة أخرى'));await retry.focus();await expect(retry).toBeFocused();await page.keyboard.press('Enter');}
    if(mode==='setup')await expect(b('Edit sport','تعديل الرياضة')).toBeVisible();else if(mode==='platform')await expect(b('Synthetic Academy A — view details','Synthetic Academy A — عرض التفاصيل')).toBeVisible();else await expect(page.getByRole('link',{name:t('Enter setup workspace','دخول مساحة الإعداد'),exact:true})).toBeVisible();
   }
   const expected=[mode==='setup'?'save':command,...(outcome==='lost'?[readAction,'operation']:[]),readAction,...(['read503','lost'].includes(outcome)?[readAction]:[])];await expect.poll(()=>calls.slice(start).map(c=>c.action)).toEqual(expected);assert.equal(writes,1);assert.equal(ops.size,1);assert.equal(await stored(),null);assert.deepEqual(errors,[]);cases.push({locale,command,outcome,actions:expected,writes,version:setup.version,generation,errors});
  }catch(e){await writeFile(join(out,`onboarding-${command}-${locale}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await context.close();}
 }
 return {cases,gaps,baseline,scope:'Actual M1 component; fictional identity and HTTP. No provider delivery, signed-in authentication, database or hosted proof.'};
}
