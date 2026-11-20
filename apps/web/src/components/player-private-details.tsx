"use client";

import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from 'react';
import { Button, Input } from './ui/controls';

type Translate = (en: string, ar: string) => string;
type Request = <T>(body: Record<string, unknown>) => Promise<T>;
const fields = [
    ['legacyId', 'Existing academy ID', 'رقم العضوية السابق', 80],
    ['address', 'Address', 'العنوان', 300],
    ['schoolName', 'School name', 'اسم المدرسة', 160],
    ['medicalNotes', 'Medical notes', 'ملاحظات طبية', 500],
    ['nationalId', 'National ID', 'الرقم القومي', 80],
] as const;
type Field = typeof fields[number][0];
type Details = Partial<Record<Field, string | null>> & { version: number; nationalIdPresent: boolean };
type Photo = { version: number; image: string | null };

export function PlayerPrivateDetails({ player, storageKey, request, onFailure, onClose, t }: {
    player: string; storageKey: string; request: Request; onFailure: (error: unknown) => void; onClose: () => void; t: Translate;
}) {
    const dialog = useRef<HTMLDialogElement>(null);
    const mounted = useRef(true);
    const locked = useRef(false);
    const [busy, setBusy] = useState(false);
    const [current, setCurrent] = useState<Details | null>(null);
    const [draft, setDraft] = useState<Partial<Record<Field, string>>>({});
    const [pending, setPending] = useState<string | null>(null);
    const [photo, setPhoto] = useState<Photo | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [conflict, setConflict] = useState(false);
    const [notice, setNotice] = useState<'saved' | 'cancelled' | 'unavailable' | null>(null);
    const dirty = Object.keys(draft).length > 0;
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);
    const initialRead = useRef(false);
    useEffect(() => {
        const panel = dialog.current;
        panel?.showModal();
        return () => { panel?.close(); };
    }, []);
    useEffect(() => {
        if (!dirty && !file && !pending && !busy) return;
        const guard = (event: BeforeUnloadEvent) => { event.preventDefault(); };
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [dirty, file, pending, busy]);

    async function run(action: () => Promise<void>) {
        if (locked.current) return;
        locked.current = true;
        setBusy(true);
        setNotice(null);
        try { await action(); }
        catch (error) {
            if (!mounted.current) return;
            if (['denied', 'authentication_required', 'setup_required'].includes((error as { code?: string })?.code ?? '')) {
                setCurrent(null);
                setDraft({});
                onFailure(error);
            } else setNotice('unavailable');
        } finally {
            locked.current = false;
            if (mounted.current) setBusy(false);
        }
    }
    async function read(reveal = false) {
        const details = await request<Details>({ action: 'privateProfile', player, revealId: reveal });
        if (mounted.current) setCurrent(details);
        return details;
    }
    const start = useEffectEvent(() => {
        void run(async () => {
            const original = sessionStorage.getItem(storageKey);
            if (original) setPending(original);
            else await read();
        });
    });
    useEffect(() => {
        if (initialRead.current) return;
        initialRead.current = true;
        start();
    }, []);
    function finish() {
        if (locked.current || pending) return;
        if ((dirty || file) && !window.confirm(t('Discard unsaved changes?', 'تجاهل التغييرات غير المحفوظة؟'))) return;
        dialog.current?.close();
        onClose();
    }
    function forget() {
        sessionStorage.removeItem(storageKey);
        if (mounted.current) setPending(null);
    }
    async function confirmed() {
        forget();
        if (!mounted.current) return;
        setDraft({});
        setCurrent(null);
        setNotice('saved');
        try { await read(); }
        catch (error) {
            if (['denied', 'authentication_required', 'setup_required'].includes((error as { code?: string })?.code ?? '')) throw error;
        }
    }
    function save(event: FormEvent) {
        event.preventDefault();
        if (!current || !dirty || pending || conflict) return;
        void run(async () => {
            const op = crypto.randomUUID();
            sessionStorage.setItem(storageKey, op);
            setPending(op);
            try {
                await request({ action: 'savePrivateProfile', player, op, version: current.version, changes: draft });
            } catch (error) {
                const code = (error as { code?: string })?.code;
                if (code === 'conflict' || code === 'invalid' || code === 'limited') {
                    forget();
                    if (mounted.current && code === 'conflict') setConflict(true);
                    if (code === 'conflict') return;
                }
                throw error;
            }
            await confirmed();
        });
    }
    function recover() {
        if (!pending) return;
        void run(async () => {
            const result = await request<{ cancelled?: boolean; player_id?: string; private_profile_version?: number; private_photo_version?: number }>({ action: 'reconcile', op: pending });
            if (!mounted.current) return;
            if (result.player_id === player && typeof result.private_profile_version === 'number') await confirmed();
            else if (result.player_id === player && typeof result.private_photo_version === 'number') {
                await confirmPhoto();
                if (!current) await read();
            }
            else if (result.cancelled) {
                forget();
                if (!current) await read();
                setNotice('cancelled');
            } else setNotice('unavailable');
        });
    }
    async function readPhoto() {
        const data = await request<Photo>({ action: 'privatePhoto', player });
        if (mounted.current) setPhoto(data);
    }
    async function confirmPhoto() {
        forget();
        if (!mounted.current) return;
        setFile(null);
        setPhoto(null);
        setNotice('saved');
        try { await readPhoto(); }
        catch (error) {
            if (['denied', 'authentication_required', 'setup_required'].includes((error as { code?: string })?.code ?? '')) throw error;
        }
    }
    function savePhoto(remove: boolean) {
        if (!photo || pending || (!remove && (!file || file.size > 512 * 1024))) return;
        void run(async () => {
            const image = remove ? null : btoa(Array.from(new Uint8Array(await file!.arrayBuffer()), n => String.fromCharCode(n)).join(''));
            if (!mounted.current) return;
            const op = crypto.randomUUID();
            sessionStorage.setItem(storageKey, op);
            setPending(op);
            try {
                await request({ action: 'savePrivatePhoto', player, op, version: photo.version, image });
            } catch (error) {
                if (['conflict', 'invalid', 'limited'].includes((error as { code?: string })?.code ?? '')) {
                    forget();
                    if ((error as { code?: string }).code === 'conflict' && mounted.current) setPhoto(null);
                }
                throw error;
            }
            await confirmPhoto();
        });
    }
    const update = (key: Field, value: string) => setDraft(previous => ({ ...previous, [key]: value }));

    return <dialog ref={dialog} className="workspace-detail-dialog" aria-label={t('Private profile details', 'بيانات الملف الخاصة')}
            onCancel={event => { event.preventDefault(); finish(); }}>
            <section className="journey-card">
                <h2>{t('Private profile details', 'بيانات الملف الخاصة')}</h2>
                {busy && <p role="status">{t('Working…', 'جارٍ التنفيذ…')}</p>}
                {notice === 'saved' && <p role="status">{current ? t('Private details saved.', 'حُفظت البيانات الخاصة.') : t('Private details saved. Reload to view them.', 'حُفظت البيانات الخاصة. أعد التحميل لعرضها.')}</p>}
                {notice === 'cancelled' && <p role="status">{t('The original save did not commit.', 'لم يكتمل الحفظ الأصلي.')}</p>}
                {notice === 'unavailable' && <p role="alert">{t('Could not complete the request.', 'تعذّر إكمال الطلب.')}</p>}
                {conflict && <p role="alert">{t('The profile changed or the existing ID belongs to another player. Reload current details and review your draft.', 'تغيّر الملف أو أن رقم العضوية السابق يخص لاعبًا آخر. أعد تحميل البيانات الحالية وراجع المسودة.')}</p>}
                {pending ? <Button type="button" disabled={busy} onClick={recover}>{t('Check original profile save', 'تحقّق من حفظ الملف الأصلي')}</Button>
                    : !current ? <Button type="button" disabled={busy} onClick={() => void run(() => read().then(() => {}))}>{t('Reload private details', 'أعد تحميل البيانات الخاصة')}</Button>
                    : <form className="journey-form" onSubmit={save}>
                        {fields.map(([key, en, ar, max]) => {
                            const masked = key === 'nationalId' && current.nationalIdPresent && current.nationalId === undefined;
                            return <div key={key}>
                                <label htmlFor={'player-private-' + key}>{t(en, ar)}</label>
                                {masked ? <div>
                                    <span>{t('Hidden', 'مخفي')}</span>{' '}
                                    <Button type="button" disabled={busy || conflict} onClick={() => void run(async () => {
                                        const version = current.version;
                                        const next = await read(true);
                                        if (next.version !== version && dirty && mounted.current) setConflict(true);
                                    })}>{t('Reveal national ID', 'إظهار الرقم القومي')}</Button>
                                </div> : <Input id={'player-private-' + key} dir="auto" autoComplete="off" maxLength={max}
                                    disabled={busy || conflict} value={draft[key] ?? current[key] ?? ''} onChange={event => update(key, event.target.value)} />}
                                {key in draft && <small>{t('Last loaded:', 'آخر قيمة محمّلة:')} {key === 'nationalId' ? t('Hidden', 'مخفي') : current[key] || t('Not provided', 'غير متوفر')}</small>}
                            </div>;
                        })}
                        {conflict && <Button type="button" disabled={busy} onClick={() => void run(async () => {
                            await read();
                            if (mounted.current) {
                                setDraft(previous => {
                                    const next = { ...previous };
                                    delete next.nationalId;
                                    return next;
                                });
                                setConflict(false);
                            }
                        })}>{t('Reload current details', 'أعد تحميل البيانات الحالية')}</Button>}
                        <Button className="button" disabled={busy || !dirty || conflict}>{t('Save private details', 'حفظ البيانات الخاصة')}</Button>
                    </form>}
                {!pending && current && <section aria-label={t('Profile photo','صورة الملف')}>
                    <h3>{t('Profile photo','صورة الملف')}</h3>
                    {!photo ? <Button type="button" disabled={busy} onClick={() => void run(readPhoto)}>{t('Load profile photo','تحميل صورة الملف')}</Button>
                        : <>
                            {/* Private data URLs must not go through the shared image optimizer. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {photo.image && <img width={96} height={96} style={{objectFit:'contain'}}
                                src={'data:image/jpeg;base64,'+photo.image.replace(/\s/g,'')} alt={t('Current profile photo','صورة الملف الحالية')}/>}
                            <label htmlFor="private-player-photo">{t('Choose photo','اختر صورة')}</label>
                            <Input id="private-player-photo" key={photo.version} type="file" accept="image/jpeg,image/png,image/webp"
                                disabled={busy} onChange={event=>setFile(event.target.files?.[0] ?? null)}/>
                            {file && file.size > 512 * 1024 && <p role="alert">{t('Choose a photo under 512 KB.','اختر صورة بحجم أقل من 512 كيلوبايت.')}</p>}
                            <div className="journey-actions">
                                <Button type="button" disabled={busy || !file || file.size > 512 * 1024} onClick={()=>savePhoto(false)}>{t('Save photo','حفظ الصورة')}</Button>
                                {photo.image && <Button type="button" disabled={busy} onClick={()=>savePhoto(true)}>{t('Remove photo','إزالة الصورة')}</Button>}
                            </div>
                        </>}
                </section>}
                <Button type="button" disabled={busy || Boolean(pending)} onClick={finish}>{t('Close private details', 'إغلاق البيانات الخاصة')}</Button>
            </section>
        </dialog>;
}

export function PlayerMemberLookup({ request, openProfile, onFailure, t }: {
    request: Request; openProfile: (id: string) => Promise<void>; onFailure: (error: unknown) => void; t: Translate;
}) {
    const [kind, setKind] = useState('generated');
    const [reference, setReference] = useState('');
    const [status, setStatus] = useState<'idle' | 'busy' | 'missing' | 'failed'>('idle');
    const active = useRef(true);
    const locked = useRef(false);
    useEffect(() => {
        active.current = true;
        return () => { active.current = false; };
    }, []);
    async function find(event: FormEvent) {
        event.preventDefault();
        if (locked.current) return;
        locked.current = true;
        setStatus('busy');
        try {
            const result = await request<{ player_id: string | null }>({ action: 'findMember', kind, reference });
            if (!active.current) return;
            if (result.player_id) {
                setStatus('idle');
                await openProfile(result.player_id);
            }
            else setStatus('missing');
        } catch (error) {
            if (!active.current) return;
            if (['denied', 'authentication_required', 'setup_required'].includes((error as { code?: string })?.code ?? '')) onFailure(error);
            else setStatus('failed');
        } finally { locked.current = false; }
    }
    return <details>
        <summary>{t('Find by member ID', 'البحث برقم العضوية')}</summary>
        <form className="journey-form" onSubmit={find}>
            <label htmlFor="member-id-kind">{t('ID type', 'نوع الرقم')}</label>
            <select id="member-id-kind" className="ui-select" disabled={status === 'busy'} value={kind} onChange={event => { setKind(event.target.value); setStatus('idle'); }}>
                <option value="generated">{t('Academy member number', 'رقم العضوية في الأكاديمية')}</option>
                <option value="existing">{t('Existing academy ID', 'رقم العضوية السابق')}</option>
            </select>
            <label htmlFor="member-id-reference">{t('Member ID', 'رقم العضوية')}</label>
            <Input id="member-id-reference" dir="auto" autoComplete="off" required maxLength={80} disabled={status === 'busy'} value={reference}
                onChange={event => { setReference(event.target.value); setStatus('idle'); }}/>
            <Button disabled={status === 'busy'}>{t('Find player', 'البحث عن اللاعب')}</Button>
            {status === 'missing' && <p role="status">{t('No player matches this ID.', 'لا يوجد لاعب مطابق لهذا الرقم.')}</p>}
            {status === 'failed' && <p role="alert">{t('Could not look up this ID.', 'تعذّر البحث عن هذا الرقم.')}</p>}
        </form>
    </details>;
}
