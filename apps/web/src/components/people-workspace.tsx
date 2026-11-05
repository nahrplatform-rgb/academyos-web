"use client";
import { useEffect, useEffectEvent, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { UserButton, useUser } from '@clerk/nextjs';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import WorkspacePanes from './workspace-panes';
import { ownerNavigation } from './owner-navigation';
import { listenForVisibleResume } from '@/lib/visible-resume';
import Link from 'next/link';
import { Button, Input } from './ui/controls';
import {useOwnerWorkspaceDevice,WorkspaceDeviceTools} from './owner-workspace-device';
const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
type Player = {
    id: string;
    name: string;
    branch: string;
    contact?: string;
};
type Row = {
    id: string;
    display_name: string;
    branch_name: string;
    contact_email?: string;
};
type Context = {
    academy_name: string;
    branch_id: string;
    branch_name: string;
};
type Page = {
    items: Row[];
    more: boolean;
    revision: number;
} & Context;
type Stage = 'directory' | 'form' | 'duplicates' | 'review' | 'saving' | 'unknown' | 'profile';
class RequestFailure extends Error {
    constructor(public code: string) { super(code); }
}
const playerRow = (p: Row): Player => ({ id: p.id, name: p.display_name, branch: p.branch_name, contact: p.contact_email });
export default function PeopleWorkspace(props: {
    locale: string;
    academy: string;
    prepared?: boolean;
}) {
    const session = useUser();
    const [initializationExpired, setInitializationExpired] = useState(false);
    useEffect(() => {
        if (session.isLoaded) return;
        const timer = setTimeout(() => setInitializationExpired(true), 15000);
        return () => clearTimeout(timer);
    }, [session.isLoaded]);
    if (!session.isLoaded && initializationExpired)
        return <PublicWorkspace locale={props.locale} title={props.locale === 'ar' ? 'تسجيل الدخول والصلاحية' : 'Sign-in and access'}><section className="journey-card"><h1>{props.locale === 'ar' ? 'تعذر تحميل تسجيل الدخول' : 'Could not load sign-in'}</h1><p role="alert">{props.locale === 'ar' ? 'لم تُحمّل بيانات اللاعبين. أعد تحميل الصفحة للمحاولة مجدداً.' : 'No player data was loaded. Reload the page to try again.'}</p><Button onClick={() => window.location.reload()}>{props.locale === 'ar' ? 'إعادة تحميل الصفحة' : 'Retry loading page'}</Button></section></PublicWorkspace>;
    if (!session.isLoaded)
        return <PublicWorkspace locale={props.locale} title="AcademyOS"><p role="status">{props.locale === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</p></PublicWorkspace>;
    if (!session.user)
        return <PublicWorkspace locale={props.locale} title="AcademyOS"><p>{props.locale === 'ar' ? 'سجّل الدخول للمتابعة.' : 'Sign in to continue.'}</p></PublicWorkspace>;
    return <PeopleJourney key={`${session.user.id}:${props.academy}`} {...props} subject={session.user.id}/>;
}
export function PeopleJourney({ locale: initialLocale, academy, subject,prepared,publicOffline }: {
    locale: string;
    academy: string;
    subject: string;
    prepared?: boolean;
    publicOffline?: boolean;
}) {
    const [locale, setLocale] = useState(initialLocale), ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
    const device=useOwnerWorkspaceDevice({subject,academy,priority:'people',prepared,publicOffline});
    const [localRows,setLocalRows]=useState(false), [summaryOnly,setSummaryOnly]=useState(false);
    type LocalPosition=NonNullable<Awaited<ReturnType<typeof device.read>>>['next'];
    const localNext=useRef<LocalPosition>(null), localPosition=useRef<LocalPosition>(null), localSearch=useRef('');
    const [missing,setMissing]=useState(false);
    const [stage, setStage] = useState<Stage>('directory'), [context, setContext] = useState<Context | null>(null);
    const [players, setPlayers] = useState<Player[]>([]), [candidates, setCandidates] = useState<Player[]>([]);
    const [more, setMore] = useState(false), [candidateMore, setCandidateMore] = useState(false), [revision, setRevision] = useState(0);
    const [name, setName] = useState(''), [contact, setContact] = useState(''), [search, setSearch] = useState(''), [different, setDifferent] = useState(false);
    const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(true), [blocked, setBlocked] = useState(false);
    const [profileId, setProfileId] = useState(''), [selected, setSelected] = useState<Player | null>(null), [saved, setSaved] = useState(false);
    const operation = useRef<string | null>(null), heading = useRef<HTMLHeadingElement>(null), nameInput = useRef<HTMLInputElement>(null);
    const profileOpeners = useRef(new Map<string, HTMLButtonElement>()), searchInput = useRef<HTMLInputElement>(null);
    const lastSearch = useRef(''), lifecycleTicket = useRef(0), profileTicket = useRef(0);
    const active = useRef(true), locked = useRef(false), controllers = useRef(new Set<AbortController>()), directoryTicket = useRef(0);
    const storageKey = `academyos:people:${subject}:${academy}`;
    const unavailable = blocked;
    function errorText(code: string) { return ({ denied: t('Access unavailable. Check your workspace and account.', 'الصلاحية غير متاحة. تحقق من مساحة العمل والحساب.'), setup_required: t('Complete initial academy setup before registering players.', 'أكمل الإعداد الأولي قبل تسجيل اللاعبين.'), offline:t('Connect to complete this action.','اتصل بالإنترنت لإكمال هذا الإجراء.'), invalid: t('Check the name and fictional contact email.', 'تحقق من الاسم وبريد جهة الاتصال الخيالي.'), conflict: t('Operation changed or was cancelled. Check the original save.', 'تغيرت العملية أو أُلغيت. تحقق من الحفظ الأصلي.'), limited: t('Too many requests. Wait before trying again.', 'طلبات كثيرة. انتظر قبل المحاولة.'), unavailable: t('Could not confirm this operation. Retry or check the original save.', 'تعذر تأكيد العملية. أعد المحاولة أو تحقق من الحفظ الأصلي.') } as Record<string, string>)[code] ?? t('Could not complete the request.', 'تعذر إكمال الطلب.'); }
    function forget() { try {
        sessionStorage.removeItem(storageKey);
    }
    catch { } operation.current = null; }
    function failure(e: unknown) { if (!active.current)
        return; const code = e instanceof RequestFailure ? e.code : 'unavailable'; setError(code); if (['denied', 'setup_required'].includes(code)) {
        setBlocked(true);
        if(device.approved)void device.remove();
        setContext(null);
        setPlayers([]);
        setCandidates([]);
        setSelected(null);
        setName('');
        setContact('');
    } }
    async function request<T>(body: Record<string, unknown>): Promise<T> {
        if(device.offline)throw new RequestFailure('offline');
        const controller = new AbortController();
        controllers.current.add(controller);
        const timeout = setTimeout(() => controller.abort(), 15000);
        try {
            const res = await fetch('/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: controller.signal, body: JSON.stringify({ ...body, academy }) });
            const json = await res.json();
            if (!active.current || controller.signal.aborted)
                throw new RequestFailure('stale');
            if (!res.ok)
                throw new RequestFailure(json.error ?? 'unavailable');
            return json.data as T;
        }
        finally {
            clearTimeout(timeout);
            controllers.current.delete(controller);
        }
    }
    async function loadDirectory(after?:string, position:LocalPosition=null, quiet=false) {
        let ticket=quiet?directoryTicket.current:++directoryTicket.current;
        let applied=!quiet;
        const q=search.normalize('NFKC').trim();
        if(!quiet){controllers.current.forEach(c=>c.abort());setBusy(true);setError('');}
        try {
            if(q.length===1) {
                setPlayers([]);setMore(false);localNext.current=null;
                return;
            }
            if(device.active&&!after) {
                let cursor=position;
                const local=async()=>device.read('people',q,cursor??undefined);
                const contextTask=device.context();
                const pageTask=local().catch(async(error:unknown)=>{
                    if(cursor&&error instanceof Error&&/workspace_invalid_position|workspace_generation_changed/.test(error.message)){
                        cursor=null;
                        return local();
                    }
                    throw error;
                });
                let localResult:Awaited<typeof pageTask>=null;
                let localContext:Awaited<typeof contextTask>=null;
                try {[localResult,localContext]=await Promise.all([pageTask,contextTask]);} catch { /* Use an authorized online read if storage is unavailable. */ }
                if(ticket!==directoryTicket.current||!active.current)return;
                if(localResult&&localContext) {
                    if(quiet){ticket=++directoryTicket.current;applied=true;}
                    setContext(localContext);
                    setPlayers(localResult.rows.flatMap(row=>'display_name'in row?[playerRow(row)]:[]));
                    setMore(Boolean(localResult.next));localNext.current=localResult.next;
                    localPosition.current=cursor;localSearch.current=q;
                    setMissing(false);setBlocked(false);setLocalRows(true);
                    return;
                }
            }
            if(quiet&&!localRows)return;
            if(device.offline){
                if(ticket!==directoryTicket.current)return;
                applied=true;
                setLocalRows(false);setMissing(true);setBlocked(false);setPlayers([]);setMore(false);setContext(null);
                return;
            }
            if(quiet)return;
            const result=await request<Page>({action:'list',query:q,...(after?{after}:{})});
            if(ticket!==directoryTicket.current)return;
            setContext(result);setPlayers(result.items.map(playerRow));setMore(result.more);
            setMissing(false);setLocalRows(false);setBlocked(false);
        } catch(e) {
            if(!quiet&&ticket===directoryTicket.current){setPlayers([]);setBlocked(true);failure(e);}
        } finally {
            if(applied&&active.current&&ticket===directoryTicket.current&&(!quiet||stage==='directory'))setBusy(false);
        }
    }
    async function reviewCandidates(after?: string) { setBusy(true); setError(''); setNotice(''); try {
        const result = await request<Page>({ action: 'candidates', name, ...(after ? { after } : {}) });
        if (after && result.revision !== revision) {
            setDifferent(false);
            await reviewCandidates();
            setNotice(t('Matching records changed. Review again from the first page.', 'تغيرت السجلات المطابقة. راجع من الصفحة الأولى.'));
            return;
        }
        setCandidates(result.items.map(playerRow));
        setCandidateMore(result.more);
        setRevision(result.revision);
        setDifferent(false);
        setStage(result.revision > 0 ? 'duplicates' : 'review');
    }
    catch (e) {
        failure(e);
    }
    finally {
        if (active.current)
            setBusy(false);
    } }
    function selectPlayer(player:Player) {
        if(!localRows){void openProfile(player.id);return;}
        setSaved(false);setProfileId(player.id);setSelected(player);setSummaryOnly(true);go('profile');
    }
    async function openProfile(id: string, wasSaved = false) {
        setSummaryOnly(false);
 const ticket = ++profileTicket.current; setSaved(wasSaved); setProfileId(id); setSelected(null); setStage('profile'); setBusy(true); setError(''); setNotice(''); try {
        const p = await request<Row>({ action: 'profile', player: id });
        if (ticket !== profileTicket.current)
            return;
        setSelected(playerRow(p));
        setStage('profile');
    }
    catch (e) {
        failure(e);
    }
    finally {
        if (active.current)
            setBusy(false);
    } }
    function go(next: Stage) { setError(''); setNotice(''); setStage(next); }
    function guard(event: MouseEvent<HTMLAnchorElement>) { event.preventDefault(); if (['saving', 'unknown'].includes(stage))
        return; if (['form', 'duplicates', 'review'].includes(stage) && !window.confirm(t('Discard this unsaved draft?', 'تجاهل المسودة غير المحفوظة؟')))
        return; setName(''); setContact(''); go('directory'); void loadDirectory(); }
    async function continueDraft(event: FormEvent) { event.preventDefault(); if (!name.trim()) {
        setError('invalid');
        nameInput.current?.focus();
        return;
    } if (contact && !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@example\.invalid$/i.test(contact.trim())) {
        setError('invalid');
        return;
    } setSaved(false); await reviewCandidates(); }
    async function save() {
        if (locked.current || stage !== 'review' || !context)
            return;
        locked.current = true;
        setBusy(true);
        setStage('saving');
        setError('');
        setNotice('');
        const op = crypto.randomUUID();
        operation.current = op;
        try {
            sessionStorage.setItem(storageKey, op);
        }
        catch { }
        try {
            const r = await request<{
                player_id: string;
            }>({ action: 'create', branch: context.branch_id, op, name, contact, revision, different });
            setSaved(true);
            forget();
            setName('');
            setContact('');
            if(device.approved)device.refresh();
            await openProfile(r.player_id, true);
        }
        catch (e) {
            if (!active.current)
                return;
            const code = e instanceof RequestFailure ? e.code : 'unavailable';
            if (code === 'review_required') {
                forget();
                setDifferent(false);
                await reviewCandidates();
                setNotice(t('A matching record changed. Review again before saving.', 'تغير سجل مطابق. راجع مجدداً قبل الحفظ.'));
            }
            else if (['invalid', 'limited', 'denied', 'setup_required'].includes(code)) {
                forget();
                setStage('review');
                failure(e);
            }
            else {
                setStage('unknown');
                failure(e);
            }
        }
        finally {
            locked.current = false;
            if (active.current)
                setBusy(false);
        }
    }
    async function reconcile() { if (locked.current || !operation.current)
        return; locked.current = true; setBusy(true); setError(''); setNotice(''); try {
        const r = await request<{
            player_id?: string;
            cancelled?: boolean;
        }>({ action: 'reconcile', op: operation.current });
        if (r.player_id) {
            forget();
            setSaved(true);
            setName('');
            setContact('');
            if(device.approved)device.refresh();
            await openProfile(r.player_id, true);
        }
        else if (r.cancelled) {
            forget();
            setStage(name ? 'form' : 'directory');
            setNotice(t('The original save did not commit and is now cancelled. You may register again.', 'لم يُحفظ الطلب الأصلي وأُلغي الآن. يمكنك التسجيل مجدداً.'));
            if (!name)
                await loadDirectory();
        }
    }
    catch (e) {
        failure(e);
    }
    finally {
        locked.current = false;
        if (active.current)
            setBusy(false);
    } }
    const initialize = useEffectEvent(() => { let pending: string | null = null; try {
        pending = sessionStorage.getItem(storageKey);
    }
    catch { } if (pending && uuidPattern.test(pending)) {
        operation.current = pending;
        setStage('unknown');
    } void loadDirectory(); });
    const refreshDirectory = useEffectEvent(() => { if (stage === 'directory')
        void loadDirectory(); });
    const refreshVisible = useEffectEvent(() => { if (busy || document.visibilityState !== 'visible')
        return; if (stage === 'directory' || stage === 'form') {
        if(!device.active)void loadDirectory();
    }
    else if (stage === 'profile' && profileId && !summaryOnly && !device.offline)
        void openProfile(profileId);
    else if (['duplicates', 'review'].includes(stage)) { setDifferent(false); setStage('form'); setNotice(t('Draft retained. Recheck matching records before confirming.', 'حُفظت المسودة في الذاكرة. أعد مراجعة السجلات المطابقة قبل التأكيد.')); } });
    useEffect(() => { active.current = true; const ticket = ++lifecycleTicket.current; const currentControllers = controllers.current; void Promise.resolve().then(() => { if (active.current && ticket === lifecycleTicket.current)
        initialize(); }); return () => { active.current = false; currentControllers.forEach(c => c.abort()); }; }, []);
    useEffect(() => { if (search === lastSearch.current)
        return; lastSearch.current = search; const timer = setTimeout(() => refreshDirectory(), 300); return () => clearTimeout(timer); }, [search]);
    useEffect(() => listenForVisibleResume(() => refreshVisible()), []);
    const reloadLocal=useEffectEvent(()=>{
        if(!active.current)return;
        if(device.phase==='denied'){
            failure(new RequestFailure('denied'));
            return;
        }
        if(stage!=='directory'&&stage!=='profile')return;
        if(localRows&&!device.active){
            setPlayers([]);setSelected(null);setContext(null);setLocalRows(false);
            if(device.offline)setMissing(true);
            else void loadDirectory();
            return;
        }
        if(device.active)void loadDirectory(undefined,localSearch.current===search.normalize('NFKC').trim()?localPosition.current:null,true);
    });
    useEffect(()=>{if(prepared)queueMicrotask(reloadLocal);},[prepared,device.active,device.coverage,device.phase,device.offline]);

    useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = ar ? 'rtl' : 'ltr'; }, [locale, ar]);
    useEffect(() => { if (!['profile','review','saving','unknown'].includes(stage)) heading.current?.focus(); }, [stage]);
    useEffect(() => { if (!['form', 'duplicates', 'review', 'saving', 'unknown'].includes(stage))
        return; const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [stage]);
    function closeProfile() { if (busy || stage === 'unknown' || stage === 'saving') return; if (stage === 'review' || stage === 'duplicates') { go('form'); return; } if(stage === 'form' && !window.confirm(t('Discard this unsaved draft?', 'تجاهل المسودة غير المحفوظة؟'))) return; go('directory'); const restoreFocus = () => requestAnimationFrame(() => (profileOpeners.current.get(profileId) ?? searchInput.current)?.focus()); if (saved) void loadDirectory().then(restoreFocus); else restoreFocus(); }
    const registrationTask = !['directory','profile'].includes(stage);
    const protectedViewGone=device.phase==='denied'||(localRows&&!device.active);
    const inspector = protectedViewGone?null:<>
      {stage === 'profile' && !device.offline && <div className="read-toolbar"><Button disabled={busy} onClick={() => void openProfile(profileId, saved)}>{summaryOnly?t('Open full profile','فتح الملف الكامل'):t(error ? 'Retry current read' : 'Refresh view', error ? 'إعادة محاولة قراءة الحالة' : 'تحديث العرض')}</Button></div>}

      {(stage === 'profile' || registrationTask) && error && <p className="journey-error" role="alert">{errorText(error)}</p>}
      {(stage === 'profile' || registrationTask) && notice && <p className="notice" role="status">{notice}</p>}
        {stage === 'form' && <section className="journey-card"><h2>{t('New player draft', 'مسودة لاعب جديد')}</h2>
          <p>{t('Use fictional details only. Saving a contact sends no invitation and grants no access.', 'استخدم بيانات خيالية فقط. حفظ جهة اتصال لا يرسل دعوة ولا يمنح صلاحية.')}</p>
          <form onSubmit={continueDraft}><fieldset disabled={busy}><legend>{t('Fictional player details', 'بيانات اللاعب الخيالية')}</legend>
            <label htmlFor="player-name">{t('Player display name (required)', 'اسم عرض اللاعب (مطلوب)')}</label>
            <Input ref={nameInput} id="player-name" required maxLength={160} value={name} onChange={event => setName(event.target.value)}/>
            <label htmlFor="contact-email">{t('Parent/guardian contact email (optional)', 'بريد جهة اتصال ولي الأمر (اختياري)')}</label>
            <Input id="contact-email" type="email" dir="ltr" maxLength={254} value={contact} onChange={event => setContact(event.target.value)} aria-describedby="contact-help"/>
            <small id="contact-help">{t('Unverified contact only. Use @example.invalid. No parent account, invitation or child access.', 'جهة اتصال غير موثقة فقط. استخدم @example.invalid. لا حساب لولي الأمر أو دعوة أو وصول لبيانات الطفل.')}</small>
            <div className="journey-actions"><Button disabled={busy} type="submit" className="button">{t('Continue to duplicate review', 'المتابعة لمراجعة التكرار')}</Button><Button type="button" onClick={() => { if (window.confirm(t('Discard this draft?', 'تجاهل هذه المسودة؟'))) {
                setName('');
                setContact('');
                go('directory');
                void loadDirectory();
            } }}>{t('Discard draft', 'تجاهل المسودة')}</Button></div>
          </fieldset></form>
        </section>}
        {stage === 'duplicates' && <section className="journey-card"><h2>{t('Review possible duplicates', 'مراجعة السجلات المتشابهة')}</h2>
          <p>{t('Matching names do not establish identity. Open an existing record, or explicitly confirm a different person. No automatic merge.', 'تشابه الاسم لا يثبت الهوية. افتح سجلاً موجوداً أو أكد أنه شخص مختلف. لا دمج تلقائياً.')}</p>
          <div className="people-comparison"><section className="people-proposal"><h3>{t('New registration','التسجيل الجديد')}</h3><strong>{name.trim()}</strong><p>{context?.branch_name}</p><p><bdi dir="ltr">{contact || t('No contact supplied','لم تُضف جهة اتصال')}</bdi></p><span className="badge">{t('Not saved','غير محفوظ')}</span></section><section><h3>{t('Possible existing players','لاعبون موجودون محتملون')}</h3><ul className="journey-list">{candidates.map(player => <li key={player.id}><strong>{player.name}</strong> · {player.branch} <Button disabled={busy&&!localRows} onClick={() => selectPlayer(player)}>{t('Open existing profile', 'فتح الملف الموجود')}</Button></li>)}</ul></section></div>
          {candidateMore && <Button disabled={busy} onClick={() => void reviewCandidates(candidates.at(-1)?.id)}>{t('Next matching page (up to 25)', 'الصفحة المطابقة التالية (حتى 25)')}</Button>}<label className="people-check"><input type="checkbox" checked={different} onChange={event => setDifferent(event.target.checked)}/>{t('I reviewed these records. This is a different fictional person.', 'راجعت هذه السجلات. هذا شخص خيالي مختلف.')}</label>
          <div className="journey-actions"><Button disabled={!different || busy || candidateMore} className="button" onClick={() => go('review')}>{t('Review new registration', 'مراجعة التسجيل الجديد')}</Button><Button onClick={() => go('form')}>{t('Edit draft', 'تعديل المسودة')}</Button></div>
        </section>}
        {stage === 'review' && <section className="journey-card"><h2>{t('Confirm player registration', 'تأكيد تسجيل اللاعب')}</h2>
          <dl className="admission-properties"><div><dt>{t('Player', 'اللاعب')}</dt><dd>{name.trim()}</dd></div><div><dt>{t('Branch', 'الفرع')}</dt><dd>{context?.branch_name}</dd></div><div><dt>{t('Optional unverified contact', 'جهة الاتصال الاختيارية غير الموثقة')}</dt><dd><bdi dir="ltr">{contact || t('Not provided', 'لم تُضف')}</bdi></dd></div></dl>
          <p>{t('Creates one player record and optional unverified contact. No login, guardian link, enrollment or activation.', 'ينشئ سجل لاعب واحداً وجهة اتصال غير موثقة إن أُضيفت. لا تسجيل دخول أو ربط ولي أمر أو اشتراك أو تفعيل.')}</p>
          <div className="journey-actions"><Button className="button" disabled={busy} onClick={() => void save()}>{t('Save registration', 'حفظ التسجيل')}</Button><Button onClick={() => go('form')}>{t('Edit draft', 'تعديل المسودة')}</Button></div>
        </section>}
        {stage === 'saving' && <section className="journey-card" role="status"><h2>{t('Saving… awaiting confirmation', 'جارٍ الحفظ… بانتظار التأكيد')}</h2><p>{t('Pending is not saved success. Repeated submission is disabled.', 'الانتظار ليس نجاحاً مؤكداً. إعادة الإرسال معطلة.')}</p><Button disabled>{t('Saving…', 'جارٍ الحفظ…')}</Button></section>}
        {stage === 'unknown' && <section className="journey-card"><h2>{t('Save outcome is uncertain', 'نتيجة الحفظ غير مؤكدة')}</h2><p>{t('Keep the original operation reference. Check its status before creating a replacement.', 'احتفظ بمرجع العملية الأصلي. تحقق من حالتها قبل إنشاء بديل.')}</p><Button className="button" disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'التحقق من العملية الأصلية')}</Button></section>}

        {stage === 'profile' && saved && !selected && !busy && <p role="status">{t('Registration confirmed; current view unavailable. Retry loading the profile without saving again.','تأكد التسجيل؛ العرض الحالي غير متاح. أعد تحميل الملف دون الحفظ مجدداً.')}</p>}
        {stage === 'profile' && !selected && !busy && <Button onClick={() => void openProfile(profileId, saved)}>{t('Retry loading profile', 'إعادة تحميل الملف')}</Button>}
        {stage === 'profile' && selected && <section className="journey-card"><h2>{selected.name}</h2>
          <p role="status">{saved ? t('Registration saved', 'حُفظ التسجيل') : t('Saved player profile', 'ملف اللاعب المحفوظ')}</p>
          <dl className="admission-properties"><div><dt>{t('Branch', 'الفرع')}</dt><dd>{selected.branch}</dd></div><div><dt>{t('Unverified contact', 'جهة اتصال غير موثقة')}</dt><dd><bdi dir="ltr">{selected.contact || t('Not provided', 'لم تُضف')}</bdi></dd></div></dl>
          <p className="notice">{t('Saving contact details does not create guardian access. Manage appointments separately.', 'حفظ بيانات الاتصال لا يمنح صلاحية ولي أمر. أدر التعيينات بشكل منفصل.')}</p>
          {!device.offline&&!summaryOnly&&<div className="journey-actions"><Link className="button" href={`/${locale}/workspace/${academy}/players/${selected.id}/card`}>{t('Player QR card', 'بطاقة QR للاعب')}</Link><Link className="button" href={`/${locale}/workspace/${academy}/players/${selected.id}/guardians`}>{t('Guardian appointments', 'دعوات أولياء الأمور')}</Link>{name && !saved && <Button onClick={() => go('form')}>{t('Return to registration draft', 'العودة لمسودة التسجيل')}</Button>}</div>}
        </section>}

      {stage === 'directory' && <><h3>{t('Registration scope','نطاق التسجيل')}</h3><p>{t('Select a saved player to inspect their profile. New registration keeps duplicate review and confirmation separate.','اختر لاعباً محفوظاً لفحص ملفه. يظل التسجيل الجديد منفصلاً عن مراجعة التكرار والتأكيد.')}</p>{context && <p>{context.branch_name}</p>}</>}
    </>;
    const title = stage === 'profile' ? t('Players', 'اللاعبون') : stage === 'directory' ? t('Players', 'اللاعبون') : t('Register a player', 'تسجيل لاعب');
    return <>
    <WorkspaceShell prefetch={prepared?false:undefined} role="owner" module="people" locale={locale} context={(!protectedViewGone&&context?.academy_name)||t('Academy workspace', 'مساحة الأكاديمية')} title={title} homeHref={`/${locale}/workspace`} languageHref="#language" navigation={ownerNavigation(locale,academy,'people')} onNavigate={event => { if(publicOffline&&event.currentTarget.hash!=='#language'){event.preventDefault();const path=new URL(event.currentTarget.href);if(path.pathname.endsWith('/players')||path.pathname.endsWith('/calendar'))window.location.assign(path.href);return;} if (event.currentTarget.hash === '#language') {
        event.preventDefault();
        setLocale(ar ? 'en' : 'ar');
    }
    else if (event.currentTarget.hash === '#directory')
        guard(event);
    else if (['saving', 'unknown'].includes(stage) || (['form', 'duplicates', 'review'].includes(stage) && !window.confirm(t('Discard this unsaved draft?', 'تجاهل المسودة غير المحفوظة؟'))))
        event.preventDefault(); }} account={publicOffline?null:<UserButton />} tools={<WorkspaceDeviceTools device={device} locale={locale} verified={Boolean(context)&&!blocked}/>}>
      <WorkspacePanes task={registrationTask} arabic={ar} title={stage === 'profile' ? t('Player profile','ملف اللاعب') : t('Current task','المهمة الحالية')} inspector={inspector} selected={!protectedViewGone&&(stage === 'profile' || registrationTask)} blocked={busy || stage === 'unknown' || stage === 'saving'} onBack={closeProfile} selectionKey={stage + profileId} backLabel={stage === 'profile' ? t('Back to players','العودة للاعبين') : undefined}>
      <header className="task-header">      <h1 ref={heading} tabIndex={-1}>{title}</h1>{registrationTask && <ol className="people-steps" aria-label={t('Registration progress','مراحل التسجيل')}><li aria-current={stage==='form'?'step':undefined}>{t('Player details','بيانات اللاعب')}</li><li aria-current={stage==='duplicates'?'step':undefined}>{t('Duplicate check','فحص التكرار')}</li><li aria-current={['review','saving','unknown'].includes(stage)?'step':undefined}>{t('Review and save','المراجعة والحفظ')}</li></ol>}
      {stage !== 'profile' && stage !== 'unknown' && stage !== 'saving' && <div className="read-toolbar"><Button disabled={busy} onClick={() => { if (stage === 'directory' || stage === 'form') void loadDirectory(); else { setDifferent(false); setStage('form'); void reviewCandidates(); } }}>{t(error ? 'Retry current read' : stage === 'review' || stage === 'duplicates' ? 'Recheck current state' : 'Refresh view', error ? 'إعادة محاولة قراءة الحالة' : stage === 'review' || stage === 'duplicates' ? 'إعادة التحقق من الحالة' : 'تحديث العرض')}</Button></div>}</header>
      {context && device.phase!=='denied' && (!localRows||device.active) && <p className="notice">{`${context.academy_name} · ${context.branch_name}`}</p>}
      {!registrationTask && stage !== 'profile' && error && <p className="journey-error" role="alert">{errorText(error)}</p>}
      {!registrationTask && stage !== 'profile' && notice && <p className="notice" role="status">{notice}</p>}
      {busy && stage !== 'saving' && <p role="status">{t('Loading…', 'جارٍ التحميل…')}</p>}
      {error === 'setup_required' && <a href={`/${locale}/workspace/${academy}`}>{t('Complete initial setup', 'أكمل الإعداد الأولي')}</a>}
      {unavailable||device.phase==='denied' ? <section className="journey-card">
        <h2>{error === 'denied' ? t('Access unavailable', 'الصلاحية غير متاحة') : t('Could not load players', 'تعذر تحميل اللاعبين')}</h2>
        <p>{error === 'denied' ? t('No player or contact information is shown after access is removed.', 'لا تُعرض بيانات اللاعبين أو جهات الاتصال بعد سحب الصلاحية.') : t('A failed lookup is not an empty directory.', 'فشل التحميل لا يعني أن القائمة فارغة.')}</p>
        <Button onClick={() => void loadDirectory()}>{t('Retry access', 'إعادة محاولة الوصول')}</Button>
      </section> : <>
        {(stage === 'directory' || stage === 'profile') && <section className="journey-card">
          <div className="section-heading"><h2>{t('Player directory', 'قائمة اللاعبين')}</h2><Button disabled={busy||device.offline} className="button" onClick={() => { setName(''); setContact(''); setDifferent(false); setSaved(false); operation.current = null; go('form'); }}>{t('Register player', 'تسجيل لاعب')}</Button></div>
          <label htmlFor="player-search">{t('Find a player by name', 'البحث عن لاعب بالاسم')}</label>
          <Input ref={searchInput} id="player-search" maxLength={160} value={search} onChange={event => { directoryTicket.current++; setSearch(event.target.value); setBusy(true); }}/>
          {search.normalize('NFKC').trim().length === 1 && <p>{t('Enter at least two characters to search.','أدخل حرفين على الأقل للبحث.')}</p>}
          {missing&&<p role="status">{t('Players have not been prepared for this device. Open this view when connected.','لم تُحضّر قائمة اللاعبين على هذا الجهاز. افتح العرض عند الاتصال.')}</p>}
          {!missing && !busy && !players.length && search.normalize('NFKC').trim().length !== 1 && <p>{search.trim()?t('No matching players. Try another name.','لا يوجد لاعبون مطابقون. جرّب اسماً آخر.'):t('No players registered yet. Register the first fictional player.','لا يوجد لاعبون مسجلون بعد. سجّل أول لاعب خيالي.')}</p>}
          {!busy && <p className="directory-page-summary">{players.length} {t('players on this page','لاعباً في هذه الصفحة')}{more?t(' · More players available',' · يتوفر مزيد من اللاعبين'):''}</p>}{search.trim() && <Button disabled={busy} onClick={()=>{directoryTicket.current++;setSearch('');setBusy(true);searchInput.current?.focus();}}>{t('Clear search','مسح البحث')}</Button>}<table className="workspace-table"><caption className="visually-hidden">{t('Player directory','قائمة اللاعبين')}</caption><thead><tr><th>{t('Player','اللاعب')}</th><th>{t('Branch','الفرع')}</th></tr></thead><tbody>{(!busy||localRows) && (!localRows||device.active) && players.map(player => <tr key={player.id} className={profileId === player.id && stage === 'profile' ? 'selected' : undefined}><th scope="row"><Button ref={node => { if (node) profileOpeners.current.set(player.id,node); else profileOpeners.current.delete(player.id); }} disabled={busy&&!localRows} onClick={() => selectPlayer(player)}>{player.name}</Button></th><td>{player.branch}</td></tr>)}</tbody></table>
          <Button disabled={busy} onClick={() => void loadDirectory()}>{t('First page', 'الصفحة الأولى')}</Button>{more && <Button disabled={busy} onClick={() => void (localRows?loadDirectory(undefined,localNext.current):loadDirectory(players.at(-1)?.id))}>{t('Next page', 'الصفحة التالية')}</Button>}<small>{t('Up to 25 players per page. Contact details appear only in profiles.', 'حتى 25 لاعباً في الصفحة. بيانات الاتصال في الملفات فقط.')}</small>
        </section>}

      </>}
    </WorkspacePanes></WorkspaceShell>
  </>;
}
