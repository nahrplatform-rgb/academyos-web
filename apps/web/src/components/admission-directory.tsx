"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import WorkspacePanes from "./workspace-panes";
import { Button } from "./ui/controls";

export type Academy = { id: string; name: string; setup_complete: boolean; invitation_id: string; generation: number; expires_at: string; revoked: boolean; redeemed_at: string | null; delivery: string; attempts: number };
type Props = {
  heading: ReactNode; toolbar: ReactNode; footer: ReactNode; creation: ReactNode; changeReview: ReactNode; creating: boolean; onCreate: () => void; onClose: () => void;
  items: Academy[];
  arabic: boolean;
  disabled: boolean;
  hasError: boolean;
  onReview: (body: Record<string, unknown>) => void;
  onRetry: (body: Record<string, unknown>) => void;
};

/** Inspection uses only the current authorized page; it never fetches or grants. */
export default function AdmissionDirectory({ items, arabic, disabled, hasError, onReview, onRetry, creation, changeReview, creating, onCreate, onClose, heading, toolbar, footer }: Props) {
  const t = (en: string, ar: string) => arabic ? ar : en;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = items.find(item => item.id === selectedId);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  useEffect(() => { if (selectedId) detailHeading.current?.focus(); }, [selectedId]);
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
  function closeDetails() {
    setSelectedId(null); onClose();
    requestAnimationFrame(() => opener.current?.focus());
  }
  const inspector = <><div className="read-toolbar inspector-read">{toolbar}</div>{creating ? creation : <>    {selected && <aside id="admission-details" className="admission-detail" aria-labelledby="admission-detail-heading">

      <h2 id="admission-detail-heading" tabIndex={-1} ref={detailHeading}>{selected.name}</h2>
      <dl className="admission-properties">
        <div><dt>{t('Owner invitation', 'دعوة المالك')}</dt><dd>{ownerStatus(selected)}</dd></div>
        <div><dt>{t('Invitation expiry', 'انتهاء الدعوة')}</dt><dd>{new Intl.DateTimeFormat(arabic ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(selected.expires_at))} UTC</dd></div>
        <div><dt>{t('Email delivery', 'حالة البريد')}</dt><dd>{deliveryStatus(selected)}</dd></div>
        <div><dt>{t('Setup', 'الإعداد')}</dt><dd>{setupStatus(selected)}</dd></div>
      </dl>
      {!selected.redeemed_at && <div className="journey-actions">
        {!selected.revoked && <Button disabled={disabled} onClick={() => onReview({ action: 'revoke', invitation: selected.invitation_id, generation: selected.generation, name: selected.name })}>{t('Review withdrawal', 'مراجعة إلغاء الدعوة')}</Button>}
        <Button disabled={disabled} onClick={() => onReview({ action: 'reissue', invitation: selected.invitation_id, generation: selected.generation, name: selected.name })}>{t('Review new invitation', 'مراجعة دعوة جديدة')}</Button>
        {!selected.revoked && ['queued', 'failed', 'blocked', 'sending'].includes(selected.delivery) && <Button disabled={disabled} onClick={() => onRetry({ action: 'retry', invitation: selected.invitation_id, generation: selected.generation })}>{t('Retry pending delivery', 'إعادة محاولة الإرسال المعلق')}</Button>}
      </div>}
    </aside>}{changeReview}{!selected && <div className="inspector-empty"><h3>{t('Select an academy','اختر أكاديمية')}</h3><p>{t('Open a row to view the owner invitation, delivery and setup. To admit another academy, choose Create a synthetic academy.','افتح صفاً لعرض دعوة المالك وحالة البريد والإعداد. لإضافة أكاديمية، اختر إنشاء أكاديمية اختبار.')}</p></div>}</>}</>;
  return <WorkspacePanes arabic={arabic} title={creating ? t("New academy", "أكاديمية جديدة") : t("Academy details", "تفاصيل الأكاديمية")} inspector={inspector} selected={Boolean(selected || creating)} selectionKey={selectedId ?? (creating ? 'create' : '')} backLabel={t('Back to academy list','العودة إلى قائمة الأكاديميات')} onBack={closeDetails} blocked={disabled}><header className="task-header">{heading}<div className="read-toolbar">{toolbar}</div></header><section aria-label={t('Admitted academies', 'الأكاديميات المقبولة')} className="admission-layout">
    <div className="admission-directory">
      <div className="section-heading"><h2>{t('Admitted academies', 'الأكاديميات المقبولة')}</h2><Button className="button" disabled={disabled} onClick={() => {setSelectedId(null);onCreate();}}>{t('Create a synthetic academy','إنشاء أكاديمية اختبار')}</Button></div>
      <p className="admission-hint">{t('Open an academy to inspect its invitation and setup status.', 'افتح أكاديمية لمراجعة حالة الدعوة والإعداد.')}</p>
      {items.length === 0 && !hasError && <p>{t('No academies on this page.', 'لا توجد أكاديميات في هذه الصفحة.')}</p>}
      {items.length > 0 && <table className="admission-table">
        <caption className="visually-hidden">{t('Loaded academy admission records', 'سجلات قبول الأكاديميات المحملة')}</caption>
        <thead><tr><th scope="col">{t('Academy', 'الأكاديمية')}</th><th scope="col">{t('Owner invitation', 'دعوة المالك')}</th><th scope="col" className="admission-wide">{t('Setup', 'الإعداد')}</th></tr></thead>
        <tbody>{items.map(item => <tr key={item.id} className={selectedId === item.id ? 'inspected' : undefined}>
          <th scope="row"><Button className="admission-open" aria-expanded={selectedId === item.id} aria-controls={selectedId === item.id ? 'admission-details' : undefined}
            onClick={event => { opener.current = event.currentTarget; setSelectedId(item.id); }}>
            {item.name}<span className="visually-hidden">{t(' — view details', ' — عرض التفاصيل')}</span>
          </Button></th>
          <td>{ownerStatus(item)}</td><td className="admission-wide">{setupStatus(item)}</td>
        </tr>)}</tbody>
      </table>}
    </div>

  </section>{footer}</WorkspacePanes>;
}
