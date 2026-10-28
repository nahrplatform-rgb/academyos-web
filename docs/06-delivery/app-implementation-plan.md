# One application implementation plan

24 October 2026. Owner agreed to connect the selected design to the functional implementation plan before further expansion. This update is documentation/traceability only. It neither deploys the local visual changes nor authorizes policy-blocked financial, child-access, ownership, deletion or provider behavior.

## The working registers

| Register | Purpose |
|---|---|
| [Screen implementation matrix](app-implementation-screen-matrix.csv) |68 screen IDs, proposed/existing ID origin, source design, release scope, action joins, reusable components, current source and separate delivery statuses |
| [Action implementation matrix](app-implementation-action-matrix.csv) |30 current action groups, actor/context, requirements and acceptance IDs, loading/security contracts, policy, states, source, verification/deployment/approval and next gate |
| [Requirement joins](app-implementation-requirement-links.csv) |All180 canonical AO/AT records retained; existing status/evidence quoted as a dated snapshot; scoped action mappings distinguished from whole-requirement closure |
| [Canonical requirements](requirements-traceability.csv) |Authority for each requirement/acceptance scenario and actual evidence; never replaced by a prototype inventory |
| [Canonical journey register](../03-design/journey-register.csv) |28 family outcomes and their existing evidence; action groups expand rather than renumber them |
| [Canonical loading matrix](../03-design/screen-data-loading-matrix.csv) |Named retrieval/freshness/failure contracts that must be expanded for actual screens |
| [Security matrix](../04-engineering/journey-security-matrix.csv) |Independent family/action security packet gates; no visual or unit-test promotion |

Existing S01–S58 and J/AO/AT IDs are preserved. S59–S68 remain **proposed additive design IDs**, not silently approved catalog changes. IMP work-item IDs derive from the group's primary action (for example IMP-J02-A01); adding/reordering rows does not renumber them. Action suffixes introduced in the design pack remain proposed subdivisions unless already accepted by the M1 packet. New atomic business commands require their own reviewed action contract, even when one inventory row groups them.

The68-row matrix is not68 implemented screens. All180 requirement rows remain visible, including cross-cutting requirements without a precise action join. Those explicitly require mapping before the dependent slice; they are not excluded or completed. Canonical status snapshots may contain older wording: they are quoted rather than silently corrected. Reconcile current evidence before relying on them.

## Current implementation boundary

The functional app has foundation and a bounded M1 academy admission/invitation/context/setup journey. The compact blue shared visual source has been applied locally to existing welcome/sign-in/M1 surfaces; build/typecheck/lint and31 unit tests passed, local production/development M1 browser regression and5 foundation E2E pass (24 October); shown compact-blue M1 visual design approved24 October; compact-blue M1 staging rollout b209acb and scoped authenticated rendering verified24 October. See [the exact source receipt](../07-handoff/compact-blue-design-foundation.md).

The larger product prototypes are fictional local design models. Their state transitions, seeded roles, linked flags, dates, payments, uploads, notifications and job results are not app implementation. Do not transplant those helpers or sessionStorage state into real operations. S51–S58 service operations are not implemented merely because a temporary staging verification route exists. A Clerk account control is not a completed custom profile/recovery screen. M1 initial branch/sport is not full multi-branch/catalog/archive support.

## Implementation sequence

