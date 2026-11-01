"use client";
import Link from 'next/link';
import { listenForVisibleResume } from '@/lib/visible-resume';
import { useRouter } from 'next/navigation';
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs';
import { useEffect, useEffectEvent, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import WorkspacePanes from './workspace-panes';
import { Button, Input } from './ui/controls';
type Props = {
    locale: string;
    mode: 'owner' | 'guardian' | 'invitation';
    academy?: string;
    player?: string;
};
type Person = {
    id?: string;
    display_name: string;
    branch_name: string;
};
type Appointment = {
    id: string;
    recipient: string;
    state: string;
    delivery: string;
    version: number;
    expires_at: string;
};
type Result<T = Appointment> = {
    items?: T[];
    more?: boolean;
    player?: Person;
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
async function exchange(body: Command) { const res = await fetch('/api/guardians', { method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: AbortSignal.timeout(15000), body: JSON.stringify(body) }); if (!res.ok)
    throw new Failure('invalid'); }
export default function GuardianWorkspace(props: Props) {
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
        return <PublicWorkspace locale={props.locale} title={props.locale === 'ar' ? 'تسجيل الدخول والصلاحية' : 'Sign-in and access'}><p role="alert">{props.locale === 'ar' ? 'افتح رابط الدعوة الأصلي وحاول مجدداً.' : 'Reopen the original invitation link and try again.'}</p></PublicWorkspace>;
    if (!session.isLoaded || !handoff)
        return <PublicWorkspace locale={props.locale} title={props.locale === 'ar' ? 'تسجيل الدخول والصلاحية' : 'Sign-in and access'}><p role="status">{authExpired ? (props.locale === 'ar' ? 'تعذر تحميل تسجيل الدخول. أعد تحميل الصفحة.' : 'Could not load sign-in. Reload this page.') : (props.locale === 'ar' ? 'جارٍ التحميل…' : 'Loading…')}</p>{authExpired && <Button onClick={() => window.location.reload()}>{props.locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}</Button>}</PublicWorkspace>;
    if (!session.user)
        return <PublicWorkspace locale={props.locale} title={props.locale === 'ar' ? 'تسجيل الدخول والصلاحية' : 'Sign-in and access'}><section className="journey-card"><h1>{props.locale === 'ar' ? 'دعوة ولي الأمر' : 'Your guardian invitation'}</h1><p>{props.locale === 'ar' ? 'وثّق بريدك المقصود ثم راجع الدعوة. تسجيل الحساب وحده لا يمنح صلاحية.' : 'Verify your intended email, then review the invitation. Creating an account alone grants no player access.'}</p><SignInButton forceRedirectUrl={`/${props.locale}/guardian-invitation`}><Button>{props.locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</Button></SignInButton> <SignUpButton forceRedirectUrl={`/${props.locale}/guardian-invitation`}><Button>{props.locale === 'ar' ? 'إنشاء حساب' : 'Create account'}</Button></SignUpButton></section></PublicWorkspace>;
    return <GuardianJourney key={`${session.user.id}:${props.mode}:${props.academy ?? ''}:${props.player ?? ''}`} {...props} subject={session.user.id}/>;
}
function GuardianJourney({ locale: initialLocale, mode, academy, player: playerId, subject }: Props & {
    subject: string;
}) {
    const router = useRouter();
    const [draftOpen, setDraftOpen] = useState(false);
    const [locale, setLocale] = useState(initialLocale), ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
    const [person, setPerson] = useState<Person | null>(null), [appointments, setAppointments] = useState<Appointment[]>([]), [children, setChildren] = useState<Person[]>([]), [more, setMore] = useState(false), [invite, setInvite] = useState<Result | null>(null);
    const [email, setEmail] = useState(''), [confirmed, setConfirmed] = useState(false), [reason, setReason] = useState(''), [inspected, setInspected] = useState<Appointment | null>(null), [selected, setSelected] = useState<Appointment | null>(null), [review, setReview] = useState<Command | null>(null);
    const [busy, setBusy] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [unknown, setUnknown] = useState(false), [blocked, setBlocked] = useState(false);
    const readInFlight = useRef(false);
    const appointmentOpener = useRef<HTMLButtonElement | null>(null);
    const creationOpener = useRef<HTMLButtonElement>(null);
    const active = useRef(true), locked = useRef(false), generation = useRef(0), controllers = useRef(new Set<AbortController>()), operation = useRef<string | null>(null), heading = useRef<HTMLHeadingElement>(null);
    const storageKey = `academyos:guardian:${subject}:${mode}:${academy ?? 'invitation'}`;
    function wipe() { setDraftOpen(false); setPerson(null); setAppointments([]); setChildren([]); setInvite(null); setSelected(null); setInspected(null); setEmail(''); setReason(''); setReview(null); setConfirmed(false); }
    function fail(e: unknown) { if (!active.current)
        return; const code = e instanceof Failure ? e.code : 'unavailable'; setError(code); if (code === 'denied' || code === 'setup_required') {
        wipe();
        setBlocked(true);
    } }
    async function request<T = Appointment>(body: Command): Promise<Result<T>> { const c = new AbortController(); controllers.current.add(c); const timeout = setTimeout(() => c.abort(), 15000); try {
        const res = await fetch('/api/guardians', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, ...(academy ? { academy } : {}) }), cache: 'no-store', signal: c.signal });
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
    async function load(after?: string, inspect?: string, link?: string) {
        const ticket = ++generation.current;
        readInFlight.current = true;
        setBusy(true);
        setError('');
        setNotice('');
        setBlocked(false);
        setPerson(null);
        setInvite(null);
        if (!inspect) setAppointments([]);
        setInspected(null);
        setChildren([]);
        try {
            if (mode === 'owner') {
                const r = await request({ action: 'owner-list', player: playerId, ...(after ? { after } : {}), ...(inspect ? { inspect } : {}) });
                if (ticket !== generation.current)
                    return;
                setPerson(r.player ?? null);
                if (inspect) setInspected(r.items?.[0] ?? null); else setAppointments(r.items ?? []);
                setMore(Boolean(r.more));
            }
            else if (mode === 'guardian') {
                const r = await request<Person>({ action: 'links', ...(after ? { after } : {}), ...(link ? { link } : {}) });
                if (ticket !== generation.current)
                    return;
                setChildren(r.items ?? []);
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
            if (ticket === generation.current) { setAppointments([]); fail(e); }
        }
        finally {
            if (active.current && ticket === generation.current) { readInFlight.current = false; setBusy(false); }
        }
    }
    const refresh = useEffectEvent(() => {
        if (locked.current || unknown || document.visibilityState !== 'visible') return;
        if (email || reason || review || confirmed) {
            setReview(null); setConfirmed(false);
            setNotice('recheck');
            return;
        }
        if (!readInFlight.current) void load();
    });
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
        const stopResume = listenForVisibleResume(() => refresh());
        return () => { live = false; active.current = false; pendingControllers.forEach(c => c.abort()); stopResume(); };
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
            setDraftOpen(false);
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
    function prepare(e: FormEvent) { e.preventDefault(); if (!confirmed || !email.trim() || !person)
        return; setNotice(''); setReview({ action: 'appoint', player: playerId, invitation: crypto.randomUUID(), email: email.trim().toLowerCase(), confirmed: true }); }
    function navigate(e: MouseEvent<HTMLAnchorElement>) {
        if (busy || unknown) { e.preventDefault(); return; }
        const languageTarget = new URL(`/${ar ? 'en' : 'ar'}/${mode === 'invitation' ? 'guardian-invitation' : `workspace/${academy}/${mode === 'guardian' ? 'guardian' : `players/${playerId}/guardians`}`}`, window.location.origin).href;
        if (e.currentTarget.href === languageTarget) {
            e.preventDefault(); setLocale(ar ? 'en' : 'ar'); return;
        }
        if ((email || reason || review) && !window.confirm(t('Discard this unsaved draft?', 'تجاهل المسودة غير المحفوظة؟'))) e.preventDefault();
    }
    const errorText: Record<string, string> = { denied: t('Access unavailable. Check your account and workspace.', 'الصلاحية غير متاحة. تحقق من حسابك ومساحة العمل.'), invalid: t('Check the invitation link and required fields.', 'تحقق من رابط الدعوة والحقول المطلوبة.'), recipient_not_authorized: t('This recipient has not been separately authorized for the synthetic staging test. No invitation was created.', 'لم يُعتمد هذا المستلم بشكل منفصل لاختبار البيئة التجريبية. لم تُنشأ دعوة.'), conflict: t('The appointment changed. Refresh and review its current state before trying again.', 'تغيرت الدعوة. حدّث الحالة وراجعها قبل المحاولة.'), limited: t('Too many requests. Wait and try again.', 'طلبات كثيرة. انتظر وحاول مجدداً.'), unavailable: t('Could not load current access. Retry.', 'تعذر تحميل الصلاحية الحالية. أعد المحاولة.'), unknown: t('The result is not confirmed. Check the original operation before starting another.', 'النتيجة غير مؤكدة. تحقق من العملية الأصلية قبل بدء أخرى.'), setup_required: t('Complete initial academy setup first.', 'أكمل الإعداد الأولي أولاً.') };
    const title = mode === 'owner' ? t('Guardian appointments', 'دعوات أولياء الأمور') : mode === 'invitation' ? t('Your guardian invitation', 'دعوة ولي الأمر') : t('Your linked players', 'اللاعبون المرتبطون بك');
    const scope = t('This linked-player profile shows name and branch. Published sessions and own attendance require separate approval. No sibling, contact, payment or consent access.', 'يعرض ملف اللاعب المرتبط الاسم والفرع. عرض التدريبات المنشورة وحضوره يتطلب موافقة منفصلة. لا صلاحية للأشقاء أو الاتصال أو الدفع أو الموافقات.');
    const state = (s: string) => ({ pending: t('Awaiting recipient acceptance', 'بانتظار قبول المستلم'), accepted: t('Link active', 'الارتباط نشط'), ended: t('Link ended', 'انتهى الارتباط'), revoked: t('Invitation revoked', 'أُلغيت الدعوة'), expired: t('Invitation expired', 'انتهت صلاحية الدعوة') }[s] ?? s);
    const delivery = (s: string) => ({ queued: t('Queued; not sent yet', 'في الطابور؛ لم تُرسل بعد'), sending: t('Delivery pending', 'الإرسال قيد الانتظار'), accepted: t('Provider accepted; inbox unverified', 'قبِل المزود الرسالة؛ الوصول غير مؤكد'), failed: t('Delivery failed; retry the original invitation', 'فشل الإرسال؛ أعد إرسال الدعوة الأصلية'), unknown: t('Delivery unconfirmed; do not create a replacement', 'الإرسال غير مؤكد؛ لا تُنشئ بديلاً'), blocked: t('Delivery blocked; check the authorized staging recipient', 'الإرسال محظور؛ تحقق من المستلم المعتمد') }[s] ?? s);
    const path = mode === 'invitation' ? 'guardian-invitation' : `workspace/${academy}/${mode === 'guardian' ? 'guardian' : `players/${playerId}/guardians`}`;

    function closeInspector() { if (busy || unknown) return; if (review) { setReview(null); return; } if (draftOpen && !review) { setDraftOpen(false); requestAnimationFrame(() => creationOpener.current?.focus()); return; } if (mode !== 'owner' && !review) { router.push(`/${locale}/workspace`); return; } setReview(null); setSelected(null); setInspected(null); requestAnimationFrame(() => appointmentOpener.current?.focus()); }
    const inspector = <>
      {notice && (review || selected || draftOpen || unknown) && <p role="status" className="notice">{notice === 'recheck' ? t('Draft retained. Recheck current state before a new confirmation; current server authority and version are checked on submit.', 'حُفظت المسودة في الذاكرة. أعد التحقق قبل تأكيد جديد؛ تُفحص الصلاحية والإصدار على الخادم عند الإرسال.') : notice === 'cancelled' ? t('The original operation was cancelled before commit. Review before starting again.', 'أُلغيت العملية الأصلية قبل الحفظ. راجع قبل البدء مجدداً.') : error ? t('Operation confirmed; current access could not be refreshed. Retry loading.', 'تأكدت العملية؛ تعذر تحديث الصلاحية الحالية. أعد التحميل.') : t('Operation confirmed. Current saved state is shown below.', 'تأكدت العملية. الحالة المحفوظة الحالية موضحة أدناه.')}</p>}
      {draftOpen && !review && !unknown && !blocked && mode === 'owner' && person && <section className="journey-card"><h2>{person.display_name}</h2><p>{person.branch_name}</p><p>{scope}</p><p className="eyebrow">{t('1. Enter details → 2. Review → 3. Confirm','١. البيانات ← ٢. المراجعة ← ٣. التأكيد')}</p><form onSubmit={prepare}><fieldset disabled={Boolean(review) || busy}><legend className="visually-hidden">{t('Appointment details','بيانات التعيين')}</legend><label>{t('Intended test recipient email', 'بريد مستلم الاختبار المقصود')}<Input required type="email" maxLength={254} value={email} dir="ltr" onChange={e => { setEmail(e.target.value); setConfirmed(false); }}/></label><label className="checkbox-row"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>{t('I explicitly approve this fictional guardian–player link for the synthetic test.', 'أوافق صراحة على ارتباط ولي الأمر بهذا اللاعب الخيالي للاختبار.')}</label><p>{t('Email verification identifies the recipient; it does not establish parenthood. Invitation expires after 72 hours.', 'توثيق البريد يحدد المستلم؛ لا يثبت صلة القرابة. تنتهي الدعوة بعد ٧٢ ساعة.')}</p><Button className="button" type="submit" disabled={!confirmed || !email.trim()}>{t('Review appointment', 'مراجعة الدعوة')}</Button></fieldset></form></section>}
      {inspected && !selected && !review && !unknown && !blocked && <section className="journey-card"><h3>{person?.display_name}</h3><p><bdi dir="ltr">{inspected.recipient}</bdi></p><p>{state(inspected.state)}</p><p>{delivery(inspected.delivery)}</p><p>{scope}</p><p>{new Date(inspected.expires_at).toLocaleString(ar?'ar-EG':'en-GB',{timeZone:'UTC'})} UTC</p></section>}



      {error && (unknown || review || selected || draftOpen) && <p role="alert" className="notice error">{errorText[error] ?? errorText.unavailable}</p>}
      {busy && <p role="status">{t('Loading… awaiting confirmation','جارٍ التحميل… بانتظار التأكيد')}</p>}

 {unknown ? <section className="journey-card"><h2>{t('Check the original operation', 'تحقق من العملية الأصلية')}</h2><Button disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'التحقق من العملية الأصلية')}</Button><p>{t('If the invitation handoff expired, reopen the original email link in this browser and check again.', 'إذا انتهت جلسة الدعوة، افتح رابط البريد الأصلي في هذا المتصفح وتحقق مجدداً.')}</p></section> : null}

      {unknown && <p>{t('Keep the original operation reference. Use Check original operation before any replacement.', 'احتفظ بمرجع العملية الأصلي. تحقق منه قبل أي طلب بديل.')}</p>}
 {selected && !review && !unknown && <section className="journey-card"><h2>{selected.state === 'accepted' ? t('End this link', 'إنهاء هذا الارتباط') : t('Revoke this invitation', 'إلغاء هذه الدعوة')}</h2><p>{person?.display_name} · <bdi>{selected.recipient}</bdi></p><form onSubmit={e => { e.preventDefault(); if (reason.trim())
            setReview({ action: selected.state === 'accepted' ? 'end' : 'revoke', invitation: selected.id, version: selected.version, reason: reason.trim() }); }}><label>{t('Fictional test reason', 'سبب الاختبار الخيالي')}<Input required maxLength={240} value={reason} onChange={e => setReason(e.target.value)}/></label><Button type="submit">{t('Review ending access', 'مراجعة إنهاء الصلاحية')}</Button></form></section>}

 {review && !unknown && !blocked && <section className="journey-card"><h2>{t('Review the exact access', 'مراجعة الصلاحية المحددة')}</h2><p>{person?.display_name ?? invite?.display_name} · {person?.branch_name ?? invite?.branch_name}</p>{review.action === 'appoint' && <p><bdi dir="ltr">{String(review.email)}</bdi></p>}{selected && <p><bdi dir="ltr">{selected.recipient}</bdi></p>}<p>{review.action === 'end' ? t('All access through this player link will end, including any separately approved training and attendance view.', 'ستُنهى كل صلاحية عبر ارتباط هذا اللاعب، بما فيها أي عرض للتدريبات والحضور معتمد بشكل منفصل.') : scope}</p>{['end', 'revoke'].includes(String(review.action)) && <p>{t('The next server request will lose this link’s access. History is preserved.', 'يفقد الطلب التالي للخادم صلاحية هذا الارتباط. يُحفظ السجل.')} {String(review.reason)}</p>}<div className="journey-actions"><Button className="button" disabled={busy} onClick={() => void commit()}>{busy ? t('Awaiting confirmation…', 'بانتظار التأكيد…') : review.action === 'accept' ? t('Accept guardian appointment', 'قبول دعوة ولي الأمر') : review.action === 'appoint' ? t('Confirm appointment', 'تأكيد الدعوة') : t('Confirm this operation', 'تأكيد العملية')}</Button><Button disabled={busy} onClick={() => setReview(null)}>{t('Back to review', 'العودة للمراجعة')}</Button></div></section>}
      {!unknown && !selected && !inspected && !review && !draftOpen && mode === 'owner' && <p>{t('Select an appointment to review its scope or end access. Exact recipient details load only when explicitly inspected.', 'اختر تعييناً لمراجعة نطاقه أو إنهاء الصلاحية. يُحمّل البريد المحدد عند طلب فحصه فقط.')}</p>}
      {mode !== 'owner' && !review && !unknown && <p>{scope}</p>}
    </>;
    return <WorkspaceShell role={mode==='guardian'?'guardian':mode==='owner'?'owner':'workspace'} module={mode==='guardian'?'family':'people'} locale={locale} context={mode === 'guardian' ? t('Guardian workspace', 'مساحة ولي الأمر') : t('Academy workspace', 'مساحة الأكاديمية')} title={title} homeHref={`/${locale}/workspace`} languageHref={`/${ar ? 'en' : 'ar'}/${path}`} onNavigate={navigate} account={<UserButton />} navigation={[...(mode === 'guardian' ? [{href:`/${locale}/workspace/${academy}/guardian/home`,label:t('Home','الرئيسية')},{href:`/${locale}/workspace/${academy}/guardian/calendar`,label:t('Calendar','التقويم')}] : []), { href: `/${locale}/workspace`, label: t('Your workspaces', 'مساحات العمل') }, ...(mode === 'owner' ? [{ href: `/${locale}/workspace/${academy}/players/${playerId}/guardians`, label: title, current: true }, { href: `/${locale}/workspace/${academy}/players`, label: t('Players', 'اللاعبون') }] : [])]}>
 <WorkspacePanes arabic={ar} title={draftOpen && !review ? t('New appointment','دعوة جديدة') : review ? t('Confirm appointment','تأكيد الدعوة') : t('Appointment details','تفاصيل الدعوة')} inspector={inspector} selected={Boolean(unknown || review || selected || inspected || draftOpen)} onBack={closeInspector} selectionKey={review ? 'review' : selected?.id ?? inspected?.id ?? (draftOpen ? 'draft' : '')} blocked={busy || unknown}>
 <header className="task-header"><h1 ref={heading} tabIndex={-1}>{title}</h1>{!unknown && mode === 'owner' && <div className="read-toolbar"><Button disabled={busy} onClick={() => { if (email || reason || review) { setReview(null); setConfirmed(false); setNotice('recheck'); } void load(); }}>{t(error ? 'Retry current read' : 'Refresh view', error ? 'إعادة محاولة قراءة الحالة' : 'تحديث العرض')}</Button></div>}{mode !== 'owner' && !unknown && <div className="read-toolbar"><Button disabled={busy} onClick={() => void load()}>{t(error ? 'Retry current read' : 'Refresh view', error ? 'إعادة محاولة قراءة الحالة' : 'تحديث العرض')}</Button></div>}</header>{mode === 'owner' && person && <p className="scope-line"><strong>{person.display_name}</strong><span>{person.branch_name}</span></p>}{mode !== 'owner' && !unknown && !review && error && <p role="alert" className="journey-error">{errorText[error] ?? errorText.unavailable}</p>} {!busy && !unknown && !blocked && !review && mode === 'invitation' && invite && <section className="journey-card"><h2>{invite.display_name}</h2><p>{invite.branch_name}</p><p>{scope}</p>{invite.state === 'accepted' ? <Link className="button" href={`/${locale}/workspace/${invite.academy_id}/guardian`}>{t('Open linked players', 'فتح اللاعبين المرتبطين')}</Link> : <Button onClick={() => setReview({ action: 'accept' })}>{t('Review acceptance', 'مراجعة القبول')}</Button>}</section>}
 {!busy && !unknown && !blocked && !error && !review && mode === 'guardian' && <section className="journey-card"><p>{scope}</p><Link className="button" href={`/${locale}/workspace/${academy}/guardian/training`}>{t('Training & attendance','التدريبات والحضور')}</Link><Link className="button" href={`/${locale}/workspace/${academy}/guardian/development`}>{t('Published development feedback','ملاحظات التطور المنشورة')}</Link>{children.length === 0 && <p>{t('No active approved player links on this page. Contact your academy Owner if you expected access.', 'لا توجد ارتباطات معتمدة نشطة في هذه الصفحة. تواصل مع مالك الأكاديمية إذا توقعت صلاحية.')}</p>}<ul className="journey-list">{children.map(c => <li key={c.id}><h2>{c.display_name}</h2><p>{c.branch_name}</p><Button onClick={() => void load(undefined, undefined, c.id)}>{t('Refresh this player’s access', 'تحديث صلاحية هذا اللاعب')}</Button></li>)}</ul>{more && <Button onClick={() => void load(children.at(-1)?.id)}>{t('Next page', 'الصفحة التالية')}</Button>}</section>}
<p className="eyebrow">{t('Synthetic staging only. No real family evidence.', 'بيئة اختبار فقط. لا أدلة أسرية حقيقية.')}</p>
 {error && !unknown && !review && !selected && !draftOpen && mode === 'owner' && <p role="alert" className="notice error">{errorText[error] ?? errorText.unavailable}</p>}{notice && !review && !selected && !draftOpen && !unknown && <p role="status" className="notice">{notice === 'recheck' ? t('Draft retained. Recheck current state before a new confirmation; current server authority and version are checked on submit.', 'حُفظت المسودة في الذاكرة. أعد التحقق قبل تأكيد جديد؛ تُفحص الصلاحية والإصدار على الخادم عند الإرسال.') : notice === 'cancelled' ? t('The original operation was cancelled before commit. Review before starting again.', 'أُلغيت العملية الأصلية قبل الحفظ. راجع قبل البدء مجدداً.') : error ? t('Operation confirmed; current access could not be refreshed. Retry loading.', 'تأكدت العملية؛ تعذر تحديث الصلاحية الحالية. أعد التحميل.') : t('Operation confirmed. Current saved state is shown below.', 'تأكدت العملية. الحالة المحفوظة الحالية موضحة أدناه.')}</p>}
 {busy && <p role="status">{t('Loading… awaiting confirmation', 'جارٍ التحميل… بانتظار التأكيد')}</p>}

 {!busy && !unknown && !blocked && mode === 'owner' && person && <>

 <section className="journey-card"><div className="section-heading"><h2>{t('Saved appointments','التعيينات المحفوظة')}</h2><Button ref={creationOpener} className="button" disabled={busy || unknown || Boolean(review)} onClick={event=>{appointmentOpener.current=event.currentTarget;setSelected(null);setInspected(null);setDraftOpen(true);}}>{t('Invite guardian','دعوة ولي أمر')}</Button></div>{appointments.length === 0 && <p>{t('No appointments on this page.', 'لا توجد دعوات في هذه الصفحة.')}</p>}{appointments.length > 0 && <table className="workspace-table"><caption className="visually-hidden">{t('Saved appointments','التعيينات المحفوظة')}</caption><thead><tr><th>{t('Appointment','التعيين')}</th><th>{t('Current state','الحالة الحالية')}</th><th>{t('Actions','الإجراءات')}</th></tr></thead><tbody>{appointments.map(v=><tr key={v.id} className={inspected?.id===v.id||selected?.id===v.id?'selected':undefined}><th scope="row"><Button onClick={event=>{appointmentOpener.current=event.currentTarget;setDraftOpen(false);setInspected(v);setSelected(null);}}><bdi dir="ltr">{v.recipient.replace(/^(.).*@/,'$1***@')}</bdi></Button></th><td><p>{state(v.state)}</p><p>{delivery(v.delivery)}</p><p>{new Date(v.expires_at).toLocaleString(ar?'ar-EG':'en-GB',{timeZone:'UTC'})} UTC</p></td><td><div className="journey-actions"><Button onClick={event=>{appointmentOpener.current=event.currentTarget;setDraftOpen(false);void load(undefined,v.id);}}>{t('Inspect exact recipient', 'فحص المستلم المحدد')}</Button>{['pending', 'accepted'].includes(v.state) && <Button onClick={event => { appointmentOpener.current = event.currentTarget; setDraftOpen(false);setSelected(v); setReason(''); setReview(null); }}>{v.state === 'accepted' ? t('End link', 'إنهاء الارتباط') : t('Revoke invitation', 'إلغاء الدعوة')}</Button>}{v.state === 'pending' && ['queued', 'failed'].includes(v.delivery) && <Button onClick={() => setReview({ action: 'retry', invitation: v.id, version: v.version })}>{t('Review delivery retry', 'مراجعة إعادة الإرسال')}</Button>}</div></td></tr>)}</tbody></table>}{more && <Button onClick={() => void load(appointments.at(-1)?.id)}>{t('Next page', 'الصفحة التالية')}</Button>}</section>

 </>}

 </WorkspacePanes></WorkspaceShell>;
}
