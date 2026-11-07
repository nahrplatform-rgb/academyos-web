# Experience prototype implementation handoff

23 October 2026 · Design-only handoff · First connected batch: Journey A.

This folder is a separate design artifact. Functional implementation remains in `apps/web`; no files in the application, database, provider configuration or canonical requirement evidence are changed by this handoff. Do not transplant the reference monolith or this synthetic prototype into production. Review its domain contracts, then adapt stable application components through a separately authorized bounded change.

## What governs the next implementation

1. Current owner instruction and [engineering charter](../../../docs/00-governance/engineering-charter.md).
2. [Accepted M1 choices](../../../docs/06-delivery/onboarding-m1-decision-design-packet.md), [decision register](../../../docs/00-governance/decisions-and-open-questions.md), [identity workflow](../../../docs/02-workflows/identity-and-tenancy.md) and [people/setup workflow](../../../docs/02-workflows/academy-people-and-onboarding.md).
3. The owner's selected compact blue reference for appearance, followed by this folder's visual specification and [batch action contracts](batch-1-action-contracts.md).
4. Existing source and current receipts as evidence of what already works and what remains unverified. Sample records in any HTML are fictional examples, not permission or business policy.

The new compact blue visual direction supersedes older green/teal and blanket 18-pixel-card instructions for this design. Preserve historical ADR-010/AO-123/AT-123 wording as history until a separately reviewed canonical reconciliation; do not claim the old token-specific acceptance passed. The simulated macOS frame is retained as presentation, not assumed final web chrome. A changed frame treatment needs an explicit design decision.

## Current evidence, read-only inspection

Repository HEAD inspected: `0bf5024fdae0621b686fccf1feee417be126b898`. This is a source snapshot, not a deployment verification. No provider or actual private record was accessed for this design task.

Current source contains bounded context/admission reads, create and invitation-review/acceptance operations, branch/timezone and sport save, completion, invitation retry/reissue/revoke, and operation lookup. Source inspection confirms staged identity handoff, current subject resets, late-response guards, safe scoped operation recovery and explicit loading/denied/unknown states. It does not constitute a new runtime test.

Historical receipts progress beyond the early M1 proposal table: source and scoped staging work exist. The [abuse-control receipt](../../../docs/04-engineering/onboarding-m1-abuse-control.md) records deployed `e32f7db`, a gate migration, scoped A/B checks, and Product Owner acceptance of that delivered fix on 23 October. It explicitly retains independent security review, outstanding device/load/cost/provider cases and full M1 acceptance as open. Do not repeat earlier “not deployed” prose as current, and do not turn this one fix approval into whole-product acceptance.

The current [journey register](../../../docs/03-design/journey-register.csv) records accepted M1 wording/usability with incomplete families J01–J05; the [security matrix](../../../docs/04-engineering/journey-security-matrix.csv) retains their family gate as open. This new visual prototype has its own review and owner-approval status; it inherits neither security closure nor approval from those historical receipts.

## Map designs to existing boundaries

| Action / view | Requirements and loading | Existing implementation to inspect and reuse | Required acceptance / security |
|---|---|---|---|
| J02-A01; S06/S07/S21 create/review/receipt | AO-003/008/011, L02 | OnboardingWorkspace platform mode; API create/platform; `m1_create_academy_v1`, `m1_platform_list_v1`; existing delivery dispatch | AT-003/008/011; M1-T01/02/03/05/06/10; SEC-J02 |
| J03-A01; S01/S02 review/identity handoff | AO-005 and safe entry, L03 | WorkspaceHandoff route lifetime; signed-out entry; encrypted invitation cookie; API exchange/review; recipient proof | AT-005; M1-T04/09/10/12; SEC-J03 |
| J03-A02; S02 accept/receipt | AO-005/006/007/008, L03 | API accept; `m1_invitation_v1`; receipt/reconciliation; subject-keyed private workspace | AT-005/006/007/008; M1-T04/05/06/07; SEC-J03/05 |
| J01-A01; S03 choose context | AO-002/003/004/009, L01 | Context mode; `m1_context_v1`; bounded paging; safe context change | AT-002/003/004/009; M1-T01/02/03/09/13; SEC-J01 |
| J04-A01; S13/S14/S15 branch/timezone | AO-003/004/011/019, L02 | Setup mode; TimezoneSelect; API save step branch; `m1_save_setup_v1` | AT-011/019 plus denial; M1-T01/02/03/06/08/12; SEC-J04 |
| J04-A02; S13/S15 sport | AO-003/004/012/019, L02 | Setup mode; API save step sport; current localized labels | Partial AT-012; M1-T01/02/03/06/08/12; SEC-J04 |
| J04-A03; S13 completion/receipt | AO-011/019, L02 | Setup review; save step complete; same-academy association/version transaction | AT-011/019; M1-T05/06/08; SEC-J04 |
| J03-A03; S07/S21 delivery and invitation management | AO-005/006/008, L03 | API retry/reissue/revoke; `m1_manage_invitation_v1`; existing outbox/generation/lease handling | AT-005/006/008; M1-T03/05/06/07/10/11/14; SEC-J03/05 |

