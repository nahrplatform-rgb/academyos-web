import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';

export type Payslip = {
  id: string; academy: string; trainer: string; timezone: string;
  periodStart: string; periodEnd: string; approvedAt: string; retrievedAt: string;
  total: number; net: number; balance: number;
  lines: { day: string; name: string; amount: number }[];
  adjustments: { date: string; amount: number }[];
  payouts: { date: string; amount: number; method: 'cash' | 'bank' }[];
};

const styles = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 10, color: '#19212e', lineHeight: 1.5 },
  title: { fontSize: 19, marginBottom: 12 },
  heading: { fontSize: 12, marginTop: 12, marginBottom: 4 },
  row: { gap: 12, justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#cbd5e1' },
  label: { flex: 1 }, value: { maxWidth: '62%' },
  numeric: { direction: 'ltr' },
});
let fontsReady = false;

function font() {
  if (!fontsReady) {
    const relative = 'src/assets/payslip/NotoSansArabic-Regular.ttf';
    let bytes: Buffer;
    try { bytes = readFileSync(join(process.cwd(), relative)); }
    catch { bytes = readFileSync(join(process.cwd(), 'apps/web', relative)); }
    Font.register({ family: 'Payslip Arabic', src: `data:font/ttf;base64,${bytes.toString('base64')}` });
    fontsReady = true;
  }
  return 'Payslip Arabic';
}

export async function renderPayslip(slip: Payslip, locale: 'en' | 'ar') {
  const ar = locale === 'ar';
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const money = (amount: number) => (amount / 100).toFixed(2);
  const clock = new Intl.DateTimeFormat('en', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone: slip.timezone,
  });
  const date = (stamp: string) => {
    const parts = Object.fromEntries(clock.formatToParts(new Date(stamp)).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}  ${parts.hour}:${parts.minute}`;
  };
  const row = (label: string, value: string, key = label, day?: string, numeric = false) => (
    <View key={key} wrap={false} style={[styles.row, { flexDirection: ar ? 'row-reverse' : 'row' }]}>
      <Text style={styles.label}>{label}</Text>
      {day && <Text style={styles.numeric}>{day}</Text>}
      <Text style={numeric ? [styles.value, styles.numeric] : styles.value}>{value}</Text>
    </View>
  );
  return renderToBuffer(<Document title={t('Approved Trainer payslip', 'قسيمة مستحقات المدرب المعتمدة')}>
    <Page size="A4" style={[styles.page, { fontFamily: font(), direction: ar ? 'rtl' : 'ltr', textAlign: ar ? 'right' : 'left' }]}>
      <Text style={styles.title}>{t('Approved Trainer payslip', 'قسيمة مستحقات المدرب المعتمدة')}</Text>
      {row(t('Academy', 'الأكاديمية'), slip.academy)}
      {row(t('Trainer', 'المدرب'), slip.trainer)}
      {row(t('Statement ID', 'رقم الكشف'), slip.id)}
      {row(t('Period', 'الفترة'), `${slip.periodStart} / ${slip.periodEnd}`)}
      {row(t('Time zone', 'المنطقة الزمنية'), slip.timezone)}
      {row(t('Approved at', 'تاريخ الاعتماد'), date(slip.approvedAt), 'approval-time', undefined, true)}
      {row(t('Units', 'الوحدات'), t('Fictional units', 'وحدات افتراضية'))}
      <Text style={styles.heading} minPresenceAhead={25}>{t('Approved earnings snapshot', 'المستحقات عند الاعتماد')}</Text>
      {slip.lines.map((line, i) => row(line.name === 'Fixed pay' ? t('Fixed pay', 'الأجر الثابت') : line.name, money(line.amount), `line-${i}`, line.day, true))}
      {row(t('Total at approval', 'الإجمالي عند الاعتماد'), money(slip.total))}
      <Text style={styles.heading} minPresenceAhead={25}>{t('Payment summary at retrieval', 'ملخص الدفع وقت التنزيل')}</Text>
      {row(t('Retrieved at', 'وقت التنزيل'), date(slip.retrievedAt), 'retrieval-time', undefined, true)}
      {slip.adjustments.map((x, i) => row(t('Adjustment', 'تسوية'), money(x.amount), `adjustment-${i}`, x.date, true))}
      {row(t('Net after adjustments', 'الصافي بعد التسويات'), money(slip.net))}
      {slip.payouts.map((x, i) => row(x.method === 'bank' ? t('Bank transfer', 'تحويل بنكي') : t('Cash', 'نقداً'), money(x.amount), `payout-${i}`, x.date, true))}
      {row(t('Confirmed payouts', 'إجمالي الدفعات المؤكدة'), money(slip.payouts.reduce((sum, x) => sum + x.amount, 0)))}
      {row(t('Outstanding balance', 'الرصيد المتبقي'), money(slip.balance))}
    </Page>
  </Document>);
}
