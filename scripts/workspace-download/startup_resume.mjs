// Actual public startup component; delayed mounting models an online event that
// precedes hydration. No account, private data, provider or backend is involved.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {chromium,expect} from '@playwright/test';
import {join} from 'node:path';

export async function checkStartupResume(root,pass){
  const output=await build({stdin:{contents:`
    import{createRoot}from'react-dom/client';
    import Startup from './apps/web/src/components/prepared-workspace-startup';
    window.mountStartup=()=>createRoot(document.querySelector('#root')).render(<Startup/>);
    if(window.automaticStartup)window.mountStartup();
  `,resolveDir:root,loader:'tsx'},bundle:true,write:false,jsx:'automatic',
    tsconfig:join(root,'apps/web/tsconfig.json'),define:{'process.env.NODE_ENV':'"production"'},
    plugins:[{name:'public-startup-fixture',setup(bundle){
      bundle.onResolve({filter:/^(\.\/people-workspace|\.\/experience-workspace|\.\/prepared-register-panel|\.\/prepared-register-session|@\/lib\/register-device-account)$/},
        ({path})=>({path,namespace:'fictional'}));
      bundle.onLoad({filter:/.*/,namespace:'fictional'},({path})=>({loader:'tsx',contents:
        path.includes('register-device-account')?
          'export const readRegisterAccount=()=>null;export const subscribeRegisterAccount=()=>()=>{};':
        path.includes('prepared-register-panel')?
          'export default function Register(){throw new Error("Unexpected private register in public no-account reachability fixture");}':
        path.includes('prepared-register-session')?
          'export default function Session(){throw new Error("Unexpected private session in public no-account reachability fixture");}':
          'export const PeopleJourney=()=>null;export const ExperienceJourney=()=>null;'}));
    }}]});
  let documents=0,probes=0,reachable=true,heldProbe=null,holdProbe=false;
  const server=createServer((req,res)=>{
    if(req.url==='/prepared-workspace'&&req.method==='HEAD'){
      probes++;
      const reply=()=>res.writeHead(reachable?200:503,{'x-academyos-public-shell':'workspace-v1'}).end();
      if(holdProbe)heldProbe=reply;else reply();
      return;
    }
    if(req.url==='/fixture.js'){
      res.writeHead(200,{'content-type':'application/javascript'}).end(output.outputFiles[0].text);return;
    }
    if(req.url?.startsWith('/en/workspace/')){
      documents++;
      res.writeHead(200,{'content-type':'text/html'}).end(`<!doctype html><div id="root"></div>
        <script>window.automaticStartup=${documents>1}</script><script src="/fixture.js"></script>`);return;
    }
    res.writeHead(404,{'content-type':'text/html'}).end('<h1>Another task</h1>');
  });
  let browser;
  try{
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const target=`http://127.0.0.1:${server.address().port}/en/workspace/00000000-0000-4000-8000-000000000001/players`;
    browser=await chromium.launch();
    const page=await browser.newPage();
    await page.goto(target);
    await page.evaluate(()=>window.dispatchEvent(new Event('online')));
    const first=page.waitForResponse(response=>response.request().isNavigationRequest()&&response.url()===target);
    await page.evaluate(()=>window.mountStartup());
    assert.equal((await first).status(),200);
    await expect(page.getByText('This workspace has no prepared data on this device.',{exact:false})).toBeVisible();
    assert.equal(probes,1);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('academyos.workspace-reentry.v1')),new URL(target).pathname);
    await page.evaluate(()=>{
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('online'));
    });
    assert.equal(documents,2);
    assert.equal(probes,1);
    pass('A connection restored before public startup mounts retries the normal URL once without a reload loop');
    const next=page.waitForResponse(response=>response.request().isNavigationRequest()&&response.url()===target);
    await page.evaluate(()=>{
      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
    });
    await next;
    await expect(page.getByText('This workspace has no prepared data on this device.',{exact:false})).toBeVisible();
    assert.equal(documents,3);
    assert.equal(probes,2);
    pass('A later offline/online cycle clears the public reentry guard and permits the next recovery');

    await page.close();
    documents=0;probes=0;reachable=false;
    const unavailable=await browser.newPage();
    await unavailable.goto(target);
    await unavailable.evaluate(()=>window.mountStartup());
    await expect.poll(()=>probes).toBe(1);
    await expect(unavailable.getByText('This workspace has no prepared data on this device.',{exact:false})).toBeVisible();
    assert.equal(documents,1);
    pass('A browser reporting online with an unavailable origin retains the public workspace without reloading it');
    await unavailable.close();

    documents=0;probes=0;reachable=true;holdProbe=true;
    const leaving=await browser.newPage();
    await leaving.goto(target);
    await leaving.evaluate(()=>window.mountStartup());
    await expect.poll(()=>probes).toBe(1);
    await leaving.goto(new URL('/another-task',target).href);
    heldProbe();
    await expect(leaving.getByRole('heading',{name:'Another task',exact:true})).toBeVisible();
    assert.equal(leaving.url(),new URL('/another-task',target).href);
    assert.equal(documents,1);
    pass('A late public reachability response cannot replace an outgoing task navigation');
  }finally{
    await browser?.close();
    if(server.listening)await new Promise(resolve=>server.close(resolve));
  }
}
