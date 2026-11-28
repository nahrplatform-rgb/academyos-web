'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button, Input } from './ui/controls';

type Locale = 'en' | 'ar';
type Plan = { id: string; version: number; price: number; trialDays: number; programLimit: number; storageLimit: number; playerLimit: number };
type Subscription = {
  id: string; plan: string; planVersion: number; trialStart: string; trialEnd: string; periodStart: string;
  periodEnd: string; due: string; graceEnd: string; status: string; programCount: number;
  programLimit: number; price: number; dunningState: string; dunningStarted: string | null; retryCount: number;
  storageUsed: number; storageLimit: number; playersUsed: number; playersLimit: number;
};
type Invoice = { id: string; amount: number; paid: number; balance: number; issuedOn: string; due: string; periodStart: string; periodEnd: string; status: string };
type Claim = { id: string; amount: number; reference: string; state: string; version: number; submittedOn: string; reason: string | null };
type Context = { role: string; academies: { id: string; name: string; setup: boolean }[]; plans: Plan[]; subscription: Subscription | null; invoice: Invoice | null; claims: Claim[]; entitlements: { features: string[]; limits: Record<string, number>; usage: Record<string, number> } };
type Props = { locale: Locale; academy: string };


async function api<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/platform-commerce', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    signal: AbortSignal.timeout(15000), body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !Object.hasOwn(result, 'data')) throw new Error(typeof result.error === 'string' ? result.error : 'unavailable');
  return result.data as T;
}

export default function AcademyOwnerCommercialWorkspace({ locale, academy }: Props) {
  const { isLoaded, user } = useUser();
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;

  if (!isLoaded || !user) return <PublicWorkspace locale={locale} title={t('Academy plan', 'خطة الأكاديمية')}>
    <p role={isLoaded ? 'alert' : 'status'}>{isLoaded ? t('Please sign in.', 'يرجى تسجيل الدخول.') : t('Loading…', 'جارٍ التحميل…')}</p>
  </PublicWorkspace>;

  return <Commerce locale={locale} key={user.id + ":" + academy} academy={academy} />;
}

