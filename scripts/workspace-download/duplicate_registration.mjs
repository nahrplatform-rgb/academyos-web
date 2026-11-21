import assert from 'node:assert/strict';
import {expect} from '@playwright/test';

// The fixture starts with a canonical same-name candidate and a long directory.
export async function checkDuplicateRegistration({page, locale, ui, fixture, base, name, existing, rpcCalls, observe}) {
  const t = (en, ar) => locale === 'ar' ? ar : en;
  const id = fixture.academy;
  const documents = [], pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('request', request => {
    if (request.isNavigationRequest() && request.resourceType() === 'document') documents.push(new URL(request.url()).pathname);
  });
  const route = `/${locale}/workspace/${id}/players`;
  const heading = (en, ar) => page.getByRole('heading', {name: t(en, ar), exact: true});
  const button = (en, ar) => page.getByRole('button', {name: t(en, ar), exact: true});
  const register = button('Register player', 'تسجيل لاعب');
  const back = button('Back to players', 'العودة للاعبين');
  const search = page.locator('#player-search');
  const scroll = () => page.locator('.workspace-center').evaluate(node => node.scrollTop);
  const rows = page.locator('.people-directory tbody tr');
  const before = await observe({academy: id});
  assert.ok(before.totalPlayers >= 19);
  ui.useRealPeople();
  await page.goto(base + route);
  await expect(register).toBeEnabled();

  const searchStart = ui.calls.length;
  await search.fill('Synthetic');
  // The count need not change when the prefix matches all seeded names. Wait for
  // the searched page's response and its actual settled table before selecting.
  await expect.poll(() => ui.calls.length).toBe(searchStart + 1);
  await expect(page.getByText(t('Updating results… Showing previous results.', 'جارٍ تحديث النتائج… تُعرض النتائج السابقة.'), {exact: true})).toHaveCount(0);
  await expect(rows).toHaveCount(before.totalPlayers);
  const opener = rows.last().getByRole('button');
  await opener.scrollIntoViewIfNeeded();
  const position = await scroll();
  assert.ok(position > 0, 'The directory scroll assertion must start off the top of the list');
  const profileStart = ui.calls.length;
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(heading('Player profile', 'ملف اللاعب')).toBeFocused();
  await expect(page.getByText(t('Saved player profile', 'ملف اللاعب المحفوظ'), {exact: true})).toBeVisible();
  await back.click();
  await expect(opener).toBeFocused();
  await expect(search).toHaveValue('Synthetic');
  const returnedPosition = await scroll();
  assert.ok(Math.abs(position-returnedPosition) <= 2, 'Existing profile return keeps the scrolled directory position');
  assert.deepEqual(ui.calls.slice(profileStart).map(call => call.action), ['profile']);

  const journeyStart = ui.calls.length, rpcStart = rpcCalls.length, saveStart = ui.registrations.length;
  const nameField = page.getByLabel(t('Player display name (required)', 'اسم عرض اللاعب (مطلوب)'), {exact: true});
  const emailField = page.locator('#contact-email');
  const compare = button('Continue to duplicate review', 'المتابعة لمراجعة التكرار');
  const review = button('Review new registration', 'مراجعة التسجيل الجديد');
  const contact = 'new-player@example.invalid';
  await register.click();
  await nameField.fill(name);
  await emailField.fill(contact);
  await compare.click();
  await expect(heading('Review possible duplicates', 'مراجعة السجلات المتشابهة')).toBeVisible();
  const comparison = page.locator('.people-comparison');
  await expect(comparison.locator('.people-proposal')).toContainText(name);
  await expect(comparison.locator('li')).toHaveCount(1);
  await expect(comparison.locator('li')).toContainText(name);
  await expect(review).toBeDisabled();
  await button('Open existing profile', 'فتح الملف الموجود').click();
  await expect(page.getByText('existing-player@example.invalid', {exact: true})).toBeVisible();
  assert.equal(ui.registrations.length, saveStart, 'Checking an existing player does not create or merge records');
  await button('Return to registration draft', 'العودة لمسودة التسجيل').click();
  await expect(nameField).toHaveValue(name);
  await expect(emailField).toHaveValue(contact);
  await compare.click();
  await page.getByRole('checkbox', {name: t(/different fictional person/, /شخص خيالي مختلف/)}).check();
  await review.click();
  await expect(heading('Confirm player registration', 'تأكيد تسجيل اللاعب')).toBeVisible();
  await button('Save registration', 'حفظ التسجيل').click();
  await expect(page.getByText(t('Registration saved', 'حُفظ التسجيل'), {exact: true})).toBeVisible();
  await expect(page.getByText(contact, {exact: true})).toBeVisible();
  const saved = ui.registrations.at(-1);
  assert.equal(ui.registrations.length, saveStart + 1);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.different, true);
  assert.ok(saved.body.revision > 0);
  assert.notEqual(saved.result.player_id, existing);
  const checked = await observe({academy: id, op: saved.body.op});
  assert.equal(checked.totalPlayers, before.totalPlayers + 1);
  assert.equal(BigInt(checked.peopleRevision), BigInt(before.peopleRevision) + 1n);
  assert.deepEqual(checked.registration, {operations: 1, audits: 1, players: 1, result: saved.result});

  await back.click();
  await expect(search).toHaveValue('Synthetic');
  await expect(page.getByRole('button', {name, exact: true})).toHaveCount(2);
  const actions = ui.calls.slice(journeyStart).map(call => call.action);
  const rpcActions = rpcCalls.slice(rpcStart).map(call => call.rpc);
  assert.deepEqual(actions, ['candidates','profile','candidates','create','profile','list']);
  assert.deepEqual(rpcActions, ['i2_candidates_v1','i2_profile_v1','i2_candidates_v1','i2_register_v1','i2_profile_v1','i2_people_v1']);
  const focused = rows.getByRole('button', {name, exact: true}).and(page.locator(':focus'));
  await expect(focused).toHaveCount(1);
  await page.keyboard.press('Enter');
  await expect(page.getByText(contact, {exact: true})).toBeVisible();
  assert.deepEqual(ui.calls.slice(journeyStart+actions.length).map(call => call.action), ['profile']);
  assert.deepEqual(documents, [route]);
  assert.deepEqual(pageErrors, []);
  return {locale, position, returnedPosition, actions, rpcActions, internalDocuments: 0, recordsBefore: before.totalPlayers,
    recordsAfter: checked.totalPlayers, operation: 1, audit: 1, focus: 'registered player'};
}
