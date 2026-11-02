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

Owner priority: visible Home → Calendar → session → Back continuity within EX-02, measuring EX-04 dependencies as needed. Preserve the remaining listener/dirty/native-history/recovery work; do not mistake another request-count improvement for visible app-wide smoothness. After this priority, follow remaining tracker actions/dependencies. Change this priority explicitly in the generator and this guide when fulfilled or superseded.

## Order and execution rules

1. EX-01: proven internal routing and Home/Calendar resume/task continuity, without stale-private caching. Retain useful nonprivate structure, filters and selection identity; mask private data while current permission is checked. Normal current-authority reads and write guards stay canonical.
2. EX-02: extend routing/resume patterns to remaining domain occurrences after their dirty/unknown/approval cases are inspected. Prove shell remount cause before any authenticated-layout rewrite.
3. EX-03: Development crash identity and inconsistent recovery-storage failure cases, using opaque scoped references/discoverability without private draft persistence.
4. EX-04/05: measure and reduce cold Calendar/detail waterfalls and internal SQL work; retain signed chains, authoritative totals, timezone and current authority. No index or limiter removal from hints alone.
5. EX-06: choose narrowly scoped cache coordination after measured need and private freshness decisions. EX-07: remaining Charcoal journey parity. These share foundations but retain independent acceptance.
6. EX-08/09: remaining live-role/device/performance/provider measurements and privacy/offline decisions. Do not silently restore test access or enable telemetry. Offline operating writes remain a separately accepted capability.
7. Continue master-plan features through these standards as the dependencies allow. This is not a requirement to finish speculative caching/offline features before all development; safe independent work continues.

Every implementation packet names authorization, finding/action/screen/requirement IDs, trust boundaries, affected files, expected request changes, tests, rollback and evidence. Record source commit/working changes and actual deployment receipt; source/local checks do not imply hosted proof. Commit/push only a reviewed coherent batch under existing staging authorization; automatic deployment upon push does not prove the resulting alias/runtime or acceptance.

## Current packet

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
