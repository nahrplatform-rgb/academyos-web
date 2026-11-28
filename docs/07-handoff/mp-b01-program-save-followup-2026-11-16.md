# WD-71 · Program-wide planning activation and read recovery

Later 16 November: [publication/withdrawal follow-up](mp-b01-publication-save-followup-2026-11-16.md) records the next scoped repair and checks. This packet retains program-planning evidence; the current tracker owns routing.

16 November 2026 · EX-07 / MP-B01 · J10/J11 / IMP-J10-A01 / L07 / SEC-J10/11 · WB-09/10/11/12/20/24 · VAL-03/09. This checkpoint follows [dated-planning save evidence](mp-b01-planning-save-followup-2026-11-16.md); the [runtime/Players repair](local-runtime-reliability-2026-11-15.md), registration and Attendance results remain preserved with their own timestamps and limits.

The Owner's confirmed whole-program save now stays consistent across the retained review and its loading/error state. A lost activation reply is still unknown until the original is reconciled. Once reconciliation confirms commitment, a failed context or detail read offers read-only recovery for that exact job instead of leaving an unusable unknown-operation action.

## Reproduction and repair

The existing suite already covered private preparation, 25/15 checks, pause/resume, blocked/stale proposals, all-or-none overlap refusal, a lost activation reply with a successful recovery read, and a normal confirmed-save/read failure. It lacked held acknowledgements, held follow-up snapshots and a failed read following reconciliation/reload.

The [pre-repair negative control](evidence/mp-b01-program-save-followup/negative-control.json) executes the real component with controlled fictional replies. Ten EN/AR scenarios detect twelve gaps:

- While the post-activation read was held, the success notice said the changes were saved, but the retained ready proposal still said **no effective date changes yet** and **0 dates saved**.
- Reconciliation ignored the committed receipt state and retained `stage=unknown` until the later read succeeded. A failed read left Check original operation visible after its pending original had been cleared; that action had no pending operation to recover. Load saved preparation was absent.
- After reload, context failure could occur before the exact recovered job had been retained as the retry target. The new context-failure case reproduces this boundary too.

[Current source](../../apps/web/src/components/program-planning-workspace.tsx) now applies the acknowledged state/version to the matching retained snapshot. Recovery uses the original receipt's committed/cancelled/preparation state, leaves unknown mode, and retains its job before any supporting read. Load saved preparation restores required context when absent and then reads that job. No new command, authority, version rule, database writer, offline behavior, worker, storage format or migration was added. Receipt state is authoritative only for that original operation; the existing UI explicitly calls it an operation snapshot and says individual dates may subsequently differ.

[Checkpoint/source fingerprints](evidence/mp-b01-program-save-followup/checkpoint.json) · [production React](evidence/mp-b01-program-save-followup/production.json) · [development React](evidence/mp-b01-program-save-followup/development.json) · [helper](../../scripts/program-planning/save_followup.mjs). The reverse [source patch](evidence/mp-b01-program-save-followup/before-source.patch) and before-source hash preserve the exact negative-control variant. `PROGRAM_SAVE_REFERENCE` is accepted only in explicit baseline mode; normal tests use current product source and require zero gaps.

## Exact executed evidence

Each mode runs five cases in EN desktop (1440px) and AR phone (390px): twenty scenarios total across production and development React. They use a fictional already-reviewed 40-date proposal with one preserved plan, 39 changes, version 7 and shared capacity 23. The whole existing suite also still executes creation, checking, weekday rules, roster staging, cancellation, stale/refused activation and identity/authority cases.

| Scenario | Measured behavior after the reviewed Save |
| --- | --- |
| Held activation, held successful read | Focus + Enter dispatches one `change(activate)` with exact job/version/original. While held, Save is disabled, the original locator remains and no saved notice appears. After acknowledgement, saved status and the retained committed snapshot agree. Paired signals add zero reads. Sequence: `change → read → list`. |
| Confirmed activation, failed read | 503 preserves confirmation and offers Load saved preparation. Focus + Enter retries only the scoped read: `change → read → read`. No second activation, hidden context or directory read. |
| Lost reply, reload, committed reconciliation, failed read | Reload performs no bootstrap over the unknown original. The same ID is reconciled, confirmation replaces uncertainty, and a failed read becomes read-only recovery. Sequence: `change → reconcile → context → read → read`. |
| Current denial after acknowledgement | A 403 through the same follow-up removes the private proposal/weekday choices and retry/unknown controls. Sequence: `change → read`. A previously confirmed receipt does not grant current private access. |
| Context failure after reload/reconciliation | Confirmation and exact job survive a 503 context response. Load saved preparation retries context and reads that same job: `change → reconcile → context → context → read`. No new operation. |

