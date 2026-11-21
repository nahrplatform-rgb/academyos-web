// EX-21: real product components and API, signed disposable PostgreSQL RPCs.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {chromium, expect} from '@playwright/test';
import {ownerFixture} from './owner_fixture.mjs';

const root = resolve(import.meta.dirname, '../..');
const temp = await mkdtemp(join(tmpdir(), 'academyos-billing-day-'));
let fixture, browser;
try {
  fixture = await ownerFixture(root, temp, {reviews:true, familyDay:true, billing:true});
  browser = await chromium.launch();
  for (const [index, locale] of ['en', 'ar'].entries()) {
    const {academy, child, link, siblingLink} = fixture.data.familyDays[index];
    const foreign = fixture.data.familyDays[1-index];
    const base = `${fixture.origin}/${locale}/workspace/${academy}`;
    const t = (en, ar) => locale === 'ar' ? ar : en;
    async function actor(role) {
      const context = await browser.newContext({viewport:{width:1440,height:1000}, acceptDownloads:true});
      await context.addCookies([{name:'family-day-actor',value:'user_'+role,url:fixture.origin}]);
      return context.newPage();
    }
    const owner = await actor('owner'), payer = await actor('guardian'), outsider = await actor('other_owner');
    const errors = [];
    for (const page of [owner,payer,outsider]) page.on('pageerror', error => errors.push(error.message));
    async function api(page, payload, expected=200) {
      const response = await page.request.post(`${fixture.origin}/api/billing`, {headers:{origin:fixture.origin},data:{academy,...payload}});
      const json = await response.json();
      assert.equal(response.status(), expected, JSON.stringify({action:payload.action,json}));
      return json.data;
    }
    async function command(page, action, click) {
      const pending = page.waitForResponse(response => new URL(response.url()).pathname === '/api/billing' && response.request().postDataJSON()?.action === action);
      await click.click();
      const response = await pending, result = await response.json();
      assert.ok(response.ok() && result.data && !result.data.error, JSON.stringify({action,result}));
      if(action!=='preview') {
        await expect(page.getByText(t('Loading or saving…','جارٍ التحميل أو الحفظ…'))).toHaveCount(0);
        await expect(page.getByRole('button',{name:t('Check original operation','تحقق من العملية الأصلية'),exact:true})).toHaveCount(0);
      }
      return result.data;
    }
    const button = (page,en,ar) => page.getByRole('button',{name:t(en,ar),exact:true});
    // A relationship alone, foreign child, and foreign academy must not grant finance access.
    await api(payer, {action:'statement',link}, 403);
    await api(payer, {action:'statement',link:siblingLink}, 403);
    await api(payer, {action:'statement',link:foreign.link}, 403);
    await api(outsider, {action:'players'}, 403);
    const selects=new Set(['Player','Verified guardian','Bill','Bill to credit','Allocation to unapply','Child','Method']);
    const field = (page,en,ar) => selects.has(en) ? page.getByRole('combobox',{name:t(en,ar),exact:true}) : page.getByLabel(t(en,ar),{exact:true});
    await owner.goto(base+'/billing');
    await field(owner,'Player','اللاعب').selectOption(child);
    await expect(field(owner,'Verified guardian','ولي الأمر المتحقق منه').locator(`option[value="${link}"]`)).toHaveCount(1);
    await field(owner,'Verified guardian','ولي الأمر المتحقق منه').selectOption(link);
    await command(owner,'grant',button(owner,'Enable billing access','تفعيل صلاحية الفواتير'));
    async function assign(start, amount) {
      await field(owner,'Effective from','ساري من').fill(start);
      await field(owner,'Monthly fee','الرسوم الشهرية').fill(amount);
      return command(owner,'assign',button(owner,'Assign fee','تعيين الرسوم'));
    }
    await assign('2026-04-16','1200');
    await assign('2026-05-01','1500');
    async function totals(expected) {
      assert.deepEqual((await api(owner,{action:'statement',link})).totals,expected);
    }
    async function issue(month, expected) {
      await field(owner,'Month','الشهر').fill(month);
      const preview=await command(owner,'preview',button(owner,'Preview bill','معاينة الفاتورة'));
      assert.equal(preview.amount,expected);
      const dates=month==='2026-04' ? ['2026-04-16','2026-04-30','2026-04-30'] : ['2026-05-01','2026-05-31','2026-05-31'];
      assert.deepEqual([preview.start,preview.end,preview.due],dates);
      const issued=await command(owner,'issue',button(owner,'Issue bill','إصدار الفاتورة'));
      await api(owner,{action:'issue',player:child,link,month,review:preview.review,operation:randomUUID()},409);
      return issued.id;
    }
    const april=await issue('2026-04',60000), may=await issue('2026-05',150000);
    await totals({due:210000,unapplied:0,net:0}); // L01
    const issuedStatement=await api(owner,{action:'statement',link});
    for(const [id,start,end,due] of [[april,'2026-04-16','2026-04-30','2026-04-30'],[may,'2026-05-01','2026-05-31','2026-05-31']]) {
      const bill=issuedStatement.items.find(row=>row.id===id);
      assert.ok(bill);
      assert.deepEqual([bill.start,bill.end,bill.due],[start,end,due]);
    }
    async function receipt(value, allocs, drop=false) {
      await field(owner,'Date received','تاريخ الاستلام').fill('2026-05-20');
      await field(owner,'Method','الطريقة').selectOption(drop?'bank':'cash');
      if(drop) {
        await field(owner,'Reference','المرجع').fill('');
        await field(owner,'Receipt amount','مبلغ الإيصال').fill(value);
        await field(owner,'I verified receipt of these funds','تحققت من استلام هذه الأموال').check();
        await expect(button(owner,'Review receipt','مراجعة الإيصال')).toBeDisabled();
      }
      await field(owner,'Reference','المرجع').fill('Fictional receipt '+value);
      await field(owner,'Receipt amount','مبلغ الإيصال').fill(value);
      // Clear the previous explicit allocations.
      while(await button(owner,'Remove allocation','إزالة التوزيع').count()) await button(owner,'Remove allocation','إزالة التوزيع').first().click();
      for (const [id,amount] of allocs) {
        await button(owner,'Add allocation','إضافة توزيع').click();
        await field(owner,'Bill','الفاتورة').last().selectOption(id);
        await field(owner,'Allocated amount','المبلغ الموزع').last().fill(amount);
      }
      await field(owner,'I verified receipt of these funds','تحققت من استلام هذه الأموال').check();
      await button(owner,'Review receipt','مراجعة الإيصال').click();
      if (!drop) return command(owner,'receipt',button(owner,'Post receipt','ترحيل الإيصال'));
      let committed, original, committedResolve;
      const dropped=new Promise(resolve=>{committedResolve=resolve;});
      await owner.route('**/api/billing',async route=>{
        if(route.request().postDataJSON()?.action!=='receipt') return route.continue();
        original=route.request().postDataJSON();
        const response=await route.fetch();
        const result=await response.json();
        assert.ok(response.ok()&&result.data?.id,JSON.stringify(result));
        committed=result.data;
        await route.abort('failed');
        committedResolve();
      });
      await button(owner,'Post receipt','ترحيل الإيصال').click();
      await dropped;
      await expect(owner.locator('main p[role=alert]')).toContainText(t('outcome is unknown','النتيجة غير معروفة'));
      await expect(button(owner,'Check original operation','تحقق من العملية الأصلية')).toBeVisible();
      await owner.unroute('**/api/billing');
      if(locale==='en') {
        await owner.reload();
        await expect(button(owner,'Check original operation','تحقق من العملية الأصلية')).toBeVisible();
      }
      const recovered=await command(owner,'operation',button(owner,'Check original operation','تحقق من العملية الأصلية'));
      assert.equal(recovered.id,committed.id);
      await api(owner,{...original,amount:original.amount+1},409);
      if(locale==='en') {
        await field(owner,'Player','اللاعب').selectOption(child);
        await expect(field(owner,'Verified guardian','ولي الأمر المتحقق منه').locator(`option[value="${link}"]`)).toHaveCount(1);
        await field(owner,'Verified guardian','ولي الأمر المتحقق منه').selectOption(link);
      }
      return committed;
    }
    const first=await receipt('900',[[april,'600'],[may,'300']],true);
    await totals({due:120000,unapplied:0,net:90000}); // L02
    const second=await receipt('400',[[may,'350']]);
    await totals({due:85000,unapplied:5000,net:130000}); // L03
    const audit=await fixture.db({action:'billing_audit',academy,link});
    assert.equal(audit.receiptAudits,2);
    assert.equal(audit.entries.filter(row=>row.kind==='receipt'&&row.id===first.id).length,1);
    assert.equal(audit.entries.filter(row=>row.kind==='allocation'&&row.source===first.id).length,2);
    let before=await api(owner,{action:'statement',link});
    let rows=[...before.items], cursor=before.next;
    while(cursor){const page=await api(owner,{action:'statement',link,after:cursor,snapshot:before.snapshot});rows.push(...page.items);cursor=page.next;}
    const mayAllocation=rows.find(r=>r.kind==='allocation'&&r.source===second.id&&r.bill===may);
    assert.ok(mayAllocation,'second receipt allocation exists');
    await field(owner,'Amount','المبلغ').fill('100');
    await field(owner,'Reason','السبب').fill('Fictional reviewed correction');
    await field(owner,'Bill to credit','الفاتورة المراد إضافة رصيد لها').selectOption(may);
    await command(owner,'credit',button(owner,'Post credit','ترحيل الرصيد الدائن'));
    await totals({due:75000,unapplied:5000,net:130000}); // L04
    await field(owner,'Amount','المبلغ').fill('50');
    await field(owner,'Allocation to unapply','التوزيع المراد إلغاؤه').selectOption(mayAllocation.id);
    await command(owner,'unapply',button(owner,'Unapply allocation','إلغاء التوزيع'));
    // A sibling has a real posted balance but no current billing grant.
    await api(owner,{action:'grant',player:fixture.data.familyDays[index].sibling,link:siblingLink,enabled:true,operation:randomUUID()});
    await api(owner,{action:'assign',player:fixture.data.familyDays[index].sibling,link:siblingLink,start:'2026-04-01',amount:20000,operation:randomUUID()});
    const siblingPreview=await api(owner,{action:'preview',player:fixture.data.familyDays[index].sibling,link:siblingLink,month:'2026-04'});
    const siblingBill=await api(owner,{action:'issue',player:fixture.data.familyDays[index].sibling,link:siblingLink,month:'2026-04',review:siblingPreview.review,operation:randomUUID()});
    await api(owner,{action:'grant',player:fixture.data.familyDays[index].sibling,link:siblingLink,enabled:false,operation:randomUUID()});
    await api(payer,{action:'statement',link:siblingLink},403);
    const auditBeforeForeign=await fixture.db({action:'billing_audit',academy,link});
    await api(owner,{action:'receipt',player:child,link,operation:randomUUID(),received:'2026-05-22',method:'cash',reference:'Fictional wrong child',amount:100,allocations:[{bill:siblingBill.id,amount:100}]},403);
    assert.deepEqual(await fixture.db({action:'billing_audit',academy,link}),auditBeforeForeign,'foreign bill cannot leave a partial receipt');
    const statement=await api(payer,{action:'statement',link});
    const all=[...statement.items]; cursor=statement.next;
    while(cursor){const page=await api(payer,{action:'statement',link,after:cursor,snapshot:statement.snapshot});all.push(...page.items);cursor=page.next;}
    assert.equal(all.length,statement.total);
    for(const row of all) assert.equal(row.detail,null,'payer pages omit internal details');
    assert.deepEqual(statement.totals,{due:80000,unapplied:10000,net:130000});
    const sum=kind=>all.filter(row=>row.kind===kind).reduce((n,row)=>n+row.amount,0);
    assert.equal(sum('bill')-sum('credit')-sum('allocation')+sum('unapply'),statement.totals.due);
    assert.equal(sum('receipt')-sum('allocation')+sum('unapply'),statement.totals.unapplied);
    assert.equal(sum('receipt'),statement.totals.net);
    assert.equal(all.filter(r=>r.kind==='receipt'&&r.id===first.id).length,1);
    assert.equal(all.filter(r=>r.kind==='allocation'&&r.source===first.id).length,2);
    for(const row of rows) assert.ok(all.some(r=>r.id===row.id&&r.amount===row.amount&&r.kind===row.kind),'original posted history preserved');
    // A future, unissued boundary proves one-time last-month proration and stale review refusal.
    await api(owner,{action:'assign',player:child,link,start:'2027-05-01',end:'2027-05-15',amount:150000,operation:randomUUID()});
    const lastMonth=await api(owner,{action:'preview',player:child,link,month:'2027-05'});
    assert.deepEqual([lastMonth.start,lastMonth.end,lastMonth.due,lastMonth.amount],['2027-05-01','2027-05-15','2027-05-31',72581]);
    await api(owner,{action:'assign',player:child,link,start:'2027-05-01',end:'2027-05-15',amount:160000,operation:randomUUID()});
    const changed=await api(owner,{action:'preview',player:child,link,month:'2027-05'});
    assert.notEqual(changed.review,lastMonth.review);
    assert.notEqual(changed.amount,lastMonth.amount);
    const stale=await api(owner,{action:'issue',player:child,link,month:'2027-05',review:lastMonth.review,operation:randomUUID()},409);
    assert.equal(stale,undefined);
    const unchanged=await api(owner,{action:'statement',link});
    assert.equal(unchanged.total,statement.total);
    assert.deepEqual(unchanged.totals,statement.totals);
    // Extend the posted ledger past its 25-row page boundary after proving L05.
    for(let n=0;n<18;n++) await api(owner,{action:'receipt',player:child,link,operation:randomUUID(),
      received:'2026-05-21',method:'cash',reference:`Fictional pagination ${n}`,amount:1,allocations:[]});
    const exportHead=await api(payer,{action:'statement',link});
    assert.ok(exportHead.next,'full export must cross the real page boundary');
    const exportRows=[...exportHead.items]; cursor=exportHead.next;
    while(cursor){const page=await api(payer,{action:'statement',link,after:cursor,snapshot:exportHead.snapshot});for(const row of page.items) assert.equal(row.detail,null);exportRows.push(...page.items);cursor=page.next;}
    assert.equal(exportRows.length,exportHead.total);
    assert.deepEqual(exportHead.totals,{due:80000,unapplied:10018,net:130018});
    await payer.goto(base+'/guardian/billing');
    await field(payer,'Child','الطفل').selectOption(link);
    await expect(payer.locator('main.journey-card')).toContainText('800.00');
    const downloadPromise=payer.waitForEvent('download');
    await button(payer,'Download CSV','تنزيل CSV').click();
    const download=await downloadPromise;
    const csv=await (await download.createReadStream()).toArray();
    const text=Buffer.concat(csv).toString('utf8');
    const lines=text.trim().split(/\r?\n/);
    assert.equal(lines.length,exportRows.length+1);
    // Family CSV deliberately omits internal IDs; compare each exported row in snapshot order.
    for(const [i,row] of exportRows.entries()) {
      const values=lines[i+1].split(',').map(v=>v.slice(1,-1).replaceAll('\"\"','\"'));
      const bill=exportRows.find(b=>b.id===row.bill);
      assert.deepEqual(values,[row.date,row.kind,row.period??bill?.period??'',row.start??'',row.end??'',row.due??'',row.method??'',(row.amount/100).toFixed(2)]);
    }
    await command(owner,'grant',button(owner,'Revoke billing access','إلغاء صلاحية الفواتير'));
    await api(payer,{action:'statement',link},403);
    const deniedDownload=payer.waitForEvent('download',{timeout:1200}).then(()=>true,()=>false);
    await button(payer,'Download CSV','تنزيل CSV').click();
    assert.equal(await deniedDownload,false,'revoked payer must not download cached statement');
    await expect(payer.locator('main p[role=alert]')).toBeVisible();
    assert.deepEqual(errors,[]);
    console.log(`PASS ${locale} EX-21 Owner workflow, lost receipt response, payer ledger and CSV`);
    for(const page of [owner,payer,outsider]) await page.context().close();
  }
} finally {
  await browser?.close();
  await fixture?.close();
  await rm(temp,{recursive:true,force:true});
}
