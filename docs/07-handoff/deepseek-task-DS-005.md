# DS-005 — Implement one isolated empty-directory browser test helper

Prepared 8 November 2026, EX-07 / MP-B01, VAL-02/09, IMP-J06-A01, existing WD-70/71 joins. Check `ai-work-items.csv`: this must be `ready_for_handoff`, and EX-07 must still be the single current MP-B01 priority before starting. Read AGENTS.md and the [DS-004 coordinator corrections](deepseek-DS-004-review-2026-11-08.md). This is one small test implementation, not another audit or permission to modify the app. A ready manual brief launches no worker.

## Result and owned files

Write only these two new files, then stop:

- `scripts/workspace-download/empty_online_registration.mjs`
- `docs/07-handoff/deepseek/DS-005-empty-online-registration.md`

If either already exists, stop without overwriting and report it. Do not edit any existing file, shared tracker, generator, receipt, package, fixture, component or SQL. The coordinator integrates and runs the test. Do not create an independent runner/server/database or a second fixture engine.

## Frozen reads

Use `git show d2bccb8c9475dac9f7c4d1210b33655ae8320008:<path>` for these sources. Record full SHA-256 and compare the same paths to the working tree; report drift without repairing it. The coordinator may continue independently outside your owned paths.

| Read | Frozen SHA-256 |
|---|---|
| `apps/web/src/components/people-workspace.tsx` | `5d9d0d46b9c20e865708a85d578177ff7c05844402cd0760adf0ac2ee59b91a0` |
| `scripts/workspace-download/normal_workspace.mjs` | `7323cc8c3923909c559e8b2285ce444fde94231cc091ae7c5bf8e7c0f39621df` |
| `scripts/workspace-download/bridge.py` | `afb9f8dfb482ea5397f5c12f66c8ec2985565b2ab3925caf7d30476c3a127a0c` |

You may read `scripts/workspace-download/test_transport.mjs` at that commit, **only imports and lines322–383/690–712**, to understand the real-handler/RPC collection seam; hash the full file without executing/importing it. Read the current DS-004 review/dispositions and your brief/task row. No other source, credentials, environment files, real accounts, chats, provider consoles or PYSA investigation is needed. If another source is essential, report the exact missing symbol rather than expanding scope.

## Exact helper interface

Export one async function; no top-level test execution:

```js
export async function checkEmptyOnlineRegistration({
  page, ui, fixture, base, rpcCalls, observe, pass,
}) { /* assertions; return plain JSON metrics */ }
```

The coordinator will provide:

- `page`: a fresh Playwright Page in an isolated clean browser context, desktop English, without existing downloads, keys, cookies, service workers, view hints or originals. You do not create or close its context.
- `ui`: the existing `normalWorkspaceFixture(...)` object, with `calls`, `registrations`, `useRealPeople()`. Its People endpoint is wired to the **real canonical handler and signed disposable PostgreSQL fixture**. Do not fake responses or change these arrays.
- `fixture`: `{academy, branch}` from a setup-complete, genuinely zero-player **directory-only** `db({action:'make',size:0,unregistered:true})` fixture. Do not empty the populated fixture or add a calendar fixture's implicit player.
- `base`: the isolated fixture HTTP origin, never a hosted URL. Open `${base}/en/workspace/${fixture.academy}/players`.
- `rpcCalls`: the existing append-only array of actual signed RPC invocations, including `rpc` and `op` properties. Take starting indexes and inspect only your scenario's calls.
- `observe({academy, op})`: a coordinator-owned **read-only disposable-database observer**, not an app endpoint. Before saving omit `op`; it returns `{totalPlayers, peopleRevision}`. After saving supply the original `op`; it returns those fields plus `registration: {operations,audits,players,result}`. `peopleRevision` is a nonnegative decimal string for the workspace collection counter; compare using `BigInt`. `totalPlayers` counts **all players in that academy**. `registration.players` is separately operation-linked. This adapter is not implemented by this task; report that integration dependency explicitly.
- `pass(label)`: the coordinator's assertion receipt callback. Call only after the corresponding assertions complete, never to inflate counts.

Imports should be limited to `node:assert/strict` and the existing `expect` from `@playwright/test`. No new dependencies. Keep the function straightforward; do not create a generic testing framework or copy the whole populated-directory suite.

## Exactly two observations in one scenario

1. **Online genuine-empty entry.** Call `ui.useRealPeople()` before opening the route. Observe and assert canonical academy total0. Open the real component. Await `No players registered yet. Register the first fictional player.` and `.directory-page-summary` equal to `0 players on this page`. Assert no table body player rows, no filtered-empty sentence, no missing-download sentence and no unavailable/denial card. Assert exactly one People `list` and one `i2_people_v1` invocation for this initial entry. The list contract has no `revision` field; do not assert one. Record a first pass label.
2. **First confirmed online registration and return.** Use a fixed fictional unique name such as `Synthetic DS005 first player`, no contact. Click `Register player` → fill `Player display name (required)` → `Continue to duplicate review` → `Save registration`. Await `Registration saved` and the correct profile. The creation must have status200 and a valid original save ID forwarded to exactly one `i2_register_v1`; there is no reconciliation in this successful scenario. Click `Back to players` without changing search. Await exactly one matching player button/table row and `.directory-page-summary` equal to `1 player on this page`, with no genuine-empty sentence. Observe canonical total1, collection revision equal to the observed before value+1, and operation-linked snapshot `{operations:1,audits:1,players:1,result: savedRegistration.result}`. Record a second pass label.

This scenario deliberately stays **unprepared and online**. Expected People actions for the whole scenario are `['list','candidates','create','profile','list']`: initial list, duplicate review, one create, saved profile and canonical return list. The prepared-directory budget without that final list is a different coordinator-owned test. Index `ui.calls` as objects (`call.action`), not strings. Check the exact observed sequence and signed RPC counts; if it disagrees, report the mismatch and stop rather than relaxing assertions, altering app behavior or inventing successful results.

Return plain JSON with scenario name, initial/final totals and revisions, People action sequence, original-ID-forwarded fact, registration/lookup counts and operation-linked snapshot counts. Do not include passwords, credentials, full API bodies or an asserted runtime success flag before execution. Use web-first waits on actual state; no fixed sleeps, local counter tricks, direct DOM mutation, snapshot edits, forced bypass clicks, weakened budgets or ignored console/response failures.

## Checks and stop conditions

You may run **only** `node --check scripts/workspace-download/empty_online_registration.mjs` and format/read-only Git/hash checks. No application import/execution, Playwright run, build, test suite, database action, install, live browser/provider/account action, nested agent, Git staging/commit/push, message or deployment. Test code contains fictional browser actions for later coordinator execution; writing that code does not authorize running it yourself.

In the short Markdown report record inspected commit/full hashes, working-source drift, exact two output paths, syntax-check result, exported interface, expected versus unmeasured request sequence and the `observe`/runner integration still required. State that this is unintegrated test code, not a passed regression, product fix, hosted NR07 diagnosis, security/Owner acceptance or promotion. If syntax fails, repair only your new module. If a required interface/control cannot be supported, stop and report the precise gap. Do not start the prepared/offline/lost-reply/failure/auth cases from DS-004.

Default one external helper total, no nested work. The coordinator retains architecture, scope/auth, sync/recovery, shared fixture/observer wiring, result review, publishing and acceptance records; the Owner retains promotions. A bounded returned implementation is more useful than filling the remaining allowance with audits.
