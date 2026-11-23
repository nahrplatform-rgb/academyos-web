import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

export async function runTrainerPayCases({ call, context, trainer }) {
  const command = (action, fields) => ({ action, operation: randomUUID(), ...fields });
  const ownerContext = period => context('owner', trainer, period);

  await call(command('terms', { staff: trainer, start: '2025-11-01', end: '2025-11-30', basis: 'session',
    rate: 10000, fixed: 0, fixedUnit: 'month', frequency: 'month' }));
  const sessionTerms = await ownerContext('2025-11-15');
  assert.equal(sessionTerms.periodStart, '2025-11-01');
  assert.equal(sessionTerms.periodEnd, '2025-11-30');
  assert.equal(sessionTerms.frequency, 'month');
  assert.equal(sessionTerms.run, null);

  await call(command('terms', { staff: trainer, start: '2026-01-01', end: '2026-01-31', basis: 'fixed',
    rate: 0, fixed: 100000, fixedUnit: 'month', frequency: 'month' }));
  const fixedMonth = await call(command('prepare', { staff: trainer, period: '2026-01-15' }));
  const fixed = await ownerContext('2026-01-15');
  assert.equal(fixed.run.id, fixedMonth.id);
  assert.equal(fixed.run.total, 100000);
  const firstFortnight = fixed.run.lines.slice(0, 14).reduce((sum, line) => sum + line.amount, 0);
  assert.deepEqual([
    fixed.run.lines.slice(0, 7).reduce((sum, line) => sum + line.amount, 0),
    fixed.run.lines.slice(7, 14).reduce((sum, line) => sum + line.amount, 0),
  ], [22581, 22580]);
  assert.equal(firstFortnight, 45161);
  assert.equal(fixed.run.lines.reduce((sum, line) => sum + line.amount, 0), 100000);
  assert.deepEqual([fixed.periodStart, fixed.periodEnd, fixed.frequency], ['2026-01-01', '2026-01-31', 'month']);

  await call(command('terms', { staff: trainer, start: '2026-02-01', end: '2026-02-28', basis: 'hybrid',
    rate: 12000, fixed: 310000, fixedUnit: 'month', frequency: 'month' }));
  const hybridRun = await call(command('prepare', { staff: trainer, period: '2026-02-15' }));
  const hybrid = await ownerContext('2026-02-15');
  assert.equal(hybrid.run.id, hybridRun.id);
  assert.equal(hybrid.run.total, 310000);
  assert.deepEqual([hybrid.periodStart, hybrid.periodEnd, hybrid.frequency], ['2026-02-01', '2026-02-28', 'month']);

}

export async function runTrainerWeeklyBoundary({ call, context, trainer, other }) {
  const terms = (start, end, fixed, staff = trainer, frequency = 'week') => call({
    action: 'terms', operation: randomUUID(), staff, start, end, basis: 'fixed', rate: 0, fixed, fixedUnit: 'month', frequency,
  });
  await terms('2020-12-01', '2020-12-31', 310000);
  await terms('2021-01-01', '2021-01-31', 155000);
  const prepared = await call({ action: 'prepare', operation: randomUUID(), staff: trainer, period: '2020-12-28' });
  const result = await context('owner', trainer, '2021-01-02');
  assert.deepEqual([result.periodStart, result.periodEnd, result.frequency], ['2020-12-28', '2021-01-03', 'week']);
  assert.equal(result.run.id, prepared.id);
  assert.equal(result.run.total, 55000);
  assert.deepEqual(result.run.lines.map(line => line.amount), [10000, 10000, 10000, 10000, 5000, 5000, 5000]);

  await terms('2020-11-22', '2020-11-30', 300000, other, 'month');
  await terms('2020-12-01', '2020-12-15', 310000, other, 'month');
  await terms('2020-12-16', '2020-12-31', 620000, other, 'month');
  await terms('2021-01-01', '2021-01-31', 310000, other);
  for (const [period, start, end, total] of [
    ['2020-11-25', '2020-11-22', '2020-11-30', 90000],
    ['2020-12-16', '2020-12-01', '2020-12-31', 470000],
    ['2021-01-01', '2021-01-01', '2021-01-03', 30000],
    ['2021-01-04', '2021-01-04', '2021-01-10', 70000],
  ]) {
    const run = await call({ action: 'prepare', operation: randomUUID(), staff: other, period });
    const result = await context('owner', other, period);
    assert.deepEqual([result.run.id, result.periodStart, result.periodEnd, result.run.total], [run.id, start, end, total]);
    assert.equal(result.run.lines.reduce((sum, line) => sum + line.amount, 0), total);
  }
}
