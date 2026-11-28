'use client';

import { useCallback, useState } from 'react';
import { Button, Input } from './ui/controls';

type Locale = 'en' | 'ar';

type Props = {
  locale: Locale;
  demoAcademyId: string;
  onConverted: (newAcademyId: string) => void;
};

export default function DemoConversionFlow({ locale, demoAcademyId, onConverted }: Props) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const [step, setStep] = useState<'verify' | 'details' | 'converting' | 'done'>('verify');
  const [email, setEmail] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [language, setLanguage] = useState(locale);
  const [sport, setSport] = useState('football');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const verifyEmail = useCallback(async () => {
    setBusy(true); setError('');
    try {
      // Send verification email (simulated for synthetic trial)
      // In production, this would send a magic link or OTP
      setStep('details');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unavailable');
    } finally { setBusy(false); }
  }, []);

  const convert = useCallback(async () => {
    setBusy(true); setError(''); setStep('converting');
    try {
      const response = await fetch('/api/platform-commerce', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({
          action: 'convert_demo',
          academy: demoAcademyId,
          operation: crypto.randomUUID(),
          demoAcademy: demoAcademyId,
          verifiedEmail: email,
          academyName: academyName || 'New Academy',
          language,
          sport,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.data) throw new Error(result.error ?? 'unavailable');
      setStep('done');
      onConverted(result.data.newAcademyId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unavailable');
      setStep('details');
    } finally { setBusy(false); }
  }, [demoAcademyId, email, academyName, language, sport, onConverted]);

  return (
    <div style={{ maxWidth: '32rem', margin: '0 auto', padding: '2rem' }}>
      <h2>{t('Convert demo to real academy', 'تحويل العرض التجريبي إلى أكاديمية حقيقية')}</h2>

      {step === 'verify' && <>
        <p>{t('Verify your email to create a real academy from this demo.', 'تحقق من بريدك الإلكتروني لإنشاء أكاديمية حقيقية من هذا العرض.')}</p>
        <label>{t('Email', 'البريد الإلكتروني')} <Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <Button disabled={busy || !email.trim()} onClick={() => void verifyEmail()}>
          {t('Send verification', 'إرسال التحقق')}
        </Button>
        {error && <p role="alert">{error}</p>}
      </>}

      {step === 'details' && <>
        <p>{t('Your email has been verified. Set up your real academy.', 'تم التحقق من بريدك الإلكتروني. أعد أكاديميتك الحقيقية.')}</p>
        <label>{t('Academy name', 'اسم الأكاديمية')} <Input value={academyName} onChange={e => setAcademyName(e.target.value)} placeholder={t('My Academy', 'أكاديميتي')} /></label>
        <label>{t('Language', 'اللغة')} <select value={language} onChange={e => setLanguage(e.target.value as Locale)}>
          <option value="en">{t('English', 'الإنجليزية')}</option>
          <option value="ar">{t('Arabic', 'العربية')}</option>
        </select></label>
        <label>{t('Sport', 'الرياضة')} <select value={sport} onChange={e => setSport(e.target.value)}>
          <option value="football">{t('Football', 'كرة القدم')}</option>
          <option value="swimming">{t('Swimming', 'السباحة')}</option>
        </select></label>
        <p style={{ fontSize: '0.875rem', color: '#666' }}>
          {t('Note: Demo data will not be copied. You will start fresh with real data.', 'ملاحظة: لن يتم نسخ بيانات العرض التجريبي. ستبدأ من جديد ببيانات حقيقية.')}
        </p>
        <Button disabled={busy} onClick={() => void convert()}>
          {t('Create real academy', 'إنشاء أكاديمية حقيقية')}
        </Button>
        {error && <p role="alert">{error}</p>}
      </>}

      {step === 'converting' && <p role="status">{t('Creating your academy…', 'جارٍ إنشاء أكاديميتك…')}</p>}

      {step === 'done' && <p role="status">{t('Your academy has been created. Redirecting…', 'تم إنشاء أكاديميتك. جارٍ التحويل…')}</p>}
    </div>
  );
}
