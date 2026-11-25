import { AsyncLocalStorage } from 'node:async_hooks';
import { spawn } from 'node:child_process';
import { mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(import.meta.dirname, '../..');
const require = createRequire(import.meta.url);
const key = 'a'.repeat(64);
const actors = new Set(['user_owner', 'user_manager', 'user_unassigned', 'user_guardian', 'user_trainer', 'user_other_owner']);

function database() {
  const child = spawn('python3', ['-u', join(import.meta.dirname, 'local-db.py')], { stdio: ['pipe', 'pipe', 'inherit'] });
  let sequence = 0, resolveReady, rejectReady;
  const pending = new Map();
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const closed = new Promise(resolve => child.once('close', code => {
    const error = new Error('Disposable class fixture exited (' + code + ')');
    rejectReady(error);
    for (const operation of pending.values()) operation.reject(error);
    resolve();
  }));
  createInterface({ input: child.stdout }).on('line', line => {
    const response = JSON.parse(line);
    if (response.ready) return resolveReady(response.ready);
    const operation = pending.get(response.id);
    pending.delete(response.id);
    if (response.error) operation.reject(new Error(response.error));
    else operation.resolve(response.value);
  });
  return {
    ready,
    request(data) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        pending.set(id, { resolve, reject });
        child.stdin.write(JSON.stringify({ ...data, id }) + '\n');
      });
    },
    async close() {
      if (child.exitCode === null) child.stdin.end('{"action":"close"}\n');
      await closed;
    },
  };
}

