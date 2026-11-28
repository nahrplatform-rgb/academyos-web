'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button, Input, Select } from './ui/controls';

type Locale = 'en' | 'ar';
type Plan = { id: string; version: number; price: number; trialDays: number; programLimit: number };
type Academy = { id: string; name: string; setup: boolean };
type Subscription = { id: string; plan: string; planVersion: number; trialStart: string; trialEnd: string; periodStart: string; periodEnd: string; due: string; graceEnd: string; status: string; programCount: number; programLimit: number; price: number };
type Invoice = { id: string; amount: number; paid: number; balance: number; issuedOn: string; due: string; periodStart: string; periodEnd: string };
type Claim = { id: string; amount: number; reference: string; state: string; version: number; submittedOn: string; reason: string | null };
type Context = { role: string; academies: Academy[]; plans: Plan[]; subscription: Subscription | null; invoice: Invoice | null; claims: Claim[] };
type Props = { locale: Locale };


async function api<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/platform-commerce', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    signal: AbortSignal.timeout(15000), body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !Object.hasOwn(result, 'data')) throw new Error(typeof result.error === 'string' ? result.error : 'unavailable');
  return result.data as T;
}

export default function PlatformOwnerCommercialWorkspace({ locale }: Props) {
  const { isLoaded, user } = useUser();
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;

  if (!isLoaded || !user) return <PublicWorkspace locale={locale} title={t('Platform billing', 'فوترة المنصة')}>
    <p role={isLoaded ? 'alert' : 'status'}>{isLoaded ? t('Please sign in.', 'يرجى تسجيل الدخول.') : t('Loading…', 'جارٍ التحميل…')}</p>
  </PublicWorkspace>;

  return <Commerce key={user.id} locale={locale} />;
}

