# WD-71 · Owner dated planning save and follow-up read

Later 16 November: the [program-wide activation checkpoint](mp-b01-program-save-followup-2026-11-16.md) completes that next scoped case and records its reproduced repairs. This packet retains dated-planning evidence; use the tracker for current routing.

16 November 2026 · EX-07 / MP-B01 · J10/J11, IMP-J10-A01, L07, SEC-J10/11 · WB-09/10/11/12/20/24 · VAL-03/09. **Evidence extension only:** the existing product passed the new cases, so no application code, schema, command, field or authority changed.

The Owner's confirmed dated-plan save stays confirmed while its one follow-up read is held or fails. A failed read offers **Load saved plan**, which retries only the scoped read. A lost save reply instead retains its original operation ID across reload and requires reconciliation of that same ID. These are separate states; an unknown outcome never shows a new confirmed-save notice.

[Curated source/checkpoint receipt](evidence/mp-b01-planning-save-followup/checkpoint.json) · [Production React](evidence/mp-b01-planning-save-followup/production.json) · [Development React](evidence/mp-b01-planning-save-followup/development.json) · [New test helper](../../scripts/planning/save_followup.mjs).

## Reconciled existing evidence

- [Prepared registration](mp-b01-empty-prepared-continuity-2026-11-08.md) retains real-handler/signed-PG confirmed registration, changed-directory transfer, failed replacement and lost-original proof. The later [local runtime/focus checkpoint](local-runtime-reliability-2026-11-15.md) covers actual post-commit row focus, superseding input and connected registration. Neither result was rerun or redated here.
- [Normal Attendance](ex07-normal-attendance-checkpoint-2026-11-06.md) and `scripts/working-day/test_normal_attendance.mjs` retain confirmed dispatch/read failure, read-only retry, lost original and account/deadline fences. The subsequent [local connected Attendance receipt](evidence/ex07-local-offline-attempt-2026-11-14.json) retains its separate evidence layer.
- [Dated planning implementation](i3b-planning-implementation.md) already tests failed follow-up, cancelled/unknown save, stale version and access refusal. Its existing UI test had no held acknowledgement/follow-up matrix, exact post-save action sequence or EN/AR keyboard recovery count. Those gaps motivated this bounded extension. Historical assertions remain intact.

## Executed cases

Each case starts from the actual `DatePlanningWorkspace` under the shared runtime, a reviewed version 7 / schedule version 3, and an explicit capacity change from 18 to 23. The helper uses fictional identity/HTTP adapters and the same product component as the existing suite. EN desktop (1440px) and AR phone (390px) run in both production and development React: six cases per mode, twelve total. These are component scenarios; this helper does not claim real Next route return or hosted identity proof.

| Scenario | Exact assertions |
| --- | --- |
| Held save then successful held read | Save is activated with focus + Enter and stays disabled while held; reviewed choices remain visible, no saved notice appears, and the original ID is stored. Paired resume signals add no request. After acknowledgement the saved notice appears before the follow-up returns, the locator clears, and replacement save/reconciliation controls are absent. Actions after review: `save → read`. |
| Confirmed save, failed follow-up | Same held-write checks, then a visible saved notice while the read is held. A 503 retains saved status, shows the read error and enables Load saved plan. Focus + Enter issues only a new `read`. Actions: `save → read → read`. |
| Lost committed reply, reload, reconciliation, failed read | Exactly one fictional save updates the version; lost reply shows the unknown-original action without saved status. Reload performs no bootstrap or replacement save. Reconciliation receives the same stored ID, confirms it, then the held/failed read follows the confirmed path. Actions: `save → reconcile → read → read`. |

Every case asserts one fixture write, version 8, unchanged schedule version 3, retained target program/day, capacity 23 on reopening the editor, no extra document except the deliberate unknown-outcome reload, and zero captured page errors. Initial task entry reads only its detail, not a hidden date directory. These assertions establish the client state/command protocol. The fake transport's counter is not a database audit count.

Separately executed actual API tests pass body/origin/budget refusals (18 budget failures, three invalid bodies, cross-origin denial). Three named disposable PostgreSQL 17 tests pass atomic save/reopen/replay/history, current roles/scope/direct denial, and fingerprint/fence/rollback. They establish their own canonical boundary invariants; the new browser adapter is not wired to those SQL tests and no new browser-to-database correlation is claimed. The broader capacity/conflict/scale matrix retains historical evidence and was not rerun for this test-only change.

No defect was reproduced in the application. The first helper integration run failed with a test wiring `ReferenceError` because its origin was block-scoped elsewhere in the runner. Passing the fixture server's actual origin fixed the harness. Both full planning UI modes then passed with the existing assertions retained. First failure remains in ignored `test-results/wd71-planning/production.log`; curated failure facts are in the receipt.

## Reference, visuals and local use

The accepted [dated-plan preparation](../04-engineering/i3b-draft-session-planning-preparation.md), [design contract](../06-delivery/i3b-draft-session-planning-design-contract.md) and [security review](../04-engineering/i3b-planning-security-review.md) require exact versions, atomic private date save and original reconciliation. The [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md) retains useful occurrence context and historical separate-write/retry defects. This task changes no journey design and imports no PYSA implementation or policy.

The planning capture family was refreshed using actual components. Its helper dependency is now included in factual-review fingerprints. Other unchanged-source families were retained. The factual review rebuilt to 1,406 frames / 1,363 transitions and passed its browser tool checks. These counts describe captured evidence, not all product coverage. The selected Arabic phone held-read screenshot was visually inspected: confirmed status is separate from loading and the disabled saved-plan read control, with the Calendar return still guarded. No geometry, palette, typography or wording change is proposed. [Factual review](../../design/app-experience-review/AcademyOS-experience-review.html).

At entry the development listener was unresponsive and its recorded launcher PID no longer existed. Managed restart correctly refused to treat the port as verified. Read-only process/CWD inspection identified this checkout's orphan Next CLI/listener. Only those processes and the stopped `server-dev` lease were removed; a normal managed dev start restored localhost:3000. `npm run local:status` then verified both development and production instances. No protected data, worker, provider configuration, key or account was changed. This is runtime readiness only; no new signed-in or connected-write claim is made.

## Continuation and limits

The base HEAD remains `780225b51360a63153f6fc09d47431cd5b654047` on `codex/onboarding-decision-design-packet`. Existing uncommitted product, runtime and documentation edits were preserved. The current product compiled-source/asset receipt remained valid; no rebuild was needed for this test-only extension. New evidence source hashes and commands are in the checkpoint. One coordinator ran scripts directly with zero helpers; backend model and token/cost telemetry were not exposed. No commit, push, promotion, new staging/device verification or Owner acceptance. Independent human review remains deferred, not performed.

WD-71 remains open across other Owner/cross-role commands. Next permitted connected scope is program-wide planning activation: reconcile existing all-or-none, pause and unknown-original evidence, then measure held activation and held/failed follow-up with exact job/original/version/read counts in EN/AR. Repair only a reproduced issue. [MP-Q01 A/B/C](mp-b01-player-decisions-2026-11-14.md) decisions remain separate and gate only dependent new Player capabilities.
