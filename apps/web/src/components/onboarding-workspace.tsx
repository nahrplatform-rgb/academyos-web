"use client";
import Link from "next/link";
import TimezoneSelect from "./timezone-select";
import WorkspacePanes from "./workspace-panes";
import WorkspaceShell from "./workspace-shell";
import AdmissionDirectory, { type Academy } from "./admission-directory";
import { Button, Input } from "./ui/controls";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useEffectEvent, useRef, useState, type FormEvent, type MouseEvent } from "react";

type Membership = { membership_id: string; academy_id: string; academy_name: string; role: string };
type Setup = { academy_id: string; name: string; version: number; complete: boolean; timezone: string | null; branch: { id: string; name: string } | null; sport: { id: string; label_en: string; label_ar: string } | null };
type Context = { platform: boolean; memberships: Membership[]; more: boolean };
type Invitation = { academy_id: string; name: string; accepted: boolean; expires_at?: string };
type Payload = Record<string, unknown>;
class RequestError extends Error { constructor(public code: string) { super(code); } }
async function request(body: Payload) {
  let res: Response; try { res = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(15000) }); } catch { throw new RequestError('unknown'); }
  const value = await res.json(); if (!res.ok) throw new RequestError(value.error ?? 'unavailable'); return value.data;
}
type WorkspaceProps = { locale: string; mode: 'context' | 'platform' | 'setup' | 'invitation'; academy?: string };
type HandoffState = 'pending' | 'ready' | 'failed';
export default function OnboardingWorkspace(props: WorkspaceProps) {
  return <WorkspaceHandoff key={`${props.mode}:${props.academy ?? ''}:${props.locale}`} {...props} />;
}
function WorkspaceHandoff(props: WorkspaceProps) {
  const session = useUser();
  const [handoff, setHandoff] = useState<HandoffState>(props.mode === 'invitation' ? 'pending' : 'ready');
  const exchangeRequest = useRef<Promise<unknown> | null>(null);
  useEffect(() => {
    let live = true;
    if (props.mode === 'invitation') {
      if (!exchangeRequest.current) {
        const fragment = window.location.hash.slice(1); window.history.replaceState(null, '', window.location.pathname);
        const [invitation, token] = fragment.split('.');
        exchangeRequest.current = fragment ? request({ action: 'exchange', invitation, token }) : Promise.resolve();
      }
      exchangeRequest.current.then(() => { if (live) setHandoff('ready'); }).catch(() => { if (live) setHandoff('failed'); });
    }
    return () => { live = false; };
  }, [props.mode]);
  // Handoff lifetime follows the route; private projections still reset with identity.
  return <JourneyWorkspace key={session.user?.id ?? 'signed-out'} {...props} handoff={handoff} isLoaded={session.isLoaded} isSignedIn={Boolean(session.isSignedIn)} subject={session.user?.id} />;
}
function JourneyWorkspace({ locale, mode, academy, handoff, isLoaded, isSignedIn, subject }: WorkspaceProps & { handoff: HandoffState; isLoaded: boolean; isSignedIn: boolean; subject?: string }) {
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const [context, setContext] = useState<Context | null>(null), [items, setItems] = useState<Academy[]>([]), [more, setMore] = useState(false), [setup, setSetup] = useState<Setup | null>(null), [invite, setInvite] = useState<Invitation | null>(null);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true), [requestError, setError] = useState(''), [notice, setNotice] = useState('');
  const exchanged = handoff === 'ready', error = handoff === 'failed' ? 'invalid' : requestError;
  const [review, setReview] = useState<Payload | null>(null), [pending, setPending] = useState<Payload | null>(null), [uncertain, setUncertain] = useState(false);
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [branch, setBranch] = useState(''), [timezone, setTimezone] = useState(''), [sportEn, setSportEn] = useState(''), [sportAr, setSportAr] = useState('');
  const storageKey = `academyos:staging:m1-operation:${subject ?? 'none'}:${mode}:${academy ?? 'none'}`;
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<'branch' | 'sport' | null>(null);
  const alive = useRef(true), readInFlight = useRef(false);
  const epoch = useRef(0), heading = useRef<HTMLHeadingElement>(null), invitationReviewHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (review && review.action !== 'create') invitationReviewHeading.current?.focus(); }, [review]);

  function guardNavigation(e: MouseEvent<HTMLAnchorElement>) { if (busy || uncertain || pending) { e.preventDefault(); return; } if ((editing || name || email || review) && !window.confirm(t('Discard the unsaved draft and leave this page?', 'هل تريد تجاهل المسودة غير المحفوظة ومغادرة الصفحة؟'))) e.preventDefault(); }
  function forgetOperation() { try { sessionStorage.removeItem(storageKey); } catch { } }
  function wipe() { setContext(null); setItems([]); setSetup(null); setInvite(null); setPending(null); setReview(null); setBranch(''); setTimezone(''); setSportEn(''); setSportAr(''); setName(''); setEmail(''); setEditing(null); }
  async function load(next = false, initial = false) {
    const ticket = ++epoch.current; readInFlight.current = true;
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
    } catch (e) { if (alive.current && ticket === epoch.current) { const code = e instanceof RequestError ? e.code : 'unavailable'; setError(code); if (code === 'denied') { wipe(); } else {setContext(null);setItems([]);setSetup(null);setInvite(null);} } }
    finally { if (alive.current && ticket === epoch.current) {readInFlight.current = false;setLoading(false);} }
  }
  useEffect(() => {
    let live = true; alive.current = true;
    if (subject) { try { const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null'); if (stored && typeof stored.op === 'string' && /^[a-f0-9-]{36}$/i.test(stored.op)) void Promise.resolve().then(() => { if (live) { setPending({ action: 'recovered', op: stored.op }); setUncertain(true); } }); } catch { } }
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
  const resume = useEffectEvent(() => {
    if (document.visibilityState !== 'visible' || !isSignedIn || !exchanged || busy || loading || readInFlight.current || uncertain || pending) return;
    if (editing || review || name || email) { setReview(null); setNotice(t('Draft retained. Recheck current state before confirming.', 'حُفظت المسودة في الذاكرة. أعد التحقق من الحالة قبل التأكيد.')); return; }
    void load();
  });
  useEffect(() => { let queued = false; const refresh = () => { if (queued) return; queued = true; queueMicrotask(() => { queued = false; resume(); }); }; document.addEventListener('visibilitychange', refresh); window.addEventListener('focus', refresh); return () => { document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); }; }, []);
  useEffect(() => { if (!editing) return; const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; }; window.addEventListener('beforeunload', guard); return () => window.removeEventListener('beforeunload', guard); }, [editing]);
  async function mutate(body: Payload) {
    const ticket = epoch.current; const original = { ...body, op: body.op ?? crypto.randomUUID() }; try { sessionStorage.setItem(storageKey, JSON.stringify({ op: original.op, started: Date.now() })); } catch { } setPending(original); setBusy(true); setError(''); setNotice('');
    try { await request(original); if (!alive.current || ticket !== epoch.current) return; forgetOperation(); setPending(null); setReview(null); setUncertain(false); setNotice(t('Operation confirmed. Saved progress is shown below.', 'تم تأكيد العملية. يظهر التقدم المحفوظ أدناه.')); setEditing(null); if (body.action === 'create') { setCreateOpen(false); setName(''); setEmail(''); } await load(); heading.current?.focus(); }
    catch (e) { if (!alive.current || ticket !== epoch.current) return; const code = e instanceof RequestError ? e.code : 'unavailable'; setError(code); setUncertain(['unknown', 'unavailable'].includes(code)); if (code === 'denied') { wipe(); } else if (!['unknown', 'unavailable'].includes(code)) { forgetOperation(); setPending(null); } }
    finally { setBusy(false); }
  }
  async function reconcile() {
    if (!pending) return; setBusy(true); setError('');
    try { const r = await request({ action: 'operation', op: pending.op }); if (r.found) { if (pending.action === 'create') { setCreateOpen(false); setName(''); setEmail(''); } forgetOperation(); setUncertain(false); setPending(null); setReview(null); setNotice(t('The original operation was committed once.', 'حُفظت العملية الأصلية مرة واحدة.')); await load(); } else { setUncertain(false); setNotice(t('No committed receipt was found. Retry the original request below with the same operation ID.', 'لم يُعثر على نتيجة محفوظة. أعد إرسال الطلب الأصلي أدناه بالمرجع نفسه.')); } }
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
  const authReturn = `/${locale}/${mode === 'invitation' ? 'invitation' : 'workspace'}`;
  const createPanel = <>            <section className="journey-card admission-create">
              <ol className="people-steps" aria-label={t('Academy appointment steps', 'خطوات تعيين مالك الأكاديمية')}><li aria-current={!review ? 'step' : undefined}>{t('Academy and Owner', 'الأكاديمية والمالك')}</li><li aria-current={review?.action === 'create' ? 'step' : undefined}>{t('Review appointment', 'مراجعة التعيين')}</li></ol>
              <h2>{t('Create a synthetic academy', 'إنشاء أكاديمية اختبار')}</h2>
              <p>{t('Appoint one initial owner. They will verify their email and accept before entering setup. No commercial activation is implied.', 'عيّن مالكاً أولاً واحداً. سيتحقق من بريده ويقبل الدعوة قبل الإعداد. لا يعني ذلك التفعيل التجاري.')}</p>
              {(!review || review.action !== 'create') ? <form onSubmit={e => { e.preventDefault(); setReview({ action: 'create', name: name.trim(), email: email.trim().toLowerCase(), invitation: crypto.randomUUID(), op: crypto.randomUUID() }); }}>
                <label htmlFor="academy-name">{t('Academy name', 'اسم الأكاديمية')}</label>
                <Input id="academy-name" required maxLength={160} value={name} onChange={e => setName(e.target.value)} />
                <label htmlFor="owner-email">{t('Intended owner email', 'بريد المالك المقصود')}</label>
                <Input id="owner-email" required maxLength={254} type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} />
                <small>{t('Delivery is limited to the separately approved staging mailbox.', 'الإرسال مقصور على البريد التجريبي المعتمد بشكل منفصل.')}</small>
                <Button disabled={disabled} type="submit">{t('Review appointment', 'مراجعة التعيين')}</Button>
              </form> : <div>
                <h3>{String(review.name)}</h3>
                <bdi dir="ltr">{String(review.email)}</bdi>
                <p>{t('Academy Owner · academy-wide setup · invitation valid for 72 hours.', 'مالك الأكاديمية · إعداد جميع الفروع · صلاحية الدعوة ٧٢ ساعة.')}</p>
                <div className="journey-actions">
                  <Button disabled={disabled} onClick={() => setReview(null)}>{t('Edit', 'تعديل')}</Button>
                  <Button className="button" disabled={disabled} onClick={() => void mutate(review)}>{t('Create and invite owner', 'إنشاء ودعوة المالك')}</Button>
                </div>
              </div>}
            </section>
</>;
  const changePanel = <>            {review && review.action !== 'create' && <section role="region" aria-label={t('Invitation change review', 'مراجعة تغيير الدعوة')}>
              <h2 tabIndex={-1} ref={invitationReviewHeading}>{t('Confirm invitation change', 'تأكيد تغيير الدعوة')}</h2>
              <p>{String(review.name)} · {review.action === 'revoke' ? t('Withdraw this pending invitation. It will no longer grant access.', 'إلغاء هذه الدعوة المعلقة. لن تعود صالحة لمنح الصلاحية.') : t('Invalidate the old invitation and issue a new 72-hour invitation to the same recipient.', 'إبطال الدعوة القديمة وإصدار دعوة جديدة لمدة ٧٢ ساعة للمستلم نفسه.')}</p>
              <Button className="button" disabled={disabled} onClick={() => void mutate(review)}>{t('Confirm change', 'تأكيد التغيير')}</Button>
              <Button disabled={disabled} onClick={() => setReview(null)}>{t('Cancel', 'إلغاء')}</Button>
            </section>}
</>;
  const contextPanel = <>
    {mode === 'setup' && setup && <><h3>{setup.name}</h3><p>{t('Academy Owner · initial setup', 'مالك الأكاديمية · الإعداد الأولي')}</p><dl className="admission-properties"><div><dt>{t('Branch','الفرع')}</dt><dd>{setup.branch?.name ?? t('Not saved','لم يُحفظ')}</dd></div><div><dt>{t('Timezone','المنطقة الزمنية')}</dt><dd><bdi>{setup.timezone ?? t('Not saved','لم تُحفظ')}</bdi></dd></div><div><dt>{t('Sport','الرياضة')}</dt><dd>{(ar ? setup.sport?.label_ar : setup.sport?.label_en) ?? t('Not saved','لم تُحفظ')}</dd></div></dl><p>{editing ? t('Draft changes are not saved. Branch/timezone and sport are saved separately.','تغييرات المسودة غير محفوظة. يُحفظ الفرع والمنطقة الزمنية والرياضة بشكل منفصل.') : t('Initial setup does not activate scheduling or billing.','الإعداد الأولي لا يفعل الجدولة أو الفوترة.')}</p></>}
    {mode === 'context' && <p>{t('Choose an existing academy and role. Each workspace checks its current access.','اختر أكاديمية ودوراً حاليين. تتحقق كل مساحة من الصلاحية الحالية.')}</p>}
    {mode === 'invitation' && <p>{t('Verify the intended email and review before accepting. Signing in alone grants no academy authority.','وثّق البريد المقصود وراجع قبل القبول. تسجيل الدخول وحده لا يمنح صلاحية الأكاديمية.')}</p>}
  </>;
  return <WorkspaceShell module={mode === 'platform' || mode === 'invitation' ? "people" : "operations"} locale={locale}
    context={mode === 'platform' ? t('Platform workspace', 'مساحة المنصة') : t('Academy workspace', 'مساحة الأكاديمية')}
    title={mode === 'platform' ? t('Academy admission', 'قبول الأكاديمية') : mode === 'invitation' ? t('Owner invitation', 'دعوة المالك') : mode === 'setup' ? t('Initial setup', 'الإعداد الأولي') : t('Your workspaces', 'مساحاتك')}
    homeHref={`/${locale}/workspace`}
    languageHref={`/${ar ? 'en' : 'ar'}/${mode === 'platform' ? 'platform' : mode === 'invitation' ? 'invitation' : mode === 'setup' ? `workspace/${academy}` : 'workspace'}`}
    onNavigate={guardNavigation}
    navigation={[{ href: `/${locale}/workspace`, label: t('Your workspaces', 'مساحاتك'), current: mode === 'context' }, ...(mode === 'platform' ? [{ href: `/${locale}/platform`, label: t('Academy admission', 'قبول الأكاديمية'), current: true }] : []), ...(mode === 'setup' && setup ? [{href:`/${locale}/workspace/${academy}`,label:t('Initial setup','الإعداد الأولي'),current:true}, ...(setup.complete ? [{href:`/${locale}/workspace/${academy}/players`,label:t('Players','اللاعبون')},{href:`/${locale}/workspace/${academy}/staff`,label:t('Trainer appointments','تعيينات المدربين')},{href:`/${locale}/workspace/${academy}/programs`,label:t('Training','التدريب')},{href:`/${locale}/workspace/${academy}/development`,label:t('Development','التطور')}] : [])] : [])]}
    account={isSignedIn ? <UserButton /> : null}>
        <WorkspacePanes focusTargetId={mode==='platform'?'admission-detail-heading':undefined} arabic={ar} title={t('Workspace context','سياق مساحة العمل')} inspector={contextPanel} contextLabel={mode === 'setup' ? t('Saved setup summary','ملخص الإعداد المحفوظ') : undefined} plain={mode === 'platform'}>
        {(mode !== 'platform' || loading || !isSignedIn || uncertain || error === 'denied') && <h1 tabIndex={-1} ref={heading}>{mode === 'platform' ? t('Academy admission', 'قبول الأكاديمية') : mode === 'invitation' ? t('Your owner invitation', 'دعوتك بصفة مالك الأكاديمية') : mode === 'setup' ? t('Initial academy setup', 'الإعداد الأولي للأكاديمية') : t('Choose your workspace', 'اختر مساحتك')}</h1>}
        {error && <div className="journey-error" role="alert">{messages[error] ?? messages.unavailable}</div>}
        {notice && <p className="notice" role="status">{notice}</p>}
        {busy && <p role="status">{t('Saving… waiting for confirmation.', 'جارٍ الحفظ… بانتظار التأكيد.')}</p>}
        {uncertain && <section className="journey-card">
          <h2>{t('Check the original operation', 'التحقق من العملية الأصلية')}</h2>
          <p>{t('Do not create a replacement. Your request keeps its original reference.', 'لا تنشئ طلباً بديلاً. يحتفظ الطلب بمرجعه الأصلي.')}</p>
          <Button disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'التحقق من العملية الأصلية')}</Button>
        </section>}
        {pending && !uncertain && !busy && (pending.action === 'recovered' ? <p className="notice">{t('The previous receipt was not found. Return to the saved workspace to review the result. The previous form was not restored; do not recreate an academy until its status is resolved.', 'لم يُعثر على النتيجة السابقة. ارجع إلى الحالة المحفوظة لمراجعة النتيجة. لم تُستعد الاستمارة السابقة؛ لا تُعد إنشاء الأكاديمية حتى تتضح حالتها.')} <Button onClick={() => { forgetOperation(); setPending(null); setError(''); }}>{t('I reviewed saved state; continue', 'راجعت الحالة المحفوظة؛ متابعة')}</Button>
        </p> : <Button onClick={() => void mutate(pending)}>{t('Retry original request', 'إعادة إرسال الطلب الأصلي')}</Button>)}
        {isLoaded && !isSignedIn && <section className="journey-card">
          <p>{mode === 'invitation' ? t('New to AcademyOS? Create an account using the email that received this invitation. Already have an account? Sign in with that email.', 'هل تستخدم AcademyOS لأول مرة؟ أنشئ حساباً بالبريد الذي استلم هذه الدعوة. لديك حساب بالفعل؟ سجّل الدخول بهذا البريد.') : t('Sign in to verify your current access. Signing in alone grants no academy authority.', 'سجّل الدخول للتحقق من الصلاحيات الحالية. تسجيل الدخول وحده لا يمنح صلاحية الأكاديمية.')}</p>
          {mode === 'invitation' && <p>{t('After verifying your email, return here to review and accept the owner appointment. Creating an account alone does not grant academy access.', 'بعد التحقق من بريدك، ستعود إلى هنا لمراجعة تعيينك مالكاً وقبوله. إنشاء الحساب وحده لا يمنح صلاحية الأكاديمية.')}</p>}
          <div className="journey-actions">
            {mode === 'invitation' && <SignUpButton mode="redirect" forceRedirectUrl={authReturn} signInForceRedirectUrl={authReturn}>
              <Button disabled={!exchanged}>{t('Create account', 'إنشاء حساب')}</Button>
            </SignUpButton>}
            <SignInButton mode="redirect" forceRedirectUrl={authReturn} signUpForceRedirectUrl={authReturn}>
              <Button disabled={mode === 'invitation' && !exchanged}>{t('Sign in', 'تسجيل الدخول')}</Button>
            </SignInButton>
          </div>
        </section>}
        {handoff !== 'failed' && ((loading && isSignedIn) || !isLoaded) && <section className="journey-card" aria-busy="true">
          <h2>{t('Checking access and saved progress', 'جارٍ التحقق من الصلاحيات والتقدم المحفوظ')}</h2>
          <p role="status">{t('Please wait. A failed lookup will not appear as an empty workspace.', 'يرجى الانتظار. لن يظهر فشل التحميل كمساحة فارغة.')}</p>
        </section>}
        {isSignedIn && !loading && !uncertain && <>
          {(mode !== 'platform' || error === 'denied') && <div className="read-toolbar"><Button disabled={busy} onClick={() => void load()}>{t(error ? 'Retry current read' : editing || review ? 'Recheck current state' : 'Refresh view', error ? 'إعادة محاولة قراءة الحالة' : editing || review ? 'إعادة التحقق من الحالة' : 'تحديث العرض')}</Button></div>}
          {mode === 'context' && context && <>
            <p>{t('Select the academy and role for this visit.', 'اختر الأكاديمية والدور لهذه الزيارة.')}</p><details className="support-reference"><summary>{t('Account reference for support', 'مرجع الحساب للدعم')}</summary><bdi dir="ltr">{subject}</bdi></details>{context.platform && <Link className="button" href={`/${locale}/platform`}>{t('Open Platform workspace', 'فتح مساحة المنصة')}</Link>}{context.memberships.length === 0 && <p className="notice">{t('No active academy membership. Use a valid invitation from your academy administrator.', 'لا توجد عضوية أكاديمية نشطة. استخدم دعوة صالحة من مسؤول الأكاديمية.')}</p>}<ul className="journey-list">{context.memberships.map(m =>
              <li key={m.membership_id}>
                <strong>{m.academy_name}</strong> · {({ owner: t('Academy Owner', 'مالك الأكاديمية'), manager: t('Manager', 'مدير'), trainer: t('Trainer', 'مدرب'), guardian: t('Guardian', 'ولي أمر'), player: t('Player', 'لاعب') } as Record<string, string>)[m.role] ?? m.role} {m.role === 'owner' ? <Link href={`/${locale}/workspace/${m.academy_id}/home`}>{t('Open academy', 'فتح الأكاديمية')}</Link> : m.role === 'guardian' ? <Link href={`/${locale}/workspace/${m.academy_id}/guardian/home`}>{t('Open Guardian home', 'فتح الصفحة الرئيسية لولي الأمر')}</Link> : m.role === 'trainer' ? <Link href={`/${locale}/workspace/${m.academy_id}/trainer/home`}>{t('Open Trainer home', 'فتح الصفحة الرئيسية للمدرب')}</Link> : <span>{t('Operational workspace is not available yet.', 'المساحة التشغيلية غير متاحة بعد.')}</span>}</li>)}</ul>{context.more && <Button onClick={() => void load(true)}>{t('More memberships', 'المزيد من العضويات')}</Button>}</>}
          {mode === 'platform' && error !== 'denied' && <>
            <AdmissionDirectory heading={<h1 tabIndex={-1} ref={heading}>{t('Academy admission', 'قبول الأكاديمية')}</h1>} toolbar={<Button disabled={busy} onClick={() => void load()}>{t(error ? 'Retry current read' : editing || review ? 'Recheck current state' : 'Refresh view', error ? 'إعادة محاولة قراءة الحالة' : editing || review ? 'إعادة التحقق من الحالة' : 'تحديث العرض')}</Button>} footer={more && <Button disabled={disabled} onClick={() => void load(true)}>{t('More academies', 'المزيد من الأكاديميات')}</Button>} items={items} arabic={ar} disabled={disabled} hasError={Boolean(error)}
              onReview={setReview} onRetry={body => void mutate(body)} creation={createPanel} changeReview={changePanel} creating={createOpen} reviewing={Boolean(review && review.action !== 'create')}
              onCancelReview={() => setReview(null)} feedback={<>{error && <p className="journey-error" role="alert">{messages[error] ?? messages.unavailable}</p>}{busy && <p role="status">{t('Saving… waiting for confirmation.', 'جارٍ الحفظ… بانتظار التأكيد.')}</p>}</>} onCreate={() => setCreateOpen(true)} onClose={() => {setCreateOpen(false);setReview(null);}} />
          </>}
          {mode === 'invitation' && invite && <section className="journey-card">
            <h2>{invite.name}</h2>
            <p>{t('Academy Owner · all academy branches', 'مالك الأكاديمية · جميع الفروع')}</p>{invite.accepted ? <>
              <p role="status">{t('Your appointment is accepted.', 'تم قبول تعيينك.')}</p>
              <Link className="button" href={`/${locale}/workspace/${invite.academy_id}`}>{t('Enter setup workspace', 'دخول مساحة الإعداد')}</Link>
            </> : <>
              <p>{t('Your intended email was verified. Accepting gives this account initial academy setup authority.', 'تم التحقق من بريدك المقصود. يمنح القبول هذا الحساب صلاحية الإعداد الأولي للأكاديمية.')}</p>
              <Button className="button" disabled={disabled} onClick={() => void mutate({ action: 'accept' })}>{t('Accept owner appointment', 'قبول تعيين المالك')}</Button>
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
                {setup.complete && <div className="journey-actions"><a className="button" href={`/${locale}/workspace/${academy}/home`}>{t('Open academy home','فتح الصفحة الرئيسية للأكاديمية')}</a><a className="button" href={`/${locale}/workspace/${academy}/players`}>{t('Open players','فتح اللاعبين')}</a><Link className="button" href={`/${locale}/workspace/${academy}/staff`}>{t('Trainer appointments','تعيينات المدربين')}</Link><Link className="button" href={`/${locale}/workspace/${academy}/programs`}>{t('Draft programs','مسودات البرامج')}</Link></div>}
                <Button disabled={disabled} onClick={() => { setBranch(setup.branch?.name ?? ''); setTimezone(setup.timezone ?? ''); setEditing('branch'); }}>{t('Edit branch and timezone', 'تعديل الفرع والمنطقة الزمنية')}</Button>
                <Button disabled={disabled} onClick={() => { setSportEn(setup.sport?.label_en ?? ''); setSportAr(setup.sport?.label_ar ?? ''); setEditing('sport'); }}>{t('Edit sport', 'تعديل الرياضة')}</Button>
              </div>
            </section>
            {editing === 'branch' && <section className="journey-card">
              <h2>{t('Branch draft — unsaved changes', 'مسودة الفرع — تغييرات غير محفوظة')}</h2>
              <form onSubmit={e => save(e, 'branch')}>
                <label htmlFor="branch">{t('Branch name', 'اسم الفرع')}</label>
                <Input id="branch" required maxLength={160} value={branch} onChange={e => setBranch(e.target.value)} />
                <TimezoneSelect value={timezone} onChange={setTimezone} arabic={ar} />
                <div className="journey-actions">
                  <Button disabled={disabled} className="button" type="submit">{t('Save branch', 'حفظ الفرع')}</Button>
                  <Button type="button" onClick={() => setEditing(null)}>{t('Discard unsaved draft', 'تجاهل المسودة غير المحفوظة')}</Button>
                </div>
              </form>
            </section>}
            {editing === 'sport' && <section className="journey-card">
              <h2>{t('Sport draft — unsaved changes', 'مسودة الرياضة — تغييرات غير محفوظة')}</h2>
              <form onSubmit={e => save(e, 'sport')}>
                <label htmlFor="sport-en">{t('Sport label — English', 'اسم الرياضة — الإنجليزية')}</label>
                <Input id="sport-en" required maxLength={160} dir="ltr" value={sportEn} onChange={e => setSportEn(e.target.value)} />
                <label htmlFor="sport-ar">{t('Sport label — Arabic', 'اسم الرياضة — العربية')}</label>
                <Input id="sport-ar" required maxLength={160} dir="rtl" value={sportAr} onChange={e => setSportAr(e.target.value)} />
                <div className="journey-actions">
                  <Button disabled={disabled} type="submit" className="button">{t('Save sport', 'حفظ الرياضة')}</Button>
                  <Button type="button" onClick={() => setEditing(null)}>{t('Discard unsaved draft', 'تجاهل المسودة غير المحفوظة')}</Button>
                </div>
              </form>
            </section>}
            {setup.branch && setup.sport && !setup.complete && <section className="journey-card">
              <h2>{t('Review and complete', 'المراجعة والإكمال')}</h2>
              <p>{setup.branch.name} · {ar ? setup.sport.label_ar : setup.sport.label_en} · <bdi>{setup.timezone}</bdi>
              </p>
              <p>{t('Confirm this sport for the branch. This completes initial setup only.', 'أكد هذه الرياضة للفرع. سيكتمل الإعداد الأولي فقط.')}</p>
              <Button disabled={disabled} className="button" onClick={() => void mutate({ action: 'save', academy, version: setup.version, step: 'complete', fields: {} })}>{t('Complete initial setup', 'إكمال الإعداد الأولي')}</Button>
            </section>}
            <p className="notice">{t('Manage players and Trainer appointments, plan training dates, publish assigned sessions and record attendance during their recording window. Billing awaits later implementation. Your saved setup can be resumed after signing in again.', 'يمكنك إدارة اللاعبين وتعيينات المدربين، وتخطيط مواعيد التدريب ونشر الجلسات المخصصة وتسجيل الحضور خلال فترة التسجيل. الفوترة في مرحلة لاحقة. يمكنك استئناف الإعداد المحفوظ بعد تسجيل الدخول مجدداً.')}</p>
          </>}
        </>}
  </WorkspacePanes></WorkspaceShell>;
}
