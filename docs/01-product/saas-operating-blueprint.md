# AcademyOS SaaS operating blueprint

**Latest Owner review/role direction — 4 November 2026:** [Current staging policy](../00-governance/staging-delivery-and-review-policy.md) defers independent human/external security review without blocking any currently authorized synthetic staging work, including otherwise-authorized private offline activation. Keep actual engineering checks, access/configuration authority and separate acceptance. Follow [the dedicated-role plan](../06-delivery/staging-role-separation-plan.md): distinct Platform Owner and Academy Owner accounts/journeys first, controlled cleanup preserving history; no account/data mutation is authorized or executed by this documentation update. Earlier external-review prerequisites below are superseded, not marked passed.

**Current experience reference — 4 November 2026:** the Owner's selected [Operations contract](../03-design/operations-design-reference.md) and [full redesign plan](../06-delivery/full-experience-redesign.md) govern the working presentation: light default with Charcoal alternative, compact resizable panes, unified controls and connected role-specific tasks. This is an adoption layer over the business vision below, not a change to roles, transactions, fees or access. The [master plan](../06-delivery/app-implementation-plan.md) and [tracker](../06-delivery/experience-execution.csv) preserve both implemented journeys and unbuilt scope. Safe online redesign proceeds while private local-data activation/security remains separately gated.

## Persistent local data and synchronization — LF-v2,2November2026

Core operating experience includes permitted player-directory pages, selected-month training records and later separately authorized finance snapshots retained locally between visits. First task first, bounded sequence, durable completeness and quiet changes are required; unlimited database replication is excluded. [local-data and sync plan](../06-delivery/local-data-and-sync-plan.md) defines boundaries. Local read availability is separate from server-confirmed actions and future offline capture; no financial or role capability is implemented by the direction.

## Working-day execution overlay — 2 November2026

The [academy working-behaviour contract](../03-design/academy-working-behavior-contract.md) turns the existing role/operating vision into startup, task navigation, save/update, interruption, concurrency, failure and safe scope-change rules. Use the [execution guide](../06-delivery/experience-execution.md), [current tracker](../06-delivery/experience-execution.csv) and [working-day acceptance](../06-delivery/academy-working-day-acceptance.md). This preserves all business families and role boundaries below. The current live pilot uses Academy Owner capabilities; Manager/Player, finance and other unbuilt operations are future scope. No new private freshness/retention/visibility rule is accepted by this overlay.

Updated 22 October 2026. Owner: Moamen Ghareeb. Status: planning framework requested by the owner; lifecycle names and recommended policies are **proposals**, not implemented rules or blanket approval. Current staging proof is in the [setup index](../07-handoff/setup-index.md).

## Purpose and connected records

AcademyOS must be operable through admission, daily use, change, failure and departure. This blueprint connects product responsibilities to the [journey register](../03-design/journey-register.csv), [experience/performance plan](../03-design/experience-performance-and-data-loading.md), [delivery roadmap](../06-delivery/roadmap-and-backlog.md) and [open decisions](../00-governance/decisions-and-open-questions.md). Existing selected directions remain authoritative. Proposals below do not close D-001–D-022.

First resolve admission, authority/ownership recovery and the initial pilot outcome. Detail identity/family relationships before building people features; resolve finance and other domain rules before their dependent modules. Do not wait for every future commercial policy to finish safe design and synthetic staging work.

## 1. Academy lifecycle — D-002, D-009, D-015; J02/J04/J20/J26

Proposed business states: Applied → Under review → Approved/pending setup → Active → Restricted or Suspended → Closing → Closed. Rejected applications and withdrawn applications have explicit outcomes. These are business concepts requiring reviewed transitions, not a prescribed single database enum. Trial/subscription, onboarding completion, access suspension and data-retention status are independent dimensions; an expired trial is not equivalent to deletion.

