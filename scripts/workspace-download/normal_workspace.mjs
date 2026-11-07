// Chromium exercises the real Owner components and public worker. Existing
// baseline online People/Calendar reads use fictional responses. Registration
// scenarios explicitly switch People to its real handler and signed DB boundary.
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {expect,chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const asset='/_next/static/workspace-fixture.js';
const shell='/prepared-workspace';
export async function normalWorkspaceFixture(root, fixture, options={}) {
  let realPeople=false, loseCreateReply=false;
  const registrations=[];
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
          "export const useUser=()=>({isLoaded:true,user:{id:'user_owner'}});export const useClerk=()=>({});export const UserButton=()=>null;export function ClerkProvider(){throw Error('Unexpected Attendance auth in Players/Calendar fixture');}export function useAuth(){throw Error('Unexpected Attendance auth in Players/Calendar fixture');}"}));
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
    registrations,
    useRealPeople(value=true){realPeople=value;},
    loseNextCreateReply(){loseCreateReply=true;},
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
        if(url.pathname==='/api/people'&&realPeople){
          assert.ok(options.people,'A real People handler is required for registration scenarios');
          const response=await options.people(body);
          const text=await response.text();
          if(body.action==='create')registrations.push({body:structuredClone(body),status:response.status,
            result:JSON.parse(text).data});
          if(body.action==='create'&&loseCreateReply){
            assert.equal(response.status,200,'Lose the reply only after the real write committed');
            // Replace the committed success with a deterministic unavailable
            // response. A TCP reset can be transparently retried by Chromium.
            loseCreateReply=false;reply(JSON.stringify({error:'unavailable'}),{'content-type':'application/json'},503);return true;
          }
          reply(text,{'content-type':'application/json'},response.status);return true;
        }
        let data;
        if(url.pathname==='/api/experience') {
          data={context,as_of:new Date().toISOString(),anchor:context.today,total:0,items:[],more:false,next:null};
        } else if(body.action==='create') {
          throw new Error('Registration must use the real People scenario');
        } else if(body.action==='profile') {
          data={id:body.player,display_name:'Fictional full profile',
            branch_name:context.branch_name,contact_email:'profile@example.invalid'};
        } else {
          data={...context,items:[],revision:0,more:false};
        }
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

