# I3a — long-program preparation and recovery design

26 October 2026. Authorized outcome: finish the connected design for a single Owner-only draft program across a full explicit period, with weekday-specific times and bounded date windows. Design preparation only; this is not database implementation or acceptance. J09-A01 / IMP-J09-A01; S22/S23/S25; related AO-021/022/029 and their AT cases are partial mappings. L07; SEC-J09. Existing identity/access, notification, financial and publication boundaries do not expand.

## Entry, authority and result

Current Academy Owner, completed initial branch/sport/timezone setup, fictional program only. Details → weekday times → all date windows → exact review → request recorded → preparation → final completeness check → draft ready. Trainer assignment, player enrollment, capacity, operational publication and family/Trainer schedule visibility remain later work. The full program keeps one identity and one definition revision throughout preparation/recovery.

[Policy amendments](i3a-program-dates-decisions.md) record Owner-requested weekday-specific times and agreement to longer periods. The28-day whole-program cap and20-total-date cap are superseded;28 days now bounds a date window. [Reference review](../03-design/pysa-scheduling-reference-review.md) preserves PYSA's useful program/date connection and its source/audit limits. PYSA `actions/scheduling.ts:createSession` and `lib/db/scheduling.ts:createSessionDB` separate creation/generation/assignment; historical EV-0088 documents partial linked writes and retry hazards with synthetic evidence. Those paths motivate explicit preparation/identity; they do not supply AcademyOS permission or persistence code. PYSA remains unchanged.

## What each state means

| State | User sees / available action | Meaning and next transition |
|---|---|---|
| Preview incomplete | Count, dated window range, weekday-specific times; Previous/Next; confirmation disabled | Every window must validate; later DST ambiguity is not silently skipped. Changing input/context invalidates the reviewed manifest. |
| Reviewed | Full period, complete date count, weekday rules, timezone and exact effect | Save records one intent; no assignments or publication. |
| Request pending | Awaiting confirmation; repeated submission/navigation disabled | No acknowledgement or completion is inferred. Original operation identity remains available for uncertainty. |
| Preparing | Program reference, prepared windows/dates and progress; Pause preparation | Request was recorded; draft is not ready. Prepared chunks belong to this same revision. Progress uses actual simulated chunk counters, no invented ETA. |
| Paused | Same reference and completed counts; Resume original program or Back to programs | Keep completed work; no replacement program. Directory records paused state and can reopen it. Partial dates do not appear as ready draft dates. |
| Preparation failed | Same reference, retained progress; Retry original preparation | A failed window is retried on the original record. Previously completed dates must not duplicate or disappear. |
| Outcome unknown | Check original operation; no replacement/save | Reconciliation may find no committed request, incomplete preparation or ready result. Finding a record alone never means ready. |
| Original found, incomplete | Original program found; incomplete counts; Resume | Reconcile first, then continue the same work. Do not label the result saved/ready. |
| Finalizing | All windows prepared; checking completion; no ready badge yet | Completeness, unique dates and current context/authority must pass before ready. A failure here remains retryable and not ready, even at100% window progress. |
| Draft ready | Saved draft detail and paged dates; program directory shows ready | Only this state exposes prepared rows as saved draft dates. Still Owner-only and unpublished. |
| Confirmed ready / follow-up read failed | Draft saved; details unavailable; Retry loading draft | Read retry only; do not repeat creation or restart generation. |
| Current access unavailable | Generic denial, no program/rows/progress/reference; no Resume | Current server authority is required at every operation. No account/membership restoration is implied. |

Pause is not cancellation, deletion or undo. It preserves the original record and history. Editing a previously saved/preparing program, abandoning/deleting it, transfers and restoration remain outside this create/read slice; they require separate operations/contracts. Design-review scenario reset/reload clears local simulation only and is explicitly outside product controls.

## Phone, desktop and language

Reuse compact-blue shell, WorkspacePanes and native inputs/buttons/progress. Desktop keeps central source task plus contextual preparation pane; medium/phone shows one selected task and a named Back to programs. Directory first, original record reopen, one resume/retry action, visible state labels and no fake empty success. EN/AR retain current draft/rules/reference/progress across language change when the operation is not awaiting a response. Pending/unknown work cannot be escaped through language/navigation to create a replacement. Paused/failed panes restore focus through the existing pane heading and live directory opener patterns.

