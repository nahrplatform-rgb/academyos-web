# Platform Owner — Services & Operations

Status: accepted product direction from Moamen's request, 22 October 2026; detailed behavior below is a proposed implementation contract. This document adds planned scope, not an implemented dashboard, database privilege or provider integration. Read with [roles](../01-product/roles-and-permissions.md), [current service bindings](../07-handoff/configuration-status.md) and [operations guide](../07-handoff/operations-and-custody.md).

## 1. Purpose and the owner's daily experience

Moamen is the **Platform Owner** of AcademyOS: the accountable product/service owner operating all academies' shared platform. An **Academy Owner** operates one academy. These names must remain distinct everywhere, including Arabic labels, permissions, invoices and account switching. Platform Owner is the highest controlled tier of the existing platform-administration role, not a seventh tenant role or an automatic grant to whoever signs up first.

The owner should answer five questions in one calm workspace: Is AcademyOS working for people? What needs my attention? How much capacity and money are we using? What stops or becomes less reliable at the next limit? What is the safest next action?

An ordinary visit starts with the environment clearly identified, a concise impact summary and a short prioritized action list. The owner sees a developing storage constraint before users lose uploads, a failed backup before recovery becomes uncertain, and a trial ending before monitoring features change. The workspace explains business consequences in plain language and keeps technical evidence one click deeper.

Example copy (illustrative, not live measurements): “Document uploads are at risk: storage has 12% remaining. Current growth suggests about 18 days of capacity. Existing documents remain readable according to the verified provider policy. Review large files or approve more capacity.” If the policy or forecast cannot be verified, say so instead of inventing a consequence or date.

## 2. Platform administration around this section

Platform navigation: Overview; Academies; People & Access; Plans & Platform Billing; Services & Operations; Support; Audit & Governance; Settings. Keep family billing and trainer payroll inside their academy context. Overview prioritizes actionable exceptions across the platform; it is not a wall of counters or tenant private records.

Services & Operations navigation:

| Page | Owner's question | Primary content |
|---|---|---|
| Overview | Is the service safe to operate today? | Affected capabilities, active incidents, capacity/cost warnings, upcoming expirations, backup confidence, freshness |
| Services | What do we depend on? | Provider/resource inventory, purpose, environment, plan, owner, region, last verified connection |
| Health & Quality | Are people completing tasks reliably? | Availability, latency percentiles, error/timeout rates, queue lag, email failures, successful workflow probes |
| Usage & Limits | How much headroom remains? | Each relevant meter, allowance/reset, growth trend, forecast confidence, limits and breach behavior |
| Costs & Plans | What are we paying and committing to? | Reported actual charges, estimates, invoices/periods/currencies, included usage, overages, trial/renewal and approval records |
| Impact Map | What would be affected? | Service → capability → workflow/screen → role/environment; verified fallback and recovery dependencies |
| Backups & Recovery | Could we recover? | Latest independent copy, latest actual restoration, coverage/exclusions, file proof, retention/lock, evidence and unresolved gaps |
| Incidents & Changes | What happened and what did we do? | Timeline, scope, ownership, acknowledgement, approved action, deployment/config change, verified recovery |

Each service detail uses the same order: current impact; health; usage/limits; costs/plan; dependencies; actions/recovery; evidence/history. Use progressive disclosure rather than duplicating every vendor console.

## 3. Elegant, accessible presentation

Preserve the selected light Workspace design, restrained teal accents, readable typography and 18 px card corners. Begin with a brief operational sentence, then at most four meaningful summaries: user impact, attention items, capacity risk and spending. Show the service inventory in a readable table on desktop and stacked summaries on phones. Avoid decorative speedometers, fake precision, constant animation and a single unexplained “health score.”

Use status text plus icon and color: Healthy, Degraded, Unavailable, Unknown, Stale, Maintenance. Connection status, provider incident, app workflow health and collector freshness are separate indicators. A reachable provider homepage is not proof a login or attendance write works. Show affected capabilities beside each warning. One vendor outage should produce one grouped incident with downstream impacts, not dozens of duplicate cards.

Every value shows its unit, measurement window, environment, source and last successful observation. “Updated 4 minutes ago” opens an exact timestamp/timezone. A failed refresh leaves the last known value visible with Stale/Unknown and its age. A zero is shown only when actually measured; N/A, unavailable integration and unsupported provider API are distinct. No green overall banner when a critical dependency is unknown.

English/Arabic/RTL must be first-class, including tables, charts, keyboard navigation, clear focus and screen-reader status changes. Never encode severity with color alone. Show amounts in their source currency; any converted summary states FX source/date and remains an estimate. Freeze/reduce visual updates while the owner reads a detail or uses a form.

## 4. Service inventory and app impact contract

The following maps current service purposes to planned features; future module dependencies require implementation verification before being labelled observed.

