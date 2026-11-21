'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { listenForVisibleResume } from '@/lib/visible-resume';
import { useCallback, useEffect, useRef, useState } from 'react';
import WorkspaceShell, { PublicWorkspace } from './workspace-shell';
import { Button, Input, Select } from './ui/controls';

type Person = {
  id: string;
  name: string;
  granted?: boolean;
  account?: boolean;
};
type Entry = {
  seq: string;
  id: string;
  kind: 'bill' | 'receipt' | 'allocation' | 'credit' | 'unapply';
  amount: number;
  date: string;
  bill?: string | null;
  source?: string | null;
  period?: string | null;
  detail?: string | null;
  start?: string | null;
  end?: string | null;
  due?: string | null;
  method?: string | null;
};
type Statement = {
  name: string;
  player: string;
  snapshot: string;
  next: string | null;
  total: number;
  totals: { due: number; unapplied: number; net: number };
  items: Entry[];
};
type Original = { player: string; link: string; operation: string };
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function minor(value: string) {
  const decimal = value
    .trim()
    .replace(/[٠-٩۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : 0x6f0)),
    )
    .replace('٫', '.');
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(decimal)) return NaN;
  const [whole, fraction = ''] = decimal.split('.');
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return amount > 0 && amount <= 1_000_000_000 ? amount : NaN;
}
const money = (v: number) => (v / 100).toFixed(2);
class Failure extends Error {
  constructor(public code: string) {
    super(code);
  }
}
async function api<T>(
  academy: string,
  body: Record<string, unknown>,
): Promise<T> {
  const response = await fetch('/api/billing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify({ academy, ...body }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !Object.hasOwn(json, 'data'))
    throw new Failure(
      typeof json.error === 'string' ? json.error : 'unavailable',
    );
  return json.data as T;
}
function readOriginal(key: string): Original | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (
      Object.keys(v).sort().join(',') !== 'link,operation,player' ||
      ![v.player, v.link, v.operation].every(
        (x: unknown) => typeof x === 'string' && uuid.test(x),
      )
    )
      throw Error();
    return v;
  } catch {
    throw new Failure('recovery');
  }
}
async function allPeople(
  academy: string,
  action: string,
  extra: Record<string, unknown> = {},
): Promise<Person[]> {
  const items: Person[] = [];
  let after: string | undefined;
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const page = await api<{ items: Person[]; more: boolean }>(academy, {
      action,
      ...extra,
      ...(after ? { after } : {}),
    });
    if (!Array.isArray(page.items)) throw new Failure('unavailable');
    items.push(...page.items);
    if (!page.more) return items;
    const last = page.items.at(-1)?.id;
    if (!last || seen.has(last)) throw new Failure('unavailable');
    seen.add(last);
    after = last;
  }
  throw new Failure('unavailable');
}
async function fullStatement(
  academy: string,
  link: string,
  pinned?: string,
): Promise<Statement> {
  let after: string | undefined,
    snapshot: string | undefined = pinned,
    first: Statement | undefined;
  const items: Entry[] = [];
  const cursors = new Set<string>(),
    ids = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const page = await api<Statement>(academy, {
      action: 'statement',
      link,
      ...(after ? { after } : {}),
      ...(snapshot ? { snapshot } : {}),
    });
    if (
      !page ||
      !Array.isArray(page.items) ||
      !page.snapshot ||
      !Number.isSafeInteger(page.total) ||
      page.total < 0 ||
      !page.player ||
      !page.totals
    )
      throw new Failure('unavailable');
    if (!first) {
      if (snapshot && page.snapshot !== snapshot)
        throw new Failure('unavailable');
      first = page;
      snapshot = page.snapshot;
    } else if (
      page.snapshot !== snapshot ||
      page.player !== first.player ||
      page.total !== first.total ||
      page.name !== first.name ||
      JSON.stringify(page.totals) !== JSON.stringify(first.totals)
    )
      throw new Failure('unavailable');
    for (const row of page.items) {
      if (ids.has(row.seq)) throw new Failure('unavailable');
      ids.add(row.seq);
      items.push(row);
    }
    if (items.length > page.total) throw new Failure('unavailable');
    if (!page.next) {
      if (items.length !== page.total) throw new Failure('unavailable');
      return { ...first, items, next: null };
    }
    if (cursors.has(page.next)) throw new Failure('unavailable');
    cursors.add(page.next);
    after = page.next;
  }
  throw new Failure('unavailable');
}
function csvCell(v: unknown) {
  let s = String(v ?? '');
  if (/^[\s]*[=+@\-\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
export default function BillingWorkspace(props: {
  locale: string;
  academy: string;
  family?: boolean;
}) {
  const { isLoaded, user } = useUser();
  const ar = props.locale === 'ar';
  if (!isLoaded)
    return (
      <PublicWorkspace
        locale={props.locale}
        title={ar ? 'الفواتير' : 'Billing'}
      >
        <p role="status">{ar ? 'جارٍ التحميل…' : 'Loading…'}</p>
      </PublicWorkspace>
    );
  if (!user)
    return (
      <PublicWorkspace
        locale={props.locale}
        title={ar ? 'الفواتير' : 'Billing'}
      >
        <p role="alert">{ar ? 'يرجى تسجيل الدخول.' : 'Please sign in.'}</p>
      </PublicWorkspace>
    );
  return (
    <Billing
      key={`${user.id}:${props.academy}:${props.family}`}
      {...props}
      subject={user.id}
    />
  );
}
function Billing({
  locale,
  academy,
  family = false,
  subject,
}: {
  locale: string;
  academy: string;
  family?: boolean;
  subject: string;
}) {
  const ar = locale === 'ar',
    t = (en: string, arabic: string) => (ar ? arabic : en),
    key = `academyos:billing:${subject}:${academy}`;
  const readVersion = useRef(0);
  const [people, setPeople] = useState<Person[]>([]),
    [payers, setPayers] = useState<Person[]>([]),
    [player, setPlayer] = useState(''),
    [link, setLink] = useState(''),
    [ledger, setLedger] = useState<Statement | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [pending, setPending] = useState<Original | null>(null);
  const [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [fee, setFee] = useState(''),
    [month, setMonth] = useState(''),
    [preview, setPreview] = useState<{
      month: string;
      start: string;
      end: string;
      due: string;
      amount: number;
      plan: string;
      review: string;
    } | null>(null);
  const [received, setReceived] = useState(''),
    [method, setMethod] = useState<'cash' | 'bank'>('cash'),
    [reference, setReference] = useState(''),
    [amount, setAmount] = useState(''),
    [allocations, setAllocations] = useState<
      { bill: string; amount: string }[]
    >([]),
    [verified, setVerified] = useState(false),
    [reviewReceipt, setReviewReceipt] = useState(false);
  const [bill, setBill] = useState(''),
    [allocation, setAllocation] = useState(''),
    [adjustment, setAdjustment] = useState(''),
    [reason, setReason] = useState('');
  const message = (code: string) =>
    ({
      denied: t(
        'Access is unavailable. Check your account and current permission.',
        'الصلاحية غير متاحة. تحقق من حسابك والصلاحية الحالية.',
      ),
      review_required: t(
        'The reviewed charge changed. Preview the bill again.',
        'تغيرت الرسوم التي راجعتها. أعد معاينة الفاتورة.',
      ),
      limited: t(
        'Too many requests. Wait briefly and try again.',
        'طلبات كثيرة. انتظر قليلاً وحاول مجدداً.',
      ),
      invalid: t(
        'Check the entered values and try again.',
        'تحقق من البيانات وحاول مجدداً.',
      ),
      conflict: t(
        'The records changed. Reload the statement and review before trying again.',
        'تغيرت السجلات. أعد تحميل الكشف وراجعه قبل المحاولة.',
      ),
      recovery: t(
        'The recovery reference cannot be read. Keep this tab open and contact support.',
        'تعذرت قراءة مرجع الاستعادة. أبقِ الصفحة مفتوحة واتصل بالدعم.',
      ),
      storage: t(
        'A recovery reference could not be saved. Nothing was submitted.',
        'تعذر حفظ مرجع الاستعادة. لم يُرسل شيء.',
      ),
    })[code] ??
    t(
      'Could not load or confirm the operation. Try again.',
      'تعذر تحميل العملية أو تأكيدها. حاول مجدداً.',
    );
  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      if (!family) setPending(readOriginal(key));
      setPeople(await allPeople(academy, family ? 'grants' : 'players'));
    } catch (e) {
      setPeople([]);
      setError(e instanceof Failure ? e.code : 'unavailable');
    } finally {
      setBusy(false);
    }
  }, [academy, family, key]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    setPayers([]);
    setLink('');
    setLedger(null);
    setPreview(null);
    if (!player || family) return;
    let live = true;
    setBusy(true);
    allPeople(academy, 'payers', { player })
      .then((v) => {
        if (live) setPayers(v);
      })
      .catch((e) => {
        if (live) setError(e instanceof Failure ? e.code : 'unavailable');
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [academy, player, family]);
  const refresh = useCallback(
    async (target: string, expectedPlayer?: string) => {
      const version = ++readVersion.current;
      setLedger(null);
      if (!target) return;
      setBusy(true);
      setError('');
      try {
        const result = await fullStatement(academy, target);
        if (expectedPlayer && result.player !== expectedPlayer)
          throw new Failure('unavailable');
        if (version === readVersion.current) setLedger(result);
      } catch (e) {
        if (version === readVersion.current)
          setError(e instanceof Failure ? e.code : 'unavailable');
      } finally {
        if (version === readVersion.current) setBusy(false);
      }
    },
    [academy],
  );
  useEffect(() => {
    setLedger(null);
    setPreview(null);
    setNotice('');
    setError('');
    setStart('');
    setEnd('');
    setFee('');
    setMonth('');
    setReceived('');
    setMethod('cash');
    setReference('');
    setAmount('');
    setAllocations([]);
    setVerified(false);
    setReviewReceipt(false);
    setBill('');
    setAllocation('');
    setAdjustment('');
    setReason('');
  }, [link, player]);
  const shouldLoadStatement =
    family || payers.some((payer) => payer.id === link && payer.account);
  useEffect(() => {
    const versionRef = readVersion;
    if (link && shouldLoadStatement)
      void refresh(link, family ? undefined : player);
    return () => {
      versionRef.current++;
    };
  }, [link, player, family, refresh, shouldLoadStatement]);
  useEffect(() => {
    if (!family || !link) return;
    return listenForVisibleResume(() => {
      if (!busy) void refresh(link);
    });
  }, [family, link, busy, refresh]);
  async function mutate(action: string, fields: Record<string, unknown>) {
    if (busy || pending || !player || !link) return;
    const original = { player, link, operation: crypto.randomUUID() };
    try {
      const saved = JSON.stringify(original);
      sessionStorage.setItem(key, saved);
      if (sessionStorage.getItem(key) !== saved) throw Error();
    } catch {
      setError('storage');
      return;
    }
    setPending(original);
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await api(academy, { action, ...original, ...fields });
    } catch (error) {
      const code = error instanceof Failure ? error.code : 'unavailable';
      if (
        [
          'denied',
          'invalid',
          'conflict',
          'review_required',
          'limited',
          'setup_required',
        ].includes(code)
      ) {
        sessionStorage.removeItem(key);
        setPending(null);
        if (code === 'denied') setLedger(null);
        if (code === 'review_required') setPreview(null);
        setError(code);
      } else {
        setError('unknown');
      }
      setBusy(false);
      return;
    }
    sessionStorage.removeItem(key);
    setPending(null);
    setNotice(t('Operation confirmed.', 'تم تأكيد العملية.'));
    setPreview(null);
    setReviewReceipt(false);
    if (action === 'receipt') {
      setAmount('');
      setReference('');
      setAllocations([]);
      setVerified(false);
    }
    try {
      if (action === 'grant') {
        setPayers(await allPeople(academy, 'payers', { player }));
      } else {
        await refresh(link, player);
      }
    } catch (error) {
      setError(error instanceof Failure ? error.code : 'unavailable');
    } finally {
      setBusy(false);
    }
  }
  async function reconcile() {
    if (!pending || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await api<{
        id?: string;
        action?: string;
        cancelled?: boolean;
      }>(academy, { action: 'operation', ...pending });
      if (!result.cancelled && (!result.id || !result.action))
        throw new Failure('unavailable');
      sessionStorage.removeItem(key);
      setPending(null);
      setNotice(
        result.cancelled
          ? t(
              'The original operation was cancelled. Review the retained input before submitting again.',
              'أُلغيت العملية الأصلية. راجع البيانات المحتفظ بها قبل إعادة الإرسال.',
            )
          : t('Original operation confirmed.', 'تم تأكيد العملية الأصلية.'),
      );
      if (link === pending.link && player === pending.player) {
        if (result.action === 'grant')
          setPayers(await allPeople(academy, 'payers', { player }));
        else await refresh(link, player);
      }
    } catch (e) {
      setError(e instanceof Failure ? e.code : 'unavailable');
    } finally {
      setBusy(false);
    }
  }
  const balances = new Map<string, number>();
  for (const row of ledger?.items ?? []) {
    if (row.kind === 'bill') balances.set(row.id, row.amount);
    else if (row.bill && balances.has(row.bill)) {
      const current = balances.get(row.bill)!;
      if (row.kind === 'allocation' || row.kind === 'credit')
        balances.set(row.bill, current - row.amount);
      if (row.kind === 'unapply') balances.set(row.bill, current + row.amount);
    }
  }
  const bills = (ledger?.items ?? []).filter((x) => x.kind === 'bill');
  const allocationRows = (ledger?.items ?? []).filter(
    (x) => x.kind === 'allocation',
  );
  const download = async () => {
    if (!ledger || busy) return;
    const original = ledger,
      version = readVersion.current;
    setBusy(true);
    setError('');
    try {
      const checked = await fullStatement(academy, link, original.snapshot);
      if (version !== readVersion.current) return;
      if (
        checked.player !== original.player ||
        checked.total !== original.total ||
        checked.snapshot !== original.snapshot
      )
        throw new Failure('unavailable');
      const rows = family
        ? [
            [
              'Date',
              'Type',
              'Period',
              'Coverage from',
              'Coverage through',
              'Due date',
              'Method',
              'Amount',
            ],
            ...checked.items.map((x) => [
              x.date,
              x.kind,
              x.period ??
                checked.items.find((b) => b.id === x.bill)?.period ??
                '',
              x.start ?? '',
              x.end ?? '',
              x.due ?? '',
              x.method ?? '',
              money(x.amount),
            ]),
          ]
        : [
            [
              'Date',
              'Type',
              'Period',
              'Amount',
              'Reference',
              'Related bill',
              'Source',
              'Detail',
            ],
            ...checked.items.map((x) => [
              x.date,
              x.kind,
              x.period ?? '',
              money(x.amount),
              x.id,
              x.bill ?? '',
              x.source ?? '',
              x.detail ?? '',
            ]),
          ];
      const blob = new Blob(
        ['\ufeff' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n')],
        { type: 'text/csv;charset=utf-8' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'billing-statement.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      if (version === readVersion.current) {
        setLedger(null);
        setError(e instanceof Failure ? e.code : 'unavailable');
      }
    } finally {
      if (version === readVersion.current) setBusy(false);
    }
  };
  const label = (text: string, child: React.ReactNode) => (
    <label style={{ display: 'block', margin: '0.5rem 0' }}>
      {text} {child}
    </label>
  );
  return (
    <WorkspaceShell
      role={family ? 'guardian' : 'owner'}
      module={family ? 'family' : 'operations'}
      locale={locale}
      context={
        family
          ? t('Guardian workspace', 'مساحة ولي الأمر')
          : t('Academy Owner workspace', 'مساحة مالك الأكاديمية')
      }
      title={t('Family billing', 'فواتير الأسر')}
      homeHref={`/${locale}/workspace`}
      languageHref={`/${ar ? 'en' : 'ar'}/workspace/${academy}/${family ? 'guardian/' : ''}billing`}
      navigation={[
        {
          href: `/${locale}/workspace/${academy}/${family ? 'guardian/' : ''}billing`,
          label: t('Family billing', 'فواتير الأسر'),
          current: true,
        },
      ]}
      account={<UserButton />}
    >
      <main
        className="journey-card"
        style={{ maxWidth: '76rem', padding: '1.5rem' }}
      >
        <h1>{t('Family billing', 'فواتير الأسر')}</h1>
        <p>
          {t(
            'Synthetic trial amounts use fictional units.',
            'المبالغ التجريبية بوحدات افتراضية.',
          )}
        </p>
        {error && (
          <p role="alert">
            {error === 'unknown'
              ? t(
                  'The outcome is unknown. Check the original operation before submitting another.',
                  'النتيجة غير معروفة. تحقق من العملية الأصلية قبل إرسال عملية أخرى.',
                )
              : message(error)}
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {busy && (
          <p role="status">
            {t('Loading or saving…', 'جارٍ التحميل أو الحفظ…')}
          </p>
        )}
        {error && !pending && error !== 'storage' && (
          <Button
            disabled={busy}
            onClick={() => {
              if (link && shouldLoadStatement)
                void refresh(link, family ? undefined : player);
              else void load();
            }}
          >
            {t('Reload billing', 'إعادة تحميل الفواتير')}
          </Button>
        )}
        {pending && (
          <section role="status">
            <p>
              {t(
                'An original operation needs confirmation. Do not submit it again.',
                'تحتاج العملية الأصلية إلى تأكيد. لا ترسلها مرة أخرى.',
              )}
            </p>
            <Button disabled={busy} onClick={() => void reconcile()}>
              {t('Check original operation', 'تحقق من العملية الأصلية')}
            </Button>
          </section>
        )}
        {family ? (
          label(
            t('Child', 'الطفل'),
            <Select value={link} onChange={(e) => setLink(e.target.value)}>
              <option value="">{t('Select a child', 'اختر طفلاً')}</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>,
          )
        ) : (
          <>
            {label(
              t('Player', 'اللاعب'),
              <Select
                value={player}
                disabled={busy || !!pending}
                onChange={(e) => setPlayer(e.target.value)}
              >
                <option value="">{t('Select a player', 'اختر لاعباً')}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>,
            )}
            {player &&
              label(
                t('Verified guardian', 'ولي الأمر المتحقق منه'),
                <Select
                  value={link}
                  disabled={busy || !!pending}
                  onChange={(e) => setLink(e.target.value)}
                >
                  <option value="">
                    {t('Select a guardian', 'اختر ولي الأمر')}
                  </option>
                  {payers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>,
              )}
          </>
        )}
        {!family && link && (
          <>
            <section>
              <h2>{t('Statement access', 'صلاحية الكشف')}</h2>
              <p>
                {payers.find((p) => p.id === link)?.granted
                  ? t('Billing access enabled', 'صلاحية الفواتير مفعّلة')
                  : t(
                      'Billing access not enabled',
                      'صلاحية الفواتير غير مفعّلة',
                    )}
              </p>
              <Button
                disabled={busy || !!pending}
                onClick={() =>
                  void mutate('grant', {
                    enabled: !payers.find((p) => p.id === link)?.granted,
                  })
                }
              >
                {payers.find((p) => p.id === link)?.granted
                  ? t('Revoke billing access', 'إلغاء صلاحية الفواتير')
                  : t('Enable billing access', 'تفعيل صلاحية الفواتير')}
              </Button>
            </section>
            <section>
              <h2>{t('Assign monthly fee', 'تعيين الرسوم الشهرية')}</h2>
              {label(
                t('Effective from', 'ساري من'),
                <Input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />,
              )}
              {label(
                t('Effective through (optional)', 'ساري حتى (اختياري)'),
                <Input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />,
              )}
              {label(
                t('Monthly fee', 'الرسوم الشهرية'),
                <Input
                  inputMode="decimal"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                />,
              )}
              <Button
                disabled={
                  busy ||
                  !!pending ||
                  !start ||
                  !Number.isSafeInteger(minor(fee))
                }
                onClick={() =>
                  void mutate('assign', {
                    start,
                    ...(end ? { end } : {}),
                    amount: minor(fee),
                  })
                }
              >
                {t('Assign fee', 'تعيين الرسوم')}
              </Button>
            </section>
            <section>
              <h2>{t('Issue monthly bill', 'إصدار فاتورة شهرية')}</h2>
              {label(
                t('Month', 'الشهر'),
                <Input
                  type="month"
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value);
                    setPreview(null);
                  }}
                />,
              )}
              <Button
                disabled={busy || !!pending || !month}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    setPreview(
                      await api(academy, {
                        action: 'preview',
                        player,
                        link,
                        month,
                      }),
                    );
                  } catch (e) {
                    setError(e instanceof Failure ? e.code : 'unavailable');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t('Preview bill', 'معاينة الفاتورة')}
              </Button>
              {preview && (
                <div>
                  <p>
                    {preview.month}: {preview.start} – {preview.end} ·{' '}
                    {t('Due date', 'تاريخ الاستحقاق')}: {preview.due} ·{' '}
                    {t('Bill amount', 'مبلغ الفاتورة')}: {money(preview.amount)}
                  </p>
                  <Button
                    disabled={busy || !!pending}
                    onClick={() =>
                      void mutate('issue', {
                        month: preview.month,
                        review: preview.review,
                      })
                    }
                  >
                    {t('Issue bill', 'إصدار الفاتورة')}
                  </Button>
                </div>
              )}
            </section>
            <section>
              <h2>{t('Record verified receipt', 'تسجيل إيصال متحقق منه')}</h2>
              {label(
                t('Date received', 'تاريخ الاستلام'),
                <Input
                  type="date"
                  value={received}
                  onChange={(e) => {
                    setReceived(e.target.value);
                    setReviewReceipt(false);
                  }}
                />,
              )}
              {label(
                t('Method', 'الطريقة'),
                <Select
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value as 'cash' | 'bank');
                    setReviewReceipt(false);
                  }}
                >
                  <option value="cash">{t('Cash', 'نقداً')}</option>
                  <option value="bank">
                    {t('Bank transfer', 'تحويل بنكي')}
                  </option>
                </Select>,
              )}
              {label(
                t('Reference', 'المرجع'),
                <Input
                  value={reference}
                  onChange={(e) => {
                    setReference(e.target.value);
                    setReviewReceipt(false);
                  }}
                />,
              )}
              {label(
                t('Receipt amount', 'مبلغ الإيصال'),
                <Input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setReviewReceipt(false);
                  }}
                />,
              )}
              <h3>{t('Explicit allocations', 'التوزيعات المحددة')}</h3>
              {allocations.map((a, i) => (
                <div key={i}>
                  {label(
                    t('Bill', 'الفاتورة'),
                    <Select
                      value={a.bill}
                      onChange={(e) => {
                        setAllocations(
                          allocations.map((v, n) =>
                            n === i ? { ...v, bill: e.target.value } : v,
                          ),
                        );
                        setReviewReceipt(false);
                      }}
                    >
                      <option value="">
                        {t('Select a bill', 'اختر فاتورة')}
                      </option>
                      {bills.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.period ?? b.date} · {b.id} ·{' '}
                          {t('Balance', 'الرصيد')}{' '}
                          {money(balances.get(b.id) ?? 0)}
                        </option>
                      ))}
                    </Select>,
                  )}
                  {label(
                    t('Allocated amount', 'المبلغ الموزع'),
                    <Input
                      inputMode="decimal"
                      value={a.amount}
                      onChange={(e) => {
                        setAllocations(
                          allocations.map((v, n) =>
                            n === i ? { ...v, amount: e.target.value } : v,
                          ),
                        );
                        setReviewReceipt(false);
                      }}
                    />,
                  )}
                  <Button
                    onClick={() => {
                      setAllocations(allocations.filter((_, n) => n !== i));
                      setReviewReceipt(false);
                    }}
                  >
                    {t('Remove allocation', 'إزالة التوزيع')}
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => {
                  setAllocations([...allocations, { bill: '', amount: '' }]);
                  setReviewReceipt(false);
                }}
              >
                {t('Add allocation', 'إضافة توزيع')}
              </Button>
              <p>
                {t('Unapplied amount', 'المبلغ غير الموزع')}:{' '}
                {Number.isFinite(minor(amount))
                  ? money(
                      minor(amount) -
                        allocations.reduce(
                          (sum, a) =>
                            sum +
                            (Number.isFinite(minor(a.amount))
                              ? minor(a.amount)
                              : 0),
                          0,
                        ),
                    )
                  : '—'}
              </p>
              {label(
                t(
                  'I verified receipt of these funds',
                  'تحققت من استلام هذه الأموال',
                ),
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => {
                    setVerified(e.target.checked);
                    setReviewReceipt(false);
                  }}
                />,
              )}
              <Button
                disabled={
                  busy ||
                  !!pending ||
                  !ledger ||
                  !verified ||
                  !received ||
                  !Number.isSafeInteger(minor(amount)) ||
                  minor(amount) <= 0 ||
                  (method === 'bank' && !reference.trim()) ||
                  allocations.some(
                    (a) =>
                      !a.bill ||
                      !Number.isSafeInteger(minor(a.amount)) ||
                      minor(a.amount) <= 0,
                  ) ||
                  new Set(allocations.map((a) => a.bill)).size !==
                    allocations.length ||
                  allocations.reduce((s, a) => s + (minor(a.amount) || 0), 0) >
                    minor(amount)
                }
                onClick={() => setReviewReceipt(true)}
              >
                {t('Review receipt', 'مراجعة الإيصال')}
              </Button>
              {reviewReceipt && (
                <div>
                  <p>
                    {received} ·{' '}
                    {method === 'cash'
                      ? t('Cash', 'نقداً')
                      : t('Bank transfer', 'تحويل بنكي')}{' '}
                    · {reference} · {money(minor(amount))}
                  </p>
                  <ul>
                    {allocations.map((a) => (
                      <li key={a.bill}>
                        {a.bill}: {money(minor(a.amount))}
                      </li>
                    ))}
                  </ul>
                  <Button
                    disabled={busy || !!pending}
                    onClick={() =>
                      void mutate('receipt', {
                        received,
                        method,
                        reference,
                        amount: minor(amount),
                        allocations: allocations.map((a) => ({
                          bill: a.bill,
                          amount: minor(a.amount),
                        })),
                      })
                    }
                  >
                    {t('Post receipt', 'ترحيل الإيصال')}
                  </Button>
                </div>
              )}
            </section>
            <section>
              <h2>{t('Credit or unapply', 'رصيد دائن أو إلغاء توزيع')}</h2>
              {label(
                t('Amount', 'المبلغ'),
                <Input
                  inputMode="decimal"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                />,
              )}
              {label(
                t('Reason', 'السبب'),
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />,
              )}
              {label(
                t('Bill to credit', 'الفاتورة المراد إضافة رصيد لها'),
                <Select value={bill} onChange={(e) => setBill(e.target.value)}>
                  <option value="">{t('Select a bill', 'اختر فاتورة')}</option>
                  {bills.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.period ?? b.date} · {b.id}
                    </option>
                  ))}
                </Select>,
              )}
              <Button
                disabled={
                  busy ||
                  !!pending ||
                  !bill ||
                  !reason.trim() ||
                  !Number.isSafeInteger(minor(adjustment)) ||
                  minor(adjustment) <= 0
                }
                onClick={() =>
                  void mutate('credit', {
                    bill,
                    amount: minor(adjustment),
                    reason,
                  })
                }
              >
                {t('Post credit', 'ترحيل الرصيد الدائن')}
              </Button>
              {label(
                t('Allocation to unapply', 'التوزيع المراد إلغاؤه'),
                <Select
                  value={allocation}
                  onChange={(e) => setAllocation(e.target.value)}
                >
                  <option value="">
                    {t('Select an allocation', 'اختر توزيعاً')}
                  </option>
                  {allocationRows.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} · {money(a.amount)} · {a.bill}
                    </option>
                  ))}
                </Select>,
              )}
              <Button
                disabled={
                  busy ||
                  !!pending ||
                  !allocation ||
                  !reason.trim() ||
                  !Number.isSafeInteger(minor(adjustment)) ||
                  minor(adjustment) <= 0
                }
                onClick={() =>
                  void mutate('unapply', {
                    allocation,
                    amount: minor(adjustment),
                    reason,
                  })
                }
              >
                {t('Unapply allocation', 'إلغاء التوزيع')}
              </Button>
            </section>
          </>
        )}
        {ledger && (
          <section>
            <h2>
              {t('Posted statement', 'الكشف المرحّل')}: {ledger.name}
            </h2>
            <p>
              {t('Due', 'المستحق')}: {money(ledger.totals.due)} ·{' '}
              {t('Unapplied', 'غير الموزع')}: {money(ledger.totals.unapplied)} ·{' '}
              {t('Net', 'الصافي')}: {money(ledger.totals.net)}
            </p>
            <p>
              {t('Entries', 'السجلات')}: {ledger.items.length}
            </p>
            <Button disabled={busy} onClick={() => void download()}>
              {t('Download CSV', 'تنزيل CSV')}
            </Button>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    {[
                      t('Date', 'التاريخ'),
                      t('Type', 'النوع'),
                      t('Period', 'الفترة'),
                      t('Coverage', 'الفترة المشمولة'),
                      t('Due date', 'تاريخ الاستحقاق'),
                      t('Method', 'الطريقة'),
                      t('Amount', 'المبلغ'),
                      ...(!family ? [t('Reference', 'المرجع')] : []),
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ledger.items.map((x) => (
                    <tr key={x.seq}>
                      <td>{x.date}</td>
                      <td>
                        {
                          {
                            bill: t('Bill', 'فاتورة'),
                            receipt: t('Receipt', 'إيصال'),
                            allocation: t('Allocation', 'توزيع'),
                            credit: t('Credit', 'رصيد دائن'),
                            unapply: t('Unapplied', 'إلغاء توزيع'),
                          }[x.kind]
                        }
                      </td>
                      <td>
                        {x.period ??
                          ledger.items.find((b) => b.id === x.bill)?.period ??
                          '—'}
                      </td>
                      <td>
                        {x.start && x.end ? `${x.start} – ${x.end}` : '—'}
                      </td>
                      <td>{x.due ?? '—'}</td>
                      <td>
                        {x.method === 'cash'
                          ? t('Cash', 'نقداً')
                          : x.method === 'bank'
                            ? t('Bank transfer', 'تحويل بنكي')
                            : '—'}
                      </td>
                      <td>{money(x.amount)}</td>
                      {!family && <td>{x.id}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </WorkspaceShell>
  );
}
