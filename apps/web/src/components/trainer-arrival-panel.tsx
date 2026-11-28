'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { staffQrPattern } from '@/lib/qr-attendance';
import { newQrCode } from '@/lib/qr-attendance';
import { Button, Input, Select } from './ui/controls';
import QrPrintCard from './qr-print-card';

type Slot = { id: string; name: string; starts_at: string; ends_at: string; coverageVersion?: number; actual?: string };
type Staff = { id: string; name: string; card: string | null };
type Arrival = { id: string; staff: string; capturedAt: string; cardActive: boolean; candidates: Slot[] };
type Context = { staff: Staff[]; arrivals: Arrival[]; now: string };
type Result = { id?: string; arrival?: string; choices?: Slot[]; cancelled?: boolean };
export type TrainerArrivalHandle = { scan: (code: string) => void };

const confirmedRefusals = new Set(['denied','invalid','conflict','review_required','limited','setup_required']);
class Failure extends Error { constructor(readonly code: string) { super(code); } }

const TrainerArrivalPanel = forwardRef<TrainerArrivalHandle, {
  academy: string; branch: string; branchName: string; timezone: string; subject: string;
  arabic: boolean; events: Slot[]; onBlocked: (blocked: boolean) => void;
}>(function TrainerArrivalPanel({academy,branch,branchName,timezone,subject,arabic,events,onBlocked}, ref) {
  const t = (en: string, ar: string) => arabic ? ar : en;
  const storageKey = `trainer-arrival:${subject}:${academy}:${branch}`;
  const [context, setContext] = useState<Context | null>(null);
  const [selected, setSelected] = useState('');
  const [arrivalId, setArrivalId] = useState('');
  const [code, setCode] = useState('');
  const [manualEvent, setManualEvent] = useState('');
  const [reason, setReason] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [choices, setChoices] = useState<Slot[]>([]);
  const [coverage, setCoverage] = useState<Record<string,string>>({});
  const [issued, setIssued] = useState<{name:string; code:string} | null>(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState('');
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(true);
  const token = useRef('');
  const lock = useRef(false);
  const visible = useRef(false);

  async function api<T>(body: Record<string,unknown>): Promise<T> {
    const response = await fetch('/api/trainer-compensation',{method:'POST',cache:'no-store',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({academy,...body}),
      signal:AbortSignal.timeout(12000)});
    const result = await response.json();
    if (!response.ok) throw new Failure(result.error ?? 'unavailable');
    return result.data as T;
  }
  async function load() {
    const result = await api<Context>({action:'staff_context',branch});
    if (visible.current) setContext(result);
  }
  useEffect(() => {
    visible.current = true;
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener('online',updateOnline);
    window.addEventListener('offline',updateOnline);
    void Promise.resolve().then(() => {
      if (!visible.current) return;
      updateOnline();
      try {
        const saved = sessionStorage.getItem(storageKey) ?? '';
        if (saved && !/^[a-f0-9-]{36}$/i.test(saved)) throw Error();
        setPending(saved);
        setReady(true);
      } catch { setStatus('storage'); }
      void load().catch(() => { if (visible.current) setStatus('unavailable'); });
    });
    return () => {
      visible.current = false;
      token.current = '';
      window.removeEventListener('online',updateOnline);
      window.removeEventListener('offline',updateOnline);
    };
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    onBlocked(Boolean(pending || busy || choices.length));
    return () => onBlocked(false);
  }, [busy,pending,choices.length,onBlocked]);

  function finish(result: Result) {
    if (result.arrival) {
      setArrivalId(result.arrival);
      setCoverage({});
    }
    setStatus(result.cancelled ? 'cancelled' : 'saved');
  }
  async function mutate(action: string, details: Record<string,unknown>, credential?: { name:string; code:string }) {
    if (lock.current || pending || !ready || !online || !navigator.onLine) return;
    const operation = crypto.randomUUID();
    try { sessionStorage.setItem(storageKey,operation); }
    catch { setStatus('storage'); return; }
    lock.current = true;
    setBusy(true); setPending(operation); setStatus('');
    try {
      const result = await api<Result>({action,operation,branch,...details});
      sessionStorage.removeItem(storageKey);
      setPending('');
      if (result.choices) {
        setChoices(result.choices);
      } else {
        setChoices([]);
        token.current='';
        finish(result);
        if (action==='staff_card') setIssued(credential ?? null);
        if (action==='staff_verify') { setCoverage({}); setReason(''); }
        await load().catch(() => setStatus('refresh'));
      }
    } catch (error) {
      if (error instanceof Failure && confirmedRefusals.has(error.code)) {
        sessionStorage.removeItem(storageKey); setPending(''); setStatus(error.code); setChoices([]);
        token.current='';
        if (error.code==='denied') { setContext(null); setIssued(null); }
      } else setStatus('unknown');
    } finally { setBusy(false); lock.current=false; }
  }
  function scan(value: string) {
    if (!staffQrPattern.test(value) || lock.current || pending || choices.length) return;
    if (!online || !navigator.onLine) { setStatus('offline'); return; }
    token.current = value;
    setCode('');
    void mutate('staff_arrival',{code:value});
  }
  useImperativeHandle(ref, () => ({scan}));
  async function reconcile() {
    if (!pending || lock.current || !online) return;
    lock.current=true;
    setBusy(true);
    try {
      const result = await api<Result>({action:'operation',operation:pending});
      sessionStorage.removeItem(storageKey); setPending(''); finish(result);
      await load().catch(() => setStatus('refresh'));
    } catch { setStatus('unknown'); }
    finally { setBusy(false); lock.current=false; }
  }

  const trainer = context?.staff.find(item => item.id===selected);
  const arrival = context?.arrivals.find(item => item.id===arrivalId);
  const disabled = busy || Boolean(pending) || !ready || !online;
  const selectedSlots = arrival?.candidates.filter(slot => coverage[slot.id]) ?? [];
  const requiresReason = selectedSlots.some(slot => slot.coverageVersion || coverage[slot.id]!==arrival?.staff);
  const format = (value: string) => new Intl.DateTimeFormat(arabic?'ar':'en',{timeZone:timezone,dateStyle:'short',timeStyle:'short'}).format(new Date(value));
  const statusText: Record<string,string> = {
    saved:t('Trainer operation confirmed.','تم تأكيد عملية المدرب.'),
    cancelled:t('The original did not save.','لم تُحفظ العملية الأصلية.'),
    offline:t('Trainer capture is unavailable offline.','تسجيل وصول المدرب غير متاح دون اتصال.'),
    denied:t('Current access is unavailable.','الصلاحية الحالية غير متاحة.'),
    unknown:t('Check the original operation before trying again.','تحقق من العملية الأصلية قبل المحاولة مجدداً.'),
    refresh:t('Saved. Refresh to see the latest result.','تم الحفظ. حدّث لعرض أحدث نتيجة.'),
    storage:t('Operation recovery is unavailable.','استرداد العملية غير متاح.'),
    review_required:t('Review the current session or coverage and try again.','راجع الجلسة أو التغطية الحالية وأعد المحاولة.'),
  };
  return <section aria-label={t('Trainer attendance','حضور المدربين')}>
    <h2>{t('Trainer attendance','حضور المدربين')}</h2>
    {!online && <p role="status">{statusText.offline}</p>}
    {status && <p role={status==='saved'?'status':'alert'}>{statusText[status] ?? t('Could not load or confirm Trainer attendance.','تعذر تحميل حضور المدرب أو تأكيده.')}</p>}
    {pending && <Button disabled={busy || !online} onClick={() => void reconcile()}>{t('Check original Trainer operation','تحقق من عملية المدرب الأصلية')}</Button>}
    {context && <>
      <label>{t('Trainer QR code','رمز المدرب')} <Input disabled={disabled || choices.length>0} value={code} autoComplete="off" onChange={e => setCode(e.target.value)} /></label>
      <Button disabled={disabled || choices.length>0 || !staffQrPattern.test(code)} onClick={() => scan(code)}>{t('Scan Trainer card','امسح بطاقة المدرب')}</Button>
      {choices.length>0 && <fieldset><legend>{t('Choose the starting session','اختر جلسة البداية')}</legend>
        {choices.map(slot => <Button key={slot.id} disabled={disabled} onClick={() => void mutate('staff_arrival',{code:token.current,event:slot.id})}>{slot.name} · {format(slot.starts_at)}</Button>)}
        <Button disabled={disabled} onClick={() => {token.current='';setChoices([]);}}>{t('Cancel Trainer scan','ألغِ مسح بطاقة المدرب')}</Button>
      </fieldset>}
      <details><summary>{t('Trainer cards and manual arrival','بطاقات المدربين والوصول اليدوي')}</summary>
        <label>{t('Trainer','المدرب')} <Select disabled={disabled} value={selected} onChange={e => {setSelected(e.target.value);setIssued(null);}}>
          <option value="">{t('Select a trainer','اختر مدرباً')}</option>{context.staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
        </Select></label>
        {trainer && <>
          <Button disabled={disabled} onClick={() => {
            const cardCode=newQrCode().replace('aos:qr:','aos:staff:');
            void mutate('staff_card',{staff:trainer.id,expected:trainer.card,code:cardCode},{name:trainer.name,code:cardCode});
          }}>{trainer.card ? t('Replace Trainer card','استبدل بطاقة المدرب') : t('Issue Trainer card','أصدر بطاقة المدرب')}</Button>
          {trainer.card && <Button disabled={disabled} onClick={() => void mutate('staff_card',{staff:trainer.id,expected:trainer.card,code:null})}>{t('Revoke Trainer card','ألغِ بطاقة المدرب')}</Button>}
          {issued && <QrPrintCard code={issued.code} name={issued.name} branch={branchName} arabic={arabic}/>}
          <label>{t('Starting session','جلسة البداية')} <Select disabled={disabled} value={manualEvent} onChange={e => setManualEvent(e.target.value)}>
            <option value="">{t('Select a session','اختر جلسة')}</option>
            {events.map(slot => <option key={slot.id} value={slot.id}>{slot.name} · {format(slot.starts_at)}</option>)}
          </Select></label>
          <label>{t('Manual arrival reason','سبب الوصول اليدوي')} <Input disabled={disabled} value={manualReason} maxLength={300} onChange={e => setManualReason(e.target.value)} /></label>
          <Button disabled={disabled || !manualEvent || !manualReason.trim()} onClick={() => void mutate('staff_arrival',{staff:trainer.id,event:manualEvent,reason:manualReason.trim()})}>{t('Record manual arrival','سجّل الوصول اليدوي')}</Button>
        </>}
      </details>
      <label>{t('Saved arrival','وصول محفوظ')} <Select disabled={disabled} value={arrivalId} onChange={e => {setArrivalId(e.target.value);setCoverage({});}}>
        <option value="">{t('Select an arrival','اختر وصولاً')}</option>
        {context.arrivals.map(item => <option key={item.id} value={item.id}>{context.staff.find(person => person.id===item.staff)?.name ?? t('Trainer','مدرب')} · {format(item.capturedAt)}</option>)}
      </Select></label>
      {arrival && <fieldset><legend>{t('Confirm completed coverage','أكد تغطية الجلسات المكتملة')}</legend>
        {arrival.candidates.map(slot => <label key={slot.id}>{slot.name} · {format(slot.starts_at)}{slot.actual ? ` · ${context.staff.find(person => person.id===slot.actual)?.name ?? t('Saved','محفوظة')}` : ''}
          <Select disabled={disabled || !arrival.cardActive || Date.parse(slot.ends_at)>Date.parse(context.now)} value={coverage[slot.id] ?? ''}
            onChange={e => setCoverage(old => ({...old,[slot.id]:e.target.value}))}>
            <option value="">{t('Leave unchanged','اتركها دون تعديل')}</option>
            {context.staff.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}
          </Select></label>)}
        <label>{t('Substitution or correction reason','سبب الاستبدال أو التصحيح')} <Input disabled={disabled} value={reason} maxLength={300} onChange={e => setReason(e.target.value)} /></label>
        <Button disabled={disabled || !arrival.cardActive || !selectedSlots.length || (requiresReason && !reason.trim())} onClick={() => void mutate('staff_verify',{
          arrival:arrival.id,reason:reason.trim(),coverage:selectedSlots.map(slot => ({event:slot.id,staff:coverage[slot.id],version:slot.coverageVersion ?? 0})),
        })}>{t('Confirm Trainer coverage','أكد تغطية المدرب')}</Button>
      </fieldset>}
      <Button disabled={disabled} onClick={() => void load().catch(() => setStatus('unavailable'))}>{t('Refresh Trainer attendance','حدّث حضور المدربين')}</Button>
    </>}
  </section>;
});
export default TrainerArrivalPanel;
