# Decisions and open questions

Version 1.0 · 21 October 2026

## Selected direction

| ID | Decision | Authority |
|---|---|---|
| ADR-001 | NAHR is the parent brand; AcademyOS is its first independent SaaS. Planned application domain: `academy.nahr.dev`. | Blueprint |
| ADR-002 | Separate identity applications, infrastructure and billing from other NAHR products. | Blueprint |
| ADR-003 | Within AcademyOS, one identity can have multiple memberships and roles across academies. | Blueprint / user brief |
| ADR-004 | PostgreSQL owns business membership, roles and permissions; Clerk owns identity and sessions. | Blueprint |
| ADR-005 | Next.js, React and TypeScript; modular monolith; Vercel hosting; Supabase PostgreSQL and private storage. | Blueprint |
| ADR-006 | English, Arabic, RTL, accessibility and responsive web are foundational. | Blueprint |
| ADR-007 | Platform billing, family billing and trainer compensation are separate domains. | Blueprint |
| ADR-008 | Upstash is the selected initial rate-limit service; iCloud is company mail; Gmail is temporary development SMTP only. | Blueprint |
| ADR-009 | Web first; React Native/Expo for later iOS/Android evaluation; Tauri remains an optional desktop path. | Blueprint |
| ADR-010 | Apple-inspired restraint and clarity; Workspace, Light, 18px card corners are the latest visual preferences. | Blueprint plus preview feedback |
| ADR-011 | PYSA is a reference for workflows and audit lessons, not a code/schema/navigation template. | User brief |
| ADR-012 | Historical initial task created documentation/configuration plans before development; subsequent owner instructions authorized implementation, commit/push, staging setup and its completion. | Initial brief, superseded in execution scope by later owner instructions |
| ADR-013 | Reuse the existing private staging resources; Vercel Production for academyos-web remains AcademyOS staging. | Owner setup instructions / verified execution |
| ADR-014 | Private EU Cloudflare R2 is the independent encrypted staging backup destination; owner activated billing and retains the age recovery key in the vault. | Owner activation/custody confirmation and backup/restore proof |

| ADR-015 | Staging backup prefix `staging/` uses a reversible seven-day overwrite/deletion lock and owner-approved 30-day object expiry. This does not accept production/customer data retention or a legal hold. | Owner explicitly approved 30-day cleanup on 22 October 2026; configured rules and actual lock-denial test verified |

| ADR-016 | Direct AcademyOS sign-in at the canonical staging domain; Vercel Standard Protection keeps preview/generated deployment URLs protected. Clerk identity, server/data authorization and synthetic-only staging scope remain enforced. This replaces the earlier all-URLs Vercel gate; it is not a customer-production launch. | Moamen explicitly approved on 23 October 2026; [applied configuration and verification](../07-handoff/staging-direct-access.md) |

## Proposed technical defaults

These are reviewable recommendations. They are not claims that accounts are already configured.

| ID | Proposed default | Reason / consequence |
|---|---|---|
| PROP-01 | One app repository with `apps/web` and shared packages; add native clients only when needed. | Future client sharing without premature multiple services. |
| PROP-02 | Local, isolated test, preview, staging and production are distinct trust boundaries. | Preview code never receives production data or secrets. |
| PROP-03 | Vercel Pro for this commercial product, with a custom staging environment where supported. | Commercial eligibility and an explicit staging target. |
| PROP-04 | Separate hosted Supabase projects for production and staging; local disposable database for development/tests. | Keeps cost controlled while preserving production isolation. |
| PROP-05 | Nonproduction Clerk application distinct from production application; test identities only outside production. | Independent issuers and environment binding. |
| PROP-06 | Operational mutations pass through shared server services and narrowly granted database transactions. | Uniform permissions and retry behavior across clients. |
| PROP-07 | Transactional outbox in PostgreSQL; QStash as a candidate delivery trigger; business job state stays in PostgreSQL. | Transport retries cannot redefine business completion. |
| PROP-08 | Private-by-default media, exports and financial proofs; short-lived scoped downloads. | Limits accidental publication and stale access. |
| PROP-09 | Sentry for application errors; uptime monitor plus provider metrics; analytics optional. | Small, purposeful observability set. |
| PROP-10 | No support impersonation in the initial release. Read-only support access, if later selected, is time-limited and audited. | Avoids high-risk delegated identity behavior. |

## Business decisions to resolve

Owner for product/business decisions: Moamen. Technical lead supplies consequences and evidence. Legal/accounting reviewers are needed where applicable; this pack does not assert a jurisdiction-specific legal conclusion.

