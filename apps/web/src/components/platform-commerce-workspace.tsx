'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button, Input, Select } from './ui/controls';

type View = 'platform' | 'owner';
type Plan = { id: string; version: number; price: number; trialDays: number; programLimit: number };
type Subscription = {
  id: string; plan: string; planVersion: number; trialStart: string; trialEnd: string; periodStart: string;
  periodEnd: string; due: string; graceEnd: string; status: string; programCount: number;
  programLimit: number; price: number;
};
type Invoice = { id: string; amount: number; paid: number; balance: number; issuedOn: string; due: string; periodStart: string; periodEnd: string };
type Claim = { id: string; amount: number; reference: string; state: string; version: number; submittedOn: string; reason: string | null };
type Context = { role: View; academies: { id: string; name: string; setup: boolean }[]; plans: Plan[]; subscription: Subscription | null; invoice: Invoice | null; claims: Claim[] };
type Original = { operation: string; academy?: string };
type Props = { locale: string; view: View; academy?: string };
class Failure extends Error { constructor(public code: string) { super(code); } }

const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
const formatMoney = (amount: number) => (amount / 100).toFixed(2);

async function api<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/platform-commerce', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    signal: AbortSignal.timeout(15000), body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !Object.hasOwn(result, 'data')) throw new Failure(typeof result.error === 'string' ? result.error : 'unavailable');
  return result.data as T;
}

function originalFromStorage(key: string): Original | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    const item = value as Record<string, unknown>;
    if (Object.keys(item).some(field => !['operation', 'academy'].includes(field)) ||
        typeof item.operation !== 'string' || !uuid.test(item.operation) ||
        (item.academy !== undefined && (typeof item.academy !== 'string' || !uuid.test(item.academy)))) throw Error();
    return { operation: item.operation, ...(typeof item.academy === 'string' ? { academy: item.academy } : {}) };
  } catch { throw new Failure('recovery'); }
}

export default function PlatformCommerceWorkspace(props: Props) {
  const { isLoaded, user } = useUser();
  const ar = props.locale === 'ar';
  if (!isLoaded || !user) return <PublicWorkspace locale={props.locale} title={ar ? 'فوترة المنصة' : 'Platform billing'}>
    <p role={isLoaded ? 'alert' : 'status'}>{isLoaded ? (ar ? 'يرجى تسجيل الدخول.' : 'Please sign in.') : (ar ? 'جارٍ التحميل…' : 'Loading…')}</p>
  </PublicWorkspace>;
  return <Commerce key={`${user.id}:${props.view}:${props.academy ?? 'platform'}`} {...props} subject={user.id} />;
}

