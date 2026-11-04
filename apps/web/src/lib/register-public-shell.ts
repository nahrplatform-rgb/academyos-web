export const PREPARED_REGISTER_PATH='/prepared-register';

export async function registerShellAvailable() {
  if (!('serviceWorker' in navigator) || !('caches' in globalThis)) return false;
  const [registration,marker]=await Promise.all([navigator.serviceWorker.getRegistration(PREPARED_REGISTER_PATH),
    caches.match('/prepared-register/cache-pointer',{cacheName:'academyos-prepared-public-v1:index'})]);
  return Boolean(registration?.active&&marker);
}

export async function prepareRegisterShell() {
  if (!('serviceWorker' in navigator) || !globalThis.isSecureContext) throw new Error('offline_shell_unavailable');
  const registration=await navigator.serviceWorker.register('/prepared-register-worker.js',{scope:PREPARED_REGISTER_PATH});
  if (registration.active&&!registration.installing) await registration.update();
  const worker=registration.installing??registration.waiting??registration.active;
  if (!worker) throw new Error('offline_shell_unavailable');
  if (worker.state!=='activated') await new Promise<void>((resolve,reject)=>{
    const timer=setTimeout(()=>finish(false),5000);
    function finish(ready:boolean) {
      clearTimeout(timer);
      worker!.removeEventListener('statechange',changed);
      if (ready) resolve();else reject(new Error('offline_shell_unavailable'));
    }
    function changed() {
      if (worker!.state==='activated') finish(true);
      else if (worker!.state==='redundant') finish(false);
    }
    worker!.addEventListener('statechange',changed);
    changed();
  });
  await new Promise<void>((resolve,reject)=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>finish(false),15000);
    function finish(ready:boolean) {
      clearTimeout(timer);channel.port1.close();
      if (ready) resolve();else reject(new Error('offline_shell_unavailable'));
    }
    channel.port1.onmessage=event=>finish(event.data==='ready');
    worker.postMessage('prepare-public-shell',[channel.port2]);
  });
}