| ID | Decision needed | Concrete alternatives and recommended starting proposal | Deadline |
|---|---|---|---|
| D-001 | Launch geography, contracting entity, settlement currency and tax treatment | Start with explicitly named operating countries and one configured academy currency; verify gateways against the actual entity. Do not infer legal eligibility from EGP examples. | Before paid provider setup |
| D-002 | Acquisition and academy creation | A: invite-led pilot; B: public owner signup with verified email, anti-abuse and pending academy approval. Propose A for pilot, preserve B in later scope. | Before onboarding implementation |
| D-003 | Owner, manager and branch authority | A: fixed role templates plus explicit branch scope; B: fully custom roles. Propose A initially, with audited scoped delegation for named actions. | Before permission implementation |
| D-004 | Player accounts and minors | A: guardian-managed records without player login for younger children; B: age/consent-controlled player accounts. Age thresholds and consent authority require policy. | Before player invitations |
| D-005 | Family fee calculation | Calendar month versus rolling period; whole-period versus prorated joining; per-player versus family payer. Propose effective-dated plan versions and explicit preview regardless of arithmetic choice. | Before billing generation |
| D-006 | Cancellation, absence and makeup credits | No credit, fixed credit, or policy-driven credit with approval. Decide deadlines, expiry, transferability and double-use prevention. | Before cancellation/credit UI |
| D-007 | Financial corrections, refunds and disputes | Decide approver, thresholds, refund destination, partial-refund policy and accounting document requirements. Corrections and cash refunds remain separate. | Before financial write workflows |
| D-008 | Trainer earnings | Per session, hourly, monthly, attendance share or mixed contract; decide late cancellation, substitution, leave, rounding and approval rules. | Before payroll calculations |
| D-009 | Platform commercial plans | Prices, limits, trial length, grace period, overage, billing cadence, refund policy and restricted-state access. No invented prices are treated as accepted. | Before entitlements and sales |
| D-010 | Payment providers | Stripe where the actual entity is eligible; evaluate Paymob/Kashier for the intended market. Decide separate platform and academy merchant arrangements and money flow. | Before gateway coding |
| D-011 | Offline authority | Propose attendance capture only; maximum cache/lease duration, sensitive fields, device revocation and conflict approver remain explicit choices. | Before offline implementation |
| D-012 | Attendance rules | Session windows, grace/late states, early arrival, check-out, excused absence, correction deadlines and QR validity. | Before attendance business logic |
| D-013 | Evaluations | Trainer self-publish versus manager review; player/guardian visibility; metric scales per sport; revision and rejection policies. Propose review before initial publication. | Before evaluation implementation |
| D-014 | Communications | Transactional channels, optional marketing consent, guardian recipients, quiet hours, emergency notices and delivery budgets. Propose in-app plus transactional email for initial release. | Before external messaging |
| D-015 | Retention and privacy | Per-data-class retention, financial/legal holds, deletion review, consent records, media sharing and child access rights. Obtain applicable legal requirements. | Before real personal data |
| D-016 | Recovery and availability | Proposed commercial targets: 99.9% monthly core availability, database RPO 1 hour, whole-service RTO 4 hours. Decide affordability and prove a restore; file recovery needs its own RPO. | Before commercial launch |
| D-017 | Inventory scope | Basic quantities and movement audit versus purchasing/valuation/accounting. Propose basic stock and adjustments first. | Before inventory implementation |
| D-018 | First-release breadth and pilot | Proposed staged rollout in the scope map; no legacy capability is silently retired. Choose pilot academies and required acceptance roles. | Before release commitment |
| D-019 | Data region and cross-border processing | Select region after customer geography, vendor availability, latency measurement and applicable requirements. | Before persistent hosted data |
| D-020 | Native priorities | Trainer offline app first, guardian app first, or one role-aware app. Propose trainer/guardian tasks in one app after stable web APIs. | Before native work |
| D-021 | Support and administrative preview | No impersonation; consented read-only access; or constrained write delegation. Propose no impersonation initially. | Before privileged support tooling |
| D-022 | Provider budget and team access | Monthly cap, paid plan owners, approvers, backup operator and service renewal responsibility. | Before billable resource creation |

## How to close a decision

The [M1 decision/design packet](../06-delivery/onboarding-m1-decision-design-packet.md) supplies concrete D-002/D-003 recommendations, invitation/setup choices and a connected prototype for review. The M1 selections were accepted by Moamen on 22 October 2026 as recorded below; broader later policy remains open. Design approval does not itself authorize a privileged Platform Owner grant.

