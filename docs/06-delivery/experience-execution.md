# Connected experience execution guide

31 October 2026. Owner authorized this integration and the first remediation batch after reviewing the whole-app analysis. This guide links existing authorities; it does not invent business rules, restart completed work or replace the canonical registers.

## One execution view, distinct sources of truth

[experience-execution.csv](experience-execution.csv) records current work and next gates. Each row names finding IDs, journey/action work IDs, dependencies, exact evidence and separate design/implementation/local/deployment/hosted/Owner/security states. Update it in the same batch as the change. Findings are closed only across their declared occurrence/coverage; a scoped repair is marked partial. G01–G09 from the service analysis remain explicit measurement/decision work.

- [Original app plan](app-implementation-plan.md) and [roadmap](roadmap-and-backlog.md): overall feature scope/dependencies, I0–I10. No finance, Manager, Player, media or offline scope disappears.
- [Full redesign](full-experience-redesign.md): approved Charcoal spectrum proposal and journey parity. Existing visual/functional approvals are not rewritten.
- [Findings](../04-engineering/request-findings-register.md): diagnosis/evidence and closure scope, not an implementation checklist with implied success.
- [Service impact](../04-engineering/request-service-impact.md): verified meters versus scenario estimates, G01–G09 and responsible measurement roles.
- [Standard](request-hygiene-and-offline-standard.md): ownership, fresh/loading behavior, security/recovery, proposed cache/offline decisions, DoD and execution acceptance cases.
- [Canonical actions](app-implementation-action-matrix.csv), [requirements](requirements-traceability.csv), [loading rows](../03-design/screen-data-loading-matrix.csv) and [security gates](../04-engineering/journey-security-review.md): existing IDs, accepted rules and evidence. Do not renumber or mark parent requirements complete from a scoped finding fix.
- [Living factual review](../../design/app-experience-review/README.md): actual component captures/wording/control states. Approved proposal remains separate; UI changes require affected recapture and freshness checks.

## Living continuation prompt

Use [continue-academyos.md](continue-academyos.md) for the current copyable implementation prompt. It is generated from every tracker row, including unresolved delivery/acceptance/security gates. After each completed or interrupted checkpoint: update the tracker/evidence, run `python3 scripts/design/build_continuation_prompt.py`, then `python3 scripts/design/validate_experience_execution.py`. The validator rejects a stale prompt; it does not run the next task or prove runtime behavior. This repository workflow is not a scheduled background automation.

## Current working-day execution direction — 2 November2026

The Owner requested detailed plan updates after agreeing that the app must support a continuous academy working day. This direction supersedes the old instruction to mechanically continue EX-03 after the scoped cold Calendar fix. Existing source, accepted business rules, Charcoal design and released EX-01/02/04 evidence remain valid. No cache TTL, private persistence, offline queue, account grant or runtime feature is accepted merely by this plan update.

The [working-behaviour contract](../03-design/academy-working-behavior-contract.md) defines WB-01–WB-24, request/state ownership, target operating behaviour, current-versus-proposed resource rules and consolidated pending WB-P01–WB-P04 decisions. The [working-day acceptance specification](academy-working-day-acceptance.md) and [32-case plan](academy-working-day-cases.csv) define how we will demonstrate the connected result. These are explicit gates, not a new infrastructure rebuild or another whole-app palette exercise.

## Order and scoped dependency gates

The tracker is the only source for current priority/status. Its routing fields are distinct from delivery/acceptance fields:

- `execution_lane`: `baseline`, `primary` or `supporting`.
- `execution_order`: consecutive1–7 for the current primary sequence; supporting order lists parallel obligations; baseline0 is retained evidence.
- `execution_state`: exactly one primary `current`; other primary rows are `queued` or explicitly `checkpoint_passed`; baseline is `retained`; supporting rows are `supporting`.
- `dependency_gate`: the required **scoped output** and its limits. `dependencies` retains the traceable work-ID edges. An unfinished all-role parent is not automatically a reason to block a safe scoped design/coordination task.

