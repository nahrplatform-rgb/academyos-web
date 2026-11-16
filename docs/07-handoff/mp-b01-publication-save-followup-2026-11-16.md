# WD-71 · Publication and withdrawal confirmation

16 November 2026 · EX-07 / MP-B01 · IMP-J11-A02 / J10–J11 / L04/L07 / SEC-J10/11 · WB-09/10/11/12/20/24 · VAL-04/09. The [program-planning repair](mp-b01-program-save-followup-2026-11-16.md), [dated planning](mp-b01-planning-save-followup-2026-11-16.md), registration, Attendance and runtime evidence remain separate retained checkpoints.

A confirmed publish or withdraw now updates the matching retained review from the server's acknowledged state/version. It no longer says **Private preparation. No visibility changes until final save** beside a confirmed visibility commit. Reconciliation of a committed original now shows the explicit committed-visibility notice while its result is loading, rather than a generic original-confirmed notice.

## Reproduction and bounded repair

The existing [exact Today publication checkpoint](mp-b01-owner-publication-2026-11-11.md) already opens a job with one signed read and preserves its original across reload, missing sign-in and storage refusal. The existing publication component suite covers sequential preparation, pause/resume, stale/blocked checks, exact audience confirmation, normal failed-read retry, lost activation replies, Trainer roster refusal after withdrawal and identity remount. Those assertions remain intact.

The new [negative control](evidence/mp-b01-publication-save-followup/negative-control.json) runs the saved pre-repair component against controlled responses: 20 cases detect 20 held-read status gaps. Ordinary activation displayed both the committed notice and the old private-preparation text. Reconciled committed operations left unknown mode correctly, but the displayed notice did not state that visibility had committed. Unlike the earlier program-planning bug, publication's unknown-to-read transition and context retry already worked; no repair of those paths is claimed.

[Application change](../../apps/web/src/components/publication-workspace.tsx): consume the existing command receipt's state/version in the matching loaded job and recognize `state=committed` in the reconciliation notice. No schema, canonical writer, visibility audience, withdrawal timing, history, review version, field, role, worker or original storage format changed. The existing operation-record wording still warns that current date summaries may differ after later operations. A committed receipt does not confer ongoing private read access.

[Curated receipt and source hashes](evidence/mp-b01-publication-save-followup/checkpoint.json) · [production React](evidence/mp-b01-publication-save-followup/production.json) · [development React](evidence/mp-b01-publication-save-followup/development.json) · [new helper](../../scripts/publication/save_followup.mjs). The reverse [source patch](evidence/mp-b01-publication-save-followup/before-source.patch) and receipt hash preserve the pre-repair negative-control variant. Normal tests use current source and require zero gaps; reference substitution is allowed only in explicit baseline mode.

## Executed matrix

Both publish and withdraw run five scenarios in EN desktop (1440px) and AR phone (390px), in production and development React: **40 cases**. Each fictional ready proposal has 40 dates, 39 changes, one unchanged date, reviewed version 7 and returned version 8. The browser adapter asserts exact academy/job/original, one activation and no replacement. It is not a database audit counter.

| Scenario | After-review request sequence and assertion |
| --- | --- |
| Held activation then held success | `change → read`. Save uses focus + Enter, is disabled while held, retains its original, and shows no premature commit. The acknowledged snapshot/notice agree before read completion; paired resume signals add no request. Exact task entry uses only `read`. |
| Confirmed activation then read 503 | `change → read → read`. Confirmation remains; Load saved preparation uses focus + Enter and retries the exact read only. No new activation, context or supporting-list request. |
| Lost reply, reload, original reconciliation, read 503 | `change → reconcile → read → read`. Reload does not bootstrap or replace the unknown original. The same ID resolves; committed status is explicit before the held read finishes, and failed-read recovery stays read-only. |
| Current denial | `change → read`. A 403 through the result read clears the private summary and exposes neither unknown-original nor saved-result retry controls. Existing access recovery remains. |
| Overview context fails after reconciliation | `change → reconcile → read → context → context → dates → jobs`. The result is already read and committed; the existing Load program action retries the missing context and supporting overview without another activation or job read. The test waits for that chain to settle before checking counts. |

