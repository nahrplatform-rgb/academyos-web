# PYSA scheduling reference review

25 October 2026. Requested by Moamen while reviewing the I3a prototype; he confirmed PYSA is the old app. This is a workflow/source/audit review, not a product implementation or live PYSA acceptance test.

## Finding and recommended direction

PYSA's strongest scheduling pattern is a connected operating workspace: see actual dates, open a dated session, reach its roster and attendance, and separately manage the recurring program behind it. Its creation form also gives immediate feedback about frequency and total sessions. The present AcademyOS I3a preview explains safe draft generation, but does not yet convey that wider schedule experience. It should not be presented as the complete scheduling product.

Retain the accepted AcademyOS compact-blue layout and improve the connected scheduling design using these patterns. Do not copy PYSA's navigation, permissions, data projections, business defaults or implementation. The accepted I3a policy remains unchanged; its connected design is still pending review. Recommendations below are not newly accepted business rules.

## Evidence boundary

Inspected local PYSA source at `37d8901ca1cde805c126f6f3ac83d996ece953a0`, under `/Users/moamenghareeb/Pro Youth Football Academy/pysa-platform`, the adjacent platform description, and scheduling audit evidence. The reference checkout already has unrelated local changes; none were changed by this review. No real player data, signed-in PYSA pages, hosted database or production actions were accessed. Source presence establishes intended/implemented code paths, not successful current hosted behavior. Historical audit tests are cited with their original limits, not rerun or reported as new tests.

AcademyOS context: [accepted draft policy](../06-delivery/i3a-program-dates-decisions.md), [engineering preparation](../04-engineering/i3a-program-dates-preparation.md), [connected draft prototype](../../design/i3a-program-dates-review/README.md), [implementation sequence](../06-delivery/app-implementation-plan.md). Scope: J09-A01 / IMP-J09-A01, S22/S23/S25, L07, SEC-J09; AO-021/022/029 are partial associations, not closure of the full training family.

## Full scheduling workflow inventory

| Stage | PYSA source behavior | Useful AcademyOS lesson / boundary |
|---|---|---|
| Enter schedule | Weekly dated list and monthly calendar; branch/search filters; separate Schedule, Programs and Conflicts views | Start with orientation: date period, branch and view. Keep program definitions distinct from actual dates. Do not render nonfunctional controls in the app. |
| Read a dated session | Date/time/duration, program, sport, branch, trainer, occupancy, cancellation and extra/makeup origin; links to dated detail and roster/scan | Make dates actionable and distinguish a recurring rule from one occurrence. Show only facts and actions authorized for the current slice/role. |
| Create recurring program | Name, branch/sport, weekdays, start/end, times, capacity, trainers and sport-specific resources; live session count/frequency/period summary; duration shortcuts | Retain weekday selection and immediate consequence preview. PYSA's capacity20, time/duration defaults and 1/2/3/6-month choices are not AcademyOS policy. I3a remains28 days/20 dates. |
| Manage program | Program list/detail; recurring roster; edit scope options for blueprint only, future unlocked or future all; end/delete | A later edit needs explicit scope and affected-date preview. Preserve historical dates and prior assignments. None of these edit/end/delete commands is authorized for I3a. |
| Manage participants | Program roster plus dated roster overrides; recurring and dated trainer assignments; bulk/single enrollment | Show the effective roster/assignment for the selected occurrence. Membership, eligibility, capacity and races require separate accepted contracts. |
| Create exceptional date | Extra/makeup/private/event options under a program, date/time, roster source, trainers, location/resources and optional financial fields | One-off, makeup and reschedule are different operations. Reuse the dated-detail context later; do not import fee or notification policy. |
| Change a date | Assignment changes, cancellation, linked reschedule or makeup; reason and history; completed/attendance guards | Show old/new date, affected people and exact commit. Preserve source history; retry must reconcile one operation. |
| Trainer daily work | Schedule has list/calendar and upcoming/past windows; dated links lead toward attendance/evaluation/scan. Dashboard Today also has a separate recurrence-derived path | Trainer Today must come from authorized actual dated sessions, including exceptions and cancellations, rather than re-deriving the weekly rule. No Trainer draft visibility in I3a. |
| Guardian/player reading | Child selection, week/month and list/calendar; scoped schedule retrieval and loading/error states | Future family schedules should be tied to the current verified relationship and publication/enrollment rules. Existing AcademyOS guardian name/branch access does not authorize schedule access. |
| Attendance handoff | Dated instance/date passed into roster/scan and attendance routes | Keep a stable occurrence identity through attendance and later corrections. This belongs to I4 after training assignments/rosters are settled. |