`checkpoint_passed` routes execution after a named scoped output. It is not a declaration that all findings, every role, Owner approval, independent security or future feature is complete. Preserve the separate status fields and evidence. The validator checks routing structure/freshness, not the truth of a human acceptance claim.

| Primary order | Work | Output needed for the next dependent checkpoint |
|---|---|---|
| 1 | **EX-10 — working-behaviour, decisions and pilot architecture** | Actual-source ownership/state/request-budget inventory using existing evidence; consolidated WB-P choices and targeted changed-state walkthrough; implementable pilot architecture with scoped gates. Contract/case preparation is documented now; source inventory and dependent decisions/review remain. |
| 2 | **EX-02 — shared workspace and remaining navigation/lifecycle** | Source-justified stable workspace/task boundaries, safe routing and current-authority/dirty/unknown behaviour in the pilot. Shell remounts do not prove provider calls. Preserve prior delivered fixes. |
| 3 | **EX-06 — shared read owner, invalidation and approved reuse** | One scoped resource owner/key lifecycle across pilot routes; in-flight coordination, response seeding and affected-view updates. Choose existing primitives versus one focused library from evidence. Private reuse/preparation applies only after relevant WB-P acceptance. |
| 4 | **EX-04 — first-use/dependency/preparation improvement** | Bounded critical startup/destination reads, accepted likely-task preparation and semantic before/after measurements; no duplicate hydration/mount fetch. Retain deployed Owner current-period read and current scope/bounds. |
| 5 | **EX-03 — save/interruption/crash recovery** | Original outcome discovery/storage-failure proof for the affected pilot paths, including actual supported refresh/process boundaries. Prepare this with EX-10 and validate before replacing recovery or accepting pilot writes; do not postpone integrity until the end. |
| 6 | **EX-11 — working-day acceptance gate** | Declared Owner Today→Calendar→session/register→Back→People/review run with interruptions, actual results and working feedback; local/hosted/device/cost/security limits recorded. A bounded Owner pass does not close all-role adoption. |
| 7 | **EX-07 — broader journey and Charcoal parity adoption** | Extend the accepted working pattern across implemented journeys and role-specific experiences; preserve original approvals and demonstrate actual preview/runtime parity. Unbuilt capabilities stay explicitly future. |

Supporting obligations run **alongside** the affected primary checkpoint:

- **EX-05:** request/limiter/relational query work, bytes and provider costs; actual versus modeled savings; no index, shared cache or protection removal from hints alone.
- **EX-08:** first useful content, local feedback, read timing, blank intervals, task continuity, device/accessibility, role/provider/security evidence. Collect baseline and after evidence in every batch; do not defer the entire measurement stage until all code is written.
- **EX-09:** decide current-pilot freshness/private-memory/durability needs with EX-10/06. Persistent private payloads, offline writes and telemetry remain later capability-specific decisions. They do not block unrelated safe online coordination.

The old nine work IDs remain; EX-10/EX-11 are the two new explicit gates. No historical implementation/deployment/acceptance status is reset. Advancing by numerical ID is incorrect: the explicit lane/order/current fields select the next task.

## Continuation and checkpoint maintenance

