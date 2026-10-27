# I3d — connected publication and assigned-Trainer design contract

27 October2026. **Policy accepted for design preparation; connected design awaits Owner review.** [Policy and PYSA source/audit reference](i3d-trainer-schedule-decisions.md), [local review instructions](../../design/i3d-trainer-schedule/README.md). Design is fictional local simulation. No dependent app/schema/provider work or account grant is included.

## Scope and traceability

Continue I3 after accepted I3c: Owner publishes an exact selected set of planned future dates atomically; current assigned active Trainer discovers their published dates and opens minimal roster; Owner withdraws future visibility before edits. J09/J10/J11, scoped J10-A01/J11-A01 and IMP-J10-A01 associations; S23/S24/S26/S27 and Trainer Today; L04/L07; SEC-J10/SEC-J11; scoped AO-023/024/027/029 and corresponding AT cases. These are associations, not completed broader requirements, attendance authority or new canonical action numbering.

## Connected screens and actions

| Step | Useful outcome and exceptional state |
|---|---|
| Owner program dates | Current planned/published state, branch/sport/timezone and publication count; whole period, deliberate smaller date/weekday scope or one date. Unchanged published dates visibly preserved; no empty successful apply. |
| Scope and exact review | Exact date/time, assigned Trainer, capacity/roster count and audience; every date accessible through bounded pages. One missing active Trainer, conflict, started date or stale version blocks the complete write set. Correct privately or choose/review a new scope; no silently skipped dates. |
| Prepare and final confirmation | Explicit reviewed audience; resumable private progress with0 effective new visibility. Cancel preparation changes nothing. Final activation publishes/withdraws the complete reviewed set or none. |
| Unknown versus confirmed result | Lost reply blocks replacement/navigation and exposes Check original operation. All committed or fenced none before retry. Confirmed write/read failure retains confirmation and retries only the read; no duplicate publication. |
| Trainer Today/upcoming | Current appointment+academy+branch+exact dated assignment+publication conjunction. Today uses branch-local date; upcoming bounded dates are discoverable without base-program assignment. Loading/failure/empty are distinct; no unimplemented attendance/evaluation controls. |
| Trainer selected date | Published program name, local date/time/timezone, branch/sport, capacity and paged fictional display names only. No contacts, profiles, family relationship or private staff/finance fields. No other Trainer's date. |
| Withdrawal and edit | Owner reviews future withdrawal. Next authorized Trainer request omits/denies it, clearing private detail. Plan/audit preserved. Private edit and republication are separate reviewed transitions; published-target writes blocked through every existing mutation path. Preserved published dates need not block a proposal that does not write them. |
| Appointment ending/context change | Trainer current access removed on next request; no automatic substitute/restoration. Owner sees unavailable coverage. Late results cannot reinsert names after actor/academy/selection change. |

Desktop keeps sidebar → work list → contextual inspector. Arabic mirrors structure and labels. Phone uses connected list/detail with labelled Back and deliberate heading focus; the simulation tests Arabic Back/reopen. Outside-app role/scenario/demo-clock controls are review aids only. No real account is signed in or changed.

## Authoritative implementation contract proposed for the next gate

Publication needs explicit revision/state tied to exact plan/roster version, an actor-scoped operation/result and redacted audit. Preparatory rows are private/non-effective. Final publish/withdraw, q6 individual edits, r7 activation, Trainer appointment ending and affected membership/roster changes require consistent existing academy lifecycle serialization and current-authority revalidation. A mutable date-plan join without a published version/edit guard is insufficient. Use an immutable published projection or enforce equivalent locked source invariants; choose concrete schema only after inspecting current source at implementation time.

Owner preview and commit derive actor from verified identity, not submitted IDs/roles. Current plan versions, ready program, future start instants, active accepted Trainer/branch, all current fictional players, capacity and actual UTC conflicts checked at commit. Fail closed on query failure. All-or-none activation failure after first/middle/last child/audit writes rolls everything back. Unknown outcomes reconcile/fence before replacement. Withdrawal preserves private plan and audit, never deletes children to reconstruct them later.

Current Trainer authority is rechecked for schedule, detail and each roster page; direct endpoints cannot discover another assignment or unpublished version. No widening access to fix a missing list entry. Existing future-date program publication does not create a live inherited default, attendance mark, family projection, notice or financial intent. Real test appointment/grant remains separately authorized.

## Retrieval, measurement and cases

Use [bounded security/performance preparation](../04-engineering/i3d-trainer-schedule-preparation.md):25+sentinel headers/roster names; explicit7-day view is a retrieval bound, not program duration; on-demand roster; stable scoped cursors; no per-session fan-out. Current authority is checked on every request, private projection not publicly cached, confirmed changes invalidate/coalesce refresh, denial/context handoff clears private names. No offline private roster storage authorized.

Proposed SQLp95300ms and unchanged3s outer statement budget, useful view2.5s p95 on declared phone/10Mbps down/1Mbps up/150ms RTT, small confirmed action1s p95. Measure20/40/100/1000 targets,1/25/1001-player selected roster, payload/request counts, memory/WAL and multi-academy fairness. Prototype timings do not establish these budgets; larger all-or-none activation feasibility is still an implementation/verification obligation.

Acceptance includes complete-set invalid/stale/conflict rejection; dated-only discovery; same branch/different Trainer; wrong role/two academy/direct endpoint; suspended/ended/revoked membership; identity/selection late responses; publish/edit/program-apply/withdraw/staff-end races both orders; duplicate/changed operation; interrupted prepare; all/none lost reply; confirmed-write/read failure; exact published edit locks and retained history. Physical-device/screen-reader and independent human security approval are separate gates.

## Evidence and status

Local simulation interaction checks and TypeScript passed. [Checks](../../design/i3d-trainer-schedule/evidence/checks.json) record exact cases/limits, [manifest](../../design/i3d-trainer-schedule/source-manifest.json) source hashes. Actual in-app browser also reviewed preparation and dated-only restricted roster; screenshots linked in README. No real database/API/RLS/identity/provider/hosted atomicity or performance evidence is claimed. Policy accepted; design prepared; design acceptance pending; product implementation/deployment/working acceptance not started for I3d. Prior accepted journeys and outstanding independent gates remain preserved.
