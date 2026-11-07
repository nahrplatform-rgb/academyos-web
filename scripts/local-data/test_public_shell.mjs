// Actual public-shell client and service worker, isolated loopback Chromium only.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash, randomUUID} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
const root=resolve(import.meta.dirname,'../..');
const sources=['apps/web/public/prepared-register-worker.js','apps/web/src/lib/register-public-shell.ts','scripts/local-data/test_public_shell.mjs'];
const evidence=join(root,'docs/07-handoff/evidence/public-register-shell-2026-11-04.json');
const hashes={};for(const path of sources)hashes[path]=createHash('sha256').update(await readFile(join(root,path))).digest('hex');
if(process.argv.includes('--check')){
  const receipt=JSON.parse(await readFile(evidence,'utf8'));
  assert.deepEqual(receipt.hashes,hashes);assert.equal(receipt.passed,true);
  assert.equal(receipt.checks.length,6);assert.ok(receipt.checks.every(c=>c.status==='passed'));
  console.log('PASS public shell receipt matches sources');process.exit(0);
}
const bundle=(await build({stdin:{contents:"import * as shell from './apps/web/src/lib/register-public-shell.ts'; window.shell=shell;",resolveDir:root},bundle:true,platform:'browser',format:'iife',write:false})).outputFiles[0].text;
const worker=await readFile(join(root,sources[0]));
const owner=`/en/workspace/${randomUUID()}/attendance/${randomUUID()}`;
const html=version=>`<!doctype html><html><head><link rel="stylesheet" href="/_next/static/${version}.css"></head><body><main id="academyos-public-register-shell">Build ${version}</main><script src="/_next/static/${version}.js"></script></body></html>`;
let version='A',fail=false;const requests=[],checks=[];
const server=createServer((req,res)=>{
  requests.push({url:req.url,method:req.method,cookie:!!req.headers.cookie,authorization:!!req.headers.authorization});
  res.setHeader('Cache-Control','no-store');
  if(req.url===owner){res.setHeader('Content-Type','text/html');res.end('<script src="/adapter.js"></script>');return;}
  if(req.url==='/adapter.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle);return;}
  if(req.url==='/prepared-register-worker.js'){res.setHeader('Content-Type','text/javascript');res.end(worker);return;}
  if(req.url==='/prepared-register'){res.setHeader('Content-Type','text/html');res.setHeader('X-AcademyOS-Public-Shell','register-v1');res.end(html(version));return;}
  if(/^\/_next\/static\/[AB]\.(js|css)$/.test(req.url)){
    if(fail&&req.url.endsWith('B.js')){res.writeHead(503);res.end();return;}
    res.setHeader('Content-Type',req.url.endsWith('.js')?'text/javascript':'text/css');res.end(req.url.endsWith('.js')?`window.shellBuild='${req.url.includes('/A.')?'A':'B'}';`:'body { color: black; }');return;
  }
  if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
  res.writeHead(404);res.end();
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true});const context=await browser.newContext();const page=await context.newPage();
const pass=name=>{checks.push({name,status:'passed'});console.log('PASS '+name)};
const inspect=()=>page.evaluate(async()=>{const names=await caches.keys(),index=await caches.open('academyos-prepared-public-v1:index');const pointer=await (await index.match('/prepared-register/cache-pointer'))?.json();const entries={};for(const name of names){const c=await caches.open(name);entries[name]=(await c.keys()).map(r=>new URL(r.url).pathname).sort()}return {names:names.sort(),pointer,entries}});
try{
  await page.goto(origin+owner);await page.waitForFunction(()=>!!window.shell);
  const prepare=()=>page.evaluate(()=>window.shell.prepareRegisterShell());
  assert.equal(await page.evaluate(()=>window.shell.registerShellAvailable()),false);
  await prepare();let a=await inspect();assert.ok(a.pointer?.current);assert.equal(a.pointer.previous,null);assert.deepEqual(a.entries[a.pointer.current],['/_next/static/A.css','/_next/static/A.js','/prepared-register']);assert.equal(await page.evaluate(()=>window.shell.registerShellAvailable()),true);pass('First preparation stores complete public build A');
  let n=requests.length;await prepare();const same=await inspect();assert.deepEqual(same.pointer,a.pointer);const second=requests.slice(n);assert.equal(second.filter(r=>r.url==='/prepared-register').length,1);assert.equal(second.filter(r=>r.url.startsWith('/_next/static/')).length,0);pass('Unchanged preparation fetches HTML only and retains pointer');
  version='B';fail=true;await assert.rejects(prepare(),/offline_shell_unavailable/);const rejected=await inspect();assert.deepEqual(rejected.pointer,a.pointer);assert.deepEqual(rejected.names,a.names);assert.deepEqual(rejected.entries[a.pointer.current],a.entries[a.pointer.current]);pass('Failed changed build preserves complete A and removes candidate');
  fail=false;await prepare();const b=await inspect();assert.notEqual(b.pointer.current,a.pointer.current);assert.notEqual(b.pointer.revision,a.pointer.revision);assert.equal(b.pointer.previous,a.pointer.current);assert.deepEqual(b.entries[b.pointer.current],['/_next/static/B.css','/_next/static/B.js','/prepared-register']);assert.deepEqual(b.entries[a.pointer.current],a.entries[a.pointer.current]);pass('Successful build B switches revision and retains complete A');
  await context.setOffline(true);const offline=await context.newPage();await offline.goto(origin+'/prepared-register');assert.equal(await offline.locator('#academyos-public-register-shell').textContent(),'Build B');assert.equal(await offline.evaluate(()=>window.shellBuild),'B');assert.match(await offline.evaluate(async()=>await (await fetch('/_next/static/A.js')).text()),/shellBuild='A'/);pass('Offline navigation serves B and prior A asset remains available');
  await context.setOffline(false);const all=await inspect();for(const [name,paths] of Object.entries(all.entries)){assert.ok(name.startsWith('academyos-prepared-public-v1:'));for(const path of paths)assert.ok(path==='/prepared-register/cache-pointer'||path==='/prepared-register'||/^\/_next\/static\/[AB]\.(js|css)$/.test(path),path);}
  assert.ok(requests.every(r=>r.method==='GET'&&!r.cookie&&!r.authorization));assert.ok(requests.every(r=>[owner,'/adapter.js','/prepared-register-worker.js','/prepared-register','/favicon.ico'].includes(r.url)||/^\/_next\/static\/[AB]\.(js|css)$/.test(r.url)));pass('Cache and loopback traffic contain only expected public resources and no credentials');
  const receipt={date:new Date().toISOString(),scope:'Isolated headless Chromium, actual public shell client and worker, fictional loopback builds; not hosted or private register proof',passed:true,checks,browser:browser.version(),node:process.version,hashes};await mkdir(resolve(evidence,'..'),{recursive:true});await writeFile(evidence,JSON.stringify(receipt,null,2)+'\n');
}finally{await browser.close();await new Promise(ok=>server.close(ok));}