Each case asserts one fictional activation, version 8, exact job/original and target fields, retained preserved count, cleared locator only after acknowledgement/reconciliation, and zero captured page errors. These counters establish the client protocol, not actual database date or audit counts. Browser identity/transport is fictional; this is actual-component evidence, not a Next routed-journey or hosted permission claim.

Separately, four actual disposable PostgreSQL 17 tests pass: preparation/atomic activation/preservation/replay, child-insert failure rolling back every date, current roles/foreign-scope/ACL refusal, and concurrent individual-date/stale/cancellation fencing. The first test verifies 40 effective plans, one preserved capacity, 39 new roster entries and one activation audit, including same-original replay. Those SQL tests are separate from the browser adapter. Actual API checks pass 21 budget failures, three invalid-body refusals and cross-origin denial. Broader SQL load/device/hosted matrices retain prior evidence and are not claimed newly run.

Node 24.14.0 checks passed: both full program-planning React modes, 119 library tests, typecheck, lint and a managed production build/source-asset check. A first helper run exposed the fixture's hardcoded English prop; it was corrected to explicit locale entry/reload before completing the baseline. The first typecheck found that optional job equality could match a null snapshot; an explicit non-null guard fixed it. Neither failure was hidden by weakening assertions. Curated failure facts and ignored log paths are in the checkpoint JSON.

## Visual, runtime and reference limits

All 16 real-component capture families and welcome variants were refreshed for the changed UI source; the new program-planning helper is fingerprinted. The factual review now contains 1,417 frames / 1,387 transitions. Review-tool/browser/freshness checks pass. Selected EN desktop and AR phone pending/recovery screenshots were visually inspected: the confirmed status stays visible, the English retained review says committed rather than private preparation, and Arabic recovery no longer exposes an unknown-operation control. No geometry, palette, type or layout redesign is claimed. [Factual review](../../design/app-experience-review/AcademyOS-experience-review.html).

The [accepted all-or-none contract](../06-delivery/i3c-program-planning-design-contract.md) and [security review](../04-engineering/i3c-program-planning-security-review.md) remain governing. The [PYSA scheduling reference](../03-design/pysa-scheduling-reference-review.md) retains useful dated context and historical non-atomic assignment/retry defects. Current read-only source inspection of `pysa-platform/actions/scheduling.ts` confirms scoped path revalidation in its dated-action flow; it supplies no AcademyOS original-operation authority or hosted evidence. PYSA files and records were untouched.

Managed production restart refused because its recorded launcher PID had ended while the orphan listener remained. Its runtime identity and process CWD/command were checked against this checkout. Only that verified orphan listener/CLI and stopped `server-production`/`web-build` leases were removed; a normal managed production build/start then verified the new instance. Development remains available at localhost:3000; the rebuilt preview is localhost:3100. No protected stores, caches, roots, provider settings or account roles were altered.

The task's own named browse session could not establish a signed-in Owner workspace: navigation redirected toward sign-in and the allowlist refused that origin. No allowlist expansion, login, account switch or connected activation was performed. The task-owned session was closed. These local fixtures do not establish a new signed-in, staging-domain or installed-device result.

## Continuation

Base HEAD remains `780225b51360a63153f6fc09d47431cd5b654047`, branch `codex/onboarding-decision-design-packet`. Earlier uncommitted work is preserved. One coordinator worked directly with scripts, zero helpers; exact backend model/token/cost telemetry is unavailable. No commit, push, release promotion or Owner acceptance. Independent human security review remains deferred, not performed. Structural validators establish record consistency only.

EX-07 / MP-B01 remains current. Next permitted WD-71 scope is publication/withdrawal confirmation and follow-up-read continuity: reconcile existing exact Today entry, private preparation, pause, lost-original and failed-read tests, then measure held visibility activation and failed context/detail recovery in EN/AR. Preserve exact jobs/originals/versions, withdrawal semantics, current authority and the smallest authoritative reads; repair only reproduced issues. [MP-Q01 A/B/C](mp-b01-player-decisions-2026-11-14.md) still gates only dependent new Player capabilities. This Owner planning slice does not close whole-app WD-71 or every role.