export async function checkNormalWorkspace({fixture,ui,base,profile,transferCalls,rpcCalls,db,pass}) {
  let browser=await chromium.launchPersistentContext(profile);
  const pageErrors=[], failedRequests=[], requests=[], navigationEvents=[];
  let offlineShellNavigations=0, nullGotoResponses=0, postRegistration=null;
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
  const track=async page=>{
    const record=(event,value)=>{
      navigationEvents.push({event,...value});
      if(navigationEvents.length>100)navigationEvents.shift();
    };
    page.on('pageerror',error=>pageErrors.push(error.message));
    page.on('request',request=>{
      requests.push(request.url());
      if(request.isNavigationRequest())record('request',{url:request.url()});
    });
    page.on('framenavigated',frame=>{if(frame===page.mainFrame())record('frame',{url:frame.url()});});
    page.on('requestfailed',request=>failedRequests.push([request.url(),request.failure()?.errorText]));
    page.on('console',message=>{
      const text=message.text();
      if(text.startsWith('WORKSPACE_NAV '))record('document',JSON.parse(text.slice(14)));
    });
    await page.addInitScript(()=>{
      const emit=(event,extra={})=>console.debug('WORKSPACE_NAV '+JSON.stringify({event,
        url:location.href,document:performance.timeOrigin,online:navigator.onLine,...extra}));
      emit('init');
      for(const name of ['pushState','replaceState']){
        const original=history[name].bind(history);
        history[name]=function(state,unused,url){
          emit(name,{destination:url==null?null:String(url),stack:new Error().stack?.split('\n').slice(1,5)});
          return original(state,unused,url);
        };
      }
      for(const name of ['pageshow','pagehide','beforeunload','popstate','DOMContentLoaded','load','online','offline'])
        addEventListener(name,()=>emit(name));
      navigation?.addEventListener('navigate',event=>emit('navigate',{
        destination:event.destination.url,navigationType:event.navigationType}));
    });
  };
  async function openOffline(page,url){
    await expect.poll(()=>page.evaluate(()=>navigator.onLine)).toBe(false);
    const previousDocument=await page.evaluate(()=>performance.timeOrigin);
    // Observe the requested navigation directly. goto can complete on an
    // interim same-document history event while the worker navigation commits.
    const response=page.waitForResponse(reply=>reply.url()===url&&reply.request().isNavigationRequest()&&
      reply.request().frame()===page.mainFrame());
    const [reply,reported]=await Promise.all([response,page.goto(url,{waitUntil:'load'})]);
    if(reported)assert.equal(reported.url(),url);else nullGotoResponses++;
    assert.equal(reply.url(),url);
    await page.waitForURL(url,{waitUntil:'load'});
    assert.equal(page.url(),url);
    await expect.poll(()=>page.evaluate(()=>performance.timeOrigin)).not.toBe(previousDocument);
    assert.ok(reply.fromServiceWorker(),'normal route should come from the offline worker');
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
    page=await browser.newPage();await track(page);
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
    let search=page.locator('#player-search');
    await page.evaluate(()=>{
      window.localQueryFeedback={loading:0,removedSummary:0};
      window.localQueryObserver=new MutationObserver(changes=>{
        for(const change of changes){
          for(const node of change.addedNodes)if(node.textContent?.trim()==='Loading…')window.localQueryFeedback.loading++;
          for(const node of change.removedNodes)if(node instanceof Element&&node.matches('.directory-page-summary'))window.localQueryFeedback.removedSummary++;
        }
      });
      window.localQueryObserver.observe(document.body,{childList:true,subtree:true});
    });
    await search.fill('Synthetic player 55');
    await expect(page.getByText(/^1 players on this page/)).toBeVisible();
    await player(page).click();
    await expect(page.getByRole('button',{name:'Open full profile',exact:true})).toBeVisible();
    assert.equal(ui.calls.length,before.reads);
    assert.equal(transferCalls.length,before.transfers);
    assert.deepEqual(await page.evaluate(()=>{window.localQueryObserver.disconnect();return window.localQueryFeedback;}),
      {loading:0,removedSummary:0});
    pass('Prepared Players search retains result geometry without generic Loading feedback');
    await page.getByRole('button',{name:'Open full profile',exact:true}).click();
    await expect(page.getByText('profile@example.invalid',{exact:true})).toBeVisible();
    assert.equal(ui.calls.length,before.reads+1);
    assert.equal(await page.evaluate(async()=>{
      const keys=await caches.keys();
      const requests=(await Promise.all(keys.map(async key=>(await caches.open(key)).keys()))).flat();
      return requests.every(request=>!/\/api\/|\/en\/workspace/.test(request.url));
    }),true);
    pass('Normal Players search and summary open use zero requests and full profile uses one online read');
    const viewKey=`academyos:people-view:user_owner:${fixture.academy}:owner:v1`;
    const recoveryKey=`academyos:people:user_owner:${fixture.academy}`;
    const storedView=await page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)),viewKey);
    assert.deepEqual(Object.keys(storedView).sort(),['position','search','selection']);
    assert.equal(storedView.search,'Synthetic player 55');
    assert.match(storedView.selection,/^[a-f0-9-]{36}$/i);
    const beforeReopen={reads:ui.calls.length,transfers:transferCalls.length};
    await page.reload();
    await expect(online(page)).toBeVisible({timeout:30000});
    await expect(search).toHaveValue('Synthetic player 55');
    await expect(page.getByRole('button',{name:'Open full profile',exact:true})).toBeVisible();
    await expect(page.getByText('profile@example.invalid',{exact:true})).toHaveCount(0);
    assert.equal(ui.calls.length,beforeReopen.reads);
    assert.deepEqual(transferCalls.slice(beforeReopen.transfers).map(call=>call.action),['manifest']);
    pass('Cold normal Players restores only safe query and permitted summary without a profile read');
    const original='fc111111-1111-4111-8111-111111111111';
    await page.evaluate(({key,id})=>sessionStorage.setItem(key,id),{key:recoveryKey,id:original});
    await page.reload();
    await expect(page.getByRole('heading',{name:'Save outcome is uncertain',exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Open full profile',exact:true})).toHaveCount(0);
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),recoveryKey),original);
    await page.evaluate(key=>sessionStorage.removeItem(key),recoveryKey);
    await page.reload();
    await expect(online(page)).toBeVisible({timeout:30000});
    await expect(search).toHaveValue('Synthetic player 55');
    await expect(page.getByRole('button',{name:'Open full profile',exact:true})).toBeVisible();
    pass('An original registration recovery reference takes precedence over saved navigation');
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

    const monthButton=page.getByRole('button',{name:'شهر',exact:true});
    const calendarWithoutAnchor=scope('ar','calendar');
    const period=await page.locator('input[type="date"]').inputValue();
    const selectedEvent=page.locator(`[data-occurrence="${eventKey}"]`);
    async function expectCalendarContext(){
      await expect(page.locator('html')).toHaveAttribute('dir','rtl');
      await expect(monthButton).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('input[type="date"]')).toHaveValue(period);
      await expect(selectedEvent).toHaveAttribute('aria-pressed','true');
    }
    await expectCalendarContext();
    ui.setNetworkAvailable(false);
    await browser.setOffline(true);
    await openOffline(page,calendarWithoutAnchor);
    await expect(page.getByText('غير متصل',{exact:true})).toBeVisible();
    await expectCalendarContext();
    await openOffline(page,calendarWithoutAnchor);
    await expect(page.getByText('غير متصل',{exact:true})).toBeVisible();
    await expectCalendarContext();
    await reconnect(page,calendarWithoutAnchor);
    await expectCalendarContext();
    const reconnectCheck=transferCalls.length;
    await checkChanges(page,'تحقّق من التغييرات');
    await expect.poll(()=>transferCalls.length).toBe(reconnectCheck+1);
    await expect(online(page)).toBeVisible();
    assert.deepEqual(transferCalls.slice(reconnectCheck).map(call=>call.action),['manifest']);
    await expectCalendarContext();
    pass('Same-tab AR Calendar retains month, period and selection through offline reload, reentry and scoped check');

    const sameTabOffline={reads:ui.calls.length,transfers:transferCalls.length};
    ui.setNetworkAvailable(false);
    await browser.setOffline(true);
    await openOffline(page,players);
    await expect(search).toHaveValue('Synthetic player 55');
    await expect(page.getByRole('heading',{name:'Player profile',exact:true})).toBeVisible();
    await openOffline(page,players);
    await expect(search).toHaveValue('Synthetic player 55');
    await expect(page.getByRole('heading',{name:'Player profile',exact:true})).toBeVisible();
    assert.equal(ui.calls.length,sameTabOffline.reads);
    assert.equal(transferCalls.length,sameTabOffline.transfers);
    pass('Same-tab offline Players retains its query and permitted summary through reload');

    await browser.close();
    ui.setNetworkAvailable(false);
    browser=await chromium.launchPersistentContext(profile,{offline:true});
    page=await browser.newPage();await track(page);
    search=page.locator('#player-search');
    const offlineStart={reads:ui.calls.length,transfers:transferCalls.length,attempted:requests.length};
    await openOffline(page,calendar);
    await expect(page.getByText('غير متصل',{exact:true})).toBeVisible();
    await expect(page.locator(`[data-occurrence="${eventKey}"]`)).toBeVisible();
    await openOffline(page,players);
    await expect(page.getByText('Offline',{exact:true})).toBeVisible();
    // Navigation is tab-scoped; a fresh tab must not inherit the earlier hint.
    await expect(search).toHaveValue('');
    await expect(page.getByRole('heading',{name:'Player profile',exact:true})).toHaveCount(0);
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

    // Post-registration continuity: the saved player must become discoverable in
    // the prepared directory through the existing collection revision protocol,
    // without a second online directory read or a cleared protected store.
    ui.useRealPeople();
    const registration='Synthetic new registration';
    const beforeSave={reads:ui.calls.length,transfers:transferCalls.length};
    async function submitRegistration(name){
      await page.getByRole('button',{name:'Register player',exact:true}).click();
      await page.getByLabel('Player display name (required)',{exact:true}).fill(name);
      await page.getByRole('button',{name:'Continue to duplicate review',exact:true}).click();
      await expect(page.getByRole('button',{name:'Save registration',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Save registration',exact:true}).click();
    }
    await submitRegistration(registration);
    await expect(page.getByText('Registration saved',{exact:true})).toBeVisible();
    const afterSave=ui.calls.slice(beforeSave.reads).map(call=>call.action);
    assert.deepEqual(afterSave,['candidates','create','profile'],
      'a confirmed registration reads its own profile once after duplicate review');
    await page.getByRole('button',{name:'Back to players',exact:true}).click();
    await page.locator('#player-search').fill(registration);
    await expect(page.getByRole('button',{name:registration,exact:true})).toBeVisible({timeout:20000});
    assert.deepEqual(ui.calls.slice(beforeSave.reads).map(call=>call.action),afterSave,
      'the prepared directory must not re-read the online list to show a confirmed registration');
    const postSaveTransfers=transferCalls.slice(beforeSave.transfers).map(call=>call.action);
    assert.equal(postSaveTransfers[0],'manifest');
    assert.ok(postSaveTransfers.includes('complete'),
      'the people collection must complete a replacement transfer after the registration');
    const savedRegistration=ui.registrations.at(-1);
    assert.equal(savedRegistration.status,200);
    const createdRpc=rpcCalls.filter(call=>call.rpc==='i2_register_v1'&&call.op===savedRegistration.body.op);
    assert.equal(createdRpc.length,1,'The browser save ID reaches the actual signed registration RPC');
    postRegistration={peopleCalls:afterSave,transferActions:postSaveTransfers,realPeopleHandler:true,originalIdForwarded:true};
    pass('A confirmed registration becomes discoverable from the prepared directory without an online list read');

    const replay=await page.request.post(base+'/api/people',{data:savedRegistration.body});
    assert.equal(replay.status(),200);
    assert.deepEqual((await replay.json()).data,savedRegistration.result);
    assert.deepEqual(await db({action:'registration_snapshot',academy:fixture.academy,op:savedRegistration.body.op}),
      {operations:1,audits:1,players:1,result:savedRegistration.result});
    postRegistration.replay={sameResult:true,operations:1,audits:1,players:1};
    pass('The original browser save ID replays through the real People handler with one player, receipt and audit');

    const beforeLost={reads:ui.calls.length,transfers:transferCalls.length};
    ui.loseNextCreateReply();
    await submitRegistration('Synthetic lost registration');
    await expect(page.getByRole('heading',{name:'Save outcome is uncertain',exact:true})).toBeVisible();
    const lost=ui.registrations.at(-1);
    assert.equal(lost.status,200);
    await page.getByRole('button',{name:'Check original operation',exact:true}).click();
    await expect(page.getByText('Registration saved',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Back to players',exact:true}).click();
    await page.locator('#player-search').fill('Synthetic lost registration');
    await expect(page.getByRole('button',{name:'Synthetic lost registration',exact:true})).toBeVisible({timeout:20000});
    const lostActions=ui.calls.slice(beforeLost.reads).map(call=>call.action);
    assert.deepEqual(lostActions,['candidates','create','reconcile','profile']);
    assert.equal(rpcCalls.filter(call=>call.rpc==='i2_register_v1'&&call.op===lost.body.op).length,1);
    assert.equal(rpcCalls.filter(call=>call.rpc==='i2_operation_v1'&&call.op===lost.body.op).length,1);
    assert.deepEqual(await db({action:'registration_snapshot',academy:fixture.academy,op:lost.body.op}),
      {operations:1,audits:1,players:1,result:lost.result});
    postRegistration.lostReply={peopleCalls:lostActions,originalIdReconciled:true,operations:1,audits:1,players:1,
      transferActions:transferCalls.slice(beforeLost.transfers).map(call=>call.action)};
    pass('A lost committed registration reply reconciles the browser original through the real API and returns to its prepared row');
    ui.useRealPeople(false);

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
    assert.equal(await page.evaluate(key=>sessionStorage.getItem(key),viewKey),null);
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
      offlineShellNavigations,fixtureOriginDisconnected:true,newOfflineDocuments:offlineShellNavigations,nullGotoResponses,
      peopleViewRestored:true,localLoadingFlashes:0,calendarReconnectContext:true,postRegistration};
  } catch (error) {
    console.error(JSON.stringify({url:page?.url(),body:(await page?.locator('body').innerText().catch(()=>''))?.slice(0,2400),
      pageErrors,failedRequests:failedRequests.slice(-25),navigationEvents:navigationEvents.slice(-35)},null,2));
    throw error;
  } finally {ui.setNetworkAvailable(true);await browser.close();}
}
