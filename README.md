# AcademyOS application foundation

**Current design and continuation — 4 November 2026:** use the [Operations reference](docs/03-design/operations-design-reference.md), [full redesign plan](docs/06-delivery/full-experience-redesign.md) and [master implementation plan](docs/06-delivery/app-implementation-plan.md). Operations is light by default with a Charcoal alternative; the complete working experience, including controls, density, flow and recovery, is the target. Existing Owner shell/Today is preserved. The [tracker](docs/06-delivery/experience-execution.csv) routes safe online EX-07 adoption while private offline acceptance stays gated. Continue with **“Continue from the living continuation prompt.”** [Reconciliation/evidence](docs/07-handoff/operations-plan-reconciliation-2026-11-04.md).

Latest2November2026 local-first clarification: retained month/three-month datasets and offline local edits/reconnect are the Owner-directed target; no inactivity lock or proposed24hour cutoff;30day/logout replica cleanup selected. Read the [offline-edit/conflict contract](docs/04-engineering/offline-edit-and-conflict-contract.md) and current generated continuation for remaining exact domain/device/security gates. Current online commands are unchanged until the corresponding slice is implemented.

## Persistent local data and synchronization — LF-v2,2November2026

The intended experience now retains permitted datasets on the device across visits, opens covered tasks locally and synchronizes changed data quietly. [local-data and sync plan](docs/06-delivery/local-data-and-sync-plan.md) is the canonical current target; exact private-field/device/retention/offline-write choices remain gated. Current app functionality and deployed evidence are unchanged by this planning checkpoint. Continue using the generated continuation prompt; the old summary-only storyboard is superseded.

Working-day continuation —2November2026: use **“Continue from the living continuation prompt.”** The [generated instruction](docs/06-delivery/continue-academyos.md) derives its single current priority from the [execution tracker](docs/06-delivery/experience-execution.csv). The ordered route includes [EX-10 working-behaviour/architecture readiness](docs/03-design/academy-working-behavior-contract.md), the scoped shared-loading pilot and [EX-11 operating acceptance](docs/06-delivery/academy-working-day-acceptance.md). Use the tracker's current row rather than restarting those checkpoints. The [case register](docs/06-delivery/academy-working-day-cases.csv) is planned coverage, not executed proof. Private caching/persistence/offline choices remain explicitly pending.

Current delivery priority: [connected experience execution and finding closure](docs/06-delivery/experience-execution.md). This joins the master plan, approved redesign and request-hygiene remediation; it does not mark the redesign complete.

Current design-to-build tracking: [the application implementation plan](docs/06-delivery/app-implementation-plan.md) connects the accepted Charcoal spectrum design, existing source, shared components and per-action acceptance gates. Its screen/action/requirement registers preserve separate implementation, verification, deployment and owner-approval status.

Private English/Arabic staging is deployed at https://staging.academy.nahr.dev. Clerk sign-in and the initial Supabase identity/membership boundary work; no academy access is granted by signup alone. Implemented operational subsets and remaining feature/verification/acceptance gates are recorded in the current tracker and action matrix; production launch remains separately authorized.

**Current setup documentation starts at [the ordered setup index](docs/07-handoff/setup-index.md).** It links the execution history, actual configuration/credential-name register, evidence and remaining work. Older handbook/onboarding statements below are historical and must not override current receipts.

Verified staging integrations include Redis throttling, signed QStash test delivery, controlled Resend delivery, Sentry source maps/privacy filtering, private Storage buckets and encrypted R2 backup/database restoration. The first daily scheduled backup succeeded. Uptime and the remaining infrastructure finishing checks are tracked separately in the current board.

Use Node 24 LTS and npm 11.19.1. Run `npm ci`, then `npm run dev`. Verification: `npm run lint`, `npm run build`, `npm run typecheck`, `npm test`, `npm run test:e2e`; backup safety: `python3 -m unittest discover -s scripts/backups -v`. Never commit credentials or real customer/child data.

Vercel: Next.js, root `apps/web`, Node 24.x. The project's Vercel Production environment is AcademyOS **staging**, with `APP_ENV=staging`. The four staging migration files have been applied; [membership receipts](docs/07-handoff/membership-connection.md) explain their private/caller-scoped boundary. Production remains a separate launch gate.

---

# AcademyOS — product, design, engineering and service handbook

Version 1.0 · Prepared 21 October 2026 · Owner: Moamen Ghareeb / NAHR

This is the starting point for building AcademyOS. It brings the product vision, complete business scope, interface direction, engineering contracts, service configurations, delivery plan and acceptance requirements into one organized package.

**Historical handbook baseline (superseded by the application status above): documentation only.** No application has been scaffolded, no repository has been initialized or pushed from this folder, and no provider accounts, DNS records, databases or deployments have been changed by this documentation task. Configuration values are proposed settings or explicitly identified values to obtain from the selected account. A written checklist does not mean that its checks have passed.

## Read in this order

