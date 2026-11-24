'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceShell from './workspace-shell';
import { Button, Input } from './ui/controls';

type Ticket = {
  id: string; subject: string; status: 'open' | 'resolved' | 'reopened'; version: number;
  created_at: string; updated_at: string; resolved_at: string | null;
};
type Message = { id: string; author_id: string; body: string; created_at: string };

type Pending =
  | { kind: 'create'; op: string; subject: string; message: string }
  | { kind: 'reply'; op: string; ticketId: string; message: string }
  | { kind: 'resolve' | 'reopen'; op: string; ticketId: string; version: number };

type ErrorKind = 'invalid' | 'refused' | 'conflict' | 'stale' | 'limited' | 'unknown' | 'uncommitted';

class ApiError extends Error {
  constructor(public code: string) { super(code); }
}

async function call<T>(academy: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/support', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ academy_id: academy, ...body }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(payload?.error ?? 'unavailable');
  return payload?.data as T;
}

function newOperation(): string {
  const generator = globalThis.crypto?.randomUUID;
  if (typeof generator === 'function') return generator.call(globalThis.crypto);
  const bytes = new Uint8Array(16);
  globalThis.crypto?.getRandomValues?.(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function SupportWorkspace({ locale, academy }: { locale: string; academy: string }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKind | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const ar = locale === 'ar';
  const t = (en: string, arText: string) => ar ? arText : en;
  const statusLabel = (status: Ticket['status']) =>
    status === 'open' ? t('Open', 'مفتوحة') : status === 'resolved' ? t('Resolved', 'محلولة') : t('Reopened', 'أعيد فتحها');
  const errorText: Record<ErrorKind, string> = {
    invalid: t('That input is not valid. Check the fields and try again.', 'هذا الإدخال غير صالح. تحقق من الحقول وحاول مرة أخرى.'),
    refused: t('Access is unavailable. Check your account and current permission.', 'الوصول غير متاح. تحقق من حسابك والصلاحية الحالية.'),
    conflict: t('This request conflicts with a saved result. Reload and try again.', 'يتعارض هذا الطلب مع نتيجة محفوظة. أعد التحميل وحاول مرة أخرى.'),
    stale: t('This ticket changed elsewhere. The latest state is shown.', 'تغيرت هذه التذكرة في مكان آخر. تُعرض أحدث حالة.'),
    limited: t('Too many requests. Wait a moment and try again.', 'طلبات كثيرة جدًا. انتظر قليلًا وحاول مرة أخرى.'),
    unknown: t('The outcome is unknown. Retry the same request or check the original operation.', 'النتيجة غير معروفة. أعد المحاولة بنفس الطلب أو تحقق من العملية الأصلية.'),
    uncommitted: t('No saved result was found for that request. You can retry it.', 'لم يتم العثور على نتيجة محفوظة لهذا الطلب. يمكنك إعادة المحاولة.'),
  };

  const loadTickets = useCallback(async () => {
    try {
      const data = await call<Ticket[]>(academy, { action: 'list_tickets' });
      setTickets(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'denied' ? 'refused' : 'unknown');
    }
  }, [academy]);

  const loadMessages = useCallback(async (ticketId: string) => {
    try {
      const data = await call<Message[]>(academy, { action: 'list_messages', ticket_id: ticketId });
      setMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof ApiError && e.code === 'denied' ? 'refused' : 'unknown');
    }
  }, [academy]);

  useEffect(() => {
    let active = true;
    (async () => {
      await loadTickets();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [loadTickets]);

  const closePending = () => setPending(null);

  const fail = useCallback(async (e: unknown) => {
    const code = e instanceof ApiError ? e.code : 'unavailable';
    // Only a definitive answer retires the original operation. A transport or
    // provider failure keeps it so the caller can retry or reconcile it.
    if (['invalid', 'denied', 'not_found', 'conflict', 'stale'].includes(code)) setPending(null);
    if (code === 'stale') { setError('stale'); await loadTickets(); return; }
    if (code === 'conflict') { setError('conflict'); return; }
    if (code === 'invalid') { setError('invalid'); return; }
    if (code === 'denied' || code === 'not_found') { setError('refused'); return; }
    if (code === 'limited') { setError('limited'); return; }
    setError('unknown');
  }, [loadTickets]);

  const applyOutcome = useCallback(async (p: Pending, data: Record<string, unknown> | null) => {
    setError(null);
    setPending(null);
    if (p.kind === 'create') {
      setSubject(''); setMessage('');
      await loadTickets();
      const ticketId = typeof data?.ticket_id === 'string' ? data.ticket_id : null;
      if (ticketId) { setSelected(ticketId); await loadMessages(ticketId); }
      requestAnimationFrame(() => headingRef.current?.focus());
    } else if (p.kind === 'reply') {
      setReply('');
      await loadMessages(p.ticketId);
      requestAnimationFrame(() => replyRef.current?.focus());
    } else {
      await loadTickets();
    }
  }, [loadMessages, loadTickets]);

  const submit = useCallback(async (p: Pending) => {
    setBusy(true);
    setError(null);
    setPending(p);
    try {
      let data: Record<string, unknown> | null = null;
      if (p.kind === 'create') {
        data = await call(academy, { action: 'create_ticket', subject: p.subject, message: p.message, op: p.op });
      } else if (p.kind === 'reply') {
        data = await call(academy, { action: 'reply', ticket_id: p.ticketId, message: p.message, op: p.op });
      } else {
        data = await call(academy, { action: p.kind, ticket_id: p.ticketId, version: p.version, op: p.op });
      }
      await applyOutcome(p, data);
    } catch (e) {
      await fail(e);
    } finally {
      setBusy(false);
    }
  }, [academy, applyOutcome, fail]);

  const createTicket = () => {
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();
    if (!cleanSubject || !cleanMessage || busy) return;
    submit({ kind: 'create', op: newOperation(), subject: cleanSubject, message: cleanMessage });
  };

  const sendReply = () => {
    const clean = reply.trim();
    if (!selected || !clean || busy) return;
    submit({ kind: 'reply', op: newOperation(), ticketId: selected, message: clean });
  };

  const changeStatus = (kind: 'resolve' | 'reopen') => {
    const ticket = tickets.find(item => item.id === selected);
    if (!ticket || busy) return;
    submit({ kind, op: newOperation(), ticketId: ticket.id, version: ticket.version });
  };

  const retry = () => { if (pending && !busy) submit(pending); };

  const reconcile = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      const data = await call<Record<string, unknown>>(academy, { action: 'reconcile', op: pending.op });
      if (data?.error === 'not_found') { setError('uncommitted'); return; }
      await applyOutcome(pending, data);
    } catch (e) {
      await fail(e);
    } finally {
      setBusy(false);
    }
  };

  const selectTicket = async (id: string) => {
    setSelected(id);
    setError(null);
    await loadMessages(id);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const selectedTicket = tickets.find(ticket => ticket.id === selected) ?? null;

  return (
    <WorkspaceShell
      role="owner"
      module="operations"
      locale={locale}
      context={t('Academy Owner workspace', 'مساحة مالك الأكاديمية')}
      title={t('Support', 'الدعم')}
      homeHref={`/${locale}/workspace`}
      languageHref={`/${ar ? 'en' : 'ar'}/workspace/${academy}/support`}
      navigation={[{ href: `/${locale}/workspace/${academy}/support`, label: t('Support', 'الدعم'), current: true }]}
      account={<></>}
    >
      <section className="support-workspace" aria-busy={busy || undefined}>
        <p className="support-scope">
          {t('Messages stay inside AcademyOS. External email, SMS and push are not enabled.',
            'تبقى الرسائل داخل AcademyOS. البريد الإلكتروني والرسائل النصية والإشعارات غير مفعّلة.')}
        </p>

        {error && (
          <div role="alert" className="support-error">
            <p>{errorText[error]}</p>
            {pending && (error === 'unknown' || error === 'uncommitted' || error === 'limited') && (
              <div className="support-recovery">
                <Button type="button" onClick={retry} disabled={busy}>{t('Retry same request', 'أعد المحاولة بنفس الطلب')}</Button>
                <Button type="button" onClick={reconcile} disabled={busy}>{t('Check original operation', 'تحقق من العملية الأصلية')}</Button>
                <Button type="button" className="ui-button-secondary" onClick={closePending} disabled={busy}>{t('Dismiss', 'تجاهل')}</Button>
              </div>
            )}
          </div>
        )}

        <div className="support-columns">
          <div className="support-column">
            <h2>{t('New ticket', 'تذكرة جديدة')}</h2>
            <label className="support-field">
              <span>{t('Subject', 'الموضوع')}</span>
              <Input value={subject} maxLength={200} onChange={e => setSubject(e.target.value)} disabled={busy} />
            </label>
            <label className="support-field">
              <span>{t('Message', 'الرسالة')}</span>
              <textarea value={message} maxLength={4000} onChange={e => setMessage(e.target.value)} rows={3} disabled={busy} style={{ width: '100%' }} />
            </label>
            <Button type="button" onClick={createTicket} disabled={busy || !subject.trim() || !message.trim()}>
              {busy && pending?.kind === 'create' ? t('Creating…', 'جارٍ الإنشاء…') : t('Create ticket', 'إنشاء تذكرة')}
            </Button>

            <h2>{t('Tickets', 'التذاكر')}</h2>
            {loading ? (
              <p role="status">{t('Loading…', 'جارٍ التحميل…')}</p>
            ) : tickets.length === 0 ? (
              <p className="support-empty">{t('No support tickets yet.', 'لا توجد تذاكر دعم بعد.')}</p>
            ) : (
              <ul className="support-list">
                {tickets.map(ticket => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      className={ticket.id === selected ? 'support-ticket support-ticket-selected' : 'support-ticket'}
                      aria-current={ticket.id === selected ? 'true' : undefined}
                      onClick={() => selectTicket(ticket.id)}
                    >
                      <span>{ticket.subject}</span>
                      <small>{statusLabel(ticket.status)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="support-column support-thread">
            {selectedTicket ? (
              <>
                <h2 ref={headingRef} tabIndex={-1}>{selectedTicket.subject} — {statusLabel(selectedTicket.status)}</h2>
                <div className="support-messages" role="log">
                  {messages.length === 0
                    ? <p className="support-empty">{t('Loading messages…', 'جارٍ تحميل الرسائل…')}</p>
                    : messages.map(item => (
                      <article key={item.id} className="support-message">
                        <small>{item.author_id} · {new Date(item.created_at).toLocaleString(ar ? 'ar' : 'en')}</small>
                        <p>{item.body}</p>
                      </article>
                    ))}
                </div>
                <label className="support-field">
                  <span>{t('Reply', 'الرد')}</span>
                  <textarea ref={replyRef} value={reply} maxLength={4000} onChange={e => setReply(e.target.value)} rows={2} disabled={busy} style={{ width: '100%' }} />
                </label>
                <div className="support-actions">
                  <Button type="button" onClick={sendReply} disabled={busy || !reply.trim()}>
                    {t('Send reply', 'إرسال الرد')}
                  </Button>
                  {selectedTicket.status !== 'resolved'
                    ? <Button type="button" onClick={() => changeStatus('resolve')} disabled={busy}>{t('Resolve', 'حل')}</Button>
                    : <Button type="button" onClick={() => changeStatus('reopen')} disabled={busy}>{t('Reopen', 'إعادة فتح')}</Button>}
                </div>
              </>
            ) : (
              <p className="support-empty">{t('Select a ticket to read and reply.', 'اختر تذكرة للقراءة والرد.')}</p>
            )}
          </div>
        </div>
      </section>
    </WorkspaceShell>
  );
}
