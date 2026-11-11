# PYSA comparison — AcademyOS journeys delivered so far

25 October 2026. Requested by Moamen after the scheduling review. Read-only product assessment; documentation only. Earlier policy/design/working-feature approvals retain their exact scope. This comparison neither withdraws them nor treats them as full security or product completion.

## Overall conclusion

Preserve the implemented foundation. PYSA is substantially broader in operational usefulness; AcademyOS currently has deliberately narrow admission, setup and people/access slices. AcademyOS's reviewed contracts explicitly separate identity, academy membership, branch assignment and guardian relationships, and define atomic operations/recovery. That is an intentional engineering direction, not proof that the new system is universally more secure or usable.

The main product gap is continuity: the Owner needs to understand what to do next across setup, people and training, and each role eventually needs useful daily work. Narrow guardian/trainer identity views are completed access slices, not completed role experiences. The next implementation should connect them to real domain outcomes, rather than rebuild them or fill screens with decorative features.

## Evidence and limitations

AcademyOS: inspected current components in `apps/web/src/components/` (`onboarding-workspace.tsx`, `people-workspace.tsx`, `guardian-workspace.tsx`, `trainer-workspace.tsx`, `workspace-shell.tsx`), people request validation and registration SQL; reviewed implementation/hosted/acceptance receipts below and the retained hosted player-profile screenshot. PYSA: inspected source under `/Users/moamenghareeb/Pro Youth Football Academy/pysa-platform`, its current-surface description and selected audit evidence at source `37d8901ca1cde805c126f6f3ac83d996ece953a0`. PYSA was not modified.

No fresh signed-in/browser/database/load tests were performed for this comparison. Retained screenshots and hosted receipts establish dated observations, not a new live verification. Source/audit evidence does not establish current hosted PYSA usability or exposure. Existing AcademyOS independent security, direct-API, workload/cost and physical-device gaps remain open.

## Comparison by delivered journey

| Journey | PYSA reference | AcademyOS delivered scope | Assessment and recommended follow-up |
|---|---|---|---|
| Platform admission and Owner entry | Academy creation, Owner invitations, demo/trial and conversion operations; invitation administration and broader catalogue/commercial context | Synthetic academy → named Owner invitation → verified recipient review/acceptance → correct restricted workspace | Keep this flow and explicit acceptance. PYSA's larger commercial/demo lifecycle is deferred scope, not something to insert into onboarding. Improve status vocabulary as needed: invitation delivery, acceptance, initial setup and operational activation must remain distinct. |
| Academy setup | Cross-module checklist links identity, sports, branch, staff, member, schedule, attendance and finance; progress partly derived from actual records | Resumable first branch, saved IANA timezone and sport; first setup summary; real links to players and Trainer appointments | PYSA gives a stronger sense of the whole setup journey. Add a coherent next-step/readiness presentation as modules become usable. Derive completion from actual persisted outcomes; do not equate first branch/sport with academy operational readiness, or show future commands as working. Multi-branch/catalog maintenance remains separate. |
| Identity and workspace selection | Role layouts and academy context; staff creation includes managed credentials and role/academy conflict handling | Explicit current account → available academy/role workspace; server checks current authority; role-specific minimal views | Keep multi-role/academy separation. Improve continuity and visible current context without collapsing roles into one dashboard. Do not import old managed-password or account-role replacement behavior. |
| Player registration and directory | Rich member form: bilingual names, photo, birth date, sport-specific fields, identity/school/health/emergency details; richer operational profile | Owner-only fictional name, optional unverified example contact, paginated search, scoped duplicate review, explicit different-person confirmation, atomic save and profile reopen | Current registration is a valid foundation, not a full player dossier. Keep duplicate handling and recovery. PYSA shows useful profile grouping to revisit when fields/privacy/real-data rules are accepted; avoid importing its long form wholesale. Future enrollment and session links should grow from the saved profile. |
| Guardian relationship and entry | Owner/Manager can find/create/link guardians, relationship/primary flags and account management; Guardian portal has child selection and multiple domains, some hidden | Owner approves one named recipient/player → intended email verified → acceptance → player name/branch only → end link removes that access | Keep explicit invitation/relationship consent to access and minimal projection. PYSA is richer for actual family use; AcademyOS currently proves the access lifecycle only. Child switching, schedules, attendance, finance and consent need their own accepted field/relationship policies. Optional player contact remains distinct from guardian authority. |
| Trainer appointment and entry | Staff directory, role/sport data, managed account creation, assignments and substantial Trainer schedule/attendance/evaluation/finance surfaces | Owner appoints fictional Trainer to saved initial branch → verified acceptance → own name/role/branch → end only that appointment | Keep lifecycle, history and preservation of unrelated roles. A staff identity card is not the eventual Trainer home. Next useful outcome is assigned dated sessions and actual Today, followed by scoped roster/attendance; not invented counters. Manager delegation, transfers, reappointment and payroll remain separate. |
| Visual hierarchy and navigation | Broad role navigation, contextual directories/profiles, onboarding guides and operational links; breadth also includes restricted/legacy destinations | Accepted compact-blue shell; directory-first tasks, selected context, exact review, desktop inspector and medium/phone single-task reflow | Preserve the accepted foundation. Reuse PYSA's contextual flow ideas, not its navigation tree. Continue fixing real spacing/hierarchy issues when demonstrated. The product still lacks a cohesive cross-module readiness/daily-work experience; a shell alone cannot supply that. |
| Loading, errors and recovery | Async forms, local pending/error handling and broader cross-service paths; selected audits expose unsafe multi-step transitions | Explicit pending, stale review, unknown commit/original-operation reconciliation, current-denial clearing; focus/resume revalidation in inspected journeys | Keep these semantics while reducing routine technical wording. Source already refreshes on focus/resume, so a refresh button is supplemental, not inherently the whole workflow. Measure request cost and preserve drafts; retries for reads must differ from uncertain writes. |

