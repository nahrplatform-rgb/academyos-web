import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import WorkspaceShell from '../../apps/web/src/components/workspace-shell';
import { Button, Input, Select } from '../../apps/web/src/components/ui/controls';

// Review-only model. No product route, account, fetch, persistence or auth bypass.
type Player = { id: string; name: string; contact: string; branch: string };
type Stage = 'directory' | 'form' | 'duplicates' | 'review' | 'saving' | 'unknown' | 'profile';
const fixtures: Player[] = [
  { id: 'fictional-01', name: 'Alex Demo', contact: '', branch: 'Main Demo Branch' },
  { id: 'fictional-02', name: 'Sam Example', contact: '', branch: 'Main Demo Branch' },
];
const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
function Review() {
  const [locale, setLocale] = useState('en');
  const ar = locale === 'ar', t = (en: string, arabic: string) => ar ? arabic : en;
  const [stage, setStage] = useState<Stage>('directory');
  const [scenario, setScenario] = useState('normal');
  const [players, setPlayers] = useState<Player[]>(fixtures);
  const [name, setName] = useState(''), [contact, setContact] = useState('');
  const [search, setSearch] = useState(''), [different, setDifferent] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Player | null>(null);
  const [saved, setSaved] = useState(false);
  const operation = useRef<Player | null>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null), nameInput = useRef<HTMLInputElement>(null);
  const candidates = players.filter(player => normalize(player.name) === normalize(name));
  const unavailable = scenario === 'denied' || scenario === 'load-failed';
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = ar ? 'rtl' : 'ltr'; }, [locale, ar]);
  useEffect(() => { if (stage !== 'saving') heading.current?.focus(); }, [stage]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function reset(next = scenario) {
    if (timer.current) clearTimeout(timer.current);
    setScenario(next); setPlayers(next === 'empty' ? [] : fixtures); setStage('directory');
    setName(''); setContact(''); setSearch(''); setDifferent(false); setSelected(null); setError(''); setNotice(''); setSaved(false); operation.current = null;
  }
  function go(next: Stage) { setError(''); setNotice(''); setStage(next); }
  function guard(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    if (['saving', 'unknown'].includes(stage)) { setError(t('Resolve the original save before leaving.', 'تحقق من الحفظ الأصلي قبل المغادرة.')); return; }
    if (['form', 'duplicates', 'review'].includes(stage) && !window.confirm(t('Discard this unsaved preview draft?', 'هل تريد تجاهل مسودة المعاينة غير المحفوظة؟'))) return;
    setName(''); setContact(''); setDifferent(false); go('directory');
  }
  function continueDraft(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError(t('Enter a fictional player name.', 'أدخل اسم لاعب خيالياً.')); nameInput.current?.focus(); return; }
    if (contact && !/^[^\s@]+@example\.invalid$/i.test(contact.trim())) { setError(t('Use a fictional email ending in @example.invalid, or leave it empty.', 'استخدم بريداً خيالياً ينتهي بـ @example.invalid أو اتركه فارغاً.')); return; }
    setDifferent(false); setSaved(false); go(candidates.length ? 'duplicates' : 'review');
  }
  function save() {
    if (stage !== 'review') return;
    setStage('saving'); setError('');
    timer.current = setTimeout(() => {
      if (scenario === 'save-failed') { setStage('review'); setError(t('Preview save failed before commit. Your draft is retained; switch the review scenario to try the normal path.', 'تعذر الحفظ التجريبي قبل التأكيد. احتُفظ بالمسودة؛ غيّر سيناريو المراجعة لتجربة المسار العادي.')); return; }
      if (scenario === 'concurrent-match') {
        setPlayers(prev => [...prev, { id: 'fictional-concurrent', name: name.trim(), contact: '', branch: 'Main Demo Branch' }]);
        setDifferent(false); setStage('duplicates'); setScenario('normal');
        setNotice(t('A new same-name record appeared during save. Review the refreshed candidates before trying again.', 'ظهر سجل جديد بالاسم نفسه أثناء الحفظ. راجع النتائج المحدثة قبل المحاولة مجدداً.')); return;
      }
      const player = { id: `fictional-${players.length + 1}`, name: name.trim(), contact: contact.trim().toLowerCase(), branch: 'Main Demo Branch' };
      operation.current = player; setPlayers(prev => [...prev, player]); setSelected(player);
      if (scenario === 'lost-response') { setStage('unknown'); return; }
      setSaved(true); setStage('profile');
    }, 800);
  }
  const title = stage === 'profile' ? t('Player profile', 'ملف اللاعب') : stage === 'directory' ? t('Players', 'اللاعبون') : t('Register a player', 'تسجيل لاعب');
  return <>
    <section className="review-controls" aria-label={t('Design review controls', 'أدوات مراجعة التصميم')}>
      <strong>{t('DESIGN PREVIEW · Fictional data · No database writes or emails', 'معاينة تصميم · بيانات خيالية · لا حفظ بقاعدة بيانات أو إرسال بريد')}</strong>
      <label htmlFor="scenario">{t('Review scenario', 'سيناريو المراجعة')}</label>
      <Select id="scenario" value={scenario} disabled={stage === 'saving'} onChange={event => {
        const next = event.target.value;
        if (['empty', 'denied', 'load-failed'].includes(next) || unavailable) reset(next); else setScenario(next);
      }}>
        {[
          ['normal','Normal path','المسار العادي'], ['empty','Empty directory','قائمة فارغة'],
          ['denied','Access removed','سحب الصلاحية'], ['load-failed','Directory unavailable','تعذر تحميل القائمة'],
          ['lost-response','Save committed; response lost','تم الحفظ وفُقد الرد'],
          ['concurrent-match','Same-name record arrives during save','ظهور سجل بالاسم نفسه أثناء الحفظ'],
          ['save-failed','Save fails before commit','فشل الحفظ قبل التأكيد'],
        ].map(([value,en,arabic]) => <option key={value} value={value}>{t(en,arabic)}</option>)}
      </Select>
      <Button onClick={() => reset()}>{t('Reset fictional preview', 'إعادة ضبط المعاينة الخيالية')}</Button>
      <p>{t('Try “Alex Demo” to review a matching name. Use any fictional name for a new record. Refresh resets every record and draft in this preview.', 'جرّب «Alex Demo» لمراجعة اسم مطابق. استخدم اسماً خيالياً لسجل جديد. تحديث الصفحة يمسح سجلات ومسودات هذه المعاينة.')}</p>
    </section>
    <WorkspaceShell locale={locale} context={t('Academy Owner · Preview Academy', 'مالك الأكاديمية · أكاديمية المعاينة')} title={title}
      homeHref="#directory" languageHref="#language" navigation={[{ href:'#directory', label:t('Players','اللاعبون'), current:true }]}
      onNavigate={event => { if (event.currentTarget.hash === '#language') { event.preventDefault(); setLocale(ar ? 'en' : 'ar'); } else guard(event); }}
      account={<span>{t('Preview Owner', 'مالك تجريبي')}</span>}>
      <h1 ref={heading} tabIndex={-1}>{title}</h1>
      <p className="notice">{t('Preview Academy · Main Demo Branch · Existing Academy Owner only', 'أكاديمية المعاينة · الفرع التجريبي الرئيسي · مالك الأكاديمية الحالي فقط')}</p>
      {error && <p className="journey-error" role="alert">{error}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {unavailable ? <section className="journey-card">
        <h2>{scenario === 'denied' ? t('Access unavailable','الصلاحية غير متاحة') : t('Could not load players','تعذر تحميل اللاعبين')}</h2>
        <p>{scenario === 'denied' ? t('No player or contact information is shown after access is removed.','لا تُعرض بيانات اللاعبين أو جهات الاتصال بعد سحب الصلاحية.') : t('A failed lookup is not an empty directory.','فشل التحميل لا يعني أن القائمة فارغة.')}</p>
        <Button onClick={() => reset('normal')}>{t('Retry preview access','إعادة المحاولة في المعاينة')}</Button>
      </section> : <>
        {stage === 'directory' && <section className="journey-card">
          <div className="section-heading"><h2>{t('Player directory','قائمة اللاعبين')}</h2><Button className="button" onClick={() => { setName(''); setContact(''); setDifferent(false); setSaved(false); operation.current=null; go('form'); }}>{t('Register player','تسجيل لاعب')}</Button></div>
          <label htmlFor="player-search">{t('Find a player by name','البحث عن لاعب بالاسم')}</label>
          <Input id="player-search" maxLength={160} value={search} onChange={event => setSearch(event.target.value)} />
          {!players.filter(player => normalize(player.name).includes(normalize(search))).length && <p>{t('No matching players in this preview.','لا يوجد لاعبون مطابقون في المعاينة.')}</p>}
          <ul className="journey-list">{players.filter(player => normalize(player.name).includes(normalize(search))).map(player => <li key={player.id}><Button onClick={() => { setSelected(player); setSaved(false); go('profile'); }}>{player.name}</Button> · {player.branch}</li>)}</ul>
          <small>{t('Only fictional records are shown here. The app will retrieve bounded pages; contact details are not directory columns.','تُعرض سجلات خيالية فقط. سيُحمّل التطبيق صفحات محدودة؛ بيانات الاتصال ليست أعمدة للقائمة.')}</small>
        </section>}
        {stage === 'form' && <section className="journey-card"><h2>{t('New player draft','مسودة لاعب جديد')}</h2>
          <p>{t('Use fictional details only. Saving a contact sends no invitation and grants no access.','استخدم بيانات خيالية فقط. حفظ جهة اتصال لا يرسل دعوة ولا يمنح صلاحية.')}</p>
          <form onSubmit={continueDraft}>
            <label htmlFor="player-name">{t('Player display name (required)','اسم عرض اللاعب (مطلوب)')}</label>
            <Input ref={nameInput} id="player-name" required maxLength={160} value={name} onChange={event => setName(event.target.value)} />
            <label htmlFor="contact-email">{t('Parent/guardian contact email (optional)','بريد جهة اتصال ولي الأمر (اختياري)')}</label>
            <Input id="contact-email" type="email" dir="ltr" maxLength={254} value={contact} onChange={event => setContact(event.target.value)} aria-describedby="contact-help" />
            <small id="contact-help">{t('Unverified contact only. Use @example.invalid. No parent account, invitation or child access.','جهة اتصال غير موثقة فقط. استخدم @example.invalid. لا حساب لولي الأمر أو دعوة أو وصول لبيانات الطفل.')}</small>
            <div className="journey-actions"><Button type="submit" className="button">{t('Continue to duplicate review','المتابعة لمراجعة التكرار')}</Button><Button type="button" onClick={() => { if(window.confirm(t('Discard this draft?','تجاهل هذه المسودة؟'))) reset(); }}>{t('Discard draft','تجاهل المسودة')}</Button></div>
          </form>
        </section>}
        {stage === 'duplicates' && <section className="journey-card"><h2>{t('Review possible duplicates','مراجعة السجلات المتشابهة')}</h2>
          <p>{t('Matching names do not establish identity. Open an existing record, or explicitly confirm a different person. No automatic merge.','تشابه الاسم لا يثبت الهوية. افتح سجلاً موجوداً أو أكد أنه شخص مختلف. لا دمج تلقائياً.')}</p>
          <ul className="journey-list">{candidates.map(player => <li key={player.id}><strong>{player.name}</strong> · {player.branch} <Button onClick={() => { setSelected(player); setSaved(false); go('profile'); }}>{t('Open existing profile','فتح الملف الموجود')}</Button></li>)}</ul>
          <label className="review-check"><input type="checkbox" checked={different} onChange={event => setDifferent(event.target.checked)} />{t('I reviewed these records. This is a different fictional person.','راجعت هذه السجلات. هذا شخص خيالي مختلف.')}</label>
          <div className="journey-actions"><Button disabled={!different} className="button" onClick={() => go('review')}>{t('Review new registration','مراجعة التسجيل الجديد')}</Button><Button onClick={() => go('form')}>{t('Edit draft','تعديل المسودة')}</Button></div>
        </section>}
        {stage === 'review' && <section className="journey-card"><h2>{t('Confirm player registration','تأكيد تسجيل اللاعب')}</h2>
          <dl className="admission-properties"><div><dt>{t('Player','اللاعب')}</dt><dd>{name.trim()}</dd></div><div><dt>{t('Branch','الفرع')}</dt><dd>Main Demo Branch</dd></div><div><dt>{t('Optional unverified contact','جهة الاتصال الاختيارية غير الموثقة')}</dt><dd><bdi dir="ltr">{contact || t('Not provided','لم تُضف')}</bdi></dd></div></dl>
          <p>{t('Creates one player record and optional unverified contact. No login, guardian link, enrollment or activation.','ينشئ سجل لاعب واحداً وجهة اتصال غير موثقة إن أُضيفت. لا تسجيل دخول أو ربط ولي أمر أو اشتراك أو تفعيل.')}</p>
          <div className="journey-actions"><Button className="button" onClick={save}>{t('Save preview registration','حفظ التسجيل التجريبي')}</Button><Button onClick={() => go('form')}>{t('Edit draft','تعديل المسودة')}</Button></div>
        </section>}
        {stage === 'saving' && <section className="journey-card" role="status"><h2>{t('Saving… awaiting confirmation','جارٍ الحفظ… بانتظار التأكيد')}</h2><p>{t('Pending is not saved success. Repeated submission is disabled.','الانتظار ليس نجاحاً مؤكداً. إعادة الإرسال معطلة.')}</p><Button disabled>{t('Saving…','جارٍ الحفظ…')}</Button></section>}
        {stage === 'unknown' && <section className="journey-card"><h2>{t('Save outcome is uncertain','نتيجة الحفظ غير مؤكدة')}</h2><p>{t('Keep the original operation reference. Check its status before creating a replacement.','احتفظ بمرجع العملية الأصلي. تحقق من حالتها قبل إنشاء بديل.')}</p><Button className="button" onClick={() => { if(operation.current){setSelected(operation.current);setSaved(true);go('profile');setNotice(t('The original simulated save was committed once.','تم الحفظ التجريبي الأصلي مرة واحدة.'));} }}>{t('Check original save','التحقق من الحفظ الأصلي')}</Button></section>}
        {stage === 'profile' && selected && <section className="journey-card"><h2>{selected.name}</h2>
          <p role="status">{saved ? t('Preview registration saved — simulation only','حُفظ التسجيل في المعاينة — محاكاة فقط') : t('Existing fictional profile — no new record created','ملف خيالي موجود — لم يُنشأ سجل جديد')}</p>
          <dl className="admission-properties"><div><dt>{t('Branch','الفرع')}</dt><dd>{selected.branch}</dd></div><div><dt>{t('Unverified contact','جهة اتصال غير موثقة')}</dt><dd><bdi dir="ltr">{selected.contact || t('Not provided','لم تُضف')}</bdi></dd></div></dl>
          <p className="notice">{t('This contact has no child-view, payer or consent authority. No invitation was sent.','جهة الاتصال لا تملك صلاحية الاطلاع على الطفل أو الدفع أو الموافقة. لم تُرسل دعوة.')}</p>
          <div className="journey-actions"><Button onClick={() => go('directory')}>{t('Back to players','العودة للاعبين')}</Button>{name && !saved && <Button onClick={() => go('form')}>{t('Return to registration draft','العودة لمسودة التسجيل')}</Button>}</div>
        </section>}
      </>}
    </WorkspaceShell>
  </>;
}
createRoot(document.getElementById('root')!).render(<Review />);
