# Programs, dated sessions, capacity and trainer assignment

Requirements: AO-021–034. Decisions: D-006 and D-012. Scheduling is a dated operational contract, not a collection of loosely related calendar edits.

## Core records

A program defines sport, branch, eligibility, default capacity and recurrence template. A recurrence template expresses local weekdays and wall-clock times in an IANA timezone, with start/end dates and an explicit daylight-saving policy. A dated session has its own ID, start/end instants, local timezone, status, capacity and version. Session rosters and trainer assignments refer to the dated session or a documented effective recurring assignment.

States: program draft → active → archived; session draft → scheduled → in progress → completed, or cancelled. Cancellation differs from deletion. Completed and attended history is immutable except through a controlled correction. A trainer assigned only to a dated extra session must still see it in their next-session query.

## Create or change a program

The permitted actor selects branch, sport, recurring weekdays, local times, date range, capacity and initial trainer assignments. Validate end after start, timezone, branch eligibility, supported overnight duration and conflicts. Show a preview of dated sessions and exceptions before commit.

The operation records the exact requested recurrence and a payload hash. Within an atomic transaction or explicit recoverable generation job, create the program and required session range. A partial response is not a completed schedule. If generation is asynchronous, show counts expected/created/failed and block publishing an incomplete range until reconciled.

Editing weekdays, start/end dates, time, trainer or capacity must specify “this session,” “this and future sessions,” or the supported alternative. Show affected dates, booked players, attendance and financial implications. A field submitted but ignored is a defect; reject unsupported edits explicitly. Omitted capacity means retain the existing value, never reset to an arbitrary default.

## Rosters and capacity

Enrollment records player, program/session, effective interval, status, source and actor. Validate academy equality for all referenced records, current player eligibility and capacity under a transaction that prevents concurrent overbooking. A displayed availability count is advisory until the enrollment commits.

Recurring enrollment must evaluate each affected dated session. Define whether exceptions are allowed and report exact conflicts rather than silently skipping full sessions. Extra sessions explicitly select their roster source: copied snapshot, current recurring roster or custom roster. The command and database operation must support the same option.

If enrollment creates a financial consequence, use a durable business event and a visible billing state. “Roster saved; billing pending” is a valid intermediate state only when the product defines and can repair it. A retry cannot create duplicate dues. Do not show a single success toast while leaving an untracked financial failure.

## Conflict rules

Check active trainer assignments, branch/location resource occupancy, player overlap and any approved rest/travel constraints. Compare full instants, including sessions crossing midnight; comparing weekday and time text alone is insufficient. Ignore archived programs and inactive roster intervals where policy says they no longer occupy the slot.

If the conflict lookup fails, stop the scheduling mutation and present an unavailable validation state. An exception requires an explicit permission, reason, affected conflict IDs and audit record. D-003 must identify who can grant exceptions; merely showing an exception button is not an authorization policy.

Use half-open intervals `[start, end)` unless the business approves buffer periods. Adjacent sessions do not overlap under that convention. Daylight-saving ambiguous/nonexistent local times require a displayed choice or rejected schedule, never an invisible one-hour shift.

## Reschedule, cancel and replace trainers

1. Read current session version and affected roster, attendance and assignments.
2. Validate edit authority, lifecycle, conflicts and any financial/notification consequence.
3. Commit the session change, assignment changes, audit event and outbox events as one logical operation.
4. Return the new version and exact changed fields. A duplicate idempotency key returns the original outcome.
5. Deliver notifications asynchronously with per-recipient receipts. Delivery failure does not undo a committed schedule, and the UI distinguishes those states.

Replacing an assignment must not delete the old assignment before knowing the replacement can commit. Shortening a program's end date cancels or detaches eligible future sessions through policy; it cannot erase sessions with attendance or posted financial history. A cancellation fee, credit or makeup entitlement is governed by D-006, not invented by the scheduler.

## Acceptance

Test concurrent last-seat enrollment, recurring capacity, custom extra-session roster, dated-only trainer assignment, overnight conflict, stale edit version, failed conflict query, duplicate reschedule, partial assignment replacement and end-date changes with attended history. Verify the calendar, trainer home, guardian schedule, notifications and audit agree after each committed change. A next-session card must use a valid timestamp and locale formatting; empty, cancelled and invalid-source states are explicit.

## Accepted I3e subset —28 October2026

The [one-session policy](../06-delivery/i3e-session-changes-decisions.md) and connected design are approved. Current Owner may move/cancel one future fictional occurrence after withdrawal, preserving original identity, exact plan/roster and history. A separate effective date supports discovery outside the original period. Canceled dates retain history but cease conflict occupancy and are excluded from newly prepared planning/publication scope. Older captured reviews become stale. No reinstatement, makeup, family notification, fee or attendance authority is inferred. [Current implementation evidence](../07-handoff/i3e-session-changes-implementation.md).