| Work package | Connected outcome | Dependencies / next gate |
|---|---|---|
| I0 — current source verification | Shared blue foundation and existing M1 working path | Local EN/AR keyboard/native validation, unknown/conflict/revoked/identity-handoff regression passes. Welcome desktop/phone screenshots reviewed; phone shell targets corrected. Owner approved the shown M1 visual design24 October. Scoped authenticated staging rendering verified24 October; broader gates remain open. See compact-blue staging release receipt. |
| I1 — M1 presentation completion | Admission list/detail/review implemented on real M1 projections; existing resumable setup preserved | Source b57dfdb deployed; local EN/AR keyboard/recovery, zero-read inspection, exact invitation targeting and scoped actual-session staging rendering pass. I1 owner acceptance/broader gates remain separate. |
| I2 — people and relationships | Register player → scoped duplicate review → guardian verification → correct child projection; staff scope/invitations | D-003 beyond M1, D-004/D-015; approved evidence/authority and payer/consent separation; two-tenant/branch negative cases |
| I3 — dated training | Program → dated-session preview → assignment and enrollment/capacity → actual Trainer Today | Approved recurrence/conflict/eligibility and fee-effect boundaries; transaction/expected-version and capacity race tests |
| I4 — online attendance | Complete roster → manual/scan parity → committed mark → guardian visibility; correction request/review | D-012 and approved correction capability; lost-response/idempotency/concurrency, revoked assignment, current guardian link, immutable history |
| I5 — published development | Author draft → return/review → publication snapshot → authorized family/player progress | D-013/D-004; metric schema/version, field isolation, publication/notification and successor history |
| I6 — financial domains | Family fee/bill/receipt/allocation/refund; trainer effective contract/earnings/approval/payout; platform plans/payment/restrictions | D-001/D-005–010; distinct ledgers and authorities, approved examples/currency/rounding, provider evidence and reconciliation; no invented formulas/prices |
| I7 — supporting operations | Communications; private media; support/internal notes; stock movements | Channel/consent/privacy/support/inventory policies; per-item partial recovery, private projections and durable job outcomes |
| I8 — report/privacy lifecycle | Defined summaries → full-scope export/download/expiry; authority/hold/subsystem cleanup | Stable authoritative domain sources; consistent snapshot, complete pagination, actual artifact checks, policy/legal basis and no false erasure closure |
| I9 — platform service operations | Read-only redacted inventory/health/freshness/impact → usage/cost provenance → incident/backup evidence | Explicit platform read capability; actual versus estimated/unknown observations; provider-read scopes. Administrative writes/purchases/restores require separately approved bounded actions |
| I10 — offline / expansion / native | Accepted limited offline attendance, later advanced channels and iOS/Android priorities | D-011/D-018/D-020; physical-device storage/replay/upgrades, stable APIs and separate release acceptance. Retain R2/N1 scope without pretending it is current |

Shared design, localization, performance/cost/recovery and security work accompany every package. They are not deferred to the last screen. Select a narrow approved vertical slice inside each package; this table is an order, not a deadline, release commitment or automatic authority for production changes.

## Shared library: actual versus proposed

Actual source: `WorkspaceShell`, native `Button`, `Input`, `Select`, `StatusBadge`, semantic tokens and the existing reusable `TimezoneSelect`. These retain native form/ARIA/event/disabled/ref semantics; the shell has no membership authority. New domains reuse them and inspect actual existing source before adding a duplicate.

Proposed only: scoped directory/table/inspection, review dialog, operation receipt, independent region state, complete roster/attendance mark, correction diff, money/allocation after currency policy, per-item upload/job progress, observation/freshness/cost/impact/recovery evidence. Build them when a real repeated domain contract needs them. No monolithic form with many unrelated switches; domain behavior remains explicit. Every repeated element must state ownership, semantics, keyboard/phone/RTL and error/recovery behavior before being called accepted.

## Required gates for every action

1. Identify stable action/screen/AO/AT IDs, current policy, actor/academy/role/branch, data fields, entry/prerequisites and concrete outcomes.
2. Inspect current UI/service/database/jobs/files and reuse contracts. Define the authoritative commit, current authorization/tenant/field checks, versions/idempotency and side effects. A prototype flag/cache cannot authorize a write.
3. Expand the named loading matrix row: useful critical view, deferred/on-demand work, bounds/freshness, cancellation/context change, private caching and failure/cost evidence.
4. Expand the security packet: assets/trust crossings, misuse, prevention, detection, containment, recovery and direct negative/concurrency/replay cases.
5. Implement real UI→operation→persisted result/audit→side effects and recovery. Verify native validation, leaving/refresh/reconnect/context change, pending/partial/unknown/stale/restricted states and correction/compensation rather than unsupported undo.
6. Record source, local domain/DB/HTTP/browser evidence separately. Measure five quality dimensions with stated device/network/workload; keep security independent. Skipped/unavailable is not passed.
7. Deploy only within authorized environment and record its exact build/runtime evidence. Owner/role acceptance is a separate recorded decision. Do not promote full screen/family/requirement from one scoped result.

## Maintenance and source of truth

The three new CSVs are generated documentation joins by `scripts/design/build_implementation_register.py`. Their current-source mapping is an explicit conservative assessment, not automatic source discovery. Update the source mapping when real implementation changes, update canonical requirement/journey/evidence records with actual results, then regenerate. Do not edit generated status text to claim acceptance without the authoritative receipt. New source work must not overwrite prior historical approvals or evidence.

