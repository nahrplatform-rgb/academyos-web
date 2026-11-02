# Experience blueprint and journey governance

## Current operating-experience overlay — 2 November2026

Use the [working-behaviour contract](academy-working-behavior-contract.md) and [working-day acceptance](../06-delivery/academy-working-day-acceptance.md) for connected startup/first visit/return/save/interruption states. The [execution guide](../06-delivery/experience-execution.md) and [tracker](../06-delivery/experience-execution.csv) own current priority. Keep the later accepted Charcoal reference and each role's existing authority; historical palette/status/next-step descriptions below do not supersede those decisions. Existing visual approval does not approve new private reuse, persistent drafts or offline queues. Review changed behaviour at the appropriate connected-state boundary, preserving already approved journeys rather than restarting the complete design.

Updated 22 October 2026. Owner: Moamen Ghareeb. Status: **owner-requested planning direction; detailed designs, policy choices and usability results remain unaccepted until reviewed.** This document expands the role journeys and connects experience design to delivery. It does not claim that the planned journeys are implemented.

## Purpose and success

Every person should understand where to start, what they can do, what will happen, whether it succeeded and how to recover. A functioning screen alone is insufficient. AcademyOS must support complete work across people, devices, languages and service boundaries without making the user understand those boundaries.

Design the whole product's navigation and journey relationships early. Detail and validate the next buildable journey before implementation, refining shared patterns as evidence arrives. Avoid both disconnected screen construction and an attempt to finalize every future screen before learning from the first working journey.

The [delivery matrix](../06-delivery/roadmap-and-backlog.md) answers what is built when. The [journey register](journey-register.csv) answers whose outcome it serves. Requirement IDs, screen IDs, policy decisions and test evidence connect them. The register starts with action families; it is not a claim to enumerate every action. Before a family enters development, split it into individually reviewable actions with stable child IDs and separate acceptance cases.

## Role and responsibility map

| Person | Starting experience | Main responsibilities and handoffs | Authority boundary |
|---|---|---|---|
| Platform Owner — Moamen | Platform attention queue and service health | Approve/create academies, appoint owners, manage platform plans, investigate incidents and recovery | Explicit provisioning; separate from Academy Owner; no automatic access to private tenant content |
| Academy Owner | Academy priorities, setup progress and approvals | Establish branches/sports, manage academy staff and operating policies, approve permitted financial work | Own academy; platform administration is separate |
| Manager | Permitted branches, today's sessions and exceptions | Coordinate people, rosters, coverage and delegated operations; send restricted approvals onward | Branch and capability scope; no inferred owner financial authority |
| Trainer | Today, next assigned session, unfinished work | Attendance, assigned evaluations, correction requests; view permitted statements | Assigned sessions/players and explicitly permitted fields |
| Guardian | Authorized child switcher and next required action | View schedules/progress, manage authorized bills, respond to invitations and consent requests | Verified child relationships and separately defined payer/consent authority |
| Player | Personal schedule and development | View personal sessions and published goals; perform age-permitted actions | Login eligibility, consent and self-management remain D-004 policy decisions |
| Other delegated staff | Tasks supported by approved capabilities | Carry out narrowly assigned work | Planning persona, not an added role or authorization grant |

One identity can have multiple memberships and roles. Always make academy, role and branch context apparent. Switching context must clear incompatible selections, cached private projections and unfinished sensitive actions; warn before losing edits. Server authorization remains authoritative even when a menu or tab is stale. A suspended or revoked membership must not silently fall back into a different academy and execute the same action there.

## Navigation and first use

Use the selected Workspace/Light/18 px direction from the [design system](ui-ux-design-system.md). Shared interaction patterns should feel familiar while each role has a distinct task hierarchy. Platform and academy administration have clearly separate navigation. Trainer and family phone views prioritize immediate tasks over management charts.

A home page answers: what requires my attention, what is next, and what did I leave unfinished? Cards use real states and lead to filtered source records with academy/date context preserved. Suppress unavailable modules or explain their availability honestly; do not provide dead navigation to make the app look complete.

Setup checklists derive completion from persisted records. They are resumable, explain dependencies and do not reset completed work on refresh. First use, no membership, invitation pending, no assigned sessions and an empty newly created academy require different experiences. Returning users should resume useful work rather than repeat onboarding.

## The action contract — required before coding

Each atomic action or multi-step journey needs a short specification containing:

