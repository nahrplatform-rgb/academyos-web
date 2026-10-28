# I4b — Guardian training and attendance view

28 October 2026. **Recommendation for Owner decision; not accepted policy, design approval or implementation.** Next bounded outcome in the [app plan](app-implementation-plan.md), after [accepted working I4a attendance](../07-handoff/i4a-attendance-implementation.md). This completes the first synthetic Owner → Trainer → Guardian operating chain described in the [SaaS blueprint](../01-product/saas-operating-blueprint.md). It does not close all of I4 or retire QR, correction requests, offline or other family requirements.

## Outcome and authority

J15 / IMP-J15-A01, S46 and selected-session contextual detail; L09, SEC-J15. AO-014/AT-014, AO-015/AT-015 and AO-016/AT-016 are scoped associations, not full requirement completion. L10 player/progress, child login, evaluation publication, payer/consent and real-family evidence remain outside this slice. D-004/D-015 only the proposed synthetic visibility extension below; real-world relationship evidence, ages and retention remain unresolved.

The Guardian currently has only the accepted I2b linked-player name/branch projection. Existing source (`guardians.ts`, `guardian-workspace.tsx`, `g3_links_v1`) enforces current membership and active player-level links. I3d provides published occurrence/roster snapshots; I4a provides canonical marks/history and attendance-protected dates. These are reusable authoritative sources, but they do not yet authorize family schedule/attendance reads. Hidden controls or a Guardian role label cannot authorize this extension.

## Recommended choices — all awaiting Owner decision

| Choice | Recommendation | Consequence |
|---|---|---|
| Who may see it? | Only the current verified Guardian with an accepted, active explicit link to that player and active membership in the same academy. | Recheck the exact relationship on every list, detail and retry. No automatic siblings, whole-branch access, Platform Owner access or role union from another academy. |
| Which sessions? | Only currently published actual occurrences whose published roster snapshot contains that linked player. | No private draft/program-wide visibility, inferred weekly recurrence or another player's dates. Use effective date/time, original stable occurrence identity and branch timezone. |
| Which fields? | That player's name/branch plus session title, sport, effective date/time/timezone, and their own current Present/Absent/Unmarked status. Show a correction indicator and last recorded update time where applicable. | No other roster names/counts, staff/private contact details, internal actor identifiers, correction reasons or audit history. No percentage whose denominator is undefined. |
| Earlier dates? | While the current link is active, allow browsing retained published sessions and that player's attendance **including sessions before this link was accepted**. | This historical-access choice requires explicit approval. It creates no new retention/deletion promise. Alternative: show only sessions from link acceptance onward, which hides earlier records from newly appointed Guardians. |
| Updated attendance | Reflect the current canonical mark, including Owner corrections; Unmarked never means Absent. | Read-only. No Guardian marking, approval, internal correction request, fees, notifications, download or export in this slice. |
| Withdrawal or ending access | A withdrawn session disappears from the current authorized schedule and its selected view becomes unavailable on the next read. Ending/suspending the link or membership denies the next request and clears private state. | No cached prior-child view after denial; no implicit cancellation notification/history feature. I4a protects attended published occurrences from withdrawal. Wider family change notices remain visible future scope. |
| Existing grants | Policy approval authorizes connected design preparation only. Existing name/branch appointments do not silently become test authorization for additional private fields. | No new endpoint rollout, link restoration, invitation, email or account grant from this document. Any hosted recipient test or access expansion requires its separately scoped explicit authorization. Ended links remain ended. |

Recommend the retained-history option because a newly approved Guardian may need the child's earlier academy record. If the Owner selects the since-acceptance alternative, the connected design and authoritative queries must implement that lower bound explicitly; do not infer a middle rule.

## Connected design to prepare after policy approval

Guardian workspace → active linked-player selector → recognizable next actual published session → period list → selected session and own attendance → change period/child → return to the same context. Keep list/calendar connections from PYSA where each control can be functional in the designed slice; never display a decorative calendar or assume one session per day. EN/AR and phone roster/detail/Back follow the accepted shared foundation, while the Guardian sees a reading experience rather than Owner or Trainer controls.

Show loading separately for links and selected player; a true empty schedule differs from failed retrieval. Include no active link, no published sessions, Unmarked, corrected mark, multiple same-day sessions, moved effective date, withdrawn selection, wrong child/academy, ended link, failed period/details request, focus/reconnect refresh and late response after child/account change. Pending reads must not briefly show the previous child's data. No login, persistence or provider success is inferred from a design simulation.

The [engineering/security preparation](../04-engineering/i4b-guardian-training-preparation.md) defines bounded reads, freshness, tests and measurable targets. A separate connected-design review precedes dependent implementation, per the [engineering charter](../00-governance/engineering-charter.md).

## PYSA reference inspected — read-only

Reference source `37d8901ca1cde805c126f6f3ac83d996ece953a0` under `/Users/moamenghareeb/Pro Youth Football Academy/pysa-platform`; no PYSA changes, real data or live behavior tested.

- `platform-description/PYSA-current-surface-reference.md` lists Guardian home/schedule/attendance paths. Source presence is not hosted acceptance.
- `app/(guardian)/guardian/schedule/page.tsx` and `components/guardian/guardian-schedule-client.tsx`: selected child, period/list/calendar and a late-response cleanup flag. Preserve the connected child/period context and explicit error state. List mode passes undefined date bounds; AcademyOS must bound every request. Reuse workflow lessons, not schema/code/permission assumptions.
- `app/(guardian)/guardian/attendance/page.tsx`: selected child/month, calendar-to-log navigation and status labels. Its `logs.find` chooses one log per day, which can hide multiple sessions. The effect leaves previous logs/stats on an error and has no obsolete-response fence; AcademyOS must clear or scope data correctly. These are source observations, not a claim of a live leak.
- `app/(guardian)/guardian/actions.ts`, `getGuardianSchedule` and `getGuardianAttendance`: explicit current link lookup is useful, but the attendance projection includes override reason, capture method and actor first name, and all-time log-based statistics. Do not import these fields or undefined denominators into the narrower approved AcademyOS projection.
- Audit `engineering-audit/03-evidence/database/EV-0081-schedule-recipient-authority.md`: helper-shaped audience queries can retain soft-unlinked Guardians; synthetic action and disposable SQL evidence have separate limits. Recheck current relationship and target academy at the final read boundary. This does not authorize notifications or establish a hosted PYSA exploit.