Validate with `python3 scripts/design/validate_implementation_register.py`. It checks identifiers, references, status separation and preservation against canonical/design inputs; it proves documentation structure only. Screen/action joins are scoped: finance/compensation/service loading rows may include several canonical families and must be narrowed before implementation. An unmapped row is a visible follow-up, not scope retirement.

This planning update changes no functional app source, schema, account, provider, runtime, deployment or Git publication. Existing uncommitted visual source and design artifacts are preserved.

## Documentation validation receipt — 24 October 2026

The structural validator passed:68 screen identifiers match the design inventory,30 action groups retain stable primary-action-derived work IDs, all180 canonical requirements and their existing status/evidence snapshots are preserved, source/contract/evidence paths exist, loading/security IDs resolve, and all five delivery-status fields are explicit. Generation is deterministic on the current inputs. This is documentation integrity evidence, not app runtime, policy approval or owner acceptance.

## Integration continuation — 24 October 2026

[Current verification and two-chat handoff](../07-handoff/compact-blue-integration-verification.md) records the integrated source, preserved design work, local checks and screenshot evidence. Update the generator before regenerating status joins. Browser access is available again; earlier unavailable records remain historical. Neither local rendering nor prototype selection closes hosted verification or owner acceptance.

## I1 continuation — 24 October 2026

[Admission presentation implementation/evidence](../07-handoff/m1-admission-presentation.md) records the new bounded list/detail slice. [I2a policy choices](i2-people-first-slice-decisions.md) are prepared for the next people journey; recommendation remains pending until explicitly accepted. No guardian/player authority is inferred from the prototype.

## I2a execution update — 24 October 2026

Moamen accepted narrow I2a policy and connected design. Real Owner-only synthetic player registration is implemented; local SQL/route/UI tests and initial hosted happy path/reload/duplicate-existing/one-direction isolation are recorded in [the implementation receipt](../07-handoff/i2a-registration-implementation.md). Wider people/guardian policy, independent review, remaining hosted workload/race/device checks and feature acceptance remain separate. This does not complete the wider I2 chain.

## I2 continuation — 25 October 2026

I2a working EN/AR wording/usability accepted. [Hosted conflict/recovery checks and notice repair](../07-handoff/i2a-hosted-verification-2026-10-25.md) extend the evidence; full independent/device/load gates remain open. Moamen accepted the [narrow I2b guardian policy](i2b-guardian-access-decisions.md) for design only; the [connected design contract](i2b-guardian-design-contract.md) and simulation are prepared for separate review. No new recipient invite or access grant is authorized by that design decision.


## Owner correction — reference is the structural foundation (25 October 2026)

The Owner clarified that the original `AcademyOS_MacOS_Reference_Matched.html` is the exact visual and interaction foundation, not only a blue/color inspiration. The first implemented-journeys review prototype underrepresented the third contextual pane and is superseded as a layout proposal. Its useful recovery, wording and accessibility findings remain review inputs.

Preserve the reference's compact desktop workspace: **navigation sidebar → central work area/list → contextual inspector with selected details and actions**. Preserve the compact toolbar, semantic table/list density, selected-row treatment, restrained spacing and inspector action placement. Mirror the structure in Arabic RTL. On phones, adapt it into connected list/detail views with labelled Back, preserved selection/draft and deliberate focus return; do not squeeze three columns onto a phone. Forms and narrowly restricted views retain their domain-specific content and permitted projection. The right pane is contextual, not a reason to invent extra information or duplicate a narrow profile into a fake dashboard.

The existing exclusion of imitation red/yellow/green macOS window controls remains in force. Reference example documents, activity, totals, subscriptions, role powers and other unimplemented features are not business authority. Current accepted policies, authoritative operations, permissions, audit, persistence and unknown-operation recovery remain unchanged.

Corrected design: [reference foundation contract](../../design/implemented-journeys-review-2026-10-25/reference-foundation-contract.md), [connected prototype](../../design/implemented-journeys-review-2026-10-25/prototype/index.html), [implementation handoff](../../design/implemented-journeys-review-2026-10-25/implementation-handoff.md). The Owner's instruction to follow the reference is recorded; approval of the corrected rendered design remains pending. Owner design review precedes dependent functional implementation. This correction changes design/documentation only, with no release or whole-app acceptance implied.

