"use client";
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import WorkspacePanes from './workspace-panes';
import { Button, Select } from './ui/controls';
import QrCamera from './qr-camera';
import QrPrintCard from './qr-print-card';
import { newQrCode, qrCodePattern, isQrReceipt, type QrPending, type QrContext, type QrCard, type QrMatch, type QrReceipt, type QrSession, type QrSessions } from '@/lib/qr-attendance';
type Props = {
    locale: string;
    academy: string;
    view: 'scan' | 'settings' | 'card';
    player?: string;
    event?: string;
    day?: string;
};
class Failure extends Error {
    constructor(public code: string) { super(code); }
}
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function localDay(now: string, timezone: string) { const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now)); return ['year', 'month', 'day'].map(t => parts.find(p => p.type === t)!.value).join('-'); }
function recovery(raw: string): QrPending | null {
    try {
        const p = JSON.parse(raw);
        if (!p || typeof p.op !== 'string' || !uuid.test(p.op) || !['scan', 'settings', 'card'].includes(p.kind) || !(p.target === null || typeof p.target === 'string' && uuid.test(p.target)))
            return null;
        if (p.kind === 'settings' && p.context === 'settings' || p.kind === 'card' && p.context === `card:${p.target}` || p.kind === 'scan' && typeof p.context === 'string' && /^scan:/.test(p.context) && uuid.test(p.context.slice(5)))
            return p;
        return null;
    }
    catch {
        return null;
    }
}
export default function QrWorkspace(props: Props) {
    const user = useUser(), [expired, setExpired] = useState(false);
    useEffect(() => {
        if (user.isLoaded)
            return;
        const timer = setTimeout(() => setExpired(true), 15000);
        return () => clearTimeout(timer);
    }, [user.isLoaded]);
    if (!user.isLoaded)
        return <PublicWorkspace locale={props.locale} title="AcademyOS"><p role="status">{props.locale === 'ar' ? (expired ? 'الدخول غير متاح. أعد تحميل الصفحة.' : 'تحميل الدخول…') : (expired ? 'Sign-in unavailable. Reload this page.' : 'Loading sign-in…')}</p></PublicWorkspace>;
    if (!user.user)
        return <PublicWorkspace locale={props.locale} title="AcademyOS"><a href={`/${props.locale}/sign-in`}>{props.locale === 'ar' ? 'تسجيل الدخول' : 'Sign in'}</a></PublicWorkspace>;
    return <Journey key={`${user.user.id}:${props.academy}:${props.view}:${props.player}:${props.event}`} {...props} subject={user.user.id}/>;
}
function Journey({ locale: initial, academy, view, player, event, day: initialDay, subject }: Props & {
    subject: string;
}) {
    const router = useRouter(), [locale, setLocale] = useState(initial), ar = locale === 'ar', t = (e: string, a: string) => ar ? a : e;
    const [ctx, setCtx] = useState<QrContext | null>(null), [sessions, setSessions] = useState<QrSessions | null>(null), [card, setCard] = useState<QrCard | null>(null), [day, setDay] = useState(initialDay ?? ''), [selected, setSelected] = useState<string[]>([]), [mode, setMode] = useState('auto'), [cursor, setCursor] = useState<{
        after_at: string;
        after_id: string;
    } | null>(null), [pages, setPages] = useState<({
        after_at: string;
        after_id: string;
    } | null)[]>([]);
    const [opened, setOpened] = useState(false), [running, setRunning] = useState(false), [typed, setTyped] = useState(''), [matches, setMatches] = useState<QrMatch[]>([]), [last, setLast] = useState<QrReceipt | null>(null), [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false), [denied, setDenied] = useState(false), [readFailed, setReadFailed] = useState(false), [pending, setPending] = useState<QrPending | null>(null);
    const [target, setTarget] = useState('academy'), [before, setBefore] = useState(30), [after, setAfter] = useState(30), [review, setReview] = useState(false), [ack, setAck] = useState(false), [cardChoice, setCardChoice] = useState(''), [issued, setIssued] = useState<{
        card: string;
        code: string;
    } | null>(null), [fresh, setFresh] = useState(false);
    const alive = useRef(false), lock = useRef(false), controllers = useRef(new Set<AbortController>()), code = useRef(''), cardCode = useRef(''), storeKey = `qr:v1:${subject}:${academy}`, uncertain = !!pending, opener = useRef<HTMLButtonElement>(null);
    const activeSession = sessions?.items.find(s => s.id === target), currentBefore = target === 'academy' ? ctx?.settings.before : activeSession?.window.before, currentAfter = target === 'academy' ? ctx?.settings.after : activeSession?.window.after, dirty = view === 'settings' && !!ctx?.owner && !denied && (before !== currentBefore || after !== currentAfter), scope = mode === 'auto' ? selected : [mode];
    useEffect(() => { alive.current = true; const list = controllers.current; return () => { alive.current = false; list.forEach(c => c.abort()); code.current = ''; cardCode.current = ''; }; }, []);
    async function call<T>(data: Record<string, unknown>): Promise<T> {
        const c = new AbortController();
        controllers.current.add(c);
        try {
            const r = await fetch('/api/qr', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ academy, ...data }), cache: 'no-store', signal: AbortSignal.any([c.signal, AbortSignal.timeout(15000)]) });
            const v = await r.json();
            if (!alive.current)
                throw new Failure('aborted');
            if (!r.ok || v.error || v.data?.error)
                throw new Failure(v.error ?? v.data?.error ?? 'unavailable');
            return v.data as T;
        }
        finally {
            controllers.current.delete(c);
        }
    }
    function fail(e: unknown) {
        const value = e instanceof Failure ? e.code : 'unavailable';
        setError(value);
        setRunning(false);
        setAck(false);
        if (value === 'denied') {
            setDenied(true);
            setCtx(null);
            setSessions(null);
            setCard(null);
            setMatches([]);
            setLast(null);
            setIssued(null);
            setReview(false);
            setCardChoice('');
            setTyped('');
            code.current = '';
            cardCode.current = '';
        }
    }
    async function run(fn: () => Promise<void>) {
        if (lock.current)
            return;
        lock.current = true;
        setBusy(true);
        setError('');
        try {
            await fn();
        }
        catch (e) {
            if (alive.current)
                fail(e);
        }
        finally {
            lock.current = false;
            if (alive.current)
                setBusy(false);
        }
    }
    function clearScan() { setRunning(false); setMatches([]); setLast(null); setNotice(''); setError(''); setTyped(''); code.current = ''; setOpened(false); setFresh(false); }
    async function readSessions(c: QrContext, d: string, next = cursor, preserve = false) {
        if (!preserve) {
            setReadFailed(true);
            setSessions(null);
        }
        const list = await call<QrSessions>({ action: 'sessions', branch: c.branch, day: d, ...next });
        if (!list || !Array.isArray(list.items) || list.items.length > 25)
            throw new Failure('unavailable');
        setSessions(list);
        if (!preserve) {
            setSelected(list.items.filter(s => !event || s.id === event).map(s => s.id));
            setMode(event && list.items.some(s => s.id === event) ? event : 'auto');
        }
        setReadFailed(false);
        return list;
    }
    async function readCard() {
        if (!player)
            throw new Failure('invalid');
        setReadFailed(true);
        setCard(null);
        const result = await call<QrCard>({ action: 'card', player });
        if (result.player !== player || !Number.isSafeInteger(result.version))
            throw new Failure('unavailable');
        setCard(result);
        setReadFailed(false);
        return result;
    }
    async function reload() {
        clearScan();
        setReadFailed(true);
        const c = await call<QrContext>({ action: 'context' });
        setCtx(c);
        setDenied(false);
        if (view !== 'scan' && !c.owner)
            throw new Failure('denied');
        if (view === 'card') {
            await readCard();
            return;
        }
        const d = day || localDay(c.server_now, c.timezone);
        setDay(d);
        await readSessions(c, d);
        if (view === 'settings' && (ctx === null || !dirty && !review)) {
            setBefore(c.settings.before);
            setAfter(c.settings.after);
            setTarget('academy');
        }
    }
    useEffect(() => {
        let live = true;
        queueMicrotask(() => {
            if (!live)
                return;
            void run(async () => {
                let found: QrPending | null = null;
                try {
                    const raw = sessionStorage.getItem(storeKey);
                    if (raw)
                        found = recovery(raw);
                }
                catch { /* Writes require durable opaque recovery reference. */ }
                if (found) {
                    setPending(found);
                    setOpened(true);
                    return;
                }
                await reload();
            });
        });
        return () => { live = false; };
        // Subject/academy/view remount aborts obsolete private responses.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        const refresh = () => {
            setRunning(false);
            if (!lock.current && !dirty && !review && !uncertain)
                void run(reload);
        };
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        const hidden = () => {
            if (document.hidden)
                setRunning(false);
        };
        document.addEventListener('visibilitychange', hidden);
        return () => { window.removeEventListener('focus', refresh); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', hidden); };
    });
    useEffect(() => {
        if (!uncertain && !dirty && !review)
            return;
        const guard = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [uncertain, dirty, review]);
    function abandon() { return !dirty && !review || window.confirm(t('Discard these unsaved changes?', 'تجاهل هذه التغييرات غير المحفوظة؟')); }
    function navigate(e: MouseEvent<HTMLAnchorElement>) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        if (href === '#language') {
            setLocale(ar ? 'en' : 'ar');
            return;
        }
        if (!denied && (busy || uncertain || !abandon()))
            return;
        setRunning(false);
        if (href)
            router.push(href);
    }
    function forget() {
        try {
            sessionStorage.removeItem(storeKey);
        }
        catch { /* Current confirmed receipt remains authoritative. */ }
        setPending(null);
    }
    async function result(r: QrReceipt, p: QrPending) {
        // Recovery belongs to the original operation even after opening another view.
        if (r.kind === 'card' && (view !== 'card' || player !== p.target) || r.kind === 'settings' && view !== 'settings' || r.kind === 'scan' && view !== 'scan') {
            const base = `/${locale}/workspace/${academy}`;
            router.push(r.kind === 'card' ? `${base}/players/${p.target}/card` : `${base}/attendance/${r.kind === 'settings' ? 'settings' : 'scan'}`);
            return;
        }
        setLast(r);
        setNotice(r.kind === 'scan' ? (r.already ? 'already' : 'saved') : 'saved');
        setReview(false);
        setCardChoice('');
        setAck(false);
        setMatches([]);
        code.current = '';
        if (r.kind === 'card') {
            if (r.active && r.card === p.op && cardCode.current)
                setIssued({ card: r.card, code: cardCode.current });
            else
                setIssued(current => r.active && current?.card === r.card ? current : null);
            await readCard();
            cardCode.current = '';
        }
        else {
            const c = await call<QrContext>({ action: 'context' });
            setCtx(c);
            if (view === 'settings') {
                setBefore(r.kind === 'settings' ? r.before : c.settings.before);
                setAfter(r.kind === 'settings' ? r.after : c.settings.after);
            }
            if (view === 'scan')
                setFresh(true);
            await readSessions(c, day || localDay(c.server_now, c.timezone), cursor, true);
        }
        setReadFailed(false);
    }
    async function commit(data: Record<string, unknown>, p: QrPending) {
        try {
            sessionStorage.setItem(storeKey, JSON.stringify(p));
        }
        catch {
            throw new Failure('storage_unavailable');
        }
        setPending(p);
        setNotice('');
        setMatches([]);
        try {
            const receipt = await call({ ...data, op: p.op });
            if (!isQrReceipt(receipt, p))
                throw new Failure('unavailable');
            forget();
            try {
                await result(receipt, p);
            }
            catch (e) {
                setReadFailed(true);
                fail(e);
            }
        }
        catch (e) {
            const c = e instanceof Failure ? e.code : 'unavailable';
            if (['denied', 'invalid', 'limited', 'conflict', 'stale', 'ambiguous', 'card_unavailable', 'no_match', 'correction_required', 'narrow_scope'].includes(c)) {
                forget();
                setReview(false);
                setMatches([]);
                fail(e);
                if (c !== 'denied') {
                    setLast(null);
                    code.current = '';
                }
            }
            else {
                fail(e);
            }
        }
    }
    async function reconcile() {
        if (!pending)
            return;
        await run(async () => {
            const p = pending, r = await call<Record<string, unknown>>({ action: 'reconcile', context: p.context, op: p.op });
            if (r.cancelled === true) {
                forget();
                cardCode.current = '';
                code.current = '';
                setReview(false);
                await reload();
                setNotice('not_committed');
            }
            else if (isQrReceipt(r, p)) {
                forget();
                await result(r, p);
            }
            else
                throw new Failure('unavailable');
        });
    }
    async function capture(chosen: string | null) {
        if (!ctx || !code.current)
            return;
        const token = code.current, p: QrPending = { op: crypto.randomUUID(), kind: 'scan', context: `scan:${ctx.branch}`, target: chosen };
        await commit({ action: 'capture', branch: ctx.branch, events: scope, code: token, chosen }, p);
    }
    async function scan(raw: string) {
        if (lock.current || uncertain || denied || readFailed || !ctx || !scope.length || matches.length)
            return;
        setOpened(true);
        setLast(null);
        setNotice('');
        if (!qrCodePattern.test(raw)) {
            setError('card_unavailable');
            setRunning(false);
            return;
        }
        await run(async () => {
            code.current = raw;
            setTyped('');
            const found = await call<{
                items: QrMatch[];
            }>({ action: 'resolve', branch: ctx.branch, events: scope, code: raw });
            if (!Array.isArray(found.items) || !found.items.length || found.items.length > 25)
                throw new Failure('unavailable');
            if (found.items.length > 1) {
                setMatches(found.items);
                return;
            }
            await capture(null);
        });
    }
    async function saveCard() {
        if (!card || !ack || !cardChoice)
            return;
        await run(async () => { cardCode.current = cardChoice === 'revoke' ? '' : newQrCode(); const p: QrPending = { op: crypto.randomUUID(), kind: 'card', context: `card:${card.player}`, target: card.player }; await commit({ action: 'card_change', player: card.player, choice: cardChoice, version: card.version, code: cardCode.current || null }, p); });
    }
    async function saveSettings() {
        if (!ctx || !ack)
            return;
        await run(async () => { const ev = target === 'academy' ? null : target, p: QrPending = { op: crypto.randomUUID(), kind: 'settings', context: 'settings', target: ev }; await commit({ action: 'window_change', event: ev, version: ctx.settings.version, before, after }, p); });
    }
    const labels: Record<string, string> = { denied: t('Access unavailable. Private details cleared.', 'الوصول غير متاح. أُزيلت التفاصيل الخاصة.'), invalid: t('Invalid input. Check the code and selection.', 'مدخل غير صالح. تحقق من الرمز والاختيار.'), limited: t('Capture paused: request limit reached. Wait, then retry. Nothing was saved by this rejected request.', 'توقف التسجيل: بلغ حد الطلبات. انتظر وأعد المحاولة. الطلب المرفوض لم يحفظ شيئاً.'), unavailable: t('Current operation or data unavailable. Check its original outcome before a replacement.', 'العملية أو البيانات غير متاحة. تحقق من النتيجة الأصلية قبل الاستبدال.'), narrow_scope: t('Too many matching details. Select fewer sessions and scan again.', 'تفاصيل المطابقة كثيرة. اختر جلسات أقل وامسح مجدداً.'),
        card_unavailable: t('Card is not usable in this workspace. Check or replace it through the Owner.', 'البطاقة غير قابلة للاستخدام هنا. تحقق منها أو اطلب من المالك استبدالها.'), no_match: t('No eligible rostered session matches this card now. Check selected sessions and scan windows.', 'لا جلسة مؤهلة تضم هذه البطاقة الآن. تحقق من اختيار الجلسات والنوافذ.'), ambiguous: t('Session eligibility changed. Read the card again and choose from current matches.', 'تغير تأهل الجلسات. اقرأ البطاقة مجدداً واختر من المطابقات الحالية.'), stale: t('Saved state changed. Reload and review the current values.', 'تغيرت الحالة المحفوظة. أعد التحميل وراجع القيم الحالية.'), conflict: t('Operation conflicts with a previous result. Check current saved state.', 'تعارضت العملية مع نتيجة سابقة. تحقق من الحالة المحفوظة.'), correction_required: t('Attendance is saved Absent. Scanning cannot overwrite it; use the correction path.', 'الحضور محفوظ كغائب. المسح لا يستبدله؛ استخدم مسار التصحيح.'), storage_unavailable: t('Recovery storage unavailable. No write was sent. Enable browser storage and retry.', 'تخزين الاسترداد غير متاح. لم يُرسل طلب حفظ. فعّل تخزين المتصفح وأعد المحاولة.') };
    const format = (value: string) => new Intl.DateTimeFormat(ar ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short', timeZone: ctx?.timezone ?? 'UTC' }).format(new Date(value)), sessionName = (s: QrSession) => `⁨${s.projection.name}⁩ · ⁨${format(s.starts_at)}⁩ — ⁨${format(s.ends_at)}⁩`;
    const title = view === 'card' ? t('Player QR card', 'بطاقة QR للاعب') : view === 'settings' ? t('Attendance settings', 'إعدادات الحضور') : t('Session scanner', 'ماسح الجلسات'), base = `/${locale}/workspace/${academy}`, blocked = busy || uncertain;
    const inspector = uncertain ? <><h3>{busy ? t('Saving… awaiting confirmation', 'جارٍ الحفظ… بانتظار التأكيد') : t('Outcome unknown', 'نتيجة غير معروفة')}</h3><p>{t('Scanning is paused. Resolve the original operation before another write.', 'المسح متوقف. تحقق من العملية الأصلية قبل أي حفظ جديد.')}</p><Button disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'تحقق من العملية الأصلية')}</Button></> : denied ? <p>{labels.denied}</p> : readFailed ? <><p role="alert">{t('Current saved data could not be loaded. This is not an empty result.', 'تعذر تحميل البيانات الحالية. هذه ليست نتيجة فارغة.')}</p><Button disabled={busy} onClick={() => void run(async () => {
            if (last)
                await result(last, { op: last.kind === 'card' ? last.card : '', kind: last.kind, target: last.kind === 'card' ? last.player : last.kind === 'settings' ? last.event : null, context: '' });
            else
                await reload();
        })}>{last ? t('Load saved result', 'تحميل النتيجة المحفوظة') : t('Retry current view', 'إعادة تحميل العرض الحالي')}</Button></> : view === 'card' && card ? <><h3>{card.name}</h3><p>{t('Main branch', 'الفرع الحالي')}: {ctx?.branch_name}</p><p>{t('Card state', 'حالة البطاقة')}: {card.active ? t('Active', 'صالحة') : t('No active card', 'لا بطاقة صالحة')} · {t('Version', 'الإصدار')} {card.version}</p>{notice && <p role="status">{t('Card operation confirmed. Current saved state shown.', 'تأكدت عملية البطاقة. الحالة الحالية معروضة.')}</p>}{issued && issued.card === card.card && card.active ? <QrPrintCard key={issued.card} code={issued.code} name={card.name} branch={ctx?.branch_name ?? ''} arabic={ar}/> : card.active && <p>{t('The existing code is not stored for display. Use your saved card, or explicitly replace it if lost.', 'الرمز الحالي غير مخزن للعرض. استخدم البطاقة المحفوظة أو استبدلها صراحةً عند فقدها.')}</p>}{cardChoice ? <><p>{cardChoice === 'revoke' ? t('Revoke this card? New scans will stop. Attendance and history stay saved.', 'إلغاء البطاقة؟ تتوقف عمليات المسح الجديدة ويظل الحضور والسجل محفوظين.') : t('Issue a new card for this player. Any previous copy stops working. Card possession grants no account access.', 'إصدار بطاقة جديدة لهذا اللاعب. تتوقف أي نسخة سابقة. حيازة البطاقة لا تمنح دخول الحساب.')}</p><label className="checkbox-row"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}/><span>{t('I reviewed this player and card consequence.', 'راجعت اللاعب ونتيجة تغيير البطاقة.')}</span></label><Button disabled={blocked || !ack} onClick={() => void saveCard()}>{t('Confirm card change', 'تأكيد تغيير البطاقة')}</Button><Button disabled={blocked} onClick={() => { setCardChoice(''); setAck(false); }}>{t('Keep current card', 'الإبقاء على البطاقة')}</Button></> : <><Button disabled={blocked} onClick={() => { setCardChoice(card.active ? 'replace' : 'issue'); setAck(false); }}>{card.active ? t('Replace card', 'استبدال البطاقة') : t('Issue card', 'إصدار بطاقة')}</Button>{card.active && <Button disabled={blocked} onClick={() => { setCardChoice('revoke'); setAck(false); }}>{t('Revoke card', 'إلغاء البطاقة')}</Button>}</>}</> : view === 'settings' ? review ? <><h3>{t('Review scanning window', 'مراجعة نافذة المسح')}</h3><p>{target === 'academy' ? t('Academy defaults', 'القيم الافتراضية للأكاديمية') : activeSession ? sessionName(activeSession) : ''}</p><p>{before} {t('minutes before start', 'دقيقة قبل البداية')} · {after} {t('minutes after end', 'دقيقة بعد النهاية')}</p><p>{t('Explicit session overrides remain. Future scans recheck current settings. Attendance history does not change.', 'تبقى تجاوزات الجلسات الصريحة. تتحقق عمليات المسح التالية من الإعدادات الحالية. لا يتغير سجل الحضور.')}</p><label className="checkbox-row"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)}/><span>{t('I reviewed the target and values.', 'راجعت النطاق والقيم.')}</span></label><Button disabled={blocked || !ack} onClick={() => void saveSettings()}>{t('Confirm window settings', 'تأكيد إعدادات النافذة')}</Button><Button disabled={blocked} onClick={() => { setReview(false); setAck(false); }}>{t('Back to edit', 'العودة للتعديل')}</Button></> : <><h3>{t('Scan window policy', 'سياسة نافذة المسح')}</h3><p>{t('For17:00–18:00 with30/30, scanning is open16:30–18:30. Session selection cannot bypass this window.', 'لجلسة١٧:٠٠–١٨:٠٠ مع٣٠/٣٠ يتاح المسح١٦:٣٠–١٨:٣٠. اختيار الجلسة لا يتجاوز النافذة.')}</p><p>{t('Manual attendance and correction keep their separate session-start to24-hours-after-end window.', 'للتسجيل اليدوي والتصحيح نافذة مستقلة من بداية الجلسة إلى٢٤ ساعة بعد نهايتها.')}</p></> : <><h3>{t('Scanner and current result', 'الماسح والنتيجة الحالية')}</h3>{notice === 'not_committed' && <p role="status">{t('Original operation did not commit and is fenced. Review before a new attempt.', 'لم تُحفظ العملية الأصلية ومُنع تنفيذها المتأخر. راجع قبل محاولة جديدة.')}</p>}{last?.kind === 'scan' && <p role="status"><strong>{last.name}</strong> · {t('Present', 'حاضر')} · {last.already ? t('Already recorded; no new attendance entry.', 'مسجل بالفعل؛ لا سجل حضور جديد.') : t('Saved. Ready for the next card.', 'حُفظ. جاهز للبطاقة التالية.')}<br />{sessions?.items.find(s => s.id === last.event)?.projection.name ?? last.event}</p>}{matches.length > 0 ? <><p>{matches[0].name} · {t('More than one eligible session. Choose one for this scan only. Nothing saved yet.', 'أكثر من جلسة مؤهلة. اختر جلسة لهذه البطاقة فقط. لم يُحفظ شيء.')}</p>{matches.map(m => <Button disabled={blocked} key={m.event} onClick={() => void run(() => capture(m.event))}>{m.projection.name} · {format(m.starts_at)} — {format(m.ends_at)}</Button>)}<Button disabled={blocked} onClick={() => { setMatches([]); code.current = ''; }}>{t('Cancel this scan', 'إلغاء هذا المسح')}</Button></> : <><p>{t('A unique eligible match automatically records Present. A copied card does not prove physical presence; check the named player.', 'المطابقة المؤهلة الوحيدة تسجل حاضر تلقائياً. البطاقة المنسوخة لا تثبت الحضور الفعلي؛ تحقق من اسم اللاعب.')}</p><Button disabled={blocked || !scope.length || !!error} onClick={() => { setRunning(true); setFresh(false); }}>{running ? t('Camera running', 'الكاميرا تعمل') : t('Start camera', 'تشغيل الكاميرا')}</Button><form onSubmit={e => { e.preventDefault(); void scan(typed.trim()); }}><label>{t('Card code fallback', 'بديل رمز البطاقة')}<input autoComplete="off" spellCheck={false} maxLength={256} value={typed} disabled={blocked || !!error} onChange={e => setTyped(e.target.value)}/></label><Button type="submit" disabled={blocked || !typed || !scope.length || !!error}>{t('Read card code', 'قراءة رمز البطاقة')}</Button></form>{fresh && <p>{t('Current attendance is confirmed. Camera capture resumes only if you started the camera.', 'تأكد الحضور الحالي. يستأنف التصوير فقط إن كنت قد شغلت الكاميرا.')}</p>}</>}{error === 'correction_required' && <p><a onClick={navigate} href={`${base}/attendance/corrections${scope.length === 1 ? '?event=' + scope[0] : ''}`}>{t('Open correction requests', 'فتح طلبات التصحيح')}</a></p>}</>;
    return <div className="qr-workspace"><WorkspaceShell locale={locale} context={ctx ? (ctx.owner ? t('Academy Owner workspace', 'مساحة مالك الأكاديمية') : t('Trainer workspace', 'مساحة المدرب')) : t('Academy workspace', 'مساحة الأكاديمية')} title={title} homeHref={`/${locale}/workspace`} languageHref="#language" onNavigate={navigate} account={<UserButton />} navigation={[{ href: `/${locale}/workspace`, label: t('Your workspaces', 'مساحاتك') }, { href: base + '/attendance/scan', label: t('Session scanner', 'ماسح الجلسات'), current: view === 'scan' }, ...(ctx?.owner ? [{ href: base + '/attendance/settings', label: t('Attendance settings', 'إعدادات الحضور'), current: view === 'settings' }, { href: base + '/players', label: t('Players', 'اللاعبون') }] : [])]}><h1>{title}</h1>{error && <p role="alert">{labels[error] ?? labels.unavailable}{!uncertain && !denied && <Button disabled={busy} onClick={() => void run(reload)}>{t('Reload current view', 'إعادة تحميل العرض الحالي')}</Button>}</p>}<WorkspacePanes arabic={ar} selected={view === 'card' || opened || review || uncertain} selectionKey={view + String(review) + String(uncertain)} title={t('Details and actions', 'التفاصيل والإجراءات')} inspector={<>{inspector}{view === 'scan' && opened && ctx && !denied && !readFailed && <QrCamera enabled={running && !denied && !readFailed} paused={blocked || matches.length > 0 || !!error} context={`${academy}:${ctx?.branch}:${day}:${scope.join(',')}`} arabic={ar} onCode={value => void scan(value)} onStop={() => setRunning(false)}/>}</>} blocked={blocked} onBack={() => {
            if (view === 'card') {
                if (!blocked)
                    router.push(base + '/players/' + player);
                return;
            }
            if (review) {
                setReview(false);
                setOpened(false);
                return;
            }
            if (!abandon())
                return;
            clearScan();
            setReview(false);
            setCardChoice('');
            if (view === 'settings') {
                setBefore(currentBefore ?? 30);
                setAfter(currentAfter ?? 30);
            }
            requestAnimationFrame(() => opener.current?.focus());
        }} contextLabel={t('Open scanner and details', 'فتح الماسح والتفاصيل')}>
        {denied ? <p>{labels.denied}</p> : uncertain ? <p>{t('Resolve the original operation in Details. New actions are paused.', 'تحقق من العملية الأصلية في التفاصيل. الإجراءات الجديدة متوقفة.')}</p> : !ctx ? <p role="status">{t('Checking current access and branch…', 'التحقق من الصلاحية والفرع…')}</p> : view === 'card' ? <><p>{ctx.branch_name} · {t('Owner-only card controls', 'إدارة البطاقة للمالك فقط')}</p><p>{t('One current card per fictional player, valid until revoked or replaced. No login, public link or email access.', 'بطاقة حالية واحدة لكل لاعب خيالي حتى الإلغاء أو الاستبدال. لا دخول أو رابط عام أو بريد.')}</p><p><a onClick={navigate} href={`${base}/players/${player}`}>{t('Back to player profile', 'العودة لملف اللاعب')}</a></p></> : <><p>{ctx.branch_name} · <bdi>{ctx.timezone}</bdi></p><label>{t('Session date', 'تاريخ الجلسات')}<input type="date" value={day} disabled={blocked} onChange={e => {
                if (!abandon())
                    return;
                clearScan();
                setDay(e.target.value);
                setCursor(null);
                setPages([]);
                setTarget('academy');
                void run(() => readSessions(ctx, e.target.value, null).then(() => { }));
            }}/></label>{view === 'settings' ? <><label>{t('Apply window to', 'نطاق تطبيق النافذة')}<Select value={target} disabled={blocked || !sessions} onChange={e => {
                    if (!abandon())
                        return;
                    const target = e.target.value, s = sessions?.items.find(s => s.id === target);
                    setTarget(target);
                    setBefore(s ? s.window.before : ctx.settings.before);
                    setAfter(s ? s.window.after : ctx.settings.after);
                    setReview(false);
                    setAck(false);
                }}><option value="academy">{t('Academy defaults', 'القيم الافتراضية للأكاديمية')}</option>{sessions?.items.map(s => <option key={s.id} value={s.id}>{sessionName(s)}</option>)}</Select></label><label>{t('Minutes before start', 'دقائق قبل البداية')}<input type="number" min={0} max={180} step={1} value={before} disabled={blocked} onChange={e => { setBefore(Number(e.target.value)); setReview(false); setAck(false); }}/></label><label>{t('Minutes after end', 'دقائق بعد النهاية')}<input type="number" min={0} max={180} step={1} value={after} disabled={blocked} onChange={e => { setAfter(Number(e.target.value)); setReview(false); setAck(false); }}/></label><p>{t('Whole minutes0–180 on each side. Academy defaults apply to sessions without an explicit override.', 'دقائق صحيحة٠–١٨٠ لكل جانب. تُطبق القيم الافتراضية على الجلسات بلا تجاوز صريح.')}</p><Button disabled={blocked || ![before, after].every(n => Number.isSafeInteger(n) && n >= 0 && n <= 180) || target !== 'academy' && !activeSession} onClick={() => { setReview(true); setAck(false); setOpened(true); }}>{t('Review window settings', 'مراجعة إعدادات النافذة')}</Button>{notice === 'saved' && <p role="status">{t('Window settings saved. Attendance history unchanged.', 'حُفظت إعدادات النافذة. لم يتغير سجل الحضور.')}</p>}</> : <><label>{t('Session selection', 'اختيار الجلسة')}<Select value={mode} disabled={blocked || !sessions} onChange={e => { clearScan(); setMode(e.target.value); }}><option value="auto">{t('Automatic · selected sessions', 'تلقائي · الجلسات المختارة')}</option>{sessions?.items.map(s => <option key={s.id} value={s.id}>{sessionName(s)}</option>)}</Select></label><p>{t('Only the selected sessions are scanned. Other pages are excluded until you select from them.', 'يُمسح ضمن الجلسات المختارة فقط. الصفحات الأخرى مستبعدة حتى تختار منها.')}</p>{sessions?.items.length === 0 && <p>{t('No published sessions on this date in your current scope.', 'لا جلسات منشورة في هذا التاريخ ضمن نطاقك الحالي.')}</p>}<ul className="qr-session-list">{sessions?.items.map(s => <li key={s.id}><label className="checkbox-row"><input type="checkbox" checked={mode === 'auto' ? selected.includes(s.id) : mode === s.id} disabled={blocked || mode !== 'auto'} onChange={e => { clearScan(); setSelected(ids => e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id)); }}/><span><strong>{s.projection.name}</strong><br />{format(s.starts_at)} — {format(s.ends_at)}<br />{s.present}/{s.roster_count} {t('Present', 'حاضر')}<br />{t('Scan window', 'نافذة المسح')}: {format(s.window.opens_at!)} — {format(s.window.closes_at!)} · {s.window.override ? t('Session override', 'تجاوز للجلسة') : t('Academy default', 'افتراضي الأكاديمية')}<br /><a href={`${base}/attendance/${s.id}`} onClick={navigate}>{t('Open attendance register', 'فتح سجل الحضور')}</a></span></label></li>)}</ul><Button ref={opener} disabled={blocked || !sessions || !scope.length || readFailed} onClick={() => { setOpened(true); setError(''); setNotice(''); }}>{t('Open scanner', 'فتح الماسح')}</Button></>}
        <div className="journey-actions"><Button disabled={blocked || !pages.length} onClick={() => {
                if (!abandon())
                    return;
                clearScan();
                const prev = pages.at(-1) ?? null;
                setPages(p => p.slice(0, -1));
                setCursor(prev);
                void run(() => readSessions(ctx, day, prev).then(() => { }));
            }}>{t('Previous sessions', 'الجلسات السابقة')}</Button><Button disabled={blocked || !sessions?.more} onClick={() => {
                if (!sessions || !abandon())
                    return;
                clearScan();
                const last = sessions.items.at(-1)!;
                const next = { after_at: last.starts_at, after_id: last.id };
                setPages(p => [...p, cursor]);
                setCursor(next);
                void run(() => readSessions(ctx, day, next).then(() => { }));
            }}>{t('More sessions', 'جلسات أخرى')}</Button></div></>}
    </WorkspacePanes></WorkspaceShell></div>;
}