export async function startClassMediaFixture(temp, { hosted = false } = {}) {
  const bridge = database();
  const requests = new AsyncLocalStorage();
  const storage = join(temp, 'private-objects');
  let server;
  const stagedOrigin = 'https://staging.academy.nahr.dev';
  const objects = new Map();
  const providerCalls = [];
  let loseNextObjectWrite = false;
  const previous = Object.fromEntries(['APP_ENV', 'ACADEMY_CLASS_MEDIA_LOCAL_DIR', 'ACADEMY_CLASS_MEDIA_LOCAL_ORIGIN',
    'ACADEMY_CLASS_MEDIA_STAGING_ENABLED', 'ACADEMY_CLASS_MEDIA_STAGING_ACADEMY', 'VERCEL_ENV', 'NEXT_PUBLIC_APP_URL',
    'STORAGE_MEDIA_BUCKET', 'ONBOARDING_PROOF_KEY'].map(key => [key, process.env[key]]));
  async function close() {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await bridge.close();
    delete globalThis.classMediaVerification;
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
  try {
    await mkdir(storage, { mode: 0o700 });
    await symlink(join(root, 'node_modules'), join(temp, 'node_modules'), 'dir');
    globalThis.classMediaVerification = {
      subject: () => requests.getStore(), db: bridge.request,
      async provider(url, init) {
        const name = new URL(url).pathname.split('/academy-media/')[1];
        const method = init.method;
        const headers = new Headers(init.headers);
        const subject = headers.get('authorization').slice(7);
        const allowed = await bridge.request({ action: 'storage', name, method, subject, proof: headers.get('x-academyos-class-media') });
        providerCalls.push({ method, name, allowed });
        if (!allowed) return Response.json({ error: 'not_found', statusCode: '404' }, { status: method === 'POST' ? 403 : 400 });
        if (method === 'GET') return new Response(objects.get(name));
        if (method === 'DELETE') objects.delete(name);
        if (method === 'POST') {
          objects.set(name, new Uint8Array(init.body));
          if (loseNextObjectWrite) { loseNextObjectWrite = false; throw Error('verifier dropped committed provider response'); }
        }
        return Response.json({ done: true });
      },
    };
    const serverBundle = await build({
      stdin: { contents: `export {GET, POST, PUT} from './apps/web/src/app/api/class-media/route.ts'; export {NextRequest} from 'next/server';`, resolveDir: root },
      tsconfig: join(root, 'apps/web/tsconfig.json'), bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external',
      plugins: [{ name: 'class-media-local-identities', setup(builder) {
        builder.onResolve({ filter: /^next\/server$/ }, item => ({ path: require.resolve(item.path), external: true }));
        builder.onResolve({ filter: /^@\/lib\/class-media-hosted-store$/ }, () => ({ path: 'provider', namespace: 'fixture' }));
        builder.onLoad({ filter: /^provider$/, namespace: 'fixture' }, () => ({ resolveDir: root, contents: `
          import {HostedClassMediaStore as Base} from './apps/web/src/lib/class-media-hosted-store.ts';
          export * from './apps/web/src/lib/class-media-hosted-store.ts';
          export class HostedClassMediaStore extends Base {
            constructor(actor) { super(actor,globalThis.classMediaVerification.provider); }
          }` }));
        builder.onResolve({ filter: /^@\/lib\/onboarding-server$/ }, () => ({ path: 'onboarding', namespace: 'fixture' }));
        builder.onLoad({ filter: /^onboarding$/, namespace: 'fixture' }, () => ({ resolveDir: root, contents: `
          import {gatewayFetch} from './apps/web/src/lib/onboarding-gateway.ts';
          import {databaseError} from './apps/web/src/lib/onboarding.ts';
          export class JourneyError extends Error { constructor(code,http=503) { super(code); this.code=code; this.http=http; } }
          export async function classMediaSession() {
            const subject=globalThis.classMediaVerification.subject();
            if (!subject) throw new JourneyError('denied',401);
            return {client:{subject}};
          }
          export async function stagingClassMediaSession() {
            const {client}=await classMediaSession();
            return {client,subject:client.subject,token:client.subject,key:'fixture-publishable'};
          }
          export async function rpc({subject},name,args) {
            const response=await gatewayFetch(subject,()=>'${key}',async()=>true,async(url,init)=>{
              const proof=new Headers(init.headers).get('x-academyos-gateway');
              const result=await globalThis.classMediaVerification.db({action:'rpc',name,subject,proof,args:JSON.parse(init.body)});
              return Response.json(result);
            },fetchOrigin)(fetchOrigin+'/rest/v1/rpc/'+name,{method:'POST',body:JSON.stringify(args)});
            const result=await response.json();
            if (result.error) {
              const code=databaseError(result.error);
              throw new JourneyError(code,code==='denied'?403:code==='invalid'?422:['conflict','review_required'].includes(code)?409:503);
            }
            if (result.data == null || Buffer.byteLength(JSON.stringify(result.data))>32768) throw new JourneyError('unavailable');
            return result.data;
          }
          const fetchOrigin='http://127.0.0.1:54321';` }));
      }}],
    });
    const bundledRoute = join(temp, 'route.mjs');
    await writeFile(bundledRoute, serverBundle.outputFiles[0].text);
    const route = await import(pathToFileURL(bundledRoute));

    const browserBundle = await build({
      stdin: { contents: `
        import React from 'react';
        import {createRoot} from 'react-dom/client';
        import Media from './apps/web/src/components/class-media-workspace.tsx';
        import Planning from './apps/web/src/components/date-planning-workspace.tsx';
        import {prepareClassMediaImage} from './apps/web/src/lib/class-media-image.ts';
        const [,locale,,academy,mode,first,second] = location.pathname.split('/');
        window.prepareClassMediaImage=prepareClassMediaImage;
        createRoot(document.getElementById('root')).render(mode==='class-media'
          ? <Media locale={locale} academy={academy} event={first} chunkedUploads={${hosted}}/>
          : <Planning locale={locale} academy={academy} program={first} day={second} classMediaEnabled/>);
      `, resolveDir: root, loader: 'tsx' },
      tsconfig: join(root, 'apps/web/tsconfig.json'), bundle: true, write: false, format: 'iife', jsx: 'automatic',
      define: { 'process.env.NODE_ENV': '"production"' },
      plugins: [{ name: 'synthetic-clerk-and-router', setup(builder) {
        builder.onResolve({ filter: /^(@clerk\/nextjs|next\/link|next\/navigation)$/ }, item => ({ path: item.path, namespace: 'fixture' }));
        builder.onLoad({ filter: /.*/, namespace: 'fixture' }, item => ({ loader: 'tsx', resolveDir: root, contents:
          item.path === 'next/link' ? 'export default function Link(props) {return <a {...props}/>;}' :
          item.path === 'next/navigation' ? 'export const useRouter=()=>({push:href=>location.assign(href),replace:href=>location.replace(href)});' :
          `const subject=()=>document.cookie.match(/media-actor=(user_[a-z_]+)/)?.[1];
            export const useUser=()=>({isLoaded:true,user:subject()?{id:subject()}:null});
            export const useAuth=()=>({isLoaded:true,userId:subject()});
            export const useClerk=()=>({});
            export const UserButton=()=>null;`,
        }));
      }}],
    });
    const css = await readFile(join(root, 'apps/web/src/app/globals.css'), 'utf8');
    const data = await bridge.ready;
    server = createServer(async (incoming, outgoing) => {
      try {
        const url = new URL(incoming.url, origin);
        const subject = /(?:^|; )media-actor=(user_[a-z_]+)(?:;|$)/.exec(incoming.headers.cookie ?? '')?.[1];
        let respond;
        if (url.pathname === '/api/class-media' && route[incoming.method]) {
          const incomingHeaders = new Headers(incoming.headers);
          if (hosted && incomingHeaders.get('origin') === origin) incomingHeaders.set('origin', stagedOrigin);
          const request = new route.NextRequest(hosted ? new URL(url.pathname + url.search, stagedOrigin) : url, {
            method: incoming.method, headers: incomingHeaders,
            ...(incoming.method === 'GET' ? {} : { body: Readable.toWeb(incoming), duplex: 'half' }),
          });
          respond = await requests.run(actors.has(subject) ? subject : null, () => route[incoming.method](request));
        } else if (url.pathname === '/api/planning' && incoming.method === 'POST' && subject === 'user_owner') {
          const chunks = [];
          for await (const chunk of incoming) chunks.push(chunk);
          const fields = JSON.parse(Buffer.concat(chunks));
          const { gatewayFetch, DATABASE_ORIGIN } = await import(pathToFileURL(join(temp, 'planning-gateway.mjs')));
          const result = await gatewayFetch(subject, () => key, async () => true, async (url, init) =>
            Response.json(await bridge.request({ action: 'rpc', name: 'q6_read_v1', subject,
              args: JSON.parse(init.body), proof: new Headers(init.headers).get('x-academyos-gateway') })))(
            DATABASE_ORIGIN + '/rest/v1/rpc/q6_read_v1', {
              method: 'POST', body: JSON.stringify({ a: fields.academy, p: fields.program, day: fields.day, after_id: null }),
            });
          respond = result;
        } else if (url.pathname === '/bundle.js') {
          respond = new Response(browserBundle.outputFiles[0].text, { headers: { 'Content-Type': 'text/javascript' } });
        } else {
          const locale = url.pathname.split('/')[1] === 'ar' ? 'ar' : 'en';
          respond = new Response(`<!doctype html><html lang="${locale}" dir="${locale === 'ar' ? 'rtl' : 'ltr'}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`, { headers: { 'Content-Type': 'text/html' } });
        }
        outgoing.writeHead(respond.status, Object.fromEntries(respond.headers)).end(Buffer.from(await respond.arrayBuffer()));
      } catch (error) {
        outgoing.writeHead(503).end('Class media fixture unavailable');
        console.error(error);
      }
    });
    const limitedGateway = await build({
      entryPoints: [join(root, 'apps/web/src/lib/onboarding-gateway.ts')], bundle: true, write: false, platform: 'node', format: 'esm',
    });
    await writeFile(join(temp, 'planning-gateway.mjs'), limitedGateway.outputFiles[0].text);
    await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
    const origin = 'http://127.0.0.1:' + server.address().port;
    process.env.APP_ENV = 'staging';
    process.env.ACADEMY_CLASS_MEDIA_LOCAL_DIR = storage;
    process.env.ACADEMY_CLASS_MEDIA_LOCAL_ORIGIN = origin;
    if (hosted) Object.assign(process.env, { VERCEL_ENV: 'production', NEXT_PUBLIC_APP_URL: stagedOrigin,
      STORAGE_MEDIA_BUCKET: 'academy-media', ACADEMY_CLASS_MEDIA_STAGING_ACADEMY: data.academy,
      ACADEMY_CLASS_MEDIA_STAGING_ENABLED: 'true', ONBOARDING_PROOF_KEY: key });
    return { data, db: bridge.request, storage, origin, close, objects, providerCalls,
      loseProviderReply() { loseNextObjectWrite = true; } };
  } catch (error) {
    await close();
    throw error;
  }
}