## Original-reference implementation refinement — 25 October 2026

Later Owner handoff confirms the corrected foundation and supersedes earlier pending visual-direction wording. Shared sidebar/central task/contextual inspector is implemented across bounded M1/I1, I2a, I2b and I2c, with RTL and phone list/detail navigation. Quiet current reads, draft-preserving return and distinct original-operation recovery retain existing server contracts. No I3 or new authority/data projections. [Current source, test and rollout receipt](../07-handoff/reference-refinement-implementation.md) is authoritative for this refinement; prior per-slice functional approvals remain separate from new working visual acceptance. Imported design artifacts remain design evidence, including historical superseded assets. Action/screen matrices link actual bounded source and preserve all wider requirements.

## Working workflow correction — 25 October 2026

Owner reported the deployed reference refinement disorganized/unintuitive with alignment/spacing issues. This is not accepted working presentation. [Corrective implementation and evidence](../07-handoff/workflow-clarity-correction.md) covers directory-first appointment entry, task/header alignment, compact content-adjacent actions and medium-width task reflow across the same implemented journeys. Prior business/functional approvals retain their scopes. No I3 expansion.

Owner subsequently approved the deployed workflow clarity correction on25 October2026. [Acceptance scope and exact source/deployment](../07-handoff/workflow-clarity-correction.md) supersede the preceding pending working-presentation status for these implemented journeys. Broader verification/security gates and future policy/design decisions remain open.

## Next bounded training slice — I3a preparation

After recorded approval of the corrected workflow, Owner requested continuation. Source inspection confirms program/session/recurrence/roster implementation does not yet exist. [I3a recommendation](i3a-program-dates-decisions.md) proposes Owner-only fictional program → full date preview → atomic draft save/reopen in the saved branch/sport/timezone. Policy is pending; separate connected design review follows. [Engineering/security/loading preparation](../04-engineering/i3a-program-dates-preparation.md) names bounds, failure/authority/recovery cases and measurable budgets. No new scheduling source/schema/provider/grant changes. Assignment, enrollment/capacity, publication and actual Trainer Today follow as connected I3 slices; broader prior verification gates remain open. This order does not label draft dates operational or close AO-021–034.

I3a policy subsequently accepted for design preparation25 October2026. [Connected draft-program preview](../../design/i3a-program-dates-review/README.md) prepared with EN/AR and failure/recovery scenarios. Design review pending; no dependent product/schema/provider implementation or scheduling deployment. Prior wider policy and verification gates remain open.


### I3a implementation update — 26 October2026

The subsequent full-period, independent-weekday-time and resumable preparation design was Owner-approved. The bounded Owner-only draft slice is now implemented and deployed to synthetic staging. Actual Owner creation, all-window review, pause at12/40, reload/reopen, resume and40-date finalization passed with persisted/audit evidence. [Current implementation receipt](../07-handoff/i3a-program-implementation.md) supersedes the earlier preparation-only status above. Working-feature acceptance, independent review and broader hosted/device/load gates remain open. Assignment, enrollment and publication are still unimplemented; no whole scheduling requirement is closed.


I3a working-feature update: Moamen subsequently explicitly accepted the deployed draft-program wording/usability. This acceptance covers the narrow Owner draft flow only. Current evidence and open security/device/load gates remain in the [implementation receipt](../07-handoff/i3a-program-implementation.md); assignments, enrollment and publication still require their own connected slices.


## I3b next-step preparation — 27 October2026

After I3a working-flow acceptance, Owner requested continuation. [Proposed draft session-planning policy](i3b-draft-session-planning-decisions.md) connects a saved draft date to an explicit capacity, eligible Trainer and fictional roster. [Engineering/design preparation](../04-engineering/i3b-draft-session-planning-preparation.md) records PYSA source/audit lessons, current contracts, bounded retrieval, atomicity, security and measurable budgets. Policy and separate connected-design review are pending; no I3b implementation/deployment or Trainer/family visibility is inferred. Full-period bulk/recurring enrollment and publication retain separate rules and review.


I3b policy subsequently accepted27 October2026. The [connected design contract](i3b-draft-session-planning-design-contract.md) and [local interactive preview](../../design/i3b-draft-session-planning/README.md) cover one dated plan, explicit capacity, eligible Trainer, fictional roster, exact review and recovery in EN/AR. Separate design approval is pending. No dependent I3b product/schema/provider implementation or access grant has occurred.

