/* Root scope is needed for normal-route offline navigation. Never cache private responses. */
const shell='/prepared-workspace';
const cachePrefix='academyos-workspace-public-v1:';
const indexName=cachePrefix+'index';
const pointer='/prepared-workspace/cache-pointer';
const staticAsset=/^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css)$/;
const route=/^\/(en|ar)\/workspace\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/(players|calendar|attendance\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/;
let preparation;

function supported(url) {
  const match=route.exec(url.pathname);
  if (!match) return false;
  if (!url.search) return true;
  if (match[2]!=='calendar' || !/^\?anchor=\d{4}-\d{2}-\d{2}$/.test(url.search)) return false;
  const value=url.search.slice(8), date=new Date(value+'T00:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0,10)===value;
}
function preparationAllowed(message,client) {
  if(client?.type!=='window'||!client.url)return false;
  try {
    const source=new URL(client.url);
    if(source.origin!==self.location.origin)return false;
    // Preserve older normal-document clients. A SPA client can still report
    // its initial sign-in URL, so new callers supply their current route.
    if(message==='prepare-workspace-public-shell')return supported(source);
    if(!message||typeof message!=='object'||Array.isArray(message)||
      Object.keys(message).length!==2||!Object.hasOwn(message,'type')||!Object.hasOwn(message,'route')||
      message.type!=='prepare-workspace-public-shell'||typeof message.route!=='string'||
      message.route.length>256||!message.route.startsWith('/')||message.route.startsWith('//'))return false;
    const current=new URL(message.route,self.location.origin);
    return current.origin===self.location.origin&&!current.hash&&supported(current);
  } catch {return false;}
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

async function loadPublic(path,remaining) {
  const response=await fetch(new URL(path,self.location.origin),
    {credentials:'omit',cache:'no-store',redirect:'error'});
  if (!response.ok || Number(response.headers.get('content-length'))>remaining) throw new Error('public_response_unavailable');
  const content=response.headers.get('content-type')??'';
  if (path===shell ? !content.includes('text/html') || response.headers.get('x-academyos-public-shell')!=='workspace-v1' :
      path.endsWith('.css') ? !content.includes('text/css') : !content.includes('javascript')) throw new Error('unexpected_public_content');
  const reader=response.body?.getReader();
  if (!reader) throw new Error('empty_public_response');
  const chunks=[];
  let count=0;
  for (;;) {
    const {done,value}=await reader.read();
    if (done) break;
    count+=value.length;
    if (count>remaining) {await reader.cancel();throw new Error('public_response_limit');}
    chunks.push(value);
  }
  return {response:new Response(new Blob(chunks),{headers:{'Content-Type':content,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}}),count};
}
async function prepare() {
  let remaining=8*1024*1024;
  const publicPage=await loadPublic(shell,remaining);
  remaining-=publicPage.count;
  const html=await publicPage.response.clone().text();
  if (!html.includes('id="academyos-public-workspace-shell"')) throw new Error('invalid_public_shell');
  const assets=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1])
    .filter(path=>staticAsset.test(path)&&!path.includes('..')))];
  if (!assets.some(path=>path.endsWith('.js')) || assets.length>48) throw new Error('public_asset_bound');
  const revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(html))))
    .map(value=>value.toString(16).padStart(2,'0')).join('');
  const index=await caches.open(indexName), prior=await index.match(pointer);
  const previous=prior?await prior.json():null;
  if (previous?.revision===revision && typeof previous.current==='string' && previous.current.startsWith(cachePrefix)) {
    const current=await caches.open(previous.current);
    if ((await Promise.all([shell,...assets].map(path=>current.match(path)))).every(Boolean)) return;
  }
  const cacheName=cachePrefix+crypto.randomUUID(), next=await caches.open(cacheName);
  try {
    for (const path of assets) {
      const item=await loadPublic(path,remaining);
      remaining-=item.count;
      await next.put(path,item.response);
    }
    await next.put(shell,publicPage.response);
    const priorName=typeof previous?.current==='string'&&previous.current.startsWith(cachePrefix)?previous.current:null;
    await index.put(pointer,Response.json({current:cacheName,previous:priorName,revision}));
    await Promise.all((await caches.keys()).filter(name=>name.startsWith(cachePrefix)&&
      ![indexName,cacheName,priorName].includes(name)).map(name=>caches.delete(name))).catch(()=>{});
  } catch(error) {await caches.delete(cacheName);throw error;}
}
self.addEventListener('message',event=>{
  const client=event.source, port=event.ports[0];
  if (!port || !preparationAllowed(event.data,client)) return;
  preparation??=prepare().finally(()=>{preparation=undefined;});
  event.waitUntil(preparation.then(()=>port.postMessage('ready'),()=>port.postMessage('unavailable')));
});
async function cached(path) {
  const index=await caches.open(indexName), entry=await index.match(pointer);
  if (!entry) return;
  const {current,previous}=await entry.json();
  for (const name of [current,previous]) {
    if (typeof name!=='string'||!name.startsWith(cachePrefix)||name===indexName) continue;
    const result=await (await caches.open(name)).match(path);
    if (result) return result;
  }
}
self.addEventListener('fetch',event=>{
  const request=event.request, url=new URL(request.url);
  if (request.method!=='GET'||url.origin!==self.location.origin) return;
  if (request.mode==='navigate'&&supported(url)) {
    event.respondWith(fetch(request).catch(async()=>{
      const response=await cached(shell);
      // Keep each navigation's requested URL, including on consecutive offline opens.
      return response?new Response(response.body,{headers:response.headers}):Response.error();
    }));
  } else if (request.mode!=='navigate'&&!url.search&&staticAsset.test(url.pathname)&&!url.pathname.includes('..')&&event.clientId) {
    event.respondWith((async()=>{
      const client=await self.clients.get(event.clientId);
      if (client?.type==='window'&&client.url) {
        const source=new URL(client.url);
        // These entries contain only the checked public shell's JS/CSS.
        // Client.url may retain an earlier SPA route; it is not a reliable
        // current-path fence and never establishes private-data authority.
        if (source.origin===self.location.origin) {
          const result=await cached(url.pathname);
          if (result) return result;
        }
      }
      return fetch(request);
    })());
  }
});
