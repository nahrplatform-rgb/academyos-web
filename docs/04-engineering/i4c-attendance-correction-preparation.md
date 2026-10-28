# I4c — request/review trust and integrity preparation

28October2026. **Planning only; policy and connected-design approvals pending.** [Recommendation/PYSA evidence](../06-delivery/i4c-attendance-correction-decisions.md), [security gate](journey-security-review.md). J13-A01/A02/A03 / IMP-J13-A01 / S29 / L08 / SEC-J13 / partial AO-037/038 and AT-037/038. No app/schema/provider/access changes from this packet.

## Current reusable boundaries

Inspect `attendance.ts`, `/api/attendance`, `attendance-workspace.tsx`, the signed gateway and migration20261028024556 before implementation. Existing `a10_target`, Owner/Trainer predicates, server window, immutable publication roster, stable original occurrence key, canonical mark/version/history and `t4_lock` protect the session. `a10_mark_v1` permits only Owner corrections and atomically writes mark/history/audit/receipt, including a final window check; it does not implement requests/decisions. Reuse that contract without silently calling a separate transaction and then marking a request approved. A future internal helper must retain authoritative current actor/target checks and stay non-callable by clients.

New trust path: signed current Trainer → current active exact appointment/assignment + published occurrence/rostered player + saved mark/version → immutable request snapshot. Review: current Owner in target academy + pending current request version + still-valid original requester appointment revision + unchanged mark/version + server deadline → atomic decision/result/history/audit/receipt. Guardian stays on the existing minimal family read; no request/reason fields join that projection. No generic manager capability, privileged-key bypass or client role input.

A request binds original assignment/invitation revision so end/re-enable cannot revive it. Lifecycle writers, direct Owner correction and review acquire compatible existing academy/operation/row locks in a documented order. Check deadline at final commit as existing capture does. If outcome becomes unknown, both request submission and review reconcile only the original actor-scoped operation, under current authority; a cancellation fence prevents a delayed original submit racing a replacement. Private form drafts/reasons must not survive subject/academy changes or enter storage/logs.

## Bounded retrieval and freshness proposal

- Owner queue: one academy, one explicit state/filter,25 rows plus sentinel with stable `(created_at,id)` cursor; no whole-roster/history fan-out. Show selected request's session/player and before/proposed/current statuses, validity/deadline and required review context only on selection.
- Trainer: own requests for one currently authorized occurrence,25 plus sentinel. Current membership/assignment on every request/retry/reconcile; no old appointment role cache.
- Selected detail: one request plus current canonical mark/version and minimal actor-role/time decision history,20 events plus sentinel on demand. Text inputs≤500 characters each; every response≤32KiB uncompressed with byte-aware trimming. Reasons never enter broad queue rows or Guardian payloads.
- Current read is private/no-store. Abort obsolete reads; scope state by subject/academy/assignment/session/request. Distinguish loading, no requests, failed retrieval, expired/stale/ineligible and denied. Opening, focus/reconnect, filter/selection and own confirmed writes revalidate. No routine polling or permanent manual-refresh requirement; a submitted request is never shown as a changed mark.

## Required correctness, security and recovery cases

Two academies and branches; foreign request/player/event/operation substitution; wrong role, self-review, Guardian request/history denial; revoked Owner; ended/suspended/re-enabled original Trainer; role-union attempt. Rejection leaves mark/version/history unchanged. Approval changes decision/mark/history once. An absent mark is not a requestable Absent default.

Inject failures at request/history/audit/receipt and approval/mark writes: all or none, never approved-without-attendance or zero-row success. Exercise two approvals, approve versus reject, approval versus direct correction, duplicate creation, request creation versus ending, request approval versus assignment ending, window closure during commit and original-operation fence/retry both lock orders. Stale/expired/ineligible outcomes preserve original request and canonical history. Late browser responses/context changes cannot revive private data or show false success. Preserve unrelated Guardian links and their minimal current-mark view.

Local adapters demonstrate presentation/request behavior only; use actual disposable SQL transactions for database outcomes and controlled concurrency. Hosted test grants remain separately gated; do not restore existing ended accounts just to obtain evidence. No real family/staff data, new notifications, uploads, finance or retention/deletion rule. Independent human/security review remains required.

## Measurable budgets and rollout proposal

Declared synthetic workload:1,000 retained requests across two academies,50-player session roster and25-event request history, with skew toward one academy. Query p95≤300ms; explicit submit/review authenticated HTTP p95≤1500ms under a declared stable network; useful initial queue/register≤2.5s on a declared phone/network; each response≤32KiB. Record sample counts/cold versus warm, query plans/rows/bytes, write/lock retries, audit/history growth and provider/cost limits. No measurements exist for I4c yet, and local SQL latency cannot establish HTTP/device/load/cost acceptance.

After policy and design approval, any additive schema/index/RPC/allowlist extension requires migration review, fresh verified backup/local restore rehearsal, unchanged-domain pre/post fingerprints and bounded closed staging rollout. Keep accepted manual/Owner correction/Guardian behavior, all prior evidence and existing independent/API/device/load/I4a replacement gates. Repair forward with side effects disabled where appropriate; do not rewrite applied migrations or delete requests/history to pass tests.
