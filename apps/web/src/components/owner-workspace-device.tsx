'use client';

import {useCallback,useEffect,useState,useSyncExternalStore} from 'react';
import {armRegisterAccount,readRegisterAccount,subscribeRegisterAccount} from '@/lib/register-device-account';
import {readWorkspaceSlot,subscribeWorkspaceSlot} from '@/lib/workspace-device-slots';
import {approveWorkspaceDevice,subscribeWorkspaceCoverage,workspaceDevice} from '@/lib/workspace-device';
import {WorkspaceTransportError} from '@/lib/workspace-client-transport';
import {listenForVisibleResume} from '@/lib/visible-resume';
import {inspectWorkspaceStorage,requestWorkspaceStoragePersistence,type WorkspaceStorageStatus} from '@/lib/workspace-storage';
import {Button,StatusBadge} from './ui/controls';
import {rememberWorkspaceLaunch} from '@/lib/workspace-launch';

type Phase='preparing'|'checking'|'ready'|'paused'|'denied';
const empty=()=>JSON.stringify([true,null,null,null]);

let shellPreparation:Promise<void>|undefined;
function prepareOfflineShell() {
  shellPreparation??=import('@/lib/workspace-public-shell').then(shell=>shell.prepareWorkspaceShell()).catch(error=>{
    shellPreparation=undefined;
    throw error;
  });
  return shellPreparation;
}

export function useOwnerWorkspaceDevice({subject,academy,priority,prepared=false,publicOffline=false,anchor}:{
  subject:string; academy:string; priority:'people'|'calendar'; prepared?:boolean; publicOffline?:boolean; anchor?:string;
}) {
  const [phase,setPhase]=useState<Phase>('preparing');
  const [progress,setProgress]=useState<{ready:number;total:number}>();
  const [shellUnavailable,setShellUnavailable]=useState(false);
  const [storage,setStorage]=useState<WorkspaceStorageStatus>();
  const [coverage,setCoverage]=useState(0), [trigger,setTrigger]=useState(0);
  const [requested,setRequested]=useState<string>();
  const snapshot=useCallback(()=>{
    if(!prepared)return empty();
    try {
      const account=readRegisterAccount();
      const generation=account?.mode==='active'&&account.subject===subject?account.generation:null;
      const slot=generation?readWorkspaceSlot({subject,academy}):null;
      return JSON.stringify([navigator.onLine,generation,slot?.mode??null,slot?.generation??null]);
    } catch {return empty();}
  },[academy,prepared,subject]);
  const subscribe=useCallback((listener:()=>void)=>{
    if(!prepared)return()=>{};
    const account=subscribeRegisterAccount(listener);
    const slot=subscribeWorkspaceSlot({academy,subject},listener);
    window.addEventListener('online',listener);
    window.addEventListener('offline',listener);
    return ()=>{
      account();slot();
      window.removeEventListener('online',listener);
      window.removeEventListener('offline',listener);
    };
  },[academy,prepared,subject]);
  const [online,generation,slot,slotGeneration]=JSON.parse(useSyncExternalStore(subscribe,snapshot,empty)) as
    [boolean,string|null,'reserved'|'active'|'cleaning'|null,string|null];
  const offline=prepared&&(publicOffline||!online);
  const allowed=Boolean(generation&&slot&&slot!=='cleaning');
  const active=Boolean(generation&&slot==='active');
  useEffect(()=>{
    if(prepared&&active&&(offline||phase==='ready')&&!shellUnavailable)rememberWorkspaceLaunch(subject);
  },[active,anchor,offline,phase,prepared,shellUnavailable,subject,priority]);

  const read=useCallback((...args:Parameters<ReturnType<typeof workspaceDevice>['read']>)=>
    generation&&slot==='active'
      ?workspaceDevice({subject,academy},generation,new AbortController().signal).read(...args)
      :Promise.resolve(null),[academy,generation,slot,subject]);
  const context=useCallback(()=>generation&&slot==='active'
    ?workspaceDevice({subject,academy},generation,new AbortController().signal).readContext()
    :Promise.resolve(null),[academy,generation,slot,subject]);
  const calendar=useCallback((...args:Parameters<ReturnType<typeof workspaceDevice>['readCalendar']>)=>
    generation&&slot==='active'
      ?workspaceDevice({subject,academy},generation,new AbortController().signal).readCalendar(...args)
      :Promise.resolve(null),[academy,generation,slot,subject]);
  const refresh=useCallback(()=>setTrigger(value=>value+1),[]);
  const needMonth=useCallback((day:string)=>{
    const month=day.slice(0,7)+'-01';
    setRequested(value=>value===month?value:month);
  },[]);
  const approve=useCallback(async()=>{
    if(!prepared||offline)return;
    try {
      const id=await armRegisterAccount(subject);
      await approveWorkspaceDevice({subject,academy},id);
      // Fire-and-forget: storage diagnostics are advisory and must not delay or
      // overwrite the operational phase set by the sync effect. The approve path
      // only transitions to 'preparing'; the sync effect owns 'ready' and later.
      void requestWorkspaceStoragePersistence()
        .then(value=>setStorage(value))
        .catch(()=>setStorage({supported:true,persistence:'unavailable',persisted:null}));
      setProgress(undefined);setPhase('preparing');
    } catch {setPhase('paused');}
  },[academy,offline,prepared,subject]);
  const remove=useCallback(async()=>{
    if(!generation)return;
    try {
      await workspaceDevice({subject,academy},generation,new AbortController().signal).remove();
      setProgress(undefined);setPhase('preparing');
    } catch {setPhase('paused');}
  },[academy,generation,subject]);

  useEffect(()=>{
    if(!allowed)return;
    return subscribeWorkspaceCoverage(()=>setCoverage(value=>value+1));
  },[allowed]);
  useEffect(()=>{
    if(!allowed||publicOffline)return;
    return listenForVisibleResume(refresh);
  },[allowed,publicOffline,refresh]);
  useEffect(()=>{
    if(!prepared||!allowed)return;
    let live=true;
    void inspectWorkspaceStorage().then(value=>{if(live)setStorage(value);});
    return()=>{live=false;};
  },[allowed,prepared]);
  useEffect(()=>{
    if(!allowed||!generation||offline)return;
    const life=new AbortController();
    const device=workspaceDevice({subject,academy},generation,life.signal);
    let timer:ReturnType<typeof setTimeout>;
    const schedule=(delay:number)=>{timer=setTimeout(()=>void run(),delay);};
    async function run(){
      if(life.signal.aborted||document.visibilityState==='hidden')return;
      setPhase(current=>current==='ready'||current==='checking'?'checking':'preparing');
      try {
        const result=await device.sync(requested??(anchor?anchor.slice(0,7)+'-01':undefined),priority,life.signal,(ready,total)=>{
          if(!life.signal.aborted)setProgress({ready,total});
        });
        // Retirement changes the slot and can cancel this effect before the
        // confirmed refusal returns. Keep the denial visible after cleanup.
        if(result.kind==='denied'){setPhase('denied');return;}
        if(life.signal.aborted)return;
        switch(result.kind){
          case 'current': setPhase('ready');break;
          case 'partial': case 'rebuild_required': schedule(1000);break;
          case 'following': schedule(2500);break;
          case 'approval_required': break;
        }
      } catch(error) {
        if(life.signal.aborted)return;
        if(error instanceof WorkspaceTransportError&&error.kind==='changed')schedule(1000);
        else {
          setPhase('paused');
          if(error instanceof WorkspaceTransportError&&error.kind==='limited')schedule(60000);
        }
      }
    }
    schedule(0);
    void prepareOfflineShell().then(()=>{
      if(!life.signal.aborted)setShellUnavailable(false);
    },()=>{
      if(!life.signal.aborted)setShellUnavailable(true);
    });
    return ()=>{life.abort();clearTimeout(timer);};
  },[academy,allowed,anchor,generation,offline,priority,requested,subject,trigger]);

   return {prepared,offline,active,approved:allowed,phase,coverage:coverage+':'+slotGeneration,progress,shellUnavailable,storage,
    read,context,calendar,needMonth,refresh,approve,remove};
}

