'use client';

import {useEffect,useRef,useState,useSyncExternalStore,type MouseEvent,type ReactNode} from 'react';
import {Button,Input,Select} from './ui/controls';
import WorkspaceShell from './workspace-shell';
import WorkspacePanes from './workspace-panes';
import {useRouter} from 'next/navigation';
import {prepareWorkspaceShell} from '@/lib/workspace-public-shell';
import type {RegisterPacket} from '@/lib/local-register-codec';
import {ownerRegisterPilot} from '@/lib/owner-register-pilot';
import {armRegisterAccount,readRegisterAccount,rememberPreparedRegister,requireRegisterAccount,REGISTER_DRAFT_EXIT_EVENT,
  subscribeRegisterAccount} from '@/lib/register-device-account';
import {readRegisterSlot,subscribeRegisterSlot,type RegisterContext} from '@/lib/register-device-slots';
import {useRegisterSession} from '@/lib/register-session';
import {prepareRegisterShell,registerShellAvailable,PREPARED_REGISTER_PATH} from '@/lib/register-public-shell';

type Pilot=ReturnType<typeof ownerRegisterPilot>;
type Read=Awaited<ReturnType<Pilot['read']>>;
type Mark='present'|'absent';
export type PreparedRegisterView={query:string;filter:string;selected:string|null;loaded:number;locale:string;paneScroll:number;windowScroll:number};
type Props={locale:string;scope:RegisterContext;offline?:boolean;offlineGeneration?:string;onCancel?:(locale:string)=>void;normal?:boolean;account?:ReactNode;initialView?:PreparedRegisterView;onInspect?:(player:string,view:PreparedRegisterView)=>void};
async function readVisible(pilot:Pilot,count=0) {
  let read=await pilot.read();
  while(read.page?.more&&read.page.players.length<count){
    const next=await pilot.read(read.page.players.at(-1)?.id);
    if(!next.page||next.page.revision!==read.page.revision)throw new Error('register_unavailable');
    read={...next,page:{...next.page,players:[...read.page.players,...next.page.players]}};
  }
  return read;
}
function generation(subject:string) {
  try {
    const account=readRegisterAccount();
    return account?.subject===subject&&account.mode==='active'?account.generation:null;
  } catch {return null;}
}