| Service / layer | Capability and affected app area | Failure/limit consequence to verify and display |
|---|---|---|
| Vercel | Web pages, server APIs, callbacks | Deployment/runtime/bandwidth constraints can affect broad app access; separate a failed new deploy from a healthy current deploy |
| Clerk | Registration, sign-in, verification, session renewal | New access/renewal may fail; describe existing-session behavior from actual tests, never assume immediate logout or indefinite access |
| Supabase database | Membership authorization and all committed business records | Reads/writes may fail; stop sensitive writes safely, never treat a failed lookup as no membership or bypass authorization |
| Supabase Storage | Media, attachments, payment proofs, exports | Upload/download restrictions can differ; existing-record operations must not claim attached bytes were saved when upload failed |
| Upstash Redis | Rate limits and ephemeral receipts/cache | Current rate-limit adapter rejects unavailable authority; future optional caches may degrade differently. Map each use separately |
| QStash | Background transport/scheduled deliveries | Queued work may be delayed; transport acceptance is not business completion. Preserve durable job/outbox state when implemented |
| Resend | Invitations and transactional emails | Sends may be blocked/deferred/bounced; distinguish accepted, delivered, bounced and read unknown. In-app data must not disappear |
| Sentry | Error detection, uptime and backup-monitor visibility | Quota/plan loss affects diagnosis/alerts; core academy hosting/login/data are separate. Display monitoring blind spots explicitly |
| Cloudflare DNS | Domain resolution | Domain/DNS failures affect app reachability even when hosting is healthy; mail records have their own dependencies |
| Cloudflare R2 | Independent encrypted backups | Failed exports reduce recovery confidence; primary app can remain healthy. Show age of the last verified copy and last real restore separately |
| GitHub Actions | Checks/deploy triggers, backup execution | Failed/missed CI/backup need separate impact; existing app deployment may remain available. Independent Sentry check-ins watch missing backups |
| Future payment provider | Platform subscription or academy collections, explicitly separated | Payment pending/failure is not receipt settlement; do not revoke unrelated user data access from an ambiguous callback |

Represent dependencies as versioned directed edges, with environment, criticality, dependent capability, observation/test evidence, fallback, maximum tolerated delay, recovery order, reviewed-by/date. Distinguish direct from inferred/indirect impact. Multiple services may share one account quota; do not count it repeatedly. Account-wide costs must not be falsely attributed entirely to AcademyOS or one academy.

## 5. Limits, costs and growth

A service may have several independent meters: stored bytes, egress, requests, active identities, database connections/compute, email/day/month, function execution, queue deliveries/retries, error events and CI minutes/artifacts. For each applicable meter store unit, period start/end/timezone, plan/version, included amount, consumed amount, reset behavior, hard cap, warning threshold, overage price and provider behavior at breach. Values/policies carry source and verification date; never hardcode a current plan as permanent truth.

Classify breach behavior explicitly: reject new operations; pause resource; throttle; drop telemetry; incur overage; require manual upgrade; unknown. State which capabilities/users are affected, whether already-stored data remains accessible, and what restores service. A reversible warning threshold does not authorize raising a limit or buying a plan.

Actual reported cost, accrued-but-delayed usage, forecast, invoice and approved budget are distinct values. Provider invoices remain authoritative. Do not imply a budget notification caps spend. Expose paid add-ons, trial expiry, auto-renewal, cancellation effective date and whether payment details are present, without storing card data. Recognize free allowances and grants separately from a paid subscription label.

Proposed configurable capacity thresholds: 70/85/95 percent for attention/action/urgent; apply only where meaningful and accepted. Predict exhaustion using documented recent history, show confidence and minimum sample size, and suppress unreliable forecasts during spikes or insufficient history. Include expected growth from academy onboarding as a scenario, not a promised date or bill. No automatic upgrade or silent destructive cleanup.

## 6. Data collection and reliability

Use a small server-side provider-adapter layer; each adapter declares supported health/usage/cost/plan fields and API scope requirements. Collect asynchronously with bounded timeouts, backoff/jitter, API budget and independent refresh intervals. Billing often updates slowly: label its lag rather than polling rapidly. Manual/provider-console values require an authorized editor, source/date and expiry and are visibly marked manual.

Normalize observations without hiding raw provider meaning. Suggested records: ServiceResource, ServicePlanSnapshot, MetricObservation, LimitPolicyVersion, CapabilityDependency, CostObservation, BudgetPolicy, Incident, IncidentImpact, OperatorAction and RecoveryEvidence. These are planning concepts, not migrations. Keep source timestamp, received timestamp, unit/window, quality/freshness state and provenance. Choose retention by data class before implementing persistent telemetry; no customer payloads or per-child data are needed.

