'use client';

import { useState } from 'react';
import { Button } from './ui/controls';

type Locale = 'en' | 'ar';

type ChangeType = 'price_increase' | 'limit_decrease' | 'feature_removal' | 'plan_deprecation';

type Props = {
  locale: Locale;
  changeType: ChangeType;
  currentValue: string;
  newValue: string;
  effectiveDate: string;
  onAccept: () => void;
  onDecline: () => void;
  busy: boolean;
};

export default function PlanChangeAcceptance({ locale, changeType, currentValue, newValue, effectiveDate, onAccept, onDecline, busy }: Props) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [acknowledged, setAcknowledged] = useState(false);

  const titles: Record<ChangeType, { en: string; ar: string }> = {
    price_increase: { en: 'Price increase notice', ar: 'إشعار زيادة السعر' },
    limit_decrease: { en: 'Limit decrease notice', ar: 'إشعار تقليل الحد' },
    feature_removal: { en: 'Feature removal notice', ar: 'إشعار إزالة ميزة' },
    plan_deprecation: { en: 'Plan deprecation notice', ar: 'إشعار إيقاف خطة' },
  };

  const descriptions: Record<ChangeType, { en: string; ar: string }> = {
    price_increase: { en: 'Your plan price will change. Review the new price before it takes effect.', ar: 'سيتغير سعر خطتك. راجع السعر الجديد قبل أن يصبح ساري المفعول.' },
    limit_decrease: { en: 'Your plan limit will decrease. You may need to reduce usage or upgrade.', ar: 'سيقل حد خطتك. قد تحتاج إلى تقليل الاستخدام أو الترقية.' },
    feature_removal: { en: 'A feature will be removed from your plan. Existing access is grandfathered.', ar: 'ستتم إزالة ميزة من خطتك. يُحتفظ بالوصول الحالي.' },
    plan_deprecation: { en: 'Your plan is being phased out. Migrate to a new plan.', ar: 'خطتك قيد الإيقاف. انتقل إلى خطة جديدة.' },
  };

  return (
    <div style={{ border: '1px solid #e0a000', borderRadius: '0.5rem', padding: '1.5rem', maxWidth: '32rem', background: '#fffbe6' }}>
      <h3>{t(titles[changeType].en, titles[changeType].ar)}</h3>
      <p>{t(descriptions[changeType].en, descriptions[changeType].ar)}</p>

      <div style={{ margin: '1rem 0' }}>
        <p>{t('Current', 'الحالي')}: {currentValue}</p>
        <p>{t('New', 'الجديد')}: {newValue}</p>
        <p>{t('Effective date', 'تاريخ السريان')}: <bdi>{effectiveDate}</bdi></p>
      </div>

      <label style={{ display: 'block', margin: '1rem 0' }}>
        <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} />
        {' '}{t('I understand and accept this change', 'أفهم وأقبل هذا التغيير')}
      </label>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button disabled={busy || !acknowledged} onClick={onAccept}>
          {t('Accept', 'قبول')}
        </Button>
        <Button disabled={busy} onClick={onDecline}>
          {t('Decline', 'رفض')}
        </Button>
      </div>

      {!acknowledged && <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
        {t('You must acknowledge the change before accepting.', 'يجب الإقرار بالتغيير قبل القبول.')}
      </p>}
    </div>
  );
}