| Transition | Proposed authority and checks | Required user experience and evidence |
|---|---|---|
| Application/admission | Platform Owner approval for the pilot; verify intended academy and owner | Explain pending/rejected status; no academy access from signup alone |
| Create and appoint owner | Explicit platform capability; verified intended recipient; idempotent creation | One academy per accepted operation; owner invitation and delivery have separate states |
| Complete setup | Academy Owner with current authority | Saved-record checklist, resumable branch/sport setup, clear missing prerequisites |
| Activate | Approved activation rules; onboarding and plan eligibility | Explain what is enabled; audit actor, reason and effective time |
| Restrict/suspend | Reason-specific authority, scope and policy; distinguish billing, security and owner request | Show permitted recovery/read/export routes and restricted actions; no destructive side effects by implication |
| Reactivate | Resolve underlying reason; recheck membership and entitlements | Do not simply restore stale permissions; record actual effective outcome |
| Close | Verified authorized request, obligations/holds/export and retention review | Clear timeline and consequences; archive, cancellation, anonymization and deletion are distinct operations |

Every transition needs an action contract covering concurrency, notification, existing jobs, private files, sessions, billing and audit. Determine what happens to in-progress attendance and already committed financial obligations. Permanent erasure requires its own approved policy and authority; closed academies are not automatically purged.

Recommended pilot admission: invite-led/Platform Owner approved. Preserve public applications as later scope rather than silently excluding them. This remains a D-002 decision.

## 2. Authority, ownership and recovery — D-003, D-021; J01/J03/J05/J27

Platform Owner is Moamen's explicit platform authority. Academy Owner is a tenant role. Neither role implies unrestricted visibility into private tenant content, nor does email matching or first signup grant ownership. Use fixed initial role templates and scoped capabilities as the recommended D-003 starting point; custom-role scope remains undecided.

Ownership transfer is a dedicated workflow: current authority verified → proposed successor verified → acceptance/review → atomic transition → old/new authority and pending approvals reconciled → audit and notification. Define whether more than one owner is allowed and how to prevent removal of the last recoverable owner. A generic staff edit must not transfer ownership.

For a lost sole-owner account, define evidence, reviewer, escalation, cooling-off/notification where appropriate and dispute handling before allowing administrative reassignment. Do not grant ownership because someone knows the academy name, can receive a forwarded email or asks support. Identity recovery and business ownership recovery are separate.

Support access is exceptional, explicitly scoped and audited; no impersonation is the recommended initial policy under D-021. Design safe diagnostics around operation IDs and redacted metadata. Future emergency access needs named authority, expiry, reason and review; this document grants none.

## 3. Identity, relationships and autonomy — D-003/D-004/D-015; J06–J08/J15/J26

One person may be a trainer, guardian and player across academies. Keep these concepts distinct:

- Global identity: who authenticated.
- Academy membership and branch scope: where and in which capacity they act.
- Player/staff domain record: the academy's operating record, potentially without a login.
- Verified guardian relationship: which child's permitted information they may access.
- Payer responsibility: which bills and payments they may manage; not inferred from guardianship.
- Consent authority: what consent they may provide, for which purpose and version.

Avoid global profile mutation through academy-local actions. Duplicate review must not disclose unrelated accounts/children. Imports can prepare domain records but cannot automatically grant accounts or guardian access.

For player autonomy, define age bands, country/context applicability, guardian approvals, permitted actions and transition rules. Do not hard-code an invented age threshold. An adult transition must explicitly review continued guardian visibility, payer obligations, historic consent and the player's new permissions; it must not destroy financial history or silently expose prior private notes. Disputed links require a reviewed restricted workflow, not an automatic winner.

## 4. Business rules, time and history — domain decisions D-005–D-013; J09–J19

Version rules that affect money, attendance, evaluation or compensation. Distinguish record creation time, actual event time, business effective date and academy timezone. A changed fee or trainer contract must not silently rewrite historical invoices/earnings. Rescheduling a future session must not erase the original change trail or mutate a completed session's facts.

Before each module, approve concrete examples, edge cases and correction authority. Financial postings use domain-specific adjustments/reversals rather than editable totals. Separate family billing, trainer compensation and platform commerce in language, permissions, ledgers and reconciliation. Never infer formula/tax/refund rules from reference software or a prototype.

