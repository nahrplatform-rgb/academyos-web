'use client';

/* eslint-disable @next/next/no-img-element -- Browser previews use blob URLs, and private variants must go directly through the authenticated same-origin route. */
import { UserButton, useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { classMediaLimits } from '@/lib/class-media-limits';
import { ClassMediaImageError, prepareClassMediaImage, type PreparedClassMediaImage } from '@/lib/class-media-image';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button, Input } from './ui/controls';

type Props = { locale: string; academy: string; event: string; chunkedUploads?: boolean };
type UploadVariant = 'main' | 'thumbnail' | 'part-0' | 'part-1' | 'part-2';
type Player = { id: string; name: string };
type Item = { id: string; state: 'draft' | 'published' | 'withdrawn' | 'deleting' | 'deleted'; depicted: string[]; consented: string[]; expires: string | null };
type Context = { role: 'owner' | 'manager'; class: { id: string; title: string; program: string; day: string }; players: Player[]; items: Item[] };
type Stage = 'preparing' | 'ready' | 'uploading' | 'failed' | 'unknown' | 'saved';
type Upload = { id: string; name: string; stage: Stage; prepared?: PreparedClassMediaImage; preview?: string; item?: string; error?: string };
type Original = { operation: string; action: string; fields: Record<string, unknown>; item?: string; upload?: string };
type Reservation = { id: string; item: string; finalizeOperation: string; name: string; mainHash: string; thumbnailHash: string };
class Failure extends Error {
  constructor(public readonly code: string) { super(code); }
}
const idPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hashPattern = /^[a-f0-9]{64}$/;

async function digest(body: Blob) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await body.arrayBuffer())))
    .map(value => value.toString(16).padStart(2, '0')).join('');
}

async function send<T>(academy: string, event: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/class-media', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
    signal: AbortSignal.timeout(20000), body: JSON.stringify({ academy, event, ...body }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !Object.hasOwn(result, 'data')) throw new Failure(result.error ?? 'unavailable');
  return result.data as T;
}

function variantUrl(academy: string, event: string, item: string, variant: UploadVariant) {
  return '/api/class-media?' + new URLSearchParams({ academy, event, item, variant });
}

function readPending(key: string): Original | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw Error();
    const record = value as Record<string, unknown>;
    if (typeof record.operation !== 'string' || !idPattern.test(record.operation) ||
        typeof record.action !== 'string' || !['reserve', 'finalize', 'tag', 'consent', 'publish', 'withdraw', 'delete'].includes(record.action) ||
        !record.fields || typeof record.fields !== 'object' || Array.isArray(record.fields) ||
        Object.keys(record).some(field => !['operation', 'action', 'fields', 'item', 'upload'].includes(field)) ||
        (record.item !== undefined && (typeof record.item !== 'string' || !idPattern.test(record.item))) ||
        (record.upload !== undefined && (typeof record.upload !== 'string' || !idPattern.test(record.upload)))) throw Error();
    return record as Original;
  } catch {
    throw new Failure('recovery');
  }
}

export default function ClassMediaWorkspace(props: Props) {
  const { isLoaded, user } = useUser();
  const ar = props.locale === 'ar';
  if (!isLoaded || !user) return <PublicWorkspace locale={props.locale} title={ar ? 'صور الحصة' : 'Class photos'}>
    <p role={isLoaded ? 'alert' : 'status'}>{isLoaded ? (ar ? 'يرجى تسجيل الدخول.' : 'Please sign in.') : (ar ? 'جارٍ التحميل…' : 'Loading…')}</p>
  </PublicWorkspace>;
  return <ClassMedia key={`${user.id}:${props.academy}:${props.event}`} {...props} subject={user.id} />;
}

