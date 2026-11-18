// Prepared Calendar reads the actual encrypted repository populated by the signed transfer fixture.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
export async function checkPreparedCalendarControls({page,scope,ui,transferCalls}){
 const cases=[];
 for(const locale of ['en','ar']){
  const ar=locale==='ar';
  await page.goto(scope(locale,'calendar?anchor=2099-11-01'));
  await expect(page.locator('[data-occurrence]').first()).toBeVisible();
  await expect(page.locator('summary').filter({hasText:ar?'متصل':'Online'})).toBeVisible();
  const start={reads:ui.calls.length,transfers:transferCalls.length};
  const search=page.getByRole('searchbox'),date=page.getByLabel(ar?'انتقل إلى تاريخ':'Go to date',{exact:true});
  const month=page.getByRole('button',{name:ar?'شهر':'Month',exact:true}),week=page.getByRole('button',{name:ar?'أسبوع':'Week',exact:true});
  await search.fill('no matching fixture');await expect(page.locator('[data-occurrence]')).toHaveCount(0);await expect(search).toBeFocused();
  await page.getByRole('button',{name:ar?'مسح البحث':'Clear search',exact:true}).click();
  await expect(page.locator('[data-occurrence]').first()).toBeVisible();
  await month.focus();await page.keyboard.press('Enter');await expect(page.locator('.operations-month-board')).toBeVisible();
  await week.click();await expect(page.locator('.operations-month-board')).toHaveCount(0);
  await date.fill('2099-11-08');await expect(date).toHaveValue('2099-11-08');await expect(page.locator('[data-occurrence]').first()).toBeVisible();
  const rememberedPath=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('academyos.workspace-launch.v1')??'null')?.path);
  await expect.poll(rememberedPath).toBe(new URL(scope(locale,'calendar?anchor=2099-11-08')).pathname+'?anchor=2099-11-08');
  await page.getByRole('button',{name:ar?'الفترة السابقة':'Previous period',exact:true}).click();await expect(date).toHaveValue('2099-11-01');
  await expect(page.locator('[data-occurrence]').first()).toBeVisible();
  await expect.poll(rememberedPath).toBe(new URL(scope(locale,'calendar?anchor=2099-11-01')).pathname+'?anchor=2099-11-01');
  assert.equal(ui.calls.length,start.reads,'covered filter/view/period controls require zero operating reads');
  assert.equal(transferCalls.length,start.transfers,'covered controls require no additional transfer');
  cases.push({locale,operatingReads:0,transfers:0,keyboardMonth:true,filterFocus:true,coveredPeriod:true});
 }
 // Restore the existing AR case and selected occurrence before the remaining suite.
 await page.goto(scope('ar','calendar?anchor=2099-11-01'));
 await expect(page.locator('[data-occurrence]').first()).toBeVisible();
 await page.locator('[data-occurrence]').first().click();
 return cases;
}