1. Read the single `current` row, its latest next action, this contract and applicable evidence. Historical packets explain prior results; their old next-step text cannot override current routing.
2. Name the bounded outcome and existing IMP/J/S/AO/AT/L/SEC joins. Reuse compatible baseline results and inspect current source; do not repeat an investigation-only checkpoint without a new question or changed evidence.
3. Prepare concrete decisions/design only where dependent behaviour actually changes. The engineering choice of a library is not a business decision; private display/persistence/retention and new visibility rules are. No elapsed time or generated field implies consent.
4. Implement only authorized ready work, retain current authority/recovery and measure the connected result. If a dependent choice/access/evidence is unavailable, state the exact limitation and continue independent authorized work; do not silently substitute a feature or colour pass.
5. Record what changed, expected/actual and limitations, including unresolved role/hosted/cost/physical-device/security scope. Preserve earlier source/local/hosted/Owner evidence rather than rewriting historical receipts.
6. Update the row's current next action and all separate delivery gates. When the declared scoped checkpoint is evidenced, record its reference, explicitly set its routing state to `checkpoint_passed` and designate the next primary `current`. Do not infer an Owner acceptance/security gate from tests or deployment. If scope/order changes, update routing/dependency gates and explain the change rather than skipping a queued row invisibly.
7. Maintain the affected action/loading matrices, factual HTML/captures and linked master/redesign/handoff pointers. Source/runtime/policy records own their own facts; do not copy a conflicting second status narrative into every file.
8. Run the generator and structural/canonical/review checks. The generated current-priority heading and ordered sequence must match the tracker. The reusable Owner instruction remains **“Continue from the living continuation prompt.”** This is a repository handoff mechanism, not a scheduled autonomous job.

## Document responsibilities

| Record | Owns |
|---|---|
| This guide + tracker | Current routing, scoped dependencies and separate delivery status |
| Working-behaviour contract | Required operating states, ownership and exact pending WB-P choices |
| Working-day specification + CSV | Planned scenarios/volumes and proper-layer acceptance evidence requirements |
| Master plan / roadmap / redesign | Overall scope, sequence/dependencies and approved visual/workflow reference |
| Findings + service impact | Problems, declared closure scope and measured/modeled/unmeasured cost facts |
| Action/loading/security matrices | Existing canonical joins, resource bounds and affected authority/acceptance coverage |
| Dated implementation/pilot packet | Actual source/change/test/rollout results and limitations |
| Factual HTML | Current real-component captured experience, with captured/uncaptured limits |
| AGENTS / builder/setup entry points | Mandatory reading and current-authority routing, not a second runtime status database |
| Generated continuation prompt | A current copyable projection of the tracker; never hand-maintained status or policy acceptance |

Every implementation packet names authorization, finding/action/screen/requirement IDs, trust boundaries, affected files, expected request changes, tests, rollback and evidence. Record source commit/working changes and actual deployment receipt; source/local checks do not imply hosted proof. Commit/push only a reviewed coherent batch under existing staging authorization; automatic deployment upon push does not prove the resulting alias/runtime or acceptance.

## Historical implementation checkpoints — retained evidence

The entries below are dated history. Their next-step sentences are superseded by the current tracker routing above. Reuse compatible evidence; do not restart these completed checkpoints.

[EX-01 scope and evidence](../07-handoff/request-remediation-ex01.md) contains the released first bounded checkpoint. EX-02 is the next engineering scope, including focus/click timing and remaining domain adoption; its exact state is in the tracker. No working-feature acceptance is fabricated. Broader independent security, private-cache decisions and all-role runtime gaps remain open.

EX-02 has a [Programs routing/visible-return checkpoint](../07-handoff/request-remediation-ex02.md). Continue its exact-source rollout and hosted evidence before extending other domains. The parent remains partial; dirty native history/focus-click timing and the shell hypothesis are not closed.

EX-02 continuation1November2026: [whole-program planning checkpoint](../07-handoff/request-remediation-ex02-planning.md) follows the scoped Programs release. Preserve both packets’ evidence and use the tracker for the newest status; no whole finding is closed.

EX-02 People continuation1November2026: [visible-return packet](../07-handoff/request-remediation-ex02-people.md) follows Programs/planning. Use the tracker for newest delivery states; previous receipts remain evidence.

EX-02 Development continuation1November2026: [visible-return checkpoint](../07-handoff/request-remediation-ex02-development.md) follows People. Only lifecycle pairing is in scope; EX-03 crash identity and EX-04 detail/list waterfall stay separate. Use the tracker for release/hosted status.

EX-02 Guardian-training continuation1November2026: [visible-return checkpoint](../07-handoff/request-remediation-ex02-guardian-training.md) follows Development. Reconnect stays fresh; no ended link is restored for this maintenance. Positive hosted G02 remains distinct.

