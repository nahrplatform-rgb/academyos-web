'use client';

import {useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {Button} from './ui/controls';
import {ownerRegisterPilot} from '@/lib/owner-register-pilot';
import {armRegisterAccount,readRegisterAccount,rememberPreparedRegister,requireRegisterAccount,REGISTER_DRAFT_EXIT_EVENT,
  subscribeRegisterAccount} from '@/lib/register-device-account';
import {readRegisterSlot,subscribeRegisterSlot,type RegisterContext} from '@/lib/register-device-slots';
import {prepareRegisterShell,registerShellAvailable,PREPARED_REGISTER_PATH} from '@/lib/register-public-shell';

type Pilot=ReturnType<typeof ownerRegisterPilot>;
type Read=Awaited<ReturnType<Pilot['read']>>;
type Mark='present'|'absent';
type Props={locale:string;scope:RegisterContext;offline?:boolean;offlineGeneration?:string;onCancel?:()=>void};
function generation(subject:string) {
  try {
    const account=readRegisterAccount();
    return account?.subject===subject&&account.mode==='active'?account.generation:null;
  } catch {return null;}
}

export default function PreparedRegisterPanel({locale,scope,offline=false,offlineGeneration,onCancel}:Props) {
  const {subject,academy,event}=scope, ar=locale==='ar', t=(en:string,arabic:string)=>ar?arabic:en;
  const [snapshot,setSnapshot]=useState<{read:Read;owner:string;slot:number}|null>(null), [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false), [notice,setNotice]=useState(''), [problem,setProblem]=useState('');
  const [shellReady,setShellReady]=useState(false), [personal,setPersonal]=useState(false);
  const [known,setKnown]=useState<boolean|null>(null), [reviewing,setReviewing]=useState(false);
  const [draft,setDraft]=useState<Record<string,{name:string;status:Mark}>>({});
  const lifetime=useRef<AbortController|null>(null), locked=useRef(false);
  const runtime=useRef<{pilot:Pilot;generation:string}|null>(null);
  const dialog=useRef<HTMLDialogElement>(null), opener=useRef<HTMLButtonElement>(null);
  const current=useSyncExternalStore(subscribeRegisterAccount,()=>generation(subject),()=>null);
  const slotGeneration=useSyncExternalStore(listener=>subscribeRegisterSlot(subject,academy,listener),()=>{
    try {const slot=readRegisterSlot(subject,academy);return slot?.mode==='active'?slot.generation:null;}
    catch {return null;}
  },()=>null);
  const selections=Object.entries(draft);
  const hasAccess=Boolean(snapshot && current && snapshot.owner===current && snapshot.slot===slotGeneration);
  const visible=hasAccess?snapshot?.read:null;
  function show(read:Read,id:string) {
    requireRegisterAccount(subject,id);
    const slot=readRegisterSlot(subject,academy);
    if (!slot || slot.event!==event || slot.mode!=='active' || slot.generation!==read.slotGeneration) throw new Error('scope_changed');
    if (!lifetime.current?.signal.aborted) setSnapshot({read,owner:id,slot:slot.generation});
  }

  function pilot(id:string) {
    const life=lifetime.current;
    if (!life || life.signal.aborted) throw new Error('scope_changed');
    if (runtime.current?.generation===id) return runtime.current.pilot;
    const instance=ownerRegisterPilot({subject,academy,event},life.signal,()=>requireRegisterAccount(subject,id));
    runtime.current={pilot:instance,generation:id};
    return instance;
  }
  async function perform(work:()=>Promise<void>) {
    if (locked.current || !lifetime.current || lifetime.current.signal.aborted) return;
    const life=lifetime.current;
    locked.current=true;setBusy(true);setProblem('');setNotice('');
    try {await work();}
    catch(error) {
      if (!life.signal.aborted) {
        const code=error instanceof Error?error.message:'register_unavailable';
        if (['scope_changed','account_verification_required','clock_verification_required','scope_lost','withdrawn','register_account_cleanup_required'].includes(code)) {
          setSnapshot(null);setDraft({});setReviewing(false);
        }
        setProblem(code);
      }
    } finally {locked.current=false;if(!life.signal.aborted)setBusy(false);}
  }
  useEffect(()=>{
    const life=new AbortController();lifetime.current=life;
    let slot:ReturnType<typeof readRegisterSlot>=null;
    try {slot=readRegisterSlot(subject,academy);}
    catch {queueMicrotask(()=>{if(!life.signal.aborted)setProblem('register_unavailable');});}
    const matching=slot?.event===event, id=offline?offlineGeneration:generation(subject);
    queueMicrotask(()=>{
      if(life.signal.aborted)return;
      setKnown(matching);
      if (!offline&&matching) void registerShellAvailable().then(ready=>{
        if(!life.signal.aborted)setShellReady(ready);
      },()=>{});
      if (id&&matching&&slot?.mode==='active') void perform(async()=>show(await pilot(id).read(),id));
    });
    return ()=>{life.abort();runtime.current=null;};
    // This panel mounts per account, academy and event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[subject,academy,event,offline,offlineGeneration]);

  useEffect(()=>{
    if (reviewing&&hasAccess&&!dialog.current?.open) dialog.current?.showModal();
    if (!reviewing||!hasAccess) dialog.current?.close();
  },[reviewing,hasAccess]);
  useEffect(()=>{
    if (!selections.length||!hasAccess) return;
    const before=(e:BeforeUnloadEvent)=>e.preventDefault();
    const exit=(e:Event)=>{
      if(!window.confirm(locale==='ar'?'تجاهل اختيارات الحضور غير المحفوظة؟':'Discard unsaved attendance choices?'))
        e.preventDefault();
    };
    window.addEventListener('beforeunload',before);
    window.addEventListener(REGISTER_DRAFT_EXIT_EVENT,exit);
    return ()=>{
      window.removeEventListener('beforeunload',before);
      window.removeEventListener(REGISTER_DRAFT_EXIT_EVENT,exit);
    };
  },[selections.length,hasAccess,locale]);

  function prepare(recover=false) {
    void perform(async()=>{
      const id=await armRegisterAccount(subject), p=pilot(id);
      setKnown(true);
      if (recover) await p.recover();
      else await p.prepare();
      show(await p.read(),id);
      if (!recover) {
        await rememberPreparedRegister({subject,academy,event},id);
        if (!shellReady) {
          const life=lifetime.current;
          void registerShellAvailable().then(ready=>ready?undefined:prepareRegisterShell()).then(()=>{
            if (!life?.signal.aborted) setShellReady(true);
          },()=>{if (!life?.signal.aborted)setNotice('shell_unavailable');});
        }
      }
    });
  }
  function sync() {
    void perform(async()=>{
      if (!hasAccess||!current) throw new Error('scope_changed');
      const p=pilot(current), result=await p.sync();
      setConfirmed(result.kind==='confirmed');
      setNotice(result.kind==='unknown'?'unknown':result.kind==='needs_review'?'needs_review':'');
      show(await p.read(),current);
    });
  }
  useEffect(()=>{
    if (offline||visible?.original?.state!=='pending') return;
    window.addEventListener('online',sync);
    return ()=>window.removeEventListener('online',sync);
  });
  function save() {
    void perform(async()=>{
      if (!hasAccess||!current) throw new Error('scope_changed');
      const p=pilot(current);
      await p.capture(crypto.randomUUID(),new Date().toISOString(),selections.map(([player,value])=>({player,status:value.status,version:0})));
      setDraft({});setReviewing(false);setConfirmed(false);
      show(await p.read(),current);
    });
  }
  function nextPage() {
    void perform(async()=>{
      if (!current||!visible?.page) return;
      const data=await pilot(current).read(visible.page.players.at(-1)?.id);
      if (!data.page||data.page.revision!==visible.page.revision) throw new Error('register_unavailable');
      show({...data,page:{...data.page,players:[...visible.page.players,...data.page.players]}},current);
    });
  }
  function dismiss() {setReviewing(false);opener.current?.focus();}
  const page=visible?.page, pending=visible?.original;
  const label=(mark:string|null)=>mark==='present'?t('Present','حاضر'):mark==='absent'?t('Absent','غائب'):t('Unmarked','لم يُسجّل');
  const messages:Record<string,string>={
    scope_lost:t('Current account access changed. Sign in again to recover protected work.','تغيّرت صلاحية الحساب. سجّل الدخول مجدداً لاستعادة العمل المحمي.'),
    clock_verification_required:t('The device clock changed. Verify access online.','تغيّرت ساعة الجهاز. تحقّق من الصلاحية عبر الإنترنت.'),
    account_verification_required:t('Verify access online to reopen protected work.','تحقّق من الصلاحية عبر الإنترنت لإعادة فتح العمل المحمي.'),
    withdrawn:t('This session was withdrawn. Pending work can be recovered separately.','سُحب هذا التدريب. يمكن استعادة العمل المعلّق بشكل منفصل.'),
    different_registered_event:t('Another register is already prepared for this academy.','يوجد سجل آخر محضّر لهذه الأكاديمية.'),
    shell_unavailable:t('The register is prepared here. Reopening after browser restart is unavailable on this device.','السجل محضّر هنا. إعادة فتحه بعد تشغيل المتصفح غير متاحة على هذا الجهاز.'),
  };
  return <section className="attendance-theme" aria-label={t('Personal-device register','سجل الجهاز الشخصي')}>
    <h2>{t('Personal-device register','سجل الجهاز الشخصي')}</h2>
    {busy&&<p role="status">{t('Checking saved work…','جارٍ التحقق من العمل المحفوظ…')}</p>}
    {problem&&<p role="alert">{messages[problem]??t('The device register is unavailable. Saved work remains protected.','سجل الجهاز غير متاح. يبقى العمل المحفوظ محمياً.')}</p>}
    {notice==='shell_unavailable'&&<p role="status">{messages[notice]}</p>}
    {confirmed&&hasAccess&&<p role="status">{t('Server recorded the register. Check for the latest saved marks.','سجّل الخادم الحضور. تحقّق من آخر العلامات المحفوظة.')}</p>}
    {!offline&&<div className="journey-actions">
      {known===false&&<label><input type="checkbox" checked={personal} onChange={e=>setPersonal(e.target.checked)}/>
        {t('This is my personal device','هذا جهازي الشخصي')}</label>}
      <Button disabled={busy||known===null||(!known&&!personal)||selections.length>0} onClick={()=>prepare()}>
        {page?t('Check download','تحقّق من التنزيل'):t('Prepare register on this device','حضّر السجل على هذا الجهاز')}</Button>
      {known===false&&onCancel&&<Button disabled={busy} onClick={onCancel}>{t('Use the online register','استخدم السجل عبر الإنترنت')}</Button>}
      {known&&!page&&<Button disabled={busy} onClick={()=>prepare(true)}>{t('Recover saved work','استعد العمل المحفوظ')}</Button>}
      {shellReady&&hasAccess&&<a href={PREPARED_REGISTER_PATH+(ar?'#ar':'')}>{t('Offline reopening link','رابط إعادة الفتح دون اتصال')}</a>}
    </div>}
    {pending&&<div role="status">
      <p>{pending.state==='pending'?t('Saved on this device · Awaiting sync','محفوظ على هذا الجهاز · بانتظار المزامنة'):
        pending.state==='unknown'?t('Outcome unknown · Check the original save','النتيجة غير معروفة · تحقّق من الحفظ الأصلي'):
        t('Needs review · Original work retained','تحتاج مراجعة · العمل الأصلي محفوظ')}</p>
      {!offline&&pending.state!=='needs_review'&&<Button disabled={busy} onClick={sync}>{t('Sync original','زامن الحفظ الأصلي')}</Button>}
    </div>}
    {page&&<>
      <h3>{page.header.projection.name}</h3>
      <p>{page.header.projection.branch} · <bdi>{page.header.projection.timezone}</bdi></p>
      <p>{page.players.length} / {page.header.count} {t('loaded from this device','محمّلون من هذا الجهاز')}</p>
      <ul className="register-roster">{page.players.map(player=><li key={player.id}>
        <span>{player.name}</span>{player.version?<span className={`attendance-status ${player.status}`}>{label(player.status)}</span>:
          <div className="register-options" role="group" aria-label={player.name}>{(['present','absent',null] as const).map(status=>
            <Button key={String(status)} disabled={busy||!!pending||page.needsCurrentRead||!page.header.open}
              aria-pressed={(draft[player.id]?.status??null)===status} onClick={()=>setDraft(previous=>{
                const next={...previous};
                if(status)next[player.id]={name:player.name,status};else delete next[player.id];
                return next;
              })}>{label(status)}</Button>)}</div>}
      </li>)}</ul>
      {page.more&&<Button disabled={busy} onClick={nextPage}>{t('Load more players','حمّل المزيد من اللاعبين')}</Button>}
      <Button ref={opener} disabled={busy||!selections.length||!!pending||page.needsCurrentRead}
        onClick={()=>setReviewing(true)}>{t('Review register','راجع الحضور')}</Button>
    </>}
    <dialog ref={dialog} className="register-dialog" aria-labelledby="prepared-review" onCancel={e=>{e.preventDefault();dismiss();}}>
      <h3 id="prepared-review">{t('Save selected marks on this device?','هل تريد حفظ العلامات المختارة على هذا الجهاز؟')}</h3>
      {hasAccess&&<ul>{selections.map(([id,value])=><li key={id}>{value.name} · {label(value.status)}</li>)}</ul>}
      <Button disabled={busy} onClick={dismiss}>{t('Back to editing','العودة إلى التعديل')}</Button>
      <Button disabled={busy||!hasAccess||!selections.length} onClick={save}>{t('Save on this device','احفظ على هذا الجهاز')}</Button>
    </dialog>
  </section>;
}
