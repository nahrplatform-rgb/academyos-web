# I3b — draft dated-session planning recommendation

27 October 2026. **Owner accepted this narrow policy for design preparation on27 October2026.** Owner requested continuation after accepting I3a working wording/usability. That continuation authorizes assessment and a concrete decision/design packet; it does not settle new scheduling rules. Current implementation remains [I3a](../07-handoff/i3a-program-implementation.md).

## Proposed useful outcome

Owner opens a saved program → selects one saved draft date → sets an explicit capacity → chooses an eligible Trainer and fictional players → reviews the exact changes and conflicts → saves → reopens the same date with persisted assignment/roster/capacity. Different dates in the same program can use different Trainers, players and capacities. Program recurrence and timestamps remain unchanged.

This is the next bounded end-to-end step connecting the existing people and program work. Follow-on publication will make approved dated work useful to Trainers and families under a separately accepted visibility contract. This packet does not claim the whole scheduling product is complete.

## Accepted narrow choices

| Choice | Recommendation | Consequence / alternative |
|---|---|---|
| Actor | Current active Academy Owner only, same academy and saved initial branch | Manager delegation remains unresolved. Platform-only authority cannot plan tenant sessions. |
| Target | One ready I3a draft date per atomic save; select through Programs or Draft dates | No changes to incomplete preparation, recurrence, time, past operational history or another branch. Bulk/recurring enrollment requires a separate affected-date policy; no period-duration cap is added. |
| Trainer | At most one current accepted active Trainer appointed to that same branch; allow an explicitly unassigned draft | Pending, revoked, suspended or ended appointments are ineligible. Multiple Trainers and qualifications are later policy. Changing a session assignment never restores a staff appointment. |
| Players | Existing fictional player records in this academy/branch; explicit add/remove for this selected date | Registration is distinct from enrollment. No guardian/player login authority, eligibility-by-age/level or implied recurring membership is introduced. |
| Capacity | Owner enters a positive whole-number capacity for the selected date; no guessed default | Save requires an explicit value. Reducing below the selected roster is rejected. No overbooking override or automatic removal. Technical integer/body bounds are not commercial capacity rules. |
| Duplicates and concurrency | One active player entry per date; serialize roster count and all changes | A repeated original operation returns its result. Concurrent attempts for the last place cannot both commit; losing operation gets current state for review. |
| Time conflicts | Block same-academy overlaps for the selected Trainer or players across saved draft planning; compare actual UTC half-open intervals | Adjacent intervals are allowed; no rest/travel buffer or conflict override. Another academy's names/data are never exposed; this narrow policy does not promise global cross-academy availability checks. |
| Staff ending after planning | Preserve the historical planning reference but mark Trainer coverage unavailable; current eligibility is rechecked on every planning save and future publication | No silent substitute, automatic new grant or deletion. Owner selects another eligible Trainer. Ending unrelated roles/academies is outside this command. |
| Visibility and effects | Owner-only private draft planning; no Trainer/family projection, invitation, notification, money, consent or attendance effect | Existing Trainer own-name/role/branch policy remains intact. Publication and related access require a later explicit decision/design. No fee rule is inferred from a roster save. |
| Release/data | Fictional staging only | Existing recipient/grant restrictions stay in force. If there is no eligible Trainer, show the truthful empty prerequisite; no fixture membership is seeded or restored. |

The first mutation is deliberately date-scoped. Later batch/recurring application must preview exact affected dates, capacity/conflict exceptions, all-or-none versus partial outcome and resumable job semantics before implementation. It must not copy a single-date promise across an unlimited period.

## PYSA comparison — actual read-only inspection

Inspected27 October2026 under `/Users/moamenghareeb/Pro Youth Football Academy/pysa-platform`, HEAD `37d8901ca1cde805c126f6f3ac83d996ece953a0`: `actions/scheduling.ts` create/update assignment blocks and conflict helper; `lib/db/staff.ts:assignTrainerDB/unassignAllTrainersDB`; and the [prior full scheduling review](../03-design/pysa-scheduling-reference-review.md). Useful pattern: connected date → assignment → effective roster, distinct from the recurring program. PYSA supports broader recurring/dated overrides; those are reference capabilities, not automatically accepted AcademyOS rules.

Actual source updates a program then clears Trainer assignments before inserting replacements in separate calls. EV-0088 records synthetic actual-action linked-write failure/retry artifacts. EV-0093 records action/SQL capacity enforcement gaps; its tests do not prove real hosted races. EV-0095 records a dated-only Trainer discovery omission when base assignments are absent. These motivate atomic replacement, serialized capacity and eventual discovery directly from current dated assignments. They are source/historical audit evidence, not newly executed PYSA tests or hosted exploit proof. No PYSA files, data, credentials or permissions were copied or changed.

## Existing AcademyOS contracts to preserve

[Trainer policy](i2c-trainer-entry-decisions.md) authorizes own staff name/role/branch only; its branch appointments are not dated session assignments. [I3a policy/design](i3a-program-preparation-design-contract.md) keeps drafts private and immutable in time. Existing source: `program-workspace.tsx`, `lib/programs.ts`, `trainer-workspace.tsx`, private Trainer appointment tables and training dates. Reuse shared shell/panes/native controls and current session-bound gateway/limiter, not a privileged identity substitute.

## Status

Policy explicitly accepted by Moamen: “Accept this draft-planning policy”. Connected prototype separately approved by Moamen for implementation on27 October2026. Product implementation is underway; hosted apply/verification, deployment and working-feature acceptance remain pending. [Engineering/design preparation](../04-engineering/i3b-draft-session-planning-preparation.md). D-003 broader role authority, D-006 cancellations/credits and D-012 attendance remain open; this recommendation settles none of those broader domains.


## Policy acceptance record

Moamen explicitly selected “Accept this draft-planning policy” on27 October2026: current Owner, one saved draft date per save, explicit capacity, up to one active same-branch Trainer, fictional player additions/removals, rejection of excess capacity/duplicates/same-academy overlaps, Owner-only visibility and no fees/notifications. Different dates may have different Trainers/rosters. This approves design preparation only; actual invitations, access grants, dependent implementation and wider publication/financial rules are not authorized by this policy approval.
