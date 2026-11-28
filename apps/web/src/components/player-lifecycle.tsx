'use client';

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Button } from './ui/controls';

type PendingLifecycle = { player: string; op: string; archived: boolean };
type LifecycleResult = { player_id?: string; lifecycle_version?: number; archived?: boolean; cancelled?: boolean; commitments?: boolean };

export function readPendingLifecycle(key: string): PendingLifecycle | null {
    try {
        const value = JSON.parse(sessionStorage.getItem(key) ?? 'null');
        const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
        if (uuid.test(value?.player) && uuid.test(value?.op) && typeof value?.archived === 'boolean') return value;
    } catch {}
    return null;
}

export default function PlayerLifecycle({ player, version, archived, storageKey, request, onConfirmed, onFailure, t, ref }: {
    player: string;
    version: number;
    archived: boolean;
    storageKey: string;
    request: <T>(body: Record<string, unknown>) => Promise<T>;
    onConfirmed: (archived: boolean) => Promise<void>;
    onFailure: (error: unknown) => void;
    t: (en: string, ar: string) => string;
    ref: Ref<{canLeave: () => boolean}>;
}) {
    const [pending, setPending] = useState(() => readPendingLifecycle(storageKey));
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState<boolean | null>(null);
    const [readFailed, setReadFailed] = useState(false);
    const [message, setMessage] = useState('');
    const locked = useRef(false);
    useImperativeHandle(ref, () => ({canLeave: () => !locked.current && !pending}));
    useEffect(() => {
        if (!pending && !busy) return;
        const guard = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', guard);
        return () => window.removeEventListener('beforeunload', guard);
    }, [pending, busy]);

    async function run(action: () => Promise<void>) {
        if (locked.current) return;
        locked.current = true;
        setBusy(true);
        setMessage('');
        try {
            await action();
        } catch (error) {
            const code = (error as {code?: string})?.code;
            if (code === 'denied' || code === 'setup_required' || code === 'authentication_required') onFailure(error);
            else setMessage(t('Could not complete the request. Try again.', 'تعذّر إكمال الطلب. أعد المحاولة.'));
        } finally {
            locked.current = false;
            setBusy(false);
        }
    }

    function forget() {
        sessionStorage.removeItem(storageKey);
        setPending(null);
        setConfirming(false);
    }

    async function refresh(archived: boolean) {
        setReadFailed(true);
        await onConfirmed(archived);
        setReadFailed(false);
    }

    async function settle(receipt: LifecycleResult, original: PendingLifecycle) {
        if (receipt.cancelled === true) {
            forget();
            setMessage(t('The original change did not save.', 'لم يُحفظ التغيير الأصلي.'));
            return;
        }
        if (receipt.player_id !== original.player) throw Error('Unexpected player');
        if (receipt.commitments === true) {
            forget();
            setMessage(t('Resolve this player’s current or upcoming roster commitments before archiving.',
                'عالج التزامات اللاعب الحالية أو القادمة في قوائم التدريب قبل الأرشفة.'));
            return;
        }
        if (receipt.archived !== original.archived || !Number.isInteger(receipt.lifecycle_version)) throw Error('Unexpected lifecycle receipt');
        forget();
        setResult(receipt.archived);
        await refresh(receipt.archived);
    }

    async function save() {
        const original = { player, op: crypto.randomUUID(), archived: !archived };
        sessionStorage.setItem(storageKey, JSON.stringify(original));
        setPending(original);
        let receipt: LifecycleResult;
        try {
            receipt = await request({ action: 'setArchived', ...original, version });
        } catch (error) {
            const code = (error as {code?: string})?.code;
            if (code === 'conflict' || code === 'limited' || code === 'invalid') forget();
            if (code === 'conflict') {
                setMessage(t('The player changed. Refresh the profile and review the action again.', 'تغيّر سجل اللاعب. حدّث الملف وراجع الإجراء مجددًا.'));
                return;
            }
            throw error;
        }
        await settle(receipt, original);
    }

    const label = archived ? t('Restore player', 'استعادة اللاعب') : t('Archive player', 'أرشفة اللاعب');
    return <section aria-label={t('Player status', 'حالة اللاعب')}>
        {result !== null && <p role="status">{result ? t('Player archived.', 'تمت أرشفة اللاعب.') : t('Player restored.', 'تمت استعادة اللاعب.')}</p>}
        {message && <p role="alert">{message}</p>}
        {pending ? <Button type="button" disabled={busy || pending.player !== player} onClick={() => void run(async () => {
            const receipt = await request<LifecycleResult>({action:'reconcile',op:pending.op});
            await settle(receipt,pending);
        })}>{t('Check original player change', 'تحقّق من تغيير حالة اللاعب الأصلي')}</Button>
        : readFailed && result !== null ? <Button type="button" disabled={busy} onClick={() => void run(() => refresh(result))}>
            {t('Reload player status', 'أعد تحميل حالة اللاعب')}
        </Button> : confirming ? <>
            <p>{archived ? t('Restore this player to active selection?', 'هل تريد إتاحة هذا اللاعب مجددًا للاختيار؟')
                : t('Archive this player and keep their history?', 'هل تريد أرشفة هذا اللاعب مع الاحتفاظ بسجله؟')}</p>
            <Button type="button" disabled={busy} onClick={() => void run(save)}>{t('Confirm', 'تأكيد')}</Button>
            <Button type="button" disabled={busy} onClick={() => setConfirming(false)}>{t('Cancel', 'إلغاء')}</Button>
        </> : <Button type="button" disabled={busy} onClick={() => {setResult(null);setConfirming(true);}}>{label}</Button>}
    </section>;
}