function Commerce({ locale, academy }: Props) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [context, setContext] = useState<Context | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedStart, setSelectedStart] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const result = await api<Context>({ action: 'context', view: 'owner', academy });
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
    none: t('Current', 'حالية'), read_only: t('Read-only', 'للقراءة فقط'),
    retention: t('Retention', 'احتفاظ'), archived: t('Archived', 'مؤرشفة'),
  };

  const formatMoney = (amount: number) => (amount / 100).toFixed(2);
  const progressPercent = (used: number, limit: number) => limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return <WorkspaceShell role={context ? 'owner' : 'workspace'} module="operations" locale={locale}
    context={context ? t('Academy Owner workspace', 'مساحة مالك الأكاديمية') : t('Academy workspace', 'مساحة الأكاديمية')}
    title={t('Academy plan', 'خطة الأكاديمية')} homeHref={`/${locale}/workspace`} languageHref={`/${ar ? 'en' : 'ar'}/workspace/${academy}/platform-plan`}
    navigation={[{ href: `/${locale}/workspace/${academy}/platform-plan`, label: t('Academy plan', 'خطة الأكاديمية'), current: true }]}
    account={<UserButton />}>
    <main className="journey-card" style={{ maxWidth: '76rem', padding: '1.5rem' }}>
      <h1>{t('Academy plan', 'خطة الأكاديمية')}</h1>
      <p>{t('Synthetic trial amounts use fictional units.', 'المبالغ التجريبية بوحدات افتراضية.')}</p>
      {busy && <p role="status">{t('Loading…', 'جارٍ التحميل…')}</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {context && <>
        {context.subscription && <>
          <section>
            <h2>{t('Current plan', 'الخطة الحالية')}</h2>
            <p>{t('Status', 'الحالة')}: {labels[context.subscription.status] ?? context.subscription.status}</p>
            <p>{t('Monthly price', 'السعر الشهري')}: {formatMoney(context.subscription.price)}</p>
            <p>{t('Agreed offer version', 'إصدار العرض المتفق عليه')}: {context.subscription.planVersion}</p>
            <p>{t('Trial', 'الفترة التجريبية')}: <bdi>{context.subscription.trialStart} – {context.subscription.trialEnd}</bdi></p>
            <p>{t('Billing period', 'فترة الفوترة')}: <bdi>{context.subscription.periodStart} – {context.subscription.periodEnd}</bdi></p>
            <p>{t('Due date', 'تاريخ الاستحقاق')}: <bdi>{context.subscription.due}</bdi></p>
            {context.subscription.dunningState && context.subscription.dunningState !== 'none' && (
              <p>{t('Payment status', 'حالة الدفع')}: {labels[context.subscription.dunningState] ?? context.subscription.dunningState}
                {context.subscription.dunningStarted && <> · {t('Since', 'منذ')}: <bdi>{context.subscription.dunningStarted}</bdi></>}
                {context.subscription.retryCount > 0 && <> · {t('Retries', 'المحاولات')}: {context.subscription.retryCount}</>}
              </p>
            )}
          </section>

          <section>
            <h2>{t('Usage and limits', 'الاستخدام والحدود')}</h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div>
                <p>{t('Training programs', 'برامج التدريب')}: {context.subscription.programCount} / {context.subscription.programLimit}</p>
                <progress value={progressPercent(context.subscription.programCount, context.subscription.programLimit)} max={100} />
              </div>
              <div>
                <p>{t('Active players', 'اللاعبون النشطون')}: {context.subscription.playersUsed} / {context.subscription.playersLimit}</p>
                <progress value={progressPercent(context.subscription.playersUsed, context.subscription.playersLimit)} max={100} />
              </div>
              <div>
                <p>{t('Storage', 'التخزين')}: {(context.subscription.storageUsed / 1024 / 1024).toFixed(1)} MB / {(context.subscription.storageLimit / 1024 / 1024).toFixed(0)} MB</p>
                <progress value={progressPercent(context.subscription.storageUsed, context.subscription.storageLimit)} max={100} />
              </div>
            </div>
          </section>

          <section>
            <h2>{t('Features', 'الميزات')}</h2>
            <ul>
              {(context.entitlements?.features ?? []).map(f => <li key={f}>{f}</li>)}
            </ul>
          </section>
        </>}

        {context.invoice && <section>
          <h2>{t('Invoice', 'الفاتورة')}</h2>
          <p>{t('Billing period', 'فترة الفوترة')}: <bdi>{context.invoice.periodStart} – {context.invoice.periodEnd}</bdi></p>
          <p>{t('Issued', 'تاريخ الإصدار')}: <bdi>{context.invoice.issuedOn}</bdi> · {t('Due date', 'تاريخ الاستحقاق')}: <bdi>{context.invoice.due}</bdi></p>
          <p>{t('Amount', 'المبلغ')}: {formatMoney(context.invoice.amount)} · {t('Paid', 'المدفوع')}: {formatMoney(context.invoice.paid)} · {t('Balance', 'المتبقي')}: {formatMoney(context.invoice.balance)}</p>
          {context.invoice.balance > 0 && (
            <p role="status">{t('Your payment claim is awaiting review. The balance updates after the Platform Owner verifies the payment.', 'طلب الدفع قيد المراجعة. يتحدّث الرصيد بعد أن يتحقق مالك المنصة من الدفع.')}</p>
          )}
        </section>}

        {context.claims.length > 0 && <section>
          <h2>{t('Payment claims', 'طلبات الدفع')}</h2>
          {context.claims.map(claim => <article key={claim.id}>
            <p>{t('Amount', 'المبلغ')}: {formatMoney(claim.amount)} · {t('Bank reference', 'المرجع البنكي')}: <bdi>{claim.reference}</bdi></p>
            <p>{t('Submitted', 'تاريخ التقديم')}: <bdi>{claim.submittedOn}</bdi> · {labels[claim.state] ?? claim.state}{claim.reason && <> · {t('Review reason', 'سبب المراجعة')}: {claim.reason}</>}</p>
          </article>)}
        </section>}

        <section>
          <h2>{t('Change plan', 'تغيير الخطة')}</h2>
          <Button onClick={() => setShowChangePlan(!showChangePlan)}>
            {showChangePlan ? t('Hide', 'إخفاء') : t('Show available plans', 'عرض الخطط المتاحة')}
          </Button>
          {showChangePlan && context.plans.map(plan => (
            <div key={plan.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem 0', borderRadius: '0.5rem' }}>
              <p><strong>{t('Version', 'الإصدار')} {plan.version}</strong> · {formatMoney(plan.price)} {t('/month', '/شهرياً')}</p>
              <p>{t('Trial days', 'أيام تجريبية')}: {plan.trialDays} · {t('Programs', 'برامج')}: {plan.programLimit}</p>
              <p>{t('Players', 'لاعبون')}: {plan.playerLimit} · {t('Storage', 'تخزين')}: {(plan.storageLimit / 1024 / 1024).toFixed(0)} MB</p>
              <Button disabled={busy} onClick={() => { setSelectedPlan(plan.id); }}>
                {t('Select', 'اختيار')}
              </Button>
            </div>
          ))}
          {selectedPlan && <div style={{ marginTop: '1rem' }}>
            <label>{t('Trial start', 'بداية الفترة التجريبية')} <Input type="date" value={selectedStart} onChange={e => setSelectedStart(e.target.value)} /></label>
            <Button disabled={busy || !selectedStart} onClick={async () => {
              setBusy(true);
              try {
                await api({ action: 'assign', academy, operation: crypto.randomUUID(), plan: selectedPlan, start: selectedStart });
                setNotice(t('Plan assigned.', 'تم تعيين الخطة.'));
                setShowChangePlan(false); setSelectedPlan(''); setSelectedStart('');
                await load();
              } catch (e) { setError(e instanceof Error ? e.message : 'unavailable'); }
              finally { setBusy(false); }
            }}>{t('Assign plan', 'تعيين الخطة')}</Button>
          </div>}
        </section>

        {!context.subscription && <p>{t('No plan has been assigned to this academy yet.', 'لم تُعيَّن خطة لهذه الأكاديمية بعد.')}</p>}
      </>}
    </main>
  </WorkspaceShell>;
}