function ClassMedia({ locale, academy, event, subject, chunkedUploads }: Props & { subject: string }) {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const key = `academyos:class-media:${subject}:${academy}:${event}`;
  const [context, setContext] = useState<Context | null>(null);
  const [pending, setPending] = useState<Original | null>(null);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [recoveryBlocked, setRecoveryBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [opened, setOpened] = useState<string | null>(null);
  const mutation = useRef(false);
  const readVersion = useRef(0);
  const previews = useRef(new Set<string>());
  const inFlight = useRef(false);
  const pendingRef = useRef<Original | null>(null);
  const reservations = useRef<Reservation[]>([]);
  const reservationKey = `${key}:reservations`;

  const errorText = (code: string) => ({
    denied: t('Access is unavailable. Check your current role and class.', 'الصلاحية غير متاحة. تحقق من دورك والحصة الحالية.'),
    invalid: t('Check the selected photo or action.', 'تحقق من الصورة أو الإجراء المحدد.'),
    conflict: t('The saved state changed. Refresh and review it.', 'تغيرت الحالة المحفوظة. حدّث البيانات وراجعها.'),
    review_required: t('Review the selected players and consent first.', 'راجع اللاعبين المحددين والموافقات أولاً.'),
    unavailable: t('Could not complete the request. Check the original operation before retrying.', 'تعذر إكمال الطلب. تحقق من العملية الأصلية قبل إعادة المحاولة.'),
    recovery: t('The recovery reference cannot be read. Keep this tab open and contact support.', 'تعذرت قراءة مرجع الاستعادة. أبقِ الصفحة مفتوحة واتصل بالدعم.'),
    storage: t('The browser could not save the recovery reference. Nothing was submitted.', 'تعذر حفظ مرجع الاستعادة في المتصفح. لم يُرسل شيء.'),
    source_too_large: t('This source exceeds 40 MB.', 'حجم الصورة الأصلية يتجاوز ٤٠ ميغابايت.'),
    dimensions_exceeded: t('This image exceeds the safe pixel or dimension limit.', 'أبعاد الصورة أو عدد بكسلاتها يتجاوز الحد الآمن.'),
    heic_requires_export: t('Export this HEIC image as JPEG, then select it again.', 'صدّر صورة HEIC بصيغة JPEG ثم اخترها مجددًا.'),
    unsupported_type: t('Choose a JPEG, PNG or WebP image.', 'اختر صورة JPEG أو PNG أو WebP.'),
    invalid_image: t('This image is incomplete or invalid.', 'الصورة غير مكتملة أو غير صالحة.'),
    decode_failed: t('This device could not open the image.', 'تعذر على هذا الجهاز فتح الصورة.'),
    encode_failed: t('This device could not prepare the image.', 'تعذر على هذا الجهاز تجهيز الصورة.'),
    output_too_large: t('This image could not be prepared under the storage limit at acceptable quality.', 'تعذر تجهيز الصورة بالجودة المناسبة ضمن حد التخزين.'),
    too_large: t('The prepared image exceeds the storage limit.', 'حجم الصورة المجهزة يتجاوز حد التخزين.'),
  } as Record<string, string>)[code] ?? t('Could not complete the request.', 'تعذر إكمال الطلب.');

  const load = useCallback(async () => {
    const version = ++readVersion.current;
    try {
      const result = await send<Context>(academy, event, { action: 'context' });
      if (!['owner', 'manager'].includes(result.role) || result.class.id !== event ||
          !Array.isArray(result.players) || !Array.isArray(result.items)) throw new Failure('unavailable');
      if (version === readVersion.current) setContext(result);
    } catch (cause) {
      if (version !== readVersion.current) return;
      setContext(null);
      setOpened(null);
      setError(cause instanceof Failure ? cause.code : 'unavailable');
    }
  }, [academy, event]);

  useEffect(() => {
    let active = true;
    const versionRef = readVersion;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const original = readPending(key);
        pendingRef.current = original;
        setPending(original);
        const saved: unknown = JSON.parse(sessionStorage.getItem(reservationKey) ?? '[]');
        if (!Array.isArray(saved) || saved.some(value => !value || typeof value !== 'object' ||
          !idPattern.test(value.id) || !idPattern.test(value.item) || !idPattern.test(value.finalizeOperation) || typeof value.name !== 'string' ||
          !hashPattern.test(value.mainHash) || !hashPattern.test(value.thumbnailHash))) throw Error();
        reservations.current = saved;
        setUploads(saved.map(value => ({ id: value.id, item: value.item, name: value.name, stage: 'failed', error: 'reselect' })));
      } catch { setRecoveryBlocked(true); }
      setRecoveryReady(true);
      void load();
    });
    const stored = previews.current;
    return () => {
      active = false;
      versionRef.current++;
      for (const url of stored) URL.revokeObjectURL(url);
      stored.clear();
    };
  }, [key, load, reservationKey]);

  function saveReservations(items: Reservation[]) {
    try {
      const value = JSON.stringify(items);
      sessionStorage.setItem(reservationKey, value);
      if (sessionStorage.getItem(reservationKey) !== value) throw Error();
      reservations.current = items;
    } catch {
      throw new Failure('storage');
    }
  }

  function writePending(original: Original) {
    try {
      const value = JSON.stringify(original);
      sessionStorage.setItem(key, value);
      if (sessionStorage.getItem(key) !== value) throw Error();
      pendingRef.current = original;
      setPending(original);
    } catch {
      throw new Failure('storage');
    }
  }

  function clearPending() {
    sessionStorage.removeItem(key);
    pendingRef.current = null;
    setPending(null);
  }

  async function command(action: Original['action'], fields: Record<string, unknown>, upload?: string, operation?: string) {
    const original: Original = { operation: operation ?? crypto.randomUUID(), action, fields,
      ...(typeof fields.item === 'string' ? { item: fields.item } : {}), ...(upload ? { upload } : {}) };
    writePending(original);
    try {
      const result = await send<{ id?: string; state?: string }>(academy, event, { action, operation: original.operation, ...fields });
      if (!result.id) throw new Failure('unavailable');
      if (result.state !== 'deleting') clearPending();
      return result;
    } catch (cause) {
      const code = cause instanceof Failure ? cause.code : 'unavailable';
      if (['denied', 'invalid', 'conflict', 'review_required', 'too_large'].includes(code)) clearPending();
      if (code === 'denied') { setContext(null); setOpened(null); }
      throw cause;
    }
  }

  async function choose(files: FileList | null) {
    if (!files || busy || pending || inFlight.current) return;
    const list = Array.from(files);
    const retained = uploads.filter(entry => entry.prepared).length;
    if (list.length > classMediaLimits.batchFiles || retained + list.length > classMediaLimits.batchFiles) {
      setError('batch_limit');
      return;
    }
    const entries = list.map(file => ({ id: crypto.randomUUID(), name: file.name, stage: 'preparing' as const }));
    setError('');
    setUploads(previous => [...previous, ...entries]);
    inFlight.current = true;
    setBusy(true);
    const matched = new Set<string>();
    try {
      for (let index = 0; index < list.length; index++) {
        const entry = entries[index];
        try {
          const prepared = await prepareClassMediaImage(list[index]);
          const mainHash = await digest(prepared.main);
          const thumbnailHash = await digest(prepared.thumbnail);
          const preview = URL.createObjectURL(prepared.thumbnail);
          previews.current.add(preview);
          const existing = reservations.current.find(value => !matched.has(value.id) && value.name === entry.name &&
            value.mainHash === mainHash && value.thumbnailHash === thumbnailHash);
          if (existing) {
            matched.add(existing.id);
            const oldPreview = uploads.find(value => value.id === existing.id)?.preview;
            if (oldPreview) {
              URL.revokeObjectURL(oldPreview);
              previews.current.delete(oldPreview);
            }
          }
          setUploads(previous => existing
            ? previous.filter(item => item.id !== entry.id).map(item => item.id === existing.id
              ? { ...item, stage: 'ready', prepared, preview, error: undefined } : item)
            : previous.map(item => item.id === entry.id ? { ...item, stage: 'ready', prepared, preview } : item));
        } catch (cause) {
          const code = cause instanceof ClassMediaImageError ? cause.code : 'decode_failed';
          setUploads(previous => previous.map(item => item.id === entry.id ? { ...item, stage: 'failed', error: code } : item));
        }
      }
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  async function put(item: string, variant: UploadVariant, body: Blob) {
    const response = await fetch(variantUrl(academy, event, item, variant), {
      method: 'PUT', headers: { 'Content-Type': body.type }, body,
      cache: 'no-store', signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Failure(result.error ?? 'unavailable');
    }
  }

  async function putMain(item: string, body: Blob, mainHash: string) {
    const cap = classMediaLimits.hostedPartBytes;
    if (!chunkedUploads || body.size <= cap) return put(item, 'main', body);
    const variants = ['part-0', 'part-1', 'part-2'] as const;
    for (const [index, variant] of variants.entries()) {
      const start = index * cap;
      if (start >= body.size) break;
      await put(item, variant, body.slice(start, start + cap, body.type));
    }
    const result = await send<{ id: string; bytes: number }>(academy, event, { action: 'assemble', item, bytes: body.size, digest: mainHash });
    if (result.id !== item || result.bytes !== body.size) throw new Failure('unavailable');
  }

  async function upload(entry: Upload) {
    if (!entry.prepared || pendingRef.current || mutation.current || !recoveryReady || recoveryBlocked) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    setUploads(previous => previous.map(item => item.id === entry.id ? { ...item, stage: 'uploading', error: undefined } : item));
    let item = entry.item;
    try {
      if (!item) {
        item = crypto.randomUUID();
        const reservation: Reservation = { id: entry.id, item, finalizeOperation: crypto.randomUUID(), name: entry.name,
          mainHash: await digest(entry.prepared.main), thumbnailHash: await digest(entry.prepared.thumbnail) };
        saveReservations([...reservations.current, reservation]);
        setUploads(previous => previous.map(value => value.id === entry.id ? { ...value, item } : value));
      }
      if (!item) throw new Failure('unavailable');
      const reservation = reservations.current.find(value => value.id === entry.id && value.item === item);
      if (!reservation) throw new Failure('recovery');
      const reserved = await command('reserve', {}, entry.id, item);
      if (reserved.id !== item) throw new Failure('unavailable');
      await putMain(item, entry.prepared.main, reservation.mainHash);
      await put(item, 'thumbnail', entry.prepared.thumbnail);
      await command('finalize', { item }, entry.id, reservation.finalizeOperation);
      saveReservations(reservations.current.filter(value => value.id !== entry.id));
      if (entry.preview) {
        URL.revokeObjectURL(entry.preview);
        previews.current.delete(entry.preview);
      }
      setUploads(previous => previous.map(value => value.id === entry.id
        ? { ...value, stage: 'saved', item, prepared: undefined, preview: undefined } : value));
      setNotice(t('Photo saved as a private draft.', 'حُفظت الصورة كمسودة خاصة.'));
      await load();
    } catch (cause) {
      const code = cause instanceof Failure ? cause.code : 'unavailable';
      const uncertain = !['denied', 'invalid', 'conflict', 'review_required', 'too_large', 'storage'].includes(code);
      setUploads(previous => previous.map(value => value.id === entry.id ? { ...value, item, stage: uncertain ? 'unknown' : 'failed', error: code } : value));
      setError(code);
    } finally {
      setBusy(false);
      mutation.current = false;
    }
  }

  async function uploadReady() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBatchRunning(true);
    try {
      for (const entry of uploads.filter(value => value.stage === 'ready')) {
        if (pendingRef.current) break;
        await upload(entry);
      }
    } finally {
      inFlight.current = false;
      setBatchRunning(false);
    }
  }

  async function action(name: string, fields: Record<string, unknown>) {
    if (busy || pending || mutation.current || !recoveryReady || recoveryBlocked) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await command(name, fields);
      if (name === 'withdraw' || name === 'delete' || (name === 'consent' && fields.allowed === false)) setOpened(null);
      setNotice(result.state === 'deleting' ? t('Deletion is pending. Check the original operation.', 'الحذف قيد التنفيذ. تحقق من العملية الأصلية.') : t('Change saved.', 'تم حفظ التغيير.'));
      await load();
    } catch (cause) {
      setError(cause instanceof Failure ? cause.code : 'unavailable');
    } finally {
      setBusy(false);
      mutation.current = false;
    }
  }

  async function reconcile() {
    if (!pending || busy || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await send<{ id?: string; state?: string; missing?: boolean }>(academy, event, {
        action: 'recover', operation: pending.operation,
      });
      if (!result.id && !result.missing) throw new Failure('unavailable');
      const original = pending;
      const resumed = result.missing || (result.state === 'deleting' && original.action === 'delete')
        ? await send<{ id?: string; state?: string }>(academy, event, {
          action: original.action, operation: original.operation, ...original.fields,
        }) : result;
      if (!resumed.id) throw new Failure('unavailable');
      if (resumed.state !== 'deleting') clearPending();
      if (original.upload) {
        if (resumed.state === 'draft') {
          saveReservations(reservations.current.filter(value => value.id !== original.upload));
          const preview = uploads.find(value => value.id === original.upload)?.preview;
          if (preview) {
            URL.revokeObjectURL(preview);
            previews.current.delete(preview);
          }
        }
        setUploads(previous => previous.map(item => item.id === original.upload
          ? { ...item, item: resumed.id ?? item.item, stage: resumed.state === 'draft' ? 'saved' : 'failed',
            ...(resumed.state === 'draft' ? { prepared: undefined, preview: undefined } : {}),
            error: resumed.state === 'draft' ? undefined : 'resume_upload' }
          : item));
      }
      setNotice(resumed.state === 'deleting'
        ? t('Deletion is pending. Check the original operation again.', 'الحذف قيد التنفيذ. تحقق من العملية الأصلية مجددًا.')
        : t('Original operation confirmed.', 'تم تأكيد العملية الأصلية.'));
      await load();
    } catch (cause) {
      const code = cause instanceof Failure ? cause.code : 'unavailable';
      if (code === 'denied') { setContext(null); setOpened(null); }
      setError(code);
    } finally {
      setBusy(false);
      mutation.current = false;
    }
  }

  async function cleanupExpired() {
    if (busy || pendingRef.current || mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await send<{ items: { state: string }[]; receipts: { more: boolean } }>(academy, event, { action: 'cleanup' });
      setNotice(result.receipts.more || result.items.length === 10 || result.items.some(item => item.state !== 'deleted')
        ? t('This cleanup pass finished. Run another pass to check the remaining items.', 'انتهت هذه الجولة من التنظيف. شغّل جولة أخرى للتحقق من العناصر المتبقية.')
        : t('Expired media and receipts checked.', 'تم التحقق من الصور والإيصالات منتهية الصلاحية.'));
      await load();
    } catch (cause) {
      setError(cause instanceof Failure ? cause.code : 'unavailable');
    } finally {
      setBusy(false);
      mutation.current = false;
    }
  }

  const enabled = Boolean(context) && recoveryReady && !recoveryBlocked && !busy && !batchRunning && !pending;
  const stateName = (state: Item['state']) => ({
    draft: t('Private draft', 'مسودة خاصة'), published: t('Published', 'منشورة'),
    withdrawn: t('Withdrawn', 'مسحوبة'), deleting: t('Deletion pending', 'الحذف قيد التنفيذ'),
    deleted: t('Deleted', 'محذوفة'),
  })[state];
  const current = (item: Item) => selected[item.id] ?? item.depicted;
  function togglePlayer(item: Item, player: string, checked: boolean) {
    setSelected(previous => ({ ...previous, [item.id]: checked
      ? [...current(item), player] : current(item).filter(id => id !== player) }));
    setConfirmed(previous => ({ ...previous, [item.id]: false }));
  }

  return <WorkspaceShell role={context?.role === 'owner' ? 'owner' : 'workspace'} module="people" locale={locale}
    context={context ? (context.role === 'owner' ? t('Academy Owner workspace', 'مساحة مالك الأكاديمية') : t('Manager workspace', 'مساحة المدير')) : t('Academy workspace', 'مساحة الأكاديمية')}
    title={t('Class photos', 'صور الحصة')} homeHref={`/${locale}/workspace`}
    languageHref={`/${ar ? 'en' : 'ar'}/workspace/${academy}/class-media/${event}`}
    navigation={[{ href: `/${locale}/workspace/${academy}/calendar`, label: t('Calendar', 'التقويم') }]} account={<UserButton />}>
    <main className="journey-card" style={{ maxWidth: '76rem', padding: '1.5rem' }}>
      <h1>{t('Class photos', 'صور الحصة')}</h1>
      {context && <><p>{context.class.title} · <bdi>{context.class.day}</bdi></p>
        {context.role === 'owner'
          ? <a href={`/${locale}/workspace/${academy}/programs/${context.class.program}/${context.class.day}`}>{t('Back to class', 'العودة إلى الحصة')}</a>
          : <a href={`/${locale}/workspace`}>{t('Back to workspaces', 'العودة إلى مساحات العمل')}</a>}
      </>}
      {recoveryBlocked && <p role="alert">{errorText('recovery')}</p>}
      {error && <p role="alert">{error === 'batch_limit' ? t('Keep at most 10 prepared photos at a time. Upload or clear a selection first.', 'احتفظ بعشر صور مجهزة كحد أقصى في كل مرة. ارفع الصور أو امسح اختيارًا أولًا.') : errorText(error)}</p>}
      {notice && <p role="status">{notice}</p>}
      {busy && <p role="status">{t('Working…', 'جارٍ التنفيذ…')}</p>}
      {pending && <section role="status"><p>{t('An original operation needs confirmation.', 'تحتاج العملية الأصلية إلى تأكيد.')}</p>
        <Button disabled={busy} onClick={() => void reconcile()}>{t('Check original operation', 'تحقق من العملية الأصلية')}</Button></section>}
      {!context && !busy && <Button onClick={() => void load()}>{t('Reload photos', 'إعادة تحميل الصور')}</Button>}
      {context && <>
        <section>
          <h2>{t('Select photos', 'اختيار الصور')}</h2>
          <p>{t('Choose up to 10 JPEG, PNG or WebP photos. Originals stay on your device.', 'اختر حتى ١٠ صور JPEG أو PNG أو WebP. تبقى الصور الأصلية على جهازك.')}</p>
          <label>{t('Choose photos', 'اختر الصور')} <Input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple disabled={!enabled}
            onChange={e => { void choose(e.currentTarget.files); e.currentTarget.value = ''; }} /></label>
          <Button disabled={!enabled || !uploads.some(entry => entry.stage === 'ready')}
            onClick={() => void uploadReady()}>{t('Upload ready photos', 'رفع الصور الجاهزة')}</Button>
          <Button disabled={!enabled || !uploads.length} onClick={() => {
            for (const entry of uploads) if (entry.preview) {
              URL.revokeObjectURL(entry.preview);
              previews.current.delete(entry.preview);
            }
            setUploads(previous => previous.filter(entry => Boolean(entry.item) && entry.stage !== 'saved')
              .map(entry => ({ ...entry, stage: 'failed', prepared: undefined, preview: undefined, error: 'reselect' })));
          }}>{t('Start a new selection', 'بدء اختيار جديد')}</Button>
          <ul>{uploads.map(entry => <li key={entry.id}>
            {entry.preview && <img src={entry.preview} alt="" width={96} height={96} style={{ objectFit: 'contain' }} />}
            <span>{entry.name} · {({ preparing: t('Preparing', 'جارٍ التجهيز'), ready: t('Ready', 'جاهزة'), uploading: t('Uploading', 'جارٍ الرفع'),
              failed: t('Needs attention', 'تحتاج للمراجعة'), unknown: t('Confirmation needed', 'تحتاج للتأكيد'), saved: t('Saved', 'محفوظة') })[entry.stage]}</span>
            {entry.error && <p role="alert">{entry.error === 'resume_upload' ? t('Resume this upload using the prepared photo.', 'استأنف رفع الصورة المجهزة.') :
              entry.error === 'reselect' ? t('Select the same photo to resume its original upload.', 'اختر الصورة نفسها لاستئناف الرفع الأصلي.') : errorText(entry.error)}</p>}
            {entry.prepared && (entry.stage === 'ready' || entry.stage === 'failed' || (entry.stage === 'unknown' && !pending)) &&
              <Button disabled={!enabled} onClick={() => void upload(entry)}>{entry.stage === 'ready' ? t('Upload photo', 'رفع الصورة') : t('Retry photo', 'إعادة رفع الصورة')}</Button>}
          </li>)}</ul>
        </section>
        <section><h2>{t('Class gallery', 'معرض الحصة')}</h2>
          {context.role === 'owner' && <Button disabled={!enabled} onClick={() => void cleanupExpired()}>
            {t('Clean up expired media', 'تنظيف الصور منتهية الصلاحية')}
          </Button>}
          {context.items.length === 0 && <p>{t('No photos yet.', 'لا توجد صور بعد.')}</p>}
          <ul>{context.items.map(item => <li key={item.id}>
            {['draft', 'published'].includes(item.state) && <img src={variantUrl(academy, event, item.id, 'thumbnail')} alt={t('Class photo thumbnail', 'صورة مصغرة للحصة')} width={160} height={160} style={{ objectFit: 'contain' }} />}
            <p>{stateName(item.state)}</p>
            {['draft', 'published'].includes(item.state) && <Button disabled={!enabled} onClick={() => setOpened(item.id)}>{t('Open photo', 'فتح الصورة')}</Button>}
            {context.role === 'owner' && ['draft', 'withdrawn'].includes(item.state) && <>
              <fieldset><legend>{t('Players shown in this photo', 'اللاعبون الظاهرون في الصورة')}</legend>
                {context.players.map(player => <label key={player.id} style={{ display: 'block' }}>
                  <input type="checkbox" checked={current(item).includes(player.id)} disabled={!enabled}
                    onChange={e => togglePlayer(item, player.id, e.currentTarget.checked)} /> {player.name}
                </label>)}
              </fieldset>
              <label><input type="checkbox" checked={Boolean(confirmed[item.id])} disabled={!enabled}
                onChange={e => {
                  const checked = e.currentTarget.checked;
                  setConfirmed(previous => ({ ...previous, [item.id]: checked }));
                }} />
                {t('I confirmed every player shown in this photo.', 'تحققت من جميع اللاعبين الظاهرين في هذه الصورة.')}</label>
              <Button disabled={!enabled || !confirmed[item.id] || !current(item).length}
                onClick={() => void action('tag', { item: item.id, players: current(item), confirmed: true })}>{t('Save shown players', 'حفظ اللاعبين الظاهرين')}</Button>
              <Button disabled={!enabled || !item.depicted.length || item.depicted.some(id => !item.consented.includes(id))}
                onClick={() => void action('publish', { item: item.id })}>{t('Publish to class staff', 'نشر لموظفي الحصة')}</Button>
            </>}
            {context.role === 'owner' && ['draft', 'withdrawn', 'published'].includes(item.state) && item.depicted.map(playerId => <div key={playerId}>
              <span>{context.players.find(player => player.id === playerId)?.name ?? t('Player', 'لاعب')}</span>
              <span> · {item.consented.includes(playerId) ? t('Consent recorded', 'الموافقة مسجلة') : t('Consent needed', 'الموافقة مطلوبة')}</span>
              {(item.state !== 'published' || item.consented.includes(playerId)) && <Button disabled={!enabled}
                onClick={() => void action('consent', { item: item.id, player: playerId, allowed: !item.consented.includes(playerId) })}>
                {item.consented.includes(playerId) ? t('Withdraw consent', 'سحب الموافقة') : t('Record fictional consent', 'تسجيل موافقة تجريبية')}
              </Button>}
            </div>)}
            {context.role === 'owner' && item.state === 'published' && <Button disabled={!enabled}
              onClick={() => void action('withdraw', { item: item.id })}>{t('Withdraw photo', 'سحب الصورة')}</Button>}
            {context.role === 'owner' && !['deleting', 'deleted'].includes(item.state) && <Button disabled={!enabled}
              onClick={() => void action('delete', { item: item.id })}>{t('Delete photo', 'حذف الصورة')}</Button>}
          </li>)}</ul>
        </section>
        {opened && <section role="dialog" aria-label={t('Class photo', 'صورة الحصة')} aria-modal="true">
          <Button onClick={() => setOpened(null)}>{t('Close photo', 'إغلاق الصورة')}</Button>
          <img src={variantUrl(academy, event, opened, 'main')} alt={t('Class photo', 'صورة الحصة')} style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
        </section>}
      </>}
    </main>
  </WorkspaceShell>;
}
