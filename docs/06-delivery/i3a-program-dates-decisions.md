# I3a — program and dated-session drafts: recommendation

25 October 2026. Prepared after Owner approved the corrected implemented workflow presentation and requested continuation. **Moamen accepted this bounded draft-program policy for design preparation on25 October2026.** I3a is the first bounded outcome in I3, followed by assignment/enrollment and actual Trainer Today, then I4 attendance. Existing People/authority gates remain open; this does not retire them.

## Plain-language outcome

The current Academy Owner names a fictional training program in the academy's already saved branch and sport, chooses weekdays, a start/end date and a separate local start/end time for each selected weekday, sees every resulting date in the branch's saved timezone, then saves exactly that preview as a draft. Reopening shows the persisted program and dates. No player or trainer is assigned, and no family sees the draft. “Draft saved” never means a published or operational schedule.

The next connected I3 slice will add deliberately reviewed Trainer assignment and player enrollment/capacity, then the Trainer's real upcoming sessions. This slice establishes actual dated records and safe generation rather than a decorative calendar. It does not mark the broad scheduling requirements complete.

## Accepted bounded rules for design preparation

| Question | Recommendation for this bounded slice | Reason / remaining scope |
|---|---|---|
| Who can create/read these drafts? | Current active Academy Owner, in their academy's existing initial branch/sport after completed setup | No Platform-only tenant access, Manager delegation, Trainer or Guardian draft access. D-003 broader powers remain open. |
| Recurrence | Select explicit weekdays with a separate same-day local start/end time per selected weekday, within explicit inclusive start/end dates | Updated by Moamen's direct request on25 October2026: the same program can have different times on different weekdays. Each matching date uses that weekday's times; no guessed frequency or silently skipped dates. Individual-date exceptions, one-off sessions, overnight schedules and multiple sessions per weekday remain separate scope. |
| Program period and work bounds | Explicit full start/end period; separate bounded preview/generation windows, rather than a28-day/20-date program cap | Moamen agreed to this direction on25 October2026 after challenging the initial limit. Prototype uses28-day windows (at most28 dates with one session per selected weekday). Exact production duration/input limits and resumable generation design require implementation review; no unlimited-resource promise. |
| Timezone | Use the branch's saved IANA timezone; show it beside input and each preview. Persist the exact timezone and UTC instants with local values | Never use browser timezone implicitly. Save must reject stale branch/timezone versions and require a new preview. A later timezone edit cannot reinterpret existing dates. |
| Daylight-saving/invalid dates | Reject nonexistent or ambiguous local times with the affected date; require a different time in this slice | No invisible time shifts or guessed DST offset. Explicit offset choice and overnight duration policies remain later work. End must be after start. |
| Result | Save one logical draft program and its complete reviewed date set with bounded recoverable work; do not expose a partially prepared result as ready; no publish, roster, Trainer assignment, invitations, family view, attendance, billing, payroll or notifications | No charge or operational availability inferred. Draft-only overlap is informational; resource/trainer/player conflict authority is not invented before those records exist. Publication remains blocked until the next policy is accepted and validation implemented. |
| Changes after save | Initial create/read only; no reschedule/cancel/delete/archive/edit command in I3a | A later versioned edit must preview its full affected scope and preserve historical sessions. AO-021/022/030/032/033 remain open. Input drafts before save remain editable. |
| Duplicate submission | Same operation+payload returns one saved draft; changed payload under same operation denied | Original-operation reconciliation/cancellation fences, no blind replacement. Names do not identify or merge programs; a later deliberate separate creation is a distinct draft. |
| Data/release | Fictional program names in existing synthetic staging only | No new account, grant, real child/staff/customer data or production launch. |

## Traceability and acceptance boundary

Primary J09-A01 / IMP-J09-A01; proposed additive subdivision I3a-create-preview-save-read. Existing S22/S23/S25 and loading L07 (L04 future operations home not implemented). SEC-J09. AO-021/AT-021, AO-022/AT-022 and AO-029/AT-029 are scoped related requirements: this first create/read draft does not implement recurrence edits, historical range reconciliation or occupied-resource conflict validation. Cross-cutting identity/atomicity/recovery requirements apply through existing contracts. J10/J11, AO-023–028/030–034 and financial/attendance authority remain future dependent work.

