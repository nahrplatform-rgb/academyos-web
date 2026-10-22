"use client";
import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";

type Membership = { membership_id: string; academy_id: string; academy_name: string; role: string };
type Setup = { academy_id: string; name: string; version: number; complete: boolean; timezone: string | null; branch: { id: string; name: string } | null; sport: { id: string; label_en: string; label_ar: string } | null };
type Academy = { id: string; name: string; setup_complete: boolean; invitation_id: string; generation: number; expires_at: string; revoked: boolean; redeemed_at: string | null; delivery: string; attempts: number };
type Context = { platform: boolean; memberships: Membership[]; more: boolean };
type Invitation = { academy_id: string; name: string; accepted: boolean; expires_at?: string };
type Payload = Record<string, unknown>;
class RequestError extends Error { constructor(public code: string) { super(code); } }
async function request(body: Payload) {
  let res: Response; try { res = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(15000) }); } catch { throw new RequestError('unknown'); }
  const value = await res.json(); if (!res.ok) throw new RequestError(value.error ?? 'unavailable'); return value.data;
}
type WorkspaceProps = { locale: string; mode: 'context' | 'platform' | 'setup' | 'invitation'; academy?: string };
export default function OnboardingWorkspace(props: WorkspaceProps) {
  const session = useUser();
  return <JourneyWorkspace key={`${session.user?.id ?? 'signed-out'}:${props.mode}:${props.academy ?? ''}:${props.locale}`} {...props} isLoaded={session.isLoaded} isSignedIn={Boolean(session.isSignedIn)} subject={session.user?.id} />;
}
function JourneyWorkspace({ locale, mode, academy, isLoaded, isSignedIn, subject }: WorkspaceProps & { isLoaded: boolean; isSignedIn: boolean; subject?: string }) {
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const [context, setContext] = useState<Context | null>(null), [items, setItems] = useState<Academy[]>([]), [more, setMore] = useState(false), [setup, setSetup] = useState<Setup | null>(null), [invite, setInvite] = useState<Invitation | null>(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [error, setError] = useState(''), [notice, setNotice] = useState(''), [exchanged, setExchanged] = useState(false);
  const [review, setReview] = useState<Payload | null>(null), [pending, setPending] = useState<Payload | null>(null), [uncertain, setUncertain] = useState(false);
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [branch, setBranch] = useState(''), [timezone, setTimezone] = useState(''), [sportEn, setSportEn] = useState(''), [sportAr, setSportAr] = useState('');
  const storageKey = `academyos:staging:m1-operation:${subject ?? 'none'}:${mode}:${academy ?? 'none'}`;
  const [editing, setEditing] = useState<'branch' | 'sport' | null>(null);
  const alive = useRef(true);
  const epoch = useRef(0), heading = useRef<HTMLHeadingElement>(null);

  function guardNavigation(e: MouseEvent<HTMLAnchorElement>) { if (editing && !window.confirm(t('Discard the unsaved draft and leave this page?', 'هل تريد تجاهل المسودة غير المحفوظة ومغادرة الصفحة؟'))) e.preventDefault(); }
  function forgetOperation() { try { sessionStorage.removeItem(storageKey); } catch { } }
  function wipe() { setContext(null); setItems([]); setSetup(null); setInvite(null); setPending(null); setReview(null); setBranch(''); setTimezone(''); setSportEn(''); setSportAr(''); setName(''); setEmail(''); setEditing(null); }
  async function load(next = false, initial = false) {
    const ticket = ++epoch.current;
    if (!initial) { setLoading(true); setError(''); }
    try {
      if (mode === 'context') {
        const data = await request({ action: 'context', after: next ? context?.memberships.at(-1)?.membership_id : undefined }) as Context;
        if (!alive.current || ticket !== epoch.current) return; setContext(prev => ({ ...data, memberships: next ? [...(prev?.memberships ?? []), ...data.memberships] : data.memberships }));
      } else if (mode === 'platform') {
        const data = await request({ action: 'platform', after: next ? items.at(-1)?.id : undefined }) as { items: Academy[]; more: boolean };
        if (!alive.current || ticket !== epoch.current) return; setItems(prev => next ? [...prev, ...data.items] : data.items); setMore(data.more);
      } else if (mode === 'setup') {
        const data = await request({ action: 'setup', academy }) as Setup; if (!alive.current || ticket !== epoch.current) return; setSetup(data);
      } else {
        const data = await request({ action: 'review' }) as Invitation; if (!alive.current || ticket !== epoch.current) return; setInvite(data);
      }
    } catch (e) { if (alive.current && ticket === epoch.current) { const code = e instanceof RequestError ? e.code : 'unavailable'; setError(code); if (code === 'denied') { wipe(); } } }
    finally { if (alive.current && ticket === epoch.current) setLoading(false); }
  }
  useEffect(() => {
    let live = true; alive.current = true;
    if (subject) { try { const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); if (stored && typeof stored.op === 'string' && /^[a-f0-9-]{36}$/i.test(stored.op)) void Promise.resolve().then(() => { if (live) { setPending({ action: 'recovered', op: stored.op }); setUncertain(true); } }); } catch { } }
    if (mode === 'invitation') {
      const fragment = window.location.hash.slice(1); window.history.replaceState(null, '', window.location.pathname);
      if (fragment) { const [invitation, token] = fragment.split('.'); request({ action: 'exchange', invitation, token }).then(() => { if (live) setExchanged(true); }).catch(() => { if (live) { setError('invalid'); setLoading(false); } }); }
      else void Promise.resolve().then(() => { if (live) setExchanged(true); });
    } else void Promise.resolve().then(() => { if (live) setExchanged(true); });
    return () => { live = false; alive.current = false; };
    // Opaque receipt storage is bound to the keyed subject/context, never authority.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  useEffect(() => {
let active = true; if (isLoaded && isSignedIn && exchanged) void Promise.resolve().then(() => { if (active) return load(false, true); });
    return () => { active = false; };
    // Each identity/context change starts a fresh request generation; old results are discarded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, isLoaded, isSignedIn, exchanged, mode, academy]);
  useEffect(() => {
function resume() { if (document.visibilityState === 'visible' && isSignedIn && exchanged && !busy && !uncertain) { void load(); } } document.addEventListener('visibilitychange', resume); return () => document.removeEventListener('visibilitychange', resume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, exchanged, busy, uncertain]);
  useEffect(() => { if (!editing) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [editing]);
  async function mutate(body: Payload) {
    const ticket = epoch.current; const original = { ...body, op: body.op ?? crypto.randomUUID() }; try { sessionStorage.setItem(storageKey, JSON.stringify({ op: original.op, started: Date.now() })); } catch { } setPending(original); setBusy(true); setError(''); setNotice('');
    try { await request(original); if (!alive.current || ticket !== epoch.current) return; forgetOperation(); setPending(null); setReview(null); setUncertain(false); setNotice(t('Operation confirmed. Saved progress is shown below.', 'تم تأكيد العملية. يظهر التقدم المحفوظ أدناه.')); setEditing(null); await load(); heading.current?.focus(); }
    catch (e) { if (!alive.current || ticket !== epoch.current) return; const code = e instanceof RequestError ? e.code : 'unavailable'; setError(code); setUncertain(['unknown', 'unavailable'].includes(code)); if (code === 'denied') { wipe(); } else if (!['unknown', 'unavailable'].includes(code)) { forgetOperation(); setPending(null); } }
    finally { setBusy(false); }
  }
  async function reconcile() {
    if (!pending) return; setBusy(true); setError('');
    try { const r = await request({ action: 'operation', op: pending.op }); if (r.found) { forgetOperation(); setUncertain(false); setPending(null); setReview(null); setNotice(t('The original operation was committed once.', 'حُفظت العملية الأصلية مرة واحدة.')); await load(); } else { setUncertain(false); setNotice(t('No committed receipt was found. Retry the original request below with the same operation ID.', 'لم يُعثر على نتيجة محفوظة. أعد إرسال الطلب الأصلي أدناه بالمرجع نفسه.')); } }
    catch (e) { const code = e instanceof RequestError ? e.code : 'unavailable'; setError(code); if (code === 'denied') { wipe(); setUncertain(false); } } finally { setBusy(false); }
  }
  function save(e: FormEvent, step: 'branch' | 'sport') { e.preventDefault(); if (!setup) return; void mutate({ action: 'save', academy, version: setup.version, step, fields: step === 'branch' ? { name: branch, timezone } : { label_en: sportEn, label_ar: sportAr } }); }
  const messages: Record<string, string> = {
    denied: t('Access is unavailable for this account. Check your current workspace or sign in with the intended verified invitation email.', 'الصلاحية غير متاحة لهذا الحساب. تحقق من مساحتك أو سجّل الدخول بالبريد الموثق المقصود للدعوة.'),
    invalid: t('Check the details. Reopen the original invitation link if sign-in took over 15 minutes. The invitation may have expired or setup may be incomplete; ask the inviter to review an unavailable invitation.', 'تحقق من التفاصيل. أعد فتح رابط الدعوة الأصلي إذا استغرق الدخول أكثر من ١٥ دقيقة. قد تكون الدعوة منتهية أو الإعداد غير مكتمل؛ اطلب مراجعتها من المرسل.'),
    conflict: t('A newer change or a different request used this version. Reload saved progress and review your entries before trying again.', 'حُفظ تغيير أحدث أو استُخدم الإصدار لطلب مختلف. أعد تحميل التقدم المحفوظ وراجع مدخلاتك قبل المحاولة.'),
    unavailable: t('The service is unavailable. Saved information could not be verified.', 'الخدمة غير متاحة. تعذر التحقق من المعلومات المحفوظة.'),
    unknown: t('Confirmation was interrupted. Check the original operation before another submission.', 'انقطع التأكيد. تحقق من العملية الأصلية قبل إرسال طلب آخر.'),
    limited: t('Too many requests. Wait a minute before checking again.', 'طلبات كثيرة. انتظر دقيقة قبل المحاولة مجدداً.')
};
  const disabled = busy || loading || uncertain || pending !== null || error === 'denied';
  return <div className="shell">
    <aside>
      <Link onClick={guardNavigation} className="brand" href={`/${locale}/workspace`}>
        <span className="mark">A</span>AcademyOS</Link>
      <p>{mode === 'platform' ? t('Platform workspace', 'مساحة المنصة') : t('Academy workspace', 'مساحة الأكاديمية')}</p>
      <nav aria-label={t('Workspace navigation', 'التنقل في مساحة العمل')}>
        <Link onClick={guardNavigation} href={`/${locale}/workspace`}>{t('Your workspaces', 'مساحاتك')}</Link>{mode === 'platform' && <Link href={`/${locale}/platform`}>{t('Academy admission', 'قبول الأكاديمية')}</Link>}</nav>
      <p className="sidebar-note">{t('Staging · Synthetic data only', 'بيئة اختبار · بيانات اصطناعية فقط')}</p>
    </aside>
    <div className="main">
      <header>
        <span className="badge">{t('Staging', 'نسخة تجريبية')}</span>
        <Link onClick={guardNavigation} href={`/${ar ? 'en' : 'ar'}/${mode === 'platform' ? 'platform' : mode === 'invitation' ? 'invitation' : mode === 'setup' ? `workspace/${academy}` : 'workspace'}`}>{ar ? 'English' : 'العربية'}</Link>{isSignedIn && <UserButton />}</header>
      <main id="main">
        <h1 tabIndex={-1} ref={heading}>{mode === 'platform' ? t('Academy admission', 'قبول الأكاديمية') : mode === 'invitation' ? t('Your owner invitation', 'دعوتك بصفة مالك الأكاديمية') : mode === 'setup' ? t('Initial academy setup', 'الإعداد الأولي للأكاديمية') : t('Choose your workspace', 'اختر مساحتك')}</h1>
        {error && <div className="journey-error" role="alert">{messages[error] ?? messages.unavailable}</div>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {busy && <p role="status">{t('Saving… waiting for confirmation.', 'جارٍ الحفظ… بانتظار التأكيد.')}</p>}
        {uncertain && <section className="journey-card">
          <h2>{t('Check the original operation', 'التحقق من العملية الأصلية')}</h2>
          <p>{t('Do not create a replacement. Your request keeps its original reference.', 'لا تنشئ طلباً بديلاً. يحتفظ الطلب بمرجعه الأصلي.')}</p>
          <button disabled={busy} onClick={() => void reconcile()}>{t('Check status', 'التحقق من الحالة')}</button>
        </section>}
        {pending && !uncertain && !busy && (pending.action === 'recovered' ? <p className="notice">{t('The previous receipt was not found. Return to the saved workspace to review the result. The previous form was not restored; do not recreate an academy until its status is resolved.', 'لم يُعثر على النتيجة السابقة. ارجع إلى الحالة المحفوظة لمراجعة النتيجة. لم تُستعد الاستمارة السابقة؛ لا تُعد إنشاء الأكاديمية حتى تتضح حالتها.')} <button onClick={() => { forgetOperation(); setPending(null); setError(''); }}>{t('I reviewed saved state; continue', 'راجعت الحالة المحفوظة؛ متابعة')}</button>
        </p> : <button onClick={() => void mutate(pending)}>{t('Retry original request', 'إعادة إرسال الطلب الأصلي')}</button>)}
        {isLoaded && !isSignedIn && <section className="journey-card">
          <p>{t('Sign in to verify your current access. Signing in alone grants no academy authority.', 'سجّل الدخول للتحقق من الصلاحيات الحالية. تسجيل الدخول وحده لا يمنح صلاحية الأكاديمية.')}</p>
          <SignInButton mode="redirect" forceRedirectUrl={`/${locale}/${mode === 'invitation' ? 'invitation' : 'workspace'}`}>
            <button>{t('Sign in', 'تسجيل الدخول')}</button>
          </SignInButton>
        </section>}
        {((loading && isSignedIn) || !isLoaded) && <section className="journey-card" aria-busy="true">
          <h2>{t('Checking access and saved progress', 'جارٍ التحقق من الصلاحيات والتقدم المحفوظ')}</h2>
          <p role="status">{t('Please wait. A failed lookup will not appear as an empty workspace.', 'يرجى الانتظار. لن يظهر فشل التحميل كمساحة فارغة.')}</p>
        </section>}
        {isSignedIn && !loading && !uncertain && <>
          <button disabled={busy} onClick={() => void load()}>{t('Refresh saved state', 'تحديث الحالة المحفوظة')}</button>
          {mode === 'context' && context && <>
            <p>{t('Select the academy and role for this visit.', 'اختر الأكاديمية والدور لهذه الزيارة.')}</p><p className="notice">{t('Your account reference: ', 'مرجع حسابك: ')}<bdi dir="ltr">{subject}</bdi></p>{context.platform && <Link className="button" href={`/${locale}/platform`}>{t('Open Platform workspace', 'فتح مساحة المنصة')}</Link>}{context.memberships.length === 0 && <p className="notice">{t('No active academy membership. Use a valid invitation from your academy administrator.', 'لا توجد عضوية أكاديمية نشطة. استخدم دعوة صالحة من مسؤول الأكاديمية.')}</p>}<ul className="journey-list">{context.memberships.map(m =>
              <li key={m.membership_id}>
                <strong>{m.academy_name}</strong> · {({ owner: t('Academy Owner', 'مالك الأكاديمية'), manager: t('Manager', 'مدير'), trainer: t('Trainer', 'مدرب'), guardian: t('Guardian', 'ولي أمر'), player: t('Player', 'لاعب') } as Record<string, string>)[m.role] ?? m.role} {m.role === 'owner' ? <Link href={`/${locale}/workspace/${m.academy_id}`}>{t('Continue setup', 'متابعة الإعداد')}</Link> : <span>{t('Operational workspace is not available yet.', 'المساحة التشغيلية غير متاحة بعد.')}</span>}</li>)}</ul>{context.more && <button onClick={() => void load(true)}>{t('More memberships', 'المزيد من العضويات')}</button>}</>}
          {mode === 'platform' && error !== 'denied' && <>
            <section className="journey-card">
              <h2>{t('Create a synthetic academy', 'إنشاء أكاديمية اختبار')}</h2>
              <p>{t('Appoint one initial owner. They will verify their email and accept before entering setup. No commercial activation is implied.', 'عيّن مالكاً أولاً واحداً. سيتحقق من بريده ويقبل الدعوة قبل الإعداد. لا يعني ذلك التفعيل التجاري.')}</p>
              {(!review || review.action !== 'create') ? <form onSubmit={e => { e.preventDefault(); setReview({ action: 'create', name: name.trim(), email: email.trim().toLowerCase(), invitation: crypto.randomUUID(), op: crypto.randomUUID() }); }}>
                <label htmlFor="academy-name">{t('Academy name', 'اسم الأكاديمية')}</label>
                <input id="academy-name" required maxLength={160} value={name} onChange={e => setName(e.target.value)} />
                <label htmlFor="owner-email">{t('Intended owner email', 'بريد المالك المقصود')}</label>
                <input id="owner-email" required maxLength={254} type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} />
                <small>{t('Delivery is limited to the separately approved staging mailbox.', 'الإرسال مقصور على البريد التجريبي المعتمد بشكل منفصل.')}</small>
                <button disabled={disabled} type="submit">{t('Review appointment', 'مراجعة التعيين')}</button>
              </form> : <div>
                <h3>{String(review.name)}</h3>
                <bdi dir="ltr">{String(review.email)}</bdi>
                <p>{t('Academy Owner · academy-wide setup · invitation valid for 72 hours.', 'مالك الأكاديمية · إعداد جميع الفروع · صلاحية الدعوة ٧٢ ساعة.')}</p>
                <div className="journey-actions">
                  <button disabled={disabled} onClick={() => setReview(null)}>{t('Edit', 'تعديل')}</button>
                  <button className="button" disabled={disabled} onClick={() => void mutate(review)}>{t('Create and invite owner', 'إنشاء ودعوة المالك')}</button>
                </div>
              </div>}
            </section>
            <section aria-label={t('Admitted academies', 'الأكاديميات المقبولة')}>{items.length === 0 && !error && <p>{t('No academies on this page.', 'لا توجد أكاديميات في هذه الصفحة.')}</p>}{items.map(a =>
              <article className="journey-card" key={a.id}>
                <h2>{a.name}</h2>
                <p>{a.redeemed_at ? t('Owner accepted', 'قبل المالك الدعوة') : a.revoked ? t('Invitation revoked', 'أُلغيت الدعوة') : t('Owner acceptance pending', 'بانتظار قبول المالك')}</p>
                <p>{t('Invitation expiry: ', 'انتهاء الدعوة: ')}{new Intl.DateTimeFormat(ar ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(a.expires_at))}</p>
                <p>{t('Email delivery: ', 'حالة البريد: ')}{({ queued: t('Queued; dispatch may need retry', 'في الانتظار؛ قد يلزم إعادة الإرسال'), sending: t('Sending', 'جارٍ الإرسال'), accepted: t('Provider accepted; inbox unverified', 'قبل المزود الرسالة؛ الوصول غير مؤكد'), failed: t('Failed', 'تعذر الإرسال'), unknown: t('Unknown; review before replacement', 'غير مؤكدة؛ راجعها قبل الاستبدال'), blocked: t('Blocked by staging recipient/configuration boundary', 'محظور بقيود المستلم أو الإعداد التجريبي') } as Record<string, string>)[a.delivery] ?? a.delivery}</p>
                <p>{a.setup_complete ? t('Initial setup complete; operational activation pending', 'اكتمل الإعداد الأولي؛ بانتظار التفعيل التشغيلي') : t('Initial setup incomplete', 'الإعداد الأولي غير مكتمل')}</p>{!a.redeemed_at && <div className="journey-actions">{!a.revoked && <button disabled={disabled} onClick={() => setReview({ action: 'revoke', invitation: a.invitation_id, generation: a.generation, name: a.name })}>{t('Review withdrawal', 'مراجعة إلغاء الدعوة')}</button>}<button disabled={disabled} onClick={() => setReview({ action: 'reissue', invitation: a.invitation_id, generation: a.generation, name: a.name })}>{t('Review new invitation', 'مراجعة دعوة جديدة')}</button>{!a.revoked && ['queued', 'failed', 'blocked', 'sending'].includes(a.delivery) && <button disabled={disabled} onClick={() => void mutate({ action: 'retry', invitation: a.invitation_id, generation: a.generation })}>{t('Retry pending delivery', 'إعادة محاولة الإرسال المعلق')}</button>}</div>}</article>)}</section>
            {review && review.action !== 'create' && <section className="journey-card" role="region" aria-label={t('Invitation change review', 'مراجعة تغيير الدعوة')}>
              <h2>{t('Confirm invitation change', 'تأكيد تغيير الدعوة')}</h2>
              <p>{String(review.name)} · {review.action === 'revoke' ? t('Withdraw this pending invitation. It will no longer grant access.', 'إلغاء هذه الدعوة المعلقة. لن تعود صالحة لمنح الصلاحية.') : t('Invalidate the old invitation and issue a new 72-hour invitation to the same recipient.', 'إبطال الدعوة القديمة وإصدار دعوة جديدة لمدة ٧٢ ساعة للمستلم نفسه.')}</p>
              <button disabled={disabled} onClick={() => void mutate(review)}>{t('Confirm change', 'تأكيد التغيير')}</button>
              <button disabled={disabled} onClick={() => setReview(null)}>{t('Cancel', 'إلغاء')}</button>
            </section>}
            {more && <button disabled={disabled} onClick={() => void load(true)}>{t('More academies', 'المزيد من الأكاديميات')}</button>}
          </>}
          {mode === 'invitation' && invite && <section className="journey-card">
            <h2>{invite.name}</h2>
            <p>{t('Academy Owner · all academy branches', 'مالك الأكاديمية · جميع الفروع')}</p>{invite.accepted ? <>
              <p role="status">{t('Your appointment is accepted.', 'تم قبول تعيينك.')}</p>
              <Link className="button" href={`/${locale}/workspace/${invite.academy_id}`}>{t('Enter setup workspace', 'دخول مساحة الإعداد')}</Link>
            </> : <>
              <p>{t('Your intended email was verified. Accepting gives this account initial academy setup authority.', 'تم التحقق من بريدك المقصود. يمنح القبول هذا الحساب صلاحية الإعداد الأولي للأكاديمية.')}</p>
              <button className="button" disabled={disabled} onClick={() => void mutate({ action: 'accept' })}>{t('Accept owner appointment', 'قبول تعيين المالك')}</button>
            </>}</section>}
          {mode === 'setup' && setup && <>
            <p>
              <strong>{setup.name}</strong> · {t('Academy Owner · setup only', 'مالك الأكاديمية · الإعداد فقط')}</p>
            <section className="journey-card">
              <h2>{setup.complete ? t('Initial setup saved', 'حُفظ الإعداد الأولي') : t('Resume saved setup', 'استئناف الإعداد المحفوظ')}</h2>
              <ol>
                <li>{t('Branch: ', 'الفرع: ')}{setup.branch?.name ?? t('Not saved', 'لم يُحفظ')}</li>
                <li>{t('Timezone: ', 'المنطقة الزمنية: ')}<bdi>{setup.timezone ?? t('Not saved', 'لم تُحفظ')}</bdi>
                </li>
                <li>{t('Sport: ', 'الرياضة: ')}{(ar ? setup.sport?.label_ar : setup.sport?.label_en) ?? t('Not saved', 'لم تُحفظ')}</li>
              </ol>
              <div className="journey-actions">
                <button disabled={disabled} onClick={() => { setBranch(setup.branch?.name ?? ''); setTimezone(setup.timezone ?? ''); setEditing('branch'); }}>{t('Edit branch and timezone', 'تعديل الفرع والمنطقة الزمنية')}</button>
                <button disabled={disabled} onClick={() => { setSportEn(setup.sport?.label_en ?? ''); setSportAr(setup.sport?.label_ar ?? ''); setEditing('sport'); }}>{t('Edit sport', 'تعديل الرياضة')}</button>
              </div>
            </section>
            {editing === 'branch' && <section className="journey-card">
              <h2>{t('Branch draft — unsaved changes', 'مسودة الفرع — تغييرات غير محفوظة')}</h2>
              <form onSubmit={e => save(e, 'branch')}>
                <label htmlFor="branch">{t('Branch name', 'اسم الفرع')}</label>
                <input id="branch" required maxLength={160} value={branch} onChange={e => setBranch(e.target.value)} />
                <label htmlFor="timezone">{t('Academy timezone (IANA)', 'المنطقة الزمنية للأكاديمية (IANA)')}</label>
                <input id="timezone" required maxLength={160} dir="ltr" placeholder="Area/City" value={timezone} onChange={e => setTimezone(e.target.value)} />
                <div className="journey-actions">
                  <button disabled={disabled} className="button" type="submit">{t('Save branch', 'حفظ الفرع')}</button>
                  <button type="button" onClick={() => setEditing(null)}>{t('Discard unsaved draft', 'تجاهل المسودة غير المحفوظة')}</button>
                </div>
              </form>
            </section>}
            {editing === 'sport' && <section className="journey-card">
              <h2>{t('Sport draft — unsaved changes', 'مسودة الرياضة — تغييرات غير محفوظة')}</h2>
              <form onSubmit={e => save(e, 'sport')}>
                <label htmlFor="sport-en">{t('Sport label — English', 'اسم الرياضة — الإنجليزية')}</label>
                <input id="sport-en" required maxLength={160} dir="ltr" value={sportEn} onChange={e => setSportEn(e.target.value)} />
                <label htmlFor="sport-ar">{t('Sport label — Arabic', 'اسم الرياضة — العربية')}</label>
                <input id="sport-ar" required maxLength={160} dir="rtl" value={sportAr} onChange={e => setSportAr(e.target.value)} />
                <div className="journey-actions">
                  <button disabled={disabled} type="submit" className="button">{t('Save sport', 'حفظ الرياضة')}</button>
                  <button type="button" onClick={() => setEditing(null)}>{t('Discard unsaved draft', 'تجاهل المسودة غير المحفوظة')}</button>
                </div>
              </form>
            </section>}
            {setup.branch && setup.sport && !setup.complete && <section className="journey-card">
              <h2>{t('Review and complete', 'المراجعة والإكمال')}</h2>
              <p>{setup.branch.name} · {ar ? setup.sport.label_ar : setup.sport.label_en} · <bdi>{setup.timezone}</bdi>
              </p>
              <p>{t('Confirm this sport for the branch. This completes initial setup only.', 'أكد هذه الرياضة للفرع. سيكتمل الإعداد الأولي فقط.')}</p>
              <button disabled={disabled} className="button" onClick={() => void mutate({ action: 'save', academy, version: setup.version, step: 'complete', fields: {} })}>{t('Complete initial setup', 'إكمال الإعداد الأولي')}</button>
            </section>}
            <p className="notice">{t('Scheduling, billing and staff invitations await later implementation and activation decisions. Your saved setup can be resumed after signing in again.', 'الجداول والفوترة ودعوات الموظفين بانتظار التنفيذ وقرارات التفعيل اللاحقة. يمكنك استئناف الإعداد المحفوظ بعد تسجيل الدخول مجدداً.')}</p>
          </>}
        </>}
      </main>
    </div>
  </div>;
}