1. **Identity and purpose:** stable journey/action ID, actor, desired outcome and user-facing verb.
2. **Context:** academy/branch/role, starting state, entry points, prerequisites and blocked policy decisions.
3. **Authority:** who may view, edit, approve, export or undo; permitted fields and server enforcement. Entitlement, permission and implementation availability are separate checks.
4. **Happy path:** ordered steps, required versus optional input, sensible defaults, validation and review. State whether a draft is saved and where it can be resumed.
5. **Commit boundary:** exactly what records change together; concurrency/version rules; duplicate submission and lost-response handling.
6. **Consequences:** affected people, dated sessions, money, access, history, files, notifications and jobs. Explain material effects before confirmation.
7. **Handoffs:** sender, recipient, next action, pending state, expiry, escalation and what each party sees when rejected or withdrawn.
8. **Recovery:** correction/undo/reversal rules, permission revocation, interruption, stale edits, partial results and support reference. Never promise undo if only an audited compensating action exists.
9. **Completion:** recognizable result, destination, source record/status and next useful action. A toast alone is not evidence that all asynchronous work finished.
10. **Experience evidence:** screen references, phone/desktop, EN/AR/RTL, keyboard/screen-reader states, acceptance cases, tested build and review outcome.

Use this reviewable skeleton for each action:

```text
Journey/action ID and requirement IDs:
Actor, academy, role, branch and starting state:
Outcome and entry points:
Unresolved policy / readiness blocker:
Steps, inputs and review:
Permission and data projections:
Atomic change / duplicate / concurrency contract:
Notification and person-to-person handoff:
Success / pending / partial / failure / restricted states:
Correction, recovery and audit:
Screen IDs and localized copy:
Acceptance cases and evidence:
Design review / implemented / verified / owner accepted:
```

## Worked example — register a player and connect a guardian

**Purpose:** an authorized academy operator creates or selects the correct player record and establishes the intended guardian relationship without duplicate identities or accidental access. Relevant screens include S16–S19 and S21; authority/age rules depend on D-003/D-004. This is a proposed flow, not acceptance of those policies.

1. Start from Players or a scoped quick action. Keep the selected academy visible.
2. Search permitted existing records and show a duplicate review using only authorized fields. Never disclose a global account merely because an email was entered.
3. Enter essential player details. Explain why information is required; defer optional fields. Keep validation near the input and summarize errors accessibly.
4. Select an existing permitted guardian relationship or prepare an invitation. Make the relationship, proposed authority and recipient explicit. A matching email is not proof of guardianship.
5. Assign branch/program only where authorized and available. Explain capacity and any proposed fee effect. Enrollment, relationship verification and payment may have separate pending states.
6. Review the player, relationship and resulting actions. Create the atomic player operation once; do not report invitation delivery as part of a successful database save unless actually confirmed.
7. Show the saved profile and distinct enrollment/invitation states. Offer “View player” or a useful next action. Invitation failure allows a bounded retry without creating another player.
8. Guardian verifies the intended identity and accepts through the approved flow. Until then, no pending relationship exposes child data.

Exceptional cases must include duplicate player, existing guardian, wrong recipient/account, disputed relationship, expired/revoked invitation, lost response after commit, stale capacity, revoked operator access, archived player and notification provider failure. Relationship, consent and payer authority are distinct. Reassignment or unlinking must revoke corresponding access and preserve permitted history.

## Shared interaction rules

| Situation | Required experience |
|---|---|
| Create/edit | Essential fields first; stable labels; contextual examples; preserve valid input on failure; explain save versus draft |
| Search/filter | Scoped server results, visible filters and clear reset; preserve navigation context; failed loading is never “no results” |
| Approval | Explain requester, scope, evidence, consequence and current version; rejection has a reason and next step; no self-approval shortcut |
| Bulk action | Show selection scope/count and exclusions; distinguish current page from all matching results; preview material effects and report per-item failures |
| Financial action | Show amount/currency/payer and status; warn about duplicates; unknown settlement requires status verification before retry; use audited reversals |
| Schedule change | Show affected dated sessions, participants, trainer coverage, history and notification/fee effects; preserve historical facts |
| Upload/export | Show progress, private access, pending processing, expiry and partial failure; export covers declared scope rather than only visible rows |
| Archive/delete | Explain references, retention and access effects; offer restore only when supported; permanent actions need explicit authority and policy |
| Offline/interruption | Distinguish saved locally, queued, server accepted, rejected and conflicted; offline capture does not imply a committed mark |
| Access restriction | Explain a safe next step or approval route without revealing private record existence; do not make authorization depend on disabled buttons |
| Provider outage | Explain the affected user outcome, pending state and safe recovery; avoid raw internal errors; preserve independent functions where possible |

Do not automatically save consequential changes without a clearly specified interaction contract. Prevent repeated submission visually and enforce idempotency on the server. Use confirmations for meaningful consequences, not every ordinary click. Never conceal a risky side effect behind a generic “Continue.”

## State, language and accessibility coverage

For every journey specify initial, loading, empty, validation failure, saving, successful, pending external work, partial, failed, stale/conflict, unavailable and restricted states where applicable. Mark genuinely inapplicable states with a reason. Status is conveyed through words and icons, not color alone. Do not fabricate zero balances or empty schedules when data is unavailable.

