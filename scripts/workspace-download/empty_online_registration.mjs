// DS-005: isolated online empty-directory first-registration browser test helper.
// Coordinator-owned integration only; this module performs no top-level work and
// is not a runner. The coordinator supplies page/ui/fixture/base/rpcCalls/observe/pass
// and executes it inside the disposable signed-PostgreSQL fixture. Writing this
// code does not authorize running it here.
import assert from 'node:assert/strict';
import { expect } from '@playwright/test';

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const EMPTY = 'No players registered yet. Register the first fictional player.';
const MISSING = 'Players are not on this device yet.';
const FILTERED_EMPTY = 'No matching players. Try another name.';
const UNAVAILABLE = 'Could not load players';
const DENIED = 'Access unavailable';

function rpcCounts(slice) {
  return Object.fromEntries(
    ['i2_people_v1', 'i2_candidates_v1', 'i2_profile_v1', 'i2_register_v1', 'i2_operation_v1']
      .map(name => [name, slice.filter(call => call.rpc === name).length]));
}

/**
 * Two observations in one deliberately unprepared, online scenario:
 *   1. online genuine-empty entry (one list / one i2_people_v1, no empty-vs-missing
 *      or denial confusion);
 *   2. first confirmed registration and return to a discovered single player.
 * Returns plain JSON metrics; never asserts a runtime success flag.
 */
export async function checkEmptyOnlineRegistration({ page, ui, fixture, base, rpcCalls, observe, pass }) {
  const { academy } = fixture;
  const playerName = 'Synthetic DS005 first player';
  const route = `${base}/en/workspace/${academy}/players`;

  const uiStart = ui.calls.length;
  const rpcStart = rpcCalls.length;
  const registrationStart = ui.registrations.length;

  // Canonical baseline from the coordinator's disposable-database observer.
  const before = await observe({ academy });
  assert.equal(before.totalPlayers, 0, 'canonical academy must start at zero players');
  assert.match(before.peopleRevision, /^\d+$/, 'collection revision is a nonnegative decimal string');
  const beforeRevision = BigInt(before.peopleRevision);

  // Observation 1 — online genuine-empty entry.
  ui.useRealPeople();
  await page.goto(route);

  await expect(page.getByText(EMPTY, { exact: true })).toBeVisible();
  await expect(page.locator('.directory-page-summary')).toHaveText('0 players on this page');
  await expect(page.locator('table.workspace-table tbody tr')).toHaveCount(0);
  await expect(page.getByText(FILTERED_EMPTY, { exact: true })).toHaveCount(0);
  await expect(page.getByText(MISSING, { exact: true })).toHaveCount(0);
  await expect(page.getByText(UNAVAILABLE, { exact: true })).toHaveCount(0);
  await expect(page.getByText(DENIED, { exact: true })).toHaveCount(0);

  const entryActions = ui.calls.slice(uiStart).map(call => call.action);
  assert.deepEqual(entryActions, ['list'], 'initial entry is exactly one People list');
  const entryListRpc = rpcCalls.slice(rpcStart).filter(call => call.rpc === 'i2_people_v1');
  assert.equal(entryListRpc.length, 1, 'initial list maps to exactly one signed i2_people_v1');
  pass('Online genuine-empty entry shows zero players and one list without filtered-empty, missing or denial states');

  // Observation 2 — first confirmed online registration and return.
  await page.getByRole('button', { name: 'Register player', exact: true }).click();
  await page.getByLabel('Player display name (required)', { exact: true }).fill(playerName);
  await page.getByRole('button', { name: 'Continue to duplicate review', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save registration', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save registration', exact: true }).click();

  await expect(page.getByText('Registration saved', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: playerName, exact: true })).toBeVisible();

  const savedRegistration = ui.registrations.at(-1);
  assert.equal(ui.registrations.length - registrationStart, 1, 'exactly one registration is recorded');
  assert.ok(savedRegistration, 'a create registration must be recorded by the real People handler');
  assert.equal(savedRegistration.status, 200, 'first registration commits with status 200');
  assert.match(savedRegistration.body.op, UUID, 'a valid original save ID is captured on the create body');

  const createRpc = rpcCalls.slice(rpcStart)
    .filter(call => call.rpc === 'i2_register_v1' && call.op === savedRegistration.body.op);
  assert.equal(createRpc.length, 1, 'the browser original save ID reaches exactly one signed i2_register_v1');
  const reconcileRpc = rpcCalls.slice(rpcStart).filter(call => call.rpc === 'i2_operation_v1');
  assert.equal(reconcileRpc.length, 0, 'a successful first registration needs no reconciliation');

  const after = await observe({ academy, op: savedRegistration.body.op });
  assert.equal(after.totalPlayers, 1, 'canonical academy holds exactly one player after the first save');
  assert.match(after.peopleRevision, /^\d+$/, 'collection revision is a nonnegative decimal string');
  assert.equal(BigInt(after.peopleRevision), beforeRevision + 1n, 'people collection revision increments by exactly one');
  assert.deepEqual(after.registration,
    { operations: 1, audits: 1, players: 1, result: savedRegistration.result },
    'one operation, audit and operation-linked player with the exact canonical result');

  // Return to the ordinary directory without changing the search.
  await page.getByRole('button', { name: 'Back to players', exact: true }).click();
  const rows = page.locator('table.workspace-table tbody tr');
  const returnedPlayer = rows.getByRole('button', { name: playerName, exact: true });
  await expect(rows).toHaveCount(1);
  await expect(returnedPlayer).toHaveCount(1);
  await expect(returnedPlayer).toBeVisible();
  await expect(rows.first()).toBeVisible();
  await expect(page.locator('.directory-page-summary')).toHaveText('1 player on this page');
  await expect(page.getByText(EMPTY, { exact: true })).toHaveCount(0);

  const scenarioActions = ui.calls.slice(uiStart).map(call => call.action);
  assert.deepEqual(scenarioActions, ['list', 'candidates', 'create', 'profile', 'list'],
    'online empty registration is list, duplicate review, create, saved profile, canonical return list');

  const scenarioRpc = rpcCalls.slice(rpcStart);
  const counts = rpcCounts(scenarioRpc);
  assert.deepEqual(counts, {
    i2_people_v1: 2,
    i2_candidates_v1: 1,
    i2_profile_v1: 1,
    i2_register_v1: 1,
    i2_operation_v1: 0,
  }, 'the complete scenario has the exact signed RPC budget');
  pass('First confirmed online registration returns to a discovered single player');

  return {
    scenario: 'online empty-directory first registration',
    initial: { totalPlayers: before.totalPlayers, peopleRevision: before.peopleRevision },
    final: { totalPlayers: after.totalPlayers, peopleRevision: after.peopleRevision },
    peopleActions: scenarioActions,
    originalIdForwarded: true,
    rpcCounts: counts,
    registrationSnapshot: {
      operations: after.registration.operations,
      audits: after.registration.audits,
      players: after.registration.players,
      result: after.registration.result,
    },
  };
}
