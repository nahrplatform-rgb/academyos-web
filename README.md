# AcademyOS application foundation

An English/Arabic Next.js staging starter lives in `apps/web`. Service accounts are prepared; operational workflows and provider runtime integrations are still in development.

Use Node 24 LTS and npm 11.19.1. Run `npm ci`, then `npm run dev`. For verification run `npm run lint`, `npm run build`, `npm run typecheck`, `npm test`, and `npm run test:e2e` (install Playwright Chromium first).

For Vercel use **Next.js**, root directory **apps/web**, Node **24.x**, and default build/output settings. The starter builds without credentials; sign-in remains unavailable until both Clerk test keys are privately configured. Never commit secrets or use live data in this staging application.

See [implementation status and deployment steps](docs/07-handoff/foundation-implementation.md). The SQL migration is unapplied and denies client access by default. No operational module or hosted integration is accepted as complete.

---

# AcademyOS — product, design, engineering and service handbook

Version 1.0 · Prepared 21 October 2026 · Owner: Moamen Ghareeb / NAHR

This is the starting point for building AcademyOS. It brings the product vision, complete business scope, interface direction, engineering contracts, service configurations, delivery plan and acceptance requirements into one organized package.

**Historical handbook baseline (superseded by the application status above): documentation only.** No application has been scaffolded, no repository has been initialized or pushed from this folder, and no provider accounts, DNS records, databases or deployments have been changed by this documentation task. Configuration values are proposed settings or explicitly identified values to obtain from the selected account. A written checklist does not mean that its checks have passed.

## Read in this order

1. [Vision and success](docs/01-product/vision-and-success.md): the product and the experience it should deliver.
2. [Full scope and release map](docs/01-product/scope-and-release-map.md): everything retained, with proposed delivery stages.
3. [Decisions and open questions](docs/00-governance/decisions-and-open-questions.md): agreed direction, proposed defaults and decisions needed before particular modules.
4. [UI/UX design system](docs/03-design/ui-ux-design-system.md) and [screen catalog](docs/03-design/screen-and-navigation-catalog.md).
5. [Service map and setup order](docs/05-services/00-service-map-and-setup-order.md): what to configure before development and what needs a working foundation first.
6. [Pre-development checklist](docs/06-delivery/pre-development-checklist.md): the practical starting gate.
7. [Architecture](docs/04-engineering/architecture.md), [data dictionary](docs/04-engineering/data-model-and-dictionary.md), and [API contracts](docs/04-engineering/api-and-integration-contracts.md).
8. [Delivery roadmap](docs/06-delivery/roadmap-and-backlog.md), [acceptance strategy](docs/06-delivery/test-strategy-and-acceptance.md), and [builder handoff](docs/07-handoff/start-here-for-builders.md).

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
