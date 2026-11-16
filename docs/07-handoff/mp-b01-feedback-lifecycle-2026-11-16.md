# WD-71 · Feedback amendment and withdrawal recovery

16 November 2026 · EX-07 / MP-B01 · J16-A01–A06 / IMP-J16-A01 · S31/S32 · L10 · SEC-J16 · WB-09/10/11/12/20/24 · VAL-01/05/09. The [Trainer submission checkpoint](mp-b01-trainer-submission-2026-11-16.md) and its correction repair remain retained.

The existing feedback component passes the scoped amendment/withdrawal follow-up checks. **No product source, schema, API or business rule changed in this checkpoint.** The new actual-component helper adds explicit held-command, delayed/failed-read, original-recovery and denial assertions. Read-only retry avoids duplicate decisions; time savings are unmeasured.

## Accepted behavior and exact cases

The [feedback design](../06-delivery/i5a-development-feedback-design-contract.md), [decisions](../06-delivery/i5a-development-feedback-decisions.md) and [implementation](i5a-development-feedback-implementation.md) retain exact current Trainer/Owner authority, versioned commands and immutable publication/history. Trainer amendment starts a successor draft while the current family publication remains. Owner withdrawal removes the current publication without deleting its history. No new fields, approval steps, roles, offline commands or family access are introduced. This matrix starts from a published revision; withdrawal during a successor draft/submission and amendment from withdrawn state are not newly exercised here.

[Helper](../../scripts/review-decisions/publication_lifecycle.mjs) · [production receipt](evidence/mp-b01-feedback-lifecycle/production.json) · [development receipt](evidence/mp-b01-feedback-lifecycle/development.json) · [checkpoint and fingerprints](evidence/mp-b01-feedback-lifecycle/checkpoint.json).

**40 cases**: amendment and withdrawal × EN1440/AR390 × success/detail503/supporting-list503/lost reply/current403 × production/development React. The suite compiles the real DevelopmentWorkspace and shared components with fictional identity/HTTP. Trainer enters session → player; Owner enters the retained assessment queue → player. This component navigation is not an actual Next destination/return or signed-in provider claim.

| Required assertion | Executed evidence |
| --- | --- |
| Exact original action and pending guard | Focus+Enter on Propose an amendment or Confirm withdrawal; disabled original control while command held; zero fictional effects until release. Exact academy/event/player/version7, empty command fields, existing content language and withdrawal reason asserted. |
| Protected original recovery | Only opaque event/player/operation locator in session storage. Lost reply retains it across same-path reload; no bootstrap or paired-signal read until focused explicit Check original operation. Reconciliation uses the same operation/event/player. |
| Known confirmation versus read failure | Original clears after acknowledgement/reconciliation. Held detail shows confirmed loading with no premature read-failure message; focus/online/visibility signals add no request while held. |
| Read-only retry | Detail503 and roster/queue503 show the existing failure state. Focus+Enter on Retry current view rereads the exact detail and applicable supporting list, with one command/effect total. Lost-reply reload has no list query and rereads only exact detail. |
| Current denial | A current detail403 clears player and private staff content and removes unknown-original action. Client denial presentation only; database authority is tested separately below. |
| Publication semantics | Fictional result version8 retains fields. Amendment ends draft/revision4 with publication revision3 still shown and Continue draft available. Withdrawal ends withdrawn/revision3 with publication absent and withdrawal control removed. Both retain internal history control. This is client rendering/protocol, not database history proof. |
| Complete request sequence | Success: command → detail → roster/queue. Detail failure: command → detail503 → detail → list. List failure: command → detail → list503 → detail → list. Lost reply: command → operation → detail503 → detail. Denial: command → detail403. Zero page errors and one fictional operation per case. |

These are executed behavioral assertions, not comments about expected behavior. The review dependency maps structurally fingerprint the imported helper; that check does not certify future compliance or untested evidence semantics. No regression repair is claimed, so no before-source negative control is claimed.

## Database, API and review evidence

The unchanged disposable PostgreSQL17 suite ran all **11 development domain tests**: [sanitized output](evidence/mp-b01-feedback-lifecycle/sql.txt). Its roundtrip test executes actual submission/return/publication/amendment/successor/withdrawal, checks old family text remains through successor submission, replacement publication becomes current, withdrawal refuses family detail, and two publication snapshots/three submissions remain. Other cases cover role/tenant/link authority, replay/payload mismatch, concurrent expected versions, rollback, immutable snapshots, history/current operation authority and Owner withdrawal without applying the separate publication self-review restriction. This is local SQL evidence, not hosted RLS/provider verification. No migration change was required.