function Commerce({ locale, view, academy: ownerAcademy, subject }: Props & { subject: string }) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const platform = view === 'platform';
  const title = platform ? t('Platform billing', 'فوترة المنصة') : t('Academy plan', 'خطة الأكاديمية');
  const key = `academyos:platform-commerce:${subject}:${view}:${ownerAcademy ?? 'platform'}`;
  const [academy, setAcademy] = useState(ownerAcademy ?? '');
  const [context, setContext] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<Original | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryBlocked, setRecoveryBlocked] = useState(false);
  const [plan, setPlan] = useState('');
  const [start, setStart] = useState('');
  const [reference, setReference] = useState('');
  const [claimId, setClaimId] = useState('');
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [reviewReason, setReviewReason] = useState('');
  const [verified, setVerified] = useState(false);
  const version = useRef(0);
  const mutation = useRef(false);

  const errorMessage = (code: string) => ({
    denied: t('Access is unavailable. Check your account and current permission.', 'الصلاحية غير متاحة. تحقق من الحساب والصلاحية الحالية.'),
    invalid: t('Check the entered values.', 'تحقق من البيانات المدخلة.'),
    conflict: t('The saved information changed. Review the current details.', 'تغيرت البيانات المحفوظة. راجع التفاصيل الحالية.'),
    review_required: t('The reviewed information changed. Refresh and review it again.', 'تغيرت البيانات التي راجعتها. حدّث الصفحة وراجعها مجدداً.'),
    limited: t('Too many requests. Wait briefly and retry.', 'طلبات كثيرة. انتظر قليلاً وحاول مجدداً.'),
    setup_required: t('Complete the academy setup first.', 'أكمل إعداد الأكاديمية أولاً.'),
    unknown: t('The outcome is unknown. Check the original operation before submitting another.', 'النتيجة غير معروفة. تحقق من العملية الأصلية قبل إرسال عملية أخرى.'),
    recovery: t('The recovery reference cannot be read. Keep this tab open and contact support.', 'تعذرت قراءة مرجع الاستعادة. أبقِ الصفحة مفتوحة واتصل بالدعم.'),
    storage: t('The recovery reference could not be saved. Nothing was submitted.', 'تعذر حفظ مرجع الاستعادة. لم يُرسل شيء.'),
  })[code] ?? t('Could not load or confirm the operation. Try again.', 'تعذر تحميل العملية أو تأكيدها. حاول مجدداً.');

  const load = useCallback(async () => {
    const current = ++version.current;
    setBusy(true); setError('');
    try {
      const result = await api<Context>({ action: 'context', view, ...(academy ? { academy } : {}) });
      if (result.role !== view || !Array.isArray(result.academies) || !Array.isArray(result.plans) || !Array.isArray(result.claims)) throw new Failure('unavailable');
      if (current === version.current) setContext(result);
    } catch (cause) {
      if (current !== version.current) return;
      setContext(null);
      setError(cause instanceof Failure ? cause.code : 'unavailable');
    } finally { if (current === version.current) setBusy(false); }
  }, [academy, view]);

  useEffect(() => {
    let live = true;
    Promise.resolve().then(() => {
      if (!live) return;
      try {
        const original = originalFromStorage(key);
        setPending(original);
        if (original?.academy && platform) setAcademy(original.academy);
      } catch { setRecoveryBlocked(true); }
      setRecoveryReady(true);
    });
    return () => { live = false; };
  }, [key, platform]);

  useEffect(() => {
    let live = true;
    const readVersion = version;
    Promise.resolve().then(() => { if (live) void load(); });
    return () => { live = false; readVersion.current++; };
  }, [load]);

  async function command(action: string, fields: Record<string, unknown>, scope = academy) {
    if (busy || pending || !recoveryReady || recoveryBlocked || mutation.current) return;
    const original: Original = { operation: crypto.randomUUID(), ...(scope ? { academy: scope } : {}) };
    try {
      const value = JSON.stringify(original);
      sessionStorage.setItem(key, value);
      if (sessionStorage.getItem(key) !== value) throw Error();
    } catch { setError('storage'); return; }
    mutation.current = true; setPending(original); setBusy(true); setError(''); setNotice('');
    try {
      await api({ action, ...original, ...fields });
      sessionStorage.removeItem(key); setPending(null);
      setNotice(t('Operation confirmed.', 'تم تأكيد العملية.'));
      if (action === 'claim') setReference('');
      if (action === 'review') { setReviewReason(''); setClaimId(''); setVerified(false); }
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
      const result = await api<{ id?: string; action?: string; cancelled?: boolean }>({ action: 'operation', ...pending });
      if (!result.cancelled && (!result.id || !result.action)) throw new Failure('unavailable');
      sessionStorage.removeItem(key); setPending(null);
      setNotice(result.cancelled
        ? t('The original operation was cancelled. Review the retained input before submitting again.', 'أُلغيت العملية الأصلية. راجع البيانات قبل إعادة الإرسال.')
        : t('Original operation confirmed.', 'تم تأكيد العملية الأصلية.'));
      setBusy(false); mutation.current = false;
      await load();
    } catch (cause) {
      const code = cause instanceof Failure ? cause.code : 'unavailable';
      if (code === 'denied') setContext(null);
      setError(code); setBusy(false); mutation.current = false;
    }
  }

  const allowed = Boolean(context) && recoveryReady && !recoveryBlocked && !busy && !pending;
  const nextVersion = !context?.plans.some(item => item.version === 1) ? 1
    : !context.plans.some(item => item.version === 2) ? 2 : null;
  const selectedClaim = context?.claims.find(claim => claim.id === claimId && claim.state === 'pending');
  const claimPending = context?.claims.some(claim => claim.state === 'pending');
  const labels: Record<string, string> = {
    scheduled: t('Scheduled', 'مجدولة'), trial: t('Trial', 'تجريبية'), due: t('Due', 'مستحقة'),
    grace: t('Grace period', 'فترة السماح'), restricted: t('Restricted', 'مقيدة'), active: t('Active', 'نشطة'),
    pending: t('Pending review', 'بانتظار المراجعة'), accepted: t('Accepted', 'مقبولة'), rejected: t('Rejected', 'مرفوضة'),
  };
  const base = platform ? `/${locale}/platform/commerce` : `/${locale}/workspace/${ownerAcademy}/platform-plan`;
  const other = platform ? `/${ar ? 'en' : 'ar'}/platform/commerce` : `/${ar ? 'en' : 'ar'}/workspace/${ownerAcademy}/platform-plan`;

  return <WorkspaceShell role={context ? view : 'workspace'} module="operations" locale={locale}
    context={context ? (platform ? t('Platform workspace', 'مساحة المنصة') : t('Academy Owner workspace', 'مساحة مالك الأكاديمية')) : t('Academy workspace', 'مساحة الأكاديمية')}
    title={title} homeHref={platform ? `/${locale}/platform` : `/${locale}/workspace`} languageHref={other}
    navigation={platform ? [
      { href: `/${locale}/platform`, label: t('Academy admission', 'قبول الأكاديمية') },
      { href: base, label: title, current: true },
    ] : [{ href: base, label: title, current: true }]} account={<UserButton />}>
    <main className="journey-card" style={{ maxWidth: '76rem', padding: '1.5rem' }}>
      <h1>{title}</h1>
      <p>{t('Synthetic trial amounts use fictional units.', 'المبالغ التجريبية بوحدات افتراضية.')}</p>
      {recoveryBlocked && <p role="alert">{errorMessage('recovery')}</p>}
      {error && <p role="alert">{errorMessage(error)}</p>}
      {notice && <p role="status">{notice}</p>}
      {busy && <p role="status">{t('Loading or saving…', 'جارٍ التحميل أو الحفظ…')}</p>}
      {pending && <section role="status"><p>{t('An original operation needs confirmation. Do not submit it again.', 'تحتاج العملية الأصلية إلى تأكيد. لا ترسلها مرة أخرى.')}</p><Button disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'تحقق من العملية الأصلية')}</Button></section>}
      {error && !pending && <Button disabled={busy} onClick={() => void load()}>{t('Reload billing', 'إعادة تحميل الفوترة')}</Button>}
      {context && <>
        {platform && <>
          <section><h2>{t('Plan catalog', 'كتالوج الخطط')}</h2>
            {context.plans.map(item => <p key={item.id}>{t('Plan version', 'إصدار الخطة')} {item.version} · {formatMoney(item.price)} · {item.trialDays} {t('trial days', 'يوماً تجريبياً')} · {item.programLimit} {t('programs', 'برامج')}</p>)}
            {nextVersion === 1 && <Button disabled={!allowed} onClick={() => void command('publish_plan', {}, '')}>{t('Publish fictional plan', 'نشر الخطة الافتراضية')}</Button>}
            {nextVersion === 2 && <>
              <p>{t('Version 2: 1,000.00 monthly · 14 trial days · 3 programs. Existing agreements stay unchanged.', 'الإصدار 2: 1,000.00 شهرياً · 14 يوماً تجريبياً · 3 برامج. تبقى الاتفاقيات الحالية دون تغيير.')}</p>
              <Button disabled={!allowed} onClick={() => void command('publish_plan', { version: 2 }, '')}>{t('Publish version 2', 'نشر الإصدار 2')}</Button>
            </>}
          </section>
          <label>{t('Academy', 'الأكاديمية')} <Select value={academy} disabled={!allowed} onChange={event => { setContext(null); setAcademy(event.target.value); setPlan(''); setClaimId(''); }}>
            <option value="">{t('Select an academy', 'اختر أكاديمية')}</option>
            {context.academies.map(item => <option key={item.id} value={item.id}>{item.name}{!item.setup ? t(' · setup incomplete', ' · الإعداد غير مكتمل') : ''}</option>)}
          </Select></label>
          {academy && !context.subscription && <section><h2>{t('Assign a plan', 'تعيين خطة')}</h2>
            <label>{t('Plan version', 'إصدار الخطة')} <Select value={plan} disabled={!allowed} onChange={event => setPlan(event.target.value)}>
              <option value="">{t('Select a plan', 'اختر خطة')}</option>
              {context.plans.map(item => <option key={item.id} value={item.id}>{item.version} · {formatMoney(item.price)}</option>)}
            </Select></label>
            <label>{t('Trial start', 'بداية الفترة التجريبية')} <Input type="date" value={start} disabled={!allowed} onChange={event => setStart(event.target.value)} /></label>
            <Button disabled={!allowed || !plan || !start} onClick={() => void command('assign', { plan, start })}>{t('Assign plan', 'تعيين الخطة')}</Button>
          </section>}
        </>}
        {!platform && !context.subscription && <p>{t('No plan has been assigned to this academy yet.', 'لم تُعيَّن خطة لهذه الأكاديمية بعد.')}</p>}
        {context.subscription && <section><h2>{t('Current plan', 'الخطة الحالية')}</h2>
          <p>{t('Status', 'الحالة')}: {labels[context.subscription.status] ?? context.subscription.status}</p>
          <p>{t('Monthly price', 'السعر الشهري')}: {formatMoney(context.subscription.price)}</p>
          <p>{t('Agreed offer version', 'إصدار العرض المتفق عليه')}: {context.subscription.planVersion}</p>
          <p>{t('Trial', 'الفترة التجريبية')}: <bdi>{context.subscription.trialStart} – {context.subscription.trialEnd}</bdi></p>
          <p>{t('Billing period', 'فترة الفوترة')}: <bdi>{context.subscription.periodStart} – {context.subscription.periodEnd}</bdi></p>
          <p>{t('Due date', 'تاريخ الاستحقاق')}: <bdi>{context.subscription.due}</bdi> · {t('Grace ends', 'نهاية السماح')}: <bdi>{context.subscription.graceEnd}</bdi></p>
          <p>{t('Training programs', 'برامج التدريب')}: {context.subscription.programCount} / {context.subscription.programLimit}</p>
          {context.subscription.status === 'restricted' && <p>{t('New registrations, programs and publications are paused. Existing attendance, billing and recovery remain available.', 'توقفت التسجيلات والبرامج والمنشورات الجديدة مؤقتاً. يظل الحضور الحالي والفوترة والاستعادة متاحين.')}</p>}
          {platform && !context.invoice && <Button disabled={!allowed} onClick={() => void command('issue', { subscription: context.subscription?.id })}>{t('Issue invoice', 'إصدار الفاتورة')}</Button>}
        </section>}
        {context.invoice && <section><h2>{t('Invoice', 'الفاتورة')}</h2>
          <p>{t('Billing period', 'فترة الفوترة')}: <bdi>{context.invoice.periodStart} – {context.invoice.periodEnd}</bdi></p>
          <p>{t('Issued', 'تاريخ الإصدار')}: <bdi>{context.invoice.issuedOn}</bdi> · {t('Due date', 'تاريخ الاستحقاق')}: <bdi>{context.invoice.due}</bdi></p>
          <p>{t('Amount', 'المبلغ')}: {formatMoney(context.invoice.amount)} · {t('Paid', 'المدفوع')}: {formatMoney(context.invoice.paid)} · {t('Balance', 'المتبقي')}: {formatMoney(context.invoice.balance)}</p>
          {!platform && context.invoice.balance > 0 && (claimPending
            ? <p role="status">{t('Your payment claim is awaiting review. The balance updates after the Platform Owner verifies the payment.', 'طلب الدفع قيد المراجعة. يتحدّث الرصيد بعد أن يتحقق مالك المنصة من الدفع.')}</p>
            : <section><h3>{t('Submit a bank payment claim', 'تقديم طلب دفع بنكي')}</h3>
            <p>{t('Claim amount', 'مبلغ الطلب')}: {formatMoney(context.invoice.balance)}</p>
            <label>{t('Bank reference', 'المرجع البنكي')} <Input value={reference} maxLength={120} disabled={!allowed} onChange={event => setReference(event.target.value)} /></label>
            <Button disabled={!allowed || !reference.trim()} onClick={() => void command('claim', { invoice: context.invoice?.id, amount: context.invoice?.balance, reference: reference.trim() })}>{t('Submit claim', 'تقديم الطلب')}</Button>
          </section>)}
        </section>}
        {academy && context.claims.length > 0 && <section><h2>{t('Payment claims', 'طلبات الدفع')}</h2>
          {context.claims.map(claim => <article key={claim.id}>
            <p>{t('Amount', 'المبلغ')}: {formatMoney(claim.amount)} · {t('Bank reference', 'المرجع البنكي')}: <bdi>{claim.reference}</bdi></p>
            <p>{t('Submitted', 'تاريخ التقديم')}: <bdi>{claim.submittedOn}</bdi> · {labels[claim.state] ?? claim.state}{claim.reason && <> · {t('Review reason', 'سبب المراجعة')}: {claim.reason}</>}</p>
          </article>)}
          {platform && claimPending && <>
            <label>{t('Claim to review', 'الطلب المراد مراجعته')} <Select value={claimId} disabled={!allowed} onChange={event => { setClaimId(event.target.value); setVerified(false); }}>
              <option value="">{t('Select a claim', 'اختر طلباً')}</option>
              {context.claims.filter(claim => claim.state === 'pending').map(claim => <option key={claim.id} value={claim.id}>{formatMoney(claim.amount)} · {claim.reference}</option>)}
            </Select></label>
            <label>{t('Decision', 'القرار')} <Select value={decision} disabled={!allowed} onChange={event => { setDecision(event.target.value as 'accepted' | 'rejected'); setVerified(false); }}>
              <option value="accepted">{t('Accept', 'قبول')}</option><option value="rejected">{t('Reject', 'رفض')}</option>
            </Select></label>
            <label>{t('Review reason', 'سبب المراجعة')} <Input value={reviewReason} maxLength={300} disabled={!allowed} onChange={event => setReviewReason(event.target.value)} /></label>
            <label><input type="checkbox" checked={verified} disabled={!allowed} onChange={event => setVerified(event.target.checked)} /> {t('I reviewed this fictional claim', 'راجعت طلب الدفع الافتراضي')}</label>
            <Button disabled={!allowed || !selectedClaim || !reviewReason.trim() || !verified} onClick={() => {
              if (selectedClaim) void command('review', { claim: selectedClaim.id, version: selectedClaim.version, decision, reason: reviewReason.trim() });
            }}>{t('Confirm review', 'تأكيد المراجعة')}</Button>
          </>}
        </section>}
      </>}
    </main>
  </WorkspaceShell>;
}
