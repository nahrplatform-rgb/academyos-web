// Coordinator-owned real-handler regressions. Each variant needs its own fresh
// zero-player academy and browser context; no forged local collection heads.
import assert from 'node:assert/strict';
import {expect} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const EMPTY='No players registered yet. Register the first fictional player.';
const MISSING='Players are not on this device yet.';
const online=page=>page.locator('summary').filter({hasText:/^Online$/});
const actions=(calls,start)=>calls.slice(start).map(call=>call.action);

export async function checkEmptyPreparedRegistration({browser,fixture,ui,base,transferCalls,rpcCalls,
  observe,pass,variant,setPeopleTransferFailure,evidenceDirectory}) {
  assert.ok(['confirmed','lost_reply','transfer_failure'].includes(variant));
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  const route=`${base}/en/workspace/${fixture.academy}/players`;
  const slotKey=`academyos.workspace-slot.v1:user_owner:${fixture.academy}`;
  const name=`Synthetic empty ${variant}`;
  const requests=[],pageErrors=[];
  page.on('request',request=>requests.push(request.url()));
  page.on('pageerror',error=>pageErrors.push(error.message));
  const entryStart={people:ui.calls.length,transfers:transferCalls.length,rpcs:rpcCalls.length};
  let offlineReopening=null,created=null;
  ui.useRealPeople();
  try {
    const before=await observe({academy:fixture.academy});
    assert.equal(before.totalPlayers,0);
    await page.goto(route);
    await expect(page.getByText(EMPTY,{exact:true})).toBeVisible();
    assert.deepEqual(actions(ui.calls,entryStart.people),['list']);
    await page.getByText('Device',{exact:true}).click();
    await page.getByRole('button',{name:'Use this personal device',exact:true}).click();
    await expect(online(page)).toBeVisible({timeout:30000});
    if(await online(page).evaluate(summary=>summary.parentElement.open))await online(page).click();
    await expect(page.getByText(EMPTY,{exact:true})).toBeVisible();
    await expect(page.getByText(MISSING,{exact:true})).toHaveCount(0);
    const head=await page.evaluate(()=>window.inspectPreparedPeople());
    assert.deepEqual(head,{count:0,revision:before.peopleRevision,updating:false,ids:[]});
    assert.deepEqual(actions(transferCalls,entryStart.transfers),
      ['prepare','manifest',...Array(4).fill(['page','complete']).flat()],
      'each of the four genuinely empty collections needs one page and a completion');
    assert.deepEqual(actions(ui.calls,entryStart.people),['list']);
    pass(`Prepared empty ${variant}: a completed zero-row head renders empty,not missing coverage`);

    if(variant==='confirmed') {
      await page.waitForFunction(()=>caches.match('/prepared-workspace/cache-pointer'));
      const offlineStart={people:ui.calls.length,transfers:transferCalls.length,requests:requests.length};
      ui.setNetworkAvailable(false);
      await context.setOffline(true);
      const response=page.waitForResponse(reply=>reply.url()===route&&reply.request().isNavigationRequest());
      await page.reload({waitUntil:'load'});
      assert.equal((await response).fromServiceWorker(),true);
      await expect(page.getByText('Offline',{exact:true})).toBeVisible();
      await expect(page.getByText(EMPTY,{exact:true})).toBeVisible();
      await expect(page.getByText(MISSING,{exact:true})).toHaveCount(0);
      await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeDisabled();
      assert.equal(ui.calls.length,offlineStart.people);
      assert.equal(transferCalls.length,offlineStart.transfers);
      const offlineApiRequests=requests.slice(offlineStart.requests).filter(url=>new URL(url).pathname.startsWith('/api/'));
      assert.deepEqual(offlineApiRequests,[]);
      const restored=page.waitForEvent('framenavigated',frame=>frame===page.mainFrame()&&frame.url()===route);
      ui.setNetworkAvailable(true);
      await context.setOffline(false);
      await restored;
      await expect(online(page)).toBeVisible({timeout:30000});
      await expect(page.getByText(EMPTY,{exact:true})).toBeVisible();
      assert.equal(ui.calls.length,offlineStart.people,'compatible reconnect does not read the online directory again');
      assert.deepEqual(actions(transferCalls,offlineStart.transfers),['manifest']);
      offlineReopening={serviceWorkerDocument:true,operatingRequests:0,unchangedTransferActions:['manifest']};
      pass('A completed empty directory reopens at its normal offline URL and reconnects without another directory read');
    }

    const saveStart={people:ui.calls.length,transfers:transferCalls.length,rpcs:rpcCalls.length};
    if(variant==='lost_reply')ui.loseNextCreateReply();
    if(variant==='transfer_failure')setPeopleTransferFailure(true);
    await page.getByRole('button',{name:'Register player',exact:true}).click();
    await page.getByLabel('Player display name (required)',{exact:true}).fill(name);
    await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();
    await page.getByRole('button',{name:'Save registration',exact:true}).click();
    if(variant==='lost_reply') {
      await expect(page.getByRole('heading',{name:'Save outcome is uncertain',exact:true})).toBeVisible();
      created=ui.registrations.at(-1);
      const committed=await observe({academy:fixture.academy,op:created.body.op});
      assert.equal(committed.totalPlayers,1,'lost reply follows one actual commit');
      assert.deepEqual(actions(ui.calls,saveStart.people),['candidates','create']);
      await page.getByRole('button',{name:'Check original save',exact:true}).click();
    }
    await expect(page.getByText('Registration saved',{exact:true})).toBeVisible();
    await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
    created=ui.registrations.at(-1);
    assert.equal(ui.registrations.length,1,'this isolated academy has one create attempt');
    assert.equal(created.status,200);
    const after=await observe({academy:fixture.academy,op:created.body.op});
    assert.equal(after.totalPlayers,1);
    assert.equal(BigInt(after.peopleRevision),BigInt(before.peopleRevision)+1n);
    assert.deepEqual(after.registration,{operations:1,audits:1,players:1,result:created.result});

    if(variant==='transfer_failure') {
      await expect(page.getByText('Sync paused',{exact:true})).toBeVisible();
      assert.deepEqual(await page.evaluate(()=>window.inspectPreparedPeople()),{...head,updating:true},
        'the failed replacement must not publish partial rows over the old complete empty head');
      await expect(page.getByText('Registration saved',{exact:true})).toBeVisible();
      await expect(page.getByText('Showing the last downloaded directory. Recent changes are not available here yet.',{exact:true})).toBeVisible();
      await expect(page.getByText(EMPTY,{exact:true})).toHaveCount(0);
      await mkdir(evidenceDirectory,{recursive:true});
      await page.screenshot({path:join(evidenceDirectory,'transfer-paused-en.png'),fullPage:true});
      await page.getByRole('link',{name:'العربية',exact:true}).click();
      await expect(page.getByText('حُفظ التسجيل',{exact:true})).toBeVisible();
      await expect(page.getByText('تُعرض آخر نسخة منزّلة من قائمة اللاعبين. التغييرات الأخيرة غير متاحة هنا بعد.',{exact:true})).toBeVisible();
      await page.screenshot({path:join(evidenceDirectory,'transfer-paused-ar.png'),fullPage:true});
      await page.getByRole('link',{name:'English',exact:true}).click();
      await page.getByRole('button',{name:'Back to players',exact:true}).click();
      await expect(page.getByText('The downloaded directory has not updated yet. Check for changes.',{exact:true})).toBeVisible();
      await expect(page.getByText(EMPTY,{exact:true})).toHaveCount(0);
      const slot=await page.evaluate(key=>localStorage.getItem(key),slotKey);
      await page.reload();
      await expect(page.getByText('Sync paused',{exact:true})).toBeVisible();
      await expect(page.getByText('The downloaded directory has not updated yet. Check for changes.',{exact:true})).toBeVisible();
      await expect(page.getByText(EMPTY,{exact:true})).toHaveCount(0);
      assert.equal(await page.evaluate(key=>localStorage.getItem(key),slotKey),slot);
      assert.deepEqual(await page.evaluate(()=>window.inspectPreparedPeople()),{...head,updating:true});
      pass('A failed changed-directory transfer retains its old head and pending state through reload without claiming no registration');
      setPeopleTransferFailure(false);
      const check=page.getByRole('button',{name:'Check for changes',exact:true});
      if(!await check.isVisible())await page.getByText('Sync paused',{exact:true}).click();
      await check.click();
    }else{
      await page.getByRole('button',{name:'Back to players',exact:true}).click();
    }
    const rows=page.locator('table.workspace-table tbody tr');
    await expect(rows).toHaveCount(1,{timeout:20000});
    await expect(rows.getByRole('button',{name,exact:true})).toHaveCount(1);
    await expect(rows.getByRole('button',{name,exact:true})).toBeVisible();
    await expect(page.locator('.directory-page-summary')).toHaveText('1 player on this page');
    await expect(page.getByText(EMPTY,{exact:true})).toHaveCount(0);
    await expect(online(page)).toBeVisible({timeout:30000});
    assert.deepEqual(await page.evaluate(()=>window.inspectPreparedPeople()),
      {count:1,revision:after.peopleRevision,updating:false,ids:[created.result.player_id]});
    await expect(page.getByText('Showing the last downloaded directory. Recent changes are not available here yet.',{exact:true})).toHaveCount(0);
    await page.locator('#player-search').fill('No matching synthetic player');
    await expect(page.getByText('No matching players. Try another name.',{exact:true})).toBeVisible();
    await expect(page.getByText('The downloaded directory has not updated yet. Check for changes.',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'Clear search',exact:true}).click();
    await expect(rows.getByRole('button',{name,exact:true})).toBeVisible();
    const expectedActions=variant==='lost_reply'?['candidates','create','reconcile','profile']:['candidates','create','profile'];
    assert.deepEqual(actions(ui.calls,saveStart.people),expectedActions,
      'the prepared directory requires no extra online list or replacement create');
    const expectedTransfers=variant==='transfer_failure'?['manifest','page','manifest','page','manifest','page','complete']:['manifest','page','complete'];
    assert.deepEqual(actions(transferCalls,saveStart.transfers),expectedTransfers);
    const calls=rpcCalls.slice(saveStart.rpcs);
    assert.equal(calls.filter(call=>call.rpc==='i2_register_v1'&&call.op===created.body.op).length,1);
    assert.equal(calls.filter(call=>call.rpc==='i2_operation_v1'&&call.op===created.body.op).length,variant==='lost_reply'?1:0);
    assert.equal(calls.filter(call=>call.rpc==='i2_people_v1').length,0);
    assert.deepEqual(pageErrors,[]);
    pass(`Prepared empty ${variant}: first registration is discoverable with one original,one audit and no online list`);
    return {variant,initial:before,final:after,offlineReopening,peopleActions:expectedActions,
      transferActions:actions(transferCalls,saveStart.transfers),originalIdForwarded:true,
      originalReconciled:variant==='lost_reply',oneCanonicalResult:true,pageErrors};
  }catch(error){
    await mkdir(evidenceDirectory,{recursive:true});
    await page.screenshot({path:join(evidenceDirectory,`${variant}-failure.png`),fullPage:true}).catch(()=>{});
    await writeFile(join(evidenceDirectory,`${variant}-failure.json`),JSON.stringify({variant,message:String(error),
      peopleActions:actions(ui.calls,entryStart.people),transferActions:actions(transferCalls,entryStart.transfers),
      canonical:await observe({academy:fixture.academy,...(created?{op:created.body.op}:{})}).catch(()=>null),
      text:await page.locator('body').innerText().catch(()=>''),pageErrors},null,2)+'\n');
    throw error;
  }finally{
    setPeopleTransferFailure(false);ui.setNetworkAvailable(true);ui.useRealPeople(false);await context.close();
  }
}
