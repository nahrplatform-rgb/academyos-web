# Compact blue design replacement — first application slice

24 October 2026. Explicit owner instruction in this chat authorizes replacing the old app visual design with the selected compact blue system and shared components. This is application implementation, separate from the earlier design-only task. Current source only; no deployment, commit, push, migration or provider change.

## Authorized outcome and contracts

Replace the old teal/large-card visual foundation across existing welcome/sign-in and M1 workspace/context, admission, invitation and initial setup surfaces. Create reusable React presentation/control components while preserving existing real behavior. Relevant actions: J01-A01, J02-A01, J03-A01/A02/A03, J04-A01/A02/A03; screens S01–S03/S06/S07/S13–S15/S21; AO-118/120/121/122/123/124/127/129 scoped presentation changes; L01–L03 unchanged. No operational prototype module is silently promoted to an implemented app feature.

Latest visual authority is the owner's selected HTML and follow-up explicit replacement instruction. Historical ADR-010/18px/teal choices are superseded for appearance, not erased as evidence. Compact density does not imply acceptance of every new screen or policy. M1 accepted admission/ownership rules and existing actual source remain authoritative.

## What changed

- Global semantic CSS tokens replace teal, oversized heading/card/controls with blue, neutral surfaces,22px headings,6px controls and8px panels. Muted text and input borders retain stronger contrast than pale decorative reference lines; no blanket enlargement.
- Desktop ordinary buttons31px, fields34px; phone at720px and below retains44px targets and16px form text. Mobile navigation remains available. Logical borders/padding and parent EN/AR direction preserved.
- Shared `WorkspaceShell` supplies presentation frame,43px desktop toolbar, decorative inert macOS lights,218px sidebar, valid/current navigation, language link, optional existing account control and one main landmark/skip link. It accepts existing navigation guards; it neither resolves identity nor grants authority.
- Shared native Button/Input/Select/StatusBadge forward native attributes, handlers, disabled/type/required/ARIA/dir/value/ref props. No new dependencies, effects, global caches or abstraction for hypothetical features.
- Welcome, Clerk sign-in route and all four onboarding modes use the same shell. Onboarding and timezone selector consume shared controls. Existing service-verification buttons use the shared Button; no checks/sends were run.
- ClerkProvider appearance is blue/compact presentation only; provider application/session/origin/redirect configuration is unchanged. Unconfigured sign-in remains unavailable with localized copy.

The selected frame is retained as a presentation wrapper, not a requirement for native clients or a newly enabled feature. Error/not-found/operator surfaces receive the shared CSS where their existing layout loads it; the framework-level global error component is otherwise unchanged.

## Trust boundaries and proportional security review

Presentation changes touch browser form semantics, keyboard focus, navigation/locale guards, Clerk child-button composition and recoverable unknown-state visibility. Existing session-keyed workspace/handoff lifetime, late-response guards, scoped operation storage, request body, endpoint, authorization, expected version, idempotency/reconciliation, receipt/audit/outbox and membership checks are preserved. No API/lib/database/worker/migration changes. No new private projection, secret, telemetry, provider call or stored payload.

Prevention: retain real native controls and their labels/required constraints, event/disabled props and identity-driven rendering. Shared shell propagates the existing unsaved-edit guard to its links. Account control is still the actual signed-in Clerk UserButton. No simulated role switch or prototype business state enters app source.

Detection/recovery: existing error/status text and operation reconciliation remain intact. Regression checks must cover sign-in handoff, disabled submission, native validation, lost response, conflict, revoked access and delayed old identity responses. Local green foundation checks are not independent security/hosted/UI acceptance. If styling impairs an action, forward-fix presentation or revert the source slice; no data/schema rollback is required.

Five dimensions: usability retains actual labels/navigation/recovery; speed adds only small shared rendering functions and no new reads/effects; correctness preserves current server operations; cost adds no services/dependencies/requests; recovery keeps pending/unknown/conflict behavior and unsaved-navigation checks. Performance and accessibility are not measured by a build.

## Verification — actual evidence

Supported Node24.14.0 used for final checks. Typecheck, production build, lint and31 existing unit tests passed. An earlier pass on host Node26 also passed but is not the supported-runtime evidence. npm reported an existing unknown `allow-scripts` configuration warning; checks exited successfully.

Existing UI harness assertions now specifically require compact desktop control heights (31px button,34px field, maximum36px) and retain44px phone targets. This intentionally updates visual expectations to the current owner instruction; no business result/assertion is removed or weakened. Its test report wording is updated accordingly. New shared-shell/control file hashes are included in future UI receipts.

