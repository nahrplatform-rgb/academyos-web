"use client";
import { useEffect, useRef, type ReactNode } from "react";
import WorkspacePanes from "./workspace-panes";
import { Button, Input } from "./ui/controls";

export type Academy = { id: string; name: string; setup_complete: boolean; invitation_id: string; generation: number; expires_at: string; revoked: boolean; redeemed_at: string | null; delivery: string; attempts: number };
export type AdmissionView = { selectedId: string | null; search: string; filter: 'all' | 'pending' | 'accepted' | 'delivery' };
type Props = {
  heading: ReactNode; toolbar: ReactNode; footer: ReactNode; creation: ReactNode; changeReview: ReactNode; creating: boolean; reviewing: boolean; onCancelReview: () => void; feedback: ReactNode; onCreate: () => void; onClose: () => void;
  items: Academy[];
  arabic: boolean;
  disabled: boolean;
  hasError: boolean;
  hasMore: boolean;
  view: AdmissionView;
  onViewChange: (patch: Partial<AdmissionView>) => void;
  onReview: (body: Record<string, unknown>) => void;
  onRetry: (body: Record<string, unknown>) => void;
};

/** Inspection uses only the current authorized page; it never fetches or grants. */
export default function AdmissionDirectory({ items, arabic, disabled, hasError, hasMore, view, onViewChange, onReview, onRetry, creation, changeReview, creating, reviewing, onCancelReview, feedback, onCreate, onClose, heading, toolbar, footer }: Props) {
  const t = (en: string, ar: string) => arabic ? ar : en;
  const { selectedId, search, filter } = view;
  const setSelectedId = (selectedId: string | null) => onViewChange({ selectedId });
  const selected = items.find(item => item.id === selectedId);
  const confirmation = useRef<HTMLDialogElement>(null);
  const reviewOpener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = confirmation.current;
    if (!reviewing || !dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('h2')?.focus();
    return () => { dialog.close(); requestAnimationFrame(() => reviewOpener.current?.isConnected && reviewOpener.current.focus()); };
  }, [reviewing]);
  function reviewChange(body: Record<string, unknown>) {
    reviewOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    onReview(body);
  }
  const opener = useRef<HTMLButtonElement | null>(null);
  const creationOpener = useRef<HTMLButtonElement | null>(null);
  const ownerStatus = (item: Academy) => item.redeemed_at ? t('Owner accepted', 'قبل المالك الدعوة') : item.revoked ? t('Invitation revoked', 'أُلغيت الدعوة') : t('Owner acceptance pending', 'بانتظار قبول المالك');
  const setupStatus = (item: Academy) => item.setup_complete ? t('Initial setup complete; operational activation pending', 'اكتمل الإعداد الأولي؛ بانتظار التفعيل التشغيلي') : t('Initial setup incomplete', 'الإعداد الأولي غير مكتمل');
  const deliveryStatus = (item: Academy) => ({
    queued: t('Queued; dispatch may need retry', 'في الانتظار؛ قد يلزم إعادة الإرسال'),
    sending: t('Sending', 'جارٍ الإرسال'),
    accepted: t('Provider accepted; inbox unverified', 'قبل المزود الرسالة؛ الوصول غير مؤكد'),
    failed: t('Failed', 'تعذر الإرسال'),
    unknown: t('Unknown; review before replacement', 'غير مؤكدة؛ راجعها قبل الاستبدال'),
    blocked: t('Blocked by staging recipient/configuration boundary', 'محظور بقيود المستلم أو الإعداد التجريبي'),
  } as Record<string, string>)[item.delivery] ?? item.delivery;
  const deliveryLabel = (item: Academy) => ({
    queued: t('Queued', 'في الانتظار'), sending: t('Sending', 'جارٍ الإرسال'),
    accepted: t('Provider accepted', 'قبل المزود الرسالة'), failed: t('Failed', 'تعذر الإرسال'),
    unknown: t('Unconfirmed', 'غير مؤكدة'), blocked: t('Blocked', 'محظور'),
  } as Record<string, string>)[item.delivery] ?? t('Unavailable', 'غير متاحة');
  const deliveryTone = (item: Academy) => item.delivery === 'accepted' ? 'neutral' : ['failed', 'blocked'].includes(item.delivery) ? 'error' : 'warning';
  const needsDeliveryReview = (item: Academy) => !item.redeemed_at && !item.revoked && item.delivery !== 'accepted';
  const matching = items.filter(item => item.name.toLocaleLowerCase(arabic ? 'ar' : 'en').includes(search.trim().toLocaleLowerCase(arabic ? 'ar' : 'en')) &&
    (filter === 'all' || (filter === 'pending' && !item.redeemed_at && !item.revoked) || (filter === 'accepted' && Boolean(item.redeemed_at)) || (filter === 'delivery' && needsDeliveryReview(item))));
  const filters = [
    { id: 'all', label: t('All', 'الكل'), count: items.length },
    { id: 'pending', label: t('Awaiting acceptance', 'بانتظار القبول'), count: items.filter(item => !item.redeemed_at && !item.revoked).length },
    { id: 'accepted', label: t('Owner accepted', 'قبل المالك الدعوة'), count: items.filter(item => Boolean(item.redeemed_at)).length },
    { id: 'delivery', label: t('Delivery to review', 'إرسال يحتاج إلى مراجعة'), count: items.filter(needsDeliveryReview).length },
  ] as const;
  function changeFilter(filter: AdmissionView['filter']) { onViewChange({ filter, selectedId: null }); }
  function closeDetails() {
    const returnId = creating ? 'admission-create-action' : `admission-academy-${selectedId}`;
    setSelectedId(null); onClose();
    requestAnimationFrame(() => {const prior = creating ? creationOpener.current : opener.current; (prior?.isConnected ? prior : document.getElementById(returnId))?.focus();});
  }
  const inspector = <><div className="read-toolbar inspector-read admission-mobile-refresh">{toolbar}</div>{creating ? creation : <>    {selected && <aside id="admission-details" className="admission-detail" aria-labelledby="admission-detail-heading">
      <p className="eyebrow">{t('Invitation and initial setup', 'الدعوة والإعداد الأولي')}</p>
      <h2 id="admission-detail-heading" tabIndex={-1}>{selected.name}</h2>
      <dl className="admission-properties">
        <div><dt>{t('Owner invitation', 'دعوة المالك')}</dt><dd>{ownerStatus(selected)}</dd></div>
        <div><dt>{t('Email delivery', 'حالة البريد')}</dt><dd><span className="admission-status" data-tone={deliveryTone(selected)}>{deliveryLabel(selected)}</span><p className="admission-status-detail">{deliveryStatus(selected)}</p></dd></div>
        <div><dt>{t('Invitation expiry', 'انتهاء الدعوة')}</dt><dd><bdi>{new Intl.DateTimeFormat(arabic ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(selected.expires_at))} UTC</bdi></dd></div>
        <div><dt>{t('Setup', 'الإعداد')}</dt><dd>{setupStatus(selected)}</dd></div>
      </dl>
      <p className="admission-scope-note">{t('The Academy Owner completes setup in their workspace. Platform access does not open private academy records.', 'يُكمل مالك الأكاديمية الإعداد في مساحته. صلاحية المنصة لا تتيح فتح سجلات الأكاديمية الخاصة.')}</p>
      {!selected.redeemed_at && <section className="admission-invitation-actions" aria-label={t('Invitation actions', 'إجراءات الدعوة')}><h3>{t('Invitation actions', 'إجراءات الدعوة')}</h3><div className="journey-actions">
        {!selected.revoked && <Button disabled={disabled} onClick={() => reviewChange({ action: 'revoke', invitation: selected.invitation_id, generation: selected.generation, name: selected.name })}>{t('Review withdrawal', 'مراجعة إلغاء الدعوة')}</Button>}
        <Button disabled={disabled} onClick={() => reviewChange({ action: 'reissue', invitation: selected.invitation_id, generation: selected.generation, name: selected.name })}>{t('Review new invitation', 'مراجعة دعوة جديدة')}</Button>
        {!selected.revoked && ['queued', 'failed', 'blocked', 'sending'].includes(selected.delivery) && <Button disabled={disabled} onClick={() => onRetry({ action: 'retry', invitation: selected.invitation_id, generation: selected.generation })}>{t('Retry pending delivery', 'إعادة محاولة الإرسال المعلق')}</Button>}
      </div></section>}
    </aside>}{!selected && <div className="inspector-empty"><h3>{t('Select an academy','اختر أكاديمية')}</h3><p>{t('Open a row to view the owner invitation, delivery and setup. To admit another academy, choose Create a synthetic academy.','افتح صفاً لعرض دعوة المالك وحالة البريد والإعداد. لإضافة أكاديمية، اختر إنشاء أكاديمية اختبار.')}</p></div>}</>}</>;
  return <><WorkspacePanes task={creating} focusTargetId={selected && !creating ? "admission-detail-heading" : undefined} arabic={arabic} title={creating ? t("New academy", "أكاديمية جديدة") : t("Academy details", "تفاصيل الأكاديمية")} inspector={creating ? creation : inspector} selected={Boolean(selected || creating)} selectionKey={selectedId ?? (creating ? 'create' : '')} backLabel={t('Back to academy list','العودة إلى قائمة الأكاديميات')} onBack={closeDetails} blocked={disabled}><header className="task-header">{heading}<div className="read-toolbar">{toolbar}</div></header>{!creating && <section aria-label={t('Admitted academies', 'الأكاديميات المقبولة')} className="admission-layout">
    <div className="admission-directory">
      <div className="section-heading"><h2>{t('Admitted academies', 'الأكاديميات المقبولة')}</h2><Button id="admission-create-action" ref={creationOpener} className="button" disabled={disabled} onClick={() => {setSelectedId(null);onCreate();}}>{t('Create a synthetic academy','إنشاء أكاديمية اختبار')}</Button></div>
      <p className="admission-hint">{t('Follow the owner invitation, delivery and initial setup. Select an academy for its available actions.', 'تابع دعوة المالك والإرسال والإعداد الأولي. اختر أكاديمية لعرض الإجراءات المتاحة.')}</p>
      <div className="admission-filters" role="group" aria-label={t('Filter loaded academies', 'تصفية الأكاديميات المحملة')}>{filters.map(option => <Button key={option.id} disabled={disabled} aria-pressed={filter === option.id} onClick={() => changeFilter(option.id)}><span>{option.label}</span>{!hasError && <strong>{option.count.toLocaleString(arabic ? 'ar' : 'en')}</strong>}</Button>)}</div>
      <div className="admission-search"><label htmlFor="admission-search">{t('Search loaded academies', 'البحث في الأكاديميات المحملة')}</label><Input id="admission-search" type="search" value={search} disabled={disabled} aria-describedby="admission-search-scope" onChange={event => onViewChange({search:event.target.value,selectedId:null})} /></div>
      <p id="admission-search-scope" className="admission-coverage">{t(hasMore ? 'More academies are available. Search and counts cover loaded records only.' : 'Search and counts cover the records returned by this read.', hasMore ? 'توجد أكاديميات أخرى. يشمل البحث والأعداد السجلات المحملة فقط.' : 'يشمل البحث والأعداد السجلات التي أعادتها هذه القراءة.')}</p>
      <p className="admission-result-count" role="status">{hasError ? t('Admission records are unavailable. Retry the current read.', 'سجلات القبول غير متاحة. أعد محاولة القراءة الحالية.') : t(`${matching.length} of ${items.length} loaded academies shown`, `عرض ${matching.length.toLocaleString('ar')} من ${items.length.toLocaleString('ar')} أكاديمية محملة`)}</p>
      {items.length === 0 && !hasError && <p>{t('No academies on this page.', 'لا توجد أكاديميات في هذه الصفحة.')}</p>}
      {items.length > 0 && matching.length === 0 && <div className="admission-filtered-empty"><h3>{t('No loaded academies match', 'لا توجد أكاديميات محملة مطابقة')}</h3><p>{t('Change the search or status filter. No academy has been removed.', 'غيّر البحث أو مرشح الحالة. لم تُحذف أي أكاديمية.')}</p><Button disabled={disabled} onClick={() => onViewChange({search:'',filter:'all',selectedId:null})}>{t('Clear filters', 'مسح المرشحات')}</Button></div>}
      {matching.length > 0 && <table className="admission-table">
        <caption className="visually-hidden">{t('Loaded academy admission records', 'سجلات قبول الأكاديميات المحملة')}</caption>
        <thead><tr><th scope="col">{t('Academy', 'الأكاديمية')}</th><th scope="col">{t('Owner invitation', 'دعوة المالك')}</th><th scope="col" className="admission-desktop">{t('Email delivery', 'حالة البريد')}</th><th scope="col" className="admission-wide">{t('Setup', 'الإعداد')}</th></tr></thead>
        <tbody>{matching.map(item => <tr key={item.id} className={selectedId === item.id ? 'inspected' : undefined}>
          <th scope="row"><Button id={`admission-academy-${item.id}`} className="admission-open" aria-expanded={selectedId === item.id} aria-controls={selectedId === item.id ? 'admission-details' : undefined}
            onClick={event => { opener.current = event.currentTarget; setSelectedId(item.id); }}>
            {item.name}<span className="visually-hidden">{t(' — view details', ' — عرض التفاصيل')}</span>
          </Button><span className="admission-phone-delivery">{t('Email delivery', 'حالة البريد')}: <span className="admission-status" data-tone={deliveryTone(item)}>{deliveryLabel(item)}</span></span></th>
          <td><span className="admission-status" data-tone={item.redeemed_at ? 'success' : item.revoked ? 'neutral' : 'warning'}>{ownerStatus(item)}</span></td><td className="admission-desktop"><span className="admission-status" data-tone={deliveryTone(item)}>{deliveryLabel(item)}</span></td><td className="admission-wide">{t(item.setup_complete ? 'Initial setup saved' : 'Incomplete', item.setup_complete ? 'حُفظ الإعداد الأولي' : 'غير مكتمل')}</td>
        </tr>)}</tbody>
      </table>}
    </div>

  </section>}{!creating && footer}</WorkspacePanes>
    <dialog ref={confirmation} className="register-dialog admission-confirmation" aria-label={t('Invitation change review', 'مراجعة تغيير الدعوة')} onCancel={event => { event.preventDefault(); if (!disabled) onCancelReview(); }}>
      {changeReview}{feedback}
    </dialog>
  </>;
}
