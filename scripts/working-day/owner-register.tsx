"use client";

import Link from 'next/link';
import {useEffect, useRef, useState, type MouseEvent} from 'react';
import WorkspaceShell from '../../apps/web/src/components/workspace-shell';
import {Button} from '../../apps/web/src/components/ui/controls';
import {openLocalRegister, type LocalRegisterRepository, type RecoveryTicket, type RegisterScope} from '../../apps/web/src/lib/local-register-repository';
import {registerDownloadCoordinator} from '../../apps/web/src/lib/register-download-coordinator';
import {registerOriginalDispatch} from '../../apps/web/src/lib/register-original-dispatch';

type Page = Awaited<ReturnType<LocalRegisterRepository['readPage']>>;
type Original = Awaited<ReturnType<LocalRegisterRepository['readActiveOriginal']>>;
type Choice = 'present' | 'absent';
type Handle = {repo: LocalRegisterRepository; lifetime: AbortController; active: boolean};

async function post(path: string, body: unknown, signal: AbortSignal) {
  const response = await fetch(path, {
    method: 'POST', headers: {'content-type': 'application/json'},
    body: JSON.stringify(body), cache: 'no-store', signal,
  });
  const reply = await response.json();
  if (!response.ok) throw new Error(reply.error || 'unavailable');
  return reply.data;
}

