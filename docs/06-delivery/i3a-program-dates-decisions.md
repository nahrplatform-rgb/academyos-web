# I3a — program and dated-session drafts: recommendation

25 October 2026. Prepared after Owner approved the corrected implemented workflow presentation and requested continuation. **Recommendations only; no new scheduling policy accepted yet.** I3a is the first bounded outcome in I3, followed by assignment/enrollment and actual Trainer Today, then I4 attendance. Existing People/authority gates remain open; this does not retire them.

## Plain-language outcome

The current Academy Owner names a fictional training program in the academy's already saved branch and sport, chooses weekdays, a start/end date and local start/end times, sees every resulting date in the branch's saved timezone, then saves exactly that preview as a draft. Reopening shows the persisted program and dates. No player or trainer is assigned, and no family sees the draft. “Draft saved” never means a published or operational schedule.

The next connected I3 slice will add deliberately reviewed Trainer assignment and player enrollment/capacity, then the Trainer's real upcoming sessions. This slice establishes actual dated records and safe generation rather than a decorative calendar. It does not mark the broad scheduling requirements complete.

## Recommended rules needing Owner acceptance

| Question | Recommendation for this bounded slice | Reason / remaining scope |
|---|---|---|
| Who can create/read these drafts? | Current active Academy Owner, in their academy's existing initial branch/sport after completed setup | No Platform-only tenant access, Manager delegation, Trainer or Guardian draft access. D-003 broader powers remain open. |
| Recurrence | Select explicit weekdays and one same-day local start/end time within explicit inclusive start/end dates | No guessed frequency. Date preview lists all results; no silently skipped dates. One-off sessions, overnight schedules and variable times follow later. |
| Generation bounds | At most28 calendar days and20 resulting sessions per initial save; if exceeded, reject with explanation before write | Initial engineering work/transaction bound, not a permanent academy plan limit. Wider ranges require explicit bounded generation/recovery design. |
| Timezone | Use the branch's saved IANA timezone; show it beside input and each preview. Persist the exact timezone and UTC instants with local values | Never use browser timezone implicitly. Save must reject stale branch/timezone versions and require a new preview. A later timezone edit cannot reinterpret existing dates. |
| Daylight-saving/invalid dates | Reject nonexistent or ambiguous local times with the affected date; require a different time in this slice | No invisible time shifts or guessed DST offset. Explicit offset choice and overnight duration policies remain later work. End must be after start. |
| Result | Save one program and the complete reviewed date set atomically as drafts; no publish, roster, Trainer assignment, invitations, family view, attendance, billing, payroll or notifications | No charge or operational availability inferred. Draft-only overlap is informational; resource/trainer/player conflict authority is not invented before those records exist. Publication remains blocked until the next policy is accepted and validation implemented. |
| Changes after save | Initial create/read only; no reschedule/cancel/delete/archive/edit command in I3a | A later versioned edit must preview its full affected scope and preserve historical sessions. AO-021/022/030/032/033 remain open. Input drafts before save remain editable. |
| Duplicate submission | Same operation+payload returns one saved draft; changed payload under same operation denied | Original-operation reconciliation/cancellation fences, no blind replacement. Names do not identify or merge programs; a later deliberate separate creation is a distinct draft. |
| Data/release | Fictional program names in existing synthetic staging only | No new account, grant, real child/staff/customer data or production launch. |

## Traceability and acceptance boundary

Primary J09-A01 / IMP-J09-A01; proposed additive subdivision I3a-create-preview-save-read. Existing S22/S23/S25 and loading L07 (L04 future operations home not implemented). SEC-J09. AO-021/AT-021, AO-022/AT-022 and AO-029/AT-029 are scoped related requirements: this first create/read draft does not implement recurrence edits, historical range reconciliation or occupied-resource conflict validation. Cross-cutting identity/atomicity/recovery requirements apply through existing contracts. J10/J11, AO-023–028/030–034 and financial/attendance authority remain future dependent work.

Acceptance for I3a: completed setup/current Owner only; correct branch/sport/timezone; exact complete preview including weekday/range validation; DST rejection; edit input invalidates preview; one atomic save; reopened persisted draft; no automatic publication/assignment/delivery; two-academy/role/revoked direct access denied; lost response and concurrent exact operation commit once; changed payload reuse denied; stale branch/timezone requires fresh preview; read failure differs from empty; unknown operation has one Check original operation action; EN/AR phone/desktop and reference workflow foundation retained.

## Status

Assessment and recommendation prepared. Policy decision pending; connected design review pending; product source/schema/provider changes not started. After policy decision, prepare and demonstrate the connected draft → date preview → exact review → save → reopen/recovery prototype before dependent implementation. No actual invitations or grants are needed for this draft-only slice.