export type OwnerWorkspaceDevice=ReturnType<typeof useOwnerWorkspaceDevice>;
export function WorkspaceDeviceTools({device,locale,verified}:{device:OwnerWorkspaceDevice;locale:string;verified:boolean}) {
  if(!device.prepared)return null;
  const ar=locale==='ar', t=(en:string,arabic:string)=>ar?arabic:en;
  if(device.offline)return <StatusBadge className="workspace-connection-status" role="status">{t('Offline','غير متصل')}</StatusBadge>;
  if(!device.approved){
    if(!verified)return null;
    return <details className="layout-menu">
      <summary>{t('Device','الجهاز')}</summary>
      <div><p>{t('Prepare Players and Calendar on this personal device.','حضّر اللاعبين والتقويم على جهازك الشخصي.')}</p>
        <Button onClick={()=>void device.approve()}>{t('Use this personal device','استخدم هذا الجهاز الشخصي')}</Button>
        {device.phase==='paused'&&<p role="status">{t('Device storage is unavailable.','تخزين الجهاز غير متاح.')}</p>}
      </div>
    </details>;
  }
  const label=device.phase==='ready'?t('Online','متصل'):device.phase==='paused'?t('Sync paused','المزامنة متوقفة مؤقتاً'):
    device.phase==='checking'?t('Checking for changes','جارٍ التحقّق من التغييرات'):
    device.phase==='denied'?t('Access unavailable','الصلاحية غير متاحة'):t('Preparing your academy','جارٍ تحضير الأكاديمية');
  const storageLabel=device.storage?.persistence==='granted'?t('Persistent storage granted','التخزين المستمر مفعّل'):
    device.storage?.persistence==='not-granted'?t('Persistent storage not granted','لم تتم الموافقة على التخزين المستمر'):
    device.storage?.persistence==='unavailable'?t('Storage status unavailable','حالة التخزين غير متاحة'):
    device.storage?.persistence==='unsupported'?t('Persistent storage is not supported','التخزين المستمر غير مدعوم'):null;
  return <details className="layout-menu" data-connection-menu>
    <summary>{label}</summary>
    <div>{storageLabel&&<p role="status">{storageLabel}{device.storage?.usage!==undefined&&device.storage?.quota!==undefined?` · ${Math.round(device.storage.usage/1024)} KB / ${Math.round(device.storage.quota/1024)} KB`:''}</p>}{device.phase==='preparing'&&device.progress&&<progress aria-label={label} value={device.progress.ready} max={device.progress.total}/>}
      {device.shellUnavailable&&<p role="status">{t('Offline reopening is unavailable. Check for changes to retry.','الفتح دون اتصال غير متاح. تحقّق من التغييرات لإعادة المحاولة.')}</p>}
      <Button onClick={device.refresh}>{t('Check for changes','تحقّق من التغييرات')}</Button>
      <Button onClick={()=>void device.remove()}>{t('Remove downloads','إزالة التنزيلات')}</Button></div>
  </details>;
}