Primary source entry points: [workspace](../../../apps/web/src/components/onboarding-workspace.tsx), [API route](../../../apps/web/src/app/api/onboarding/route.ts), [timezone selector](../../../apps/web/src/components/timezone-select.tsx), [server transport](../../../apps/web/src/lib/onboarding-server.ts), [gateway](../../../apps/web/src/lib/onboarding-gateway.ts), [recipient/token helpers](../../../apps/web/src/lib/onboarding.ts), [invitation cookie](../../../apps/web/src/lib/invitation-cookie.ts) and [delivery](../../../apps/web/src/lib/onboarding-delivery.ts). Inspect migrations in order; a later repair/gate can supersede an earlier body/configuration.

Keep reusable visual primitives small: Button, StatusBadge, Field/ErrorSummary, Toolbar/Filter, Table/InspectableRow, Inspector, ReviewDialog, OperationReceipt, RegionState and ContextHeader. Domain components remain explicit: AcademyAdmissionReview, OwnerAppointmentReview, InitialSetupChecklist, BranchTimezoneEditor, SportEditor and InvitationDeliveryPanel. These are design roles, not proposed new dependencies or a compulsory rewrite of current component names.

## Retrieval and state contract

| Projection | Useful first | Deferred / on demand | Guardrail |
|---|---|---|---|
| Context L01 | Current permitted academy/role labels and next action | Profiles/history | Bounded pages; no stale membership authority or cross-subject reuse |
| Admission L02 | Safe academy/appointment/setup status and create control | Selected history/inspector | Current platform grant; no tenant-private content/provider dashboard fan-out |
| Invitation L03 | Minimal authorized academy/role/expiry/action | Unrelated profiles never loaded | Handoff ready and verified recipient before review; recheck at acceptance |
| Setup L02 | Academy, current version, saved initial branch/sport/timezone and next step | Later module setup/directory | One current initial branch/sport projection; no whole-tenant preload |
| Operation/delivery | Original operation and explicit commitment/transport state | Attempt detail when needed | No new mutation after uncertainty; no blind resend of unknown provider effect |

Use current source bounds and matrix contracts; proposed historical name-sorted pagination and 25-branch directories are not automatically current behavior. Current M1 uses immutable record-ID cursors and edits the one initial branch/sport. Design future full directories separately with truthful page scope, search and complete export boundaries.

All sensitive authority is current at server/data use. Private app results remain no-store; no prototype sessionStorage decision authorizes private app payload storage. The actual app's browser persistence is deliberately limited to an opaque operation reference and start time scoped by subject/environment/view/academy. Keep that distinction if the prototype uses full fictional records to make review reproducible.

Retain the existing rate-limited signed gateway, recipient proof, expected version, operation idempotency, private-table boundaries and worker signature checks. UI disabled states are explanatory affordances, never replacements for those controls. A new visual change affecting cache, handoff, context, forms or action timing requires the corresponding negative/regression cases.

## Review and verification packet for the next builder

Before a functional change, name changed actions/requirements, accepted policy, current reusable pieces, affected trust crossings and recovery. Prepare each changed screen state from [the action contracts](batch-1-action-contracts.md), plus EN/AR and phone/desktop. Preserve the reference density; adjust a demonstrated accessibility issue locally with rationale rather than enlarging every control.

