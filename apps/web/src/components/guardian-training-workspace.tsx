'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser, UserButton, SignInButton } from '@clerk/nextjs';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import WorkspacePanes from './workspace-panes';
import { Button, Select } from './ui/controls';
import type { FamilyLink, FamilySchedule, FamilySession, FamilyContext } from '@/lib/guardian-training';
type Props = {
    locale: string;
    academy: string;
    initialLink?:string;initialEvent?:string;initialFrom?:string;
};
type Cursor = {
    at: string;
    id: string;
} | null;
const dayAdd = (day: string, n: number) => { const d = new Date(day + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
class ReadFailure extends Error {
    constructor(public code: string) { super(code); }
}
export default function GuardianTrainingWorkspace(props: Props) { const user = useUser(), ar = props.locale === 'ar'; const [authExpired, setAuthExpired] = useState(false); useEffect(() => { if (user.isLoaded)
    return; const timer = setTimeout(() => setAuthExpired(true), 15000); return () => clearTimeout(timer); }, [user.isLoaded]); if (!user.isLoaded)
    return <PublicWorkspace locale={props.locale} title={ar ? 'التدريبات والحضور' : 'Training & attendance'}><p role="status">{authExpired ? (ar ? 'تعذر تحميل تسجيل الدخول. أعد تحميل الصفحة.' : 'Could not load sign-in. Reload this page.') : (ar ? 'جارٍ تحميل تسجيل الدخول…' : 'Loading sign-in…')}</p>{authExpired && <Button onClick={() => window.location.reload()}>{ar ? 'إعادة المحاولة' : 'Retry'}</Button>}</PublicWorkspace>; if (!user.user)
    return <PublicWorkspace locale={props.locale} title={ar ? 'تسجيل الدخول' : 'Sign in'}><SignInButton forceRedirectUrl={`/${props.locale}/workspace/${props.academy}/guardian/training`}><Button>{ar ? 'تسجيل الدخول' : 'Sign in'}</Button></SignInButton></PublicWorkspace>; return <FamilyJourney key={`${user.user.id}:${props.academy}:${props.initialLink??''}:${props.initialEvent??''}`} {...props}/>; }
function FamilyJourney({ locale: initialLocale, academy,initialLink,initialEvent,initialFrom }: Props) {
    const [locale, setLocale] = useState(initialLocale);
    const ar = locale === 'ar', t = (en: string, a: string) => ar ? a : en;
    const [links, setLinks] = useState<FamilyLink[]>([]), [link, setLink] = useState(initialLink??''), [linksMore, setLinksMore] = useState(false), [linkAfter, setLinkAfter] = useState<string | null>(null), [linkPages, setLinkPages] = useState<(string | null)[]>([]), [linksError, setLinksError] = useState(''), [loadingLinks, setLoadingLinks] = useState(true), [denied, setDenied] = useState(false);
    const [from, setFrom] = useState(() => initialFrom??new Date().toISOString().slice(0, 10)), [cursor, setCursor] = useState<Cursor>(null), [pages, setPages] = useState<Cursor[]>([]), [data, setData] = useState<FamilySchedule | null>(null), [busy, setBusy] = useState(true), [error, setError] = useState(''), [selected, setSelected] = useState(initialEvent??''), [detail, setDetail] = useState<{
        context: FamilyContext;
        item: FamilySession;
    } | null>(null), [detailBusy, setDetailBusy] = useState(Boolean(initialEvent)), [detailError, setDetailError] = useState(''), [calendar, setCalendar] = useState(false), [filter, setFilter] = useState(''), [refresh, setRefresh] = useState(0);
    const active = useRef(true), generation = useRef(0), controllers = useRef(new Set<AbortController>()), opener = useRef<HTMLButtonElement | null>(null);
    const invalidate = useCallback(() => { generation.current++; for (const c of controllers.current)
        c.abort(); controllers.current.clear(); setData(null); setDetail(null); setError(''); setDetailError(''); }, []);
    const deny = useCallback(() => { invalidate(); setDenied(true); setLinks([]); setLink(''); setSelected(''); }, [invalidate]);
    const request = useCallback(async <T,>(body: Record<string, unknown>, signal: AbortSignal): Promise<T> => { const r = await fetch('/api/guardian-training', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, academy }), cache: 'no-store', signal }); const result = await r.json(); if (!r.ok)
        throw new ReadFailure(result.error ?? 'unavailable'); return result.data as T; }, [academy]);
    useEffect(() => { active.current = true; const pending = controllers.current; return () => { active.current = false; for (const c of pending)
        c.abort(); }; }, []);
    useEffect(() => {
        if (denied)
            return;
        let live = true;
        const c = new AbortController(), pending = controllers.current;
        pending.add(c);
        const timer = setTimeout(() => c.abort(), 15000);
        request<{
            items: FamilyLink[];
            more: boolean;
        }>({ action: 'links', after: linkAfter }, c.signal).then(r => { if (!live || !active.current)
            return; setLinks(r.items); setLinksMore(r.more); setLink(old => r.items.some(p => p.id === old)||Boolean(initialLink&&old===initialLink) ? old : r.items[0]?.id ?? ''); }).catch(e => { if (!live || !active.current)
            return; setLink(''); if (e instanceof ReadFailure && e.code === 'denied')
            deny();
        else
            setLinksError('unavailable'); }).finally(() => { clearTimeout(timer); pending.delete(c); if (live && active.current)
            setLoadingLinks(false); });
        return () => { live = false; c.abort(); clearTimeout(timer); pending.delete(c); };
    }, [linkAfter, refresh, request, denied, deny,initialLink]);
    useEffect(() => {
        if (!link || denied || loadingLinks)
            return;
        let live = true;
        const token = generation.current, c = new AbortController(), pending = controllers.current;
        pending.add(c);
        const timer = setTimeout(() => c.abort(), 15000);
        request<FamilySchedule>({ action: 'schedule', link, from, after_at: cursor?.at ?? null, after_event: cursor?.id ?? null }, c.signal).then(r => { if (!live || !active.current || token !== generation.current)
            return; if (r.context.link !== link || r.context.academy !== academy)
            throw new ReadFailure('unavailable'); setData(r); }).catch(e => { if (!live || !active.current || token !== generation.current)
            return; if (e instanceof ReadFailure && e.code === 'denied')
            deny();
        else
            setError('unavailable'); }).finally(() => { clearTimeout(timer); pending.delete(c); if (live && active.current && token === generation.current)
            setBusy(false); });
        return () => { live = false; c.abort(); clearTimeout(timer); pending.delete(c); };
    }, [link, from, cursor, refresh, request, denied, loadingLinks, deny, academy]);
    useEffect(() => {
        if (!selected || !link || denied || loadingLinks)
            return;
        let live = true;
        const token = generation.current, c = new AbortController(), pending = controllers.current;
        pending.add(c);
        const timer = setTimeout(() => c.abort(), 15000);
        request<{
            context: FamilyContext;
            item: FamilySession;
        }>({ action: 'detail', link, event: selected }, c.signal).then(r => { if (!live || !active.current || token !== generation.current)
            return; if (r.context.link !== link || r.context.academy !== academy || r.item.id !== selected)
            throw new ReadFailure('unavailable'); setDetail(r); }).catch(e => { if (!live || !active.current || token !== generation.current)
            return; if (e instanceof ReadFailure && e.code === 'denied')
            deny();
        else
            setDetailError('unavailable'); }).finally(() => { clearTimeout(timer); pending.delete(c); if (live && active.current && token === generation.current)
            setDetailBusy(false); });
        return () => { live = false; c.abort(); clearTimeout(timer); pending.delete(c); };
    }, [selected, link, refresh, request, denied, loadingLinks, deny, academy]);
    useEffect(() => { function revalidate() { if (document.visibilityState === 'hidden')
        return; invalidate(); setBusy(true); setLoadingLinks(true); setLinks([]); setLinksError(''); setRefresh(n => n + 1); } window.addEventListener('focus', revalidate); window.addEventListener('online', revalidate); document.addEventListener('visibilitychange', revalidate); return () => { window.removeEventListener('focus', revalidate); window.removeEventListener('online', revalidate); document.removeEventListener('visibilitychange', revalidate); }; }, [invalidate]);
    function changePeriod(n: number) { invalidate(); setSelected(''); setFrom(dayAdd(from, n)); setCursor(null); setPages([]); setFilter(''); setBusy(true); }
    function retry() { invalidate(); setLoadingLinks(true); setLinks([]); setLinksError(''); setRefresh(n => n + 1); setBusy(true); }
    function selectPlayer(id: string) { invalidate(); setSelected(''); setLink(id); setCursor(null); setPages([]); setFilter(''); setBusy(true); }
    const status = (s: FamilySession) => s.status === 'present' ? t('Present', 'حاضر') : s.status === 'absent' ? t('Absent', 'غائب') : t('Unmarked', 'لم يُسجّل');
    const date = (d: string) => new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00Z'));
    const time = (s: string, z: string) => new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: z }).format(new Date(s));
    const title = t('Training & attendance', 'التدريبات والحضور'), rows = data?.items.filter(s => !filter || s.date === filter) ?? [], item = detail?.item;
    const inspector = denied ? null : detailBusy ? <p role="status">{t('Loading this session…', 'جارٍ تحميل التدريب…')}</p> : detailError ? <><p role="alert">{t('Session could not be loaded. No attendance result is assumed.', 'تعذر تحميل التدريب. لا نفترض نتيجة حضور.')}</p><Button onClick={retry}>{t('Retry session', 'إعادة تحميل التدريب')}</Button></> : item ? <><p>{detail.context.name} · {item.branch}</p><h3>{item.title}</h3><p>{ar && item.sport_ar ? item.sport_ar : item.sport}</p><p>{date(item.date)}</p><p><bdi>{time(item.starts_at, item.timezone)}–{time(item.ends_at, item.timezone)} · {item.timezone}</bdi></p><section className="journey-card"><h3>{t('Your player’s attendance', 'حضور اللاعب المرتبط بك')}</h3><strong>{status(item)}</strong>{!item.status && <p>{t('No attendance has been recorded. This does not mean Absent.', 'لم يُسجّل الحضور. هذا لا يعني الغياب.')}</p>}{item.updated_at && <p>{t('Last recorded update', 'آخر تحديث مسجّل')}: {new Intl.DateTimeFormat(ar ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: item.timezone }).format(new Date(item.updated_at))} · <bdi>{item.timezone}</bdi></p>}{item.corrected && <p>{t('Updated by the academy · current result shown', 'عدّلته الأكاديمية · النتيجة الحالية معروضة')}</p>}</section><p>{t('For questions, contact your academy through your usual channel.', 'للاستفسار، تواصل مع الأكاديمية عبر وسيلتك المعتادة.')}</p></> : <p>{t('Choose a session to see its time and your player’s attendance.', 'اختر تدريباً لعرض موعده وحضور اللاعب المرتبط بك.')}</p>;
    return <WorkspaceShell role="guardian" module="family" locale={locale} context={t('Guardian workspace', 'مساحة ولي الأمر')} title={title} homeHref={`/${locale}/workspace`} languageHref={`/${ar ? 'en' : 'ar'}/workspace/${academy}/guardian/training`} onNavigate={e => { const href = e.currentTarget.getAttribute('href'); if (href === `/${ar ? 'en' : 'ar'}/workspace/${academy}/guardian/training`) { e.preventDefault(); setLocale(ar ? 'en' : 'ar'); window.history.replaceState(window.history.state, '', href); } }} account={<UserButton />} navigation={[{href:`/${locale}/workspace/${academy}/guardian/home`,label:t('Home','الرئيسية')},{href:`/${locale}/workspace/${academy}/guardian/calendar`,label:t('Calendar','التقويم')}, { href: `/${locale}/workspace/${academy}/guardian`, label: t('Linked players', 'اللاعبون المرتبطون') }, { href: `/${locale}/workspace/${academy}/guardian/training`, label: title, current: true }]}><div className="family-training"><h1>{title}</h1>{denied ? <p role="alert">{t('Access unavailable. Check your current workspace with your academy.', 'الوصول غير متاح. تحقق من مساحة العمل الحالية مع الأكاديمية.')}</p> : loadingLinks ? <p role="status">{t('Loading linked players…', 'جارٍ تحميل اللاعبين المرتبطين…')}</p> : linksError ? <><p role="alert">{t('Linked players could not be loaded. This is not an empty account.', 'تعذر تحميل اللاعبين. هذا لا يعني أن الحساب فارغ.')}</p><Button onClick={retry}>{t('Retry linked players', 'إعادة تحميل اللاعبين')}</Button></> : <><label className="family-player-picker">{t('Linked player', 'اللاعب المرتبط')}<Select value={link} onChange={e => selectPlayer(e.target.value)} disabled={!links.length}>{link&&!links.some(p=>p.id===link)&&<option value={link}>{data?.context.name??t('Loading selected player…','تحميل اللاعب المحدد…')}</option>}{links.map(p => <option key={p.id} value={p.id}>{p.display_name} · {p.academy_name}</option>)}</Select></label>{!links.length && <p>{t('No approved training-view links on this page. Your linked-player profile access is separate. Ask the academy if you expected a training view.', 'لا ارتباطات معتمدة لعرض التدريبات في هذه الصفحة. صلاحية ملف اللاعب المرتبط منفصلة. استفسر من الأكاديمية إذا توقعت عرض التدريبات.')}</p>}<div className="journey-actions"><Button disabled={!linkPages.length} onClick={() => { invalidate(); setSelected(''); setLink(''); setLoadingLinks(true); setLinks([]); setLinkAfter(linkPages.at(-1)!); setLinkPages(p => p.slice(0, -1)); setCursor(null); setPages([]); }}>{t('Previous players', 'اللاعبون السابقون')}</Button><Button disabled={!linksMore} onClick={() => { invalidate(); setSelected(''); setLink(''); setLinkPages(p => [...p, linkAfter]); setLoadingLinks(true); setLinkAfter(links.at(-1)!.id); setLinks([]); setCursor(null); setPages([]); }}>{t('More players', 'لاعبون آخرون')}</Button></div>{link && <WorkspacePanes arabic={ar} title={t('Session details', 'تفاصيل التدريب')} selected={!!selected} selectionKey={selected} onBack={() => { setSelected(''); setDetail(null); requestAnimationFrame(() => opener.current?.focus()); }} inspector={inspector}><h2>{links.find(p => p.id === link)?.display_name}</h2><p>{links.find(p => p.id === link)?.branch_name}</p><h3>{date(from)} — {date(dayAdd(from, 6))}</h3><div className="journey-actions"><Button disabled={from <= '0001-01-07'} onClick={() => changePeriod(-7)}>{t('Previous week', 'الأسبوع السابق')}</Button><Button disabled={from >= '9999-12-18'} onClick={() => changePeriod(7)}>{t('Next week', 'الأسبوع التالي')}</Button></div>{busy ? <p role="status">{t('Loading this player’s schedule…', 'جارٍ تحميل جدول هذا اللاعب…')}</p> : error ? <><p role="alert">{t('Schedule could not be loaded. No attendance result can be inferred.', 'تعذر تحميل الجدول. لا يمكن استنتاج نتيجة حضور.')}</p><Button onClick={retry}>{t('Retry this period', 'إعادة تحميل هذه الفترة')}</Button></> : data ? <>{data.next && <section className="journey-card"><h3>{t('Next session', 'التدريب القادم')}</h3><p>{date(data.next.date)} · {time(data.next.starts_at, data.next.timezone)} · <bdi>{data.next.timezone}</bdi></p><Button onClick={e => { opener.current = e.currentTarget; if (selected === data.next!.id)
        return; setDetail(null); setDetailBusy(true); setDetailError(''); setSelected(data.next!.id); }}>{t('Open next session', 'فتح التدريب القادم')}</Button></section>}<div className="journey-actions"><Button aria-pressed={!calendar} onClick={() => { setCalendar(false); setFilter(''); }}>{t('List', 'قائمة')}</Button><Button aria-pressed={calendar} onClick={() => setCalendar(true)}>{t('Week calendar', 'تقويم الأسبوع')}</Button></div>{calendar && <><p>{t('Calendar shows sessions on this page. Browse all session pages for full coverage.', 'يعرض التقويم تدريبات هذه الصفحة. تصفح كل الصفحات لتغطية الفترة كاملة.')}</p><div className="family-week-grid">{Array.from({ length: 7 }, (_, i) => dayAdd(from, i)).map(d => <Button key={d} aria-pressed={filter === d} onClick={() => { setFilter(d); setSelected(''); setDetail(null); }}>{date(d)} · {data.items.filter(s => s.date === d).length}</Button>)}</div><Button onClick={() => setFilter('')}>{t('Show full week', 'عرض الأسبوع كاملاً')}</Button></>}<p>{t(`Session page ${pages.length + 1} · ${data.items.length} sessions on this page${data.more ? ' · more available' : ''}`, `صفحة التدريبات ${pages.length + 1} · ${data.items.length} تدريب في هذه الصفحة${data.more ? ' · توجد صفحات أخرى' : ''}`)}</p>{!rows.length && <p>{data.items.length || pages.length || data.more ? t('No sessions in this selection on this page. Check the other pages.', 'لا تدريبات ضمن هذا الاختيار في هذه الصفحة. راجع الصفحات الأخرى.') : t('No published sessions for this player in this period.', 'لا تدريبات منشورة لهذا اللاعب في هذه الفترة.')}</p>}<ul className="family-session-list">{rows.map(s => <li key={s.id}><Button aria-pressed={selected === s.id} onClick={e => { opener.current = e.currentTarget; if (selected === s.id)
        return; setDetail(null); setDetailBusy(true); setDetailError(''); setSelected(s.id); }}><strong>{s.title}</strong><span>{date(s.date)} · {time(s.starts_at, s.timezone)}–{time(s.ends_at, s.timezone)} · <bdi>{s.timezone}</bdi></span><span>{status(s)}{s.corrected ? ' · ' + t('Updated', 'محدّث') : ''}</span></Button></li>)}</ul><div className="journey-actions"><Button disabled={!pages.length} onClick={() => { invalidate(); setSelected(''); setCursor(pages.at(-1)!); setPages(p => p.slice(0, -1)); setBusy(true); }}>{t('Previous sessions', 'التدريبات السابقة')}</Button><Button disabled={!data.more} onClick={() => { invalidate(); setSelected(''); const last = data.items.at(-1)!; setPages(p => [...p, cursor]); setCursor({ at: last.starts_at, id: last.id }); setBusy(true); }}>{t('More sessions', 'تدريبات أخرى')}</Button></div><p>{t('Only published sessions for your linked player appear here. Unmarked never means Absent.', 'تظهر هنا التدريبات المنشورة للاعب المرتبط بك فقط. عدم التسجيل لا يعني الغياب.')}</p></> : null}</WorkspacePanes>}</>}</div></WorkspaceShell>;
}
