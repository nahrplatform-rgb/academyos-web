'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { sessionTime } from '@/lib/experience-format';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button, Input, Select } from './ui/controls';

type Staff = { id: string; name: string; branch: string };
type Coverage = { staff: string | null; status: 'present' | 'absent'; version: number; stale?: boolean };
type Event = { id: string; name: string; day: string; startsAt: string; endsAt: string; branch: string; assigned: string | null; assignedName: string | null; status: string; coverage: Coverage | null };
type Line = { id: string; event: string; day: string; name: string; amount: number; start: string; terms: string };
type Run = {
  id: string; status: string; review: string; stale?: boolean; total: number; approved: number; payable: number;
  lines: Line[]; payouts: { id: string; amount: number; method: string; date: string }[];
  adjustments: { id: string; line: string; amount: number }[];
  requests: { id: string; line: string; reason: string; status: string }[];
};
type Context = {
  role: 'owner' | 'trainer'; timezone: string; staff: Staff[]; events: Event[]; next: string | null;
  terms: { id: string; start: string; rate: number }[]; run: Run | null;
};
type Original = { operation: string };
class Failure extends Error { constructor(public code: string) { super(code); } }
const money = (amount: number) => (amount / 100).toFixed(2);
const operationPattern = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
function minor(value: string, signed = false) {
  const normal = value.trim().replace(/[٠-٩۰-۹]/g, d => String(d.charCodeAt(0) - (d <= '٩' ? 0x660 : 0x6f0))).replace('٫', '.');
  if (!(signed ? /^-?\d{1,8}(?:\.\d{1,2})?$/ : /^\d{1,8}(?:\.\d{1,2})?$/).test(normal)) return NaN;
  const negative = normal.startsWith('-');
  const [whole, fraction = ''] = (negative ? normal.slice(1) : normal).split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return amount > 0 && amount <= 1_000_000_000 ? (negative ? -amount : amount) : NaN;
}
async function api<T>(academy: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/trainer-compensation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    signal: AbortSignal.timeout(15000), body: JSON.stringify({ academy, ...body }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !Object.hasOwn(json, 'data')) throw new Failure(typeof json.error === 'string' ? json.error : 'unavailable');
  return json.data as T;
}
function readOriginal(key: string): Original | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Object.keys(value).join(',') !== 'operation' ||
      !('operation' in value) || typeof value.operation !== 'string' || !operationPattern.test(value.operation)) throw Error();
    return { operation: value.operation };
  } catch { throw new Failure('recovery'); }
}
export default function TrainerCompensationWorkspace(props: { locale: string; academy: string; trainer?: boolean }) {
  const { isLoaded, user } = useUser();
  const ar = props.locale === 'ar';
  if (!isLoaded || !user) return <PublicWorkspace locale={props.locale} title={ar ? 'مستحقات المدربين' : 'Trainer earnings'}>
    <p role={isLoaded ? 'alert' : 'status'}>{isLoaded ? (ar ? 'يرجى تسجيل الدخول.' : 'Please sign in.') : (ar ? 'جارٍ التحميل…' : 'Loading…')}</p>
  </PublicWorkspace>;
  return <Compensation key={`${user.id}:${props.academy}:${props.trainer ? 'trainer' : 'owner'}`} {...props} subject={user.id} />;
}
function Compensation({ locale, academy, trainer = false, subject }: { locale: string; academy: string; trainer?: boolean; subject: string }) {
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const role = trainer ? 'trainer' : 'owner';
  const key = `academyos:trainer-compensation:${subject}:${academy}:${role}`;
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [staff, setStaff] = useState('');
  const [context, setContext] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [pending, setPending] = useState<Original | null>(null), [recoveryReady, setRecoveryReady] = useState(false), [recoveryBlocked, setRecoveryBlocked] = useState(false);
  const [coverage, setCoverage] = useState<Record<string, { staff: string; status: 'present' | 'absent' }>>({});
  const [start, setStart] = useState(''), [rate, setRate] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [line, setLine] = useState(''), [correction, setCorrection] = useState(''), [correctionReason, setCorrectionReason] = useState(''), [requestId, setRequestId] = useState('');
  const [payout, setPayout] = useState(''), [method, setMethod] = useState<'cash' | 'bank'>('cash'), [date, setDate] = useState(''), [reference, setReference] = useState(''), [payoutVerified, setPayoutVerified] = useState(false);
  const readVersion = useRef(0), mutation = useRef(false);
  const errorMessage = (code: string) => ({
    denied: t('Access is unavailable. Check your account and current permission.', 'الصلاحية غير متاحة. تحقق من الحساب والصلاحية الحالية.'),
    invalid: t('Check the entered values.', 'تحقق من البيانات المدخلة.'),
    conflict: t('The saved information changed. Review the current details.', 'تغيرت البيانات المحفوظة. راجع التفاصيل الحالية.'),
    review_required: t('The reviewed information changed. Prepare the earnings again.', 'تغيرت البيانات التي راجعتها. أعد تجهيز المستحقات.'),
    limited: t('Too many requests. Wait briefly and retry.', 'طلبات كثيرة. انتظر قليلاً وحاول مجدداً.'),
    unknown: t('The outcome is unknown. Check the original operation before submitting another.', 'النتيجة غير معروفة. تحقق من العملية الأصلية قبل إرسال عملية أخرى.'),
    recovery: t('The recovery reference cannot be read. Keep this tab open and contact support.', 'تعذرت قراءة مرجع الاستعادة. أبقِ الصفحة مفتوحة واتصل بالدعم.'),
    storage: t('The recovery reference could not be saved. Nothing was submitted.', 'تعذر حفظ مرجع الاستعادة. لم يُرسل شيء.'),
  })[code] ?? t('Could not load or confirm the operation. Try again.', 'تعذر تحميل العملية أو تأكيدها. حاول مجدداً.');
  const load = useCallback(async (append = false) => {
    const version = ++readVersion.current;
    const after = append ? context?.next : null;
    if (append && !after) return;
    setBusy(true); setError('');
    try {
      const result = await api<Context>(academy, { action: 'context', view: role, month, ...(staff && !trainer ? { staff } : {}), ...(after ? { after } : {}) });
      if (result.role !== role || !Array.isArray(result.staff) || !Array.isArray(result.events) || !Array.isArray(result.terms)) throw new Failure('unavailable');
      if (version !== readVersion.current) return;
      setContext(previous => append && previous ? { ...result, events: [...previous.events, ...result.events] } : result);
      if (!append) setCoverage({});
    } catch (cause) {
      if (version !== readVersion.current) return;
      const code = cause instanceof Failure ? cause.code : 'unavailable';
      if (code === 'denied' || !append) setContext(null);
      setError(code);
    } finally { if (version === readVersion.current) setBusy(false); }
  }, [academy, role, month, staff, trainer, context?.next]);
  useEffect(() => {
    let live = true;
    Promise.resolve().then(() => {
      if (!live) return;
      try { setPending(readOriginal(key)); } catch { setRecoveryBlocked(true); }
      setRecoveryReady(true);
    });
    return () => { live = false; };
  }, [key]);
  useEffect(() => {
    let live = true;
    const versionRef = readVersion;
    Promise.resolve().then(() => { if (live) void load(); });
    return () => { live = false; versionRef.current++; };
  }, [academy, role, month, staff]); // eslint-disable-line react-hooks/exhaustive-deps
  async function command(action: string, fields: Record<string, unknown>) {
    if (busy || pending || !recoveryReady || recoveryBlocked || mutation.current) return;
    const original = { operation: crypto.randomUUID() };
    try {
      const value = JSON.stringify(original);
      sessionStorage.setItem(key, value);
      if (sessionStorage.getItem(key) !== value) throw Error();
    } catch { setError('storage'); return; }
    mutation.current = true; setPending(original); setBusy(true); setError(''); setNotice('');
    try {
      await api(academy, { action, ...original, ...fields });
      sessionStorage.removeItem(key); setPending(null); setNotice(t('Operation confirmed.', 'تم تأكيد العملية.'));
      if (action === 'payout') { setPayout(''); setReference(''); setPayoutVerified(false); }
      setBusy(false); mutation.current = false;
      await load();
    } catch (cause) {
      const code = cause instanceof Failure ? cause.code : 'unavailable';
      if (['denied', 'invalid', 'conflict', 'review_required', 'limited', 'setup_required'].includes(code)) {
        sessionStorage.removeItem(key); setPending(null);
        if (code === 'denied') setContext(null);
        setError(code);
      } else setError('unknown');
      setBusy(false); mutation.current = false;
    }
  }
  async function reconcile() {
    if (!pending || busy || mutation.current) return;
    mutation.current = true; setBusy(true); setError('');
    try {
      const result = await api<{ id?: string; action?: string; cancelled?: boolean }>(academy, { action: 'operation', ...pending });
      if (!result.cancelled && (!result.id || !result.action)) throw new Failure('unavailable');
      sessionStorage.removeItem(key); setPending(null);
      setNotice(result.cancelled ? t('The original operation was cancelled. Review the retained input before submitting again.', 'أُلغيت العملية الأصلية. راجع البيانات قبل إعادة الإرسال.') : t('Original operation confirmed.', 'تم تأكيد العملية الأصلية.'));
      setBusy(false); mutation.current = false;
      await load();
    } catch (cause) { const code = cause instanceof Failure ? cause.code : 'unavailable'; if (code === 'denied') setContext(null); setError(code); setBusy(false); mutation.current = false; }
  }
  const view = trainer ? 'trainer/compensation' : 'trainer-compensation';
  const title = trainer ? t('My earnings', 'مستحقاتي') : t('Trainer earnings', 'مستحقات المدربين');
  const canAct = Boolean(context) && recoveryReady && !recoveryBlocked && !busy && !pending;
  const run = context?.run;
  const statusLabel = (status: string) => ({
    present: t('Present', 'حاضر'), absent: t('Absent', 'غائب'),
    completed: t('Completed', 'مكتملة'), scheduled: t('Scheduled', 'مجدولة'), cancelled: t('Cancelled', 'ملغاة'),
    draft: t('Ready for review', 'جاهزة للمراجعة'), approved: t('Approved', 'معتمدة'),
    pending: t('Pending', 'قيد المراجعة'), resolved: t('Resolved', 'تمت المعالجة'),
  })[status] ?? status;
  return <WorkspaceShell role={context?.role ?? 'workspace'} module="operations" locale={locale}
    context={context ? (trainer ? t('Trainer workspace', 'مساحة المدرب') : t('Academy Owner workspace', 'مساحة مالك الأكاديمية')) : t('Academy workspace', 'مساحة الأكاديمية')}
    title={title} homeHref={`/${locale}/workspace`} languageHref={`/${ar ? 'en' : 'ar'}/workspace/${academy}/${view}`}
    navigation={[{ href: `/${locale}/workspace/${academy}/${view}`, label: title, current: true }]} account={<UserButton />}>
    <main className="journey-card" style={{ maxWidth: '76rem', padding: '1.5rem' }}>
      <h1>{title}</h1>
      <p>{t('Synthetic trial amounts use fictional units.', 'المبالغ التجريبية بوحدات افتراضية.')}</p>
      {recoveryBlocked && <p role="alert">{errorMessage('recovery')}</p>}
      {error && <p role="alert">{errorMessage(error)}</p>}
      {notice && <p role="status">{notice}</p>}
      {busy && <p role="status">{t('Loading or saving…', 'جارٍ التحميل أو الحفظ…')}</p>}
      {pending && <section role="status"><p>{t('An original operation needs confirmation. Do not submit it again.', 'تحتاج العملية الأصلية إلى تأكيد. لا ترسلها مرة أخرى.')}</p><Button disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'تحقق من العملية الأصلية')}</Button></section>}
      {error && !pending && <Button disabled={busy} onClick={() => void load()}>{t('Reload earnings', 'إعادة تحميل المستحقات')}</Button>}
      <label>{t('Month', 'الشهر')} <Input type="month" value={month} disabled={busy || !!pending} onChange={e => { setContext(null); setMonth(e.target.value); }} /></label>
      {context && <>
        {!trainer && <label>{t('Trainer', 'المدرب')} <Select value={staff} disabled={busy || !!pending} onChange={e => { setContext(null); setStaff(e.target.value); }}><option value="">{t('Select a trainer', 'اختر مدرباً')}</option>{context.staff.map(item => <option key={item.id} value={item.id}>{item.name} · {item.branch}</option>)}</Select></label>}
        <p>{t('Academy time zone', 'المنطقة الزمنية للأكاديمية')}: {context.timezone}</p>
        {!trainer && <section><h2>{t('Staff attendance', 'حضور المدربين')}</h2>
          {context.events.map(event => {
            const entry = coverage[event.id] ?? { staff: event.coverage?.staff ?? event.assigned ?? '', status: event.coverage?.status ?? 'present' };
            return <article className="journey-card" key={event.id}>
              <h3>{event.name} · {event.day}</h3>
              <p>{t('Scheduled trainer', 'المدرب المجدول')}: {event.assignedName ?? t('Unassigned', 'غير معين')} · {t('Branch', 'الفرع')}: {event.branch} · {t('Session status', 'حالة الجلسة')}: {statusLabel(event.status)} · {sessionTime(locale, context.timezone, event.startsAt, event.endsAt).time}</p>
              <p>{t('Saved attendance', 'الحضور المحفوظ')}: {event.coverage ? `${statusLabel(event.coverage.status)} · ${event.coverage.version}` : t('Unverified', 'غير متحقق')}{event.coverage?.stale && ` · ${t('Session changed. Verify attendance again.', 'تغيرت الجلسة. تحقق من الحضور مجدداً.')}`}</p>
              {event.coverage?.staff && <p>{t('Saved actual trainer', 'المدرب الفعلي المحفوظ')}: {context.staff.find(person => person.id === event.coverage?.staff)?.name ?? t('Unavailable', 'غير متاح')}</p>}
              <label>{t('Attendance status', 'حالة الحضور')} <Select value={entry.status} disabled={!canAct} onChange={e => setCoverage(v => ({ ...v, [event.id]: { ...entry, status: e.target.value as 'present' | 'absent' } }))}><option value="present">{t('Present', 'حاضر')}</option><option value="absent">{t('Absent', 'غائب')}</option></Select></label>
              {entry.status === 'present' && <label>{t('Actual trainer', 'المدرب الفعلي')} <Select value={entry.staff} disabled={!canAct} onChange={e => setCoverage(v => ({ ...v, [event.id]: { ...entry, staff: e.target.value } }))}><option value="">{t('Select a trainer', 'اختر مدرباً')}</option>{context.staff.map(person => <option key={person.id} value={person.id}>{person.name} · {person.branch}</option>)}</Select></label>}
              <Button disabled={!canAct || event.status !== 'completed' || (entry.status === 'present' && !entry.staff)} onClick={() => void command('coverage', { event: event.id, staff: entry.status === 'present' ? entry.staff : null, status: entry.status, version: event.coverage?.version ?? 0 })}>{t('Save attendance', 'حفظ الحضور')}</Button>
            </article>;
          })}
          {context.next && <Button disabled={!canAct} onClick={() => void load(true)}>{t('More sessions', 'المزيد من الجلسات')}</Button>}
        </section>}
        {!trainer && staff && <section><h2>{t('Effective contract', 'العقد الساري')}</h2>
          {context.terms.map(term => <p key={term.id}>{term.start} · {money(term.rate)}</p>)}
          <label>{t('Effective from', 'ساري من')} <Input type="date" value={start} disabled={!canAct} onChange={e => setStart(e.target.value)} /></label>
          <label>{t('Session rate', 'أجر الجلسة')} <Input inputMode="decimal" value={rate} disabled={!canAct} onChange={e => setRate(e.target.value)} /></label>
          <Button disabled={!canAct || !start || !Number.isSafeInteger(minor(rate))} onClick={() => void command('terms', { staff, start, rate: minor(rate) })}>{t('Save terms', 'حفظ شروط العقد')}</Button>
          <h2>{t('Prepare earnings', 'تجهيز المستحقات')}</h2>
          <Button disabled={!canAct || !month} onClick={() => void command('prepare', { staff, month })}>{t('Prepare earnings', 'تجهيز المستحقات')}</Button>
        </section>}
        {run && <section><h2>{t('Earnings statement', 'كشف المستحقات')}</h2>
          <p>{t('Status', 'الحالة')}: {statusLabel(run.status)} · {t('Session earnings', 'مستحقات الجلسات')}: <bdi>{money(run.total)}</bdi></p>
          {run.status === 'approved' && <p>
            {t('Approved after corrections', 'المعتمد بعد التصحيحات')}: <bdi>{money(run.approved)}</bdi> · {t('Paid', 'المدفوع')}: <bdi>{money(run.payouts.reduce((sum, item) => sum + item.amount, 0))}</bdi> · {t('Still owed', 'المتبقي للدفع')}: <bdi>{money(run.payable)}</bdi>
          </p>}
          {run.stale && <p role="status">{t('Attendance changed. Prepare earnings again before approval.', 'تغيّر الحضور. أعد تجهيز المستحقات قبل الاعتماد.')}</p>}
          <table><thead><tr><th>{t('Session', 'الجلسة')}</th><th>{t('Date', 'التاريخ')}</th><th>{t('Effective from', 'ساري من')}</th><th>{t('Amount', 'المبلغ')}</th></tr></thead><tbody>{run.lines.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.day}</td><td>{item.start}</td><td>{money(item.amount)}</td></tr>)}</tbody></table>
          {run.adjustments.map(item => <p key={item.id}>{t('Adjustment', 'التسوية')}: {money(item.amount)}</p>)}
          {run.payouts.map(item => <p key={item.id}>{t('Payout', 'الدفعة')}: {money(item.amount)} · {item.date} · {item.method === 'bank' ? t('Bank transfer', 'تحويل بنكي') : t('Cash', 'نقداً')}</p>)}
          {run.requests.map(item => <p key={item.id}>{t('Correction request', 'طلب التصحيح')}: {statusLabel(item.status)} · {item.reason}</p>)}
          {!trainer && run.status !== 'approved' && <section><label>{t('Approval reason', 'سبب الاعتماد')} <Input value={approvalReason} disabled={!canAct || run.stale} onChange={e => setApprovalReason(e.target.value)} /></label><Button disabled={!canAct || run.stale || !approvalReason.trim()} onClick={() => void command('approve', { run: run.id, review: run.review, reason: approvalReason.trim() })}>{t('Approve earnings', 'اعتماد المستحقات')}</Button></section>}
          {run.status === 'approved' && <section><h3>{t('Corrections', 'التصحيحات')}</h3>
            <label>{t('Earning line', 'بند المستحقات')} <Select value={line} disabled={!canAct} onChange={e => { setLine(e.target.value); setRequestId(''); }}><option value="">{t('Select an earning', 'اختر بنداً')}</option>{run.lines.map(item => <option key={item.id} value={item.id}>{item.day} · {item.name} · {money(item.amount)}</option>)}</Select></label>
            {!trainer && <label>{t('Correction amount', 'مبلغ التصحيح')} <Input inputMode="decimal" value={correction} disabled={!canAct} onChange={e => setCorrection(e.target.value)} /></label>}
            <label>{t('Correction reason', 'سبب التصحيح')} <Input value={correctionReason} disabled={!canAct} onChange={e => setCorrectionReason(e.target.value)} /></label>
            {trainer ? <Button disabled={!canAct || !line || !correctionReason.trim()} onClick={() => void command('request', { line, reason: correctionReason.trim() })}>{t('Request correction', 'طلب تصحيح')}</Button> : <>
              {run.requests.length > 0 && <label>{t('Correction request', 'طلب التصحيح')} <Select value={requestId} disabled={!canAct} onChange={e => setRequestId(e.target.value)}><option value="">{t('None', 'بدون')}</option>{run.requests.filter(item => item.status === 'pending' && item.line === line).map(item => <option key={item.id} value={item.id}>{item.reason}</option>)}</Select></label>}
              <Button disabled={!canAct || !line || !correctionReason.trim() || !Number.isSafeInteger(minor(correction, true))} onClick={() => void command('adjust', { line, amount: minor(correction, true), reason: correctionReason.trim(), ...(requestId ? { request: requestId } : {}) })}>{t('Post correction', 'ترحيل التصحيح')}</Button>
            </>}
          </section>}
          {!trainer && run.status === 'approved' && run.payable > 0 && <section><h3>{t('Record a verified payout', 'تسجيل دفعة متحقق منها')}</h3>
            <label>{t('Payout amount', 'مبلغ الدفعة')} <Input inputMode="decimal" value={payout} disabled={!canAct} onChange={e => setPayout(e.target.value)} /></label>
            <label>{t('Payout method', 'طريقة الدفع')} <Select value={method} disabled={!canAct} onChange={e => setMethod(e.target.value as 'cash' | 'bank')}><option value="cash">{t('Cash', 'نقداً')}</option><option value="bank">{t('Bank transfer', 'تحويل بنكي')}</option></Select></label>
            <label>{t('Payout date', 'تاريخ الدفع')} <Input type="date" value={date} disabled={!canAct} onChange={e => setDate(e.target.value)} /></label>
            <label>{t('Payout reference', 'مرجع الدفعة')} <Input value={reference} disabled={!canAct} onChange={e => setReference(e.target.value)} /></label>
            <label><input type="checkbox" checked={payoutVerified} disabled={!canAct} onChange={e => setPayoutVerified(e.target.checked)} /> {t('I verified this fictional payout', 'تحققت من هذه الدفعة الافتراضية')}</label>
            {minor(payout) > run.payable && <p role="status">{t('The payout exceeds the outstanding balance.', 'مبلغ الدفعة يتجاوز الرصيد المتبقي.')}</p>}
            <Button disabled={!canAct || !payoutVerified || !date || !Number.isSafeInteger(minor(payout)) || minor(payout) > run.payable || (method === 'bank' && !reference.trim())} onClick={() => void command('payout', { run: run.id, amount: minor(payout), method, date, reference: reference.trim() })}>{t('Record payout', 'تسجيل الدفعة')}</Button>
          </section>}
        </section>}
      </>}
    </main>
  </WorkspaceShell>;
}
