# I3e — one future session change: decision and preservation packet

28 October2026. **Recommendation awaiting Owner policy decision.** Authorization to continue preparation does not accept the new cancellation/rescheduling rules. Prior I3a–I3d working approvals remain valid. This document changes no app, schema, provider or account.

## Connected outcome

Owner opens an existing dated session from Training → chooses Move this date or Cancel this date → reviews exact before/after time, Trainer, capacity, roster and visibility → confirms one atomic change → reopens the retained record/history. A moved session remains private until the existing explicit publication review. Cancellation is a retained operating state, not deletion. This is the next operational prerequisite before attendance, not a claim that all scheduling is finished.

## Recommended bounded policy

- Current Academy Owner only, existing initial branch/sport, fictional staging data. No Manager/Trainer scheduling authority added.
- Only a session whose current start is future may move or cancel. New start must also be future. Published sessions must first be withdrawn through the accepted operation. No mutation of started/historical dates.
- Move one occurrence to a chosen calendar date and same-day start/end in its saved IANA timezone. Recurrence and all other occurrences remain unchanged. Reject invalid, missing/ambiguous DST times and overnight inputs under the existing bounded policy. A single move may be outside the original recurrence range; the program's date-range definition remains unchanged and the moved occurrence must still be discoverable by its effective date.
- Preserve the session's stable identity/original occurrence, Trainer, capacity and exact saved roster. An unassigned private date may move; an assigned Trainer must still be eligible at commit. Validate same-academy Trainer/player UTC overlap and current capacity; any failed validation or dependency failure saves nothing. No silent substitution, roster reset or merge into another occurrence. A same-program destination date already occupied by another active occurrence is rejected in this slice.
- Cancel requires a reason; preserve date, plan/roster, snapshots and history. The canceled occurrence cannot publish or count as active conflict occupancy. It remains visible to the Owner with a clear canceled state. No automatic makeup or replacement date. Reinstatement is not included in this slice; a later reviewed action must revalidate conflicts before restoring occupancy.
- A moved occurrence is private; a canceled occurrence is unavailable to Trainers. No implicit republishing, notifications, family visibility, attendance, fees, credits, refunds, makeup entitlement or compensation changes. D-006 financial effects remain unresolved; synthetic no-financial-record scope does not settle them.
- Review binds expected schedule/plan/publication state and exact payload. Commit, audit, retained history and operation receipt are atomic/idempotent. Unknown reply reconciles/fences the original before a replacement operation. A failed write preserves the previous valid session and assignment/roster.

## Why this choice

The existing slice already separates whole-program planning and individual-date exceptions. One-date move/cancel adds the daily operating behavior PYSA makes useful without combining recurrence edits, bulk cancellation, enrollment inheritance, extra sessions and attendance policy into one release. No new arbitrary program-duration limit. No reset of earlier approvals.

## PYSA reference — inspected read-only

Source37d8901c under `/Users/moamenghareeb/Pro Youth Football Academy`. `platform-description/PYSA-platform-brief-for-another-AI.md`, Programs/sessions/calendar section, distinguishes recurring programs from individual occurrences, linked moves/makeup, roster choice, notes and downstream effects. `pysa-platform/components/manager/schedule/session-instance-operations.tsx` exposes occurrence assignments, reschedule/makeup, exact date/time inputs and history. `pysa-platform/actions/scheduling.ts` linked-session path around1320–1530 reads source/effective roster/Trainers, checks conflicts, links original/replacement and writes audit/notification effects. `lib/db/scheduling.ts:updateSessionInstanceDB` around1122 is a direct instance update; its existence is not atomic linked-operation proof.

Retain: occurrence-level entry, before/after context, stable original/replacement relationship, exact affected roster and audit. Do not copy: default makeup date+7days, broad Manager authority, billing defaults, direct client data assumptions or automatic notices. EV-0089 records mocked SDK assignment DELETE/INSERT/header failure partial states; EV-0095 records dated-only Trainer discovery omission. Preserve current AcademyOS atomicity and direct dated discovery instead. These are local source/historical audit observations, not new live PYSA verification. PYSA was not changed; no credentials/private data imported.

## Current AcademyOS constraints and trace

Existing training_dates identity is `(program_id,local_date)`; date plans/rosters and immutable publication events reference that identity. Moving the key or delete/reinsert would endanger references/history. Implementation must preserve logical identity and distinguish original occurrence from effective scheduled date/instants; choose the smallest compatible additive model after design review. Reads, conflict scans, Owner dates, q6/r7 expected versions and s8 publication/Trainer discovery all require explicit integration tests. Updating only displayed date text is unacceptable.

J09/J10/J11; proposed subdivision J11-MOVE/CANCEL (not canonical IDs); S23/S24/S26/S27; L04/L07; SEC-J09/SEC-J11; scoped AO-021/022/027/028/029/030/031/032/033, especially retry-safe change/history/occupancy. No whole AO/AT closure inferred. [Workflow](../02-workflows/scheduling-and-rosters.md), [preservation ledger](../03-design/pysa-behavior-preservation.md), [engineering preparation](../04-engineering/i3e-session-changes-preparation.md).

Next gate: Owner policy choice → connected EN/AR phone/desktop design and failure review → implementation. Extra/custom sessions, program-wide recurrence edits, cancellation restoration, family schedule and attendance follow separately; they are retained scope, not silently removed.
