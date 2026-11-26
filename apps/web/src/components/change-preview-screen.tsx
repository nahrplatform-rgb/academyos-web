'use client';

import { useState } from 'react';
import { Button } from './ui/controls';

type Locale = 'en' | 'ar';

type ChangePreview = {
  currentPlan: string;
  newPlan: string;
  changes: { dimension: string; from: string; to: string }[];
  chargeToday: number;
  nextRenewal: number;
  previousRenewal: number;
  renewalDate: string;
  effectiveOnPayment: boolean;
};

type Props = {
  locale: Locale;
  preview: ChangePreview;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
};

export default function ChangePreviewScreen({ locale, preview, onConfirm, onCancel, busy }: Props) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const formatMoney = (amount: number) => (amount / 100).toFixed(2);

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '32rem' }}>
      <h3>{t('Change preview', 'معاينة التغيير')}</h3>

      <div style={{ marginBottom: '1rem' }}>
        <p>{t('Current', 'الحالي')}: {preview.currentPlan}</p>
        <p>{t('New', 'الجديد')}: {preview.newPlan}</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h4>{t('What changes', 'ماذا يتغير')}</h4>
        {preview.changes.map((c, i) => (
          <p key={i}>• {c.dimension}: {c.from} → {c.to}</p>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h4>{t('Billing', 'الفوترة')}</h4>
        <p>{t('Due today (prorated)', 'مستحق اليوم (按比例)')}: {formatMoney(preview.chargeToday)}</p>
        <p>{t('Next renewal', 'التجديد القادم')} ({preview.renewalDate}): {formatMoney(preview.nextRenewal)}</p>
        {preview.nextRenewal !== preview.previousRenewal && (
          <p style={{ fontSize: '0.875rem', color: '#666' }}>
            ({t('was', 'كان')} {formatMoney(preview.previousRenewal)}{t('/month', '/شهرياً')})
          </p>
        )}
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          {preview.effectiveOnPayment
            ? t('Effective: When payment is confirmed', 'ساري: عند تأكيد الدفع')
            : t('Effective: At next renewal', 'ساري: عند التجديد القادم')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button disabled={busy} onClick={onConfirm}>
          {t('Confirm & Pay', 'تأكيد والدفع')}
        </Button>
        <Button disabled={busy} onClick={onCancel}>
          {t('Cancel', 'إلغاء')}
        </Button>
      </div>
    </div>
  );
}
