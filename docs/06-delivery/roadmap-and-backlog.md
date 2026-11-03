# Delivery roadmap and dependency-ordered backlog

3November scoped execution: [EX-04 coherent register transfer](../07-handoff/register-download-checkpoint.md) is implemented and locally tested with fictional data, inactive in the app. The [single tracker](experience-execution.csv) selects EX-03 original transport/restart/receipt recovery. Real key/current authority/fields/time, directory/month/other-role adoption, hosted/Owner/security and the broader roadmap remain open.

## Latest local-first direction — LF-v3,2November2026

Owner now requests retained permitted month/three-month datasets **and locally saved offline edits with reconnect synchronization**. No inactivity lock or proposed24hour read cutoff. Read-replica cleanup after30days without successful online verification or explicit logout is selected; pending operations/unsent edits are a separate recovery class. Read [the canonical plan](local-data-and-sync-plan.md) and [offline-edit/conflict contract](../04-engineering/offline-edit-and-conflict-contract.md). Exact device/key/field and per-command deadline/conflict/logout design remain gated; timestamps alone cannot decide competing edits. Current online commands and prior business/security evidence remain unchanged until each accepted slice is implemented. Historical online-only-target statements below are superseded at the direction layer, not retroactively changed runtime facts.


## Persistent local data and synchronization — LF-v2,2November2026

Use the [working-behaviour contract](../03-design/academy-working-behavior-contract.md), [working-day acceptance](academy-working-day-acceptance.md) and [planned cases](academy-working-day-cases.csv) with the current tracker.

Owner clarified persistent permitted datasets across normal visits, progressive player-directory/month preparation and quiet change synchronization. This is now core experience architecture, not a memory-only summary pilot or an optional native-app prerequisite. Read [local-data and sync plan](local-data-and-sync-plan.md) and [Shift staging iOS source review](../04-engineering/shift-ios-local-data-reference-review.md).

Follow the single current row in [experience-execution.csv](experience-execution.csv): EX-10 revised local-data/access/transport design → EX-02 workspace → EX-06 durable repository → EX-04 resumable bootstrap/change sync → EX-03 original-operation recovery → EX-11 connected/reopened-local acceptance → EX-07 remaining Charcoal parity. EX-05/08/09 run alongside. Existing source, prior functional/visual approvals and release evidence remain.

The unaccepted WB-P01–P04 summary-only/30second/5minute/intent-only recommendations are superseded. LF-P01–LF-P06 exact field/device/access/retention/sync choices still need review; offline writes, finance, new roles, production, real data and access grants are not inferred. No runtime persistence exists from this documentation update. Older dated source/evidence notes below remain historical within their own scope.


## Current bounded slice — 26 October 2026

The approved Owner-only I3a full-period/weekday-time draft-program implementation is locally verified. [Current source/evidence and separate rollout/acceptance status](../07-handoff/i3a-program-implementation.md). Assignments, enrollment/capacity, publication and attendance remain later steps; no whole scheduling requirement is closed.

## Current tracked implementation plan — 24 October 2026

Use [the unified app implementation plan](app-implementation-plan.md), [screen register](app-implementation-screen-matrix.csv), [action register](app-implementation-action-matrix.csv) and [requirement joins](app-implementation-requirement-links.csv) for the next slices. These connect the compact-blue design to actual source/evidence, preserve all scope and keep design, implementation, verification, deployment and owner approval separate. The older proposed backlog below remains historical planning; assess existing M1 work before repeating it.

The objective is a fully working, accepted web application against an agreed release scope, followed by the retained expansion/native vision. “100% working” means every in-scope workflow has accepted behavior, evidence and recovery; it cannot honestly mean a guarantee of zero future defects.

## Delivery approach

Current M1 work item: [repository assessment and first decision/design packet](onboarding-m1-decision-design-packet.md), with a connected synthetic prototype. Policy/design accepted by Moamen on 22 October 2026; [M1 implementation evidence](../07-handoff/onboarding-m1-implementation.md) records source/local progress and pending staging configuration, privileged provisioning, hosted verification and journey acceptance.

Build vertical slices that include screen, permission, database operation, audit, recovery and tests. Do not finish a large collection of disconnected screens and then add the business rules. Resolve the policy for the next slice before its implementation; unrelated unresolved future choices do not stop safe foundation work.