/** Mounted only by the isolated EX-11 build. Identity and key authority are fixtures. */
export default function OwnerRegister({locale, scope, event}: {locale: string; scope: RegisterScope; event: string}) {
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const base = `/${locale}/workspace/${scope.academy}`;
  const handle = useRef<Handle | null>(null);
  const lock = useRef(false), review = useRef<HTMLDialogElement>(null), opener = useRef<HTMLButtonElement>(null);
  const reconnect = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [data, setData] = useState<Page | null>(null), [original, setOriginal] = useState<Original>(null);
  const [draft, setDraft] = useState<Record<string, Choice>>({}), [reviewing, setReviewing] = useState(false);
  const [notice, setNotice] = useState(''), [error, setError] = useState('');
  const choices = Object.entries(draft);
  const saved = original && JSON.parse(original.wire).marks.length as number | null;
  const status = (value: Choice | null) => value === 'present' ? t('Present','حاضر') :
    value === 'absent' ? t('Absent','غائب') : t('Unmarked','غير مسجل');

  async function refresh(h: Handle) {
    const pending = await h.repo.readActiveOriginal(event);
    const page = await h.repo.readPage(event).catch(cause => {
      if (cause instanceof Error && cause.message === 'not_downloaded') return null;
      throw cause;
    });
    h.lifetime.signal.throwIfAborted();
    h.active = true;
    setOriginal(pending);
    setData(pending?.refusal === 'denied' ? null : page);
  }

  useEffect(() => {
    let current = true;
    const lifetime = new AbortController();
    const online = () => reconnect.current();
    window.addEventListener('online', online);
    void (async () => {
      try {
        const repo = await openLocalRegister(scope);
        if (!current) {repo.dispose(); return;}
        const h = {repo, lifetime, active: false};
        handle.current = h;
        try {await refresh(h);}
        catch (cause) {
          if (current && (!(cause instanceof Error) || cause.message !== 'account_verification_required')) setError('unavailable');
        }
      } catch {if (current) setError('unavailable');}
      finally {if (current) setReady(true);}
    })();
    return () => {
      current = false;
      lifetime.abort();
      handle.current?.repo.dispose();
      handle.current = null;
      window.removeEventListener('online', online);
    };
    // The temporary route mounts a distinct instance per fixture scope/event.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, event]);

  useEffect(() => {
    if (reviewing && !review.current?.open) review.current?.showModal();
    if (!reviewing) review.current?.close();
  }, [reviewing]);

  async function run(work: (h: Handle) => Promise<void>) {
    const h = handle.current;
    if (!h || lock.current) return;
    lock.current = true;
    setBusy(true); setError(''); setNotice('');
    try {await work(h);}
    catch (cause) {if (handle.current === h) setError(cause instanceof Error ? cause.message : 'unavailable');}
    finally {
      lock.current = false;
      if (handle.current === h) setBusy(false);
    }
  }

  async function activate(h: Handle) {
    if (h.active) return;
    const attempt = await h.repo.beginActivation();
    const ticket = await post('/api/fixture-key', {binding: attempt.binding}, h.lifetime.signal) as RecoveryTicket;
    h.lifetime.signal.throwIfAborted();
    await h.repo.activate(ticket, attempt);
    h.active = true;
  }

  const prepare = () => run(async h => {
    await activate(h);
    const download = registerDownloadCoordinator(h.repo, scope.academy,
      (command, signal) => post('/api/register-download', command, signal), h.lifetime.signal);
    const result = await download.prepare(event);
    await refresh(h);
    setNotice(result.kind === 'unchanged' ? 'unchanged' : 'prepared');
  });
  const recover = () => run(async h => {await activate(h); await refresh(h);});
  const send = () => run(async h => {
    const result = await registerOriginalDispatch(h.repo, h.lifetime.signal)(event);
    await refresh(h);
    setNotice(result.kind);
  });
  useEffect(() => {
    reconnect.current = () => {
      if (document.visibilityState === 'visible' && original?.state === 'pending') void send();
    };
  });
  const save = () => run(async h => {
    await h.repo.captureRegister({action: 'register', academy: scope.academy, event,
      captured_at: new Date().toISOString(), op: crypto.randomUUID(),
      marks: choices.map(([player, status]) => ({player, status, version: 0}))});
    setDraft({}); setReviewing(false);
    await refresh(h);
  });
  const logout = () => run(async h => {
    setData(null); setOriginal(null); setDraft({}); setReviewing(false);
    h.active = false;
    await h.repo.quarantine('logout');
    await post('/api/fixture-signout', {}, h.lifetime.signal);
    setNotice('quarantined');
  });
  function closeReview() {setReviewing(false); opener.current?.focus();}
  function guardNavigation(event: MouseEvent<HTMLAnchorElement>) {
    if (lock.current || (choices.length && !window.confirm(t('Discard unsaved choices?','تجاهل الاختيارات غير المحفوظة؟')))) {
      event.preventDefault();
    }
  }

  return <div className="attendance-theme" lang={locale} dir={ar ? 'rtl' : 'ltr'}>
    <WorkspaceShell locale={locale} role="owner" module="attendance" context={t('Fictional working day','يوم عمل تجريبي')}
      title={t('Prepared attendance register','سجل الحضور المحضّر')} homeHref={`${base}/home`}
      languageHref={`/${ar ? 'en' : 'ar'}/workspace/${scope.academy}/attendance/${event}`}
      navigation={[{href:`${base}/calendar`,label:t('Calendar','التقويم'),module:'training'}]}
      onNavigate={guardNavigation}>
      <h1>{t('Prepared attendance register','سجل الحضور المحضّر')}</h1>
      <p>{t('Fictional Owner fixture','اختبار ببيانات خيالية')}</p>
      {!ready && <p role="status">{t('Opening saved work…','جارٍ فتح العمل المحفوظ…')}</p>}
      {busy && <p role="status">{t('Checking original save or download…','جارٍ التحقق من الحفظ أو التنزيل…')}</p>}
      {error && <p role="alert">{error === 'denied' ? t('Original account required','الحساب الأصلي مطلوب') :
        t('Work is unavailable. Your unsaved choices remain.','العمل غير متاح. اختياراتك غير المحفوظة باقية.')}</p>}
      {notice === 'unchanged' && <p role="status">{t('Download is current','التنزيل محدّث')}</p>}
      {notice === 'confirmed' && <p role="status">{t('Server recorded the register','سجّل الخادم الحضور')}</p>}
      {notice === 'quarantined' && <p role="status">{t('Downloads removed. Saved work is protected.','أزيلت التنزيلات. العمل المحفوظ محمي.')}</p>}
      {original && <section aria-label={t('Saved work','العمل المحفوظ')}>
        <p role="status">{original.state === 'pending' ? t('Saved on this device · Awaiting sync','محفوظ على هذا الجهاز · بانتظار المزامنة') :
          original.state === 'unknown' ? t('Outcome not yet known','نتيجة الحفظ غير معروفة') : t('Needs review','تحتاج مراجعة')}</p>
        {original.refusal !== 'denied' && <p>{saved} {t('selected marks retained','علامات مختارة محفوظة')}</p>}
        {original.state !== 'needs_review' && <Button disabled={busy} onClick={() => void send()}>{t('Sync original','مزامنة الحفظ الأصلي')}</Button>}
      </section>}
      <div className="journey-actions">
        <Button disabled={!ready || busy || choices.length > 0 || !!original} onClick={() => void prepare()}>
          {data ? t('Check download','تحقق من التنزيل') : t('Prepare register on this device','حضّر السجل على هذا الجهاز')}
        </Button>
        {!data && !original && <Button disabled={!ready || busy} onClick={() => void recover()}>{t('Recover saved work','استعادة العمل المحفوظ')}</Button>}
        <Button disabled={!ready || busy || choices.length > 0} onClick={() => void logout()}>{t('Sign out and clear downloads','تسجيل الخروج ومسح التنزيلات')}</Button>
        <Link prefetch={false} href={`${base}/calendar`} onClick={guardNavigation}>{t('Back to calendar','العودة إلى التقويم')}</Link>
      </div>
      {data && <section aria-label={t('Downloaded register','السجل المنزّل')}>
        <h2>{data.header.projection.name}</h2>
        <p>{data.players.length} / {data.header.count} {t('players prepared','لاعبون جاهزون')} · {data.header.saved} {t('recorded at last check','مسجلون عند آخر تحقق')}</p>
        {data.needsCurrentRead && <p>{t('Check download to refresh server marks.','تحقق من التنزيل لتحديث علامات الخادم.')}</p>}
        <ul className="register-roster">{data.players.map(player => <li key={player.id}>
          <span>{player.name}</span>
          {player.version ? <span className={`attendance-status ${player.status}`}>{status(player.status)}</span> :
            <div className="register-options" role="group" aria-label={player.name}>
              {(['present', 'absent'] as const).map(choice => <Button key={choice}
                aria-pressed={draft[player.id] === choice} disabled={busy || !!original || data.needsCurrentRead || !data.header.open}
                onClick={() => setDraft(old => ({...old, [player.id]: choice}))}>{status(choice)}</Button>)}
            </div>}
        </li>)}</ul>
        <Button ref={opener} disabled={busy || !choices.length || !!original || data.more || data.needsCurrentRead}
          onClick={() => setReviewing(true)}>{t('Review register','مراجعة الحضور')}</Button>
      </section>}
      <dialog ref={review} className="register-dialog" aria-labelledby="review-title" onCancel={e => {e.preventDefault(); closeReview();}}>
        <h2 id="review-title">{t('Save these marks on this device?','حفظ هذه العلامات على هذا الجهاز؟')}</h2>
        <ul>{data?.players.filter(player => draft[player.id]).map(player =>
          <li key={player.id}>{player.name} · {status(draft[player.id])}</li>)}</ul>
        <div className="journey-actions">
          <Button disabled={busy} onClick={closeReview}>{t('Back to editing','العودة إلى التعديل')}</Button>
          <Button disabled={busy || !choices.length} onClick={() => void save()}>{t('Save on this device','حفظ على هذا الجهاز')}</Button>
        </div>
      </dialog>
    </WorkspaceShell>
  </div>;
}
