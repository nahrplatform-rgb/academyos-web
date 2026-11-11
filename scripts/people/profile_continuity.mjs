import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {expect} from '@playwright/test';

// Actual People React component; this isolated transport is not database,
// provider-session or hosted proof. It never shares the original test's calls.
export async function checkProfileContinuity({browser,url,evidence,reactMode,baseline=false,menuBaseline=false}) {
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),calls=[],errors=[];
 const rows=Array.from({length:18},(_,i)=>({id:`00000000-0000-4000-8000-${String(i+10).padStart(12,'0')}`,
  display_name:i===0?'Alex Demo':`Fictional Player ${i}`,branch_name:'Main Demo Branch',contact_email:`contact${i}@example.invalid`}));
 let holdNext=false,pending=null,profileStatus=200;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/people',async route=>{
  const body=route.request().postDataJSON();calls.push(body);
  let status=body.action==='profile'?profileStatus:200;
  if(body.action==='profile'&&holdNext){holdNext=false;status=await new Promise(release=>{pending={body,release};});}
  if(status!==200){await route.fulfill({status,json:{error:status===401||status===403?'denied':'unavailable'}});return;}
  let data;
  if(body.action==='list')data={academy_name:'Synthetic A',branch_id:'00000000-0000-4000-8000-000000000002',branch_name:'Main Demo Branch',
   items:rows.filter(row=>row.display_name.toLowerCase().startsWith(body.query?.toLowerCase()||'')).map(({contact_email,...row})=>row),more:false};
  else if(body.action==='profile')data=rows.find(row=>row.id===body.player);
  else throw new Error(`Unexpected continuity action ${body.action}`);
  await route.fulfill({json:{data}});
 });
 const nameInput=()=>page.getByRole('textbox',{name:'Find a player by name',exact:true});
 const back=()=>page.getByRole('button',{name:'Back to players',exact:true});
 async function startHeld(name){pending=null;holdNext=true;await page.getByRole('button',{name,exact:true}).click();await expect.poll(()=>Boolean(pending)).toBe(true);return pending;}
 async function directory(){await expect(page.locator('tbody tr')).toHaveCount(18);await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeEnabled();}
 const checks=[];await mkdir(evidence,{recursive:true});
 try {
  await page.goto(url);await directory();
  const layout=page.locator('details.layout-menu').first(),summary=layout.locator('summary');
  const geometry=await page.locator('tbody tr').first().evaluate(row=>({rowHeight:row.getBoundingClientRect().height,
   paddingBlock:getComputedStyle(row.firstElementChild).paddingBlock,buttonHeight:row.querySelector('button').getBoundingClientRect().height}));
  if(menuBaseline){const start=calls.length;await summary.click();await page.keyboard.press('Escape');
   const stillOpenAfterEscape=await layout.evaluate(el=>el.open);
   await page.getByRole('heading',{name:'Players',exact:true}).click();
   const stillOpenAfterOutside=await layout.evaluate(el=>el.open);
   await page.screenshot({path:resolve(evidence,'before-menu-en.png'),fullPage:true});
   const result={menuBaseline:true,reactMode,geometry,stillOpenAfterEscape,stillOpenAfterOutside,operatingRequests:calls.length-start};
   await writeFile(resolve(evidence,'before-menu.json'),JSON.stringify(result,null,2)+'\n');return result;}
  if(!baseline){const menuStart=calls.length;
  await summary.click();await expect(layout).toHaveAttribute('open','');
  await page.keyboard.press('Escape');await expect(layout).not.toHaveAttribute('open','');await expect(summary).toBeFocused();
  await summary.click();await page.getByRole('heading',{name:'Players',exact:true}).click();await expect(layout).not.toHaveAttribute('open','');
  assert.equal(calls.length,menuStart,'menu dismissal has zero operating requests');
  checks.push('toolbar menu closes with Escape/outside press and restores keyboard opener');
  assert.equal(geometry.paddingBlock,'8px');assert.ok(geometry.buttonHeight>=44);
  for(const language of ['en','ar']){
   if(language==='ar')await page.getByRole('link',{name:'العربية',exact:true}).click();
   for(const width of [320,360,390,768,1440]){
    await page.setViewportSize({width,height:1000});await summary.click();
    const rect=await layout.locator(':scope > div').boundingBox();
    assert.ok(rect.x>=-1&&rect.x+rect.width<=width+1,`${language}${width} menu stays inside viewport`);
    await page.keyboard.press('Escape');await expect(summary).toBeFocused();
   }
  }
  await page.getByRole('link',{name:'English',exact:true}).click();
  await page.getByRole('button',{name:'Dark mode',exact:true}).click();await summary.click();await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();await page.getByRole('button',{name:'Light mode',exact:true}).click();
  assert.equal(calls.length,menuStart,'layout/theme/locale menu checks have zero operating requests');
  checks.push('8px desktop rows retain44px targets;EN/AR menus fit320/360/390/768/1440 and dismiss in Charcoal');}
  await page.locator('tbody tr').first().evaluate(el=>el.dataset.continuityProbe='checked-row');
  await page.getByRole('button',{name:'Fictional Player 17',exact:true}).scrollIntoViewIfNeeded();
  const scrollBefore=await page.locator('.workspace-center').evaluate(el=>el.scrollTop);
  await page.evaluate(()=>{
   const tbody=document.querySelector('tbody');
   window.profileProbe={started:performance.now(),minimumRows:tbody.children.length,blankStarted:null,blankMs:0};
   window.profileObserver=new MutationObserver(()=>{const p=window.profileProbe,n=tbody.children.length;p.minimumRows=Math.min(p.minimumRows,n);
    if(n===0&&p.blankStarted===null)p.blankStarted=performance.now();
    if(n>0&&p.blankStarted!==null){p.blankMs+=performance.now()-p.blankStarted;p.blankStarted=null;}});
   window.profileObserver.observe(tbody,{childList:true});
  });
  const firstStart=calls.length,first=await startHeld('Fictional Player 17');
  // Deliberately keep a known response open to measure presentation, not to
  // conceal a race or infer a network percentile from a synthetic delay.
  await page.waitForTimeout(250);
  const held=await page.evaluate(()=>{const p=window.profileProbe;return{rows:document.querySelectorAll('tbody tr').length,
   minimumRows:p.minimumRows,blankMs:p.blankMs+(p.blankStarted===null?0:performance.now()-p.blankStarted),
   centerScroll:document.querySelector('.workspace-center').scrollTop,backDisabled:[...document.querySelectorAll('button')].find(b=>b.textContent==='Back to players')?.disabled};});
  await page.screenshot({path:resolve(evidence,baseline?'before-held-en.png':'held-en.png'),fullPage:true});
  if(baseline){first.release(200);const result={reactMode,baseline:true,held,scrollBefore,requests:calls.slice(firstStart).map(c=>c.action),scope:'Synthetic held response;not latency percentile'};
   await writeFile(resolve(evidence,'before.json'),JSON.stringify(result,null,2)+'\n');return result;}
  assert.equal(held.rows,18);assert.equal(held.minimumRows,18);assert.equal(held.blankMs,0);
  assert.ok(Math.abs(held.centerScroll-scrollBefore)<=2,'profile opening preserves list scroll');
  await expect(page.locator('tbody tr').first()).toHaveAttribute('data-continuity-probe','checked-row');
  await expect(back()).toBeEnabled();await expect(nameInput()).toBeEnabled();
  assert.deepEqual(calls.slice(firstStart).map(c=>c.action),['profile']);
  checks.push('held initial profile retains18same DOM rows/scroll;one profile read and zero list reads');
  await page.getByRole('link',{name:'العربية',exact:true}).click();
  await expect(page.locator('tbody tr')).toHaveCount(18);
  await expect(page.getByText('جارٍ تحميل الملف…',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'العودة للاعبين',exact:true})).toBeEnabled();
  await page.screenshot({path:resolve(evidence,'held-ar.png'),fullPage:true});
  await page.getByRole('link',{name:'English',exact:true}).click();
  await back().click();await expect(page.getByRole('button',{name:'Fictional Player 17',exact:true})).toBeFocused();
  first.release(403);await directory();
  await expect(page.getByRole('heading',{name:'Access unavailable',exact:true})).toHaveCount(0);
  assert.equal(calls.length-firstStart,1,'Back and locale do not add a list read');
  checks.push('EN/AR pending Back restores opener;cancelled late refusal cannot replace the task');

  const raceStart=calls.length,older=await startHeld('Alex Demo');
  await page.getByRole('button',{name:'Fictional Player 17',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Fictional Player 17',exact:true})).toBeVisible();
  older.release(200);
  await expect(page.getByText('contact17@example.invalid',{exact:true})).toBeVisible();
  await expect(page.getByText('contact0@example.invalid',{exact:true})).toHaveCount(0);
  assert.deepEqual(calls.slice(raceStart).map(c=>c.action),['profile','profile']);
  checks.push('rapid row replacement fences the cancelled profile;two intentional profile reads');
  await back().click();

  const searchStart=calls.length,searched=await startHeld('Alex Demo');
  await nameInput().fill('Alex');
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Current task',exact:true})).toBeVisible();
  searched.release(200);await expect(nameInput()).toHaveValue('Alex');
  await expect(nameInput()).toBeFocused();
  assert.deepEqual(calls.slice(searchStart).map(c=>c.action),['profile','list']);
  checks.push('typing during profile load cancels obsolete detail;one debounced directory search');
  await page.getByRole('button',{name:'Clear search',exact:true}).click();await directory();

  profileStatus=503;const failureStart=calls.length;
  await page.getByRole('button',{name:'Alex Demo',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Could not load the current view. Try again.');
  await expect(page.locator('tbody tr')).toHaveCount(18);
  await expect(page.getByText('contact0@example.invalid',{exact:true})).toHaveCount(0);
  profileStatus=200;await page.getByRole('button',{name:'Retry loading profile',exact:true}).click();
  await expect(page.getByText('contact0@example.invalid',{exact:true})).toBeVisible();
  assert.deepEqual(calls.slice(failureStart).map(c=>c.action),['profile','profile']);
  checks.push('failed secondary read keeps directory,clears detail;one read retry and no create');
  await back().click();

  const deniedStart=calls.length,current401=await startHeld('Alex Demo');current401.release(401);
  await expect(page.getByRole('heading',{name:'Sign-in required',exact:true})).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await expect(page.getByText('contact0@example.invalid',{exact:true})).toHaveCount(0);
  assert.deepEqual(calls.slice(deniedStart).map(c=>c.action),['profile']);
  checks.push('current profile401 still masks directory and detail;not role loss');
  await page.reload();await directory();
  profileStatus=403;await page.getByRole('button',{name:'Alex Demo',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Access unavailable',exact:true})).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(0);
  await expect(page.getByText('contact0@example.invalid',{exact:true})).toHaveCount(0);
  checks.push('current profile403 still fences all private data');
  profileStatus=200;await page.reload();await directory();

  await page.setViewportSize({width:360,height:800});
  const phoneStart=calls.length,phoneHeld=await startHeld('Alex Demo');
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:resolve(evidence,'held-en-360.png'),fullPage:true});
  await page.keyboard.press('Escape');await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Alex Demo',exact:true})).toBeFocused();
  phoneHeld.release(200);assert.equal(calls.length-phoneStart,1);
  checks.push('360px pending detail uses native dialog;Escape returns without extra reads');
  assert.deepEqual(errors,[]);
  const result={reactMode,baseline:false,geometry,held,scrollBefore,checks,requestActions:calls.map(c=>c.action),creates:0,errors,
   scope:'Actual React/Chromium;controlled18-player HTTP transport,not database/provider/hosted proof'};
  await writeFile(resolve(evidence,`profile-${reactMode}.json`),JSON.stringify(result,null,2)+'\n');
  return result;
 } finally {if(pending)pending.release(200);await context.close();}
}
