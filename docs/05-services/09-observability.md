# Monitoring, logging and uptime configuration

> Current execution status (22 October 2026): Sentry error/source-map/privacy integration and an uptime manual test passed. See [the actual register](../07-handoff/configuration-status.md) and [remaining verification](../07-handoff/remaining-configuration.md). Performance/replay remain disabled; older proposals below are not enabled settings.

Proposed baseline: Sentry for application errors/performance, Vercel/Supabase/Upstash provider metrics, and Checkly or an equivalent external monitor. Monitoring receives minimum necessary technical metadata, not a copy of business records.

## Sentry setup

Create a NAHR organization and AcademyOS web project, with environment labels separating staging and production. Record data region, retention, team access, usage limits and alert recipients. Integrate with the actual installed Next.js version using current official instructions; capture browser and server errors, release/commit and environment. Source-map upload uses a server/build secret distinct from the browser-visible DSN. [Sentry Next.js setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

Values: `NEXT_PUBLIC_SENTRY_DSN` or validated client DSN configuration; `SENTRY_DSN` where server configuration needs it; `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_ENVIRONMENT`, release identifier and `SENTRY_AUTH_TOKEN` limited to the required build task. Restrict source-map/token access and avoid publishing sensitive maps as public assets.

Proposed privacy defaults: session replay disabled; automatic personal-data collection disabled; request/response bodies excluded; cookies, authorization, signed URLs, query secrets, names, emails and free text scrubbed. Use a pseudonymous internal user reference only where necessary. Sample traces conservatively, proposed 10% in production initially, then tune cost and diagnostic value. Exclude health checks and sensitive payload attributes. Do not copy a setup wizard's replay defaults without privacy review.

## Alerts and dashboards

Track error rate, latency, failed authorization anomalies, job backlog age, unreconciled payments, orphan cleanup, email bounce/failure, backup age, object-copy age and restore-test freshness. Business invariants come from database reconciliation, not only exception tracking.

Initial alert proposals: sustained API failure, repeated payment reconciliation exceptions, oldest queued critical job beyond its agreed target, backup beyond RPO, and production uptime failure from multiple checks. Tune thresholds during pilot; do not page for every expected 403 or single transient request. Alerts need owner, severity, response action and escalation path.

## External monitoring

Expose a minimal public liveness endpoint with no secret/version detail and a protected readiness/synthetic flow for deeper checks. A liveness 200 is not proof that authentication, database or jobs work. Add synthetic login/authorized read using a dedicated synthetic tenant, plus a safe nonfinancial mutation if approved. Never use real child accounts.

Choose monitor region(s), interval, timeout, retry policy and notification destinations. Proposed starting interval is one minute for uptime and five minutes for a deeper synthetic flow, subject to cost and provider limits. Protect synthetic credentials and ensure the monitor cannot access ordinary tenants. Checkly supports browser-based checks; use its current guide when implementing the scripts. [Checkly browser checks](https://www.checklyhq.com/docs/browser-checks/)

## Verification and recovery

Trigger a deliberate synthetic error in staging, verify correct source-mapped release, confirm private fields are absent, test an uptime failure and resolve it. Check alerts reach the named operator and the runbook is usable. Verify prod/staging separation and usage caps. Keep one redacted incident exercise as evidence.

During an incident, correlate request, operation, job, provider and deployment IDs. Do not print the environment to diagnose a missing key. Record incident timeline, customer impact, remediation and follow-up requirements. Monitoring outage is itself visible through a separate health/heartbeat signal where feasible.
