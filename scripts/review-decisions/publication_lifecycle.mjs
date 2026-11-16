// Real feedback component, fictional identity/HTTP. SQL and hosted proof are separate.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkPublicationLifecycle({browser,origin,out}) {
 const cases=[],a='00000000-0000-4000-8000-000000000001',ev='00000000-0000-4000-8000-000000000002',player='00000000-0000-4000-8000-000000000004',id='00000000-0000-4000-8000-000000000005';
 for(const locale of ['en','ar'])for(const command of ['amend','withdraw'])for(const outcome of ['success','detail503','list503','lost','denied']) {
  const ar=locale==='ar',owner=command==='withdraw',t=(en,arabic)=>ar?arabic:en;
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await context.newPage();
  const calls=[],errors=[],ops=new Map();let writes=0,following=false,failed=false,saveEntered=false,readEntered=false,releaseSave,releaseRead;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r);
  const fields={strengths:'Synthetic strength',focus:'Synthetic focus',next:'Synthetic practice',private:'PRIVATE_STAFF_TEXT'};
  const publication={id,revision:3,created_at:'2026-11-01T18:00:00Z'};
  let data={event:ev,player,id,name:'Alex Demo',owner,self:!owner,state:'published',version:7,revision:3,fields,language:'en',publication,author_current:true,internal_reason:null,title:'Synthetic Program',branch:'Main Demo Branch',sport:'Football',timezone:'Africa/Cairo',starts_at:'2026-11-01T17:00:00Z',ends_at:'2026-11-01T18:00:00Z',ended:true};
  const key=`development:v1:user_A:${a}`,original=()=>page.evaluate(k=>sessionStorage.getItem(k),key);
  const button=(en,arabic)=>page.getByRole('button',{name:t(en,arabic),exact:true});
  const unknown=()=>button('Check original operation','التحقق من العملية الأصلية');
  const retry=()=>button('Retry current view','إعادة تحميل العرض الحالي').last();
  const listAction=owner?'queue':'roster';
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));document.dispatchEvent(new Event('visibilitychange'));});
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.route('**/api/development',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,a);
   const reply=data=>route.fulfill({json:{data}});
   if(body.action==='context')return reply({role:owner?'owner':'trainer'});
   if(body.action==='sessions')return reply({items:[{id:ev,title:'Synthetic Program',starts_at:data.starts_at,ends_at:data.ends_at,timezone:'Africa/Cairo',sport:'Football',branch:'Main Demo Branch'}],more:false});
   if(['detail',listAction].includes(body.action)) {
    if(body.action==='detail'){assert.equal(body.event,ev);assert.equal(body.player,player);}
    if(following){readEntered=true;await readGate;const failAt=outcome==='list503'?listAction:'detail';
     if(!failed&&outcome!=='success'&&body.action===failAt){failed=true;following=false;return route.fulfill({status:outcome==='denied'?403:503,json:{error:outcome==='denied'?'denied':'unavailable'}});}
    }
    if(body.action===listAction)return reply({items:[owner?{id,event_id:ev,player_id:player,name:'Alex Demo',state:data.state,version:data.version,revision:data.revision}:{id:player,name:'Alex Demo',state:data.state,version:data.version,available:true}],more:false});
    return reply(data);
   }
   if(body.action==='command'){
    assert.equal(body.event,ev);assert.equal(body.player,player);assert.equal(body.version,7);assert.equal(body.command,command);assert.deepEqual(body.fields,{});assert.equal(body.language,'en');assert.equal(body.reason,owner?'Fictional withdrawal':'');assert.equal(ops.size,0);
    saveEntered=true;await saveGate;writes++;
    data={...data,state:owner?'withdrawn':'draft',version:8,revision:owner?3:4,publication:owner?null:publication};
    const result={id,event:ev,player,state:data.state,version:8,revision:data.revision,operation:body.operation};ops.set(body.operation,result);
    if(outcome==='lost')return route.abort();following=true;return reply(result);
   }
   if(body.action==='operation'){assert.ok(ops.has(body.operation));assert.equal(body.event,ev);assert.equal(body.player,player);following=true;return reply(ops.get(body.operation));}
   throw Error('Unexpected lifecycle action '+body.action);
  });
  try {
   await page.goto(`${origin}/?locale=${locale}`);
   if(!owner)await page.getByRole('button').filter({hasText:'Synthetic Program'}).click();
   await page.getByRole('button').filter({hasText:'Alex Demo'}).click();
   await expect(page.getByText(t('Family currently sees published revision 3.','ترى الأسرة حالياً الإصدار المنشور 3.'),{exact:true})).toBeVisible();
   if(owner){await button('Withdraw publication','سحب المنشور').click();await page.getByRole('textbox',{name:t('Internal reason','سبب داخلي'),exact:true}).fill('Fictional withdrawal');}
   const confirm=owner?button('Confirm withdrawal','تأكيد السحب'):button('Propose an amendment','اقتراح تعديل');
   const start=calls.length;await confirm.focus();await expect(confirm).toBeFocused();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);await expect(confirm).toBeDisabled();
   assert.equal(writes,0);const pending=JSON.parse(await original());assert.deepEqual(Object.keys(pending).sort(),['event','operation','player']);assert.equal(pending.event,ev);assert.equal(pending.player,player);assert.match(pending.operation,/^[0-9a-f-]{36}$/);
   await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),['command']);releaseSave();
   if(outcome==='lost'){await expect(unknown()).toBeEnabled();assert.deepEqual(JSON.parse(await original()),pending);await page.reload();await expect(unknown()).toBeEnabled();await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),['command']);await unknown().focus();await expect(unknown()).toBeFocused();await page.keyboard.press('Enter');}
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await original(),null);assert.equal(writes,1);await expect(unknown()).toHaveCount(0);
   const loading=t('Operation confirmed. Reloading the current saved result.','تأكدت العملية. جارٍ تحميل النتيجة المحفوظة الحالية.'),failure=t('Save confirmed; the current read failed. Reload before continuing.','تأكد الحفظ وفشلت القراءة الحالية. أعد التحميل قبل المتابعة.');
   await expect(page.getByText(loading,{exact:true}).first()).toBeVisible();await expect(page.getByText(failure,{exact:true})).toHaveCount(0);
   const held=calls.length;await signals();assert.equal(calls.length,held);releaseRead();
   if(outcome==='denied'){
    await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('body')).not.toContainText('Alex Demo');await expect(page.locator('body')).not.toContainText('PRIVATE_STAFF_TEXT');await expect(unknown()).toHaveCount(0);
   }else{
    if(outcome!=='success'){await expect(page.getByText(failure,{exact:true}).first()).toBeVisible();await expect(retry()).toBeEnabled();if(ar)await page.screenshot({path:join(out,`lifecycle-${command}-${outcome}-ar.png`),fullPage:true});await retry().focus();await expect(retry()).toBeFocused();await page.keyboard.press('Enter');}
    await expect(page.getByText('Alex Demo',{exact:true}).first()).toBeVisible();await expect(page.getByText(failure,{exact:true})).toHaveCount(0);
    if(owner){await expect(page.locator('.development-status')).toContainText(t('Withdrawn','مسحوب'));await expect(button('Withdraw publication','سحب المنشور')).toHaveCount(0);await expect(page.locator('main')).not.toContainText(t('Family currently sees published revision','ترى الأسرة حالياً الإصدار المنشور'));}
    else {await expect(button('Continue draft','متابعة المسودة')).toBeVisible();await expect(page.locator('.development-status')).toContainText(t('Draft','مسودة'));await expect(page.getByText(t('Family currently sees published revision 3.','ترى الأسرة حالياً الإصدار المنشور 3.'),{exact:true})).toBeVisible();}
    await expect(button('Internal revision history','سجل الإصدارات الداخلي')).toBeVisible();await expect(page.locator('main')).toContainText('Synthetic strength');
   }
   const after=['detail',...(outcome==='lost'?[]:[listAction])],expected=['command',...(outcome==='lost'?['operation']:[])];
   if(outcome==='success')expected.push(...after);else if(outcome==='denied')expected.push('detail');else if(outcome==='list503')expected.push('detail',listAction,'detail',listAction);else expected.push('detail',...after);
   await expect.poll(()=>calls.slice(start).map(c=>c.action)).toEqual(expected);assert.equal(writes,1);assert.equal(ops.size,1);assert.equal(await original(),null);assert.deepEqual(errors,[]);assert.deepEqual(data.fields,fields);assert.deepEqual(data.publication,owner?null:publication);assert.equal(data.revision,owner?3:4);
   cases.push({locale,command,outcome,actions:expected,writes,state:data.state,version:data.version,revision:data.revision,publicationRetained:!!data.publication,errors});
  }catch(e){await writeFile(join(out,`lifecycle-${command}-${locale}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await context.close();}
 }
 return {cases,scope:'Actual feedback component with fictional identity/HTTP; client protocol and presentation only. SQL publication/history/authority are separate; no hosted or route-return claim.'};
}