## Authoritative implementation proposal — not implemented

Persist definition/revision, preparation state, expected totals, completed-window cursor, count and original operation receipt. Each bounded transition needs current Owner/tenant/branch/context checks, expected version, idempotent fingerprint and atomic progress/occurrence/audit update. Resume starts at authoritative committed progress, not caller counters or UI state. Never treat the client prototype's in-memory records or timers as a worker/generation algorithm.

Prefer evaluating the existing authenticated request/gateway infrastructure for a sequential bounded request pump while the Owner view is open, with explicit pause/reopen/resume, before adding a background worker/service. Either approach must survive closed tabs through durable state. Do not choose a provider, new paid service, persistent background grant or job scope from a design preview. Finalization verifies the complete server-owned generation manifest/count and current authority/context; do not expose partial materialization as ready. Explicitly specify idle/failed versus actively leased work, stale-lease recovery and when a request can be safely retried before implementation.

No unbounded period-generation transaction, full-range JSON/DOM table, polling loop, per-date request or client-derived UTC authority. Each date window is up to28 calendar days/28 occurrences under the one-per-selected-weekday rule. Directory remains25 rows plus sentinel. Progress is part of the original operation/status projection; request coalescing, context cancellation and no-store still apply. Finalize/status/preview/prepare/resume must use the same current-authority/rate boundary as create/read; app-only rate limiting is insufficient. No raw recurrence/name/identity payload goes into logs.

The actual supported date-input horizon, request/job quota and statement/work budgets remain implementation engineering gates; the permissive local date control is not an unlimited production service promise. Existing p95/read/response-size budgets in the [engineering packet](../04-engineering/i3a-program-dates-preparation.md) are proposed targets, not passed measurements for this revised contract. Measure generation throughput separately from first acknowledgement and first useful view; no fake ETA or zero-cost claim.

## Acceptance cases

- A92-day example with40 dates checks4 windows and preserves weekday-specific times through ready/reopen.
- Acknowledgement alone never says saved/ready; incomplete/finalizing records have no ready date projection.
- Pause after first window, return to directory, reopen and resume the same identity; one final program and exact date count.
- Failed chunk and final-check failure preserve earlier committed work; retry never duplicates or replaces.
- Lost preparation reply reconciles incomplete original and offers resume; lost final reply recovers ready original; pre-send no-commit fences original before replacement.
- Context/time changes invalidate previous preview; ambiguous/nonexistent time in any window blocks completion.
- Revoked authority on resume clears private projections; role/tenant/branch/direct API/receipt boundaries remain server/security tests, not inferred from simulated denial.
- EN/AR320/360/926/1440 reflow, keyboard/focus and program/date paging retain context. Physical-device/screen-reader evidence remains separate.
- Product verification must add real transaction rollback, every boundary lock/replay order, concurrent resume/finalize/cancel, stale lease, closed-tab reload and generation-versus-context-revocation races. Preserve history; no account/access changes are authorized by this packet.

## Evidence and remaining gate

[Local design source and evidence](../../design/i3a-program-dates-review/README.md), [test receipt](../../design/i3a-program-dates-review/evidence/verification.json). Tests use synthetic in-memory transport/state, not a database, job queue, actual access revocation or cross-tab durability. Design screenshots and test results must identify the actual revision/server; a successful isolated test is not proof the user's open tab loaded it.

Connected design approval remains pending. Product implementation, migrations, hosted runtime, production launch, owner working-feature acceptance and independent human security review remain separate. This preparation does not retire the earlier completed journeys or open verification gates.

## Connected-design approval — 26 October 2026

Moamen explicitly selected “Approve completed draft-program design for implementation”: full-period Owner-only drafts, weekday-specific times, bounded reviewed date windows, preparation progress, pause/reopen/resume, failure/reconciliation and ready-only saved dates. This supersedes pending connected-design status above for this bounded slice. It authorizes product implementation, not assignments, publication, access grants, real data or production launch. Working-feature acceptance, hosted verification and independent security review remain separate.
