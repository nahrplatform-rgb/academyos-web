# EX-07 Attendance history loading continuity

## Authorized bounded outcome

Continue the approved normal-workspace journey after [d74b027 hosted verification](ex07-fallback-continuity-2026-11-07.md). Trace: IMP-J12-A01; J12-A01–A03; S28; L08; NR03/14/15; WB-08/20/21; WD-69/71. Opening a saved player's View history must load only that inspector content without removing the already checked roster, local search/filter, selection or list position. Current Operations layout and both languages remain. This is an implementation of the accepted continuity standard, with no new business, privacy or offline policy.

## Observed mechanism and intended change

The signed-in c36e87c history sample in the parent receipt showed the roster replaced while the canonical history view checked it. Current `attendance-workspace.tsx` uses one global `busy` flag for history and consequential operations, and the roster render excludes every busy state. `loadHistory` itself calls only the existing bounded history action. The held actual-component baseline reproduced18rows becoming0, removal of the roster node and420px scroll resetting to0, with one history request and no roster reread. Separate that secondary read's presentation while retaining the shared request lock and disabled consequential controls. The new `historyBusy` presentation is set only by the existing history actions; authority/roster checks, commands and unknown outcomes retain their original mask.

| Before | After | Why |
| --- | --- | --- |
| Opening history removes18rows and resets420px scroll to0 | The same18row DOM stays mounted at420px during the held read | Optional detail must preserve the main task |
| Generic whole-task checking message | Loading attendance history in the selected inspector, EN/AR | Explain the actual bounded read |
| Failure could be confused with a whole-register problem | Failed history can retry with roster/choices retained; denied history still removes private data | Keep recovery and authority distinct |

Keep the initial prepared-to-canonical history/correction handoff's authoritative roster read. This batch does not reuse a local mark as write authority, add private history persistence, remove the canonical freshness check or claim that whole handoff is already seamless. Post-save reads, focus rechecks, unknown-original and confirmed-save/read-failure masking remain separate work. Directory freshness must be reproduced before changing it: current People already refreshes its device projection after confirmed registration/recovery.

## Boundaries, budgets and acceptance

Existing no-store `/api/attendance` history action, signed gateway/current membership/tenant checks, pagination, audit, versions, deadlines and original operation IDs are unchanged. No schema/API/provider/worker/storage/key change, new cache, dependency, timer or telemetry. Roster/current-authority reads and unconfirmed writes retain their existing masking. A history denial still removes private roster/details; late results cannot cross account/academy/event unmount. History failure keeps the roster and permits retry. Ordinary history does not clear dirty register choices or create a write.

For the declared 18-player one-page fixture: initial canonical handoff retains its existing one roster read; View history adds exactly one history action and zero roster/write actions. Holding and releasing that response preserves the list DOM, filter/search, selected record and scroll. EN/AR keyboard and phone/desktop keep the existing panels and focus behavior. Unknown save, denied read and failed confirmed-result read assertions remain. Count browser actions/API requests separately from unmeasured hosted SQL/Redis/latency costs; presentation continuity alone is not a measured service saving.

Use existing actual-component and actual-Next/signed-PG tests, including held success, failure/retry and denial, plus existing dirty/unknown/recovery cases. Update source-bound runtime evidence, affected actual captures, factual HTML and validators. Source/local/CI, Owner promotion, hosted verification, acceptance and deferred independent review remain separate. No finding closes globally from this bounded repair.

## Reference, engineering review and delegation

PYSA reference `pysa-platform/docs/technical/SCHEDULING_AND_ATTENDANCE.md` separates attendance history/corrections and current authorization; reference source/audit is read-only and does not prove hosted AcademyOS behavior. Its `actions/attendance.ts:getAttendanceHistory` calls the separately bounded `lib/db/attendance.ts:getMemberAttendanceHistory` and throws read errors. The inspected audit EV-0024 demonstrates historical partial correction writes/races using mocked providers, not live SQL proof; retain AcademyOS atomic canonical writes rather than copying that defect. Its offline timestamp/staleTime choices are not copied. Shift's reviewed durable-baseline/original-recovery mechanisms remain the existing foundation, with no new replica change here. Operations and Emil guidance require optional detail to preserve the main task, prompt specific feedback and no decorative delay.

One explicitly configured gpt-6.1-terra medium helper inventories and extends only the isolated actual-Next regression script; the coordinator owns production logic, separate UI regressions, real-browser/provider work, integration and generated artifacts. Peak helpers one, no nested spawning. Avoid duplicate test runs/PG port contention. Model cost or allowance savings are unmeasured. No new owner decision or promotion authority is inferred.

## Local results and evidence

[Structured receipt](evidence/ex07-attendance-history/receipt.json) records the before/after evidence and source hashes. Actual React production and development each pass existing cases plus held EN/AR1440/390 history, error/retry, denial and preserved dirty choices. Each held read adds1history/0roster/0write. Desktop420px scroll and the same roster node remain; phone center-scroll samples are0 and must not be represented as a nonzero document-scroll proof. Existing Escape/initiating-details focus checks pass. The18-player component fixture uses Trainer controls; actual-Next Owner coverage uses the real signed gateway/canonical PostgreSQL function.

All21actual normal-route cases,8startup and8working-day cases pass. Existing original, deadline, denied account, strict local-save, unknown and confirmed-save/read-failure assertions are retained. Build/type/lint pass. Unchanged key/dispatch/download/workspace-transfer receipt fingerprints pass without redundant fixture execution.16actual-component capture groups and8welcome states are refreshed; factual review now has1205frames/1188transitions across80source files and7891literals. Review-tool/freshness,canonical/execution/PWA joins and generated-prompt checks pass. These checks establish recorded fixture/source freshness,not exhaustive hosted or installed rendering.

The first extended actual-Next run exposed a test-fixture omission: `owner_db.py` did not permit the existing `a10_history_v1` read. Adding that exact read to the isolated whitelist allowed the signed real history call. No product/server permission was broadened or assertion relaxed. The first native-filter locator also required targeting the existing select rather than the full label text. Retain these test corrections separately from the reproduced product masking.

## Status

Design requirement accepted by existing continuity approvals. Baseline staging d74b027 is independently verified for locale/focus and retained marks. The bounded history fix is implemented and locally verified; exact-source CI, new Owner promotion and hosted history proof remain pending. No finding, whole redesign, installed matrix or Owner acceptance is closed. Rollback changes only presentation and restores the known mask; records/keys/originals remain untouched.