EX-02 entry/appointment continuation1November2026: [checkpoint](../07-handoff/request-remediation-ex02-entry-appointments.md) measures onboarding and Guardian/Trainer fast returns with dirty/unknown guards retained. Use the tracker for release status; parent findings and shell/native-history measurement gaps remain open.

Visible continuity checkpoint1November2026: [Home/Calendar/dated task wait ownership](../07-handoff/request-remediation-ex02-task-continuity.md) removes a redundant Home bootstrap on known-day Owner entry and a hidden date-directory wait on explicit task returns. Track exact-source/local/hosted states separately; private masking, direct cold fallback and remaining shell/native-history gaps stay visible.

EX-02 local-control continuation2November2026: [search/language during authority checks](../07-handoff/request-remediation-ex02-local-controls.md). Preserve search identity/focus without stale private content and process local locale before route guards; private geometry/shell/loading, role/performance and exact-source release gates remain distinct.

EX-02 geometry checkpoint2November2026: [measured scroll clamp and denial follow-up](../07-handoff/request-remediation-ex02-geometry.md). Same-node collapse is measured independently from the still-open intermittent auth/permission denial; tracker retains separate release/hosted/acceptance gates.

EX-02 header checkpoint2November2026: [Home/Calendar control-position stability](../07-handoff/request-remediation-ex02-header.md) extends the six Calendar scroll cases to bounded Home and Calendar control geometry. Keep prior release receipts and use the tracker for current delivery gates.

EX-02 long-list continuation2November2026: [Calendar task return position](../07-handoff/request-remediation-ex02-return-position.md) tests40-row date/Back and history separately from selection. Numeric navigation coordinates restore after authority; no private projection cache. Use tracker for release/hosted gates.

EX-02 dated-resume2November2026: [individual-date pairing](../07-handoff/request-remediation-ex02-dated-resume.md) completes this bounded listener adoption after visible Calendar return work. Event-pair request counts remain distinct from whole-app visible performance and the unproven shell hypothesis.

EX-02 shell/identity2November2026: [measured ownership and limits](../07-handoff/request-remediation-ex02-shell-identity.md). Route shell remount is confirmed locally but provider causality is unproved; no layout rewrite. The next concrete dependency batch is EX-04 cold Calendar while residual EX-02 hosted role/history/G01 gaps remain visible.

Latest EX-04 dependency checkpoint: [cold Calendar evidence and implementation contract](../07-handoff/request-remediation-ex04-cold-calendar.md). The measurement is complete at its declared fictional Owner/local scope; the bounded current-period read implementation is next. Do not repeat the baseline or treat local timings as hosted performance. NR06, role/cancellation/query evidence and prior gates remain open.

EX-04 Owner cold implementation now follows [current-period receipt](../07-handoff/request-remediation-ex04-current-calendar.md): local passed; staging schema applied after backup/restore; finish app rollout and hosted checks before claiming delivery. Historical baseline packet remains evidence, not the next work instruction.

EX-04 Owner rollout verified2November2026: [hosted completion receipt](../07-handoff/request-remediation-ex04-current-calendar.md) records exact10bbda7 source, both CI passes, staging alias, EN/AR1read entry and foreign403 recovery. Next bounded engineering checkpoint is EX-03 storage-denied/crash recovery reproduction and contract preparation. Keep remaining EX-02/04 role/provider/cancellation/query and Owner/security gates open.

## EX-10 architecture checkpoint —2November2026

The [actual-source pilot architecture and consolidated decision packet](../04-engineering/working-day-pilot-architecture.md) now maps resource/draft/recovery ownership, first/repeat/return/save request ceilings, affected-view invalidation, mechanism options and exact proposed WB-P01–P04 scope. Its linked EN/AR storyboard is fictional changed-state review only. Source preparation is complete at this bounded scope; policy/design review is pending and the tracker remains EX-10 current. No runtime cache/provider/schema/visibility or working-acceptance change is inferred. Follow the generated current next action rather than repeating this preparation.
