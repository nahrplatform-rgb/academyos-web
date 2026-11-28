'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button } from './ui/controls';

type ClassEntry = { id: string; day: string; title: string | null };
type GalleryPage = { role: 'owner' | 'manager'; classes: ClassEntry[]; more: boolean };

export default function ClassMediaGallery(props: { locale: string; academy: string }) {
  const { user } = useUser();
  if (!user) return <PublicWorkspace locale={props.locale} title={props.locale === 'ar' ? 'المعرض' : 'Gallery'}>{null}</PublicWorkspace>;
  return <Gallery key={user.id + ':' + props.academy} {...props} />;
}

function Gallery({ locale, academy }: { locale: string; academy: string }) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const base = '/' + locale + '/workspace/' + academy;
  const [data, setData] = useState<GalleryPage | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async (after?: string) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/class-media', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
        body: JSON.stringify({ academy, action: 'gallery', after }),
      });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setData(null);
          setError('denied');
          return;
        }
        throw Error();
      }
      const next: GalleryPage = result.data;
      setData(previous => after && previous?.role === next.role
        ? { ...next, classes: [...previous.classes, ...next.classes] } : next);
    } catch {
      if (!controller.signal.aborted) setError('unavailable');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [academy]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const refresh = () => { if (document.visibilityState === 'visible') { setData(null); void load(); } };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearTimeout(initial);
      request.current?.abort();
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.focus();
  }, [data]);

  const title = t('Gallery', 'المعرض');
  return <WorkspaceShell role={data?.role === 'owner' ? 'owner' : 'workspace'} locale={locale} module="people"
    context={data?.role === 'manager' ? t('Manager workspace', 'مساحة المدير') : t('Academy workspace', 'مساحة الأكاديمية')}
    title={title} homeHref={base + '/gallery'} languageHref={'/' + (ar ? 'en' : 'ar') + '/workspace/' + academy + '/gallery'}
    navigation={[{ href: base + '/gallery', label: title, current: true }]} account={<UserButton />}>
    <section className="journey-card" aria-busy={busy}>
      <h1>{title}</h1>
      {busy && <p role="status">{t('Loading classes…', 'جارٍ تحميل الحصص…')}</p>}
      {error && <p role="alert">{error === 'denied'
        ? t('Gallery access is unavailable.', 'الوصول إلى المعرض غير متاح.')
        : t('Could not load classes.', 'تعذر تحميل الحصص.')}</p>}
      {error && <Button disabled={busy} onClick={() => { setData(null); void load(); }}>{t('Retry', 'إعادة المحاولة')}</Button>}
      {data && <>
        {!data.classes.length && <p>{t('No classes available.', 'لا توجد حصص متاحة.')}</p>}
        <ul className="journey-list">{data.classes.map(entry => <li key={entry.id}>
          <Link id={'class-' + entry.id} prefetch={false} href={base + '/class-media/' + entry.id + '?from=gallery'}>
            {entry.title || t('Class photos', 'صور الحصة')} · <bdi>{entry.day}</bdi>
          </Link>
        </li>)}</ul>
        {data.more && <Button disabled={busy} onClick={() => void load(data.classes.at(-1)?.id)}>
          {t('More classes', 'المزيد من الحصص')}
        </Button>}
      </>}
    </section>
  </WorkspaceShell>;
}