Evaluate each journey independently for usability, speed, correctness, cost and recovery. Keep [security/privacy review](../../../docs/04-engineering/journey-security-review.md) independent. Required adversarial cases include two-academy ID substitution, nonowner writes, revocation while open, wrong/unverified recipient, invite expiry/revocation, repeated/changed payload, acceptance/revocation race, missing/lost receipt, stale setup version and late old context response. Private media/payment/offline are not newly exposed by Batch 1; do not claim their security cases pass.

Appropriate existing checks are the actual React onboarding harness, app unit/API-budget tests, existing production-build browser tests, and the disposable database boundary suite when data/API behavior changes. The new standalone visual artifact instead needs local rendered-flow, layout, keyboard, state, link and CSV checks. Do not run hosted writes, provider calls or application deployment to validate a local prototype. Do not weaken existing assertions to accommodate a visual refactor.

Measure actual runtime later under declared cold/warm device/network/tenant-load conditions. Neither a simulated delay nor responsive local rendering proves the repository's first-useful, commit, database, cost or capacity budgets. The first useful view must permit a meaningful action; a skeleton is not completion. Native Arabic review, screen-reader operation, physical devices and participant observation require their own evidence.

## Open decisions and retained scope

| Area | Status / consequence |
|---|---|
| First-batch admission/owner/invitation/setup mechanics | Accepted bounded M1 policy; no new decision needed to design Journey A |
| Visual appearance | Selected reference; individual redesigned views and states need review/approval |
| Public admission | Later D-002 policy; no enabled public create-owner action |
| Ownership transfer/dispute recovery/custom roles | Later D-003 policy; manual safe guidance only |
| Full academy profile, currency/tax/geography | D-001 unfinished; no operational-ready claim |
| Sports catalog, archive and multiple branches | Retained AO-012/wider J04 scope; initial entered sport is partial coverage |
| Plans/trials/restrictions/activation | D-009 open; setup-only is not a billing suspension or trial |
| Guardian/player/consent and retention | D-004/D-015 open; no invented ages or authority |
| Trainer/guardian/player mobile journeys | Retained Batch 2/5 scope; owner setup phone view does not complete them |
| Native clients | Later release concepts under the existing release map; no native implementation claim |
| Full M1/security/performance/owner acceptance | Separate open gates; scoped earlier approvals remain scoped |

## Design-only status and handoff rule

These documents are designed contracts. Actual prototype connectivity/rendered checks belong in the folder's batch review record. List exact paths, scenarios, viewport/language and results there; leave unexecuted cases visibly unreviewed. No canonical requirement, test, security-family or production status is promoted by adding these files.

Use [the page/action matrix](page-action-matrix.csv) as the stable join between the prototype and source packets. A designer may add a view suffix for a new state without changing S/J/AO/AT identifiers. New business actions need a new action ID and contract; they must not hide inside a generic button label. Keep review of this prototype and authorization to implement it as separate decisions.

## Batch2 source-design handoff

Read [Batch2 contracts](batch-2-action-contracts.md) and [review limitations](batch-2-review.md) before functional work. `prototype/training.js` contains a fictional local model and explicit role-specific view functions. Its inline client guards are illustration only. Implement current server/data authority, minimal child projections, transactional capacity, assignment checks, idempotent attendance, correction version/audit and guardian-link revocation through separately authorized domain contracts. Never copy browser sessionStorage, generic persona switching, a boolean `linked`, hardcoded dates or the illustrative review capability into the functional app. Retained policy decisions, missing states and actual evidence are listed in the Batch2 review.

## Completed six-batch design-pass mapping

Read [Batches3–4 contracts](batches-3-4-action-contracts.md), [final consistency/security handoff](batch-5-final-handoff.md) and the updated [page/action matrix](page-action-matrix.csv). Separate commercial.js, operations.js, services.js, identity.js and expansion.js implement fictional review models only. Do not copy their client state, capability fixtures, hardcoded manifests or demonstration-unit arithmetic into authoritative app operations. Every dependent policy, server/DB transaction, worker/private-file boundary and real-layer acceptance remains required. All six batches have artifacts; rendered/owner review is pending.

### Current owner correction — 24 October 2026

The red/yellow/green macOS window controls are excluded from the web app and active prototype by explicit owner instruction. Earlier retained-frame descriptions and original reference assets are historical; keep compact blue styling and genuine web navigation. The original reference files are preserved unchanged.
