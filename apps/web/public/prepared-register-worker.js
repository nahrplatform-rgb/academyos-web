/* The scope is /prepared-register. Never cache signed-in HTML, RSC or API responses. */
const shell='/prepared-register';
const cachePrefix='academyos-prepared-public-v1:';
const indexName=cachePrefix+'index';
const pointer='/prepared-register/cache-pointer';
const staticAsset=/^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css)$/;
let preparation;

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

async function loadPublic(path, remaining) {
  const response=await fetch(new URL(path,self.location.origin),
    {credentials:'omit',cache:'no-store',redirect:'error'});
  if (!response.ok || Number(response.headers.get('content-length'))>remaining) throw new Error('public_response_unavailable');
  const content=response.headers.get('content-type')??'';
  if (path===shell ? !content.includes('text/html') || response.headers.get('x-academyos-public-shell')!=='register-v1' :
      path.endsWith('.css') ? !content.includes('text/css') : !content.includes('javascript'))
    throw new Error('unexpected_public_content');
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
  // Fetch has already decoded compressed transfer bytes.
  return {response:new Response(new Blob(chunks),{headers:{'Content-Type':content,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}}),count};
}
async function prepare() {
  let remaining=8*1024*1024;
  const publicPage=await loadPublic(shell,remaining);
  remaining-=publicPage.count;
  const html=await publicPage.response.clone().text();
  if (!html.includes('id="academyos-public-register-shell"')) throw new Error('invalid_public_shell');
  const assets=[...new Set([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(match=>match[1])
    .filter(path=>staticAsset.test(path)&&!path.includes('..')))];
  if (!assets.some(path=>path.endsWith('.js')) || assets.length>48) throw new Error('public_asset_bound');
  const cacheName=cachePrefix+crypto.randomUUID();
  const next=await caches.open(cacheName), index=await caches.open(indexName);
  try {
    for (const path of assets) {
      const item=await loadPublic(path,remaining);
      remaining-=item.count;
      await next.put(path,item.response);
    }
    await next.put(shell,publicPage.response);
    const prior=await index.match(pointer);
    const previous=prior?JSON.parse(await prior.text()).current:null;
    await index.put(pointer,Response.json({current:cacheName,previous}));
    // Keep the previous public build for already-open tabs during the swap.
    await Promise.all((await caches.keys()).filter(name=>name.startsWith(cachePrefix)&&
      ![indexName,cacheName,previous].includes(name)).map(name=>caches.delete(name))).catch(()=>{});
  } catch(error) {await caches.delete(cacheName);throw error;}
}
self.addEventListener('message',event=>{
  const client=event.source, port=event.ports[0];
  if (!port || event.data!=='prepare-public-shell' || !client?.url) return;
  const caller=new URL(client.url);
  if (caller.origin!==self.location.origin ||
      !/^\/(en|ar)\/workspace\/[a-f0-9-]{36}\/attendance\/[a-f0-9-]{36}$/.test(caller.pathname)) return;
  preparation??=prepare().finally(()=>{preparation=undefined;});
  event.waitUntil(preparation.then(()=>port.postMessage('ready'),()=>port.postMessage('unavailable')));
});
async function cached(path) {
  const index=await caches.open(indexName);
  const entry=await index.match(pointer);
  if (!entry) return;
  const {current,previous}=await entry.json();
  for (const name of [current,previous]) {
    if (typeof name!=='string'||!name.startsWith(cachePrefix)) continue;
    const cache=await caches.open(name);
    const result=await cache.match(path);
    if (result) return result;
  }
}
self.addEventListener('fetch',event=>{
  const request=event.request, url=new URL(request.url);
  if (request.method!=='GET'||url.origin!==self.location.origin||url.search) return;
  if (request.mode==='navigate'&&url.pathname===shell) {
    event.respondWith(fetch(request).catch(async()=>await cached(shell)??Response.error()));
  } else if (request.mode!=='navigate'&&staticAsset.test(url.pathname)&&!url.pathname.includes('..')) {
    event.respondWith(cached(url.pathname).then(result=>result??fetch(request)));
  }
});
