// Real QR component; held fictional HTTP. No camera, database or hosted proof.
import {writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
export async function runQrFollowup(h) {
 const {page,expect,assert,url,out,reactMode,a,ev,ev2,player,token,b,ins,calls,reset,state,seed,flags}=h;
 const cases=[],gaps=[];
 const baseline=process.env.QR_BASELINE==='1';
 const gate=()=>{let release;const promise=new Promise(r=>release=r);return {promise,release};};
 for(const kind of ['issue','replace','revoke','scan','academy','session'])for(const locale of ['en','ar'])for(const scenario of ['success','read503','lost','denied']) {
  const ar=locale==='ar',t=(en,arabic)=>ar?arabic:en,view=['issue','replace','revoke'].includes(kind)?'card':kind==='scan'?'scan':'settings';
  await reset(view);seed(kind);
  await page.setViewportSize({width:ar?390:1440,height:1000});
  await page.goto(`${url}/${locale}?view=${view}`);
  const start=calls.length;
  if(view==='card') {await b(kind==='issue'?t('Issue card','إصدار بطاقة'):t('Replace card','استبدال البطاقة')).waitFor();await b(kind==='issue'?t('Issue card','إصدار بطاقة'):kind==='revoke'?t('Revoke card','إلغاء البطاقة'):t('Replace card','استبدال البطاقة')).click();}
  else if(view==='settings') {
   await page.getByRole('spinbutton',{name:t('Minutes before start','دقائق قبل البداية'),exact:true}).fill('45');
   if(kind==='session'){await page.getByRole('combobox',{name:t('Apply window to','نطاق تطبيق النافذة'),exact:true}).selectOption(ev);await page.getByRole('spinbutton',{name:t('Minutes before start','دقائق قبل البداية'),exact:true}).fill('45');}
   await b(t('Review window settings','مراجعة إعدادات النافذة')).click();
  } else {await b(t('Open scanner','فتح الماسح')).click();await page.getByRole('textbox',{name:t('Card code fallback','بديل رمز البطاقة'),exact:true}).fill(token);}
  // Issue starts with an inactive versioned card, preserving the same explicit review path.
  if(view!=='scan')await page.getByRole('checkbox').check();
  const writeAction=view==='card'?'card_change':view==='settings'?'window_change':'capture';
  const protocol=[];
  const writeGate=gate(),readGate=gate();let writeSeen,readSeen,armed=false,holdRead=true,readFailure=scenario==='read503'||scenario==='lost',deny=scenario==='denied';
  const sawWrite=new Promise(r=>writeSeen=r),sawRead=new Promise(r=>readSeen=r);
  const intercept=async route=>{const body=route.request().postDataJSON();protocol.push(body.action);if(body.action===writeAction){writeSeen(body);await writeGate.promise;armed=true;return route.fallback();}if(armed&&['card','context','sessions'].includes(body.action)){if(holdRead){readSeen(body);await readGate.promise;}if(deny)return route.fulfill({status:403,contentType:'application/json',body:'{"error":"denied"}'});if(readFailure)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"unavailable"}'});}return route.fallback();};
  await page.route('**/api/qr',intercept);
  try {
   if(scenario==='lost')flags({lost:true});
   const confirm=b(view==='card'?t('Confirm card change','تأكيد تغيير البطاقة'):view==='settings'?t('Confirm window settings','تأكيد إعدادات النافذة'):t('Read card code','قراءة رمز البطاقة'));
   await confirm.focus();await page.keyboard.press('Enter');const sent=await sawWrite;
   assert.equal(sent.academy,a);if(view!=='scan')assert.equal(sent.version,7);assert.equal(state().writes,0);await expect(b(t('Check original operation','تحقق من العملية الأصلية'))).toBeDisabled();
   if(view==='card'){assert.equal(sent.player,player);assert.equal(sent.choice,kind==='revoke'?'revoke':kind==='issue'?'issue':'replace');}
   if(view==='settings'){assert.equal(sent.event,kind==='session'?ev:null);assert.equal(sent.before,45);assert.equal(sent.after,30);}
   if(view==='scan'){assert.deepEqual(sent.events,[ev,ev2]);assert.equal(sent.code,token);}
   const original=await page.evaluate(()=>Object.values(sessionStorage).find(v=>v.includes('"op"')));assert.ok(original?.includes(sent.op));assert.ok(!original.includes(token));assert.deepEqual(Object.keys(JSON.parse(original)).sort(),['context','kind','op','target']);
   assert.equal(await page.getByText(t('Saving… awaiting confirmation','جارٍ الحفظ… بانتظار التأكيد'),{exact:true}).count(),1);
   writeGate.release();
   if(scenario==='lost') {
    await expect(b(t('Check original operation','تحقق من العملية الأصلية'))).toBeEnabled();await page.reload();
    assert.ok((await page.evaluate(()=>Object.values(sessionStorage).join(''))).includes(sent.op));const before=calls.length;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(calls.length,before);
    const check=b(t('Check original operation','تحقق من العملية الأصلية'));await check.focus();await page.keyboard.press('Enter');
   }
   await sawRead;
   const confirmed=t('Operation confirmed. Loading current saved data…','تأكدت العملية. جارٍ تحميل البيانات المحفوظة الحالية…');
   const known=await page.getByText(confirmed,{exact:true}).count();
   if(baseline){if(!known)gaps.push({kind,locale,scenario,missing:'known confirmation during held current read'});}else {await expect(page.getByText(confirmed,{exact:true})).toBeVisible();assert.equal(await page.getByText(t('Current saved data could not be loaded. This is not an empty result.','تعذر تحميل البيانات الحالية. هذه ليست نتيجة فارغة.'),{exact:true}).count(),0);}
   assert.equal(await page.evaluate(()=>sessionStorage.length),0);assert.equal(state().writes,1);
   const requests=calls.length;await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));window.dispatchEvent(new Event('online'));document.dispatchEvent(new Event('visibilitychange'));});assert.equal(calls.length,requests);
   holdRead=false;readGate.release();
   if(deny){await expect(page.getByText(t('Access unavailable. Private details cleared.','الوصول غير متاح. أُزيلت التفاصيل الخاصة.'),{exact:true}).first()).toBeVisible();await expect(page.locator('body')).not.toContainText('Alex Demo');await expect(page.locator('body')).not.toContainText('Main Demo Branch');}
   else {
    let unavailableRecovery=false;
    if(readFailure){await expect(page.getByRole('alert').first()).toBeVisible();const retry=b(t('Load saved result','تحميل النتيجة المحفوظة'));if(baseline&&await retry.count()===0){gaps.push({kind,locale,scenario,missing:'read-only saved-result recovery'});unavailableRecovery=true;}else{await expect(retry).toBeEnabled();if(!baseline){await expect(page.getByText(t('Operation confirmed. Current saved data could not be loaded.','تأكدت العملية. تعذر تحميل البيانات المحفوظة الحالية.'),{exact:true})).toBeVisible();await expect(page.locator('body')).not.toContainText('Check its original outcome before a replacement');}if(ar&&kind==='replace')await page.screenshot({path:resolve(out,`followup-${reactMode}-ar-failed.png`),fullPage:true});readFailure=false;await retry.focus();await page.keyboard.press('Enter');}}
    if(unavailableRecovery){}
    else if(view==='card')await expect(b(kind==='revoke'?t('Issue card','إصدار بطاقة'):t('Replace card','استبدال البطاقة'))).toBeEnabled();
    else if(view==='settings')await expect(page.getByRole('spinbutton',{name:t('Minutes before start','دقائق قبل البداية'),exact:true})).toHaveValue('45');
    else await expect(ins).toContainText(t('Saved. Ready for the next card.','حُفظ. جاهز للبطاقة التالية.'));
   }
   const firstRead=view==='card'?'card':'context',reads=view==='card'?['card']:['context','sessions'];
   const expected=[...(view==='scan'?['resolve']:[]),writeAction,...(scenario==='lost'?['reconcile']:[])];
   if(scenario==='denied')expected.push(firstRead);else if(scenario==='read503'||scenario==='lost'){expected.push(firstRead);if(!(baseline&&scenario==='lost'&&view!=='card'))expected.push(...reads);}else expected.push(...reads);
   await expect.poll(()=>protocol).toEqual(expected);
   assert.equal(state().writes,1);assert.equal(calls.slice(start).filter(c=>c.action===writeAction).length,1);
   if(scenario==='lost')assert.equal(calls.slice(start).filter(c=>c.action==='reconcile').at(-1).op,sent.op);
   if(view==='card')assert.equal(state().cardVersion,8);else if(view==='settings')assert.equal(state().settings.version,8);else assert.equal(state().version,8);
   if(ar&&scenario==='read503'&&kind==='replace')await page.screenshot({path:resolve(out,`followup-${reactMode}-ar.png`),fullPage:true});
   cases.push({kind,locale,scenario,effects:state().writes,protocol});
  }finally{writeGate.release();readGate.release();await page.unroute('**/api/qr',intercept);}
 }
 await writeFile(resolve(out,`followup-${reactMode}.json`),JSON.stringify({status:baseline?'negative-control':'passed',cases,gaps,scope:'Real component with fictional HTTP; no SQL, physical-camera or hosted proof'},null,2)+'\n');
 if(baseline)assert.ok(gaps.length>0);else assert.equal(gaps.length,0);
 console.log(`PASS QR follow-up ${cases.length} cases; ${gaps.length} gaps; ${reactMode}`);
}
