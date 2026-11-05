// Chromium exercises the real Owner components and public worker. Existing
// online People/Calendar reads use fictional responses; transfers use real handlers.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {expect,chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const asset='/_next/static/workspace-fixture.js';
const shell='/prepared-workspace';
export async function normalWorkspaceFixture(root, fixture) {
  const output=await build({stdin:{contents:`
    import{createRoot}from'react-dom/client';
    import People from './apps/web/src/components/people-workspace';
    import Experience from './apps/web/src/components/experience-workspace';
    import{clearRegisterAccount}from './apps/web/src/lib/register-device-account';
    window.clearTestAccount=()=>clearRegisterAccount('user_owner',()=>{});
    const [,locale,,academy,view]=location.pathname.split('/');
    const props={locale,academy,prepared:true};
    createRoot(document.querySelector('#root')).render(
      view==='players'?<People {...props}/>:<Experience {...props} role="owner" calendar
        anchor={new URLSearchParams(location.search).get('anchor')??undefined}/>);
    `,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',
    tsconfig:join(root,'apps/web/tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'normal-workspace-fixture',setup(bundle){
      bundle.onResolve({filter:/^(@clerk\/nextjs|next\/link)$/},({path})=>({path,namespace:'fictional'}));
      bundle.onLoad({filter:/.*/,namespace:'fictional'},({path})=>({loader:'tsx',resolveDir:root,contents:
        path==='next/link'?'export default function Link({prefetch,...props}){return <a {...props}/>;}':
          "export const useUser=()=>({isLoaded:true,user:{id:'user_owner'}});export const useClerk=()=>({});export const UserButton=()=>null;"}));
    }}]});
  const [worker,css,publicPage]=await Promise.all(['public/prepared-workspace-worker.js','src/app/globals.css',
    '.next/server/app/prepared-workspace.html']
    .map(file=>readFile(join(root,'apps/web',file),'utf8')));
  assert.ok(publicPage.includes('Opening your workspace'));
  assert.ok(!publicPage.includes('This workspace has no prepared data on this device.'));
  const calls=[];
  let denyDocument=false;
  let networkAvailable=true;
  const context={academy_name:'Synthetic online academy',branch_id:fixture.branch,branch_name:'Synthetic online branch',
    academy_id:fixture.academy,timezone:'Africa/Cairo',today:'2099-11-01'};
  return {
    calls,
    denyDocument(){denyDocument=true;},
    setNetworkAvailable(value){networkAvailable=value;},
    async serve(req,res) {
      // BrowserContext's offline switch does not consistently disconnect a
      // service worker's own fetch. Cut the fixture origin too, so a successful
      // worker response proves cached-shell recovery rather than network HTML.
      if(!networkAvailable){req.socket.destroy();return true;}
      const url=new URL(req.url,'http://localhost');
      const reply=(body,headers={},status=200)=>res.writeHead(status,headers).end(body);
      if(url.pathname===asset){reply(output.outputFiles[0].text,{'content-type':'application/javascript'});return true;}
      if(/^\/_next\/static\/[a-zA-Z0-9_./-]+\.(js|css)$/.test(url.pathname)){
        const file=await readFile(join(root,'apps/web/.next',url.pathname.slice('/_next/'.length))).catch(()=>null);
        reply(file??'',{'content-type':url.pathname.endsWith('.css')?'text/css':'application/javascript'},file?200:404);
        return true;
      }
      if(url.pathname==='/prepared-workspace-worker.js'){reply(worker,{'content-type':'application/javascript'});return true;}
      if(url.pathname==='/api/people'||url.pathname==='/api/experience'){
        const chunks=[];
        for await(const chunk of req)chunks.push(chunk);
        const body=JSON.parse(Buffer.concat(chunks).toString());
        calls.push({path:url.pathname,action:body.action});
        const data=url.pathname==='/api/people'
          ?body.action==='profile'?{id:body.player,display_name:'Fictional full profile',branch_name:context.branch_name,
              contact_email:'profile@example.invalid'}:{...context,items:[],revision:0,more:false}
          :{context,as_of:new Date().toISOString(),anchor:context.today,total:0,items:[],more:false,next:null};
        reply(JSON.stringify({data}),{'content-type':'application/json'});return true;
      }
      if(url.pathname!==shell&&!/^\/(en|ar)\/workspace\/[a-f0-9-]+\/(players|calendar)$/.test(url.pathname))return false;
      if(denyDocument&&url.pathname!==shell){reply('Current access denied',{'content-type':'text/html'},403);return true;}
      if(url.pathname===shell){
        reply(publicPage,{'content-type':'text/html','x-academyos-public-shell':'workspace-v1'});return true;
      }
      reply(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><div id="root"></div><script src="${asset}"></script></html>`,
        {'content-type':'text/html'});
      return true;
    },
  };
}

export async function checkNormalWorkspace({fixture,ui,base,profile,transferCalls,db,pass}) {
  let browser=await chromium.launchPersistentContext(profile);
  const pageErrors=[], failedRequests=[], requests=[];
  let offlineShellNavigations=0;
  const scope=(locale,route)=>`${base}/${locale}/workspace/${fixture.academy}/${route}`;
  const players=scope('en','players');
  const calendar=scope('ar','calendar?anchor=2099-11-01');
  const online=page=>page.locator('summary').filter({hasText:/^(Online|متصل)$/});
  const player=page=>page.getByRole('button',{name:/^Synthetic player \d+$/}).first();
  async function checkChanges(page,label) {
    const button=page.getByRole('button',{name:label,exact:true});
    if(!await button.isVisible())await online(page).click();
    await button.click();
  }
  const track=page=>{
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('request',request=>requests.push(request.url()));
    page.on('requestfailed',request=>failedRequests.push([request.url(),request.failure()?.errorText]));
  };
  async function openOffline(page,url){
    await expect.poll(()=>page.evaluate(()=>navigator.onLine)).toBe(false);
    const reply=await page.goto(url,{waitUntil:'load'});
    assert.equal(reply?.url(),url);
    await page.waitForURL(url,{waitUntil:'commit'});
    assert.equal(page.url(),url);
    assert.ok(reply?.fromServiceWorker(),'normal route should come from the offline worker');
    await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(1);
    offlineShellNavigations++;
  }
  async function reconnect(page,url,{prepared=true}={}){
    const navigation=page.waitForEvent('framenavigated',frame=>frame===page.mainFrame()&&frame.url()===url);
    ui.setNetworkAvailable(true);
    await browser.setOffline(false);
    await navigation;
    assert.equal(page.url(),url);
    await expect(page.locator('#academyos-public-workspace-shell')).toHaveCount(0);
    if(prepared)await expect(online(page)).toBeVisible({timeout:30000});
    else await expect(page.getByText('Device',{exact:true})).toBeVisible();
  }
  let page;
  try {
    page=await browser.newPage();track(page);
    await page.goto(players);
    await page.getByRole('button',{name:'Register player',exact:true}).waitFor();
    assert.deepEqual(ui.calls.map(call=>call.action),['list']);
    await page.getByText('Device',{exact:true}).click();
    await page.getByRole('button',{name:'Use this personal device'}).click();
    await expect(online(page)).toBeVisible({timeout:30000});
    await player(page).waitFor();
    await page.waitForFunction(()=>caches.match('/prepared-workspace/cache-pointer'));
    assert.deepEqual(ui.calls.map(call=>call.action),['list']);
    pass('Normal Owner Players opens before device preparation and switches to the protected directory');
    const before={reads:ui.calls.length,transfers:transferCalls.length};
    const search=page.locator('#player-search');
    await search.fill('Synthetic player 55');
    await expect(page.getByText(/^1 players on this page/)).toBeVisible();
    await player(page).click();
    await expect(page.getByRole('button',{name:'Open full profile',exact:true})).toBeVisible();
    assert.equal(ui.calls.length,before.reads);
    assert.equal(transferCalls.length,before.transfers);
    await page.getByRole('button',{name:'Open full profile',exact:true}).click();
    await expect(page.getByText('profile@example.invalid',{exact:true})).toBeVisible();
    assert.equal(ui.calls.length,before.reads+1);
    assert.equal(await page.evaluate(async()=>{
      const keys=await caches.keys();
      const requests=(await Promise.all(keys.map(async key=>(await caches.open(key)).keys()))).flat();
      return requests.every(request=>!/\/api\/|\/en\/workspace/.test(request.url));
    }),true);
    pass('Normal Players search and summary open use zero requests and full profile uses one online read');
    await page.goto(calendar);
    await expect(online(page)).toBeVisible({timeout:30000});
    const event=page.locator('[data-occurrence]').first();
    await expect(event).toBeVisible();
    const eventKey=await event.getAttribute('data-occurrence');
    await event.click();
    await expect(event).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('html')).toHaveAttribute('dir','rtl');
    const beforeCheck=transferCalls.length;
    await checkChanges(page,'تحقّق من التغييرات');
    await expect.poll(()=>transferCalls.length).toBe(beforeCheck+1);
    await expect(online(page)).toBeVisible();
    assert.deepEqual(transferCalls.slice(beforeCheck).map(call=>call.action),['manifest']);
    await expect(event).toHaveAttribute('aria-pressed','true');
    const beforeMonth={reads:ui.calls.length,transfers:transferCalls.length};
    await page.getByRole('button',{name:'شهر',exact:true}).click();
    await expect(page.getByRole('button',{name:'شهر',exact:true})).toBeEnabled();
    await expect(page.locator(`[data-occurrence="${eventKey}"]`)).toHaveAttribute('aria-pressed','true');
    assert.equal(ui.calls.length,beforeMonth.reads);
    assert.equal(transferCalls.length,beforeMonth.transfers);
    pass('Covered Calendar view change sends zero requests and an unchanged check downloads zero pages, retaining selection');

    await browser.close();
    ui.setNetworkAvailable(false);
    browser=await chromium.launchPersistentContext(profile,{offline:true});
    page=await browser.newPage();track(page);
    const offlineStart={reads:ui.calls.length,transfers:transferCalls.length,attempted:requests.length};
    await openOffline(page,calendar);
    await expect(page.getByText('غير متصل',{exact:true})).toBeVisible();
    await expect(page.locator(`[data-occurrence="${eventKey}"]`)).toBeVisible();
    await openOffline(page,players);
    await expect(page.getByText('Offline',{exact:true})).toBeVisible();
    await player(page).click();
    await expect(page.getByRole('button',{name:'Open full profile',exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Register player',exact:true})).toBeDisabled();
    assert.equal(ui.calls.length,offlineStart.reads);
    assert.equal(transferCalls.length,offlineStart.transfers);
    await openOffline(page,scope('en','calendar?anchor=2099-08-01'));
    await expect(page.getByText('This period has not been prepared on this device.',{exact:false})).toBeVisible();
    assert.equal(requests.slice(offlineStart.attempted).filter(url=>new URL(url).pathname.startsWith('/api/')).length,0);
    const offlineRoutePayloadRequests=requests.slice(offlineStart.attempted).filter(url=>new URL(url).searchParams.has('_rsc')).length;
    pass('Full Chromium restart opens EN Players and AR Calendar at normal offline URLs with zero service requests, and shows uncovered dates');

    await db({action:'rename',academy:fixture.academy});
    await openOffline(page,players);
    await expect(page.getByText('Offline',{exact:true})).toBeVisible();
    await reconnect(page,players);
    await page.locator('#player-search').fill('Fictional renamed player');
    await expect(page.getByRole('button',{name:'Fictional renamed player',exact:true})).toBeVisible();
    pass('Reconnecting the offline document returns to verified online data and applies a changed player');

    await page.evaluate(()=>window.clearTestAccount());
    ui.setNetworkAvailable(false);
    await browser.setOffline(true);
    await openOffline(page,players);
    await expect(page.getByText('This workspace has no prepared data on this device.',{exact:false})).toBeVisible();
    await reconnect(page,players,{prepared:false});
    await page.getByText('Device',{exact:true}).click();
    await page.getByRole('button',{name:'Use this personal device'}).click();
    await expect(online(page)).toBeVisible({timeout:30000});
    pass('Logout removes prepared coverage from the normal offline route before another verified preparation');

    await db({action:'suspend',academy:fixture.academy});
    await checkChanges(page,'Check for changes');
    await expect(page.getByRole('alert').filter({hasText:'Access unavailable'})).toBeVisible();
    await expect(page.getByRole('button',{name:'Fictional renamed player',exact:true})).toHaveCount(0);
    ui.setNetworkAvailable(false);
    await browser.setOffline(true);
    await openOffline(page,players);
    await expect(page.getByText('This workspace has no prepared data on this device.',{exact:false})).toBeVisible();
    await openOffline(page,calendar);
    await expect(page.getByText('لا توجد بيانات محضّرة',{exact:false})).toBeVisible();
    ui.denyDocument();
    ui.setNetworkAvailable(true);
    await browser.setOffline(false);
    await expect(page.getByText('Current access denied',{exact:true})).toBeVisible();
    assert.deepEqual(pageErrors,[]);
    pass('Verified authority loss retires prepared coverage and the worker preserves an online HTTP denial');
    return {baselinePlayersReads:before.reads,coveredPlayersRequests:0,fullProfileReads:1,coveredCalendarRequests:0,
      unchangedManifestRequests:1,unchangedDatasetPages:0,offlineOperatingRequests:0,offlineRoutePayloadRequests,fullBrowserRestart:true,
      offlineShellNavigations,fixtureOriginDisconnected:true};
  } catch (error) {
    console.error({url:page?.url(),body:(await page?.locator('body').innerText().catch(()=>''))?.slice(0,2400),
      pageErrors,failedRequests:failedRequests.slice(-25)});
    throw error;
  } finally {ui.setNetworkAvailable(true);await browser.close();}
}