Record ID, selected alternative, rationale, accepted-by/date, effective date, affected requirements and any migration/recovery consequence. Do not mark a policy accepted because a mockup shows a number. If a decision blocks only finance, continue permitted work on identity, design or scheduling that does not depend on that policy.

## Operating blueprint and decision packets

The [SaaS operating blueprint](../01-product/saas-operating-blueprint.md) expands lifecycle, ownership recovery, identity/guardian/payer separation, subscription restrictions, data lifecycle, support, tenant fairness and pilot scenarios. Its recommendations remain proposed. Resolve D-002/D-003 first for onboarding, then D-004/D-015 for relationships and the dependent domain policies before their modules; detailed examples do not close decisions without recorded owner acceptance.

## M1 bounded acceptance — 22 October 2026

Moamen explicitly accepted the proposed [M1 policy packet](../06-delivery/onboarding-m1-decision-design-packet.md) and approved its connected design for implementation in this chat. D-002 invite-led synthetic admission and D-003 fixed roles/explicit branch scope, one initial owner and audited separate platform provisioning are accepted for M1. Invitation expiry is 72 hours, with verified-recipient acceptance; first branch/sport/timezone saves complete initial setup only. Other roles have no M1 setup writes. Public admission, custom delegation, multi-owner/transfer/recovery automation and operational/commercial activation remain later decisions. This does not authorize executing the initial privileged grant.

## Compact blue visual replacement — 24 October 2026

The owner explicitly selected the supplied compact blue HTML reference and subsequently instructed replacement of the old functional-app visual design using a shared component library. This supersedes ADR-010's teal/18px visual defaults for new application work. Preserve its historical wording. Blue/neutral compact desktop styling and dedicated phone touch targets are now the implementation direction; business policy, permission and real-operation contracts remain unchanged. Source progress and unexecuted review gates are recorded in the [first application design-foundation receipt](../07-handoff/compact-blue-design-foundation.md). This is not deployment or blanket screen/owner/security acceptance.

## Web toolbar correction — 24 October 2026

The owner likes the compact blue M1 direction but explicitly excludes the red/yellow/green macOS close/minimize/window controls from the web app. Remove those decorative dots from the shared app shell and active design prototype. Keep the compact blue system and actual web navigation/account controls. Historical reference assets and prior screenshots remain unchanged as evidence; their window controls are not the current visual requirement. This is scoped visual direction, not full M1 acceptance or deployment.

## Compact blue M1 design accepted — 24 October 2026

Moamen explicitly approved the compact blue M1 design after removal of the macOS window controls. [Approval receipt and reviewed source](../07-handoff/compact-blue-integration-verification.md) cover the shared foundation and shown M1 journey only. Broader prototype domains, authenticated staging verification, full M1 acceptance and independent security review retain their own gates.

## I2a synthetic player registration policy accepted — 24 October 2026

Moamen accepted the explained [first player-registration flow](../06-delivery/i2-people-first-slice-decisions.md): existing Academy Owner, fictional player name, academy-scoped duplicate review without automatic merging, explicit different-person confirmation or existing profile, saved profile; optional unverified parent contact grants no access and sends no invitation. Initial branch context remains explicit. This is the narrow synthetic I2a policy only. D-003 manager capabilities, D-004 guardian/player-access evidence and D-015 real-data retention/privacy remain open for their dependent slices. Design, implementation, staging verification and acceptance are separate.

## I3a draft-program policy accepted for design — 25 October2026

Moamen selected “Accept this draft-program policy” in the [I3a recommendation](../06-delivery/i3a-program-dates-decisions.md): current Academy Owner, saved initial branch/sport, explicit weekdays/same-day local times and inclusive date range, complete preview, initial28-day/20-date generation bound, rejection of ambiguous/nonexistent local times and overnight sessions, atomic draft save/read only. Drafts remain invisible to Trainers/families; no assignment, enrollment, publication, financial effect or notification. Broader scheduling/edit/history/capacity/fee/Manager rules remain open. This is policy for design preparation only; the connected design has its own review and product source/hosted/security/acceptance gates. No new grant or invitation authorized.

I5a scoped D-013/D-004 decision28October2026: Moamen explicitly accepted [reviewed narrative feedback policy for design](../06-delivery/i5a-development-feedback-decisions.md). Assigned Trainer drafts after an ended published rostered session; different-account Owner returns/publishes; active approved and separately enabled Guardian link sees only its player's retained publication; amendments/withdrawal preserve history. No automatic access expansion or account grant. Connected design review pending; scored metrics, Player access, Manager/direct publication, notification/export and other D-004 policy remain unresolved.