## What to retain from the previous work

- Accepted business boundaries and tested registration/invitation lifecycles; no rebuild is justified by this comparison.
- The compact-blue visual system and the accepted workflow-clarity correction, including retained list selection, deliberate review and phone Back behavior.
- Separation of identity/contact, academy membership, branch assignment and guardian link; ending one appointment must not erase another role.
- Bounded directory projections and on-demand private detail. Registration list/candidates use25 visible rows plus a sentinel, not an unbounded people download.
- Current-authority checks, operation identity, audit, conflict handling and recovery. These are especially important as PYSA-like operations connect more domains.

## What should improve next

| Priority | Concrete improvement | Scope boundary |
|---|---|---|
| 1 — continuity | Map Owner admission → setup → players → guardian/staff management → training with clear prerequisites and one useful next action. Retain existing deep links and add no fake operational readiness. | Presentation for existing facts can be refined proportionally; new completion/activation rules require policy. |
| 2 — training | Refine the I3a design to establish program versus dated-session context and live recurrence feedback, informed by the [scheduling comparison](pysa-scheduling-reference-review.md). | I3a policy accepted; connected design remains pending. No assignments/publication silently added. |
| 3 — daily usefulness | After accepted assignment/enrollment rules, turn Trainer access into actual dated work; later link permitted family schedules/attendance. | Separate connected design, permission projections and domain verification before implementation. |
| 4 — progressive profiles | Add approved operational sections to saved player/staff/family contexts as corresponding domains arrive, rather than repeatedly returning users to disconnected directories. | Identity/health/media/consent/money/real-data fields are not authorized by the old app. |
| 5 — usability evidence | Review complete multi-step tasks across roles, EN/AR and phone/desktop; reduce repeated instructions/status clutter while preserving failure recovery. | Previous narrow acceptance stands; no claim of all-role usability or physical-device completion. |

## Reference hazards checked

PYSA invitation acceptance (`actions/invitations.ts:198`) checks a valid token but updates/creates Auth and academy state before later role conflict handling. Historical EV-0019 documents isolated synthetic mutation/retry evidence, not a hosted exploit. Do not copy that sequence into AcademyOS's accepted verified-recipient model.

PYSA guardian linking (`actions/members/guardians.ts:51`) can also update account email; that is different from approving a player relationship. `actions/staff.ts:61` includes managed credential creation and a role/profile upsert. Their presence does not authorize AcademyOS to manage passwords or overwrite existing roles.

Historical EV-0022 showed unrelated same-academy profile-field exposure in local SQL policy tests; foreign-academy denial alone was insufficient. This reinforces field/relationship tests for AcademyOS, not a claim that all AcademyOS security gates passed. EV-0053 documented Trainer guide links to an absent generic scanner while session-scoped scanning existed: future guides must link to real authorized destinations.

Audit references are under the PYSA sibling `engineering-audit/03-evidence/`: `security/EV-0019-invite-lifecycle.md`, `database/EV-0022-two-academy-role-matrix.md`, `reliability/EV-0053-trainer-onboarding-destinations.md`. No fresh reproduction was run.

## Source and delivery references

PYSA paths relative to its app root: `actions/academies.ts`, `actions/invitations.ts`, `components/onboarding/academy-setup-checklist.tsx`, `actions/onboarding.ts`, `components/manager/members/add-member-form.tsx`, `actions/members/guardians.ts`, `actions/staff.ts`, `components/manager/staff/invite-staff-dialog.tsx`, plus the role route inventory in its `platform-description/PYSA-current-surface-reference.md` (relative to the parent reference folder).

AcademyOS evidence: [M1 verification](../07-handoff/onboarding-m1-verification.md), [registration implementation](../07-handoff/i2a-registration-implementation.md), [registration hosted recovery](../07-handoff/i2a-hosted-verification-2026-10-25.md), [guardian implementation](../07-handoff/i2b-guardian-implementation.md), [guardian hosted lifecycle](../07-handoff/i2b-guardian-hosted-test.md), [Trainer implementation](../07-handoff/i2c-trainer-implementation.md), [Trainer hosted lifecycle](../07-handoff/i2c-trainer-hosted-test.md), [accepted visual/workflow correction](../07-handoff/workflow-clarity-correction.md), [remaining verification board](../07-handoff/people-verification-closure-board.md).

Implemented/deployed/owner-accepted status remains as recorded in those dated receipts. This assessment changes documentation only; no app/schema/provider/grant/deployment changes, no new acceptance and no retirement of remaining requirements.
