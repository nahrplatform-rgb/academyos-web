// This fixture creates a separate Next application in a temporary directory.
// Only the synthetic session, key release, limiter and PostgREST link are adapters.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';
import {mkdir, readFile, readdir, symlink, writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {dirname, join, relative} from 'node:path';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const require = createRequire(import.meta.url);
const stage = 'https://staging.academy.nahr.dev';

const key = 'a'.repeat(64); // Matches the disposable PostgreSQL signing fixture only.

function pgBridge(root) {
  const child = spawn('python3', ['-u', join(root, 'scripts/working-day/owner_db.py')], {stdio: ['pipe', 'pipe', 'inherit']});
  const pending = new Map();
  let ready, rejectReady, sequence = 0;
  const fixture = new Promise((resolve, reject) => {ready = resolve; rejectReady = reject;});
  const done = new Promise(resolve => child.once('close', code => {
    const error = new Error(`Disposable database bridge exited (${code})`);
    rejectReady(error);
    for (const request of pending.values()) request.reject(error);
    resolve();
  }));
  createInterface({input: child.stdout}).on('line', line => {
    const reply = JSON.parse(line);
    if (reply.ready) {ready(reply.ready); return;}
    const request = pending.get(reply.id);
    pending.delete(reply.id);
    if (reply.error) request.reject(new Error(reply.error));
    else request.resolve(reply.value);
  });
  return {
    fixture,
    db(command) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, {resolve, reject});
        child.stdin.write(JSON.stringify({...command, id}) + '\n');
      });
    },
    async close() {
      if (child.exitCode === null) child.stdin.end(JSON.stringify({action: 'close'}) + '\n');
      await done;
    },
  };
}

async function listen(server) {
  await new Promise((resolve, reject) => {server.once('error', reject);server.listen(0, '127.0.0.1', resolve);});
  return `http://127.0.0.1:${server.address().port}`;
}

