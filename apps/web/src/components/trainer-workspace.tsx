"use client";
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useEffectEvent, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import WorkspaceShell from './workspace-shell';
import { Button, Input } from './ui/controls';
type Props = {
    locale: string;
    mode: 'owner' | 'trainer' | 'invitation';
    academy?: string;
};
type Appointment = {
    id: string;
    recipient: string;
    state: string;
    delivery: string;
    version: number;
    expires_at: string;
    display_name: string;
    branch_name: string;
};
type Result<T = Appointment> = {
    items?: T[];
    more?: boolean;
    branch?: { branch_id: string; branch_name: string };
    role?: string;
    state?: string;
    display_name?: string;
    branch_name?: string;
    academy_id?: string;
    accepted?: boolean;
    cancelled?: boolean;
};
type Command = Record<string, unknown>;
class Failure extends Error {
    constructor(public code: string) { super(code); }
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
async function exchange(body: Command) { const res = await fetch('/api/trainers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(15000), body: JSON.stringify(body) }); if (!res.ok)
    throw new Failure('invalid'); }
export default function TrainerWorkspace(props: Props) {
    const session = useUser(), [handoff, setHandoff] = useState(props.mode !== 'invitation'), [failed, setFailed] = useState(false), [authExpired, setAuthExpired] = useState(false);
    const handoffRequest = useRef<Promise<void> | null>(null);
    useEffect(() => { if (session.isLoaded)
        return; const timer = setTimeout(() => setAuthExpired(true), 15000); return () => clearTimeout(timer); }, [session.isLoaded]);
    useEffect(() => {
        let live = true;
        if (props.mode === 'invitation') {
            if (!handoffRequest.current) {
                const fragment = window.location.hash.slice(1);
                window.history.replaceState(null, '', window.location.pathname);
                const [invitation, token] = fragment.split('.');
                handoffRequest.current = fragment ? exchange({ action: 'exchange', invitation, token }) : Promise.resolve();
            }
            handoffRequest.current.then(() => { if (live)
                setHandoff(true); }).catch(() => { if (live)
                setFailed(true); });
        }
        return () => { live = false; };
    }, [props.mode]);
    if (failed)
        return <main className="auth"><p role="alert">{props.locale === 'ar' ? 'افتح رابط الدعوة الأصلي وحاول مجدداً.' : 'Reopen the original invitation link and try again.'}</p></main>;
    if (!session.isLoaded || !handoff)
        return <main className="auth"><p role="status">{authExpired ? (props.locale === 'ar' ? 'تعذر تحميل تسجيل الدخول. أعد تحميل الصفحة.' : 'Could not load sign-in. Reload this page.') : (props.locale === 'ar' ? 'جارٍ التحميل…' : 'Loading…')}</p>{authExpired && <Button onClick={() => window.location.reload()}>{props.locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Button>}</main>;
    if (!session.user)
        return <main className="auth" lang={props.locale} dir={props.locale === 'ar' ? 'rtl' : 'ltr'}><section className="journey-card"><h1>{props.locale === 'ar' ? 'دعوة المدرب' : 'Your trainer invitation'}</h1><p>{props.locale === 'ar' ? 'وثّق بريدك المقصود ثم راجع الدعوة. تسجيل الحساب وحده لا يمنح صلاحية.' : 'Verify your intended email, then review the invitation. Creating an account alone grants no academy access.'}</p><SignInButton forceRedirectUrl={`/${props.locale}/trainer-invitation`}><Button>{props.locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</Button></SignInButton> <SignUpButton forceRedirectUrl={`/${props.locale}/trainer-invitation`}><Button>{props.locale === 'ar' ? 'إنشاء حساب' : 'Create account'}</Button></SignUpButton></section></main>;
    return <TrainerJourney key={`${session.user.id}:${props.mode}:${props.academy ?? ''}`} {...props} subject={session.user.id}/>;
}
function TrainerJourney({ locale: initialLocale, mode, academy, subject }: Props & {
    subject: string;
}) {
    const [locale, setLocale] = useState(initialLocale), ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
    const [branch, setBranch] = useState<{ branch_id: string; branch_name: string } | null>(null), [name, setName] = useState(''), [appointments, setAppointments] = useState<Appointment[]>([]), [profile, setProfile] = useState<Result | null>(null), [more, setMore] = useState(false), [invite, setInvite] = useState<Result | null>(null);
    const [email, setEmail] = useState(''), [confirmed, setConfirmed] = useState(false), [reason, setReason] = useState(''), [selected, setSelected] = useState<Appointment | null>(null), [review, setReview] = useState<Command | null>(null);
    const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [unknown, setUnknown] = useState(false), [blocked, setBlocked] = useState(false);
    const active = useRef(true), locked = useRef(false), generation = useRef(0), controllers = useRef(new Set<AbortController>()), operation = useRef<string | null>(null), heading = useRef<HTMLHeadingElement>(null);
    const storageKey = `academyos:trainer:${subject}:${mode}:${academy ?? 'invitation'}`;
    function wipe() { setBranch(null); setAppointments([]); setProfile(null); setInvite(null); setSelected(null); setEmail(''); setName(''); setReason(''); setReview(null); setConfirmed(false); }
    function fail(e: unknown) { if (!active.current)
        return; const code = e instanceof Failure ? e.code : 'unavailable'; setError(code); if (code === 'denied' || code === 'setup_required') {
        wipe();
        setBlocked(true);
    } }
    async function request<T = Appointment>(body: Command): Promise<Result<T>> { const c = new AbortController(); controllers.current.add(c); const timeout = setTimeout(() => c.abort(), 15000); try {
        const res = await fetch('/api/trainers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, ...(academy ? { academy } : {}) }), cache: 'no-store', signal: c.signal });
        const json = await res.json();
        if (!active.current || c.signal.aborted)
            throw new Failure('stale');
        if (!res.ok)
            throw new Failure(json.error ?? 'unavailable');
        return json.data;
    }
    finally {
        clearTimeout(timeout);
        controllers.current.delete(c);
    } }
    function forget() { operation.current = null; try {
        sessionStorage.removeItem(storageKey);
    }
    catch { } }
    async function load(after?: string, inspect?: string) {
        const ticket = ++generation.current;
        setBusy(true);
        setError('');
        setNotice('');
        setBlocked(false);
        setBranch(null);
        setInvite(null);
        setAppointments([]);
        setProfile(null);
        try {
            if (mode === 'owner') {
                const r = await request({ action: 'owner-list', ...(after ? { after } : {}), ...(inspect ? { inspect } : {}) });
                if (ticket !== generation.current)
                    return;
                setBranch(r.branch ?? null);
                setAppointments(r.items ?? []);
                setMore(Boolean(r.more));
            }
            else if (mode === 'trainer') {
                const r = await request({ action: 'profile' });
                if (ticket !== generation.current)
                    return;
                setProfile(r);
                setMore(Boolean(r.more));
            }
            else {
                const r = await request({ action: 'review' });
                if (ticket !== generation.current)
                    return;
                setInvite(r);
            }
        }
        catch (e) {
            if (ticket === generation.current)
                fail(e);
        }
        finally {
            if (active.current && ticket === generation.current)
                setBusy(false);
        }
    }
    const refresh = useEffectEvent(() => { if (!locked.current && !unknown) {
        setReview(null);
        setSelected(null);
        setConfirmed(false);
        void load();
    } });
    useEffect(() => {
        active.current = true;
        const pendingControllers = controllers.current;
        let live = true;
        void Promise.resolve().then(() => { if (!live)
            return; try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved && uuid.test(saved)) {
                operation.current = saved;
                setUnknown(true);
            }
        }
        catch { } void load(); });
        const focus = () => refresh();
        window.addEventListener('focus', focus);
        const visible = () => { if (document.visibilityState === 'visible')
            refresh(); };
        document.addEventListener('visibilitychange', visible);
        return () => { live = false; active.current = false; pendingControllers.forEach(c => c.abort()); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', visible); };
        // Keyed identity/context owns every private request and draft.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => { if (review || unknown)
        heading.current?.focus(); }, [review, unknown]);
    async function commit() {
        if (locked.current || !review || operation.current)
            return;
        locked.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        const op = crypto.randomUUID();
        operation.current = op;
        try {
            sessionStorage.setItem(storageKey, op);
        }
        catch { }
        try {
            await request({ ...review, op });
            if (!active.current)
                return;
            forget();
            setReview(null);
            setSelected(null);
            setEmail('');
            setName('');
            setReason('');
            setConfirmed(false);
            await load();
            setNotice('saved');
        }
        catch (e) {
            if (!active.current)
                return;
            const code = e instanceof Failure ? e.code : 'unavailable';
            if (['invalid', 'denied', 'recipient_not_authorized', 'setup_required', 'conflict', 'limited'].includes(code)) {
                forget();
                setReview(null);
                fail(e);
            }
            else {
                setUnknown(true);
                setReview(null);
                wipe();
                setError('unknown');
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
        const r = await request({ action: mode === 'invitation' ? 'reconcile-accept' : 'operation', op: operation.current });
        if (!active.current)
            return;
        forget();
        setUnknown(false);
        await load();
        setNotice(r.cancelled ? 'cancelled' : 'recovered');
    }
    catch (e) {
        fail(e);
    }
    finally {
        locked.current = false;
        if (active.current)
            setBusy(false);
    } }
    function prepare(e: FormEvent) { e.preventDefault(); if (!confirmed || !email.trim() || !name.trim() || !branch)
        return; setNotice(''); setReview({ action: 'appoint', branch: branch.branch_id, name: name.trim(), invitation: crypto.randomUUID(), email: email.trim().toLowerCase(), confirmed: true }); }
    function navigate(e: MouseEvent<HTMLAnchorElement>) {
        if (busy || unknown) { e.preventDefault(); return; }
        const languageTarget = new URL(`/${ar ? 'en' : 'ar'}/${mode === 'invitation' ? 'trainer-invitation' : `workspace/${academy}/${mode === 'trainer' ? 'trainer' : 'staff'}`}`, window.location.origin).href;
        if (e.currentTarget.href === languageTarget) {
            e.preventDefault(); setLocale(ar ? 'en' : 'ar'); return;
        }
        if ((name || email || reason || review) && !window.confirm(t('Discard this unsaved draft?', 'تجاهل المسودة غير المحفوظة؟'))) e.preventDefault();
    }
    const errorText: Record<string, string> = { denied: t('Access unavailable. Check your account and workspace.', 'الصلاحية غير متاحة. تحقق من حسابك ومساحة العمل.'), invalid: t('Check the invitation link and required fields.', 'تحقق من رابط الدعوة والحقول المطلوبة.'), recipient_not_authorized: t('This recipient has not been separately authorized for the synthetic staging test. No invitation was created.', 'لم يُعتمد هذا المستلم بشكل منفصل لاختبار البيئة التجريبية. لم تُنشأ دعوة.'), conflict: t('The appointment changed. Refresh and review its current state before trying again.', 'تغيرت الدعوة. حدّث الحالة وراجعها قبل المحاولة.'), limited: t('Too many requests. Wait and try again.', 'طلبات كثيرة. انتظر وحاول مجدداً.'), unavailable: t('Could not load current access. Retry.', 'تعذر تحميل الصلاحية الحالية. أعد المحاولة.'), unknown: t('The result is not confirmed. Check the original operation before starting another.', 'النتيجة غير مؤكدة. تحقق من العملية الأصلية قبل بدء أخرى.'), setup_required: t('Complete initial academy setup first.', 'أكمل الإعداد الأولي أولاً.') };
    const title = mode === 'owner' ? t('Trainer appointments', 'تعيينات المدربين') : mode === 'invitation' ? t('Your trainer invitation', 'دعوة المدرب') : t('Your staff profile', 'ملفك الوظيفي');
    const scope = t('Trainer access: your own fictional staff name, Trainer role and assigned branch only. No player records, other staff, salary or Owner controls.', 'صلاحية المدرب: اسمك الوظيفي الخيالي ودور المدرب وفرعك المحدد فقط. لا سجلات لاعبين أو موظفين آخرين أو راتب أو أدوات المالك.');
    const state = (s: string) => ({ pending: t('Awaiting recipient acceptance', 'بانتظار قبول المستلم'), accepted: t('Trainer appointment accepted; current access is checked on each request', 'قُبل تعيين المدرب؛ تُفحص الصلاحية الحالية مع كل طلب'), ended: t('Trainer appointment ended', 'انتهى تعيين المدرب'), revoked: t('Invitation revoked', 'أُلغيت الدعوة'), expired: t('Invitation expired', 'انتهت صلاحية الدعوة') }[s] ?? s);
    const delivery = (s: string) => ({ queued: t('Queued; not sent yet', 'في الطابور؛ لم تُرسل بعد'), sending: t('Delivery pending', 'الإرسال قيد الانتظار'), accepted: t('Provider accepted; inbox unverified', 'قبِل المزود الرسالة؛ الوصول غير مؤكد'), failed: t('Delivery failed; retry the original invitation', 'فشل الإرسال؛ أعد إرسال الدعوة الأصلية'), unknown: t('Delivery unconfirmed; do not create a replacement', 'الإرسال غير مؤكد؛ لا تُنشئ بديلاً'), blocked: t('Delivery blocked; check the authorized staging recipient', 'الإرسال محظور؛ تحقق من المستلم المعتمد') }[s] ?? s);
    const path = mode === 'invitation' ? 'trainer-invitation' : `workspace/${academy}/${mode === 'trainer' ? 'trainer' : 'staff'}`;
    return <WorkspaceShell locale={locale} context={mode === 'trainer' ? t('Trainer workspace', 'مساحة المدرب') : t('Academy workspace', 'مساحة الأكاديمية')} title={title} homeHref={`/${locale}/workspace`} languageHref={`/${ar ? 'en' : 'ar'}/${path}`} onNavigate={navigate} account={<UserButton />} navigation={[{ href: `/${locale}/workspace`, label: t('Your workspaces', 'مساحات العمل') }, ...(mode === 'owner' ? [{ href: `/${locale}/workspace/${academy}`, label: t('Initial setup', 'الإعداد الأولي') }] : [])]}>
 <h1 ref={heading} tabIndex={-1}>{title}</h1><p className="notice">{t('Synthetic staging only. No real staff data.', 'بيئة اختبار فقط. لا بيانات موظفين حقيقية.')}</p>
 {error && <p role="alert" className="notice error">{errorText[error] ?? errorText.unavailable}</p>}{notice && <p role="status" className="notice">{notice === 'cancelled' ? t('The original operation was cancelled before commit. Review before starting again.', 'أُلغيت العملية الأصلية قبل الحفظ. راجع قبل البدء مجدداً.') : error ? t('Operation confirmed; current access could not be refreshed. Retry loading.', 'تأكدت العملية؛ تعذر تحديث الصلاحية الحالية. أعد التحميل.') : t('Operation confirmed. Current saved state is shown below.', 'تأكدت العملية. الحالة المحفوظة الحالية موضحة أدناه.')}</p>}
 {busy && <p role="status">{t('Loading… awaiting confirmation', 'جارٍ التحميل… بانتظار التأكيد')}</p>}
 {unknown ? <section className="journey-card"><h2>{t('Check the original operation', 'تحقق من العملية الأصلية')}</h2><Button disabled={busy} onClick={() => void reconcile()}>{t('Reconcile original operation', 'التحقق من العملية الأصلية')}</Button><p>{t('If the invitation handoff expired, reopen the original email link in this browser and check again.', 'إذا انتهت جلسة الدعوة، افتح رابط البريد الأصلي في هذا المتصفح وتحقق مجدداً.')}</p></section> : <Button disabled={busy} onClick={() => { setReview(null); setSelected(null); setConfirmed(false); void load(); }}>{t('Refresh saved state', 'تحديث الحالة المحفوظة')}</Button>}
 {!busy && !unknown && !blocked && !review && mode === 'owner' && branch && <>
 <section className="journey-card"><h2>{t('Invite a fictional trainer','دعوة مدرب خيالي')}</h2><p>{t('Trainer','مدرب')} · {branch.branch_name}</p><p>{scope}</p><form onSubmit={prepare}>
 <label>{t('Fictional staff name','اسم الموظف الخيالي')}<Input required maxLength={160} value={name} onChange={e=>{setName(e.target.value);setConfirmed(false);}}/></label>
 <label>{t('Intended test recipient email','بريد مستلم الاختبار المقصود')}<Input required type="email" maxLength={254} value={email} dir="ltr" onChange={e=>{setEmail(e.target.value);setConfirmed(false);}}/></label>
 <label className="checkbox-row"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>{t('I explicitly approve this fictional Trainer appointment in this branch.','أوافق صراحة على تعيين هذا المدرب الخيالي في هذا الفرع.')}</label><p>{t('Invitation expires after 72 hours. Access begins only after verified-recipient acceptance.','تنتهي الدعوة بعد ٧٢ ساعة. تبدأ الصلاحية بعد قبول المستلم الموثق فقط.')}</p><Button type="submit" disabled={!confirmed||!name.trim()||!email.trim()}>{t('Review appointment','مراجعة التعيين')}</Button></form></section>
 <section className="journey-card"><h2>{t('Saved appointments','التعيينات المحفوظة')}</h2>{!error && appointments.length===0 && <p>{t('No appointments on this page.','لا توجد تعيينات في هذه الصفحة.')}</p>}<ul className="journey-list">{appointments.map(v=><li key={v.id}><h3>{v.display_name}</h3><p>{t('Trainer','مدرب')} · {v.branch_name}</p><bdi dir="ltr">{v.recipient}</bdi><p>{state(v.state)} · {delivery(v.delivery)}</p><p>{t('Expires: ','تنتهي: ')}{new Date(v.expires_at).toLocaleString(ar?'ar-EG':'en-GB')}</p><div className="journey-actions"><Button onClick={()=>void load(undefined,v.id)}>{t('Inspect exact recipient','فحص المستلم المحدد')}</Button>{['pending','accepted'].includes(v.state)&&<Button onClick={()=>{setSelected(v);setReason('');setReview(null);}}>{v.state==='accepted'?t('End appointment','إنهاء التعيين'):t('Revoke invitation','إلغاء الدعوة')}</Button>}{v.state==='pending'&&['queued','failed'].includes(v.delivery)&&<Button onClick={()=>setReview({action:'retry',invitation:v.id,version:v.version})}>{t('Review delivery retry','مراجعة إعادة الإرسال')}</Button>}</div></li>)}</ul>{more&&<Button onClick={()=>void load(appointments.at(-1)?.id)}>{t('Next page','الصفحة التالية')}</Button>}</section>
 {selected&&<section className="journey-card"><h2>{selected.state==='accepted'?t('End this Trainer appointment','إنهاء تعيين هذا المدرب'):t('Revoke this invitation','إلغاء هذه الدعوة')}</h2><p>{selected.display_name} · {selected.branch_name} · <bdi>{selected.recipient}</bdi></p><p>{t('Only this Trainer role and branch appointment end. Other roles and history are preserved.','ينتهي دور المدرب وتعيين الفرع هذا فقط. تُحفظ الأدوار الأخرى والسجلات.')}</p><form onSubmit={e=>{e.preventDefault();if(reason.trim())setReview({action:selected.state==='accepted'?'end':'revoke',invitation:selected.id,version:selected.version,reason:reason.trim()});}}><label>{t('Fictional test reason','سبب الاختبار الخيالي')}<Input required maxLength={240} value={reason} onChange={e=>setReason(e.target.value)}/></label><Button type="submit">{t('Review ending access','مراجعة إنهاء الصلاحية')}</Button></form></section>}
 </>}
 {!busy&&!unknown&&!blocked&&!review&&mode==='invitation'&&invite&&<section className="journey-card"><h2>{invite.display_name}</h2><p>{t('Trainer','مدرب')} · {invite.branch_name}</p><p>{scope}</p>{invite.state==='accepted'?<Link className="button" href={`/${locale}/workspace/${invite.academy_id}/trainer`}>{t('Open staff profile','فتح الملف الوظيفي')}</Link>:<Button onClick={()=>setReview({action:'accept'})}>{t('Review acceptance','مراجعة القبول')}</Button>}</section>}
 {!busy&&!unknown&&!blocked&&!error&&!review&&mode==='trainer'&&profile&&<section className="journey-card"><h2>{profile.display_name}</h2><p>{t('Trainer','مدرب')} · {profile.branch_name}</p><p>{scope}</p><p>{t('No dated sessions are available in this slice. Programs, assigned rosters and attendance follow in later stages.','لا تتاح حصص مؤرخة في هذه المرحلة. تأتي البرامج والقوائم المخصصة والحضور في مراحل لاحقة.')}</p></section>}
 {review && !unknown && !blocked && <section className="journey-card"><h2>{t('Review the exact access', 'مراجعة الصلاحية المحددة')}</h2><p>{review.action==='appoint'?String(review.name):selected?.display_name ?? invite?.display_name} · {branch?.branch_name ?? selected?.branch_name ?? invite?.branch_name}</p>{review.action === 'appoint' && <p><bdi dir="ltr">{String(review.email)}</bdi></p>}{selected && <p><bdi dir="ltr">{selected.recipient}</bdi></p>}<p>{scope}</p>{['end', 'revoke'].includes(String(review.action)) && <p>{t('The next server request will lose this Trainer appointment’s access. Other roles and history are preserved.', 'يفقد الطلب التالي للخادم صلاحية تعيين المدرب هذا. تُحفظ الأدوار الأخرى والسجل.')} {String(review.reason)}</p>}<div className="journey-actions"><Button disabled={busy} onClick={() => void commit()}>{busy ? t('Awaiting confirmation…', 'بانتظار التأكيد…') : review.action === 'accept' ? t('Accept Trainer appointment', 'قبول تعيين المدرب') : review.action === 'appoint' ? t('Confirm appointment', 'تأكيد الدعوة') : t('Confirm this operation', 'تأكيد العملية')}</Button><Button disabled={busy} onClick={() => setReview(null)}>{t('Back to review', 'العودة للمراجعة')}</Button></div></section>}
 </WorkspaceShell>;
}
