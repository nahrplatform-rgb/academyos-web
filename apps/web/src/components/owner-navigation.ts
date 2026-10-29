import type { NavigationItem } from './workspace-shell';

/** Existing Owner-only callers select this presentation; every destination still checks authority. */
export function ownerNavigation(locale: string, academy: string, current: 'setup' | 'people' | 'staff' | 'training' | 'scan' | 'settings' | 'corrections' | 'development'): NavigationItem[] {
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const base = `/${locale}/workspace/${academy}`;
  return [
    { href: `/${locale}/workspace`, label: t('Your workspaces', 'مساحات العمل'), group: t('Workspace', 'مساحة العمل'), module: 'operations' },
    { href: base, label: t('Academy setup', 'إعداد الأكاديمية'), current: current === 'setup', group: t('Workspace', 'مساحة العمل'), module: 'operations' },
    { href: `${base}/players`, label: t('Players', 'اللاعبون'), current: current === 'people', group: t('People', 'الأشخاص'), module: 'people' },
    { href: `${base}/staff`, label: t('Trainer appointments', 'تعيينات المدربين'), current: current === 'staff', group: t('People', 'الأشخاص'), module: 'people' },
    { href: `${base}/programs`, label: t('Training programs', 'برامج التدريب'), current: current === 'training', group: t('Training', 'التدريب'), module: 'training' },
    { href: `${base}/attendance/scan`, label: t('Session scanner', 'ماسح الجلسات'), current: current === 'scan', group: t('Attendance', 'الحضور'), module: 'attendance' },
    { href: `${base}/attendance/settings`, label: t('Attendance settings', 'إعدادات الحضور'), current: current === 'settings', group: t('Attendance', 'الحضور'), module: 'attendance' },
    { href: `${base}/attendance/corrections`, label: t('Correction requests', 'طلبات التصحيح'), current: current === 'corrections', group: t('Attendance', 'الحضور'), module: 'attendance' },
    { href: `${base}/development`, label: t('Development feedback', 'ملاحظات التطور'), current: current === 'development', group: t('Development', 'التطور'), module: 'development' },
  ];
}