function subscribeConnection(listener:()=>void){window.addEventListener('online',listener);window.addEventListener('offline',listener);return()=>{window.removeEventListener('online',listener);window.removeEventListener('offline',listener);};}
export default function PreparedRegisterPanel({locale:initialLocale,scope,offline=false,offlineGeneration,onCancel,normal=false,account,initialView,onInspect}:Props) {
  const {subject,academy,event}=scope;
  const beforeOnline=useRegisterSession();
  const [locale,setLocale]=useState(initialView?.locale??initialLocale),ar=locale==='ar',t=(en:string,arabic:string)=>ar?arabic:en;
  const router=useRouter(),online=useSyncExternalStore(subscribeConnection,()=>navigator.onLine,()=>true);
  const [query,setQuery]=useState(initialView?.query??''),[filter,setFilter]=useState(initialView?.filter??'all'),[selected,setSelected]=useState<string|null>(initialView?.selected??null),[checking,setChecking]=useState(false);
  const region=useRef<HTMLElement>(null),restored=useRef(false);
  const automatic=useRef<string|null>(null),checked=useRef(false),lastResume=useRef(-Infinity);
  const playerOpener=useRef<HTMLButtonElement|null>(null);
  const [snapshot,setSnapshot]=useState<{read:Read;owner:string;slot:number}|null>(null), [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false), [notice,setNotice]=useState(''), [problem,setProblem]=useState('');
  const [shellReady,setShellReady]=useState(false), [personal,setPersonal]=useState(false);
  const [known,setKnown]=useState<boolean|null>(null), [reviewing,setReviewing]=useState(false);
  const [draft,setDraft]=useState<Record<string,{name:string;status:Mark}>>({});
  const lifetime=useRef<AbortController|null>(null), locked=useRef(false);
  const runtime=useRef<{pilot:Pilot;generation:string}|null>(null);
  const dialog=useRef<HTMLDialogElement>(null), opener=useRef<HTMLButtonElement>(null);
  const current=useSyncExternalStore(subscribeRegisterAccount,()=>generation(subject),()=>null);
  const onlineFallback=useSyncExternalStore(listener=>subscribeRegisterSlot(subject,academy,listener),()=>{
    try {
      const slot=readRegisterSlot(subject,academy);
      // Never hide a same-session protected original behind an online replacement.
      return !slot || slot.event!==event || !slot.namespace;
    } catch {return false;}
  },()=>false);
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
    const instance=ownerRegisterPilot({subject,academy,event},life.signal,()=>requireRegisterAccount(subject,id),beforeOnline);
    runtime.current={pilot:instance,generation:id};
    return instance;
  }
  async function perform(work:()=>Promise<void>,background=false) {
    if (locked.current || !lifetime.current || lifetime.current.signal.aborted) return;
    const life=lifetime.current;
    locked.current=true;if(background)setChecking(true);else setBusy(true);setProblem('');setNotice('');
    try {await work();}
    catch(error) {
      if (!life.signal.aborted) {
        const code=error instanceof Error?error.message:'register_unavailable';
        if (['scope_changed','account_verification_required','clock_verification_required','scope_lost','withdrawn','register_account_cleanup_required'].includes(code)) {
          setSnapshot(null);setDraft({});setReviewing(false);
        }
        setProblem(code);
      }
    } finally {locked.current=false;if(!life.signal.aborted){setBusy(false);setChecking(false);}}
  }
  useEffect(()=>{
    const life=new AbortController();lifetime.current=life;
    let slot:ReturnType<typeof readRegisterSlot>=null;
    try {slot=readRegisterSlot(subject,academy);}
    catch {queueMicrotask(()=>{if(!life.signal.aborted)setProblem('register_unavailable');});}
    const matching=slot?.event===event, id=offline?offlineGeneration:generation(subject);
    queueMicrotask(()=>{
      if(life.signal.aborted)return;
      setKnown(matching&&Boolean(slot?.namespace));
      if (!offline&&matching) void (normal?prepareWorkspaceShell().then(()=>true):registerShellAvailable()).then(ready=>{
        if(!life.signal.aborted)setShellReady(ready);
      },()=>{if(!life.signal.aborted)setNotice('shell_unavailable');});
      if (id&&matching&&slot?.mode==='active') void perform(async()=>show(await readVisible(pilot(id),initialView?.loaded),id));
    });
    return ()=>{life.abort();runtime.current=null;};
    // This panel mounts per account, academy and event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[subject,academy,event,offline,offlineGeneration]);

  useEffect(()=>{
    if(!hasAccess||!initialView||restored.current)return;
    restored.current=true;
    const frame=requestAnimationFrame(()=>{
      const pane=region.current?.closest('.workspace-center');
      if(pane)pane.scrollTop=initialView.paneScroll;
      window.scrollTo(0,initialView.windowScroll);
    });
    return()=>cancelAnimationFrame(frame);
  },[hasAccess,initialView]);

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
      if(!recover)setShellReady(false);
      const id=await armRegisterAccount(subject), p=pilot(id);
      try {
        if (recover) await p.recover();
        else await p.prepare();
      } finally {
        const slot=readRegisterSlot(subject,academy);
        setKnown(slot?.event===event&&Boolean(slot.namespace));
      }
      if(normal)checked.current=true;
      show(await p.read(),id);
      if (!recover) {
        await rememberPreparedRegister({subject,academy,event},id);
        const life=lifetime.current;
        // Explicit online preparation checks the public build. The worker reuses
        // unchanged assets and swaps complete new builds atomically.
        void (normal?prepareWorkspaceShell():prepareRegisterShell()).then(()=>{
          if (!life?.signal.aborted) setShellReady(true);
        },()=>{if (!life?.signal.aborted)setNotice('shell_unavailable');});
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
      if(normal&&result.kind==='confirmed'){
        checked.current=true;
        try{await p.prepare();show(await p.read(),current);}
        catch(error){setNotice('confirmed_read_failed');throw error;}
      }
    });
  }
  useEffect(()=>{
    if (normal||offline||visible?.original?.state!=='pending') return;
    window.addEventListener('online',sync);
    return ()=>window.removeEventListener('online',sync);
  });
  useEffect(()=>{
    if(!normal||!hasAccess||!current||busy||checking)return;
    let disposed=false;
    const resume=()=>{
      if(disposed||!navigator.onLine||locked.current)return;
      const original=visible?.original;
      if(original&&original.state!=='needs_review'){
        if(automatic.current===original.wire)return;
        automatic.current=original.wire;
        sync();return;
      }
      if(original||!visible?.page||selections.length||problem||checked.current)return;
      checked.current=true;
      void perform(async()=>{
        const p=pilot(current);await p.prepare();
        // A background replacement must not collapse a previously loaded roster.
        show(await readVisible(p,visible.page!.players.length),current);
      },true);
    };
    const returned=(event:Event)=>{
      // A genuine connection return must not be swallowed by the focus/visible
      // burst throttle. The operation lock still coalesces work already running.
      if(document.hidden||event.type!=='online'&&performance.now()-lastResume.current<1000)return;
      lastResume.current=performance.now();automatic.current=null;checked.current=false;
      resume();
    };
    queueMicrotask(resume);
    window.addEventListener('online',returned);window.addEventListener('focus',returned);
    document.addEventListener('visibilitychange',returned);
    return()=>{disposed=true;window.removeEventListener('online',returned);window.removeEventListener('focus',returned);document.removeEventListener('visibilitychange',returned);};
    // Current page and original drive the scoped auto attempt; no timer polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[normal,hasAccess,current,busy,checking,visible,selections.length,problem]);
  const nextWindowChange=visible?.page?.captureWindow.nextChangeAt;
  useEffect(()=>{
    if (!hasAccess||!current||nextWindowChange==null||visible?.original||busy||problem) return;
    // One local recheck at a window boundary, including a resumed/background tab.
    // No polling or network revalidation; dirty selections remain in this panel.
    const refresh=()=>void perform(async()=>show(await pilot(current).read(),current));
    const visibleAgain=()=>{if(!document.hidden)refresh();};
    const timer=setTimeout(refresh,Math.min(2147483647,Math.max(1,nextWindowChange-Date.now())));
    document.addEventListener('visibilitychange',visibleAgain);
    return ()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',visibleAgain);};
    // The prepared generation and its boundary own this local timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[hasAccess,current,nextWindowChange,visible?.original,busy,problem]);
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
  const page=visible?.page,pending=visible?.original;
  const pendingPacket=pending?JSON.parse(pending.wire) as RegisterPacket:null;
  const pendingChoices=new Map(pendingPacket?.marks.map(mark=>[mark.player,mark.status])??[]);
  const counts={present:0,absent:0,unmarked:0};
  for(const player of page?.players??[]){const mark=player.status??draft[player.id]?.status??pendingChoices.get(player.id);counts[mark??'unmarked']++;}
  const picked=page?.players.find(player=>player.id===selected);
  const format=(value:string)=>new Intl.DateTimeFormat(ar?'ar-EG':'en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:page?.header.projection.timezone??'UTC'}).format(new Date(value));
  const label=(mark:string|null)=>mark==='present'?t('Present','حاضر'):mark==='absent'?t('Absent','غائب'):t('Unmarked','لم يُسجّل');
  const messages:Record<string,string>={
    authentication_required:t('Sign in to sync. Your saved work stays on this device.','سجّل الدخول للمزامنة. يبقى عملك المحفوظ على هذا الجهاز.'),
    authentication_unavailable:t('Could not check sign-in. Your work stays on this device. Try again when connected.','تعذّر التحقق من تسجيل الدخول. يبقى عملك على هذا الجهاز. أعد المحاولة عند الاتصال.'),
    scope_lost:t('Current account access changed. Sign in again to recover protected work.','تغيّرت صلاحية الحساب. سجّل الدخول مجدداً لاستعادة العمل المحمي.'),
    clock_verification_required:t('The device clock changed. Verify access online.','تغيّرت ساعة الجهاز. تحقّق من الصلاحية عبر الإنترنت.'),
    account_verification_required:t('Verify access online to reopen protected work.','تحقّق من الصلاحية عبر الإنترنت لإعادة فتح العمل المحمي.'),
    withdrawn:t('This session was withdrawn. Pending work can be recovered separately.','سُحب هذا التدريب. يمكن استعادة العمل المعلّق بشكل منفصل.'),
    different_registered_event:t('Another register is already prepared for this academy.','يوجد سجل آخر محضّر لهذه الأكاديمية.'),
    register_binding_conflict:t('A register is already prepared on another device or for another session. Its saved work is unchanged. You can use this register online.','يوجد سجل محضّر على جهاز آخر أو لتدريب آخر. يبقى عمله المحفوظ دون تغيير. يمكنك استخدام هذا السجل عبر الإنترنت.'),
    shell_unavailable:t('The register is prepared here. Reopening after browser restart is unavailable on this device.','السجل محضّر هنا. إعادة فتحه بعد تشغيل المتصفح غير متاحة على هذا الجهاز.'),
  };
  const content=<section ref={region} className="attendance-theme" aria-label={t('Personal-device register','سجل الجهاز الشخصي')}>
    {!normal&&<h2>{t('Personal-device register','سجل الجهاز الشخصي')}</h2>}
    {busy&&(!normal||!page||pending)&&<p role="status">{t('Checking saved work…','جارٍ التحقق من العمل المحفوظ…')}</p>}
    {problem&&<p role="alert">{messages[problem]??t('The device register is unavailable. Saved work remains protected.','سجل الجهاز غير متاح. يبقى العمل المحفوظ محمياً.')}</p>}
    {problem==='authentication_required'&&<p><a href={`/${locale}/workspace/${academy}/attendance/${event}`}>
      {t('Sign in to continue','سجّل الدخول للمتابعة')}</a></p>}
    {notice==='shell_unavailable'&&<p role="status">{messages[notice]}</p>}{normal&&shellReady&&hasAccess&&page&&<p role="status">{t('Ready for offline reopening','جاهز لإعادة الفتح دون اتصال')}</p>}
    {confirmed&&hasAccess&&<p role="status">{notice==='confirmed_read_failed'?t('Save confirmed; latest register unavailable. Retry reading, not saving.','تأكد الحفظ؛ تعذّرت قراءة القائمة الأحدث. أعد القراءة وليس الحفظ.'):t('Synced · Server recorded the register.','تمت المزامنة · سجّل الخادم الحضور.')}</p>}
    {(!offline||normal)&&(!normal||!page||problem)&&<div className="journey-actions">
      {known===false&&<label><input type="checkbox" checked={personal} onChange={e=>setPersonal(e.target.checked)}/>
        {t('This is my personal device','هذا جهازي الشخصي')}</label>}
      <Button disabled={busy||!online||known===null||(!known&&!personal)||selections.length>0||!!pending} onClick={()=>prepare()}>
        {page?t('Retry current check','أعد التحقق'):t('Prepare register on this device','حضّر السجل على هذا الجهاز')}</Button>
      {onlineFallback&&onCancel&&!['scope_lost','scope_changed','withdrawn','register_account_cleanup_required'].includes(problem)&&
        <Button disabled={busy||!online||selections.length>0||!!pending} onClick={()=>onCancel(locale)}>{t('Use the online register','استخدم السجل عبر الإنترنت')}</Button>}
      {known&&!page&&<Button disabled={busy||!online} onClick={()=>prepare(true)}>{t('Recover saved work','استعد العمل المحفوظ')}</Button>}
      {!normal&&shellReady&&hasAccess&&<a href={PREPARED_REGISTER_PATH+(ar?'#ar':'')}>{t('Offline reopening link','رابط إعادة الفتح دون اتصال')}</a>}
    </div>}
    {pending&&<div role="status">
      <p>{pending.state==='pending'?t('Saved on this device · Awaiting sync','محفوظ على هذا الجهاز · بانتظار المزامنة'):
        pending.state==='unknown'?t('Outcome unknown · Check the original save','النتيجة غير معروفة · تحقّق من الحفظ الأصلي'):
        t('Needs review · Original work retained','تحتاج مراجعة · العمل الأصلي محفوظ')}</p>
      {(!offline||normal)&&pending.state!=='needs_review'&&<Button disabled={busy||!online} onClick={sync}>{normal?t('Retry original save','أعد محاولة الحفظ الأصلي'):t('Sync original','زامن الحفظ الأصلي')}</Button>}
    </div>}
    {page&&<>
      <h3>{page.header.projection.name}</h3><p><bdi>{format(page.header.starts_at)} — {format(page.header.ends_at)}</bdi></p>
      {normal&&<>{page.needsCurrentRead?<p role="status">{t('Latest marks are unavailable until this register is checked.','التسجيلات الأحدث غير متاحة حتى التحقق من هذه القائمة.')}</p>:<><div className="register-summary" role="status">{(['present','absent','unmarked'] as const).map(mark=><div key={mark} className={mark}><strong>{counts[mark]}</strong>{label(mark)}</div>)}</div><p>{t(page.more?'Counts cover loaded players only.':'Counts include unsaved selections.',page.more?'الأعداد تخص اللاعبين المحمّلين فقط.':'الأعداد تشمل الاختيارات غير المحفوظة.')} {t('Unmarked never means Absent.','عدم التسجيل لا يعني الغياب.')}</p></>}<div className="register-filters"><label>{t('Find a loaded player','البحث في اللاعبين المحمّلين')}<Input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>{t('Show','عرض')}<Select disabled={page.needsCurrentRead} value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">{t('All loaded players','كل اللاعبين المحمّلين')}</option><option value="unmarked">{label(null)}</option><option value="selected">{t('Selected, not saved','مختار غير محفوظ')}</option><option value="saved">{t('Saved','محفوظ')}</option></Select></label></div></>}
      <p>{page.header.projection.branch} · <bdi>{page.header.projection.timezone}</bdi></p>
      <p>{page.players.length} / {page.header.count} {t('loaded from this device','محمّلون من هذا الجهاز')}</p>
      {!page.captureWindow.open&&<p role="status">{page.captureWindow.state==='before'?
        t('This session has not started yet.','لم يبدأ هذا التدريب بعد.'):
        t('The recording window has closed. Unsaved choices are retained.','انتهت مهلة التسجيل. الاختيارات غير المحفوظة محفوظة هنا.')}</p>}
      <ul className="register-roster">{page.players.filter(player=>player.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())&&(filter==='all'||filter==='saved'&&player.version>0||filter==='selected'&&!!draft[player.id]||filter==='unmarked'&&!player.version)).map(player=><li key={player.id}>
        {normal?<div className="register-person"><span className="register-avatar" aria-hidden="true">{player.name.slice(0,1)}</span><Button aria-pressed={selected===player.id} onClick={e=>{playerOpener.current=e.currentTarget;setSelected(player.id);}}>{player.name}</Button></div>:<span>{player.name}</span>}{page.needsCurrentRead?<span>{t('Current mark unavailable','التسجيل الحالي غير متاح')}</span>:pendingChoices.has(player.id)?<span className="attendance-status unsaved">{label(pendingChoices.get(player.id)!)} · {t('Saved on this device','محفوظ على هذا الجهاز')}</span>:player.version?<span className={`attendance-status ${player.status}`}>{label(player.status)}</span>:
          <div className="register-options" role="group" aria-label={player.name}>{(['present','absent',null] as const).map(status=>
            <Button key={String(status)} disabled={busy||!!pending||page.needsCurrentRead||!page.captureWindow.open}
              aria-pressed={(draft[player.id]?.status??null)===status} onClick={()=>setDraft(previous=>{
                const next={...previous};
                if(status)next[player.id]={name:player.name,status};else delete next[player.id];
                return next;
              })}>{label(status)}</Button>)}</div>}
        {player.version>0&&draft[player.id]&&<Button onClick={()=>setDraft(previous=>{const next={...previous};delete next[player.id];return next;})}>{t('Review newer saved mark; remove unsaved choice','مراجعة التسجيل الأحدث وإزالة الاختيار غير المحفوظ')}</Button>}
      </li>)}</ul>
      {page.more&&<Button disabled={busy||checking} onClick={nextPage}>{t('Load more players','حمّل المزيد من اللاعبين')}</Button>}
      <div className="register-savebar"><p>{selections.length} {t('selected changes. Unmarked never means Absent.','اختيارات. عدم التسجيل لا يعني الغياب.')}</p><Button className="register-primary" ref={opener} disabled={busy||checking||!selections.length||!!pending||page.needsCurrentRead||!page.captureWindow.open||page.players.some(player=>!!draft[player.id]&&player.version>0)}
        onClick={()=>setReviewing(true)}>{t('Review register','راجع الحضور')}</Button></div>
    </>}
    <dialog ref={dialog} className="register-dialog" aria-labelledby="prepared-review" onCancel={e=>{e.preventDefault();dismiss();}}>
      <h3 id="prepared-review">{t('Save selected marks on this device?','هل تريد حفظ العلامات المختارة على هذا الجهاز؟')}</h3>
      {hasAccess&&<ul>{selections.map(([id,value])=><li key={id}>{value.name} · {label(value.status)}</li>)}</ul>}
      <Button disabled={busy} onClick={dismiss}>{t('Back to editing','العودة إلى التعديل')}</Button>
      <Button disabled={busy||checking||!hasAccess||!selections.length||!page?.captureWindow.open||page.players.some(player=>!!draft[player.id]&&player.version>0)} onClick={save}>{normal?t('Save selected marks','حفظ التسجيلات المختارة'):t('Save on this device','احفظ على هذا الجهاز')}</Button>
    </dialog>
  </section>;
  if(!normal)return content;
  function navigate(e:MouseEvent<HTMLAnchorElement>){
    e.preventDefault();const href=e.currentTarget.getAttribute('href');
    if(href==='#language'){setLocale(ar?'en':'ar');return;}
    if(!href||!window.dispatchEvent(new Event(REGISTER_DRAFT_EXIT_EVENT,{cancelable:true})))return;
    if(offline||!online)location.assign(href);else router.push(href);
  }
  const status=!online?t('Offline','غير متصل'):busy||checking?t('Online · Checking changes','متصل · التحقق من التغييرات'):t('Online','متصل');
  const backHref=`/${locale}/workspace/${academy}/calendar`;
  const details=<section><h2>{picked?.name??t('Keep the roster in view','احتفظ بالقائمة أمامك')}</h2>
    {picked?<><p>{label(picked.status??pendingChoices.get(picked.id)??draft[picked.id]?.status??null)}</p>
      <p>{page?.header.projection.name} · {page?.header.projection.branch}</p>
      {picked.version>0&&onInspect&&<Button disabled={!online||busy||checking||!!pending||selections.length>0}
        onClick={()=>onInspect(picked.id,{query,filter,selected,loaded:page!.players.length,locale,
          paneScroll:region.current?.closest('.workspace-center')?.scrollTop??0,windowScroll:window.scrollY})}>{t('History and corrections','السجل والتصحيحات')}</Button>}
      {picked.version>0&&!onInspect&&<p>{t('Open this same session when signed in online for history and corrections.','افتح التدريب نفسه بعد تسجيل الدخول عبر الإنترنت للسجل والتصحيحات.')}</p>}</>:
      <p>{t('Choose Present or Absent in the register. Saved marks use the existing history and correction workflow.','اختر حاضر أو غائب في القائمة. التسجيلات المحفوظة لها السجل ومسار التصحيح الحالي.')}</p>}
  </section>;
  return <div className="attendance-theme"><WorkspaceShell role="owner" module="attendance" locale={locale}
    context={t('Academy Owner workspace','مساحة مالك الأكاديمية')} title={t('Session attendance','حضور التدريب')}
    homeHref={`/${locale}/workspace/${academy}/home`} languageHref="#language" onNavigate={navigate}
    prefetch={false} account={account} tools={<span role="status">{status}{pending?' · '+(pending.state==='needs_review'?t('Needs review','تحتاج مراجعة'):t('1 save pending','حفظ واحد معلّق')):''}</span>}
    navigation={[{href:backHref,label:t('Calendar','التقويم')},{href:`/${locale}/workspace/${academy}/attendance/${event}`,label:t('Attendance','الحضور'),current:true}]}>
    <WorkspacePanes modalOnPhone title={t('Player attendance','حضور اللاعب')} arabic={ar} selected={!!picked}
      selectionKey={selected??''} contextLabel={t('Session / player details','تفاصيل التدريب / اللاعب')} inspector={details}
      onBack={()=>{setSelected(null);requestAnimationFrame(()=>playerOpener.current?.focus());}}>
      <div className="register-heading"><h1>{t('Session attendance','حضور التدريب')}</h1><span className={`attendance-status ${selections.length?'unsaved':''}`}>{selections.length?t('Unsaved choices','اختيارات غير محفوظة'):pending?t('Saved on this device','محفوظ على هذا الجهاز'):t('Current register','القائمة الحالية')}</span></div>
      {content}
    </WorkspacePanes>
  </WorkspaceShell></div>;
}