For concurrent changes, specify version checks, atomic boundaries, duplicate/lost-response behavior and downstream recalculation. Notifications and external callbacks do not redefine a committed business state. Unknown settlement remains unknown until reconciled.

## 5. Plans, limits and restricted access — D-009/D-010/D-022; J20/J27

Before selling a plan, define prices/currency/taxes, trial length, grace, renewals, cancellation, refunds, meter units/reset, overage behavior and feature availability. These are open commercial decisions, not implied by staging provider quotas.

Entitlement asks whether an academy's plan permits a capability. Authorization asks whether this actor may perform it. Feature readiness asks whether it is implemented and enabled. All three must pass; a paid plan cannot grant a user an unauthorized role.

Recommended design principle: restrictions are explicit, reason-specific and recoverable; retain appropriate account recovery and lawful access/export routes under approved policy. Exact read/write allowances during payment failure or security suspension require review. Avoid automatic disappearance of records, unsupported promised exports or a blanket read-only switch that ignores emergency/security cases.

Subscription downgrade needs preview of excess usage, unavailable features, scheduled effective time and remediation. Preserve existing records; decide what future writes are blocked. Actual versus scheduled plan must be obvious. Enforce server-side limits atomically for concurrent enrollment/uploads; UI warnings alone are insufficient.

## 6. Data lifecycle and portability — D-015/D-016; J06/J21/J25/J26

Design import → validate/preview → duplicate/error review → commit → reconcile. Stage large imports as resumable authorized operations with per-row outcomes; retries must not create duplicate people or payments. Document supported formats and source mapping.

For each data class define purpose, owner, sensitivity, access, retention, archive/restore, export, holds and deletion consequences. Child records, financial evidence, support conversations, telemetry and private files need different treatment. Export includes declared complete scope and metadata, not only the currently visible page. Protect and expire export artifacts.

Deletion needs verified requester authority, retention/hold checks, dependent records, file derivatives, asynchronous work and backup policy. Restoring a backup must reapply a reviewed deletion/hold ledger so erased data is not unintentionally reintroduced. Backup immutability and expiry must align with policy; the accepted seven/30-day staging rule is not a production retention decision.

Portability includes database records, private object manifests and provider mappings. Authentication export constraints and credentials require an explicit migration plan. A local database restore or same-project file rehearsal is not whole-service production disaster recovery.

## 7. Your administration and support system — D-021/D-022; J02/J05/J20/J23/J27

Platform administration needs academy lifecycle controls, access governance, platform commerce, support, audit and the [Services & Operations section](../03-design/platform-owner-services-and-operations.md). Begin with observation and bounded approved operations. No generic “run SQL,” unreviewed impersonation, automatic upgrade or silent destructive cleanup shortcut.

Each support incident has severity, impact, safe customer description, primary operator, escalation, next update and resolution evidence. Collect redacted references rather than passwords, tokens or unnecessary child/financial screenshots. Ticket access does not automatically grant access to the whole tenant. Outage communication distinguishes confirmed facts, investigation and recovery; provider availability and application correctness are different.

Declare support hours/response expectations, backup operator and access-recovery custody before pilot. Do not promise 24/7 support or a service-level agreement without staffing and measured capability. Independent health/backup alerts remain useful if the app is down.

## 8. Tenant fairness, releases and change — J10/J12/J16/J21/J22/J25/J27

Limit resource use at appropriate actor/academy/operation levels, with global safeguards and fair queues. Test one unusually large academy alongside smaller academies. Bound exports, uploads, report work, import batches and notification campaigns. Define quota fairness and retry/backoff; do not let one task monopolize database connections or workers.

Protect essential integrity checks and recovery while optional heavy operations are deferred. Never drop attendance silently to meet a cost target. Follow the [loading matrix](../03-design/screen-data-loading-matrix.csv) for query bounds, freshness and cost evidence.

