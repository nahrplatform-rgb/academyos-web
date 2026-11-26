'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/controls';

type Locale = 'en' | 'ar';

type MrrData = {
  mrr: number;
  arr: number;
  newMrr: number;
  expansionMrr: number;
  reactivationMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  netMrrChange: number;
  payingAcademies: number;
  freeAcademies: number;
  demoAcademies: number;
  totalAcademies: number;
};

type Props = { locale: Locale };

export default function MrrDashboard({ locale }: Props) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const formatMoney = (amount: number) => (amount / 100).toFixed(2);
  const [data, setData] = useState<MrrData | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      // In production, this would fetch from the API
      // For now, show placeholder data
      setData({
        mrr: 0, arr: 0, newMrr: 0, expansionMrr: 0,
        reactivationMrr: 0, contractionMrr: 0, churnedMrr: 0,
        netMrrChange: 0, payingAcademies: 0, freeAcademies: 0,
        demoAcademies: 0, totalAcademies: 0,
      });
    } finally { setBusy(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (!data) return <p role="status">{t('Loading…', 'جارٍ التحميل…')}</p>;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section>
        <h2>{t('Revenue overview', 'نظرة عامة على الإيرادات')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('MRR', 'الإيرادات الشهرية المتكررة')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatMoney(data.mrr)}</p>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('ARR', 'الإيرادات السنوية المتكررة')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatMoney(data.arr)}</p>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('Net MRR change', 'صافي تغيير الإيرادات')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: data.netMrrChange >= 0 ? 'green' : 'red' }}>
              {data.netMrrChange >= 0 ? '+' : ''}{formatMoney(data.netMrrChange)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2>{t('MRR movement', 'حركة الإيرادات')}</h2>
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          <p>{t('New MRR', 'إيرادات جديدة')}: +{formatMoney(data.newMrr)}</p>
          <p>{t('Expansion MRR', 'إيرادات التوسع')}: +{formatMoney(data.expansionMrr)}</p>
          <p>{t('Reactivation MRR', 'إيرادات إعادة التفعيل')}: +{formatMoney(data.reactivationMrr)}</p>
          <p>{t('Contraction MRR', 'إيرادات الانكماش')}: -{formatMoney(data.contractionMrr)}</p>
          <p>{t('Churned MRR', 'إيرادات الإلغاء')}: -{formatMoney(data.churnedMrr)}</p>
        </div>
      </section>

      <section>
        <h2>{t('Academy counts', 'عدد الأكاديميات')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(10rem, 1fr))', gap: '1rem' }}>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('Paying', 'مدفوعة')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.payingAcademies}</p>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('Free', 'مجانية')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.freeAcademies}</p>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('Demo', 'تجريبية')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.demoAcademies}</p>
          </div>
          <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1rem' }}>
            <p style={{ fontSize: '0.875rem', color: '#666' }}>{t('Total', 'الإجمالي')}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{data.totalAcademies}</p>
          </div>
        </div>
      </section>

      <Button onClick={() => void load()} disabled={busy}>
        {t('Refresh', 'تحديث')}
      </Button>
    </div>
  );
}