27 October2026 continuation: Owner explicitly approved the connected I3b design for implementation. The [I3b implementation receipt](../07-handoff/i3b-planning-implementation.md) now records source,49 local SQL groups, actual API/React tests, exact-source CI and staging schema/ACL apply. Earlier preparation/pending statements above are historical; current runtime/acceptance and independent gates remain separately recorded in that receipt.

## I3c program-wide planning preparation — 27 October2026

Owner working review of I3b requested **Plan the program** alongside **Plan this date** and then authorized proceeding with the best option. [Proposed I3c policy](i3c-program-planning-decisions.md) recommends explicit dated snapshots, preserved existing plans, whole-period/subset/weekday choices and resumable ready-subset application with truthful partial completion. [Connected design/engineering contract](i3c-program-planning-design-contract.md) records scope, reference evidence, retrieval/security/recovery contracts and proposed measurements. These new bulk policies await explicit decision; prototype review and dependent implementation remain separate. I3b working-feature usability acceptance is changes-requested/pending; existing implemented date behavior is preserved. No functional source, schema, provider or deployed behavior changes in this preparation.

27 October2026 amendment: Owner explicitly chose **Require all dates to save together**, superseding the I3c ready-subset/partial-completion recommendation. [Revised policy](i3c-program-planning-decisions.md) and [connected preview](../../design/i3c-program-planning/README.md) separate resumable private preparation from one all-or-none live save. Existing dated plans stay preserved; any included conflict blocks the whole change. Local design checks are distinct from atomic database feasibility, hosted deployment and working acceptance. Connected-design review is pending; no dependent product/schema/provider change.

27 October2026 I3c continuation: Owner approved the all-or-none connected design for implementation. [Actual source/local evidence](../07-handoff/i3c-program-planning-implementation.md) now includes private resumable preparation, preserved individual plans and atomic activation. Exact-source CI, hosted apply/deployment/runtime and working acceptance remain separate; the broader training/publication module is incomplete.

27 October2026 rollout evidence: additive I3c staging migration20261027022133 applied; RLS/function ACL and unchanged existing membership/date/plan counts checked. Source79126a0 push CI passed; parallel PR development UI test found an over-broad checkbox selector, corrected separately. Preview build succeeded; serving-app promotion and actual Owner operation remain blocked by browser/Vercel access. [Current receipt](../07-handoff/i3c-program-planning-implementation.md). No working-feature acceptance or security/device/load gate is inferred.

27 October2026 actual rollout continuation: sourceef9a87e passed both CI runs and was promoted to the existing staging alias. Owner UI prepared40 dates, resumed after reload, confirmed39 new plans/rosters together while preserving the existing individual plan and unrelated program plan. Actual EN/AR browser phone/desktop, individual-date reopening and foreign-academy denial passed. [Hosted receipt](../07-handoff/evidence/i3c-hosted-2026-10-27/receipt.json). Working acceptance and broader security/device/load gates remain separate/open.

27 October2026 Owner feedback: explicitly accepted the working whole-program planning flow in EN/AR after the hosted40-date/39-change/preserved-plan review. This closes this slice’s wording/usability acceptance only; remaining direct-API/race, independent security, physical-device and load/cost gates stay open.

## I3d proposed next connected step —27 October2026

Following Owner acceptance of working I3c, prepare [publication → assigned Trainer schedule/dated roster](i3d-trainer-schedule-decisions.md), using PYSA schedule/source/audit reference and [bounded security/performance preparation](../04-engineering/i3d-trainer-schedule-preparation.md). This introduces new Trainer visibility, so policy is proposed, not accepted. Separate connected-design review precedes dependent implementation. Existing I3c and prior acceptances remain intact; independent security/device/load and remaining hosted verification gates are not retired. No invitation/access grant or product/schema/deployment change.

27 October2026 I3d continuation: Moamen accepted publication/assigned-Trainer visibility policy for design. [Connected EN/AR publication → Trainer schedule/roster → withdrawal design](i3d-trainer-schedule-design-contract.md) and [local preview](../../design/i3d-trainer-schedule/README.md) are prepared; local simulation/TypeScript/layout checks pass. Separate connected-design review is pending. No I3d product/schema/deployment or actual account grant.

## Current continuation —28 October2026

