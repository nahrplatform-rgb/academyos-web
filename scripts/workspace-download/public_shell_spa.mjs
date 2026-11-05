// Isolated fictional Chromium regression for a normal workspace reached by SPA navigation.
// Run: node scripts/workspace-download/public_shell_spa.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';

export async function checkPublicShellSpa({root,browser,pass}) {
const worker=await readFile(resolve(root,'apps/web/public/prepared-workspace-worker.js'));
const bundle=(await build({stdin:{contents:"import {prepareWorkspaceShell} from './apps/web/src/lib/workspace-public-shell.ts'; window.prepareWorkspaceShell=prepareWorkspaceShell;",resolveDir:root},bundle:true,platform:'browser',format:'iife',write:false})).outputFiles[0].text;
const academy=randomUUID(), players=`/en/workspace/${academy}/players`;
const js='/_next/static/fictional.js', css='/_next/static/fictional.css';
let connected=true, publicShellRequests=0;
const server=createServer((req,res)=>{
  if(!connected){req.socket.destroy();return;}
  const path=new URL(req.url,'http://localhost').pathname;
  const reply=(body,type,headers={})=>res.writeHead(200,{'content-type':type,...headers}).end(body);
  if(path==='/prepared-workspace-worker.js')return reply(worker,'application/javascript');
  if(path==='/diagnostic-worker.js')return reply(`self.addEventListener('message',e=>e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>e.ports[0].postMessage(cs.map(c=>c.url)))));`,'application/javascript');
  if(path==='/adapter.js')return reply(bundle,'application/javascript');
  if(path==='/prepared-workspace'){publicShellRequests++;return reply(`<!doctype html><link rel="stylesheet" href="${css}"><div id="academyos-public-workspace-shell"></div><script src="${js}"></script>`,'text/html',{'x-academyos-public-shell':'workspace-v1'});}
  if(path===js)return reply('window.fictionalPublicAsset=true;','application/javascript');
  if(path===css)return reply('body { color: black; }','text/css');
  if(path==='/en/sign-in'||path===players)return reply('<!doctype html><script src="/adapter.js"></script>','text/html');
  res.writeHead(404).end();
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin=`http://127.0.0.1:${server.address().port}`;
const context=await browser.newContext();
try {
  const page=await context.newPage();
  await page.goto(origin+'/en/sign-in');
  await page.waitForFunction(()=>typeof window.prepareWorkspaceShell==='function');
  // Capture the real Client.url observed by the worker, without changing its code:
  // Client.url is available through clients.matchAll in a separate diagnostic worker.
  const clientURLs=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.register('/diagnostic-worker.js',{scope:'/diagnostic/'});
    const w=r.installing||r.waiting||r.active;
    if(w.state!=='activated')await new Promise(resolve=>{const changed=()=>{if(w.state==='activated'){w.removeEventListener('statechange',changed);resolve();}};w.addEventListener('statechange',changed);changed();});
    return new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);w.postMessage('clients',[channel.port2]);});
  });
  assert.ok(clientURLs.includes(origin+'/en/sign-in'));
  await page.evaluate(path=>history.pushState({},'',path),players);
  const after=await page.evaluate(async()=>{
    const r=await navigator.serviceWorker.getRegistration('/diagnostic/');
    return new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>resolve(e.data);r.active.postMessage('clients',[channel.port2]);});
  });
  assert.equal(new URL(page.url()).pathname,players);
  assert.ok(after.includes(origin+'/en/sign-in'),'worker WindowClient URL must retain initial document URL in this SPA scenario');
  pass('Real WindowClient URL remains sign-in after history navigation');
  await page.evaluate(()=>window.prepareWorkspaceShell());
  const entries=await page.evaluate(async()=>{
    const names=await caches.keys(), result={};
    for(const name of names)result[name]=(await (await caches.open(name)).keys()).map(r=>new URL(r.url).pathname).sort();
    const index=await caches.open('academyos-workspace-public-v1:index');
    const pointer=await (await index.match('/prepared-workspace/cache-pointer'))?.json();
    return {result,pointer};
  });
  assert.ok(entries.pointer?.current);
  assert.deepEqual(entries.result[entries.pointer.current],[css,js,'/prepared-workspace'].sort());
  assert.ok(Object.values(entries.result).flat().every(p=>!p.startsWith('/api/')&&!p.includes('/workspace/')));
  pass('SPA preparation caches only public shell and assets');
  // All invalid messages must be silently ignored, leaving the pointer unchanged.
  const invalid=[{type:'prepare-workspace-public-shell',route:'https://example.invalid'+players},
    {type:'prepare-workspace-public-shell',route:'//example.invalid'+players},
    {type:'prepare-workspace-public-shell',route:players+'?bad=1'},
    {type:'prepare-workspace-public-shell',route:players+'#fragment'},
    {type:'prepare-workspace-public-shell',route:players,extra:true},
    {type:'prepare-workspace-public-shell',route:`/en/workspace/${academy}/calendar?anchor=2099-02-30`},
    {type:'prepare-workspace-public-shell',route:`/en/workspace/${academy}/calendar?anchor=2099-01-01&anchor=2099-01-02`},
    null,[],{type:'prepare-workspace-public-shell'},
    {type:'prepare-workspace-public-shell',route:'/en/sign-in'},
    {type:'prepare-workspace-public-shell',route:17},
    {type:'other',route:players},'prepare-workspace-public-shell'];
  const requestsBeforeInvalid=publicShellRequests;
  for(const value of invalid){
    const reply=await page.evaluate(async message=>{
      const reg=await navigator.serviceWorker.getRegistration('/');
      return new Promise(resolve=>{const c=new MessageChannel();const timer=setTimeout(()=>{c.port1.close();resolve('ignored');},400);c.port1.onmessage=e=>{clearTimeout(timer);c.port1.close();resolve(e.data);};reg.active.postMessage(message,[c.port2]);});
    },value);
    assert.equal(reply,'ignored',`invalid message was accepted: ${JSON.stringify(value)}`);
  }
  assert.equal(publicShellRequests,requestsBeforeInvalid,'invalid messages must not initiate public shell preparation');
  const unchanged=await page.evaluate(async()=>{
    const names=await caches.keys(), result={};
    for(const name of names)result[name]=(await (await caches.open(name)).keys()).map(r=>new URL(r.url).pathname).sort();
    const index=await caches.open('academyos-workspace-public-v1:index');
    const pointer=await (await index.match('/prepared-workspace/cache-pointer'))?.json();
    return {result,pointer};
  });
  assert.deepEqual(unchanged,entries,'invalid messages must not alter the pointer or cache entries');
  const legacy=await context.newPage();await legacy.goto(origin+players);
  const legacyReply=await legacy.evaluate(async()=>{
    const reg=await navigator.serviceWorker.getRegistration('/');
    return new Promise(resolve=>{const c=new MessageChannel();const timer=setTimeout(()=>resolve('timeout'),5000);c.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data);};reg.active.postMessage('prepare-workspace-public-shell',[c.port2]);});
  });
  assert.equal(legacyReply,'ready');await legacy.close();
  pass('Malformed and unsupported messages ignored; legacy normal route accepted');
  connected=false;await context.setOffline(true);
  const assets=await page.evaluate(async paths=>Promise.all(paths.map(async path=>{const response=await fetch(path);return {status:response.status,body:await response.text()};})),[js,css]);
  assert.ok(assets.every(a=>a.status===200));
  assert.match(assets[0].body,/fictionalPublicAsset/);assert.match(assets[1].body,/color: black/);
  pass('Public assets available offline to the SPA document');
  return {spaClientUrlRetained:true,publicEntries:entries.result[entries.pointer.current].length,invalidMessages:invalid.length,offlineAssets:assets.length,legacyNormalRoute:true};
} finally {
  await context.close();await new Promise(ok=>server.close(ok));
}
}

if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const browser=await chromium.launch({headless:true});
  try {
    const metrics=await checkPublicShellSpa({root:resolve(import.meta.dirname,'../..'),browser,pass:name=>console.log('PASS '+name)});
    console.log(JSON.stringify(metrics));
  } finally {await browser.close();}
}