function Commerce({ locale }: Props) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [academy, setAcademy] = useState('');
  const [context, setContext] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [plan, setPlan] = useState('');
  const [start, setStart] = useState('');
  const [claimId, setClaimId] = useState('');
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted');
  const [reviewReason, setReviewReason] = useState('');
  const [verified, setVerified] = useState(false);

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const result = await api<Context>({ action: 'context', view: 'platform', ...(academy ? { academy } : {}) });
      setContext(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'unavailable');
    } finally { setBusy(false); }
  }, [academy]);

  // Loading remote commercial context is an external synchronization effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const labels: Record<string, string> = {
    scheduled: t('Scheduled', 'مجدولة'), trial: t('Trial', 'تجريبية'), due: t('Due', 'مستحقة'),
    grace: t('Grace period', 'فترة السماح'), restricted: t('Restricted', 'مقيدة'), active: t('Active', 'نشطة'),
    pending: t('Pending review', 'بانتظار المراجعة'), accepted: t('Accepted', 'مقبولة'), rejected: t('Rejected', 'مرفوضة'),
  };
  const formatMoney = (amount: number) => (amount / 100).toFixed(2);

  const selectedClaim = context?.claims.find(c => c.id === claimId && c.state === 'pending');
  const claimPending = context?.claims.some(c => c.state === 'pending');

  return <WorkspaceShell role={context ? 'platform' : 'workspace'} module="operations" locale={locale}
    context={context ? t('Platform workspace', 'مساحة المنصة') : t('Academy workspace', 'مساحة الأكاديمية')}
    title={t('Platform billing', 'فوترة المنصة')} homeHref={`/${locale}/platform`} languageHref={`/${ar ? 'en' : 'ar'}/platform/commerce`}
    navigation={[{ href: `/${locale}/platform`, label: t('Academy admission', 'قبول الأكاديمية') },
      { href: `/${locale}/platform/commerce`, label: t('Platform billing', 'فوترة المنصة'), current: true }]}
    account={<UserButton />}>
    <main className="journey-card" style={{ maxWidth: '76rem', padding: '1.5rem' }}>
      <h1>{t('Platform billing', 'فوترة المنصة')}</h1>
      <p>{t('Synthetic trial amounts use fictional units.', 'المبالغ التجريبية بوحدات افتراضية.')}</p>
      {busy && <p role="status">{t('Loading…', 'جارٍ التحميل…')}</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {context && <>
        <section>
          <h2>{t('Plan catalog', 'كتالوج الخطط')}</h2>
          {context.plans.map(item => <p key={item.id}>{t('Plan version', 'إصدار الخطة')} {item.version} · {formatMoney(item.price)} · {item.trialDays} {t('trial days', 'يوماً تجريبياً')} · {item.programLimit} {t('programs', 'برامج')}</p>)}
          <Button disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api({ action: 'publish_plan', operation: crypto.randomUUID(), version: 2 });
              setNotice(t('Plan published.', 'تم نشر الخطة.'));
              await load();
            } catch (e) { setError(e instanceof Error ? e.message : 'unavailable'); }
            finally { setBusy(false); }
          }}>{t('Publish fictional plan', 'نشر الخطة الافتراضية')}</Button>
        </section>

        <label>{t('Academy', 'الأكاديمية')} <Select value={academy} disabled={busy} onChange={e => { setContext(null); setAcademy(e.target.value); }}>
          <option value="">{t('Select an academy', 'اختر أكاديمية')}</option>
          {context.academies.map(item => <option key={item.id} value={item.id}>{item.name}{!item.setup ? t(' · setup incomplete', ' · الإعداد غير مكتمل') : ''}</option>)}
        </Select></label>

        {academy && !context.subscription && <section>
          <h2>{t('Assign a plan', 'تعيين خطة')}</h2>
          <label>{t('Plan version', 'إصدار الخطة')} <Select value={plan} disabled={busy} onChange={e => setPlan(e.target.value)}>
            <option value="">{t('Select a plan', 'اختر خطة')}</option>
            {context.plans.map(item => <option key={item.id} value={item.id}>{item.version} · {formatMoney(item.price)}</option>)}
          </Select></label>
          <label>{t('Trial start', 'بداية الفترة التجريبية')} <Input type="date" value={start} disabled={busy} onChange={e => setStart(e.target.value)} /></label>
          <Button disabled={busy || !plan || !start} onClick={async () => {
            setBusy(true);
            try {
              await api({ action: 'assign', academy, operation: crypto.randomUUID(), plan, start });
              setNotice(t('Plan assigned.', 'تم تعيين الخطة.'));
              await load();
            } catch (e) { setError(e instanceof Error ? e.message : 'unavailable'); }
            finally { setBusy(false); }
          }}>{t('Assign plan', 'تعيين الخطة')}</Button>
        </section>}

        {context.subscription && <section>
          <h2>{t('Current plan', 'الخطة الحالية')}</h2>
          <p>{t('Status', 'الحالة')}: {labels[context.subscription.status] ?? context.subscription.status}</p>
          <p>{t('Monthly price', 'السعر الشهري')}: {formatMoney(context.subscription.price)}</p>
          <p>{t('Agreed offer version', 'إصدار العرض المتفق عليه')}: {context.subscription.planVersion}</p>
          <p>{t('Trial', 'الفترة التجريبية')}: <bdi>{context.subscription.trialStart} – {context.subscription.trialEnd}</bdi></p>
          <p>{t('Billing period', 'فترة الفوترة')}: <bdi>{context.subscription.periodStart} – {context.subscription.periodEnd}</bdi></p>
          <p>{t('Due date', 'تاريخ الاستحقاق')}: <bdi>{context.subscription.due}</bdi> · {t('Grace ends', 'نهاية السماح')}: <bdi>{context.subscription.graceEnd}</bdi></p>
          <p>{t('Training programs', 'برامج التدريب')}: {context.subscription.programCount} / {context.subscription.programLimit}</p>
          {context.subscription.status === 'restricted' && <p>{t('New registrations, programs and publications are paused. Existing attendance, billing and recovery remain available.', 'توقفت التسجيلات والبرامج والمنشورات الجديدة مؤقتاً. يظل الحضور الحالي والفوترة والاستعادة متاحين.')}</p>}
          {!context.invoice && <Button disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              await api({ action: 'issue', academy, operation: crypto.randomUUID(), subscription: context.subscription?.id });
              setNotice(t('Invoice issued.', 'تم إصدار الفاتورة.'));
              await load();
            } catch (e) { setError(e instanceof Error ? e.message : 'unavailable'); }
            finally { setBusy(false); }
          }}>{t('Issue invoice', 'إصدار الفاتورة')}</Button>}
        </section>}

        {context.invoice && <section>
          <h2>{t('Invoice', 'الفاتورة')}</h2>
          <p>{t('Billing period', 'فترة الفوترة')}: <bdi>{context.invoice.periodStart} – {context.invoice.periodEnd}</bdi></p>
          <p>{t('Issued', 'تاريخ الإصدار')}: <bdi>{context.invoice.issuedOn}</bdi> · {t('Due date', 'تاريخ الاستحقاق')}: <bdi>{context.invoice.due}</bdi></p>
          <p>{t('Amount', 'المبلغ')}: {formatMoney(context.invoice.amount)} · {t('Paid', 'المدفوع')}: {formatMoney(context.invoice.paid)} · {t('Balance', 'المتبقي')}: {formatMoney(context.invoice.balance)}</p>
        </section>}

        {academy && context.claims.length > 0 && <section>
          <h2>{t('Payment claims', 'طلبات الدفع')}</h2>
          {context.claims.map(claim => <article key={claim.id}>
            <p>{t('Amount', 'المبلغ')}: {formatMoney(claim.amount)} · {t('Bank reference', 'المرجع البنكي')}: <bdi>{claim.reference}</bdi></p>
            <p>{t('Submitted', 'تاريخ التقديم')}: <bdi>{claim.submittedOn}</bdi> · {labels[claim.state] ?? claim.state}{claim.reason && <> · {t('Review reason', 'سبب المراجعة')}: {claim.reason}</>}</p>
          </article>)}
          {claimPending && <>
            <label>{t('Claim to review', 'الطلب المراد مراجعته')} <Select value={claimId} disabled={busy} onChange={e => { setClaimId(e.target.value); setVerified(false); }}>
              <option value="">{t('Select a claim', 'اختر طلباً')}</option>
              {context.claims.filter(c => c.state === 'pending').map(c => <option key={c.id} value={c.id}>{formatMoney(c.amount)} · {c.reference}</option>)}
            </Select></label>
            <label>{t('Decision', 'القرار')} <Select value={decision} disabled={busy} onChange={e => { setDecision(e.target.value as 'accepted' | 'rejected'); setVerified(false); }}>
              <option value="accepted">{t('Accept', 'قبول')}</option><option value="rejected">{t('Reject', 'رفض')}</option>
            </Select></label>
            <label>{t('Review reason', 'سبب المراجعة')} <Input value={reviewReason} maxLength={300} disabled={busy} onChange={e => setReviewReason(e.target.value)} /></label>
            <label><input type="checkbox" checked={verified} disabled={busy} onChange={e => setVerified(e.target.checked)} /> {t('I reviewed this fictional claim', 'راجعت طلب الدفع الافتراضي')}</label>
            <Button disabled={busy || !selectedClaim || !reviewReason.trim() || !verified} onClick={async () => {
              if (!selectedClaim) return;
              setBusy(true);
              try {
                await api({ action: 'review', academy, operation: crypto.randomUUID(), claim: selectedClaim.id, version: selectedClaim.version, decision, reason: reviewReason.trim() });
                setNotice(t('Review confirmed.', 'تم تأكيد المراجعة.'));
                setClaimId(''); setReviewReason(''); setVerified(false);
                await load();
              } catch (e) { setError(e instanceof Error ? e.message : 'unavailable'); }
              finally { setBusy(false); }
            }}>{t('Confirm review', 'تأكيد المراجعة')}</Button>
          </>}
        </section>}
      </>}
    </main>
  </WorkspaceShell>;
}
