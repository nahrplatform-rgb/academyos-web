# WD-71 · One-session move and cancellation follow-up

16 November 2026 · EX-07 / MP-B01 · J09/J10/J11 · IMP-J11-A02 · L04/L07 · WB-09/10/11/12/20/24 · VAL-04/09. The [correction/feedback checkpoint](mp-b01-review-save-followup-2026-11-16.md) and prior registration, Attendance, dated/program planning and publication checkpoints remain retained.

A confirmed move or cancellation now explains whether its current state/history is still loading, could not be read, or is shown. A failed follow-up no longer pairs **Change saved** with **No success is assumed**. Load current date remains a read-only recovery; it does not repeat the saved command. No scheduling, cancellation, review authority or current-start rule changed.

## Active request and exact reproduction

The living continuation selected Owner WD-71 session-change command/result continuity. Required acceptance is held confirmation and held/failed follow-up in EN/AR with exact original occurrence, reviewed schedule/plan/head, reason/history, one change and current denial. Write ownership is the component's status/error presentation, existing UI/domain test harnesses, a bounded helper and checkpoint/review records. No navigation, schema, canonical writer, audience, roster, role, key, worker or provider setting was changed.

The [existing implementation](i3e-session-changes-implementation.md), [accepted design](../06-delivery/i3e-session-changes-design-contract.md) and [security/preparation packet](../04-engineering/i3e-session-changes-preparation.md) already retain original identity, one-date scope, exact reason/review, atomic writes/history, withdrawal-before-change, current-start and attendance guards. Existing UI tests cover lost reply/reload, cancellation history, stale rereview, fenced non-commit, read retry, published/domain failures, denial, account remount and EN/AR responsive layouts. No new repair of those paths is claimed.

New [held-response helper](../../scripts/session-changes/save_followup.mjs) reproduces the conflicting confirmed/failure presentation in eight failed-result scenarios across move/cancel and EN/AR. [Pre-repair negative control](evidence/mp-b01-session-change-followup/negative-control.json):16 scenarios,8 detected conflicts. The [reverse patch](evidence/mp-b01-session-change-followup/before-source.patch) and source hash retain the exact pre-repair component. Reference substitution requires explicit baseline mode. Ordinary tests require zero conflicts.

The product change uses the existing busy/read-failed flags for three distinct confirmed messages. The generic unavailable error is suppressed only beside this known confirmed result; unknown outcomes and other errors keep their existing handling. No returned value is invented from a receipt and no writer or operation locator format changed.

## Executed component matrix

[Production React](evidence/mp-b01-session-change-followup/production.json) · [development React](evidence/mp-b01-session-change-followup/development.json): **32 cases**, move/cancel × EN desktop1440/AR phone390 × success/read503/lost reply/current403 × two React modes. Actual product React and controlled fictional identity/HTTP; not hosted identity, routed return or SQL atomicity proof.

| Scenario | Assertion and post-review request sequence |
| --- | --- |
| Held save and held success | `save → read`. Confirm uses focus+Enter and is disabled while held; zero fictional effects before acknowledgement, one scoped opaque original, no premature saved claim. Acknowledgement clears the original and shows current loading without an error. Paired focus/visibility signals add no request. |
| Confirmed save, read503 | `save → read → read`. Explicit confirmed/read-failed status, no replacement confirmation, then Load current date by focus+Enter reads the same original occurrence only. |
| Lost reply, reload, reconcile, read503 | `save → read → reconcile → read → read`. Existing reload performs one current scoped read while retaining unknown mode and the same original; that read cannot settle the operation. Explicit reconciliation uses the original once. Failed-result retry is read-only. No bootstrap optimization or recovery repair is claimed. |
| Confirmed save, current403 | `save → read`. Current denial clears private Trainer/player/reason content and exposes neither saved-result retry nor unknown-original controls. Receipt acknowledgement grants no continuing authority. |

All calls bind the same academy/program/original day. Review/save bind plan7, schedule3 and the exact existing head, move date/times or null cancellation inputs, and the authored reason. Result data is plan8/schedule4 and one history row. Trainer, capacity and player identity remain in the fixture; the rendered review includes them and result history includes the reason. Cancellation disables another move. All32 cases assert one fictional effect/original, no replacement and zero page errors. The call counter is an HTTP adapter assertion, not a database audit count.

## Actual API and database evidence

The actual API suite passes12 budget refusals, three invalid bodies and cross-origin denial with its existing synthetic session/limiter adapters. Eleven session-change domain tests run on disposable PG17, separately covering stable identity/effective discovery, cancel occupancy, stale/fence/audit rollback, roles/scope/DST, observed competing move/publish/cancel orders, unplanned revisions, stale preparations, overlapping appointments/history paging, bounded roster, failed validation/current-clock rollback and effective-date paging.

The first domain run reported three failures and one error: old fixtures attempted to change1November2026 sessions after their start. Four future-operation fixtures now use2099–2100 dates with the same weekday geometry. Current-start refusal remains tested. Setup moves/cancellations now assert `changed=true` before downstream assertions, preventing expired fixtures from silently testing the wrong state. The stale program-preparation case uses the matching future range; no production time check was weakened.

The large-roster sample also used a past occurrence and did not assert successful review/save. It now uses the same future fixture and checks each review/save result inside the measured block before rolling the sample save back. Fifty local warm samples each exercise actual read/review/save on a1001-player roster with25-name bounded response. The [new sample](evidence/mp-b01-session-change-followup/sql-large-roster.json) is separate from dated historical evidence, which is retained. These local SQL timings do not establish hosted latency, cold provider, WAL, sustained load or cost. All11 corrected domain cases pass.

The first new UI helper expected Trainer text in the result inspector, while actual desktop composition places it in the main summary. The assertion now checks the actual main region, retaining the exact review/history checks. This was a fixture locator mismatch, not a product defect.

## Verification checkpoint and continuation

Node24.14.0: actual UI suites in both React modes, API checks,11 domain SQL tests,119 units, typecheck, lint and managed production rebuild/restart pass. Existing28-check signed Owner Today/Attendance recovery evidence passes its source-freshness check and is retained at its original timestamp; it was not rerun or promoted to session-change routing proof. The changed component is not a new destination/return repair.

All16 factual capture families and8 static welcome captures pass. The rebuilt factual review contains1530 frames and1627 observed transitions with zero capture gaps; offline review-tool and source-freshness checks pass. Exact source hashes, assertions, results and limits are recorded in the [checkpoint receipt](evidence/mp-b01-session-change-followup/checkpoint.json). Development and production runtimes remain local frontends configured for shared synthetic staging; this task's new mutations used controlled HTTP or disposable databases, with no live connected session changes.

Read-only PYSA reference revisited the scheduling review, `actions/scheduling.ts` and historical EV-0088 linked-session recovery: occurrence context and retained people/history are useful; partial linked writes and retry duplicates in its synthetic audit are not imported. No new PYSA hosted observation, copied permission/business rule, account or data change. The selected Operations composition, shared controls and original EN/AR keyboard confirmation remain; only status wording changes, with no geometry/palette/type redesign.

HEAD remains `780225b51360a63153f6fc09d47431cd5b654047` on `codex/onboarding-decision-design-packet`. Existing edits are preserved. One coordinator, zero helpers; backend model/usage unavailable. No commit, push, promotion, new hosted/installed-device proof, Owner acceptance or independent human review. External review remains deferred, not passed. Whole-app WD-71 and MP-Q01 dependent Player choices remain open.
