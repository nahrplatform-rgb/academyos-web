// Actual ProgramPlanningWorkspace over a fixed, already-reviewed 40-date proposal.
// Fictional HTTP adapter: separate SQL tests own atomicity/authority evidence.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';
export async function checkProgramSaveFollowup({browser,origin,evidence,academy,program,ctx,record,reviewDays,baseline=false}){
 const cases=[],gaps=[];
 for(const locale of ['en','ar'])for(const act of (process.env.PROGRAM_PRIVATE_CREATE_BASELINE==='1'?['create']:baseline?['activate']:['activate','cancel','create','prepare','players']))for(const outcome of (process.env.PROGRAM_PRIVATE_CREATE_BASELINE==='1'?['read_failure']:['success','read_failure','lost_reply','denied_read','context_failure'])){
  const ar=locale==='ar',t=(en,a)=>ar?a:en,cancel=act==='cancel',privateCommand=!['activate','cancel'].includes(act),create=act==='create',member='00000000-0000-4000-8000-000000000039',savedVersion=create?1:8;
  const pc=await browser.newContext({viewport:{width:ar?390:1440,height:900}}),page=await pc.newPage();
  const calls=[],errors=[],documents=[],ops=new Map(),jobId='00000000-0000-4000-8000-000000000019';
  const rules=Object.fromEntries([0,2,4].map(day=>[day,{capacity:23,trainer:null,players:[]}]));
  let job={job:jobId,program,version:7,state:act==='prepare'?'preparing':'ready',rules,from:record.definition.from,to:record.definition.to,
   total:40,preserved:1,prepared:act==='prepare'?15:40,blocked:0,context:ctx,weekday:0,player_counts:{0:0,2:0,4:0},players:[],players_more:false,
   items:reviewDays.slice(0,25).map(day=>({day,start:'17:00',finish:'18:00',expected_version:0,prepared:true,problem:null,
    rule:rules[new Date(day+'T00:00:00Z').getUTCDay()],current_capacity:null,current_count:0,current_trainer:null,trainer_name:null})),more:true};
  if(act==='players'){job.players=[{id:member,name:'Alex Demo'}];job.rules[0].players=[member];job.player_counts[0]=1;}
  const lost=outcome==='lost_reply'||outcome==='context_failure';
  let releaseSave,releaseRead,saveEntered=false,readEntered=false,following=false,failed=false,writes=0;
  const saveGate=new Promise(r=>releaseSave=r),readGate=new Promise(r=>releaseRead=r);
  const key=`academyos:program-plan:user_A:${academy}:${program}`;
  const button=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true});
  const saved=()=>page.getByRole('status').filter({hasText:act!=='activate'?t('Current saved preparation is shown below. Preparation changes no effective date plan.','التجهيز المحفوظ الحالي أدناه. التجهيز لا يغيّر أي خطة تاريخ فعلية.'):t('All reviewed date changes saved together. Preserved plans are unchanged.','حُفظت كل تغييرات التواريخ المراجعة معاً. الخطط المحفوظة لم تتغير.')});
  const unknown=()=>button('Check original operation','التحقق من العملية الأصلية');
  const load=()=>button('Load saved preparation','تحميل التجهيز المحفوظ');
  const committed=()=>page.getByRole('status').filter({hasText:t('All included changes committed together. This is the operation snapshot; individual dates may now differ.','حُفظت كل التغييرات المشمولة معاً. هذا سجل العملية؛ قد تختلف التواريخ بعد تعديلها منفردة.')});
  const privateStatus=()=>page.getByRole('status').filter({hasText:t('Private preparation · no effective date changes yet.','تجهيز خاص · لا تغييرات فعلية على التواريخ بعد.')});
  const pending=()=>page.evaluate(k=>sessionStorage.getItem(k),key);
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
  await page.route('**/api/program-planning',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,academy);
   if(body.action==='context'){assert.equal(body.program,program);if(outcome==='context_failure'&&following&&!failed){failed=true;await route.fulfill({status:503,json:{error:'unavailable'}});return;}await route.fulfill({json:{data:{context:ctx,program:record,dates:[{date:'2026-11-01'}]}}});return;}
   if(body.action==='list'){await route.fulfill({json:{data:{items:[{id:jobId,version:job.version,state:job.state}],more:false}}});return;}
   if(body.action==='read'){
    assert.equal(body.job,jobId);
    if(following){following=false;readEntered=true;await readGate;
     if(['read_failure','lost_reply','denied_read'].includes(outcome)&&!failed){failed=true;await route.fulfill({status:outcome==='denied_read'?403:503,json:{error:outcome==='denied_read'?'denied':'unavailable'}});return;}}
    await route.fulfill({json:{data:job}});return;
   }
   if(body.action==='change'||body.action==='create'){
    if(create){assert.equal(body.program,program);assert.equal(body.from,record.definition.from);assert.equal(body.to,record.definition.to);assert.equal(body.rules[0].capacity,23);}
    else{assert.equal(body.job,jobId);assert.equal(body.version,7);assert.equal(body.act,act);}
    if(act==='players'){assert.equal(body.weekday,0);assert.deepEqual(body.add,[]);assert.deepEqual(body.remove,[member]);}
    assert.equal(ops.size,0);
    saveEntered=true;await saveGate;writes++;job={...job,version:savedVersion,state:cancel?'cancelled':act==='activate'?'committed':act==='prepare'?'ready':'preparing',prepared:act==='players'||create?0:40};if(act==='players'){job.players=[];job.rules[0].players=[];job.player_counts[0]=0;}
    const receipt={job:jobId,version:savedVersion,state:job.state};ops.set(body.op,receipt);
    if(lost){await route.abort('failed');return;}
    following=true;await route.fulfill({json:{data:receipt}});return;
   }
   if(body.action==='reconcile'){assert.ok(ops.has(body.op));following=true;await route.fulfill({json:{data:ops.get(body.op)}});return;}
   throw new Error('Unexpected action '+body.action);
  });
  try{
   await page.goto(`${origin}/?locale=${locale}`);
   let activate;
   if(create){await button('New proposal','مقترح جديد').click();await page.getByRole('spinbutton',{name:t('Capacity','السعة'),exact:true}).fill('23');activate=button('Review dated proposal','مراجعة مقترح التواريخ');}
   else{
    await page.getByRole('button',{name:act==='prepare'?(ar?/^استئناف التجهيز/:/^Resume preparation/):(ar?/^تجهيز مُراجع/:/^Reviewed preparation/)}).click();
    await expect(page.getByRole('list',{name:t('Weekday choices','اختيارات أيام الأسبوع'),exact:true})).toContainText('23');
    if(act==='players'){const detail=page.locator('details').filter({has:page.locator('summary').filter({hasText:t('Adjust private weekday rosters','تعديل قوائم الأيام الخاصة')})});await detail.locator('summary').first().click();await page.getByRole('checkbox',{name:'Alex Demo',exact:true}).uncheck();activate=button('Save these private roster changes','حفظ تغييرات القائمة الخاصة');}
    else if(act==='prepare')activate=button('Resume checking dates','استئناف فحص التواريخ');
    else{await page.getByRole('checkbox',{name:t('I reviewed the summary, exceptions and exact 39 changes.','راجعت الملخص والاستثناءات والتغييرات المحددة (39).'),exact:true}).check();activate=cancel?button('Cancel this preparation','إلغاء هذا التجهيز'):button('Save 39 dates together','حفظ 39 تاريخاً معاً');}
   }
   const start=calls.length;
   if(cancel)page.once('dialog',d=>d.accept());
   await activate.focus();await page.keyboard.press('Enter');await expect.poll(()=>saveEntered).toBe(true);
   if(act==='prepare')await expect(button('Pause checking','إيقاف الفحص مؤقتاً')).toBeVisible();else await expect(activate).toBeDisabled();await expect(saved()).toHaveCount(0);assert.equal(writes,0);
   const original=JSON.parse(await pending());assert.equal(original.job,create?undefined:jobId);assert.match(original.op,/^[0-9a-f-]{36}$/);
   await signals();assert.deepEqual(calls.slice(start).map(c=>c.action),[create?'create':'change']);
   releaseSave();
   if(lost){
    await expect(unknown()).toBeVisible();await expect(saved()).toHaveCount(0);assert.deepEqual(JSON.parse(await pending()),original);
    await page.reload();await expect(unknown()).toBeEnabled();
     const recovery=unknown();
    await recovery.click();
   }
   if(outcome==='context_failure'){
    await expect(page.getByRole('alert').first()).toBeVisible();
    if(baseline){gaps.push({locale,outcome,phase:'failed-context',confirmedNotice:await saved().count()>0,readRecoveryAvailable:await load().count()>0});cases.push({locale,act,outcome,calls,writes});continue;}
    await expect(saved()).toBeVisible();
    await expect(unknown()).toHaveCount(0);await expect(load()).toBeEnabled();
    assert.equal(await pending(),null);await load().focus();await page.keyboard.press('Enter');
   }
   await expect.poll(()=>readEntered).toBe(true);assert.equal(await pending(),null);assert.equal(writes,1);
   const actualAr=ar;
   const savedText=act!=='activate'?t('Current saved preparation is shown below. Preparation changes no effective date plan.','التجهيز المحفوظ الحالي أدناه. التجهيز لا يغيّر أي خطة تاريخ فعلية.'):actualAr?'حُفظت كل تغييرات التواريخ المراجعة معاً. الخطط المحفوظة لم تتغير.':'All reviewed date changes saved together. Preserved plans are unchanged.';
   const privateText=actualAr?'تجهيز خاص · لا تغييرات فعلية على التواريخ بعد.':'Private preparation · no effective date changes yet.';
   const held={confirmedNotice:await page.getByRole('status').filter({hasText:savedText}).count()>0,
    contradictoryPrivateStatus:!privateCommand&&await page.getByRole('status').filter({hasText:privateText}).count()>0,
    unknownAfterConfirmation:await page.getByRole('button',{name:/^(Check original operation|التحقق من العملية الأصلية)$/}).count()>0};
   if(!held.confirmedNotice||held.contradictoryPrivateStatus||held.unknownAfterConfirmation)gaps.push({locale,outcome,phase:'held-read',...held});
   const before=calls.length;await signals();assert.equal(calls.length,before);
   await page.screenshot({path:join(evidence,`activation-${act}-${locale}-${outcome}-held.png`),fullPage:true});
   releaseRead();
   if(['read_failure','lost_reply','denied_read'].includes(outcome)){
    await expect(page.getByRole('alert').first()).toBeVisible();
    const readButton=page.getByRole('button',{name:/^(Load saved preparation|تحميل التجهيز المحفوظ)$/});
    const recoveryBlocked=outcome!=='denied_read'&&await readButton.count()===0;
    if(recoveryBlocked)gaps.push({locale,outcome,phase:'failed-read',kind:'confirmed-recovery-still-unknown-no-read-action'});
    if(baseline&&recoveryBlocked){cases.push({locale,act,outcome,held,recoveryBlocked,calls,writes});continue;}
    if(outcome==='denied_read'){
     await expect(page.getByRole('list',{name:t('Weekday choices','اختيارات أيام الأسبوع'),exact:true})).toHaveCount(0);
     await expect(readButton).toHaveCount(0);await expect(unknown()).toHaveCount(0);
    }else{
     await expect(readButton).toBeEnabled();await readButton.focus();await page.keyboard.press('Enter');
    }
   }
   if(outcome!=='denied_read'){
    if(cancel)await expect(page.getByText(t('Preparation cancelled. No date changes were applied.','أُلغي التجهيز. لم تُطبق تغييرات على التواريخ.'),{exact:true})).toBeVisible();else if(privateCommand)await expect(privateStatus()).toBeVisible();else await expect(committed()).toBeVisible();if(!privateCommand)await expect(privateStatus()).toHaveCount(0);
    assert.equal(job.version,savedVersion);assert.equal(job.preserved,1);assert.equal(job.prepared,act==='players'||create?0:40);
   }
   const expected=outcome==='context_failure'?['change','reconcile','context','context','read']:outcome==='success'?['change','read','list']:outcome==='read_failure'?['change','read','read']:outcome==='denied_read'?['change','read']:['change','reconcile','context','read','read'];
   if(create)expected[0]='create';await expect.poll(()=>calls.slice(start).map(c=>c.action)).toEqual(expected);assert.equal(writes,1);assert.equal(await pending(),null);assert.deepEqual(errors,[]);
   cases.push({locale,act,outcome,held,actions:expected,job:jobId,original:original.op,reviewedVersion:create?null:7,savedVersion,writes,
    documents:documents.length,errors});
  }catch(error){await writeFile(join(evidence,`activation-${act}-${locale}-${outcome}-failure.json`),JSON.stringify({error:String(error),calls,errors},null,2));throw error;}
  finally{releaseSave();releaseRead();await pc.close();}
 }
 return {baseline,cases,gaps,scope:'actual React component; fictional 40-date reviewed job and HTTP responses; no hosted/SQL activation proof'};
}