**Browser tests, screenshot inspection, EN/AR phone/desktop keyboard/reflow and authenticated runtime checks were not executed.** Browser opening was attempted and failed because local browser use is disabled in Work settings. No headless/browser workaround was used. The existing UI harness and foundation E2E therefore remain required unexecuted gates, not passed checks. Native Arabic, assistive technology, physical-device, full security and owner acceptance remain separate.

Local production server runs on127.0.0.1:3105 with Clerk keys explicitly blank for a safe unconfigured preview. HTTP/source checks of welcome EN/AR and sign-in fallback are not visual proof. No real sign-in, create, accept, delivery, service-verification or hosted operation was performed.

## Remaining work

First source slice implemented; browser verification and owner visual review pending. This is not completion of all six design batches in the functional app. Existing admission/list layouts still retain their working structure; subsequent bounded slices can bring list/table/detail arrangements closer to the selected reference after rendered review. Planned domains retain their own policy and implementation gates.

Keep [prototype design status](../../design/experience-prototype-v1/README.md), [current decisions](../00-governance/decisions-and-open-questions.md), [journey contracts](../06-delivery/onboarding-m1-decision-design-packet.md) and [security gates](../04-engineering/journey-security-review.md) separate from this implementation receipt. No deployed or owner-accepted status is changed by these source edits.

## Tracked continuation

The [unified implementation plan](../06-delivery/app-implementation-plan.md) and its screen/action/requirement registers now connect this source slice to the wider design and functional roadmap. The first gate remains rendered/behavior verification of the local visual source; later domains require real authoritative operations and their named policy/security/acceptance cases. The documentation mapping is not another app implementation or deployment.

## Implementation-chat integration — 24 October 2026

The [integration receipt](compact-blue-integration-verification.md) supersedes the unexecuted local browser status above for the current source. Production/development M1 harness and five foundation E2E cases pass; welcome EN/AR desktop/phone screenshots are retained. Phone language/brand targets are corrected. Authenticated compact-blue staging verification, physical-device checks and owner visual acceptance remain pending. No staging deployment is implied.

### Current owner correction — 24 October 2026

The red/yellow/green macOS window controls are excluded from the web app and active prototype by explicit owner instruction. Earlier retained-frame descriptions and original reference assets are historical; keep compact blue styling and genuine web navigation. The original reference files are preserved unchanged.

### Scoped owner design approval — 24 October 2026

Moamen approved the shown compact blue M1 journey after the web-toolbar correction. See the [exact approval receipt](compact-blue-integration-verification.md). Earlier pending visual-approval status is superseded for this shown M1 subset only; deployment, authenticated staging verification and broader acceptance remain separate.


## Owner correction — reference is the structural foundation (25 October 2026)

The Owner clarified that the original `AcademyOS_MacOS_Reference_Matched.html` is the exact visual and interaction foundation, not only a blue/color inspiration. The first implemented-journeys review prototype underrepresented the third contextual pane and is superseded as a layout proposal. Its useful recovery, wording and accessibility findings remain review inputs.

Preserve the reference's compact desktop workspace: **navigation sidebar → central work area/list → contextual inspector with selected details and actions**. Preserve the compact toolbar, semantic table/list density, selected-row treatment, restrained spacing and inspector action placement. Mirror the structure in Arabic RTL. On phones, adapt it into connected list/detail views with labelled Back, preserved selection/draft and deliberate focus return; do not squeeze three columns onto a phone. Forms and narrowly restricted views retain their domain-specific content and permitted projection. The right pane is contextual, not a reason to invent extra information or duplicate a narrow profile into a fake dashboard.

The existing exclusion of imitation red/yellow/green macOS window controls remains in force. Reference example documents, activity, totals, subscriptions, role powers and other unimplemented features are not business authority. Current accepted policies, authoritative operations, permissions, audit, persistence and unknown-operation recovery remain unchanged.

Corrected design: [reference foundation contract](../../design/implemented-journeys-review-2026-10-25/reference-foundation-contract.md), [connected prototype](../../design/implemented-journeys-review-2026-10-25/prototype/index.html), [implementation handoff](../../design/implemented-journeys-review-2026-10-25/implementation-handoff.md). The Owner's instruction to follow the reference is recorded; approval of the corrected rendered design remains pending. Owner design review precedes dependent functional implementation. This correction changes design/documentation only, with no release or whole-app acceptance implied.

## Later structural correction — 25 October 2026

Owner confirmed the original-reference sidebar/center/inspector foundation, beyond the earlier blue palette integration. See [the implementation receipt](reference-refinement-implementation.md) for actual current source, test/rollout status and outstanding working visual acceptance. Earlier acceptance statements retain their original scope.