A collector's credential failure is “collector unavailable,” not proof the provider is down. Reconcile the last successful independent backup receipt rather than trusting only a status ping. Maintain observation history for trends without copying private invoices, logs, tokens, contact details or restored data into the browser. Store only approved secret references server-side, with least-privilege read scopes; credentials never appear in API responses, URLs, local storage or screenshots.

The administration page must continue to render partial results when a provider is unavailable. Cache the last safe observation and isolate adapter failures. External uptime/backup notifications remain independent of AcademyOS: when the app is down, its own dashboard cannot be the sole alarm. No collector is allowed to send business notifications, alter data or reset credentials as a side effect of reading status.

## 7. Owner authority and safe actions

Initial actor: Moamen as Platform Owner, provisioned through an explicit audited process bound to a verified immutable identity. Email matching, first signup, browser flags and a Clerk metadata label alone cannot grant platform access. Proposed delegated roles are future capabilities within platform administration: operations viewer, operations operator and billing viewer; they are not automatically provisioned by this plan.

| Action | Proposed control |
|---|---|
| Read redacted health, usage, impact | Explicit platform capability and environment scope, server/database enforced |
| Read provider costs/plan terms | Separate billing-read capability; no child/academy confidential data implied |
| Refresh observations, acknowledge/assign incident | Bounded/idempotent request, audit and current authority check |
| Run synthetic health/recovery test | Named target, no real financial/customer side effects, bounded resource use, durable result |
| Retry business job | Domain-specific eligibility/idempotency/current permission; never a generic “retry everything” button |
| Change alert threshold/routing | Preview effect, named recipients, audit; protect critical external monitoring |
| Buy/upgrade/enable PAYG, accept provider terms | Platform Owner explicit approval and provider-hosted final action; no automated spending |
| Rotate credentials/change protections/delete or restore | Step-up, exact environment/target, impact preview, explicit approval, audited job and independent verification |

The first delivered version is read-only, with safe provider-console links and acknowledged incidents. Later actions require separate implementation acceptance. No automatic support impersonation or unrestricted tenant database browsing is introduced. Prevent removal of the last Platform Owner and maintain an explicitly controlled recovery procedure. Do not grant a second person or new API scope just to populate a widget without owner approval.

## 8. Delivery order and acceptance

1. Approve this vision/permission boundaries and define provider-read scope inventory. No new credential is needed merely to document the vision.
2. Build Platform Owner authorization and separate EN/AR shell with deny tests for tenant owners/other users.
3. Implement read-only service inventory/current environment, freshness states, dependency explanations and a small actual health feed. Unsupported meters show Unknown/manual; never mock a live status.
4. Add usage/limit/versioned policy and cost observations with provenance, account-allocation labels and trend history. Add trial/renewal warnings and external alert references.
5. Add incident/action timeline and independent recovery evidence. Verify the page under provider outages and expired collector credentials.
6. Add controlled administrative operations one at a time, each with explicit authority, step-up/approval, idempotency, audit and failure recovery. Production purchases and customer data remain separate launch gates.

Required acceptance cases: non-owner direct API/export denial; staging/production isolation; collector timeout/stale snapshot; provider outage with healthy collector and vice versa; free quota exhausted versus billable overage; delayed billing/multiple currencies; shared account attribution; trial scheduled downgrade versus effective plan; blocked writes with preserved data; no invented backup-restored status; dependent-page partial failure; EN/AR phone/keyboard/screen-reader operation; duplicate action/expired authority; no secrets/PII in telemetry or UI; external alerts still delivered when the app is unavailable. Current provider rules must be verified during implementation and referenced in each policy version.

## 9. Current planning decisions and boundaries

Accepted: dedicated Services & Operations in platform administration, Moamen's display role Platform Owner, attention-first elegant design, health/quality/data/cost/limits/consequences/app impact in scope, no unapproved paid upgrades. Proposed: exact routes, data structures, alert thresholds, delegated capabilities and collection intervals. Still open: production budgets, retention, provider commercial eligibility, incident response targets and commercial recovery objectives.

Sentry free Developer tier is explicitly requested on 22 October. Current dashboard still shows Business Trial; its documented cancellation page returns “Your plan is not eligible to be cancelled.” No billing/payment method is on file. This is a pending provider transition, not an effective downgrade. Preserve the existing error privacy filter and uptime/backup monitoring while resolving it; do not delete/recreate the organization or remove security controls to obtain a free label.

## Journey performance and retrieval visibility

Extend the planned observations with the [five-dimension experience/performance contract](experience-performance-and-data-loading.md): first useful task timing, errors/timeouts, request/byte/query drivers, job amplification and measured versus estimated costs. Use bounded asynchronous collection with provenance, time window and coverage; never put every provider API on the dashboard request path. New field telemetry requires explicit privacy/retention review; current collection settings are unchanged.
