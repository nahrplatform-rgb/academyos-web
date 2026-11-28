// Actual ProgramWorkspace with held fictional HTTP; no database/hosted claims.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const gate=()=>{let release;const promise=new Promise(r=>release=r);return {promise,release};};
export async function checkProgramFollowup({browser,origin,out}) {
 const cases=[];
 for(const locale of ['en','ar'])for(const outcome of ['success','read_failure','lost_final','denied']) {
  const ar=locale==='ar',t=(en,a)=>ar?a:en;
  const context=await browser.newContext({viewport:{width:ar?390:1440,height:950}}),page=await context.newPage();
  const academy='00000000-0000-4000-8000-000000000001',program='00000000-0000-4000-8000-000000000201',key=`academyos:programs:user_A:${academy}`;
  const current={academy_id:academy,academy_name:'Synthetic Academy',branch_id:'00000000-0000-4000-8000-000000000002',branch_name:'Demo branch',sport_name:'Football',sport_name_ar:'كرة القدم',timezone:'Africa/Cairo',version:3};
  const definition={name:'Bounded original',from:'2099-11-01',to:'2099-11-28',rules:[{day:0,start:'17:00',end:'18:00'}]};
  const dates=['01','08','15','22'].map(day=>({date:`2099-11-${day}`,start:'17:00',end:'18:00',utcStart:`2099-11-${day}T15:00:00Z`,utcEnd:`2099-11-${day}T16:00:00Z`}));
  const receipt={through:0,digest:'a'.repeat(64),signature:'b'.repeat(64)};
  const createGate=gate(),finalGate=gate(),readGate=gate(),calls=[],errors=[];
  let record,original,createEntered=false,finalEntered=false,readEntered=false,readFailed=false,creates=0,finalizes=0;
  const b=(en,a)=>page.getByRole('button',{name:t(en,a),exact:true});
  const stored=()=>page.evaluate(k=>JSON.parse(sessionStorage.getItem(k)??'null'),key);
  const signals=()=>page.evaluate(()=>{window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/programs',async route=>{
   const body=route.request().postDataJSON();calls.push(body);assert.equal(body.academy,academy);
   const reply=data=>route.fulfill({json:{data:structuredClone(data)}});
   if(body.action==='list')return reply({context:current,items:[],more:false});
   if(body.action==='preview') {
    assert.deepEqual(body.definition,definition);assert.equal(body.context,3);assert.equal(body.window,0);assert.equal(body.receipt,null);
    return reply({dates,total:4,windows:1,receipt});
   }
   if(body.action==='create') {
    assert.equal(creates,0);assert.deepEqual(body.definition,definition);assert.deepEqual(body.receipt,receipt);assert.equal(body.context,3);
    original=body.op;assert.match(original,/^[a-f0-9-]{36}$/);createEntered=true;await createGate.promise;
    creates++;record={id:program,definition,timezone:current.timezone,state:'preparing',completed:0,prepared:0,version:1,context_version:3,total:4,windows:1,failure:null,failure_date:null};return reply(record);
   }
   assert.equal(body.program,program);
   if(body.action==='step') {
    assert.equal(body.version,record.version);
    if(body.step==='prepare') {assert.equal(record.completed,0);record={...record,completed:1,prepared:4,version:2};return reply(record);}
    assert.equal(body.step,'finalize');assert.equal(record.completed,1);assert.equal(finalizes,0);finalEntered=true;await finalGate.promise;
    finalizes++;record={...record,state:'ready',version:3};if(outcome==='lost_final')return route.abort('failed');return reply(record);
   }
   assert.equal(body.action,'read');assert.equal(body.window,0);readEntered=true;await readGate.promise;
   if(outcome==='denied')return route.fulfill({status:403,json:{error:'denied'}});
   if(['read_failure','lost_final'].includes(outcome)&&!readFailed) {readFailed=true;return route.fulfill({status:503,json:{error:'unavailable'}});}
   return reply({program:record,context:current,dates});
  });
  try {
   await page.goto(`${origin}/?locale=${locale}`);await b('New program','برنامج جديد').click();
   await page.locator('#program-name').fill(definition.name);await page.locator('#program-from').fill(definition.from);await page.locator('#program-to').fill(definition.to);
   await page.getByRole('checkbox',{name:t('Sunday','الأحد'),exact:true}).check();await page.locator('#program-start-0').fill('17:00');await page.locator('#program-end-0').fill('18:00');
   await b('Preview every date','معاينة جميع التواريخ').click();await b('Continue to confirmation','المتابعة إلى التأكيد').click();await page.getByRole('checkbox').check();
   assert.deepEqual(calls.map(c=>c.action),['list','list','preview']);
   await b('Save draft program','حفظ مسودة البرنامج').focus();await page.keyboard.press('Enter');await expect.poll(()=>createEntered).toBe(true);
   await expect(b('Recording request…','جارٍ تسجيل الطلب…')).toBeDisabled();assert.deepEqual(await stored(),{kind:'create',id:original});assert.equal(creates,0);
   await expect(page.getByText(t('Draft ready · Owner only','مسودة جاهزة · للمالك فقط'),{exact:true})).toHaveCount(0);const heldCreate=calls.length;await signals();assert.equal(calls.length,heldCreate);
   createGate.release();await expect.poll(()=>finalEntered,{timeout:10000}).toBe(true);
   assert.equal(creates,1);assert.equal(finalizes,0);assert.equal(record.state,'preparing');assert.equal(record.prepared,4);assert.deepEqual(await stored(),{kind:'step',id:program});
   await expect(page.getByText(t('Draft ready · Owner only','مسودة جاهزة · للمالك فقط'),{exact:true})).toHaveCount(0);await expect(page.locator('.program-desktop-dates')).toHaveCount(0);
   const heldFinal=calls.length;await signals();assert.equal(calls.length,heldFinal);finalGate.release();
   if(outcome==='lost_final') {
    await expect(b('Check original operation','التحقق من العملية الأصلية')).toBeVisible();assert.deepEqual(await stored(),{kind:'step',id:program});
    await page.reload();await expect(b('Check original operation','التحقق من العملية الأصلية')).toBeVisible();assert.equal(calls.filter(c=>c.action==='read').length,0);
    await b('Check original operation','التحقق من العملية الأصلية').focus();await page.keyboard.press('Enter');
   }
   await expect.poll(()=>readEntered).toBe(true);const heldRead=calls.length;await signals();assert.equal(calls.length,heldRead);assert.equal(finalizes,1);
   if(outcome!=='lost_final')assert.equal(await stored(),null);
   assert.equal(await page.locator('.program-dates tbody tr').count(),0);readGate.release();
   if(outcome==='denied') {
    await expect(page.getByRole('alert').first()).toContainText(t('Access unavailable','الصلاحية غير متاحة'));
    await expect(page.getByText(definition.name,{exact:true})).toHaveCount(0);await expect(page.getByText('Demo branch',{exact:false})).toHaveCount(0);assert.equal(await stored(),null);
    await expect(b('Load saved dates','تحميل التواريخ المحفوظة')).toHaveCount(0);await expect(b('Check original operation','التحقق من العملية الأصلية')).toHaveCount(0);
   } else {
    if(outcome==='read_failure') {await expect(b('Load saved dates','تحميل التواريخ المحفوظة')).toBeVisible();await expect(page.getByRole('status')).toContainText(t('Draft ready.','المسودة جاهزة.'));await b('Load saved dates','تحميل التواريخ المحفوظة').focus();await page.keyboard.press('Enter');}
    if(outcome==='lost_final') {await expect(b('Check original operation','التحقق من العملية الأصلية')).toBeEnabled();assert.deepEqual(await stored(),{kind:'step',id:program});await b('Check original operation','التحقق من العملية الأصلية').focus();await page.keyboard.press('Enter');}
    await expect(page.locator('.workspace-task .program-dates tbody tr')).toHaveCount(4);assert.equal(await stored(),null);
    const rendered=await page.locator('.program-dates tbody').innerText();assert.ok(rendered.includes('17:00–18:00'));assert.ok(rendered.includes('Africa/Cairo'));
    const links=await page.locator('.program-dates tbody a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));assert.deepEqual(links,dates.map(d=>`/${locale}/workspace/${academy}/programs/${program}/${d.date}?from=${definition.from}`));
   }
   assert.equal(creates,1);assert.equal(finalizes,1);assert.equal(record.prepared,4);assert.deepEqual(calls.filter(c=>c.action==='step').map(c=>[c.step,c.version]),[['prepare',1],['finalize',2]]);
   const sequence=calls.slice(3).map(c=>c.action==='step'?c.step:c.action);assert.deepEqual(sequence,['create','prepare','finalize','read',...(['read_failure','lost_final'].includes(outcome)?['read']:[])]);assert.deepEqual(errors,[]);
   await page.screenshot({path:join(out,`followup-${locale}-${outcome}.png`),fullPage:true});cases.push({locale,outcome,original,program,creates,finalizes,dates:record.prepared,sequence,errors});
  } finally {createGate.release();finalGate.release();readGate.release();await context.close();}
 }
 await writeFile(join(out,'save-followup.json'),JSON.stringify({cases,scope:'Real React; held fictional HTTP. Not SQL, routed-return, hosted or installed-device proof.'},null,2)+'\n');
 console.log(`PASS program held create/finalize/read: ${cases.length} cases`);
}