## Patterns to preserve in the design

1. **Schedule before administration.** A useful dated view answers what happens and when; program management answers how those dates were generated. Preserve their connection without merging their meanings.
2. **One selected session, one clear context.** Opening a row should retain the date period/filter and show date, time, timezone, branch and status before secondary detail. On phones, use list → full detail → Back; on desktop reuse the selected compact-blue center/inspector pattern.
3. **Immediate creation feedback.** Selected weekdays and period update the proposed date count and readable recurrence summary. The complete date list remains available before commit; a count alone is insufficient.
4. **Progressive detail.** Keep routine scheduling readable. Assignment, resources, history and financial consequences appear only when implemented, relevant and authorized; no large all-purpose form.
5. **Visible exceptions.** A canceled or moved occurrence must not look like an ordinary upcoming session. A makeup must not silently replace its source.
6. **Role-specific work.** Owner plans; Trainer sees assigned dated work; family sees only permitted published sessions. Shared visual components do not imply shared information or commands.

PYSA's explicit list/month controls and informative rows are useful references. Its small/hardcoded labels, crowded action clusters and repeated presentation are not a reason to abandon AcademyOS's accepted spacing, EN/AR or phone conventions.

## Reliability and security lessons — do not carry these forward

| Evidence / inspected path | Finding and limits | AcademyOS requirement |
|---|---|---|
| EV-0025; edit form and `actions/scheduling.ts:updateSession` | Historical actual-action test showed submitted weekday edits omitted from the update extraction; current inspected extraction still omits them. Synthetic SDK, not a hosted browser reproduction. | Saved results must match the reviewed recurrence, including weekdays. |
| EV-0092 and EV-0096; recurrence update/generation | Partial range edits can leave dated rows inconsistent; partial-schema capacity defaults can reset an existing value. Local action/SQL evidence has distinct limits. | Reconcile the exact affected dates atomically; omitted fields mean unchanged, never a guessed default. |
| EV-0088; linked reschedule helper | Replacement, children and source cancellation are separate writes; historical synthetic failure/retry tests left partial or repeated replacements. No new hosted/concurrency proof. | Atomic linked transition, durable operation identity and explicit reconciliation before retry. |
| EV-0089; dated assignment replacement | Delete/insert/header steps can leave incomplete assignments after failure in synthetic action tests. | Atomic replacement with expected versions and checked mutation results. |
| EV-0090; end-date cleanup | Historical local SQL tests removed an attended scheduled instance; attendance remained with its instance link cleared. Not a hosted incident or proof of attendance-row deletion. | Preserve historical occurrence identity, attendance links and audit; define backdated correction policy. |
| EV-0096; capacity and dated Trainer controls | Local SQL showed capacity can be exceeded and dated-only Trainer access exists at the data layer; source Trainer retrieval starts from recurring assignments. These are separate observations, not a hosted end-to-end exploit. | Authoritative capacity reservation and concurrency tests; actual dated assignments determine visibility and work. |
| Trainer home and schedule source | Today derives from recurring weekdays, while schedule uses occurrences; host-local clock also appears in Today calculation. Schedule catches can turn failure into an empty list. | One authoritative dated read model; branch timezone; distinguish unavailable from genuinely empty. |
| Create program source/DAL | Program insert, date generation and trainer assignment are separate steps. No complete atomic create operation is evident in these inspected paths. | I3a already requires program plus exact date set plus audit in one idempotent transition. |

Reference evidence lives under `/Users/moamenghareeb/Pro Youth Football Academy/engineering-audit/03-evidence/`: `frontend/EV-0025-schedule-weekday-edit.md`, `backend/EV-0092-recurrence-edit-contracts.md`, `database/EV-0096-recurrence-enrollment-sql.md`, `reliability/EV-0088-linked-session-recovery.md`, `reliability/EV-0089-instance-assignment-recovery.md`, `database/EV-0090-program-sunset-history.md`. Read their complete bounds before reusing test claims. This review does not establish closure of those findings or perform an independent security audit.