| Stage / work package | Deliverable | Dependencies | Exit evidence |
|---|---|---|---|
| 0. Documentation and setup decisions | This handbook, provider configuration records, prioritized open decisions | Owner review | Required pre-development decisions recorded |
| 1. Repository and environments | Reproducible app, CI, protected staging, secret boundaries | Stage 0A/B | Fresh developer/CI setup without production secrets |
| 2. Identity and tenant foundation | Clerk bootstrap, memberships, six roles, permission catalog, RLS | 1 | Two-tenant direct/API/browser isolation and revocation |
| 3. Design and localization foundation | Workspace shell, tokens, components, EN/AR/RTL, loading/error states | 1; roles from 2 | Keyboard/phone/RTL representative flow |
| 4. Academy and people | Branch/sport setup, players, guardians, staff, invitations, onboarding | 2/3; D-002/003/004 | Owner setup through guardian/trainer access |
| 5. Training operations | Programs, dated sessions, capacity, rosters, assignments, changes | 4; schedule policies | Concurrent enrollment, overnight conflict and history preservation |
| 6. Online attendance pilot | Capture, scan/manual parity, corrections, trainer Today | 5; D-012 | Real staging session completed by each permitted role |
| 7. Pilot family experience and basic progress | Guardian/player schedule, published evaluation basics | 4/6; D-013 | Correct linked-child visibility and publication |
| 8. Family finance | Approved fee policies, bills, receipts, allocations, reversals/refunds | 4/5; D-001/005/006/007 | Reconciled reference cases and failure/retry evidence |
| 9. Trainer compensation | Effective contracts, calculation, approval, statements/disbursements | 6; D-008/007 | Reference earnings and owner-only approval |
| 10. Platform commerce | Catalog, entitlements, invoices, manual proof, selected gateway | 2; D-009/010 | Test-mode settlement/reconciliation and restrictions |
| 11. Media, support, inventory, communications | Private objects, messages, movements, recipient-safe delivery | 4/5; privacy/channel policy | Object/record recovery and truthful delivery |
| 12. Reports and privacy | Complete search/export, definitions, retention/deletion workflows | Domain sources stable | Multi-page/snapshot export and deletion recovery |
| 13. Offline attendance | Durable queue, schema upgrades, reconnect and conflicts | 6; D-011 | Physical offline tests and no silent lost marks |
| 14. Commercial hardening | Load, security review, backup restore, observability, live configuration | 8–13 required scope | R1 release gates and owner acceptance |
| 15. Required expansion | Advanced channels, approved public media, deeper inventory/reporting | R1 stable; D-018 | Separate feature acceptance, no silent scope retirement |
| 16. Native platforms | iOS/Android priority journeys; optional desktop | Stable API; D-020 | Device/offline/store/signing evidence per platform |

## Sprint-level working pattern

For each two-week planning cycle, select a small number of end-to-end outcomes and list requirement IDs, open decisions, acceptance cases and demo accounts. First agree the business examples and API/data transitions; then build the narrowest complete path; then inject failures and test role boundaries; finally demonstrate with synthetic users. Update requirement status with evidence and preserve incomplete work explicitly.

Every story includes actor, active academy/role, starting state, input, permission, database transition, side effects, UI success/error/unknown/partial states, audit and recovery. A story without an acceptance case is not ready. “Create attendance page” is insufficient; “Assigned trainer records a mark once despite a lost response and sees its committed status” is a buildable outcome.

## Initial ready backlog

1. Establish versions, repository layout and blank environment contract; verify no production values enter PR builds.
2. Replay minimal identity/academy/membership migrations with two tenants and all role fixtures.
3. Implement native Clerk-to-Supabase staging integration and prove text-subject identity resolution.
4. Implement one permission-checked read and one idempotent mutation, with audit and operation lookup.
5. Build Workspace shell and role chooser in EN/AR with selected theme tokens.
6. Create academy + default branch + configured sport atomically and prove failure recovery.
7. Invite trainer and link guardian without mutating unauthorized identities.
8. Create one dated session, roster and assignment; prove concurrent capacity and trainer visibility.
9. Record attendance online, reconcile a lost response and approve a correction atomically.
10. Complete a real staging owner→trainer→guardian journey before expanding financial scope.

## Estimates and staffing assumptions

Planning estimate, not a commitment: with two experienced full-stack engineers plus part-time product/design and QA, allow roughly 4–6 weeks for foundation, 6–10 additional weeks for an operational pilot, 12–20 additional weeks for full commercial workflows/hardening, and a separately estimated native phase. Several modules can overlap after stable contracts; provider onboarding, unresolved policy or privacy review can extend the calendar. A solo developer should re-estimate based on actual first-slice throughput rather than dividing this plan mechanically.