Acceptance for I3a: completed setup/current Owner only; correct branch/sport/timezone; exact complete preview including weekday/range validation; DST rejection; edit input invalidates preview; one logical idempotent save with complete generation before ready; reopened persisted draft; no automatic publication/assignment/delivery; two-academy/role/revoked direct access denied; lost response and concurrent exact operation commit once; changed payload reuse denied; stale branch/timezone requires fresh preview; read failure differs from empty; unknown operation has one Check original operation action; EN/AR phone/desktop and reference workflow foundation retained.

## Status

Policy accepted for design preparation; connected design review pending; product source/schema/provider changes not started. Prepare and demonstrate the connected draft → date preview → exact review → save → reopen/recovery prototype before dependent implementation. No actual invitations or grants are needed for this draft-only slice.

## Owner policy decision

Moamen selected “Accept this draft-program policy”: current Academy Owner only, saved initial branch/sport, explicit weekdays/times and complete preview, 28-day/20-session initial bound, reject overnight/ambiguous or nonexistent local times, atomic draft save/read only and no Trainer/family visibility until later reviewed assignment/enrollment/publication. This authorizes the connected design prototype only. Implementation approval, actual hosted effects, broader scheduling rules and independent security gates remain separate.

## Owner-requested weekday-time amendment — 25 October 2026

During connected design review Moamen said, “i want to make every day for the same program can have different times”. The preview now supports independently editable times for each selected weekday within one program (for example Sunday17:00–18:00 and Tuesday19:00–20:00). This replaces the initial single shared time pair for design preparation. It does not record approval of the connected design or authorize product implementation yet.

The quoted1–28-day validation concerns the inclusive date range, not weekday times. The28-day/20-generated-date initial transaction bound remains; no longer range was requested/accepted by this amendment. Per-date timezone validation, complete preview, atomic draft-only save/read and current Owner authority remain. Individual-date exceptions and subsequent rescheduling have not been designed/accepted here.

## Owner-agreed longer-period direction — 25 October 2026

After Moamen asked why28 days was the maximum, engineering recommended separating program duration from bounded displayed/generated dates. Moamen replied “yes”. This supersedes the initial28-day/20-date whole-program cap and the earlier amendment's statement that this cap remained. It approves the direction for design preparation; the revised connected design and detailed generation/recovery implementation remain pending review.

One program retains its full explicit inclusive period and weekday-specific rules. The prototype calculates the total arithmetically and validates/reads dates in28-day windows, showing no more than28 dated rows per program window. Every window must be checked before confirmation; a later DST error blocks completion. Saving remains a clearly labeled in-memory simulation; it is not evidence of server generation or a durable job. No assignments, publication, real data or new access is introduced. No annual/monthly commercial duration rule has been invented.

## Connected-design approval — 26 October 2026

Moamen explicitly selected “Approve completed draft-program design for implementation”: full-period Owner-only drafts, weekday-specific times, bounded reviewed date windows, preparation progress, pause/reopen/resume, failure/reconciliation and ready-only saved dates. This supersedes pending connected-design status above for this bounded slice. It authorizes product implementation, not assignments, publication, access grants, real data or production launch. Working-feature acceptance, hosted verification and independent security review remain separate.

## Approved full-experience review change —29October2026

Moamen approved the full connected Charcoal proposal8e0b667 for implementation. Human page-by-page date inspection is replaced by a recurring weekly summary, complete automatic authoritative checks and mandatory resolution of blocking exceptions. Every date stays inspectable. The client still carries the complete definition/context and each signed predecessor receipt; confirmation requires all windows and the matching full count. Original creation/preparation/finalization, private status, timezone/DST rejection and interrupted-operation policies are unchanged. This supersedes earlier manual-inspection presentation requirements only; broader scheduling/visibility rules remain governed by their later accepted decisions.