1. [Vision and success](docs/01-product/vision-and-success.md): the product and the experience it should deliver.
2. [Full scope and release map](docs/01-product/scope-and-release-map.md): everything retained, with proposed delivery stages.
3. [Engineering charter](docs/00-governance/engineering-charter.md) and [journey security gates](docs/04-engineering/journey-security-review.md): mandatory development and evidence discipline.
4. [SaaS operating blueprint](docs/01-product/saas-operating-blueprint.md): academy lifecycle, ownership, relationships, restrictions, support and pilot readiness.
5. [Decisions and open questions](docs/00-governance/decisions-and-open-questions.md): agreed direction, proposed defaults and decisions needed before particular modules.
6. [Experience blueprint and journey governance](docs/03-design/experience-blueprint-and-journey-governance.md), [role journeys](docs/03-design/role-journeys-and-content.md) and [journey register](docs/03-design/journey-register.csv).
7. [Experience, performance and data-loading plan](docs/03-design/experience-performance-and-data-loading.md) and [screen/data matrix](docs/03-design/screen-data-loading-matrix.csv).
8. [Platform Owner Services & Operations vision](docs/03-design/platform-owner-services-and-operations.md).
9. [UI/UX design system](docs/03-design/ui-ux-design-system.md) and [screen catalog](docs/03-design/screen-and-navigation-catalog.md).
10. [Service map and setup order](docs/05-services/00-service-map-and-setup-order.md): what to configure before development and what needs a working foundation first.
11. [Pre-development checklist](docs/06-delivery/pre-development-checklist.md): the practical starting gate.
12. [Architecture](docs/04-engineering/architecture.md), [data dictionary](docs/04-engineering/data-model-and-dictionary.md), and [API contracts](docs/04-engineering/api-and-integration-contracts.md).
13. [Delivery roadmap](docs/06-delivery/roadmap-and-backlog.md), [acceptance strategy](docs/06-delivery/test-strategy-and-acceptance.md), and [builder handoff](docs/07-handoff/start-here-for-builders.md).

## Documentation map

| Area | Documents |
|---|---|
| Authority and evidence | [Source register](docs/00-governance/source-register.md); [decisions](docs/00-governance/decisions-and-open-questions.md); [current state and change control](docs/00-governance/current-state-and-change-control.md); [changelog](docs/00-governance/changelog.md) |
| Product | [Vision](docs/01-product/vision-and-success.md); [scope](docs/01-product/scope-and-release-map.md); [roles and permissions](docs/01-product/roles-and-permissions.md) |
| Account and academy workflows | [Identity and tenancy](docs/02-workflows/identity-and-tenancy.md); [academy, people and onboarding](docs/02-workflows/academy-people-and-onboarding.md) |
| Training operations | [Scheduling and rosters](docs/02-workflows/scheduling-and-rosters.md); [attendance and offline](docs/02-workflows/attendance-and-offline.md); [evaluations](docs/02-workflows/evaluations.md) |
| Three financial domains | [Family finance](docs/02-workflows/family-finance.md); [trainer compensation](docs/02-workflows/trainer-compensation.md); [platform billing](docs/02-workflows/platform-billing.md) |
| Supporting operations | [Media, notifications, support and inventory](docs/02-workflows/media-notifications-support-inventory.md); [privacy, reporting and exports](docs/02-workflows/privacy-reporting-and-exports.md) |
| Experience | [Design system](docs/03-design/ui-ux-design-system.md); [screen catalog](docs/03-design/screen-and-navigation-catalog.md); [role journeys and content](docs/03-design/role-journeys-and-content.md); [visual reference](docs/03-design/visual-reference.md) |
| Engineering | [Architecture](docs/04-engineering/architecture.md); [data](docs/04-engineering/data-model-and-dictionary.md); [API](docs/04-engineering/api-and-integration-contracts.md); [security](docs/04-engineering/security-and-privacy.md); [jobs](docs/04-engineering/jobs-and-idempotency.md); [local development](docs/04-engineering/local-development-and-repository.md) |
| Provider setup | [Service directory](docs/05-services/00-service-map-and-setup-order.md); [environment and DNS registers](docs/05-services/14-environment-and-dns-registers.md); [official source review](docs/05-services/15-provider-sources-and-review-notes.md) |
| Delivery and operation | [Roadmap](docs/06-delivery/roadmap-and-backlog.md); [tests](docs/06-delivery/test-strategy-and-acceptance.md); [pre-development](docs/06-delivery/pre-development-checklist.md); [release and recovery](docs/06-delivery/release-and-recovery.md); [cost and operations](docs/06-delivery/cost-capacity-and-operations.md) |
| Traceability | [Requirements and acceptance cases](docs/06-delivery/requirements-traceability.csv); [all referenced audit findings](docs/06-delivery/audit-to-requirements.csv) |
| Handoff and quality | [Builder instructions](docs/07-handoff/start-here-for-builders.md); [configuration templates](docs/07-handoff/configuration-templates.md); [documentation verification](docs/07-handoff/verification-report.md) |

## Status language

- **Selected**: supported by the user's blueprint or explicit choices.
- **Proposed**: a concrete recommendation in this pack, ready for review; not a silently approved business policy.
- **Decision required**: alternatives and consequences are documented; the affected implementation must wait for that decision.
- **Reported complete**: described as completed by an earlier source, not reverified against the provider account during this task.
- **Verified in this task**: inspected locally or checked against public official documentation; the precise evidence is stated.
- **Not executed**: setup or acceptance steps have not been performed.

## Using the handbook

Every implementation slice should name its requirement IDs, affected workflows, permission checks and acceptance cases. Record evidence against the actual commit, migration state, environment and provider mode. Keep proposed configurations separate from actual settings. Never store passwords, API keys, recovery codes, real child records or authenticated browser state in these documents.

The pack is detailed enough to plan and review implementation. Open decisions, account-specific identifiers, provider eligibility and unexecuted acceptance checks remain explicit. It does not certify a working or production-ready application.

Staging sign-in: [staging.academy.nahr.dev](https://staging.academy.nahr.dev/en/sign-in) now opens directly under owner-approved Vercel Standard Protection. AcademyOS still enforces identity and academy permissions; preview/generated deployment URLs remain protected. See [current access evidence](docs/07-handoff/staging-direct-access.md).

Whole-app experience review: [one offline HTML baseline](design/app-experience-review/AcademyOS-experience-review.html), [coverage and update instructions](design/app-experience-review/README.md). Actual component captures use fictional local adapters; provider-owned and uncaptured states remain explicit.
