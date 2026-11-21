// Real Next Calendar route and component. Fictional read responses; no backend writes.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {join} from 'node:path';
export async function checkCalendarControls(browser,origin,context,session,{baseline=false,evidence}={}){
 const cases=[],gaps=[];
 for(const locale of ['en','ar']){
  const ar=locale==='ar',pc=await browser.newContext({viewport:{width:1440,height:900}}),page=await pc.newPage();
  const calls=[],errors=[],documents=[],held=[];
  let hold=false,deny=false,incomplete=false;
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.isNavigationRequest()&&r.resourceType()==='document')documents.push(r.url());});
  await page.route('**/api/experience',async route=>{
   const body=route.request().postDataJSON();calls.push(body);
   const reply=()=>route.fulfill({status:deny?403:200,json:deny?{error:'denied'}:{data:{context,as_of:'2026-11-01T12:00:00Z',from:body.from,to:body.to,total:incomplete?70:1,items:[{...session,date:body.from,day:body.from,title:`Fictional ${body.from}`,starts_at:body.from+'T15:00:00Z',ends_at:body.from+'T16:00:00Z'}],more:incomplete,next:incomplete?{date:body.from,id:session.id}:null}}}).catch(()=>{});
   if(hold){let release;const ready=new Promise(r=>release=r);held.push({body,release});await ready;}
   await reply();
  });
  try{
   await page.goto(`${origin}/${locale}/workspace/${context.academy_id}/calendar?anchor=2026-11-01`);
   const rows=page.locator('.experience-session'),search=page.getByRole('searchbox'),date=page.getByLabel(ar?'انتقل إلى تاريخ':'Go to date',{exact:true});
   const month=page.getByRole('button',{name:ar?'شهر':'Month',exact:true}),week=page.getByRole('button',{name:ar?'أسبوع':'Week',exact:true});
   const next=page.getByRole('button',{name:ar?'الفترة التالية':'Next period',exact:true});
   await expect(rows).toHaveCount(1);assert.equal(calls.length,1);
   await search.fill('Fictional');await expect(search).toBeFocused();assert.equal(calls.length,1);
   await month.focus();await page.keyboard.press('Enter');await expect(page.locator('.operations-month-board')).toBeVisible();
   await expect(month).toBeEnabled();assert.equal(calls.length,2);assert.deepEqual([calls[1].from,calls[1].to],['2026-11-01','2026-12-12']);
   await week.click();await expect(week).toBeEnabled();assert.equal(calls.length,3);
   await rows.click();await expect(rows).toHaveAttribute('aria-pressed','true');
   hold=true;await date.fill('2027-02-01');await expect.poll(()=>held.length).toBe(1);
   await expect(page.getByRole('status').filter({hasText:ar?'جارٍ تحميل هذا التقويم…':'Loading this calendar…'})).toBeVisible();
   const pending={dateEnabled:await date.isEnabled(),nextEnabled:await next.isEnabled(),monthEnabled:await month.isEnabled(),dateFocused:await date.evaluate(e=>e===document.activeElement),filter:await search.inputValue(),rows:await rows.count(),selected:await page.locator('.operations-inspection').count()};
   if(!pending.dateEnabled||!pending.nextEnabled||!pending.monthEnabled)gaps.push({locale,kind:'period-and-view-controls-blocked-during-read',pending});
   if(!pending.dateFocused)gaps.push({locale,kind:'date-focus-lost-during-read',pending});
   await page.screenshot({path:join(evidence,`calendar-pending-${locale}.png`),fullPage:true});
   if(baseline){held[0].release();await expect(date).toBeEnabled();cases.push({locale,kind:'baseline',calls,pending});continue;}
   await expect(date).toBeEnabled();await expect(date).toBeFocused();await expect(month).toBeEnabled();
   assert.equal(pending.selected,0,'different period must close the former selection');
   await next.click();await expect.poll(()=>held.length).toBe(2);
   await month.focus();await page.keyboard.press('Enter');await expect.poll(()=>held.length).toBe(3);
   assert.equal(calls.length,6,'one read for each explicit changed selection');
   held[2].release();await expect(page.locator('.operations-month-board')).toBeVisible();await expect(page.locator('.calendar-toolbar')).toHaveAttribute('aria-busy','false');
   await expect(month).toBeFocused();await expect(date).toHaveValue('2027-02-08');await expect(rows).toContainText('Fictional 2027-01-31');
   // Release obsolete requests last, then prove the latest view still wins.
   held[1].release();held[0].release();await page.waitForTimeout(150);
   await expect(rows).toContainText('Fictional 2027-01-31');await expect(date).toHaveValue('2027-02-08');await expect(month).toHaveAttribute('aria-pressed','true');
   await expect(search).toHaveValue('Fictional');assert.equal(documents.length,1);
   hold=false;incomplete=true;await week.click();await expect(page.locator('.calendar-toolbar')).toHaveAttribute('aria-busy','false');
   await expect(page.getByText(ar?'توجد صفحات أخرى':'More pages available',{exact:false})).toBeVisible();
   const beforeFilter=calls.length;await search.fill('no match');await expect(rows).toHaveCount(0);
   await expect(page.getByText(ar?'لا تطابق في هذه الصفحة. امسح البحث أو افحص صفحة أخرى.':'No match on this page. Clear the search or check another page.',{exact:true})).toBeVisible();
   assert.equal(calls.length,beforeFilter);await expect(search).toBeFocused();
   await search.fill('Fictional');deny=true;await next.click();await expect(page.getByRole('alert')).toBeVisible();
   await expect(rows).toHaveCount(0);await expect(page.locator('.operations-inspection')).toHaveCount(0);
   assert.deepEqual(errors,[]);cases.push({locale,kind:'online-controls',pending,calls,documents:documents.length,errors,latestWins:true,loadedPageFilterRequests:0,denialMasked:true});
  }finally{held.forEach(x=>x.release());await pc.close();}
 }
 return {scope:'actual Next production Calendar with fictional identity and controlled read responses; no SQL or hosted proof',baseline,cases,gaps};
}
