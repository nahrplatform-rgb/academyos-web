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

Record ID, selected alternative, rationale, accepted-by/date, effective date, affected requirements and any migration/recovery consequence. Do not mark a policy accepted because a mockup shows a number. If a decision blocks only finance, continue permitted work on identity, design or scheduling that does not depend on that policy.