The [actual API route test](evidence/mp-b01-feedback-lifecycle/api.txt) passes33 budget refusals, three invalid bodies and cross-origin denial with fictional limiter/session adapters. The existing [normal Attendance/Owner-return receipt check](evidence/mp-b01-feedback-lifecycle/normal-check.txt) passes for unchanged runtime inputs; its prior28-case execution retains its original timestamp and was not rerun or redated here. Product inputs are unchanged, so no new root build, typecheck, unit regression or signed-in process readiness is claimed.

Only the affected development family was recaptured. All other unchanged families and static captures retain their earlier timestamps. The factual review rebuild contains1695 frames/2231 transitions and zero capture gaps; review-tool and freshness checks pass. Counts describe captured states, not full-app acceptance. The Arabic390px withdrawal/list-read failure image was visually inspected: the known receipt and focused read retry remain legible while private detail is masked. No geometry, typography, spacing, colour or wording changes were made, and this is not a new full Operations-parity claim.

PYSA EV-0029 evaluation/source review and `pysa-platform/actions/performance.ts` were read as reference during this continuation. Useful reviewed snapshots and actor scope remain distinct from split-write/stale-authority defects and hosted proof; no PYSA changes or copied data.

One coordinator, zero helpers; exact backend model/usage unavailable. No connected staging writes, provider/profile/catalog/MCP/account/key changes, commit, push or promotion. Hosted, installed/physical-device, Owner acceptance and independent external review remain separate; external review is deferred, not passed. WD-71 and MP-B01 are not declared complete.

## Continuation

The amendment/withdrawal checkpoint is complete locally within the declared published-state matrix. The single EX-07 / MP-B01 tracker row retains priority. Continue through this finite closure sequence under the existing accepted contracts:

1. **Reconcile WD-71 coverage.** Record one compact matrix of the applicable accepted commands and required behaviors against existing receipts, tested source and evidence layers. Distinguish covered cases, actual gaps and explicitly gated cases; identify the exact missing assertion or prerequisite. Preserve completed registration directory/count/focus, Trainer submission, feedback lifecycle and other applicable evidence with its original timestamps. A component, SQL or API pass supplies only its declared layer. Do not restart a covered case from an older note or expand the accepted scope without its actual decision.
2. **Close demonstrated gaps.** Exercise the missing required cases and repair only reproduced defects, preserving original-operation identity/recovery, current denial and accepted visibility rules. Use focused checks during edits and reuse applicable unchanged evidence. A new helper or repeated passing suite needs a named missing case, changed input, failure or unresolved concern. Keep blocked requirements open and continue ready independent work.
3. **Review the connected Owner day.** After the required local coverage gaps are closed, perform the MP-B01 connected review across Today, Calendar, Players/profile, Attendance and safe return/local sync, using the batch's 18-player acceptance case in EN/AR. Consolidate relevant verification and affected factual captures for the candidate's exact source. Apply the existing browser-session and identity rules to signed-in proof; keep fixture/component, local SQL/API, connected browser, hosted and installed-device results distinct. If a required connected case cannot run, record its exact blocker and continue independent preparation without claiming that case passed.
4. **Prepare the reviewable Git checkpoint.** Review the selected diff and validation under existing Git authority, keeping earlier unrelated uncommitted work intact. Prepare a scoped coherent candidate with exact included work, remaining gates and evidence; do not bulk-stage the working tree. MP-Q01 A/B/C still gate dependent new-Player fields/edit/archive/import work. Local results alone do not close MP-B01, hosted/device checks or Owner acceptance. Promotions remain Owner-only.

Capture dependency tooling is conditional supporting work: improve it only when a named conservative guard causes demonstrated redundant reruns. Verify required invalidations with meaningful freshness/negative checks before relying on narrower reuse; retain the freshness protection and continue independent batch work. This is not a separate optimization phase or permission to bypass a guard.

This 16 November routing clarification changes documentation only. It adds an explicit transition from the coverage audit to the connected review and scoped Git candidate; all completed checkpoint results and their limits above remain unchanged.

## Later coverage checkpoint

The [WD-71 finite audit and remaining cases](mp-b01-wd71-coverage-2026-11-16.md) records the subsequent four-component repairs, actual helper invocation correction, preparation cancellation matrices, retained-source audit and connected subset. Its explicit residual create/roster and connected 18-player cases supersede broad “continue another save” notes. This original published-state feedback proof remains unchanged.