export async function ownerFixture(root, temp, {pilot=false} = {}) {
  const routes = ['experience','planning','register-download','register-dispatch',...(pilot?['register-key','attendance']:[])];
  const bridge = pgBridge(root);
  let api, app, appClosed, log = '', origin;
  const state = {subject: 'user_owner', events: [], dispatchBodies: [], rpcs: [], limits: []};
  const env = {PATH:process.env.PATH, ...(process.env.TMPDIR ? {TMPDIR:process.env.TMPDIR} : {}),
    NODE_ENV:'production', NEXT_TELEMETRY_DISABLED:'1'};
  async function put(path, body) {
    const file = join(temp, path);
    await mkdir(dirname(file), {recursive: true});
    await writeFile(file, body);
  }
  async function close() {
    if (app?.exitCode === null) app.kill();
    if (appClosed) await appClosed;
    if (api?.listening) await new Promise(resolve => api.close(resolve));
    delete globalThis.ownerDayFixture;
    await bridge.close();
  }
  try {
    const data = await bridge.fixture;
    const scopes = pilot ? {} : Object.fromEntries(await Promise.all(data.events.map(async ({academy,event}) => {
      const scope = {namespace:randomUUID(),environment:'staging',subject:'user_owner',academy,
        device:randomUUID(),epoch:'fields_v1',capability:'owner-register-v1'};
      assert.equal(await bridge.db({action:'slot',...scope,event}),true);
      const binding = JSON.stringify([1,scope.environment,scope.subject,scope.academy,scope.device,scope.epoch,scope.capability,scope.namespace]);
      return [event,{scope,binding,material:randomBytes(32).toString('base64')}];
    })));
    const adapters = {
      server: `import{gatewayFetch,DATABASE_ORIGIN,GatewayError}from'${root}/apps/web/src/lib/onboarding-gateway.ts';
        import{databaseError}from'${root}/apps/web/src/lib/onboarding.ts';
        export class JourneyError extends Error{constructor(code,http=503){super(code);this.code=code;this.http=http;}}
        export async function onboardingSession(){
          const {subject}=globalThis.ownerDayFixture;
          if(!subject)throw new JourneyError('denied',401);
          return {subject,client:{subject}};
        }
        export async function rpc({subject},name,args){
          const s=globalThis.ownerDayFixture;
          const response=await gatewayFetch(subject,()=>'${key}',async write=>{
            s.limits.push(write?'gateway-write':'gateway-read');return true;
          },async(url,init)=>{
            s.rpcs.push(name);
            const proof=new Headers(init.headers).get('x-academyos-gateway');
            const result=await s.db({action:'rpc',name,subject,proof,args:JSON.parse(init.body)});
            return Response.json(result);
          })(DATABASE_ORIGIN+'/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)});
          const result=await response.json();
          if(result.error){const code=databaseError(result.error);throw new JourneyError(code,code==='denied'?403:code==='conflict'?409:503);}
          return result.data;
        }`,
      limiter: `export const stagingRedis=()=>({}),rateLimitSubject=s=>s,rateLimitAllowed=r=>r.success;
        export function stagingLimiter(_,bucket){return{limit:async()=>{globalThis.ownerDayFixture.limits.push(bucket);return{success:true};}}}`,
    };
    const serverCode = await build({
      stdin:{contents: routes.map((r,i)=>`export {POST as route${i}} from './apps/web/src/app/api/${r}/route.ts';`).join('\n')+
        "\nexport {NextRequest} from 'next/server';",resolveDir:root},
      tsconfig:join(root,'apps/web/tsconfig.json'),bundle:true,format:'esm',platform:'node',packages:'external',write:false,
      define:{'process.env.APP_ENV':'"staging"','process.env.LOCAL_REGISTER_TRANSFER_ENABLED':'"true"',
        'process.env.LOCAL_REGISTER_DISPATCH_ENABLED':'"true"',
        ...(pilot?{'process.env.LOCAL_REGISTER_KEY_ENABLED':'"true"',
          'process.env.LOCAL_REGISTER_WRAP_KEY_V1':JSON.stringify(randomBytes(32).toString('hex'))}:{})},
      plugins:[{name:'fixture-transport',setup(b){
        b.onResolve({filter:/^next\/server$/},v=>({path:require.resolve(v.path),external:true}));
        b.onResolve({filter:/^@\/lib\/onboarding-server$/},()=>({path:'server',namespace:'fixture'}));
        b.onResolve({filter:/^@\/lib\/rate-limit$/},()=>({path:'limiter',namespace:'fixture'}));
        b.onResolve({filter:/^server-only$/},()=>({path:'serverOnly',namespace:'fixture'}));
        b.onLoad({filter:/.*/,namespace:'fixture'},v=>({contents:adapters[v.path]??'',loader:'js',resolveDir:root}));
      }}],
    });
    await put('fixture-api.mjs', serverCode.outputFiles[0].text);
    const handlers = await import(pathToFileURL(join(temp,'fixture-api.mjs')));
    globalThis.ownerDayFixture = Object.assign(state, {db: bridge.db});
    api = createServer(async (req, res) => {
      try {
        if (req.method !== 'POST' || req.headers.origin !== origin) {res.writeHead(403).end(); return;}
        const name = req.url?.slice('/api/'.length);
        if (!req.url?.startsWith('/api/') || ![...routes,'fixture-key','fixture-signout'].includes(name)) {res.writeHead(404).end(); return;}
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks).toString('utf8');
        const payload = JSON.parse(body);
        const record = {route:name, action:payload.action ?? null, requestBytes:Buffer.byteLength(body)};
        state.events.push(record);
        let reply;
        if (name === 'fixture-key') {
          const found = Object.values(scopes).find(candidate => candidate.binding === payload.binding &&
            candidate.scope.subject === state.subject);
          reply = found ? Response.json({data:{binding:found.binding,keyId:'fictional_recovery',material:found.material,verifiedAt:Date.now()}}) :
            Response.json({error:'denied'},{status:403});
        } else if (name === 'fixture-signout') {
          state.subject = null;
          reply = Response.json({data:true});
        } else {
          if (name === 'register-dispatch') state.dispatchBodies.push(body);
          const headers = {origin:stage,'content-type':'application/json'};
          for (const name of ['x-academyos-original-subject','x-academyos-register-namespace','x-academyos-register-device']) {
            if (req.headers[name]) headers[name] = req.headers[name];
          }
          const request = new handlers.NextRequest(`${stage}/api/${name}`,{method:'POST',headers,body});
          reply = await handlers['route'+routes.indexOf(name)](request);
        }
        const output = await reply.text();
        Object.assign(record,{status:reply.status,responseBytes:Buffer.byteLength(output)});
        res.writeHead(reply.status,{'content-type':'application/json','cache-control':'no-store'}).end(output);
      } catch {
        res.writeHead(503,{'content-type':'application/json','cache-control':'no-store'}).end('{"error":"unavailable"}');
      }
    });
    const apiOrigin = await listen(api);
    const client = await build({
      stdin:{contents:`export{default as Runtime}from'./apps/web/src/components/workspace-runtime.tsx';
        export{default as Experience}from'./apps/web/src/components/experience-workspace.tsx';
        export{default as Planning}from'./apps/web/src/components/date-planning-workspace.tsx';
        export{default as Register}from'./scripts/working-day/owner-register.tsx';
        ${pilot?`export{default as Attendance}from'./apps/web/src/components/attendance-workspace.tsx';
        export{default as RegisterAccountBoundary}from'./apps/web/src/components/register-account-boundary.tsx';
        export{default as PreparedRegisterStartup}from'./apps/web/src/components/prepared-register-startup.tsx';`:''}`,
        resolveDir:root,loader:'tsx'},
      tsconfig:join(root,'apps/web/tsconfig.json'),bundle:true,write:false,format:'esm',jsx:'automatic',
      external:['react','react/*','next/*'],banner:{js:'"use client";'},
      plugins:[{name:'fictional-clerk-presentation',setup(b){
        b.onResolve({filter:/^@clerk\/nextjs$/},()=>({path:'clerk',namespace:'fixture'}));
        b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:pilot?`
          import{useSyncExternalStore}from'react';
          const event='fixture-clerk-identity';
          const subscribe=callback=>{window.addEventListener(event,callback);return()=>window.removeEventListener(event,callback)};
          const subject=()=>sessionStorage.getItem('fixture-signed-out')?'':sessionStorage.getItem('fixture-subject')||'user_owner';
          export function useUser(){const id=useSyncExternalStore(subscribe,subject,()=> 'user_owner');return{isLoaded:true,user:id?{id}:null};}
          export function UserButton(){return null;}
          export function useClerk(){return{openUserProfile:()=>{},signOut:async()=>{
            const reply=await fetch('/api/fixture-signout',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
            if(!reply.ok)throw new Error('Fixture sign-out failed');
            sessionStorage.setItem('fixture-signed-out','1');window.dispatchEvent(new Event(event));
          }}}
          `:`
          export function useUser(){return{isLoaded:true,user:{id:'user_owner'}};}
          export function UserButton(){return null;}`,loader:'js',resolveDir:root}));
      }}],
    });
    await symlink(join(root,'node_modules'),join(temp,'node_modules'),'dir');
    await put('package.json','{"name":"academyos-owner-working-day-fixture","private":true}');
    await put('next.config.mjs',`export default {devIndicators:false,async rewrites(){return[{source:'/api/:path*',destination:'${apiOrigin}/api/:path*'}]},
      async headers(){return [{source:'/prepared-register',headers:[{key:'X-AcademyOS-Public-Shell',value:'register-v1'}]}]}};`);
    await put('app/globals.css',await readFile(join(root,'apps/web/src/app/globals.css'),'utf8'));
    await put('app/layout.jsx',"import './globals.css';export default function Layout({children}){return <html lang='en'><body>{children}</body></html>}");
    await put('fixture-client.jsx',client.outputFiles[0].text);
    const workspace='app/[locale]/workspace/[academy]';
    async function page(subpath,content) {
      const path=join(workspace,subpath), entry='./'+relative(dirname(join(temp,path)),join(temp,'fixture-client.jsx'));
      await put(path,content.replaceAll('__CLIENT__',entry));
    }
    const workspaceLayout=await readFile(join(root,'apps/web/src/app/[locale]/workspace/[academy]/layout.tsx'),'utf8');
    await page('layout.tsx',workspaceLayout
      .replace("import WorkspaceRuntime from '@/components/workspace-runtime';","import {Runtime as WorkspaceRuntime} from '__CLIENT__';")
      .replace("import { uuidPattern } from '@/lib/onboarding';","const uuidPattern=/^[a-f0-9-]{36}$/i;"));
    for (const view of ['home','calendar']) await page(view+'/page.jsx',`import{Experience}from'__CLIENT__';
      export default async function Page({params,searchParams}){const p=await params,q=await searchParams;
      return <Experience {...p} role="owner" calendar={${view==='calendar'}} anchor={q.anchor}/>}`);
    await page('programs/[program]/[day]/page.jsx',`import{Planning}from'__CLIENT__';
      export default async function Page({params,searchParams}){const p=await params,q=await searchParams;
      return <Planning {...p} from={q.from} returnTo={q.return==='calendar'?'calendar':undefined}/>}`);
    const params=['en','ar'].flatMap(locale=>data.events.map(({academy,event})=>({locale,academy,event})));
    if (pilot) {
      const eventRoute=await readFile(join(root,'apps/web/src/app/[locale]/workspace/[academy]/attendance/[event]/page.tsx'),'utf8');
      await page('attendance/[event]/page.tsx',eventRoute
        .replace("import {auth} from '@clerk/nextjs/server';","const auth={protect:async()=>({userId:'user_owner'})};")
        .replace("import AttendanceWorkspace from '@/components/attendance-workspace';","import {Attendance as AttendanceWorkspace} from '__CLIENT__';")
        .replace("import {offlineRegisterPilotEnabled} from '@/lib/config';","const offlineRegisterPilotEnabled=(_env: unknown)=>true;")
        .replace("import {uuidPattern} from '@/lib/onboarding';","const uuidPattern=/^[a-f0-9-]{36}$/i;"));
      await put('app/[locale]/layout.jsx',`import {RegisterAccountBoundary} from '../../fixture-client.jsx';
        export default async function Layout({children,params}){
          const {locale}=await params;
          return <RegisterAccountBoundary enabled={true} locale={locale}>{children}</RegisterAccountBoundary>;
        }`);
      const startup=await readFile(join(root,'apps/web/src/app/prepared-register/page.tsx'),'utf8');
      await put('app/prepared-register/page.tsx',startup.replace(
        "import PreparedRegisterStartup from '@/components/prepared-register-startup';",
        "import {PreparedRegisterStartup} from '../../fixture-client.jsx';"));
      await put('app/[locale]/page.jsx','export default function Landing(){return <h1>Fictional signed-out landing</h1>}');
      await put('public/prepared-register-worker.js',await readFile(join(root,'apps/web/public/prepared-register-worker.js'),'utf8'));
    } else {
      await page('attendance/[event]/page.jsx',`import{Register}from'__CLIENT__';
        export const dynamicParams=false;export function generateStaticParams(){return ${JSON.stringify(params)}}
        export default async function Page({params}){const p=await params;return <Register key={p.locale+':'+p.event}
        locale={p.locale} event={p.event} scope={${JSON.stringify(Object.fromEntries(Object.entries(scopes).map(([event,{scope}])=>[event,scope])))}[p.event]}/>}`);
    }
    await mkdir(join(temp,'public'),{recursive:true});
    const next = join(root,'node_modules/next/dist/bin/next');
    const buildProcess=spawn(process.execPath,[next,'build','--webpack'],{cwd:temp,env,stdio:['ignore','pipe','pipe']});
    for(const stream of [buildProcess.stdout,buildProcess.stderr]) stream.on('data',chunk=>log+=chunk);
    const result=await new Promise(resolve=>buildProcess.once('close',resolve));
    if(result!==0) throw new Error('Isolated Next build failed\n'+log.slice(-4500));
    const registerPaths=params.map(p=>`/${p.locale}/workspace/${p.academy}/attendance/${p.event}`);
    const buildId=(await readFile(join(temp,'.next/BUILD_ID'),'utf8')).trim();
    const assets=(await readdir(join(temp,'.next/static'),{recursive:true})).filter(p=>/\.(js|css)$/.test(p)).map(p=>'/_next/static/'+p);
    const paths=[...registerPaths,...assets];
    if (!pilot) await put('public/owner-fixture-sw.js',`
      const cacheName=${JSON.stringify('owner-fixture-'+buildId)};
      const shell=new Set(${JSON.stringify(registerPaths)}), assets=new Set(${JSON.stringify(assets)});
      self.addEventListener('install',event=>event.waitUntil((async()=>{
        const cache=await caches.open(cacheName);
        await cache.addAll([...shell,...assets].map(path=>new Request(path,{credentials:'omit',cache:'reload',redirect:'error'})));
        await self.skipWaiting();
      })()));
      self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
      self.addEventListener('fetch',event=>{
        const request=event.request, url=new URL(request.url);
        if(request.method!=='GET'||url.origin!==self.location.origin||url.search)return;
        if(!(shell.has(url.pathname)&&request.mode==='navigate')&&!assets.has(url.pathname))return;
        event.respondWith((async()=>{const cache=await caches.open(cacheName);return await cache.match(request)||fetch(request)})());
      });`);
    const socket = createServer();
    origin = await listen(socket);
    const port = new URL(origin).port;
    await new Promise(resolve=>socket.close(resolve));
    app = spawn(process.execPath,[next,'start','--hostname','127.0.0.1','--port',port],{cwd:temp,env,stdio:['ignore','pipe','pipe']});
    appClosed = new Promise(resolve=>app.once('close',resolve));
    for(const stream of [app.stdout,app.stderr]) stream.on('data',chunk=>log+=chunk);
    let ready=false;
    for(let i=0;i<100&&!ready;i++){
      try{ready=(await fetch(origin+registerPaths[0],{signal:AbortSignal.timeout(1500)})).ok;}
      catch {await new Promise(resolve=>setTimeout(resolve,100));}
    }
    assert.ok(ready,'Isolated Next server failed to start\n'+log.slice(-2500));
    return {data,origin,state,db:bridge.db,close,paths,registerPaths};
  } catch (error) {await close();throw error;}
}
