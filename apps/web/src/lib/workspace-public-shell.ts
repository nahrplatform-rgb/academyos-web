const WORKSPACE_ROUTE=/^\/(en|ar)\/workspace\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/(players|calendar)$/;

function supportedWorkspaceRoute(url:URL) {
  const match=WORKSPACE_ROUTE.exec(url.pathname);
  if (!match) return false;
  if (!url.search) return true;
  if (match[2]!=='calendar'||!/^\?anchor=\d{4}-\d{2}-\d{2}$/.test(url.search)) return false;
  const value=url.search.slice(8), date=new Date(value+'T00:00:00Z');
  return !Number.isNaN(date.valueOf())&&date.toISOString().slice(0,10)===value;
}

export async function prepareWorkspaceShell() {
  if (typeof navigator==='undefined'||!('serviceWorker' in navigator)||!globalThis.isSecureContext||
      !supportedWorkspaceRoute(new URL(location.href))) throw new Error('offline_shell_unavailable');
  const registration=await navigator.serviceWorker.register('/prepared-workspace-worker.js',{scope:'/'});
  const worker=registration.installing??registration.waiting??registration.active;
  if (!worker) throw new Error('offline_shell_unavailable');
  if (worker.state!=='activated') await new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>finish(false),5000);
    function finish(ready:boolean) {
      clearTimeout(timer);worker!.removeEventListener('statechange',changed);
      if (ready) resolve();else reject(new Error('offline_shell_unavailable'));
    }
    function changed() {
      if (worker!.state==='activated') finish(true);
      else if (worker!.state==='redundant') finish(false);
    }
    worker!.addEventListener('statechange',changed);changed();
  });
  await new Promise<void>((resolve,reject)=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>finish(false),15000);
    function finish(ready:boolean) {
      clearTimeout(timer);channel.port1.close();
      if (ready) resolve();else reject(new Error('offline_shell_unavailable'));
    }
    channel.port1.onmessage=event=>finish(event.data==='ready');
    worker.postMessage('prepare-workspace-public-shell',[channel.port2]);
  });
}