I3d policy/design, real implementation, exact-source staging rollout and scoped Owner working wording/usability acceptance are recorded in [the current receipt](../07-handoff/i3d-publication-implementation.md). Earlier I3d pending statements above are historical. Temporary Trainer test appointment is ended and its date withdrawn. Broader independent security/device/performance gates remain open.

Next: [I3e one future move/cancel decision packet](i3e-session-changes-decisions.md), [engineering preparation](../04-engineering/i3e-session-changes-preparation.md) and [ongoing PYSA behavior ledger](../03-design/pysa-behavior-preservation.md). Policy recommendation awaits explicit decision; connected-design review precedes implementation. Essential scheduling connects to attendance next; advanced scheduling scope is retained without blocking every later module.

28 October2026 I3e policy accepted for design: Owner explicitly accepted one future occurrence move/cancel, preserved plan/history, withdraw-before-change and no implicit side effects. [Connected preview and design contract](i3e-session-changes-design-contract.md) prepared with local simulation/TypeScript/ENAR responsive checks. Separate connected-design approval remains pending; no dependent product/database/provider or account change.

## I3e implementation continuation —28 October2026

Owner approved the connected session-change design for implementation. [I3e implementation, tests and rollout](../07-handoff/i3e-session-changes-implementation.md) records original/effective date identity, atomic move/cancel/history, scope/version integration and recovery. Working-feature acceptance and hosted/device/security/performance gates remain separate. No production or account grant inferred.

I3e hosted follow-up28October: existing staging app now serves7e32557 after passkey reauthentication; actual Owner synthetic move/cancel/history/retained roster and effective-date discovery verified. [Hosted evidence and limits](../07-handoff/i3e-session-changes-implementation.md). Working-feature feedback remains pending; no full scheduling/security/device/load acceptance inferred.

I3e Owner working-feature acceptance28October2026: Moamen explicitly accepted the deployed session-change EN/AR wording/usability. Existing scoped approvals remain valid; independent security, broader hosted recovery/race, physical-device and load/cost gates remain open. See the I3e implementation receipt for exact evidence.

## I4a attendance preparation —28 October2026

Following I3e working acceptance and Owner continuation, [the next attendance recommendation](i4a-online-attendance-decisions.md) connects an assigned published session to its complete fictional roster, explicit manual marks and reasoned Owner correction. [Engineering/security preparation](../04-engineering/i4a-online-attendance-preparation.md) records PYSA source/audit lessons, current-source reuse, time/authority dependencies, attendance protection across scheduling writers, retrieval and measurable budgets. D-012 policy choice and separate connected-design review remain pending. No dependent attendance implementation, provider change, access grant or deployment occurred; QR/manual parity, correction requests, family visibility and offline remain retained later scope.

I4a policy accepted28October2026: Owner explicitly accepted the bounded attendance rules for design. [Connected EN/AR preview and contract](i4a-online-attendance-design-contract.md) now cover schedule → full roster → explicit mark → reasoned Owner correction/history and failure/recovery. Separate design approval remains pending; no dependent attendance implementation or deployment.

I4a connected design explicitly approved28October2026. [Implementation and verification receipt](../07-handoff/i4a-attendance-implementation.md) records real manual register/correction source and guards across scheduling writers; source/local/hosted/working acceptance remain separate. [Prepared hosted test](../07-handoff/i4a-hosted-attendance-test.md) requires a separately authorized temporary Trainer restoration; no grant is inferred from policy/design approval.

I4a staging release verified28October2026: schema20261028024556 and checked appfa1fff8 at dpl_B6kFNoy4Z5N9cKJ9K6RNF9HXt82p Ready. Owner workspace/ENAR nonexistent-event denial smoke passed; no marks or active Trainer created. Hosted attendance/correction/end-access test awaits its separate restoration authorization; working acceptance and independent gates remain pending.

I4a hosted continuation28October2026: separately authorized exact Casey restoration/test/ending executed. Actual Trainer recorded Present after real session start, then the Mac locked; audited fallback ended that appointment. After unlock, current Owner corrected to Absent with reason and retained EN/AR history; ended Trainer register denied/cleared. One canonical mark/two histories/two receipts and audit verified; unrelated memberships unchanged. Active Trainer replacement browser case was interrupted and remains open. [Execution/limits](../07-handoff/i4a-hosted-attendance-test.md). Working acceptance and independent/security/device/load/cost gates remain separate. Current presentation follow-up removes stale future-feature and withdraw-first guidance; no authority expansion.