## Retrieval, responsiveness and recovery

PYSA's schedule-window API validates an inclusive1–42-day range and returns a scoped projection with private/no-store headers. The client reads a week or month and uses10-second stale time with previous data retained. Program reads are separately enabled on their tab. These are useful bounded-read patterns, not measured performance budgets. A date bound alone does not bound row volume, joins or rendering cost.

AcademyOS should retain the I3a engineering packet's separate budgets and establish actual measurements before claiming them passed. Future schedule design needs maximum rows/cursor behavior, minimal session summaries, on-demand detail/history, and scoped caches including account/academy/branch/role/window. Context change must clear private previous data; do not blindly retain another role or academy's results. Permission revocation must be enforced on the next server operation. Refresh/reconnect should revalidate automatically; a concise Retry is appropriate after a failed read, while an uncertain write requires Check original operation. No perpetual “Refresh saved state” step should be required for routine work.

Loading, valid empty, failed read, denied access, stale preview, pending commit, unknown commit and confirmed-save/read-failure remain distinct. EN/AR, keyboard and phone behavior must cover the connected journey, not just a calendar screenshot.

## Recommended AcademyOS progression

| Step | Reviewable outcome | Decision boundary |
|---|---|---|
| Revise I3a design before implementation | Show where draft programs belong in the training workspace. Directory → readable recurrence editor with live summary → all-date preview → exact confirmation → saved draft detail/reopen. Make Owner-only draft status clear throughout. | Same accepted create/read policy; no added access, publication, assignments or historical edits. Revised connected design still requires Owner review. |
| Following training slice | Program and occurrence detail connect to accepted Trainer assignment and player enrollment; authoritative capacity/conflicts; actual Trainer upcoming/Today | Requires decisions for assignment, eligibility, capacity, visibility/publication and changes. Not authorized by PYSA reference behavior. |
| Subsequent dated operations | Explicit reschedule/makeup/cancel/edit scopes with affected-date/people preview, immutable history and recovery | Requires separate policies and connected design; do not infer notification or financial effects. |
| I4 attendance | Assigned dated session → complete roster → authoritative attendance → allowed family visibility and correction | Existing I4 policy/security gates remain. |

The eventual calendar can include operational views only as those outcomes become real. The current draft-only app should not show simulated attendance, occupancy, conflict clearance or family publication as functionality. A broader vision may be demonstrated separately as clearly labeled design reference.

## Source pointers and status

PYSA paths relative to its app root:

- `components/manager/schedule/schedule-calendar.tsx:238` workspace; `:525` controls; `:740` dated row; `:837` programs.
- `components/manager/schedule/add-session-form.tsx:90` duration shortcuts; `:100` count; `:593` summary; `edit-session-form.tsx:463` edit scope.
- `components/manager/schedule/add-extra-session-form.tsx`; `session-instance-operations.tsx`; `session-details.tsx` for exception, dated operations and program roster flows.
- `actions/scheduling.ts:583` create; `:712` update; `:932` extra; `:1071` assignments; `:1283` linked dates; `:1646` end date; `:1717` bulk enrollment.
- `lib/db/scheduling.ts:409` program create; `:1139` generation; `:1937` Trainer retrieval; `lib/db/roster-resolution.ts` effective roster layering.
- `lib/api/schedule-validation.ts:23`; `app/api/schedule/window/route.ts`; `lib/db/schedule-window.ts` bounded window/projection.
- `app/(trainer)/trainer/page.tsx:137`; `app/(trainer)/trainer/schedule/page.tsx`; `app/(trainer)/trainer/session/[id]/page.tsx`; `components/guardian/guardian-schedule-client.tsx`; `components/player/schedule/player-schedule-client.tsx` role-specific paths.

Review/documentation completed. Product implementation, new database work and deployment: none in this review. I3a policy: accepted for design preparation. I3a connected design/implementation approval: pending. Live PYSA usability/speed/security: not tested here. Earlier AcademyOS approvals and outstanding independent security/device/load gates are preserved.