All cases assert zero captured page errors, exact version/job/original and one fixture activation. Publish and withdraw remain distinct job kinds. The full existing suite additionally retains blocked/stale/pause and Trainer withdrawal semantics. New held-response cases exercise actual product React with fictional identity/HTTP; they do not establish hosted identity, real browser-to-SQL mutation correlation or Next route return.

Four separately executed disposable PostgreSQL 17 tests cover publish/frozen snapshot/withdraw/republish and retained private plans, invalid/stale child/audit rollback, current roles/scope/appointment and original fencing, and competing activation/edit serialization. Actual API checks pass 27 budget failures, three invalid bodies and cross-origin refusal. These establish their named data/API invariants independently of the new browser adapter.

The existing signed Next/Chromium/PG working-day suite passes all 28 checks, including exact Today publication entry/return, dirty scope, stored originals, lost replies, missing sign-in and unavailable recovery storage. Its owning runtime receipt was refreshed using `--record` and checked with `--check`, preserving required assertions. [Working-day receipt](evidence/ex07-normal-attendance/runtime.json). The separate clean run preceded receipt refresh; the second run was required to bind the source-dependent receipt, not reported as another independent behavior claim.

## Visuals, runtime and failures

Node 24.14.0: 119 library tests, typecheck, lint and managed production restart/build passed. Both local runtimes and production source/assets were verified. All 16 actual-component capture families and welcome variants were refreshed, with the new publication helper included in review fingerprints. The factual review contains **1,440 frames / 1,411 transitions**; review-tool/browser/freshness checks pass. Selected Arabic phone publish/withdraw held-recovery captures were inspected: committed status remains visible and unknown-operation controls are absent. No geometry, palette or type redesign. [Factual review](../../design/app-experience-review/AcademyOS-experience-review.html).

New harness development exposed an incorrect saved-row label, an overly broad Withdraw locator, and an action-history assertion sampled before the context/dates/jobs chain completed. Exact control labels and waiting for the observed chain fixed the harness; no timeout or product assertion was weakened. Curated facts and ignored logs are retained in the receipt. No new product context-recovery defect was inferred from those test errors.

The [accepted publication/withdrawal contract](../06-delivery/i3d-trainer-schedule-design-contract.md) and [engineering preparation](../04-engineering/i3d-trainer-schedule-preparation.md) retain current Trainer assignment, frozen scoped snapshot, all-or-none activation, withdrawal-before-edit, original fencing and history. The [PYSA scheduling review](../03-design/pysa-scheduling-reference-review.md) remains read-only reference for dated context and historical split-write/retry defects; no PYSA rule, permission, code or record was imported. No new business decision is introduced.

## Continuation and limits

Base HEAD remains `780225b51360a63153f6fc09d47431cd5b654047` on `codex/onboarding-decision-design-packet`. Earlier uncommitted work is preserved. One coordinator, zero helpers; exact backend model and usage telemetry unavailable. No commit, push, promotion, live connected visibility change, new staging/installed-device proof or Owner acceptance. Independent human review remains deferred, not performed. Structural validators establish routing/record consistency, not behavioral truth.

The tracker keeps EX-07 / MP-B01 current and selects remaining WD-71 correction/feedback Owner-decision continuity. Reconcile existing exact Today entries, different-actor rules, reasons/history and original recovery; measure held decision and failed result read in EN/AR with exact original/version and minimal reread. Repair only reproduced issues without changing review authority or business rules. [MP-Q01 A/B/C](mp-b01-player-decisions-2026-11-14.md) remains a separate dependent Owner choice. This checkpoint does not close whole-app WD-71 or all roles.