A release includes reviewed change, migration compatibility, test evidence, staging demo, rollout scope, rollback/forward-repair plan and user communication where needed. A feature flag does not replace authorization. Disabling UI cannot undo schema changes or financial side effects. Supported older/offline clients require a compatibility window and safe pending-operation treatment. Record implemented, deployed, verified and owner-accepted separately.

## 9. Difficult scenario register — exercise before the happy-path demo is accepted

| ID | Scenario | Required design/test outcome | Link |
|---|---|---|---|
| OPS-01 | Sole owner loses identity access | Verified business recovery with audit; no opportunistic takeover | J01/J05; D-003 |
| OPS-02 | Guardian linked to wrong child | Stop further access, review authorized correction, preserve incident/audit facts | J07/J26; D-004/D-015 |
| OPS-03 | Trainer leaves with pending offline marks | Revoked authority enforced; pending marks visibly rejected/reviewed under approved policy | J05/J14; D-011 |
| OPS-04 | Payment succeeds but return/callback is delayed | Unknown result reconciled before a replacement charge; one financial effect | J18/J20; D-007/D-010 |
| OPS-05 | Academy cancels but requires historical records | Reason-specific approved access/export/retention; no implied erasure | J20/J25/J26; D-009/D-015 |
| OPS-06 | Session change affects fees and earnings | Preview dependent effects; preserve history and reconcile approved adjustments | J11/J17/J19; D-006/D-008 |
| OPS-07 | Two staff take the last roster place | Atomic capacity enforcement and clear losing-operation recovery | J10; scheduling rules |
| OPS-08 | One academy starts a huge export during attendance | Bounded fair work; measure unaffected critical task budgets | J12/J25; performance contract |
| OPS-09 | Restored backup contains previously deleted records | Reviewed deletion/hold reconciliation before restored service exposure | J26/J27; D-015/D-016 |
| OPS-10 | Ownership transfer meets an active dispute | No silent authority overwrite; explicit review and notification policy | J05; D-003/D-021 |

These are acceptance obligations to expand into cases, not executed tests or new automatic permissions.

## 10. First pilot and acceptance — D-018

Recommended operational chain: Platform Owner admits a synthetic academy → Academy Owner accepts and configures branch/sport → staff/player/guardian relationships → dated program/session and assignment → trainer records online attendance → guardian sees the correct outcome. Include a second synthetic academy for isolation and restricted/revoked personas. Family finance stays synthetic until its policies and contracts are approved.

Before real participants, resolve production isolation, privacy/consent, support ownership, plan eligibility, security/recovery proof and launch approval. Select pilot academy/personas explicitly; do not infer permission to onboard real children from staging sign-in.

Evaluate each pilot journey independently on usability, speed, correctness, cost and recovery. Define workload and performance budgets, task completion without coaching, source reconciliation, negative access and failure evidence. Record actual limitations and defects. No made-up satisfaction percentage or calendar deadline is an acceptance target. Each required role gets a complete usable journey; success by the owner alone is insufficient.

## Decision order and build handoff

| Order | Decision packet | Ready output | What can proceed independently |
|---|---|---|---|
| 1 | D-002 admission and D-003 authority/ownership | Accepted onboarding actor/state rules, initial provisioning and recovery contract | Shared navigation, action prototypes, synthetic test design |
| 2 | D-004/D-015 relationship, autonomy and consent | Explicit link/payer/consent boundaries and age-transition decisions | Generic scoped directories without inviting real players |
| 3 | D-018 first pilot and D-012 scheduling/attendance rules | Named required journey outcomes, operating examples and acceptance actors | Nonfinancial session/attendance design |
| 4 | D-005–D-010 finance/commerce | Effective policies, reference cases, entity/provider choices and reconciliation | Other accepted nonfinancial modules |
| 5 | D-014–D-022 dependent operations and launch | Channels, retention/recovery, support, regions, budgets and release gates | Authorized staging development without real records |

For each packet capture selected alternative, rejected alternatives, consequences, accepted-by/date and affected journeys/requirements. The owner remains the decision maker; design/engineering prepares concrete examples and tradeoffs. This blueprint does not call for repeating completed infrastructure setup or buying more services before coding.