Phone layouts preserve task priority and permit comfortable one-handed attendance use. Desktop tables can become focused lists/details on phones rather than compressed unreadable grids. Define tab order, focus after dialogs/errors/navigation, accessible names, error announcements and zoom/reflow. Test Arabic layouts with mixed-direction email/phone/IDs, long names, plural forms, dates, academy timezone and currency. Arabic copy needs native-language review; translation presence does not prove natural language quality.

Safety and clarity apply to children and adults. No public ranking, social visibility, independent minor consent, finance authority or unmoderated communication is implied by a player login. Resolve policy first and reflect it in both design and authorization.

## First buildable journey and design sequence

Start with **Platform Owner creates a synthetic academy → appoints Academy Owner → owner accepts → enters the correct restricted workspace → resumes initial branch/sport setup**. Preserve D-002/D-003 as explicit policy gates; invitation-only admission remains a recommended default until accepted. Platform Owner provisioning must be reviewed and audited, not granted to the first signup.

Before implementation: map responsibilities and navigation, detail the first action contracts, produce connected wireframes/clickable prototype including failure paths, review EN/AR phone/desktop behavior, and record owner design feedback. A prototype is planned and not yet delivered by this document.

Implement the complete vertical slice next. Verify persisted behavior, cross-academy isolation, revoked access, invitation expiry, duplicate submission and interrupted acceptance. Demonstrate it on staging with synthetic accounts. Record design approval, deployed verification and owner business acceptance separately.

Extend to the first operational chain: owner configures branch → staff/player/guardian relationships → dated session and assignment → trainer attendance → guardian sees correct result. Financial and compensation modules get separate examples and policies before implementation. Services & Operations develops alongside this chain using its [dedicated vision](platform-owner-services-and-operations.md).

## Review and acceptance gates

| Gate | Required output | Who reviews / evidence |
|---|---|---|
| Ready for design | Actor/outcome, policy dependencies, existing patterns and requirement links | Product/owner direction recorded |
| Ready for build | Action contract, connected screens, exceptional states, authority and acceptance cases | Design and engineering review; owner resolves business policy |
| Ready for staging demonstration | Working UI/API/database path, audit and recovery; representative accessibility and isolation tests | Executed evidence with build/environment/limitations |
| Accepted journey | Intended role can understand, complete, recognize result and recover without coaching | Role-based task observations plus explicit owner acceptance |

Moderated checks must cover Platform Owner, Academy Owner, Manager, Trainer, Guardian and Player when their journeys become available. Add dual-role, first-time, returning, revoked and restricted personas. Until real participants are appropriate, use role-based walkthroughs and label them as proxies, not genuine participant research.

Observe task success without assistance, wrong turns, abandoned work, wrong-academy mistakes, saved-state uncertainty and recovery success. Proposed targets from the role-journey document remain proposals until validated; do not invent measured usability scores. Record task, persona, device/language, observation, severity, remedy and re-test. An attractive screen cannot close an authorization or recovery defect.

## Coverage and change control

The journey register is the coverage index. Every visible action, deep link, notification action and scheduled user-facing handoff must eventually map to an action specification, requirement, screen and test. At milestone review, compare actual UI actions and API operations with the register to find omissions. A family row is not enough to claim every action covered.

Use separate status fields for design, implementation, verification and owner acceptance. New work begins as Planned/Not executed. Keep blocked policy, inaccessible provider evidence and untested states visible. Additions or removals update navigation, journeys, requirements, tests and delivery together. Acceptance of this planning direction does not approve every default, create an account, grant a role, launch production or retire future scope.

## Experience and retrieval contract

The [experience/performance plan](experience-performance-and-data-loading.md) and [screen/data matrix](screen-data-loading-matrix.csv) add five mandatory questions to every action: usability, speed, correctness, cost and recovery. Before coding, declare critical/deferred data, retrieval bounds, freshness/authority, invalidation, pending/failure states, workload and measurement budget. Design approval does not establish measured performance.

## Business lifecycle and difficult scenarios

The [SaaS operating blueprint](../01-product/saas-operating-blueprint.md) supplies academy admission/suspension/closure, ownership recovery, relationship/consent/payer separation and difficult scenarios. Design these as connected user journeys with explicit reason-specific restrictions and recovery. Business policy remains governed by the open decisions; a proposed state diagram or prototype cannot settle it.

## Security packet in every action contract

Add a [security review packet](../04-engineering/journey-security-review.md) to each upcoming action specification. Identify assets/trust crossings, misuse, prevention/detection/containment/recovery and negative evidence. Use the [family coverage matrix](../04-engineering/journey-security-matrix.csv) to avoid omissions. Security/privacy is an independent gate alongside usability, speed, correctness, cost and recovery, never an averaged score.
