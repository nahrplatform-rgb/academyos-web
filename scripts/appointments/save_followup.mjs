import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const gate=()=>{let release;const promise=new Promise(r=>release=r);return {promise,release};};

// Actual appointment components. Transport effects and identity are fictional.
export async function checkAppointmentFollowup({browser,origin,out,domain,baseline=false}) {
 const cases=[],gaps=[],trainer=domain==='trainers',kind=trainer?'trainer':'guardian';
 const academy='00000000-0000-4000-8000-000000000001',target='00000000-0000-4000-8000-000000000002',invitation='00000000-0000-4000-8000-000000000010';
 for(const locale of ['en','ar'])for(const action of ['appoint','end','accept','revoke','retry'])for(const outcome of ['success','read_failure','lost_reply','denied']) {
  if(process.env.APPOINTMENT_RETRY_BASELINE==='1'&&action!=='retry')continue;
  const ar=locale==='ar',t=(en,a)=>ar?a:en,mode=action==='accept'?'invitation':'owner';
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await context.newPage();
  const storageKey=`academyos:${kind}:user_A:${mode}:${mode==='owner'?academy:'invitation'}`;
  const calls=[],errors=[],writeGate=gate(),readGate=gate(),receipts=new Map();
  const person={id:target,display_name:trainer?'Casey Demo':'Alex Demo',branch_name:'Main Demo Branch',role:'trainer'};
  let item={...person,id:invitation,recipient:`${kind}@example.invalid`,state:action==='end'?'accepted':'pending',version:7,delivery:action==='retry'?'failed':'queued',expires_at:'2099-11-01T12:00:00Z'};
  let effects=0,writeEntered=false,readEntered=false,following=false,failed=false,original,invitationId=invitation;
  const b=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true}),unknown=()=>b('Check original operation','التحقق من العملية الأصلية');
  const stored=()=>page.evaluate(k=>sessionStorage.getItem(k),storageKey);
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  const loading=t('Operation confirmed. Loading current access…','تأكدت العملية. جارٍ تحميل الصلاحية الحالية…');
  page.on('pageerror',e=>errors.push(e.message));
  await page.route(`**/api/${domain}`,async route=>{
   const body=route.request().postDataJSON();calls.push(body);if(mode==='owner')assert.equal(body.academy,academy);
   const reply=data=>route.fulfill({json:{data:structuredClone(data)}});
   if(body.action==='exchange') {assert.equal(body.invitation,invitation);assert.equal(body.token,'a'.repeat(64));return reply({exchanged:true});}
   if(['operation','reconcile-accept'].includes(body.action)) {assert.equal(body.op,original);assert.ok(receipts.has(original));following=true;return reply(receipts.get(original));}
   if(['owner-list','review'].includes(body.action)) {
    if(following) {readEntered=true;await readGate.promise;following=false;
     if(outcome==='denied')return route.fulfill({status:403,json:{error:'denied'}});
     if(['read_failure','lost_reply'].includes(outcome)&&!failed) {failed=true;return route.fulfill({status:503,json:{error:'unavailable'}});}
    }
    if(body.action==='review')return reply({...person,academy_id:academy,state:item.state});
    if(!trainer)assert.equal(body.player,target);
    return reply({...(trainer?{branch:{branch_id:target,branch_name:person.branch_name}}:{player:person}),items:action==='appoint'&&!effects?[]:[item],more:false});
   }
   assert.equal(body.action,action);assert.equal(effects,0);original=body.op;assert.match(original,/^[a-f0-9-]{36}$/);
   if(action==='appoint') {assert.equal(body.email,`${kind}@example.invalid`);assert.equal(body.confirmed,true);assert.equal(trainer?body.branch:body.player,target);if(trainer)assert.equal(body.name,person.display_name);invitationId=body.invitation;}
   if(['end','revoke','retry'].includes(action)) {assert.equal(body.invitation,invitation);assert.equal(body.version,7);if(action!=='retry')assert.equal(body.reason,'Synthetic exact reason');}
   writeEntered=true;await writeGate.promise;effects++;item={...item,id:invitationId,state:action==='appoint'?'pending':action==='end'?'ended':action==='revoke'?'revoked':action==='retry'?'pending':'accepted',version:action==='appoint'?1:8};
   const result=action==='appoint'?{invitation_id:invitationId,state:'pending',version:1}:action==='end'?{state:'ended'}:{accepted:true,academy_id:academy,link_id:target};receipts.set(original,result);
   if(outcome==='lost_reply')return route.abort('failed');following=true;return reply(result);
  });
  try {
   const start=`${origin}/${locale}/${mode}`;
   await page.goto(start+(action==='accept'?`#${invitation}.${'a'.repeat(64)}`:''));
   if(action==='appoint') {
    await b(trainer?'Invite trainer':'Invite guardian',trainer?'دعوة مدرب':'دعوة ولي أمر').click();
    if(trainer)await page.getByLabel(t('Fictional staff name','اسم الموظف الخيالي'),{exact:true}).fill(person.display_name);
    await page.getByLabel(t('Intended test recipient email','بريد مستلم الاختبار المقصود'),{exact:true}).fill(`${kind}@example.invalid`);
    await page.getByRole('checkbox').check();await b('Review appointment',trainer?'مراجعة التعيين':'مراجعة الدعوة').click();
   } else if(['end','revoke'].includes(action)) {
    await b(action==='revoke'?'Revoke invitation':trainer?'End appointment':'End link',action==='revoke'?'إلغاء الدعوة':trainer?'إنهاء التعيين':'إنهاء الارتباط').click();
    await page.getByLabel(t('Fictional test reason','سبب الاختبار الخيالي'),{exact:true}).fill('Synthetic exact reason');await b('Review ending access','مراجعة إنهاء الصلاحية').click();
   } else if(action==='retry'){await b('Review delivery retry','مراجعة إعادة الإرسال').click();} else {await b('Review acceptance','مراجعة القبول').click();assert.equal(new URL(page.url()).hash,'');}
   if(action==='accept')assert.equal(calls.filter(c=>c.action==='exchange').length,1);
   const review=page.locator(':is(.workspace-inspector,.workspace-detail-dialog,.workspace-task-body)');await expect(review).toContainText(person.branch_name);if(process.env.APPOINTMENT_RETRY_BASELINE==='1'){assert.ok(baseline);assert.ok(!await review.textContent().then(x=>x.includes(item.recipient))); gaps.push({locale,action,outcome,missingReviewedRecipient:true});continue;}
   if(trainer||action==='accept'||action==='retry')await expect(review).toContainText(person.display_name);if(action==='retry')await expect(review).toContainText(item.recipient);
   const confirm=action==='accept'?b(trainer?'Accept Trainer appointment':'Accept guardian appointment',trainer?'قبول تعيين المدرب':'قبول دعوة ولي الأمر'):action==='appoint'?b('Confirm appointment','تأكيد الدعوة'):b('Confirm this operation','تأكيد العملية');
   const startIndex=calls.length;await confirm.focus();await page.keyboard.press('Enter');await expect.poll(()=>writeEntered).toBe(true);
   await expect(b('Awaiting confirmation…','بانتظار التأكيد…')).toBeDisabled();assert.equal(await stored(),original);assert.equal(effects,0);await expect(page.getByText(loading,{exact:true})).toHaveCount(0);
   const pending=calls.length;await signals();assert.equal(calls.length,pending);writeGate.release();
   if(outcome==='lost_reply') {
    await expect(unknown()).toBeVisible();assert.equal(await stored(),original);await page.reload();await expect(unknown()).toBeEnabled();assert.equal(await stored(),original);
    const beforeReconcile=calls.length;await signals();assert.equal(calls.length,beforeReconcile);await unknown().focus();await page.keyboard.press('Enter');
   }
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await stored(),null);await expect(unknown()).toHaveCount(0);
   const knownLoading=await page.getByText(loading,{exact:true}).count()>0;
   const ambiguous=await page.getByText(t('Loading… awaiting confirmation','جارٍ التحميل… بانتظار التأكيد'),{exact:true}).count()>0;
   if(!knownLoading||ambiguous)gaps.push({locale,action,outcome,knownLoading,ambiguous});
   if(!baseline) {await expect(page.getByText(loading,{exact:true})).toBeVisible();await expect(page.getByText(t('Loading… awaiting confirmation','جارٍ التحميل… بانتظار التأكيد'),{exact:true})).toHaveCount(0);}
   const held=calls.length;await signals();assert.equal(calls.length,held);assert.equal(effects,1);readGate.release();
   if(outcome==='denied') {
    await expect(page.getByRole('alert').first()).toContainText(t('Access unavailable','الصلاحية غير متاحة'));
    await expect(page.getByText(person.display_name,{exact:true})).toHaveCount(0);await expect(page.getByText(person.branch_name,{exact:false})).toHaveCount(0);await expect(unknown()).toHaveCount(0);
   } else {
    if(['read_failure','lost_reply'].includes(outcome)) {
     await expect(page.getByText(t('Operation confirmed; current access could not be refreshed. Retry loading.','تأكدت العملية؛ تعذر تحديث الصلاحية الحالية. أعد التحميل.'),{exact:true})).toBeVisible();
     await expect(unknown()).toHaveCount(0);
     if(ar&&action==='appoint'&&outcome==='read_failure')await page.screenshot({path:join(out,`${kind}-ar-confirmed-read-failed.png`),fullPage:true});
     await b('Retry current read','إعادة محاولة قراءة الحالة').focus();await page.keyboard.press('Enter');
    }
    if(action==='accept')await expect(page.getByRole('link',{name:t(trainer?'Open staff profile':'Open linked players',trainer?'فتح الملف الوظيفي':'فتح اللاعبين المرتبطين'),exact:true})).toBeVisible();
    else await expect(page.getByText(t(['appoint','retry'].includes(action)?'Awaiting recipient acceptance':action==='revoke'?'Invitation revoked':trainer?'Trainer appointment ended':'Link ended',['appoint','retry'].includes(action)?'بانتظار قبول المستلم':action==='revoke'?'أُلغيت الدعوة':trainer?'انتهى تعيين المدرب':'انتهى الارتباط'),{exact:true})).toBeVisible();
   }
   const readAction=mode==='owner'?'owner-list':'review',sequence=calls.slice(startIndex).map(c=>c.action),reconcileAction=mode==='owner'?'operation':'reconcile-accept';
   assert.deepEqual(sequence,[action,...(outcome==='lost_reply'?[readAction,reconcileAction]:[]),readAction,...(['read_failure','lost_reply'].includes(outcome)?[readAction]:[])]);
   assert.equal(effects,1);assert.equal(await stored(),null);assert.deepEqual(errors,[]);cases.push({locale,action,outcome,original,invitation:invitationId,version:item.version,effects,sequence,knownLoading,ambiguous,errors});
  } finally {writeGate.release();readGate.release();await context.close();}
 }
 await writeFile(join(out,'save-followup.json'),JSON.stringify({domain,baseline,cases,gaps,scope:'Actual React; fictional identity/HTTP. Not database, delivery, routed or hosted proof.'},null,2)+'\n');
 console.log(`${domain} held-save cases:${cases.length}, gaps:${gaps.length}`);if(!baseline)assert.deepEqual(gaps,[]);
}
