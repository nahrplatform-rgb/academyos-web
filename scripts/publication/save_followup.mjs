// Actual PublicationWorkspace, fictional HTTP receipts. SQL effects are tested separately.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkPublicationSaveFollowup({browser,origin,out,academy,program,context,record,reviewDays,baseline=false}){
 const cases=[],gaps=[];
 for(const locale of ['en','ar'])for(const kind of ['publish','withdraw'])for(const act of (baseline?['activate']:['activate','cancel','create']))for(const outcome of ['success','read_failure','lost_reply','denied_read','context_failure']){
  const ar=locale==='ar',t=(en,a)=>ar?a:en,cancel=act==='cancel',create=act==='create',exact=act!=='create'&&outcome!=='context_failure';
  const pc=await browser.newContext({viewport:{width:ar?390:1440,height:900}}),page=await pc.newPage();
  const calls=[],errors=[],documents=[],ops=new Map(),jobId='00000000-0000-4000-8000-000000000029';
  let job={job:jobId,program,kind,version:7,state:'ready',from:record.definition.from,to:record.definition.to,weekdays:[0,2,4],
   total:40,changes:39,prepared:40,blocked:0,more:true,items:reviewDays.slice(0,25).map(day=>({day,start:'17:00',finish:'18:00',
    plan_version:3,capacity:18,roster_count:1,trainer:'Synthetic Trainer',changing:day!=='2026-11-01',prepared:true,problem:null,published:kind==='withdraw',version:3,eligible:true}))};
  let releaseSave,releaseRead,saveEntered=false,readEntered=false,following=false,failed=false,writes=0;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r),key=`publication:user_A:${academy}:${program}`;
  const button=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true});
  const confirmedText=t('All reviewed visibility changes committed together.','حُفظت كل تغييرات الظهور المراجعة معاً.');
  const unknown=()=>button('Check original operation','التحقق من العملية الأصلية');
  const saved=()=>act!=='activate'?page.getByRole('status').filter({hasText:new RegExp('^(Preparation change confirmed\\.|Original operation confirmed\\.|تأكد تغيير التجهيز\\.|تأكدت العملية الأصلية\\.)$')}):page.getByRole('status').filter({hasText:confirmedText});
  const load=()=>button('Load saved preparation','تحميل التجهيز المحفوظ');
  const pending=()=>page.evaluate(k=>sessionStorage.getItem(k),key);
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
  await page.route('**/api/publication',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,academy);
   if(body.action==='context'){
    assert.equal(body.program,program);if(outcome==='context_failure'&&following&&!failed){failed=true;await route.fulfill({status:503,json:{error:'unavailable'}});return;}
    await route.fulfill({json:{data:{context,program:record}}});return;
   }
   if(body.action==='dates'){await route.fulfill({json:{data:{items:[],more:false}}});return;}
   if(body.action==='jobs'){await route.fulfill({json:{data:{items:[{id:jobId,kind,state:job.state,version:job.version}],more:false}}});return;}
   if(body.action==='read'){
    assert.equal(body.job,jobId);
    if(following){readEntered=true;await readGate;
     if(['read_failure','lost_reply','denied_read'].includes(outcome)&&!failed){failed=true;following=false;await route.fulfill({status:outcome==='denied_read'?403:503,json:{error:outcome==='denied_read'?'denied':'unavailable'}});return;}
     if(outcome!=='context_failure')following=false;
    }
    await route.fulfill({json:{data:job}});return;
   }
   if(create&&body.action==='change'){assert.equal(body.act,'prepare');assert.equal(body.job,jobId);assert.equal(body.version,1);assert.equal(writes,1);writes++;job={...job,state:'ready',version:2,prepared:40};return route.fulfill({json:{data:{job:jobId,state:'ready',version:2}}});}
   if(body.action==='change'||body.action==='create'){
    if(create){assert.equal(body.program,program);assert.equal(body.kind,kind);assert.equal(body.from,record.definition.from);assert.equal(body.to,record.definition.to);assert.deepEqual(body.weekdays,[0,2,4]);}
    else{assert.equal(body.job,jobId);assert.equal(body.version,7);assert.equal(body.act,act);}assert.equal(ops.size,0);
    saveEntered=true;await saveGate;writes++;job={...job,state:create?'preparing':cancel?'cancelled':'committed',version:create?1:8,prepared:create?0:40};
    const receipt={job:jobId,state:job.state,version:job.version};ops.set(body.op,receipt);
    if(outcome==='lost_reply'||outcome==='context_failure'){await route.abort('failed');return;}
    following=true;await route.fulfill({json:{data:receipt}});return;
   }
   if(body.action==='reconcile'){assert.ok(ops.has(body.op));following=true;await route.fulfill({json:{data:ops.get(body.op)}});return;}
   throw new Error('Unexpected publication action '+body.action);
  });
  try{
   await page.goto(`${origin}/?locale=${locale}${exact?'&job='+jobId:''}`);
   if(!exact&&!create){await expect(button(kind==='publish'?'Publish planned dates':'Withdraw published dates',kind==='publish'?'نشر التواريخ المخططة':'سحب التواريخ المنشورة')).toBeVisible();
    await page.getByRole('button',{name:new RegExp('^'+(ar?(kind==='publish'?'نشر':'سحب'):kind==='publish'?'Publication':'Withdrawal')+' ·')}).click();}
   let activate;
   if(create){await button(kind==='publish'?'Publish planned dates':'Withdraw published dates',kind==='publish'?'نشر التواريخ المخططة':'سحب التواريخ المنشورة').click();activate=button('Check visibility changes','فحص تغييرات الظهور');}
   else{
    activate=page.getByRole('button',{name:kind==='publish'?new RegExp(ar?'^نشر .* تاريخاً معاً$':'^Publish .* dates together$'):new RegExp(ar?'^سحب .* تاريخاً معاً$':'^Withdraw .* dates together$')});
    await expect(activate).toBeVisible();
    await page.getByRole('checkbox',{name:t('I reviewed the changes, exceptions and exact audience.','راجعت التغييرات والاستثناءات والجمهور المسموح له.'),exact:true}).check();
   }
   const initial=calls.map(c=>c.action);assert.deepEqual(initial,create?['context','dates','jobs']:exact?['read']:['context','dates','jobs','read']);
   const trigger=cancel?button('Cancel preparation','إلغاء التجهيز'):activate;
   const start=calls.length;if(cancel)page.once('dialog',d=>d.accept());await trigger.focus();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);
   await expect(trigger).toBeDisabled();await expect(saved()).toHaveCount(0);assert.equal(writes,0);
   const original=JSON.parse(await pending());assert.equal(original.job,create?undefined:jobId);assert.match(original.op,/^[0-9a-f-]{36}$/);
   await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[create?'create':'change']);releaseSave();
   if(outcome==='lost_reply'||outcome==='context_failure'){
    await expect(unknown()).toBeEnabled();await expect(saved()).toHaveCount(0);assert.deepEqual(JSON.parse(await pending()),original);
    page.once('dialog',d=>d.accept());await page.reload();await expect(unknown()).toBeEnabled();
    assert.deepEqual(calls.slice(start).map(c=>c.action),[create?'create':'change']);await unknown().focus();await page.keyboard.press('Enter');
   }
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await pending(),null);assert.equal(writes,1);
   const privateText=t('Private preparation. No visibility changes until final save.','تجهيز خاص. لا تغييرات ظهور حتى الحفظ النهائي.');
   const held={confirmedNotice:await saved().count()>0,privateStatus:!create&&await page.getByText(privateText,{exact:true}).count()>0,unknown:await unknown().count()>0};
   if(!held.confirmedNotice||held.privateStatus||held.unknown)gaps.push({locale,kind,outcome,phase:'held-read',...held});
   const before=calls.length;await signals();assert.equal(calls.length,before);
   if(outcome==='lost_reply')await page.screenshot({path:join(out,`publication-${act}-${locale}-${kind}-reconciled-held.png`),fullPage:true});
   releaseRead();
   if(outcome==='denied_read'){
    await expect(page.getByRole('alert').first()).toBeVisible();await expect(page.locator('.publication-summary')).toHaveCount(0);
    await expect(unknown()).toHaveCount(0);await expect(load()).toHaveCount(0);
   }else if(outcome==='read_failure'||outcome==='lost_reply'){
    await expect(load()).toBeEnabled();if(!baseline)await expect(saved()).toBeVisible();
    await expect(unknown()).toHaveCount(0);await load().focus();await page.keyboard.press('Enter');
   }else if(outcome==='context_failure'){
    await expect(page.getByRole('alert').first()).toBeVisible();
    const contextRetry=button('Load program','تحميل البرنامج');
    const retryAvailable=await contextRetry.count()>0;
    gaps.push(...(!retryAvailable?[{locale,kind,outcome,phase:'failed-context',kindOfGap:'missing-context-retry'}]:[]));
    if(baseline&&!retryAvailable){cases.push({locale,kind,act,outcome,held,calls,writes});continue;}
    await expect(contextRetry).toBeEnabled();await contextRetry.focus();await page.keyboard.press('Enter');
    await expect.poll(()=>calls.slice(start).filter(c=>c.action==='jobs').length).toBe(1);
    await expect(page.getByRole('status').filter({hasText:t('Loading current state…','تحميل الحالة الحالية…')})).toHaveCount(0);
   }
   if(create&&outcome==='success')await expect.poll(()=>writes).toBe(2);
   if(outcome!=='denied_read'){
    await expect(page.getByText(create?t('Private preparation. No visibility changes until final save.','تجهيز خاص. لا تغييرات ظهور حتى الحفظ النهائي.'):cancel?t('Preparation cancelled. No visibility changed.','أُلغي التجهيز. لم يتغير الظهور.'):t('All included changes committed together. This is the operation record; current date summaries may differ.','حُفظت كل التغييرات المشمولة معاً. هذا سجل العملية؛ قد تختلف ملخصات التواريخ الحالية.'),{exact:true})).toBeVisible();
    assert.equal(job.kind,kind);assert.equal(job.version,create?(outcome==='success'?2:1):8);assert.equal(job.changes,39);assert.equal(writes,create&&outcome==='success'?2:1);if(!create)await expect(activate).toHaveCount(0);
   }
   const expected=create?(outcome==='success'?['create','read','dates','jobs','change','read','dates','jobs']:outcome==='read_failure'?['create','read','read']:outcome==='lost_reply'?['create','reconcile','read','read']:outcome==='denied_read'?['create','read']:['create','reconcile','read','context','context','dates','jobs']):outcome==='success'?['change','read']:outcome==='read_failure'?['change','read','read']:outcome==='lost_reply'?['change','reconcile','read','read']:outcome==='denied_read'?['change','read']:['change','reconcile','read','context','context','dates','jobs'];
   await expect.poll(()=>calls.slice(start).map(c=>c.action)).toEqual(expected);assert.equal(await pending(),null);assert.deepEqual(errors,[]);
   cases.push({locale,kind,act,outcome,held,actions:expected,job:jobId,original:original.op,reviewedVersion:create?null:7,savedVersion:create?(outcome==='success'?2:1):8,writes,documents:documents.length,errors});
  }catch(e){await writeFile(join(out,`publication-${act}-${locale}-${kind}-${outcome}-failure.json`),JSON.stringify({error:String(e),calls,errors},null,2));throw e;}
  finally{releaseSave();releaseRead();await pc.close();}
 }
 return{baseline,cases,gaps,scope:'actual publication React; fictional publish/withdraw receipts and held HTTP; SQL effects separate'};
}