Re-estimate after stages 2 and 6 using observed delivery and defect/recovery work. Do not trade away permission, financial integrity, backup or privacy gates to preserve an arbitrary date. Optional expansion is staged openly with owner agreement.

## Dependencies and change management

The critical path is identity/tenant authority → people/relationships → dated schedule → attendance → finance/evaluation/reporting → recovery and acceptance. Cross-cutting design, CI, observability and privacy start in foundation. Native work depends on stable API/versioning and offline contracts, not merely a finished website screenshot.

If scope changes, update the release map, requirement row, affected tests, provider needs and estimates together. A requirement is complete only when its declared evidence passes and the appropriate owner accepts it. “Source implemented,” “deployed,” and “accepted” remain separate milestones.

## Added platform operations workstream — 22 October 2026

Deliver the [Platform Owner Services & Operations vision](../03-design/platform-owner-services-and-operations.md) after explicit platform authorization: read-only inventory/health/freshness and dependency impact first; usage/limit/cost observations next; incidents/recovery evidence next; approved audited actions last. Build alongside onboarding, then require production evidence at commercial hardening. Do not buy plans, grant platform access or fabricate provider data as a shortcut.

## Experience design gates — 22 October 2026

The [experience blueprint](../03-design/experience-blueprint-and-journey-governance.md) and [journey register](../03-design/journey-register.csv) are the companion product matrix. Map responsibilities, global navigation and cross-role journeys now; detail each upcoming slice before coding. Each cycle includes actor/policy review → action contract and connected prototype → owner design review → complete implementation → failure/accessibility/isolation checks → staging role demonstration → explicit acceptance. Do not count prototype approval as deployed acceptance.

The first proposed build milestone is Platform Owner creates a synthetic academy → appoints Academy Owner → invitation acceptance → restricted workspace and resumable branch/sport setup. D-002/D-003 must be resolved for this slice. Existing provider/identity setup is preserved; initial backlog items already implemented must be assessed against current evidence rather than repeated automatically. A clickable prototype is required work, not delivered by the planning document.

## Experience and performance design pass — 22 October 2026

Before the first feature slice, expand its [screen/data matrix](../03-design/screen-data-loading-matrix.csv) contracts and prototype role-prioritized loading/recovery. Follow the [five-dimension plan](../03-design/experience-performance-and-data-loading.md): usability, speed, correctness, cost and recovery. Measure the first synthetic academy-onboarding slice, then the trainer/guardian operational chain. Revise proposed budgets from evidence; do not build a speculative platform-wide cache or treat prototype speed as runtime evidence.

## SaaS operating readiness

Use the [operating blueprint](../01-product/saas-operating-blueprint.md) with each slice. Detail academy state transitions, authority/ownership recovery and the first pilot chain before onboarding implementation. Exercise difficult scenarios OPS-01–OPS-10 as their modules enter scope. Real academy admission, irreversible data actions and production launch retain their explicit gates; this planning document is not rollout approval.

## Engineering charter and continuous security

Apply the [engineering charter](../00-governance/engineering-charter.md) at every work package. The [security milestone matrix](../04-engineering/journey-security-review.md) adds design/build/verification/staging/acceptance/release and post-change gates; expand [journey security coverage](../04-engineering/journey-security-matrix.csv) to action-level cases. Documentation/PR review is a process gate; existing CI checks only its actual suites. Do not claim required branch protections or full security enforcement without verifying configuration.

I5a29 October 2026: reviewed narrative development feedback implemented and deployed to synthetic staging; scoped two-account hosted publication/withdrawal and exact temporary-access cleanup passed. [Implementation/evidence](../07-handoff/i5a-development-feedback-implementation.md). Working acceptance pending; AO-085–092 broader metrics/Player/export/notification requirements are not fully closed. Independent security/device/load/cost gates remain open.

I5a working-feature acceptance29 October 2026: Moamen explicitly accepted the working I5a development-feedback journey’s EN/AR wording and usability on 29 October 2026. Acceptance covers Trainer draft/submission, Owner return/publication, Guardian published-only reading and withdrawal. Independent human/security, broader hosted API/race, physical-device/accessibility and load/cost gates remain open. This grants no new access and does not close broader scored/Player/export/notification scope. Earlier acceptance-pending notes are historical checkpoints.
